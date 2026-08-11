import { memo, useEffect, useRef, useState } from "react";
import { Application, Container, Graphics, NineSliceSprite, Rectangle, Sprite } from "pixi.js";
import gsap from "gsap";
import { getBoardSize, type PairTile, type Point, type TileKind } from "../../utils/pairMatchLogic";
import { palette as c } from "./gameThemes";
import { loadPikachuCharacterTextures, type CharacterTextures } from "./pixi/loadPikachuCharacterTextures";
import { CHARACTER_BY_ID, TILE_ICON_FILL_RATIO } from "./pixi/pikachuCharacterCatalog";
import { perfDiagnostics } from "./pixi/pixiPerfDiagnostics";
import { createLightningBolt, type LightningBolt } from "./pixi/lightningPath";
import { createMatchSparks, type MatchSparks } from "./pixi/matchSparks";
import { createComboFlash, type ComboFlash } from "./pixi/comboFlash";
import { loadHyperPanelFrame, HYPER_PANEL_FRAME } from "./pixi/loadHyperUiTexture";
import { createScreenShake, type ScreenShake } from "./pixi/screenShake";

interface Props {
  tiles: PairTile[];
  selectedIds: string[];
  wrongIds: string[];
  hintIds: string[];
  activePath: Point[] | null;
  onSelect: (id: string) => void;
  level: number;
  /** Current combo count – used to scale spark/flash effects. */
  combo: number;
}

interface TileView {
  root: Container;
  card: Graphics;
  icon: Sprite;
  hitArea: Rectangle;
  tileId: string | null;
  kind: TileKind | null;
  lastTileSize: number;
  lastSelected: boolean;
  lastWrong: boolean;
  lastHint: boolean;
  lastVisible: boolean;
  isSpawned: boolean;
  targetX: number;
  targetY: number;
}

interface BoardState {
  tiles: PairTile[];
  selectedIds: string[];
  wrongIds: string[];
  hintIds: string[];
  activePath: Point[] | null;
  combo: number;
}

const toColor = (value: string) => Number.parseInt(value.slice(1), 16);
const MAX_TILE_VIEWS = 16 * 16;

/**
 * Pixi board renderer. React owns game state and HUD; Pixi owns the 256 tile
 * display objects (up to the 16x16 maximum) and pointer hit areas so tile
 * updates do not reconcile DOM.
 *
 * Effect systems (all pure Graphics + GSAP, zero PNG assets):
 *   • LightningBolt – zigzag bolt + travelling energy dot along the match path
 *   • MatchSparks   – spark burst at each matched tile position
 *   • ComboFlash    – fullscreen flash + ripple ring on combo ≥ 2
 */
export const GameBoard = memo(function GameBoard({
  tiles,
  selectedIds,
  wrongIds,
  hintIds,
  activePath,
  onSelect,
  level,
  combo,
}: Props) {
  perfDiagnostics.count("react.gameBoardRender");
  const { rows, cols } = getBoardSize(level);
  const hostRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  const layoutRef = useRef({ rows, cols });
  const stateRef = useRef<BoardState>({ tiles, selectedIds, wrongIds, hintIds, activePath, combo });
  const redrawRef = useRef<(() => void) | null>(null);
  const [assetStatus, setAssetStatus] = useState<"loading" | "ready" | "error">("loading");
  const [assetError, setAssetError] = useState<string | null>(null);

  onSelectRef.current = onSelect;
  layoutRef.current = { rows, cols };
  stateRef.current.tiles = tiles;
  stateRef.current.selectedIds = selectedIds;
  stateRef.current.wrongIds = wrongIds;
  stateRef.current.hintIds = hintIds;
  stateRef.current.activePath = activePath;
  stateRef.current.combo = combo;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let initialized = false;
    let appInitialized = false;
    let failed = false;
    let destroyed = false;
    let drawFrame = 0;
    const app = new Application();
    perfDiagnostics.count("pixi.applicationCreated");

    // ── layer stack ──────────────────────────────────────────────────────
    // sceneRoot      – board frame + game scene (the only shaken node)
    // tileLayer      – tile cards and icons
    // fxLayer        – sparks + combo flash (below bolt so it reads as "reaction")
    // lightningLayer – bolt on top of everything
    const sceneRoot      = new Container();
    const tileLayer      = new Container();
    const fxLayer        = new Container();
    const lightningLayer = new Container();
    fxLayer.eventMode        = "none";
    lightningLayer.eventMode = "none";

    let bolt:       LightningBolt | null = null;
    let sparks:     MatchSparks   | null = null;
    let comboFlash: ComboFlash    | null = null;
    let screenShake: ScreenShake  | null = null;
    let boardFrame: NineSliceSprite | null = null;
    let boardBg: Graphics | null = null;

    let tileAssets: CharacterTextures | null = null;

    // Reuse a fixed pool. Tile ids are regenerated on reset, so a Map keyed by
    // id would retain old display objects and grow forever during a session.
    const tileViews: TileView[] = [];

    // track previous path reference to detect new paths
    let lastPath: Point[] | null | undefined;
    let lastPathTileSize = -1;
    let lastPathOriginX  = -1;
    let lastPathOriginY  = -1;
    // track previous combo to detect increments
    let lastCombo = 0;
    let lastWrongKey = "";

    // ── board draw ───────────────────────────────────────────────────────
    const drawBoard = () => {
      if (disposed || !initialized) return;
      if (!tileAssets) return;

      const drawStartedAt = perfDiagnostics.start("pixi.board.draw");
      perfDiagnostics.count("pixi.boardSync");

      try {
        const screenWidth  = app.screen.width;
        const screenHeight = app.screen.height;
        const { rows: currentRows, cols: currentCols } = layoutRef.current;
        // The production frame is intentionally wider than it is tall. Keep
        // the playfield square by giving the frame independent side insets.
        const isMobile = screenWidth < 768;
        const frameInsetX = Math.max(8, screenWidth * (isMobile ? 0.02 : 0.075));
        const frameInsetY = Math.max(8, screenHeight * (isMobile ? 0.01 : 0.045));
        const tileSize   = Math.min(
          Math.max(1, (screenWidth - frameInsetX * 2) / currentCols),
          Math.max(1, (screenHeight - frameInsetY * 2) / currentRows),
        );
        const boardWidth  = tileSize * currentCols;
        const boardHeight = tileSize * currentRows;
        const originX     = (screenWidth  - boardWidth)  / 2;
        const originY     = (screenHeight - boardHeight) / 2;
        const state       = stateRef.current;

        if (boardFrame) {
          boardFrame.setSize(screenWidth + 27, screenHeight + 29);
          boardFrame.position.set(screenWidth / 2 + 1.5, screenHeight / 2);
          boardFrame.visible = !isMobile;
        }

        if (boardBg) {
          if (isMobile) {
            boardBg.clear();
            const actualBoardWidth = cols * tileSize;
            const actualBoardHeight = rows * tileSize;
            const actualOriginX = originX + (boardWidth - actualBoardWidth) / 2;
            const actualOriginY = originY + (boardHeight - actualBoardHeight) / 2;
            
            boardBg.roundRect(
              actualOriginX - 10,
              actualOriginY - 10,
              actualBoardWidth + 20,
              actualBoardHeight + 20,
              16
            );
            boardBg.fill({ color: 0xfff8e1, alpha: 0.65 });
            boardBg.stroke({ color: 0xf3a30c, width: 4 });
            boardBg.visible = true;
          } else {
            boardBg.visible = false;
          }
        }

        const wrongKey = state.wrongIds.join("|");
        if (wrongKey && wrongKey !== lastWrongKey) {
          screenShake?.shake(Math.min(7, Math.max(3, tileSize * 0.16)), 0.2);
        }
        lastWrongKey = wrongKey;

        if (state.tiles.length > MAX_TILE_VIEWS) {
          throw new Error(`Pikachu GameBoard received ${state.tiles.length} tiles; pool maximum is ${MAX_TILE_VIEWS}`);
        }

        // ── tile views ─────────────────────────────────────────────────
        const poolSize = Math.max(state.tiles.length, tileViews.length);
        for (let index = 0; index < poolSize; index += 1) {
          const tile = state.tiles[index];
          const view = tileViews[index];

          if (!tile) {
            if (view) {
              view.root.visible   = false;
              view.root.eventMode = "none";
              view.tileId         = null;
              view.kind           = null;
            }
            continue;
          }

          let currentView = view;
          if (!currentView) {
            const root    = new Container();
            const card    = new Graphics();
            const icon    = new Sprite();
            const hitArea = new Rectangle();
            const createdView: TileView = {
              root, card, icon, hitArea,
              tileId: tile.id, kind: null,
              lastTileSize: -1,
              lastSelected: false, lastWrong: false,
              lastHint: false,    lastVisible: false,
              isSpawned: false,
              targetX: -1, targetY: -1,
            };
            icon.anchor.set(0.5);
            icon.eventMode = "none";
            root.addChild(card, icon);
            root.eventMode = "static";
            root.cursor    = "pointer";
            root.on("pointertap", () => {
              if (createdView.tileId) onSelectRef.current(createdView.tileId);
            });
            tileLayer.addChild(root);
            perfDiagnostics.count("pixi.tileViewsCreated");
            perfDiagnostics.count("pixi.pointerListenersAdded");
            tileViews[index] = createdView;
            currentView = createdView;
          }

          const isSelected = state.selectedIds.includes(tile.id);
          const isWrong    = state.wrongIds.includes(tile.id);
          const isHint     = state.hintIds.includes(tile.id);
          const visible    = !tile.removed;
          const gap = Math.max(2, Math.min(4, tileSize * 0.05));
          const cardSize   = tileSize - gap * 2;
          const half       = tileSize / 2;
          const cardX      = -half + gap;
          const cardY      = -half + gap;
          const layoutChanged = currentView.lastTileSize !== tileSize;

          if (currentView.tileId !== tile.id) {
            currentView.isSpawned = false;
          }
          currentView.tileId = tile.id;

          // ── tile removal animation (match pop) ───────────────────────
          if (!visible && currentView.lastVisible) {
            const tileWorldX = originX + (tile.col + 0.5) * tileSize;
            const tileWorldY = originY + (tile.row + 0.5) * tileSize;

            // Spark burst at this tile's world position
            sparks?.burst(tileWorldX, tileWorldY, tileSize, state.combo);

            // Tile pop: punch-up then shrink
            gsap.timeline({
              onComplete: () => {
                currentView.root.visible = false;
                currentView.root.alpha   = 1;
                currentView.root.scale.set(1);
              },
            })
              .to(currentView.root.scale, {
                x: 1.38, y: 1.38,
                duration: 0.08,
                ease: "power3.out",
              })
              .to(currentView.root, { alpha: 0.95, duration: 0.08 }, "<")
              .to(currentView.root.scale, {
                x: 0, y: 0,
                duration: 0.20,
                ease: "back.in(2.8)",
              }, "+=0.03")
              .to(currentView.root, { alpha: 0, duration: 0.20, ease: "power2.in" }, "<");

          } else if (visible) {
            currentView.root.visible = true;
          } else {
            currentView.root.visible = false;
          }

          // ── position ─────────────────────────────────────────────────
          const targetX = originX + (tile.col + 0.5) * tileSize;
          const targetY = originY + (tile.row + 0.5) * tileSize;

          if (layoutChanged && currentView.isSpawned) {
            gsap.killTweensOf(currentView.root.position);
            currentView.root.position.set(targetX, targetY);
            currentView.targetX = targetX;
            currentView.targetY = targetY;
          } else if (!currentView.isSpawned) {
            currentView.isSpawned = true;
            currentView.targetX   = targetX;
            currentView.targetY   = targetY;
            gsap.killTweensOf(currentView.root);
            gsap.killTweensOf(currentView.root.scale);
            gsap.killTweensOf(currentView.root.position);
            currentView.root.alpha = 1;
            currentView.root.position.set(targetX, targetY);
            currentView.root.scale.set(isSelected ? 1.05 : 1);
          } else if (currentView.targetX !== targetX || currentView.targetY !== targetY) {
            currentView.targetX = targetX;
            currentView.targetY = targetY;
            const staggerDelay = (currentRows - tile.row) * 0.05 + tile.col * 0.02;
            gsap.killTweensOf(currentView.root.position);
            gsap.to(currentView.root.position, {
              x: targetX, y: targetY,
              duration: 0.45,
              delay: staggerDelay,
              ease: "power2.in",
              onComplete: () => {
                gsap.timeline()
                  .to(currentView.root.scale, { x: 1.15, y: 0.82, duration: 0.08, ease: "power1.out" })
                  .to(currentView.root.scale, { x: 0.90, y: 1.08, duration: 0.08, ease: "power1.inOut" })
                  .to(currentView.root.scale, { x: 1.00, y: 1.00, duration: 0.10, ease: "sine.out" });
              },
            });
          }

          perfDiagnostics.count("pixi.positionUpdates");

          // ── wrong shake ───────────────────────────────────────────────
          if (isWrong && !currentView.lastWrong) {
            gsap.fromTo(currentView.root,
              { rotation: -0.10 },
              { rotation: 0.10, duration: 0.05, yoyo: true, repeat: 5,
                onComplete: () => { currentView.root.rotation = 0; } });
          } else if (!isWrong) {
            currentView.root.rotation = 0;
          }
          currentView.root.eventMode = visible ? "static" : "none";

          // ── card redraw ───────────────────────────────────────────────
          if (
            layoutChanged ||
            currentView.lastSelected !== isSelected ||
            currentView.lastWrong    !== isWrong    ||
            currentView.lastHint     !== isHint     ||
            currentView.lastVisible  !== visible
          ) {
            if (currentView.lastSelected !== isSelected) {
              gsap.killTweensOf(currentView.root.scale);
              gsap.to(currentView.root.scale, {
                x: isSelected ? 1.05 : 1,
                y: isSelected ? 1.05 : 1,
                duration: 0.15, ease: "power2.out",
              });
            }
            currentView.card.clear();
            perfDiagnostics.count("pixi.graphicsRedraws");

            const radius  = Math.max(4, tileSize * 0.13);
            const borderW = isSelected || isWrong || isHint
              ? Math.max(2.5, tileSize * 0.055)
              : Math.max(1.25, tileSize * 0.022);

            // ── selected glow ring (drawn first, behind fill) ─────────────
            if (isSelected) {
              currentView.card.roundRect(
                cardX - 3, cardY - 3,
                cardSize + 6, cardSize + 6,
                radius + 3,
              );
              currentView.card.fill({ color: toColor(c.orangeCta), alpha: 0.22 });
            }

            // ── main card fill (warm cream) ───────────────
            currentView.card.roundRect(cardX, cardY, cardSize, cardSize, radius);
            currentView.card.fill({ color: 0xfff9ec, alpha: 1 });

            // ── inner shadow strip (top highlight) ────────
            currentView.card.roundRect(cardX + 2, cardY + 2, cardSize - 4, Math.min(cardSize * 0.28, 14), radius - 1);
            currentView.card.fill({ color: 0xffffff, alpha: 0.30 });

            // ── border stroke ─────────────────────────────────────────────
            currentView.card.roundRect(cardX, cardY, cardSize, cardSize, radius);
            currentView.card.stroke({
              color: isSelected
                ? toColor(c.orangeCta)
                : isWrong
                  ? toColor(c.alertRed)
                  : isHint
                    ? toColor(c.bambooGreen)
                    : 0xbd8030,
              alpha: isSelected ? 1 : isWrong || isHint ? 0.95 : 0.42,
              width: borderW,
            });
            currentView.hitArea.set(-half, -half, tileSize, tileSize);
            currentView.root.hitArea  = currentView.hitArea;
            currentView.lastTileSize  = tileSize;
            currentView.lastSelected  = isSelected;
            currentView.lastWrong     = isWrong;
            currentView.lastHint      = isHint;
            currentView.lastVisible   = visible;
          }

          // ── icon texture ──────────────────────────────────────────────
          const kindChanged = currentView.kind !== tile.kind;
          if (kindChanged) {
            const texture = tileAssets.get(tile.kind);
            if (!texture) {
              throw new Error(`No loaded Pikachu texture mapped for tile kind: ${tile.kind}`);
            }
            currentView.icon.texture = texture;
            perfDiagnostics.count("pixi.textureAssignments");
            currentView.kind = tile.kind;
          }
          if (kindChanged || layoutChanged) {
            const desiredSize = tileSize * TILE_ICON_FILL_RATIO;
            const maxDim      = Math.max(currentView.icon.texture.orig.width, currentView.icon.texture.orig.height);
            const baseScale   = desiredSize / maxDim;

            const visualScale = CHARACTER_BY_ID.get(tile.kind)?.iconScale ?? 1;
            const iconScaleX  = CHARACTER_BY_ID.get(tile.kind)?.iconScaleX ?? 1;
            const iconOffsetY = CHARACTER_BY_ID.get(tile.kind)?.iconOffsetY ?? 0;

            currentView.icon.anchor.set(0.5, 0.5);
            currentView.icon.position.set(0, tileSize * iconOffsetY);
            currentView.icon.scale.set(baseScale * visualScale * iconScaleX, baseScale * visualScale);
          }
        } // end tile pool loop

        // ── lightning bolt ─────────────────────────────────────────────
        if (
          lastPath !== state.activePath ||
          lastPathTileSize !== tileSize  ||
          lastPathOriginX  !== originX   ||
          lastPathOriginY  !== originY
        ) {
          if (state.activePath && state.activePath.length > 1 && lastPath !== state.activePath) {
            bolt?.play(state.activePath, originX, originY, tileSize);
          } else if (!state.activePath) {
            bolt?.hide();
          }
          lastPath         = state.activePath;
          lastPathTileSize = tileSize;
          lastPathOriginX  = originX;
          lastPathOriginY  = originY;
        }

        // ── combo flash ────────────────────────────────────────────────
        if (state.combo > lastCombo && state.combo >= 2 && state.activePath && state.activePath.length >= 2) {
          // find midpoint of the path in world coords
          const midIdx = Math.floor(state.activePath.length / 2);
          const mp     = state.activePath[midIdx];
          const midX   = originX + (mp.c + 0.5) * tileSize;
          const midY   = originY + (mp.r + 0.5) * tileSize;
          comboFlash?.fire(midX, midY, state.combo);
          if (state.combo >= 3) {
            screenShake?.shake(Math.min(5, Math.max(2, tileSize * 0.1)), 0.18);
          }
        }
        lastCombo = state.combo;

        app.render();
      } finally {
        perfDiagnostics.end("pixi.board.draw", drawStartedAt);
      }
    };

    // ── scheduler ────────────────────────────────────────────────────────
    const scheduleDraw = () => {
      if (disposed || drawFrame !== 0) return;
      perfDiagnostics.count("pixi.resizeOrStateRedrawRequests");
      drawFrame = requestAnimationFrame(() => {
        drawFrame = 0;
        drawBoard();
      });
    };
    const resizeObserver = new ResizeObserver(() => {
      comboFlash?.resize(app.screen);
      scheduleDraw();
    });
    redrawRef.current = scheduleDraw;

    const renderApp = () => { if (appInitialized && !destroyed) app.render(); };
    gsap.ticker.add(renderApp);

    // ── destroy ───────────────────────────────────────────────────────────
    const destroyApp = () => {
      if (appInitialized && !destroyed) {
        destroyed = true;
        gsap.ticker.remove(renderApp);
        bolt?.destroy();       bolt       = null;
        sparks?.destroy();     sparks     = null;
        comboFlash?.destroy(); comboFlash = null;
        screenShake?.destroy(); screenShake = null;
        boardFrame = null;
        for (const view of tileViews) {
          gsap.killTweensOf(view.root);
          gsap.killTweensOf(view.root.position);
          gsap.killTweensOf(view.root.scale);
        }
        perfDiagnostics.count("pixi.applicationDestroyed");
        // Character atlases and the panel texture are shared Assets-cache entries.
        app.destroy({ removeView: true, releaseGlobalResources: false }, { children: true });
      }
    };

    // ── init ──────────────────────────────────────────────────────────────
    const initPromise = app.init({
      resizeTo:    host,
      backgroundAlpha: 0,
      antialias:   false,
      autoDensity: true,
      resolution:  Math.min(window.devicePixelRatio || 1, 1.5),
      preference:  "webgl",
      autoStart:   false,
      gcActive:    true,
      gcMaxUnusedTime: 120_000,
      gcFrequency:     60_000,
    }).then(() => {
      appInitialized = true;
      if (disposed || failed) destroyApp();
    });

    void Promise.all([initPromise, loadPikachuCharacterTextures(), loadHyperPanelFrame()])
      .then(([, assets, panelTexture]) => {
        if (disposed) { destroyApp(); return; }

        tileAssets  = assets;
        initialized = true;
        setAssetStatus("ready");
        host.appendChild(app.canvas);
        app.canvas.setAttribute("aria-label", "Bàn chơi Ghép Đôi Bộ Lạc");
        app.canvas.style.display = "block";
        app.canvas.style.width   = "100%";
        app.canvas.style.height  = "100%";

        boardFrame = new NineSliceSprite({
          texture: panelTexture,
          leftWidth: HYPER_PANEL_FRAME.leftWidth,
          topHeight: HYPER_PANEL_FRAME.topHeight,
          rightWidth: HYPER_PANEL_FRAME.rightWidth,
          bottomHeight: HYPER_PANEL_FRAME.bottomHeight,
          width: 562,
          height: 535,
          anchor: 0.5,
        });
        boardFrame.eventMode = "none";

        boardBg = new Graphics();
        boardBg.eventMode = "none";

        // layer order: frame → tiles → fx → lightning
        sceneRoot.addChild(boardBg, boardFrame, tileLayer, fxLayer, lightningLayer);
        app.stage.addChild(sceneRoot);

        // instantiate effect systems now that stage exists
        bolt       = createLightningBolt(lightningLayer);
        sparks     = createMatchSparks(fxLayer);
        comboFlash = createComboFlash(fxLayer, app.screen);
        screenShake = createScreenShake(sceneRoot);

        resizeObserver.observe(host);
        scheduleDraw();
      })
      .catch((error: unknown) => {
        if (disposed) return;
        failed = true;
        const message = error instanceof Error ? error.message : String(error);
        setAssetStatus("error");
        setAssetError(message);
        console.error(`[Pikachu GameBoard] ${message}`);
        destroyApp();
      });

    return () => {
      disposed = true;
      redrawRef.current = null;
      resizeObserver.disconnect();
      if (drawFrame !== 0) cancelAnimationFrame(drawFrame);
      gsap.ticker.remove(renderApp);
      destroyApp();
    };
  }, []);

  useEffect(() => {
    redrawRef.current?.();
  }, [tiles, selectedIds, wrongIds, hintIds, activePath, combo, rows, cols]);

  return (
    <div
      ref={hostRef}
      role="group"
      aria-label="Bàn chơi Ghép Đôi Bộ Lạc"
      aria-busy={assetStatus === "loading"}
      className="relative h-full w-full overflow-hidden"
    >
      {assetStatus !== "ready" && (
        <div
          className="absolute inset-0 grid place-items-center p-4 text-center text-sm font-bold text-[#6f4f20]"
          role={assetStatus === "error" ? "alert" : "status"}
        >
          {assetStatus === "error"
            ? `Không thể tải asset bàn chơi: ${assetError}`
            : "Đang tải nhân vật bàn chơi…"}
        </div>
      )}
    </div>
  );
});

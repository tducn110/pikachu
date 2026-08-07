import { memo, useEffect, useRef, useState } from "react";
import { Application, Container, Graphics, Rectangle, Sprite } from "pixi.js";
import gsap from "gsap";
import { GlowFilter } from "pixi-filters";
import { getBoardSize, type PairTile, type Point, type TileKind } from "../../utils/pairMatchLogic";
import { palette as c } from "./gameThemes";
import { loadPikachuCharacterTextures, type CharacterTextures } from "./pixi/loadPikachuCharacterTextures";
import { CHARACTER_BY_ID, TILE_ICON_FILL_RATIO } from "./pixi/pikachuCharacterCatalog";
import { perfDiagnostics } from "./pixi/pixiPerfDiagnostics";

interface Props {
  tiles: PairTile[];
  selectedIds: string[];
  wrongIds: string[];
  hintIds: string[];
  activePath: Point[] | null;
  onSelect: (id: string) => void;
  level: number;
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
}

const toColor = (value: string) => Number.parseInt(value.slice(1), 16);
const MAX_TILE_VIEWS = 16 * 16;

/**
 * Pixi board renderer. React owns game state and HUD; Pixi owns the 256 tile
 * display objects (up to the 16x16 maximum) and pointer hit areas so tile
 * updates do not reconcile DOM.
 */
export const GameBoard = memo(function GameBoard({
  tiles,
  selectedIds,
  wrongIds,
  hintIds,
  activePath,
  onSelect,
  level,
}: Props) {
  perfDiagnostics.count("react.gameBoardRender");
  const { rows, cols } = getBoardSize(level);
  const hostRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  const layoutRef = useRef({ rows, cols });
  const stateRef = useRef<BoardState>({ tiles, selectedIds, wrongIds, hintIds, activePath });
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
    const tileLayer = new Container();
    const pathLayer = new Graphics();
    pathLayer.eventMode = "none";
    pathLayer.filters = [new GlowFilter({ distance: 12, outerStrength: 2, color: 0xffffff })];
    let tileAssets: CharacterTextures | null = null;
    // Reuse a fixed pool. Tile ids are regenerated on reset, so a Map keyed by
    // id would retain old display objects and grow forever during a session.
    const tileViews: TileView[] = [];
    let lastPath: Point[] | null | undefined;
    let lastPathTileSize = -1;
    let lastPathOriginX = -1;
    let lastPathOriginY = -1;

    const drawBoard = () => {
      if (disposed || !initialized) return;

      if (!tileAssets) return;

      const drawStartedAt = perfDiagnostics.start("pixi.board.draw");
      perfDiagnostics.count("pixi.boardSync");

      try {
        const screenWidth = app.screen.width;
        const screenHeight = app.screen.height;
        const { rows: currentRows, cols: currentCols } = layoutRef.current;
        const tileSize = Math.min(screenWidth / currentCols, screenHeight / currentRows);
        const boardWidth = tileSize * currentCols;
        const boardHeight = tileSize * currentRows;
        const originX = (screenWidth - boardWidth) / 2;
        const originY = (screenHeight - boardHeight) / 2;
        const state = stateRef.current;

        if (state.tiles.length > MAX_TILE_VIEWS) {
          throw new Error(`Pikachu GameBoard received ${state.tiles.length} tiles; pool maximum is ${MAX_TILE_VIEWS}`);
        }

        const poolSize = Math.max(state.tiles.length, tileViews.length);
        for (let index = 0; index < poolSize; index += 1) {
        const tile = state.tiles[index];
        const view = tileViews[index];
        if (!tile) {
          if (view) {
            view.root.visible = false;
            view.root.eventMode = "none";
            view.tileId = null;
            view.kind = null;
          }
          continue;
        }

        let currentView = view;
        if (!currentView) {
          const root = new Container();
          const card = new Graphics();
          const icon = new Sprite();
          const hitArea = new Rectangle();
          const createdView: TileView = {
            root,
            card,
            icon,
            hitArea,
            tileId: tile.id,
            kind: null,
            lastTileSize: -1,
            lastSelected: false,
            lastWrong: false,
            lastHint: false,
            lastVisible: false,
            isSpawned: false,
            targetX: -1,
            targetY: -1,
          };
          icon.anchor.set(0.5);
          icon.eventMode = "none";
          root.addChild(card, icon);
          root.eventMode = "static";
          root.cursor = "pointer";
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
        const isWrong = state.wrongIds.includes(tile.id);
        const isHint = state.hintIds.includes(tile.id);
        const visible = !tile.removed;
        const gap = Math.max(1, Math.min(3, tileSize * 0.055));
        const cardSize = tileSize - gap * 2;
        const half = tileSize / 2;
        const cardX = -half + gap;
        const cardY = -half + gap;
        const layoutChanged = currentView.lastTileSize !== tileSize;

        if (currentView.tileId !== tile.id) {
          currentView.isSpawned = false;
        }
        currentView.tileId = tile.id;

        if (!visible && currentView.lastVisible) {
          gsap.timeline({
            onComplete: () => {
              currentView.root.visible = false;
              currentView.root.alpha = 1;
            }
          })
          .to(currentView.root.scale, { x: 1.25, y: 1.25, duration: 0.1, ease: "power2.out" })
          .to(currentView.root.scale, { x: 0, y: 0, duration: 0.2, ease: "back.in(2)" }, "+=0.05")
          .to(currentView.root, { alpha: 0, duration: 0.2 }, "-=0.2");
        } else if (visible) {
          currentView.root.visible = true;
        } else {
          currentView.root.visible = false;
        }

        const targetX = originX + (tile.col + 0.5) * tileSize;
        const targetY = originY + (tile.row + 0.5) * tileSize;

        if (layoutChanged && currentView.isSpawned) {
          gsap.killTweensOf(currentView.root.position);
          currentView.root.position.set(targetX, targetY);
          currentView.targetX = targetX;
          currentView.targetY = targetY;
        } else if (!currentView.isSpawned) {
          currentView.isSpawned = true;
          currentView.targetX = targetX;
          currentView.targetY = targetY;
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
            x: targetX,
            y: targetY,
            duration: 0.45,
            delay: staggerDelay,
            ease: "power2.in",
            onComplete: () => {
              gsap.timeline()
                .to(currentView.root.scale, { x: 1.15, y: 0.82, duration: 0.08, ease: "power1.out" })
                .to(currentView.root.scale, { x: 0.90, y: 1.08, duration: 0.08, ease: "power1.inOut" })
                .to(currentView.root.scale, { x: 1.00, y: 1.00, duration: 0.10, ease: "sine.out" });
            }
          });
        }

        perfDiagnostics.count("pixi.positionUpdates");

        if (isWrong && !currentView.lastWrong) {
          gsap.fromTo(currentView.root, { rotation: -0.1 }, { rotation: 0.1, duration: 0.05, yoyo: true, repeat: 5, onComplete: () => currentView.root.rotation = 0 });
        } else if (!isWrong) {
          currentView.root.rotation = 0;
        }
        currentView.root.eventMode = visible ? "static" : "none";

        if (
          layoutChanged ||
          currentView.lastSelected !== isSelected ||
          currentView.lastWrong !== isWrong ||
          currentView.lastHint !== isHint ||
          currentView.lastVisible !== visible
        ) {
          if (currentView.lastSelected !== isSelected) {
            gsap.killTweensOf(currentView.root.scale);
            if (isSelected) {
              gsap.to(currentView.root.scale, { x: 1.08, y: 1.08, duration: 0.15, ease: "power2.out" });
            } else {
              gsap.to(currentView.root.scale, { x: 1, y: 1, duration: 0.15, ease: "power2.out" });
            }
          }
          currentView.card.clear();
          perfDiagnostics.count("pixi.graphicsRedraws");
          currentView.card.roundRect(cardX, cardY, cardSize, cardSize, Math.max(3, tileSize * 0.12));
          currentView.card.fill(toColor(c.creamCard));
          currentView.card.stroke({
            color: isSelected
              ? toColor(c.orangeCta)
              : isWrong
                ? toColor(c.alertRed)
                : isHint
                  ? toColor(c.bambooGreen)
                  : 0x77aed7,
            alpha: isSelected || isWrong || isHint ? 0.95 : 0.48,
            width: isSelected || isWrong || isHint ? Math.max(2, tileSize * 0.08) : 1,
          });
          currentView.hitArea.set(-half, -half, tileSize, tileSize);
          currentView.root.hitArea = currentView.hitArea;
          currentView.lastTileSize = tileSize;
          currentView.lastSelected = isSelected;
          currentView.lastWrong = isWrong;
          currentView.lastHint = isHint;
          currentView.lastVisible = visible;
        }

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
          const maxDim = Math.max(currentView.icon.texture.orig.width, currentView.icon.texture.orig.height);
          const baseScale = desiredSize / maxDim;
          const iconScaleX = CHARACTER_BY_ID.get(tile.kind)?.iconScaleX ?? 1;
          currentView.icon.anchor.set(0.5, 0.5);
          currentView.icon.position.set(0, 0);
          currentView.icon.scale.set(baseScale * iconScaleX, baseScale);
        }
      }

        if (
          lastPath !== state.activePath ||
          lastPathTileSize !== tileSize ||
          lastPathOriginX !== originX ||
          lastPathOriginY !== originY
        ) {
          gsap.killTweensOf(pathLayer);
          drawPath(pathLayer, state.activePath, originX, originY, tileSize);
          if (state.activePath && state.activePath.length > 1 && lastPath !== state.activePath) {
            pathLayer.alpha = 0;
            gsap.to(pathLayer, { alpha: 1, duration: 0.1, yoyo: true, repeat: 3, ease: "power1.inOut" });
          } else if (!state.activePath) {
            pathLayer.alpha = 1;
          }
          lastPath = state.activePath;
          lastPathTileSize = tileSize;
          lastPathOriginX = originX;
          lastPathOriginY = originY;
        }

        app.render();
      } finally {
        perfDiagnostics.end("pixi.board.draw", drawStartedAt);
      }
    };

    const scheduleDraw = () => {
      if (disposed || drawFrame !== 0) return;
      perfDiagnostics.count("pixi.resizeOrStateRedrawRequests");
      drawFrame = requestAnimationFrame(() => {
        drawFrame = 0;
        drawBoard();
      });
    };
    const resizeObserver = new ResizeObserver(scheduleDraw);
    redrawRef.current = scheduleDraw;

    const renderApp = () => {
      if (appInitialized && !destroyed) app.render();
    };
    gsap.ticker.add(renderApp);

    const destroyApp = () => {
      if (appInitialized && !destroyed) {
        destroyed = true;
        gsap.ticker.remove(renderApp);
        gsap.killTweensOf(pathLayer);
        for (const view of tileViews) {
          gsap.killTweensOf(view.root);
          gsap.killTweensOf(view.root.position);
          gsap.killTweensOf(view.root.scale);
        }
        perfDiagnostics.count("pixi.applicationDestroyed");
        app.destroy({ removeView: true, releaseGlobalResources: true }, { children: true });
      }
    };

    const initPromise = app.init({
      resizeTo: host,
      backgroundAlpha: 0,
      antialias: false,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 1.5),
      preference: "webgl",
      autoStart: false,
      gcActive: true,
      gcMaxUnusedTime: 120_000,
      gcFrequency: 60_000,
    }).then(() => {
      appInitialized = true;
      if (disposed || failed) destroyApp();
    });

    void Promise.all([initPromise, loadPikachuCharacterTextures()])
      .then(([, assets]) => {
        if (disposed) {
          destroyApp();
          return;
        }

        tileAssets = assets;
        initialized = true;
        setAssetStatus("ready");
        host.appendChild(app.canvas);
        app.canvas.setAttribute("aria-label", "Bàn chơi Ghép Đôi Bộ Lạc");
        app.canvas.style.display = "block";
        app.canvas.style.width = "100%";
        app.canvas.style.height = "100%";
        app.stage.addChild(tileLayer, pathLayer);
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
  }, [tiles, selectedIds, wrongIds, hintIds, activePath, rows, cols]);

  return (
    <div
      ref={hostRef}
      role="group"
      aria-label="Bàn chơi Ghép Đôi Bộ Lạc"
      aria-busy={assetStatus === "loading"}
      className="relative h-full w-full overflow-hidden"
      style={{ aspectRatio: `${cols}/${rows}` }}
    >
      {assetStatus !== "ready" && (
        <div className="absolute inset-0 grid place-items-center p-4 text-center text-sm font-bold text-[#6f4f20]" role={assetStatus === "error" ? "alert" : "status"}>
          {assetStatus === "error" ? `Không thể tải asset bàn chơi: ${assetError}` : "Đang tải nhân vật bàn chơi…"}
        </div>
      )}
    </div>
  );
});

function drawPath(
  graphics: Graphics,
  path: Point[] | null,
  originX: number,
  originY: number,
  tileSize: number,
) {
  graphics.clear();
  graphics.visible = Boolean(path && path.length > 1);
  if (!path || path.length < 2) return;

  const first = path[0];
  const firstX = originX + (first.c + 0.5) * tileSize;
  const firstY = originY + (first.r + 0.5) * tileSize;
  graphics.moveTo(firstX, firstY);
  for (let index = 1; index < path.length; index += 1) {
    const item = path[index];
    graphics.lineTo(originX + (item.c + 0.5) * tileSize, originY + (item.r + 0.5) * tileSize);
  }
  graphics.stroke({ color: toColor(c.orangeCta), width: Math.max(3, tileSize * 0.18), alpha: 0.9 });
  for (const item of path) {
    const centerX = originX + (item.c + 0.5) * tileSize;
    const centerY = originY + (item.r + 0.5) * tileSize;
    graphics.circle(centerX, centerY, Math.max(2, tileSize * 0.14));
    graphics.fill(toColor(c.creamCard));
    graphics.stroke({ color: toColor(c.orangeCta), width: Math.max(1.5, tileSize * 0.08) });
  }
}

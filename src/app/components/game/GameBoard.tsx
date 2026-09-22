import { useTranslation } from "react-i18next";
import { memo, useEffect, useRef, useState } from "react";
import { Application, Container, Graphics, NineSliceSprite, Rectangle, Sprite } from "pixi.js";
import gsap from "gsap";
import { getBoardDimensions, getBoardSize, type PairTile, type Point, type TileKind } from "../../utils/pairMatchLogic";
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
  isPaused: boolean;
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
  removalAnimation: gsap.core.Timeline | null;
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
  isPaused,
}: Props) {
  const { t, i18n } = useTranslation();
  perfDiagnostics.count("react.gameBoardRender");
  // Gameplay tiles own grid dimensions. Canvas owns only pixel layout.
  const { rows, cols } = getBoardDimensions(tiles, level);
  const hostRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  const layoutRef = useRef({ rows, cols });
  const stateRef = useRef<BoardState>({ tiles, selectedIds, wrongIds, hintIds, activePath, combo });
  const redrawRef = useRef<(() => void) | null>(null);
  const pauseAnimationsRef = useRef<((paused: boolean) => void) | null>(null);
  const reducedMotionRef = useRef<((reduced: boolean) => void) | null>(null);
  const isPausedRef = useRef(isPaused);
  const [reducedMotion, setReducedMotion] = useState(false);
  const prefersReducedMotionRef = useRef(reducedMotion);
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
  isPausedRef.current = isPaused;
  prefersReducedMotionRef.current = reducedMotion;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    hostRef.current
      ?.querySelector("canvas")
      ?.setAttribute("aria-label", t("pikachu_board", "Pikachu Match Board"));
  }, [i18n.resolvedLanguage, t]);

  useEffect(() => {
    pauseAnimationsRef.current?.(isPaused);
    redrawRef.current?.();
  }, [isPaused]);

  useEffect(() => {
    reducedMotionRef.current?.(reducedMotion);
    redrawRef.current?.();
  }, [reducedMotion]);

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
    const tileAnimations = new Set<gsap.core.Animation>();

    const trackAnimation = <T extends gsap.core.Animation>(animation: T): T => {
      tileAnimations.add(animation);
      if (isPausedRef.current) animation.pause();
      return animation;
    };

    const forgetAnimation = (animation: gsap.core.Animation): void => {
      tileAnimations.delete(animation);
    };

    const setAnimationsPaused = (paused: boolean): void => {
      for (const animation of tileAnimations) animation.paused(paused);
      bolt?.setPaused(paused);
      sparks?.setPaused(paused);
      comboFlash?.setPaused(paused);
      screenShake?.setPaused(paused);
    };

    const setAnimationsReducedMotion = (reduced: boolean): void => {
      bolt?.setReducedMotion(reduced);
      sparks?.setReducedMotion(reduced);
      comboFlash?.setReducedMotion(reduced);
      screenShake?.setReducedMotion(reduced);
      if (!reduced) return;

      for (const animation of tileAnimations) animation.kill();
      tileAnimations.clear();
      for (const view of tileViews) {
        view.removalAnimation = null;
        view.root.alpha = 1;
        view.root.rotation = 0;
        view.root.scale.set(view.lastSelected ? 1.05 : 1);
        view.root.position.set(view.targetX, view.targetY);
        view.root.visible = view.lastVisible;
      }
    };

    pauseAnimationsRef.current = setAnimationsPaused;
    reducedMotionRef.current = setAnimationsReducedMotion;

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
        const isMobile = screenWidth < 1024;
        const frameInsetX = isMobile ? Math.max(2, screenWidth * 0.005) : Math.max(8, screenWidth * 0.075);
        const frameInsetY = isMobile ? Math.max(2, screenHeight * 0.005) : Math.max(8, screenHeight * 0.045);
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
          const framePaddingX = Math.max(18, tileSize * (isMobile ? 0.24 : 0.6));
          const framePaddingY = Math.max(18, tileSize * (isMobile ? 0.24 : 0.5));
          boardFrame.setSize(boardWidth + framePaddingX * 2, boardHeight + framePaddingY * 2);
          boardFrame.position.set(originX + boardWidth / 2, originY + boardHeight / 2);
          boardFrame.visible = false;
        }

        if (boardBg) {
          boardBg.visible = false;
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
              removalAnimation: null,
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
            currentView.removalAnimation?.kill();
            currentView.removalAnimation = null;
            currentView.isSpawned = false;
            currentView.root.visible = true;
            currentView.root.alpha = 1;
            currentView.root.rotation = 0;
            currentView.root.scale.set(1);
          }
          currentView.tileId = tile.id;

          // ── tile removal animation (match pop) ───────────────────────
          if (!visible && currentView.lastVisible) {
            const tileWorldX = originX + (tile.col + 0.5) * tileSize;
            const tileWorldY = originY + (tile.row + 0.5) * tileSize;

            if (prefersReducedMotionRef.current) {
              currentView.root.visible = false;
              currentView.root.alpha = 1;
              currentView.root.scale.set(1);
            } else {
              sparks?.burst(tileWorldX, tileWorldY, tileSize, state.combo);
              currentView.root.visible = true;
              currentView.root.alpha = 1;
              gsap.killTweensOf(currentView.root);
              gsap.killTweensOf(currentView.root.scale);
              let removalAnimation: gsap.core.Timeline;
              removalAnimation = trackAnimation(gsap.timeline({
                onComplete: () => {
                  currentView.root.visible = false;
                  currentView.root.alpha = 1;
                  currentView.root.scale.set(1);
                  currentView.removalAnimation = null;
                  forgetAnimation(removalAnimation);
                },
              }));
              currentView.removalAnimation = removalAnimation;
              removalAnimation
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
            }

          } else if (visible) {
            currentView.removalAnimation?.kill();
            currentView.removalAnimation = null;
            currentView.root.visible = true;
          } else if (!currentView.removalAnimation) {
            currentView.root.visible = false;
          }

          if (!visible && currentView.removalAnimation) {
            currentView.root.eventMode = "none";
            currentView.lastSelected = isSelected;
            currentView.lastWrong = isWrong;
            currentView.lastHint = isHint;
            currentView.lastVisible = false;
            continue;
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
            let positionTween: gsap.core.Tween;
            positionTween = trackAnimation(gsap.to(currentView.root.position, {
              x: targetX, y: targetY,
              duration: prefersReducedMotionRef.current ? 0.01 : 0.45,
              delay: prefersReducedMotionRef.current ? 0 : staggerDelay,
              ease: "power2.in",
              onComplete: () => {
                forgetAnimation(positionTween);
                if (prefersReducedMotionRef.current) return;
                let landingTimeline: gsap.core.Timeline;
                landingTimeline = trackAnimation(gsap.timeline({
                  onComplete: () => forgetAnimation(landingTimeline),
                }));
                landingTimeline
                  .to(currentView.root.scale, { x: 1.15, y: 0.82, duration: 0.08, ease: "power1.out" })
                  .to(currentView.root.scale, { x: 0.90, y: 1.08, duration: 0.08, ease: "power1.inOut" })
                  .to(currentView.root.scale, { x: 1.00, y: 1.00, duration: 0.10, ease: "sine.out" });
              },
            }));
          }

          perfDiagnostics.count("pixi.positionUpdates");

          // ── wrong shake ───────────────────────────────────────────────
          if (isWrong && !currentView.lastWrong) {
            if (!prefersReducedMotionRef.current) {
              let wrongTween: gsap.core.Tween;
              wrongTween = trackAnimation(gsap.fromTo(currentView.root,
                { rotation: -0.10 },
                { rotation: 0.10, duration: 0.05, yoyo: true, repeat: 5,
                  onComplete: () => {
                    currentView.root.rotation = 0;
                    forgetAnimation(wrongTween);
                  } }));
            }
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
              let selectionTween: gsap.core.Tween;
              selectionTween = trackAnimation(gsap.to(currentView.root.scale, {
                x: isSelected ? 1.05 : 1,
                y: isSelected ? 1.05 : 1,
                duration: prefersReducedMotionRef.current ? 0.01 : 0.15,
                ease: "power2.out",
                onComplete: () => forgetAnimation(selectionTween),
              }));
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
        if (!prefersReducedMotionRef.current && state.combo > lastCombo && state.combo >= 2 && state.activePath && state.activePath.length >= 2) {
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
      if (appInitialized && !destroyed && host) {
        app.renderer?.resize(host.clientWidth, host.clientHeight);
      }
      comboFlash?.resize(app.screen);
      scheduleDraw();
    });
    redrawRef.current = scheduleDraw;

    const renderApp = () => {
      if (appInitialized && !destroyed && !isPausedRef.current) app.render();
    };
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
          view.removalAnimation?.kill();
          gsap.killTweensOf(view.root);
          gsap.killTweensOf(view.root.position);
          gsap.killTweensOf(view.root.scale);
        }
        tileAnimations.clear();
        perfDiagnostics.count("pixi.applicationDestroyed");
        app.destroy({ removeView: true, releaseGlobalResources: true }, { children: true });
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
        app.canvas.setAttribute("aria-label", t("pikachu_board", "Bàn chơi Ghép đôi Pikachu"));
        app.canvas.style.display = "block";
        app.canvas.style.width   = "100%";
        app.canvas.style.height  = "100%";
        app.canvas.style.touchAction = "none";

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
        setAnimationsReducedMotion(prefersReducedMotionRef.current);
        setAnimationsPaused(isPausedRef.current);

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
      pauseAnimationsRef.current = null;
      reducedMotionRef.current = null;
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
      aria-label={t("pikachu_board", "Bàn chơi Ghép đôi Pikachu")}
      aria-busy={assetStatus === "loading"}
      className="relative h-full w-full overflow-hidden touch-none select-none"
    >
      {assetStatus !== "ready" && (
        <div
          className="absolute inset-0 grid place-items-center p-4 text-center text-sm font-bold text-[#6f4f20]"
          role={assetStatus === "error" ? "alert" : "status"}
        >
          {assetStatus === "error"
            ? `${t("error_loading_assets", "Không thể tải asset bàn chơi:")} ${assetError}`
            : t("loading_characters", "Loading...")}
        </div>
      )}
    </div>
  );
});

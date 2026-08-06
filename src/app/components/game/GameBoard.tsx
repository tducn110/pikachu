import { memo, useEffect, useRef, useState } from "react";
import { Application, Container, Graphics, Rectangle, Sprite } from "pixi.js";
import { getBoardSize, type PairTile, type Point, type TileKind } from "../../utils/pairMatchLogic";
import { palette as c } from "./gameThemes";
import { loadPikachuTileAssets, type PikachuTileAssets } from "./pixi/loadPikachuTileAssets";
import { TILE_ICON_FILL_RATIO } from "./pixi/pikachuTileCatalog";
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
    let tileAssets: PikachuTileAssets | null = null;
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

        currentView.tileId = tile.id;
        currentView.root.visible = visible;
        currentView.root.position.set(originX + (tile.col + 0.5) * tileSize, originY + (tile.row + 0.5) * tileSize);
        perfDiagnostics.count("pixi.positionUpdates");
        currentView.root.scale.set(isSelected ? 1.05 : 1);
        currentView.root.rotation = isWrong ? 0.035 : 0;
        currentView.root.eventMode = visible ? "static" : "none";

        if (
          layoutChanged ||
          currentView.lastSelected !== isSelected ||
          currentView.lastWrong !== isWrong ||
          currentView.lastHint !== isHint ||
          currentView.lastVisible !== visible
        ) {
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
          const texture = tileAssets.texturesByKind.get(tile.kind);
          if (!texture) {
            throw new Error(`No loaded Pikachu texture mapped for tile kind: ${tile.kind}`);
          }
          currentView.icon.texture = texture;
          perfDiagnostics.count("pixi.textureAssignments");
          currentView.kind = tile.kind;
        }
        if (kindChanged || layoutChanged) {
          const desiredSize = tileSize * TILE_ICON_FILL_RATIO;
          const scale = desiredSize / currentView.icon.texture.orig.width;
          currentView.icon.position.set(0, 0);
          currentView.icon.scale.set(scale);
        }
      }

        if (
          lastPath !== state.activePath ||
          lastPathTileSize !== tileSize ||
          lastPathOriginX !== originX ||
          lastPathOriginY !== originY
        ) {
          drawPath(pathLayer, state.activePath, originX, originY, tileSize);
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

    const destroyApp = () => {
      if (appInitialized && !destroyed) {
        destroyed = true;
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

    void Promise.all([initPromise, loadPikachuTileAssets()])
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

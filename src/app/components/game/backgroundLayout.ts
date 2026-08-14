export const BACKGROUND_LAYOUT = {
  width: 1672,
  height: 941,
  frameLeft: 265,
  frameTop: 75,
  frameRight: 1414,
  frameBottom: 857,
  // The game sits inside the background shell, below its outer ornament.
  gameInsetLeft: 34,
  gameInsetTop: 30,
  gameInsetBottom: 14,
} as const;

export function getBackgroundFrameStyle(viewportWidth: number, viewportHeight: number) {
  const scale = Math.max(viewportWidth / BACKGROUND_LAYOUT.width, viewportHeight / BACKGROUND_LAYOUT.height);
  const renderedWidth = BACKGROUND_LAYOUT.width * scale;
  const renderedHeight = BACKGROUND_LAYOUT.height * scale;
  const offsetX = (viewportWidth - renderedWidth) / 2;
  const offsetY = (viewportHeight - renderedHeight) / 2;

  const gameLeft = offsetX + (BACKGROUND_LAYOUT.frameLeft + BACKGROUND_LAYOUT.gameInsetLeft) * scale;
  const gameTop = BACKGROUND_LAYOUT.gameInsetTop;

  return {
    position: "absolute" as const,
    left: gameLeft,
    top: gameTop,
    width: (BACKGROUND_LAYOUT.frameRight - BACKGROUND_LAYOUT.frameLeft) * scale,
    height: viewportHeight - gameTop - BACKGROUND_LAYOUT.gameInsetBottom,
  };
}

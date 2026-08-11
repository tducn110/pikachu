import { Assets, type Texture } from "pixi.js";

export const HYPER_PANEL_FRAME = {
  src: "/hyper-ui/surfaces/panel-frame.png",
  leftWidth: 101,
  topHeight: 96,
  rightWidth: 101,
  bottomHeight: 96,
} as const;

let panelPromise: Promise<Texture> | null = null;

/** Load the shared board frame once; callers only receive the cached texture. */
export function loadHyperPanelFrame(): Promise<Texture> {
  if (!panelPromise) {
    panelPromise = Assets.load<Texture>(HYPER_PANEL_FRAME.src);
  }
  return panelPromise;
}


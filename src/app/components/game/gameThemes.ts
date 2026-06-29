import type { TileKind } from "../../utils/pairMatchLogic";

/** Bộ Lạc Đậu Phộng palette (from DESIGN.md). */
export const palette = {
  ricePaper: "#f5ecd7",
  paperWarm: "#efe3c4",
  inkDark: "#2a2418",
  mascotYellow: "#f0b840",
  orangeCta: "#e87432",
  orangeCtaEdge: "#b85a22",
  bambooGreen: "#6b8e3d",
  leafDeep: "#4c6630",
  bambooSoft: "#c8d68a",
  earthBrown: "#8e4e22",
  pencilGray: "#8a7d65",
  creamCard: "#fdf6ea",
  alertRed: "#c23838",
} as const;

export const KIND_LABELS: Record<TileKind, string> = {
  peanut: "Đậu phộng",
  cat: "Mèo",
  dog: "Chó",
  bamboo: "Tre",
  kite: "Diều",
  stork: "Cò",
  rice: "Lúa",
  drum: "Trống",
};

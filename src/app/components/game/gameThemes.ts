import type { TileKind } from "../../utils/pairMatchLogic";

/** Bộ Lạc Đậu Phộng palette (from DESIGN.md). */
export const palette = {
  ricePaper: "#f4f9ff",
  paperWarm: "#e6f1ff",
  inkDark: "#18324f",
  mascotYellow: "#ffc928",
  orangeCta: "#ff8c2f",
  orangeCtaEdge: "#e56d12",
  bambooGreen: "#25a56a",
  leafDeep: "#14704b",
  bambooSoft: "#b8efcf",
  earthBrown: "#805020",
  pencilGray: "#69819b",
  creamCard: "#ffffff",
  alertRed: "#e24848",
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

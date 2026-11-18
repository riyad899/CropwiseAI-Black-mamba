import { RICE_DISEASE_CLASSES, DiseaseInfo } from "../riceDisease.constant.js";

export const ORDERED_CLASS_NAMES: string[] = [
  "bacterial_leaf_blight",
  "bacterial_leaf_streak",
  "bacterial_panicle_blight",
  "blast",
  "brown_spot",
  "dead_heart",
  "downy_mildew",
  "hispa",
  "normal",
  "tungro",
];

export const CLASS_TO_INDEX: Record<string, number> = {
  bacterial_leaf_blight: 0,
  bacterial_leaf_streak: 1,
  bacterial_panicle_blight: 2,
  blast: 3,
  brown_spot: 4,
  dead_heart: 5,
  downy_mildew: 6,
  hispa: 7,
  normal: 8,
  tungro: 9,
};

export const INDEX_TO_CLASS: Record<number, string> = {
  0: "bacterial_leaf_blight",
  1: "bacterial_leaf_streak",
  2: "bacterial_panicle_blight",
  3: "blast",
  4: "brown_spot",
  5: "dead_heart",
  6: "downy_mildew",
  7: "hispa",
  8: "normal",
  9: "tungro",
};

export function getClassInfo(classNameOrIndex: string | number): DiseaseInfo {
  const className = typeof classNameOrIndex === "number" ? INDEX_TO_CLASS[classNameOrIndex] : classNameOrIndex;
  const info = RICE_DISEASE_CLASSES[className];
  if (!info) {
    throw new Error(`Unknown class identifier: ${classNameOrIndex}`);
  }
  return info;
}


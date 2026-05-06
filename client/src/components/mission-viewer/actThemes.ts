import type { ComponentType } from "react";
import { FloodBackground } from "./FloodBackground";
import { LeafyBackground } from "./LeafyBackground";

export interface ActTheme {
  Ambient: ComponentType;
  // RGB triplet (no spaces, "r,g,b") used to build the dark veil layered
  // over the ambient backdrop. Tuned so the puzzle text remains readable
  // while letting the backdrop show through at the edges.
  veilRgb: string;
}

export const ACT_THEMES: Record<number, ActTheme> = {
  1: { Ambient: FloodBackground, veilRgb: "6,14,26" },
  2: { Ambient: LeafyBackground, veilRgb: "8,16,12" },
};

export function getActTheme(act: number): ActTheme | null {
  return ACT_THEMES[act] ?? null;
}

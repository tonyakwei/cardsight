import type { CardDesign } from "@cardsight/shared";

export function buildDesign(d: any): CardDesign | null {
  if (!d) return null;
  return {
    bgColor: d.bgColor,
    bgGradient: d.bgGradient,
    bgImageUrl: d.bgImageUrl,
    textColor: d.textColor,
    accentColor: d.accentColor,
    secondaryColor: d.secondaryColor,
    fontFamily: d.fontFamily,
    cardStyle: d.cardStyle,
    animationIn: d.animationIn,
    borderStyle: d.borderStyle,
    overlayEffect: d.overlayEffect,
    customCss: d.customCss,
  };
}

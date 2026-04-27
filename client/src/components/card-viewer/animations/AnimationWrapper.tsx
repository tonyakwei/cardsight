import type { ReactNode } from "react";
import { FadeIn } from "./FadeIn";
import { SlideUp } from "./SlideUp";
import { GlitchIn } from "./GlitchIn";
import { DecryptIn } from "./DecryptIn";
import { ZoomIn } from "./ZoomIn";

interface Props {
  type: string;
  children: ReactNode;
}

const animationMap: Record<string, React.ComponentType<{ children: ReactNode }>> = {
  fade: FadeIn,
  "slide-up": SlideUp,
  glitch: GlitchIn,
  decrypt: DecryptIn,
  "zoom-in": ZoomIn,
};

export function AnimationWrapper({ type, children }: Props) {
  const Component = animationMap[type] ?? FadeIn;
  return <Component>{children}</Component>;
}

import { Scanlines } from "./Scanlines";
import { StaticNoise } from "./StaticNoise";
import { Glow } from "./Glow";
import { Particles } from "./Particles";

interface Props {
  effect: string | null;
}

const overlayMap: Record<string, React.ComponentType> = {
  scanlines: Scanlines,
  static: StaticNoise,
  glow: Glow,
  particles: Particles,
};

export function OverlayRenderer({ effect }: Props) {
  if (!effect) return null;
  const Component = overlayMap[effect];
  if (!Component) return null;
  return <Component />;
}

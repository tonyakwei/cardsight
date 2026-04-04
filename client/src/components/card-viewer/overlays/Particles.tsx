import { useMemo } from "react";

const PARTICLE_COUNT = 20;

interface Particle {
  id: number;
  left: string;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export function Particles() {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: 2 + Math.random() * 3,
        duration: 8 + Math.random() * 12,
        delay: Math.random() * 10,
        opacity: 0.15 + Math.random() * 0.2,
      })),
    [],
  );

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: p.left,
              bottom: "-10px",
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: "50%",
              background: "var(--card-accent-color)",
              opacity: p.opacity,
              animation: `particleFloat ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes particleFloat {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: var(--particle-opacity, 0.2);
          }
          90% {
            opacity: var(--particle-opacity, 0.2);
          }
          100% {
            transform: translateY(-100vh) translateX(${20 - Math.random() * 40}px);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}

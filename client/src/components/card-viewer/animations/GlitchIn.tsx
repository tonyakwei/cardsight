import type { ReactNode } from "react";

export function GlitchIn({ children }: { children: ReactNode }) {
  return (
    <>
      <div style={{ animation: "glitchIn 0.8s ease-out forwards" }}>
        {children}
      </div>
      <style>{`
        @keyframes glitchIn {
          0% {
            opacity: 0;
            transform: translate(0);
            filter: blur(4px);
            clip-path: inset(0 0 100% 0);
          }
          10% {
            opacity: 0.6;
            transform: translate(-3px, 2px);
            clip-path: inset(0 0 60% 0);
          }
          20% {
            transform: translate(3px, -1px);
            clip-path: inset(0 0 40% 0);
          }
          30% {
            transform: translate(-2px, 1px);
            clip-path: inset(0 0 20% 0);
          }
          40% {
            opacity: 0.8;
            transform: translate(1px, -2px);
            filter: blur(1px);
            clip-path: inset(0 0 10% 0);
          }
          50% {
            transform: translate(-1px, 0);
            clip-path: inset(0);
          }
          60% {
            opacity: 0.9;
            transform: translate(2px, 1px);
            filter: blur(0.5px);
          }
          70% {
            transform: translate(0, -1px);
            filter: blur(0);
          }
          80% {
            opacity: 0.95;
            transform: translate(-1px, 0);
          }
          100% {
            opacity: 1;
            transform: translate(0);
            filter: blur(0);
            clip-path: inset(0);
          }
        }
      `}</style>
    </>
  );
}

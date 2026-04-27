import type { ReactNode } from "react";

export function ZoomIn({ children }: { children: ReactNode }) {
  return (
    <>
      <div style={{ animation: "zoomIn 150ms ease-out forwards" }}>
        {children}
      </div>
      <style>{`
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}

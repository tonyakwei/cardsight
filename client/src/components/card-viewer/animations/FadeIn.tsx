import type { ReactNode } from "react";

export function FadeIn({ children }: { children: ReactNode }) {
  return (
    <>
      <div style={{ animation: "fadeIn 0.8s ease-out forwards" }}>
        {children}
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}

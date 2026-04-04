import type { ReactNode } from "react";

export function SlideUp({ children }: { children: ReactNode }) {
  return (
    <>
      <div style={{ animation: "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
        {children}
      </div>
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

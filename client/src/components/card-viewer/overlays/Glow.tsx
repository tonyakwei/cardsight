export function Glow() {
  return (
    <>
      <div
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          width: "300px",
          height: "300px",
          transform: "translateX(-50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, var(--card-accent-color) 0%, transparent 70%)",
          opacity: 0.06,
          pointerEvents: "none",
          zIndex: 0,
          animation: "glowBreathe 4s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes glowBreathe {
          0%, 100% { opacity: 0.04; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.08; transform: translateX(-50%) scale(1.1); }
        }
      `}</style>
    </>
  );
}

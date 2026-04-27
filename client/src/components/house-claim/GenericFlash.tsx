import { useEffect, useState } from "react";

type Props = {
  house: { name: string; color: string };
};

export function GenericFlash({ house }: Props) {
  const [phase, setPhase] = useState<"intro" | "settle">("intro");

  useEffect(() => {
    const t = setTimeout(() => setPhase("settle"), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: `radial-gradient(circle at 50% 50%, ${house.color}33 0%, #0a0a0a 70%, #000 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "#fff",
        fontFamily: "'Cinzel', 'Cormorant Garamond', serif",
        textShadow: `0 0 20px ${house.color}, 0 0 40px ${house.color}99`,
        padding: "1rem",
      }}
    >
      <div
        style={{
          fontSize: "min(8vw, 56px)",
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          opacity: phase === "intro" ? 0 : 1,
          transform: phase === "intro" ? "scale(0.7)" : "scale(1)",
          transition: "opacity 700ms ease-out, transform 800ms ease-out",
          lineHeight: 1.05,
        }}
      >
        {house.name}
      </div>
      <div
        style={{
          marginTop: 18,
          fontSize: 12,
          letterSpacing: "0.3em",
          color: "#ddd",
          opacity: phase === "settle" ? 0.85 : 0,
          transition: "opacity 600ms ease-out 300ms",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        YOU'RE TAGGED — PUT YOUR PHONE AWAY
      </div>
    </div>
  );
}

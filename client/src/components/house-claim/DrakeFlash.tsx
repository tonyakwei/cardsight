import { useEffect, useState } from "react";

type Props = {
  house: { name: string; color: string };
};

type Burst = {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  hue: "fire" | "violet";
};

export function DrakeFlash({ house }: Props) {
  const [bursts] = useState<Burst[]>(() => {
    const seeds: Burst[] = [];
    for (let i = 0; i < 14; i++) {
      seeds.push({
        id: i,
        left: 8 + Math.random() * 84,
        top: 8 + Math.random() * 84,
        size: 60 + Math.random() * 220,
        delay: Math.random() * 1900,
        hue: Math.random() > 0.5 ? "fire" : "violet",
      });
    }
    return seeds;
  });

  const [phase, setPhase] = useState<"erupt" | "settle">("erupt");

  useEffect(() => {
    const t = setTimeout(() => setPhase("settle"), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 60%, #2a0518 0%, #08010a 60%, #000 100%)",
        animation: phase === "erupt" ? "drake-shake 80ms infinite" : undefined,
      }}
    >
      {bursts.map((b) => {
        const fireColor = "#ff5c1f";
        const violetColor = "#9333ea";
        const c = b.hue === "fire" ? fireColor : violetColor;
        return (
          <div
            key={b.id}
            style={{
              position: "absolute",
              left: `${b.left}%`,
              top: `${b.top}%`,
              width: b.size,
              height: b.size,
              marginLeft: -b.size / 2,
              marginTop: -b.size / 2,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${c} 0%, ${c}99 30%, transparent 70%)`,
              animation: `drake-burst 900ms ${b.delay}ms ease-out both`,
              filter: "blur(2px)",
              mixBlendMode: "screen",
            }}
          />
        );
      })}

      {/* sparks */}
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${Math.random() * 100}%`,
            top: `${100 + Math.random() * 30}%`,
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: i % 3 === 0 ? "#ffb347" : "#c084fc",
            boxShadow: "0 0 8px currentColor",
            animation: `drake-spark ${1500 + Math.random() * 800}ms ${Math.random() * 1500}ms linear forwards`,
          }}
        />
      ))}

      {/* center title */}
      <div
        style={{
          position: "absolute",
          inset: 0,
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
            opacity: phase === "erupt" ? 0 : 1,
            transform: phase === "erupt" ? "scale(0.6)" : "scale(1)",
            transition: "opacity 600ms ease-out, transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1)",
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
            color: "#fbcfe8",
            opacity: phase === "settle" ? 0.85 : 0,
            transition: "opacity 600ms ease-out 300ms",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          YOU'RE TAGGED — PUT YOUR PHONE AWAY
        </div>
      </div>

      <style>{`
        @keyframes drake-burst {
          0% { transform: scale(0.05); opacity: 0; }
          25% { opacity: 1; }
          70% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes drake-spark {
          0% { transform: translateY(0); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(-130vh) translateX(${Math.random() > 0.5 ? "" : "-"}30px); opacity: 0; }
        }
        @keyframes drake-shake {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-2px, 1px); }
          50% { transform: translate(2px, -1px); }
          75% { transform: translate(-1px, -1px); }
        }
      `}</style>
    </div>
  );
}

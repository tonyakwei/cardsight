import { useEffect, useState } from "react";

type Props = {
  house: { name: string; color: string };
};

type Whip = {
  id: number;
  text: string;
  startAngle: number;
  duration: number;
  delay: number;
  radius: number;
  scale: number;
};

export function JonesFlash({ house }: Props) {
  const words = house.name.toUpperCase().split(" ");

  const [whips] = useState<Whip[]>(() => {
    const out: Whip[] = [];
    for (let i = 0; i < 14; i++) {
      out.push({
        id: i,
        text: words[i % words.length],
        startAngle: Math.random() * 360,
        duration: 900 + Math.random() * 700,
        delay: Math.random() * 1200,
        radius: 120 + Math.random() * 200,
        scale: 0.6 + Math.random() * 0.9,
      });
    }
    return out;
  });

  const [phase, setPhase] = useState<"whip" | "settle">("whip");

  useEffect(() => {
    const t = setTimeout(() => setPhase("settle"), 2300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 50%, #3a2a05 0%, #1a0f02 60%, #000 100%)",
      }}
    >
      {whips.map((w) => (
        <div
          key={w.id}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%)`,
            opacity: phase === "settle" ? 0 : 1,
            transition: phase === "settle" ? "opacity 400ms ease-out" : undefined,
            // CSS variables consumed by keyframes
            ["--start-angle" as any]: `${w.startAngle}deg`,
            ["--radius" as any]: `${w.radius}px`,
            ["--scale" as any]: w.scale,
            animation: `jones-whip ${w.duration}ms ${w.delay}ms cubic-bezier(0.4, 0, 0.2, 1) infinite`,
          }}
        >
          <div
            style={{
              fontFamily: "'Cinzel', 'Cormorant Garamond', serif",
              fontSize: `${28 * w.scale}px`,
              fontWeight: 700,
              color: house.color,
              textShadow: `0 0 12px ${house.color}, 0 0 24px ${house.color}66`,
              letterSpacing: "0.12em",
              filter: "blur(0.4px)",
              whiteSpace: "nowrap",
            }}
          >
            {w.text}
          </div>
        </div>
      ))}

      {/* center title — converged */}
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
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: "min(8vw, 56px)",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: phase === "whip" ? 0 : 1,
            transform: phase === "whip" ? "scale(0.4) rotate(-12deg)" : "scale(1) rotate(0deg)",
            transition: "opacity 500ms ease-out, transform 700ms cubic-bezier(0.2, 0.9, 0.2, 1)",
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
            color: "#fde68a",
            opacity: phase === "settle" ? 0.85 : 0,
            transition: "opacity 600ms ease-out 300ms",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          YOU'RE TAGGED — PUT YOUR PHONE AWAY
        </div>
      </div>

      <style>{`
        @keyframes jones-whip {
          0% {
            transform: translate(-50%, -50%) rotate(var(--start-angle)) translateX(var(--radius)) rotate(calc(-1 * var(--start-angle))) scale(var(--scale));
            opacity: 0;
          }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% {
            transform: translate(-50%, -50%) rotate(calc(var(--start-angle) + 360deg)) translateX(var(--radius)) rotate(calc(-1 * var(--start-angle) - 360deg)) scale(var(--scale));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

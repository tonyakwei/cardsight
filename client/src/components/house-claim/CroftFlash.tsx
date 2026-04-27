import { useEffect, useState } from "react";

type Props = {
  house: { name: string; color: string };
};

const CRAWL_LINES = [
  "FIELD LOG · CROFT COMPANY",
  "RECON UNIT VERIFIED",
  "INSTRUMENT CALIBRATED",
  "SPECIMEN MANIFEST UPDATED",
  "ENCRYPTION HANDSHAKE: OK",
  "TELEMETRY LINK: ACTIVE",
  "PROCEED TO SITE",
];

export function CroftFlash({ house }: Props) {
  const [phase, setPhase] = useState<"crawl" | "settle">("crawl");

  useEffect(() => {
    const t = setTimeout(() => setPhase("settle"), 2400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background:
          "radial-gradient(ellipse at 50% 100%, #1a0a3a 0%, #06021a 60%, #000 100%)",
        perspective: "600px",
      }}
    >
      {/* Star field */}
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: Math.random() > 0.8 ? 2 : 1,
            height: Math.random() > 0.8 ? 2 : 1,
            background: "#fff",
            opacity: 0.2 + Math.random() * 0.6,
          }}
        />
      ))}

      {/* Crawl */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "120%",
          transformStyle: "preserve-3d",
          transform: "rotateX(35deg)",
          transformOrigin: "50% 100%",
          opacity: phase === "settle" ? 0 : 1,
          transition: phase === "settle" ? "opacity 500ms ease-out" : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            width: "min(80vw, 600px)",
            transform: "translateX(-50%)",
            color: house.color,
            fontFamily: "'Cinzel', 'Cormorant Garamond', serif",
            textShadow: `0 0 8px ${house.color}99`,
            textAlign: "center",
            animation: "croft-crawl 4500ms linear forwards",
          }}
        >
          {CRAWL_LINES.map((line, i) => (
            <div
              key={i}
              style={{
                fontSize: 22,
                letterSpacing: "0.18em",
                marginBottom: 22,
                whiteSpace: "nowrap",
              }}
            >
              {line}
            </div>
          ))}
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: "0.22em",
              marginTop: 32,
              textTransform: "uppercase",
            }}
          >
            {house.name}
          </div>
        </div>
      </div>

      {/* Final settled title (revealed when crawl fades) */}
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
            opacity: phase === "crawl" ? 0 : 1,
            transform: phase === "crawl" ? "scale(0.85)" : "scale(1)",
            transition: "opacity 600ms ease-out 200ms, transform 700ms ease-out 200ms",
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
            color: "#c4b5fd",
            opacity: phase === "settle" ? 0.85 : 0,
            transition: "opacity 600ms ease-out 600ms",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          YOU'RE TAGGED — PUT YOUR PHONE AWAY
        </div>
      </div>

      <style>{`
        @keyframes croft-crawl {
          0% { transform: translateX(-50%) translateY(60vh); }
          100% { transform: translateX(-50%) translateY(-140vh); }
        }
      `}</style>
    </div>
  );
}

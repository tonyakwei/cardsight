import { useEffect, useState } from "react";

interface Props {
  accentColor: string;
  // "closed": doors stay shut with the seam pulsing — used to mask the
  //           initial fetch. Tap-to-skip still works.
  // "opening": run the hold + slide animation, then fire onDone.
  phase: "closed" | "opening";
  onDone: () => void;
}

const HOLD_MS = 300;
const SLIDE_MS = 1400;
const TOTAL_MS = HOLD_MS + SLIDE_MS;

export function MissionDoors({ accentColor, phase, onDone }: Props) {
  const [sliding, setSliding] = useState(false);

  useEffect(() => {
    if (phase !== "opening") return;
    const t1 = setTimeout(() => setSliding(true), HOLD_MS);
    const t2 = setTimeout(onDone, TOTAL_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase, onDone]);

  const stoneTexture =
    "repeating-linear-gradient(180deg, transparent 0, transparent 14px, rgba(255,255,255,0.025) 14px, rgba(255,255,255,0.025) 15px)";
  const stoneGradient =
    "linear-gradient(135deg, #14110f 0%, #2a231e 45%, #1a1614 100%)";

  return (
    <div
      onClick={onDone}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        cursor: "pointer",
      }}
      aria-label="Tap to skip"
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: "50%",
          background: `${stoneTexture}, ${stoneGradient}`,
          borderRight: `2px solid ${accentColor}`,
          boxShadow: `inset -12px 0 32px rgba(0,0,0,0.6), 6px 0 24px ${accentColor}33`,
          transform: sliding ? "translateX(-100%)" : "translateX(0)",
          transition: `transform ${SLIDE_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: "50%",
          background: `${stoneTexture}, linear-gradient(225deg, #14110f 0%, #2a231e 45%, #1a1614 100%)`,
          borderLeft: `2px solid ${accentColor}`,
          boxShadow: `inset 12px 0 32px rgba(0,0,0,0.6), -6px 0 24px ${accentColor}33`,
          transform: sliding ? "translateX(100%)" : "translateX(0)",
          transition: `transform ${SLIDE_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "50%",
          width: "2px",
          marginLeft: "-1px",
          background: `linear-gradient(to bottom, transparent 0%, ${accentColor} 20%, ${accentColor} 80%, transparent 100%)`,
          opacity: sliding ? 0 : 1,
          transition: "opacity 0.4s ease-out",
          boxShadow: `0 0 18px ${accentColor}, 0 0 36px ${accentColor}88`,
          pointerEvents: "none",
          animation: sliding ? undefined : "missionSeamPulse 1.4s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes missionSeamPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

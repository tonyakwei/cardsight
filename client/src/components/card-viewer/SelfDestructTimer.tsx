import { useState, useEffect } from "react";

interface Props {
  deadline: string; // ISO timestamp
  onExpired: () => void;
}

export function SelfDestructTimer({ deadline, onExpired }: Props) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const ms = new Date(deadline).getTime() - Date.now();
      const secs = Math.max(0, Math.floor(ms / 1000));
      setRemaining(secs);
      if (secs <= 0) {
        clearInterval(interval);
        onExpired();
      }
    }, 250);
    return () => clearInterval(interval);
  }, [deadline, onExpired]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const isUrgent = remaining <= 30;
  const isCritical = remaining <= 10;

  return (
    <div
      style={{
        marginTop: "1.5rem",
        padding: "0.75rem 1rem",
        borderRadius: "10px",
        background: isCritical
          ? "rgba(255, 23, 68, 0.15)"
          : isUrgent
            ? "rgba(255, 171, 0, 0.1)"
            : "rgba(255,255,255,0.05)",
        border: `1px solid ${
          isCritical
            ? "rgba(255, 23, 68, 0.4)"
            : isUrgent
              ? "rgba(255, 171, 0, 0.3)"
              : "rgba(255,255,255,0.1)"
        }`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        transition: "all 0.3s ease",
        animation: isCritical ? "urgentPulse 1s ease-in-out infinite" : undefined,
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          opacity: 0.7,
          color: isCritical
            ? "#ff1744"
            : isUrgent
              ? "#ffab00"
              : "var(--card-text-color)",
        }}
      >
        Self-destruct
      </div>
      <div
        style={{
          fontSize: "1.4rem",
          fontWeight: 700,
          fontFamily: "'Courier New', monospace",
          fontVariantNumeric: "tabular-nums",
          color: isCritical
            ? "#ff1744"
            : isUrgent
              ? "#ffab00"
              : "var(--card-accent-color)",
        }}
      >
        {timeStr}
      </div>

      <style>{`
        @keyframes urgentPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

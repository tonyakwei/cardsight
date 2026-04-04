import { useState, useEffect, type ReactNode } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
const DECRYPT_DURATION = 1200; // ms
const FRAME_INTERVAL = 40; // ms

export function DecryptIn({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"scramble" | "done">("scramble");

  useEffect(() => {
    const timer = setTimeout(() => setPhase("done"), DECRYPT_DURATION);
    return () => clearTimeout(timer);
  }, []);

  if (phase === "done") {
    return (
      <div style={{ animation: "fadeIn 0.3s ease-out" }}>{children}</div>
    );
  }

  return (
    <>
      <div style={{ position: "relative" }}>
        {/* Real content invisible but preserving layout */}
        <div style={{ visibility: "hidden" }}>{children}</div>
        {/* Scramble overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
          }}
        >
          <ScrambleOverlay />
        </div>
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

function ScrambleOverlay() {
  const [lines, setLines] = useState<string[]>(() => generateLines());

  useEffect(() => {
    const interval = setInterval(() => {
      setLines(generateLines());
    }, FRAME_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        fontFamily: "'Courier New', monospace",
        fontSize: "0.9rem",
        lineHeight: 1.7,
        color: "var(--card-accent-color)",
        opacity: 0.7,
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
      }}
    >
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}

function generateLines(): string[] {
  return Array.from({ length: 12 }, () =>
    Array.from(
      { length: 20 + Math.floor(Math.random() * 15) },
      () => CHARS[Math.floor(Math.random() * CHARS.length)],
    ).join(""),
  );
}

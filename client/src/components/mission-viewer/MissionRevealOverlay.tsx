import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

interface Props {
  phase: "confetti" | "revealed";
  houseColor: string;
  houseName: string;
  revealText: string | null;
  missionTitle: string;
  onDismiss: () => void;
}

function shade(hex: string, percent: number): string {
  // percent: -1.0 (black) to +1.0 (white)
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m || m.length < 3) return hex;
  const [r, g, b] = m.slice(0, 3).map((v) => parseInt(v, 16));
  const amt = Math.round(255 * percent);
  const adj = (v: number) => Math.max(0, Math.min(255, v + amt));
  return (
    "#" +
    [adj(r), adj(g), adj(b)]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

export function MissionRevealOverlay({
  phase,
  houseColor,
  houseName,
  revealText,
  missionTitle,
  onDismiss,
}: Props) {
  const dark = shade(houseColor, -0.55);
  const isConfetti = phase === "confetti";

  const [showConfetti, setShowConfetti] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: isConfetti
          ? "rgba(0, 0, 0, 0.55)"
          : `radial-gradient(ellipse at 50% 30%, ${houseColor} 0%, ${dark} 100%)`,
        transition: "background 0.5s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "1.5rem",
      }}
    >
      {showConfetti && <FullScreenConfetti color={houseColor} />}

      {!isConfetti && (
        <div
          style={{
            maxWidth: 600,
            width: "100%",
            color: "#fff",
            animation: "missionRevealFadeIn 0.7s ease-out",
            textAlign: "left",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              opacity: 0.75,
              marginBottom: "0.5rem",
              fontWeight: 700,
            }}
          >
            Mission Complete · {houseName}
          </div>
          <h1
            style={{
              fontSize: "2.4rem",
              fontWeight: 800,
              marginBottom: "1.5rem",
              lineHeight: 1.15,
              textShadow: "0 2px 12px rgba(0,0,0,0.4)",
            }}
          >
            {missionTitle}
          </h1>
          <div
            style={{
              fontSize: "1.1rem",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.95)",
            }}
            className="mission-reveal-body"
          >
            {revealText ? (
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p style={{ marginBottom: "0.85rem" }}>{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ fontWeight: 700, color: "#fff" }}>
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em
                      style={{
                        fontStyle: "italic",
                        color: "rgba(255,255,255,0.85)",
                      }}
                    >
                      {children}
                    </em>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote
                      style={{
                        borderLeft: "3px solid rgba(255,255,255,0.6)",
                        paddingLeft: "1rem",
                        margin: "1rem 0",
                        opacity: 0.92,
                        fontStyle: "italic",
                      }}
                    >
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {revealText}
              </ReactMarkdown>
            ) : (
              <p>You solved it.</p>
            )}
          </div>
          <button
            onClick={onDismiss}
            style={{
              marginTop: "2rem",
              padding: "0.8rem 1.75rem",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "#fff",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.06em",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.25)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.15)")
            }
          >
            Continue
          </button>
        </div>
      )}

      <style>{`
        @keyframes missionRevealFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function FullScreenConfetti({ color }: { color: string }) {
  const pieces = Array.from({ length: 90 }, (_, i) => i);
  const palette = [
    color,
    shade(color, 0.25),
    "#ffffff",
    shade(color, -0.15),
    shade(color, 0.4),
  ];

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {pieces.map((i) => {
        const size = 7 + (i % 5) * 2;
        const tilt = (i * 31) % 360;
        const left = (i * 11) % 100;
        const startTop = -10 - (i % 8) * 5;
        const duration = 1.8 + (i % 7) * 0.25;
        const delay = (i % 14) * 0.08;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${startTop}%`,
              left: `${left}%`,
              width: size,
              height: size * 1.7,
              borderRadius: 2,
              background: palette[i % palette.length],
              transform: `rotate(${tilt}deg)`,
              opacity: 0.9,
              animation: `mission-confetti-fall ${duration}s linear ${delay}s infinite`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes mission-confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          8% { opacity: 1; }
          100% { transform: translateY(125dvh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

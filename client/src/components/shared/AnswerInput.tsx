import { useState, useRef, useMemo } from "react";
import type { AnswerMeta } from "@cardsight/shared";

function randomDelay() {
  return 500 + Math.random() * 1000;
}

interface AnswerResult {
  correct: boolean;
  attemptNumber: number;
  hint: string | null;
}

interface Props {
  answerMeta: AnswerMeta | null;
  onSubmit: (answer: string) => Promise<AnswerResult>;
  onSuccess: () => void;
}

export function AnswerInput({ answerMeta, onSubmit, onSuccess }: Props) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lastResult, setLastResult] = useState<"correct" | "incorrect" | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [redFlash, setRedFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async () => {
    if (!value.trim() || submitting) return;
    setSubmitting(true);
    setLastResult(null);

    try {
      const result = await onSubmit(value.trim());

      await new Promise((r) => setTimeout(r, randomDelay()));

      setAttempts(result.attemptNumber);

      if (result.correct) {
        setLastResult("correct");
        setShowConfetti(true);
        setTimeout(onSuccess, 2200);
      } else {
        setLastResult("incorrect");
        setRedFlash(true);
        setShake(true);
        setTimeout(() => { setShake(false); setRedFlash(false); }, 600);
        if (result.hint) setHint(result.hint);
        setValue("");
        inputRef.current?.focus();
      }
    } catch {
      // Submission failed silently
    } finally {
      setSubmitting(false);
    }
  };

  const hintThreshold = answerMeta?.hintAfterAttempts ?? 3;
  const showHintTeaser =
    !hint && answerMeta?.hintAvailable && attempts > 0 && attempts < hintThreshold;

  return (
    <div ref={containerRef} style={{ marginTop: "2rem", position: "relative", overflow: "hidden" }}>
      {/* Green wave on correct */}
      {showConfetti && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(105,240,174,0.25) 0%, rgba(105,240,174,0) 100%)",
          animation: "greenWave 1.2s ease-out forwards",
          borderRadius: "12px",
          pointerEvents: "none",
          zIndex: 1,
        }} />
      )}
      {/* Confetti particles */}
      {showConfetti && <ConfettiParticles />}
      {/* Red flash on incorrect */}
      {redFlash && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(255, 82, 82, 0.15)",
          animation: "redFlashAnim 0.6s ease-out forwards",
          borderRadius: "12px",
          pointerEvents: "none",
          zIndex: 1,
        }} />
      )}
      <div
        style={{
          animation: shake ? "shakeInput 0.4s ease-in-out" : undefined,
          position: "relative",
          zIndex: 3,
        }}
      >
        <label
          style={{
            display: "block",
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "0.5rem",
            opacity: 0.6,
          }}
        >
          Your answer
        </label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={submitting || lastResult === "correct"}
            placeholder="Write your answer..."
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              fontSize: "1rem",
              borderRadius: "8px",
              border: `1px solid ${
                lastResult === "correct"
                  ? "rgba(105, 240, 174, 0.5)"
                  : lastResult === "incorrect"
                    ? "rgba(255, 82, 82, 0.5)"
                    : "rgba(255,255,255,0.15)"
              }`,
              background: lastResult === "correct"
                ? "rgba(105, 240, 174, 0.08)"
                : "rgba(255,255,255,0.06)",
              color: "var(--card-text-color)",
              fontFamily: "inherit",
              outline: "none",
              transition: "border-color 0.2s, background 0.2s",
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || submitting || lastResult === "correct"}
            style={{
              padding: "0.75rem 1.25rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              borderRadius: "8px",
              border: "none",
              background:
                lastResult === "correct"
                  ? "#69f0ae"
                  : "var(--card-accent-color)",
              color: "#000",
              cursor: submitting || !value.trim() ? "not-allowed" : "pointer",
              opacity: !value.trim() || submitting ? 0.5 : 1,
              transition: "opacity 0.2s, background 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {submitting ? "..." : lastResult === "correct" ? "✓" : "Submit"}
          </button>
        </div>
      </div>

      {/* Attempt counter */}
      {attempts > 0 && lastResult !== "correct" && (
        <div
          style={{
            marginTop: "0.75rem",
            fontSize: "0.8rem",
            opacity: 0.5,
          }}
        >
          {attempts} attempt{attempts !== 1 ? "s" : ""} so far
        </div>
      )}

      {/* Hint teaser */}
      {showHintTeaser && (
        <div
          style={{
            marginTop: "0.5rem",
            fontSize: "0.8rem",
            opacity: 0.4,
            fontStyle: "italic",
          }}
        >
          Hint available after {hintThreshold} attempts
        </div>
      )}

      {/* Hint */}
      {hint && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            background: "rgba(255, 235, 59, 0.08)",
            border: "1px solid rgba(255, 235, 59, 0.2)",
            fontSize: "0.85rem",
            lineHeight: 1.5,
            animation: "fadeSlideIn 0.3s ease-out",
          }}
        >
          <span style={{ fontWeight: 600, marginRight: "0.5rem" }}>
            Hint:
          </span>
          {hint}
        </div>
      )}

      <style>{`
        @keyframes shakeInput {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes greenWave {
          0% { transform: translateY(100%); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateY(0%); opacity: 0; }
        }
        @keyframes confettiBurst {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          20% { opacity: 1; transform: translateY(-20px) scale(1); }
          100% { transform: translateY(-140px) scale(0.4); opacity: 0; }
        }
        @keyframes redFlashAnim {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

const CONFETTI_COLORS = ["#69f0ae", "#00e676", "#b9f6ca", "#a5d6a7", "#66bb6a"];

function ConfettiParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      left: 4 + (i / 24) * 92,
      size: i % 3 === 0 ? 6 : 4,
      round: i % 2 === 0,
      color: CONFETTI_COLORS[i % 5],
      duration: 0.8 + Math.random() * 0.6,
      delay: Math.random() * 0.3,
      xDrift: (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 30),
      yTravel: 80 + Math.random() * 80,
    })),
  []);

  return (
    <>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            bottom: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            borderRadius: p.round ? "50%" : "1px",
            background: p.color,
            animation: `confetti-${i} ${p.duration}s ease-out ${p.delay}s forwards`,
            opacity: 0,
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
      ))}
      <style>{particles.map((p, i) => `
        @keyframes confetti-${i} {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          20% { opacity: 1; transform: translateY(-${p.yTravel * 0.15}px) translateX(${p.xDrift * 0.2}px) scale(1); }
          100% { transform: translateY(-${p.yTravel}px) translateX(${p.xDrift}px) scale(0.3); opacity: 0; }
        }
      `).join("")}</style>
    </>
  );
}

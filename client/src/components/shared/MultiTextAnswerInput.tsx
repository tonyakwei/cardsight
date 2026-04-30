import { useState, useRef, useMemo } from "react";
import type { AnswerMeta } from "@cardsight/shared";

function randomDelay() {
  return 500 + Math.random() * 1000;
}

interface AnswerResult {
  correct: boolean;
  attemptNumber: number;
  hint: string | null;
  fieldResults?: boolean[];
}

interface Props {
  answerMeta: AnswerMeta | null;
  onSubmit: (answers: Record<string, string>) => Promise<AnswerResult>;
  onSuccess: () => void;
}

export function MultiTextAnswerInput({ answerMeta, onSubmit, onSuccess }: Props) {
  const labels = useMemo(() => answerMeta?.labels ?? [], [answerMeta]);
  const fieldCount = labels.length;

  const [values, setValues] = useState<string[]>(() =>
    Array.from({ length: fieldCount }, () => ""),
  );
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lastResult, setLastResult] = useState<"correct" | "incorrect" | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [redFlash, setRedFlash] = useState(false);
  // Persists per-field correctness across attempts: once a field is confirmed
  // correct, it stays green and locked even after subsequent submissions.
  const [confirmedFields, setConfirmedFields] = useState<boolean[]>(() =>
    Array.from({ length: fieldCount }, () => false),
  );
  const [justConfirmed, setJustConfirmed] = useState<boolean[]>(() =>
    Array.from({ length: fieldCount }, () => false),
  );
  const firstInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allFilled = values.every((v) => v.trim().length > 0);

  const setValueAt = (idx: number, value: string) => {
    setValues((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!allFilled || submitting) return;
    setSubmitting(true);
    setLastResult(null);

    try {
      const payload: Record<string, string> = {};
      values.forEach((v, i) => { payload[String(i)] = v.trim(); });

      const result = await onSubmit(payload);

      await new Promise((r) => setTimeout(r, randomDelay()));

      setAttempts(result.attemptNumber);

      // If the server returned per-field correctness OR the whole answer was
      // correct, mark newly-confirmed fields and trigger a brief glow.
      const nextConfirmed = [...confirmedFields];
      const newlyConfirmed = Array.from({ length: fieldCount }, () => false);
      const fieldResults = result.fieldResults
        ?? (result.correct ? Array.from({ length: fieldCount }, () => true) : undefined);
      if (fieldResults) {
        for (let i = 0; i < fieldCount; i++) {
          if (fieldResults[i] && !nextConfirmed[i]) {
            nextConfirmed[i] = true;
            newlyConfirmed[i] = true;
          }
        }
        setConfirmedFields(nextConfirmed);
        if (newlyConfirmed.some(Boolean)) {
          setJustConfirmed(newlyConfirmed);
          setTimeout(() => {
            setJustConfirmed(Array.from({ length: fieldCount }, () => false));
          }, 1200);
        }
      }

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
        // Don't clear values — let player edit and try again. Focus the
        // first still-unconfirmed field so they don't tab through locks.
        const firstUnconfirmed = nextConfirmed.findIndex((c) => !c);
        if (firstUnconfirmed === 0 || firstUnconfirmed === -1) {
          firstInputRef.current?.focus();
        } else {
          const inputs = containerRef.current?.querySelectorAll<HTMLInputElement>("input");
          inputs?.[firstUnconfirmed]?.focus();
        }
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
      {showConfetti && <ConfettiParticles />}
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
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
        }}
      >
        <label
          style={{
            display: "block",
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            opacity: 0.6,
          }}
        >
          Your answers — all required
        </label>

        {Array.from({ length: fieldCount }).map((_, idx) => {
          const promptText = labels[idx] || `Answer ${idx + 1}`;
          const isConfirmed = confirmedFields[idx];
          const isPulsing = justConfirmed[idx];
          const allCorrect = lastResult === "correct";
          const showGreen = isConfirmed || allCorrect;
          const showRedBorder = lastResult === "incorrect" && !isConfirmed;
          return (
            <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <span
                style={{
                  fontSize: "0.78rem",
                  letterSpacing: "0.04em",
                  opacity: showGreen ? 0.95 : 0.75,
                  color: showGreen ? "#69f0ae" : undefined,
                  transition: "color 0.3s, opacity 0.3s",
                }}
              >
                {promptText}
                {showGreen && <span style={{ marginLeft: "0.5rem", fontSize: "0.85em" }}>✓</span>}
              </span>
              <input
                ref={idx === 0 ? firstInputRef : undefined}
                type="text"
                value={values[idx] ?? ""}
                onChange={(e) => setValueAt(idx, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && allFilled) handleSubmit();
                }}
                disabled={submitting || isConfirmed || allCorrect}
                placeholder="Write here..."
                style={{
                  padding: "0.65rem 0.9rem",
                  fontSize: "1rem",
                  borderRadius: "8px",
                  border: `1px solid ${
                    showGreen
                      ? "rgba(105, 240, 174, 0.65)"
                      : showRedBorder
                        ? "rgba(255, 82, 82, 0.5)"
                        : "rgba(255,255,255,0.15)"
                  }`,
                  background: showGreen
                    ? "rgba(105, 240, 174, 0.12)"
                    : "rgba(255,255,255,0.06)",
                  color: "var(--card-text-color)",
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "border-color 0.3s, background 0.3s, box-shadow 0.3s",
                  boxShadow: showGreen ? "0 0 12px rgba(105, 240, 174, 0.35)" : undefined,
                  animation: isPulsing ? "fieldConfirmPulse 1.2s ease-out" : undefined,
                  opacity: isConfirmed && !allCorrect ? 0.95 : 1,
                  cursor: isConfirmed ? "default" : undefined,
                }}
              />
            </div>
          );
        })}

        <button
          onClick={handleSubmit}
          disabled={!allFilled || submitting || lastResult === "correct"}
          style={{
            marginTop: "0.5rem",
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
            cursor: !allFilled || submitting ? "not-allowed" : "pointer",
            opacity: !allFilled || submitting ? 0.5 : 1,
            transition: "opacity 0.2s, background 0.2s",
          }}
        >
          {submitting ? "..." : lastResult === "correct" ? "✓ Solved" : "Submit all"}
        </button>
      </div>

      {attempts > 0 && lastResult !== "correct" && (
        <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", opacity: 0.5 }}>
          {attempts} attempt{attempts !== 1 ? "s" : ""} so far
        </div>
      )}

      {showHintTeaser && (
        <div style={{
          marginTop: "0.5rem",
          fontSize: "0.8rem",
          opacity: 0.4,
          fontStyle: "italic",
        }}>
          Hint available after {hintThreshold} attempts
        </div>
      )}

      {hint && (
        <div style={{
          marginTop: "1rem",
          padding: "0.75rem 1rem",
          borderRadius: "8px",
          background: "rgba(255, 235, 59, 0.08)",
          border: "1px solid rgba(255, 235, 59, 0.2)",
          fontSize: "0.85rem",
          lineHeight: 1.5,
          animation: "fadeSlideIn 0.3s ease-out",
        }}>
          <span style={{ fontWeight: 600, marginRight: "0.5rem" }}>Hint:</span>
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
        @keyframes redFlashAnim {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes fieldConfirmPulse {
          0% { box-shadow: 0 0 0 rgba(105, 240, 174, 0); transform: scale(1); }
          25% { box-shadow: 0 0 28px rgba(105, 240, 174, 0.85); transform: scale(1.015); }
          100% { box-shadow: 0 0 12px rgba(105, 240, 174, 0.35); transform: scale(1); }
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

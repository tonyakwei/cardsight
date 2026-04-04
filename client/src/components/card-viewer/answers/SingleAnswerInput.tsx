import { useState, useRef } from "react";
import { postAnswer } from "../../../api/cards";
import { getSessionHash } from "../../../utils/session";
import type { AnswerMeta } from "@cardsight/shared";

interface Props {
  cardId: string;
  answerMeta: AnswerMeta | null;
  onSolved: () => void;
}

export function SingleAnswerInput({ cardId, answerMeta, onSolved }: Props) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lastResult, setLastResult] = useState<"correct" | "incorrect" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!value.trim() || submitting) return;
    setSubmitting(true);
    setLastResult(null);

    try {
      const result = await postAnswer(cardId, value.trim(), getSessionHash());
      setAttempts(result.attemptNumber);

      if (result.correct) {
        setLastResult("correct");
        setTimeout(onSolved, 800);
      } else {
        setLastResult("incorrect");
        setShake(true);
        setTimeout(() => setShake(false), 500);
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
    <div style={{ marginTop: "2rem" }}>
      <div
        style={{
          animation: shake ? "shakeInput 0.4s ease-in-out" : undefined,
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
            placeholder="Type your answer..."
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
      `}</style>
    </div>
  );
}

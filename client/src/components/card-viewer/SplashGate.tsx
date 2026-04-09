import { useState } from "react";

interface Props {
  clueCategory: string | null;
  examineText: string | null;
  selfDestructTimer: number | null;
  onExamine: () => Promise<void>;
}

export function SplashGate({ clueCategory, examineText, selfDestructTimer, onExamine }: Props) {
  const [examining, setExamining] = useState(false);

  const handleExamine = async () => {
    setExamining(true);
    await onExamine();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60dvh",
        textAlign: "center",
        gap: "2.5rem",
        animation: "splashFadeIn 0.6s ease-out",
      }}
    >
      {clueCategory && (
        <div
          style={{
            fontSize: "1.4rem",
            fontWeight: 700,
            color: "var(--card-accent-color)",
            letterSpacing: "0.05em",
            lineHeight: 1.3,
          }}
        >
          {clueCategory}
        </div>
      )}

      <button
        onClick={handleExamine}
        disabled={examining}
        style={{
          padding: "1rem 3rem",
          fontSize: "1.1rem",
          fontWeight: 600,
          fontFamily: "var(--card-font-family)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          borderRadius: "12px",
          border: "1px solid var(--card-accent-color)",
          background: "rgba(255,255,255,0.04)",
          color: "var(--card-accent-color)",
          cursor: examining ? "wait" : "pointer",
          opacity: examining ? 0.6 : 1,
          transition: "all 0.2s ease",
        }}
      >
        {examining ? (
          <span style={{ opacity: 0.7 }}>...</span>
        ) : (
          examineText || "Examine"
        )}
      </button>

      <div
        style={{
          fontSize: "0.8rem",
          opacity: 0.5,
          fontStyle: "italic",
          maxWidth: "260px",
          lineHeight: 1.6,
        }}
      >
        Do not examine unless you're sure you need this clue!
      </div>

      {selfDestructTimer && (
        <div
          style={{
            fontSize: "0.7rem",
            opacity: 0.3,
            maxWidth: "240px",
            lineHeight: 1.5,
          }}
        >
          Content will be visible for {selfDestructTimer} seconds after examining
        </div>
      )}

      <style>{`
        @keyframes splashFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

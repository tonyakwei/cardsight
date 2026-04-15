import type { CardViewerResponse } from "@cardsight/shared";
import { CardContent } from "../CardContent";

interface Props {
  card: CardViewerResponse;
  justSolved: boolean;
}

export function AlreadyAnsweredState({ card, justSolved }: Props) {
  const isComplex = card.complexity === "complex";

  return (
    <div>
      {/* For complex cards that were just solved, show the revealed clue prominently */}
      {isComplex && card.clueContent ? (
        <CardContent
          header={card.header}
          description={card.clueContent}
          clueVisibleCategory={card.clueVisibleCategory}
        />
      ) : (
        <CardContent header={card.header} description={card.description} />
      )}

      <div
        style={{
          marginTop: "2rem",
          padding: "1.25rem",
          borderRadius: "12px",
          background: justSolved
            ? "rgba(105, 240, 174, 0.12)"
            : "rgba(255,255,255,0.05)",
          border: justSolved
            ? "1px solid rgba(105, 240, 174, 0.3)"
            : "1px solid rgba(255,255,255,0.1)",
          textAlign: "center",
          animation: justSolved ? "solvedPulse 0.6s ease-out" : undefined,
        }}
      >
        <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
          {justSolved ? "✓" : "✓"}
        </div>
        <div
          style={{
            fontSize: "0.95rem",
            fontWeight: 600,
            color: justSolved
              ? "#69f0ae"
              : "var(--card-accent-color)",
          }}
        >
          {justSolved
            ? isComplex ? "Item unlocked." : "Correct!"
            : isComplex ? "Item already unlocked." : "This puzzle has been solved"}
        </div>
        {!justSolved && (
          <div
            style={{
              fontSize: "0.8rem",
              opacity: 0.5,
              marginTop: "0.25rem",
            }}
          >
            Another team already cracked this one.
          </div>
        )}
      </div>

      <style>{`
        @keyframes solvedPulse {
          0% { transform: scale(0.95); opacity: 0; }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

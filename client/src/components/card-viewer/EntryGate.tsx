import { useState } from "react";
import type { CardViewerResponse } from "@cardsight/shared";

interface Props {
  card: CardViewerResponse;
  onEnter: () => Promise<void>;
}

export function EntryGate({ card, onEnter }: Props) {
  const [entering, setEntering] = useState(false);

  const handleEnter = async () => {
    setEntering(true);
    await onEnter();
  };

  const buttonText = card.entryGateText ?? "Enter";

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
        animation: "fadeIn 0.6s ease-out",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "0.7rem",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            opacity: 0.4,
            marginBottom: "0.75rem",
          }}
        >
          Card {card.humanCardId}
        </div>
        <h1
          style={{
            fontSize: "1.4rem",
            fontWeight: 700,
            color: "var(--card-accent-color)",
            lineHeight: 1.3,
          }}
        >
          {card.title}
        </h1>
      </div>

      <button
        onClick={handleEnter}
        disabled={entering}
        style={{
          padding: "1rem 3rem",
          fontSize: "1.1rem",
          fontWeight: 600,
          fontFamily: "var(--card-font-family)",
          letterSpacing: "0.05em",
          borderRadius: "12px",
          border: "1px solid var(--card-accent-color)",
          background: "rgba(255,255,255,0.04)",
          color: "var(--card-accent-color)",
          cursor: entering ? "wait" : "pointer",
          opacity: entering ? 0.6 : 1,
          transition: "all 0.2s ease",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {entering ? (
          <span style={{ opacity: 0.7 }}>...</span>
        ) : (
          buttonText
        )}
      </button>

      {card.selfDestructTimer && (
        <div
          style={{
            fontSize: "0.75rem",
            opacity: 0.35,
            fontStyle: "italic",
            maxWidth: "240px",
            lineHeight: 1.5,
          }}
        >
          Content will be visible for {card.selfDestructTimer} seconds after entry
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

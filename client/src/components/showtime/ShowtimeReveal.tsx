import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import type { ShowtimeSlotView } from "@cardsight/shared";
import { processQrianText } from "../../utils/qrian-text";

interface Props {
  revealTitle: string;
  revealDescription: string | null;
  slots: ShowtimeSlotView[];
}

export function ShowtimeReveal({ revealTitle, revealDescription, slots }: Props) {
  return (
    <div>
      <h1
        style={{
          fontSize: "1.6rem",
          fontWeight: 700,
          marginBottom: "1.25rem",
          color: "var(--card-accent-color)",
          lineHeight: 1.3,
          textAlign: "center",
        }}
      >
        {revealTitle}
      </h1>

      {revealDescription && (
        <div
          style={{
            fontSize: "0.95rem",
            lineHeight: 1.7,
            color: "var(--card-text-color)",
            opacity: 0.92,
            marginBottom: "1.5rem",
          }}
          className="card-description"
        >
          <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            components={{
              strong: ({ children }) => (
                <strong style={{ color: "var(--card-accent-color)", fontWeight: 600 }}>
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em style={{ color: "var(--card-secondary-color)", opacity: 0.85 }}>
                  {children}
                </em>
              ),
              blockquote: ({ children }) => (
                <blockquote
                  style={{
                    borderLeft: "3px solid var(--card-accent-color)",
                    paddingLeft: "1rem",
                    margin: "1rem 0",
                    opacity: 0.9,
                    fontStyle: "italic",
                  }}
                >
                  {children}
                </blockquote>
              ),
              p: ({ children }) => (
                <p style={{ marginBottom: "0.75rem" }}>{children}</p>
              ),
            }}
          >
            {processQrianText(revealDescription)}
          </ReactMarkdown>
        </div>
      )}

      {/* Slot contributions summary */}
      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          borderRadius: "8px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--card-text-color)",
            opacity: 0.5,
            marginBottom: "0.75rem",
          }}
        >
          Combined Analysis Data
        </div>
        {slots.map((slot) => (
          <div
            key={slot.id}
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "baseline",
              marginBottom: "0.5rem",
              paddingBottom: "0.5rem",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                color: slot.houseColor,
                minWidth: "60px",
              }}
            >
              {slot.houseName}
            </span>
            <span
              style={{
                fontSize: "0.85rem",
                fontFamily: "'Courier New', monospace",
                color: "var(--card-accent-color)",
              }}
            >
              {slot.inputValue}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

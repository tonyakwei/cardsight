import { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { CardViewerResponse } from "@cardsight/shared";
import { MemoryLockedState } from "./states/MemoryLockedState";

interface Props {
  card: CardViewerResponse;
  onExamine: () => Promise<void>;
}

const PARCHMENT_BG =
  "radial-gradient(ellipse at 20% 10%, rgba(255, 230, 180, 0.08), transparent 55%)," +
  "radial-gradient(ellipse at 80% 90%, rgba(255, 200, 140, 0.06), transparent 60%)," +
  "linear-gradient(180deg, #1c1410 0%, #14100c 100%)";

export function MemoryView({ card, onExamine }: Props) {
  if (card.status === "memory_locked") {
    return (
      <Shell>
        <MemoryLockedState
          reason={card.memoryLockReason ?? "no-cookie"}
          message={card.memoryLockMessage}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      {card.isExamined ? (
        <MemoryContent header={card.header} description={card.description} />
      ) : (
        <MemorySplash
          title={card.header ?? "A Trip Down Memory Lane"}
          onExamine={onExamine}
        />
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FontLink />
      <div
        style={{
          minHeight: "100dvh",
          background: PARCHMENT_BG,
          color: "rgba(245, 230, 200, 0.92)",
          fontFamily: "'Crimson Text', Georgia, serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <ParchmentGrain />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </div>
    </>
  );
}

function FontLink() {
  // Idempotent: only inject the link once per page load.
  useEffect(() => {
    const id = "memory-card-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400;1,600&display=swap";
    document.head.appendChild(link);
  }, []);
  return null;
}

function ParchmentGrain() {
  // Subtle vertical streaking + tiny dots, mimicking aged paper without an image asset.
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        backgroundImage:
          "repeating-linear-gradient(90deg, rgba(120, 70, 30, 0.025) 0 1px, transparent 1px 4px)," +
          "radial-gradient(circle at 25% 65%, rgba(180, 120, 60, 0.05) 0, transparent 1.5px)," +
          "radial-gradient(circle at 70% 30%, rgba(180, 120, 60, 0.04) 0, transparent 1.5px)," +
          "radial-gradient(circle at 50% 80%, rgba(180, 120, 60, 0.03) 0, transparent 1.5px)",
        backgroundSize: "auto, 18px 18px, 22px 22px, 26px 26px",
        opacity: 0.7,
      }}
    />
  );
}

const SPLASH_REVEAL_MS = 2400;

function MemorySplash({ title, onExamine }: { title: string; onExamine: () => Promise<void> }) {
  const [showButton, setShowButton] = useState(false);
  const [examining, setExamining] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowButton(true), SPLASH_REVEAL_MS);
    return () => clearTimeout(t);
  }, []);

  const handleClick = useCallback(async () => {
    setExamining(true);
    await onExamine();
  }, [onExamine]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2rem",
        padding: "2rem",
        textAlign: "center",
        animation: "memSplashFade 0.9s ease-out",
      }}
    >
      <div
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.34em",
          textTransform: "uppercase",
          color: "rgba(220, 180, 120, 0.55)",
        }}
      >
        Item
      </div>
      <h1
        style={{
          fontFamily: "'Cinzel', Georgia, serif",
          fontSize: "2.4rem",
          fontWeight: 600,
          letterSpacing: "0.04em",
          lineHeight: 1.2,
          color: "rgba(245, 230, 200, 0.95)",
          margin: 0,
          maxWidth: 360,
          textShadow: "0 0 30px rgba(255, 220, 160, 0.08)",
        }}
      >
        {title}
      </h1>
      {showButton && (
        <button
          onClick={handleClick}
          disabled={examining}
          style={{
            marginTop: "1rem",
            padding: "0.85rem 2.6rem",
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: "0.85rem",
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(245, 230, 200, 0.92)",
            background: "transparent",
            border: "1px solid rgba(220, 180, 120, 0.5)",
            borderRadius: 4,
            cursor: examining ? "wait" : "pointer",
            opacity: examining ? 0.55 : 1,
            transition: "all 0.25s ease",
            animation: "memSplashFade 0.9s ease-out",
          }}
          onMouseEnter={(e) =>
            !examining && (e.currentTarget.style.background = "rgba(220, 180, 120, 0.08)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {examining ? "..." : "Reflect"}
        </button>
      )}
      <style>{`
        @keyframes memSplashFade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function MemoryContent({
  header,
  description,
}: {
  header: string | null;
  description: string | null;
}) {
  return (
    <div
      style={{
        maxWidth: 620,
        margin: "0 auto",
        padding: "3rem 1.75rem 4rem",
        animation: "memContentFade 1.1s ease-out",
      }}
    >
      {header && (
        <h1
          style={{
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: "1.6rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: "rgba(220, 180, 120, 0.78)",
            textAlign: "center",
            marginBottom: "2.5rem",
            paddingBottom: "1.25rem",
            borderBottom: "1px solid rgba(180, 130, 70, 0.2)",
          }}
        >
          {header}
        </h1>
      )}
      {description && (
        <div
          className="memory-content-body"
          style={{
            fontFamily: "'Crimson Text', Georgia, serif",
            fontSize: "1.18rem",
            lineHeight: 1.75,
            color: "rgba(245, 230, 200, 0.92)",
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p style={{ marginBottom: "1.25rem" }}>{children}</p>
              ),
              em: ({ children }) => (
                <em
                  style={{
                    fontStyle: "italic",
                    color: "rgba(220, 180, 120, 0.92)",
                  }}
                >
                  {children}
                </em>
              ),
              strong: ({ children }) => (
                <strong style={{ color: "rgba(255, 220, 170, 0.95)", fontWeight: 600 }}>
                  {children}
                </strong>
              ),
              hr: () => (
                <hr
                  style={{
                    border: "none",
                    borderTop: "1px solid rgba(180, 130, 70, 0.25)",
                    margin: "1.75rem auto",
                    width: "40%",
                  }}
                />
              ),
              blockquote: ({ children }) => (
                <blockquote
                  style={{
                    borderLeft: "2px solid rgba(220, 180, 120, 0.4)",
                    paddingLeft: "1.1rem",
                    margin: "1.25rem 0",
                    fontStyle: "italic",
                    opacity: 0.92,
                  }}
                >
                  {children}
                </blockquote>
              ),
            }}
          >
            {description}
          </ReactMarkdown>
        </div>
      )}
      <style>{`
        @keyframes memContentFade {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

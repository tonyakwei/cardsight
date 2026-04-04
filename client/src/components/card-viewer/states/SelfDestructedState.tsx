import type { ReactNode } from "react";

interface Props {
  text: string | null;
  title?: string;
  children?: ReactNode; // answer input slot
}

export function SelfDestructedState({ text, title, children }: Props) {
  return (
    <div>
      <div style={{ textAlign: "center", padding: "2rem 0" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
            fontSize: "1.5rem",
          }}
        >
          ⌛
        </div>

        {title && (
          <h1
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              marginBottom: "1rem",
              color: "var(--card-accent-color)",
              lineHeight: 1.3,
            }}
          >
            {title}
          </h1>
        )}

        <p
          style={{
            fontSize: "0.9rem",
            opacity: 0.6,
            lineHeight: 1.6,
            fontStyle: "italic",
          }}
        >
          {text ?? "This card's information is no longer available."}
        </p>
      </div>

      {children}
    </div>
  );
}

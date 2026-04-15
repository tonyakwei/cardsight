import ReactMarkdown from "react-markdown";

interface Props {
  header: string | null;
  description: string | null;
  itemName?: string | null;
}

export function CardContent({ header, description, itemName }: Props) {
  return (
    <div>
      {itemName && (
        <div
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--card-accent-color)",
            opacity: 0.6,
            marginBottom: "0.5rem",
          }}
        >
          {itemName}
        </div>
      )}
      {header && (
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            marginBottom: "1.25rem",
            color: "var(--card-accent-color)",
            lineHeight: 1.3,
          }}
        >
          {header}
        </h1>
      )}

      {description && (
        <div
          style={{
            fontSize: "0.95rem",
            lineHeight: 1.7,
            color: "var(--card-text-color)",
            opacity: 0.92,
          }}
          className="card-description"
        >
          <ReactMarkdown
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
              code: ({ children }) => (
                <code
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    padding: "0.15em 0.4em",
                    borderRadius: "4px",
                    fontSize: "0.9em",
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    padding: "1rem",
                    borderRadius: "8px",
                    margin: "1rem 0",
                    overflowX: "auto",
                    fontSize: "0.85rem",
                    lineHeight: 1.6,
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  {children}
                </pre>
              ),
              p: ({ children }) => (
                <p style={{ marginBottom: "0.75rem" }}>{children}</p>
              ),
              hr: () => (
                <hr
                  style={{
                    border: "none",
                    borderTop: "1px solid var(--card-accent-color)",
                    opacity: 0.3,
                    margin: "1.5rem 0",
                  }}
                />
              ),
            }}
          >
            {description}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

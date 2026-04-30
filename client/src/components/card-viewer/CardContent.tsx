import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

interface Props {
  header: string | null;
  description: string | null;
  itemName?: string | null;
}

const GLYPH_RE = /\{\{\{(.+?)\}\}\}/g;

function replaceGlyphsInString(s: string, keyPrefix: string): React.ReactNode {
  if (!s.includes("{{{")) return s;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  GLYPH_RE.lastIndex = 0;
  while ((match = GLYPH_RE.exec(s)) !== null) {
    if (match.index > lastIndex) {
      parts.push(s.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={`${keyPrefix}-${i++}`} className="qrian-glyph">
        {match[1]}
      </span>,
    );
    lastIndex = GLYPH_RE.lastIndex;
  }
  if (lastIndex < s.length) parts.push(s.slice(lastIndex));
  return <>{parts}</>;
}

function withGlyphs(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child, idx) => {
    if (typeof child === "string") {
      return replaceGlyphsInString(child, String(idx));
    }
    return child;
  });
}

export function CardContent({ header, description, itemName }: Props) {
  return (
    <div>
      {itemName && (
        <div
          className="card-item-tag"
          style={{
            fontSize: "0.95rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--card-accent-color)",
            opacity: 0.6,
            marginBottom: "0.6rem",
          }}
        >
          {itemName}
        </div>
      )}
      {header && (
        <h1
          className="card-header"
          style={{
            fontSize: "3.5rem",
            fontWeight: 700,
            marginBottom: "1.5rem",
            color: "var(--card-accent-color)",
            lineHeight: 1.15,
            overflowWrap: "break-word",
            wordBreak: "break-word",
            hyphens: "auto",
          }}
        >
          {header}
        </h1>
      )}

      {description && (
        <div
          style={{
            fontSize: "1.25rem",
            lineHeight: 1.55,
            color: "var(--card-text-color)",
            opacity: 0.92,
          }}
          className="card-description"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              strong: ({ children }) => (
                <strong style={{ color: "var(--card-accent-color)", fontWeight: 600 }}>
                  {withGlyphs(children)}
                </strong>
              ),
              em: ({ children }) => (
                <em style={{ color: "var(--card-secondary-color)", opacity: 0.85 }}>
                  {withGlyphs(children)}
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
                <p style={{ marginBottom: "0.75rem" }}>{withGlyphs(children)}</p>
              ),
              li: ({ children }) => <li>{withGlyphs(children)}</li>,
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
              table: ({ children }) => (
                <div style={{ overflowX: "auto", margin: "1rem 0" }}>
                  <table className="card-table">{children}</table>
                </div>
              ),
              th: ({ children }) => <th>{withGlyphs(children)}</th>,
              td: ({ children }) => <td>{withGlyphs(children)}</td>,
            }}
          >
            {description}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

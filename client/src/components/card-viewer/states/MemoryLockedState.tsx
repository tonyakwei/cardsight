import type { MemoryLockReason } from "@cardsight/shared";

interface Props {
  reason: MemoryLockReason;
  message: string | null;
}

const NO_COOKIE_MESSAGE = "Tap your house's badge first to reflect.";

export function MemoryLockedState({ reason, message }: Props) {
  const body =
    reason === "no-cookie"
      ? NO_COOKIE_MESSAGE
      : message ??
        "Your team is far too busy fulfilling missions to reflect on their past. Do some more missions and try again.";

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          textAlign: "center",
          padding: "2.5rem 1.75rem",
          border: "1px solid rgba(120, 80, 40, 0.35)",
          borderRadius: 6,
          background:
            "radial-gradient(circle at 30% 20%, rgba(255, 240, 210, 0.06), transparent 70%), rgba(50, 35, 20, 0.55)",
          boxShadow: "0 0 50px rgba(0, 0, 0, 0.55) inset",
          fontFamily: "'Crimson Text', Georgia, serif",
        }}
      >
        <div
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(220, 180, 120, 0.55)",
            marginBottom: "1.25rem",
          }}
        >
          Not yet
        </div>
        <div
          style={{
            fontSize: "1.15rem",
            lineHeight: 1.65,
            color: "rgba(245, 230, 200, 0.88)",
            fontStyle: "italic",
          }}
        >
          {body}
        </div>
      </div>
    </div>
  );
}

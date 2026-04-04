interface Props {
  reason: string | null;
}

export function LockedOutState({ reason }: Props) {
  return (
    <div style={{ textAlign: "center", padding: "3rem 0" }}>
      <div
        style={{
          fontSize: "2rem",
          marginBottom: "1.5rem",
          opacity: 0.6,
        }}
      >
        🔒
      </div>
      <h2
        style={{
          fontSize: "1.2rem",
          fontWeight: 600,
          marginBottom: "1rem",
          color: "var(--card-accent-color)",
        }}
      >
        Access Restricted
      </h2>
      <p
        style={{
          fontSize: "0.9rem",
          opacity: 0.7,
          lineHeight: 1.6,
        }}
      >
        {reason ?? "This card is currently unavailable."}
      </p>
    </div>
  );
}

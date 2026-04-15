interface Props {
  itemSets: { cardSetName: string; cardSetColor: string; count: number }[];
}

export function RequiredItems({ itemSets }: Props) {
  return (
    <div style={{ marginTop: "1.5rem" }}>
      <div style={{
        fontSize: "0.75rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        opacity: 0.5,
        marginBottom: "0.75rem",
      }}>
        Required Items
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {itemSets.map((cs, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${cs.cardSetColor}33`,
            }}
          >
            <div style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: cs.cardSetColor,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: "0.9rem", color: cs.cardSetColor, fontWeight: 600 }}>
              {cs.cardSetName}
            </span>
            <span style={{ fontSize: "0.8rem", opacity: 0.5, marginLeft: "auto" }}>
              x{cs.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

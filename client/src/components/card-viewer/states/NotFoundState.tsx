export function NotFoundState() {
  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        color: "#666",
        fontFamily: "system-ui",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "2.5rem", marginBottom: "1rem", opacity: 0.5 }}>
        ?
      </div>
      <div style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
        Card not found
      </div>
      <div style={{ fontSize: "0.8rem", opacity: 0.6 }}>
        This QR code doesn't link to a valid card.
      </div>
    </div>
  );
}

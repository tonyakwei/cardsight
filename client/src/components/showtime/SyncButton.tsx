import { useState } from "react";
import type { ShowtimeSlotView } from "@cardsight/shared";

interface Props {
  slots: ShowtimeSlotView[];
  syncFailed: boolean;
  onPress: () => Promise<void>;
}

export function SyncButton({ slots, syncFailed, onPress }: Props) {
  const [pressing, setPressing] = useState(false);
  const mySlot = slots.find((s) => s.isMySlot);
  const iAlreadyPressed = mySlot?.syncPressed ?? false;
  const pressedCount = slots.filter((s) => s.syncPressed).length;

  const handlePress = async () => {
    if (pressing || iAlreadyPressed) return;
    setPressing(true);
    await onPress();
    setPressing(false);
  };

  return (
    <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
      {/* Sync status */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.75rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        {slots.map((slot) => (
          <div
            key={slot.id}
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: "4px",
              background: slot.syncPressed
                ? `${slot.houseColor}22`
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${slot.syncPressed ? slot.houseColor : "rgba(255,255,255,0.1)"}`,
              color: slot.syncPressed ? slot.houseColor : "rgba(255,255,255,0.4)",
            }}
          >
            {slot.houseName || `Slot ${slots.indexOf(slot) + 1}`}: {slot.syncPressed ? "Ready" : "Waiting"}
          </div>
        ))}
      </div>

      {/* Sync failed message */}
      {syncFailed && (
        <div
          style={{
            fontSize: "0.85rem",
            color: "#ff5252",
            marginBottom: "0.75rem",
            animation: "fadeSlideIn 0.3s ease-out",
          }}
        >
          Synchronization failed — press together!
        </div>
      )}

      {/* The big button */}
      <button
        onClick={handlePress}
        disabled={pressing || iAlreadyPressed}
        style={{
          padding: "1rem 2.5rem",
          fontSize: "1.1rem",
          fontWeight: 700,
          fontFamily: "inherit",
          background: iAlreadyPressed
            ? "rgba(105, 240, 174, 0.15)"
            : "var(--card-accent-color)",
          color: iAlreadyPressed ? "#69f0ae" : "#000",
          border: iAlreadyPressed
            ? "2px solid rgba(105, 240, 174, 0.3)"
            : "2px solid transparent",
          borderRadius: "12px",
          cursor: iAlreadyPressed ? "default" : pressing ? "wait" : "pointer",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          transition: "all 0.2s ease",
          width: "100%",
          maxWidth: "320px",
        }}
      >
        {iAlreadyPressed
          ? `Waiting... (${pressedCount}/${slots.length})`
          : "Analyze Results"}
      </button>

      <div
        style={{
          fontSize: "0.7rem",
          color: "var(--card-text-color)",
          opacity: 0.4,
          marginTop: "0.75rem",
        }}
      >
        All houses must press within seconds of each other
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

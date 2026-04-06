import { useState } from "react";
import type { ShowtimeSlotView } from "@cardsight/shared";

interface Props {
  slot: ShowtimeSlotView;
  phase: string;
  showHouseLabels: boolean;
  onSubmit: (slotId: string, value: string) => Promise<{ accepted: boolean; message: string }>;
}

export function ShowtimeSlot({ slot, phase, showHouseLabels, onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!value.trim() || submitting) return;
    setSubmitting(true);
    setRejected(null);
    const result = await onSubmit(slot.id, value.trim());
    if (!result.accepted) {
      setRejected(result.message);
      setValue("");
    }
    setSubmitting(false);
  };

  const isFilling = phase === "filling";
  // When house labels are hidden, any unfilled slot is editable by anyone
  // When house labels are shown, only your own slot is editable
  const canEdit = isFilling && !slot.isFilled && (showHouseLabels ? slot.isMySlot : true);

  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: "8px",
        border: `1px solid ${slot.isFilled ? (slot.houseColor ?? "#666") + "66" : "rgba(255,255,255,0.1)"}`,
        background: slot.isFilled
          ? `${slot.houseColor ?? "#666"}11`
          : "rgba(255,255,255,0.03)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "4px",
          height: "100%",
          backgroundColor: slot.isFilled
            ? slot.houseColor ?? "#666"
            : "rgba(255,255,255,0.1)",
          opacity: slot.isFilled ? 1 : 0.4,
        }}
      />

      <div style={{ marginLeft: "0.5rem" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.5rem",
          }}
        >
          <div>
            {slot.houseName && (
              <div
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: slot.houseColor,
                  opacity: 0.8,
                }}
              >
                {slot.houseName}
              </div>
            )}
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--card-text-color)",
              }}
            >
              {slot.label}
            </div>
          </div>
          {slot.isFilled && (
            <div
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                color: "#69f0ae",
                padding: "2px 8px",
                borderRadius: "4px",
                background: "rgba(105, 240, 174, 0.12)",
              }}
            >
              Data Received
            </div>
          )}
        </div>

        {slot.description && (
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--card-text-color)",
              opacity: 0.6,
              marginBottom: "0.75rem",
              lineHeight: 1.4,
            }}
          >
            {slot.description}
          </div>
        )}

        {/* Editable input */}
        {canEdit && (
          <div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setRejected(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Enter data..."
                style={{
                  flex: 1,
                  padding: "0.6rem 0.8rem",
                  fontSize: "0.9rem",
                  background: rejected
                    ? "rgba(255,82,82,0.06)"
                    : "rgba(255,255,255,0.06)",
                  border: `1px solid ${rejected ? "rgba(255,82,82,0.4)" : "rgba(255,255,255,0.15)"}`,
                  borderRadius: "6px",
                  color: "var(--card-text-color)",
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={!value.trim() || submitting}
                style={{
                  padding: "0.6rem 1.2rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  background: "var(--card-accent-color)",
                  color: "#000",
                  border: "none",
                  borderRadius: "6px",
                  cursor: submitting ? "wait" : "pointer",
                  opacity: !value.trim() || submitting ? 0.5 : 1,
                }}
              >
                {submitting ? "..." : "Submit"}
              </button>
            </div>
            {rejected && (
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#ff5252",
                  marginTop: "0.4rem",
                  animation: "fadeSlideIn 0.3s ease-out",
                }}
              >
                {rejected}
              </div>
            )}
            <style>{`
              @keyframes fadeSlideIn {
                from { opacity: 0; transform: translateY(-4px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
          </div>
        )}

        {/* Filled slot — show value */}
        {slot.isFilled && slot.inputValue && (
          <div
            style={{
              fontSize: "0.85rem",
              color: "var(--card-accent-color)",
              fontFamily: "'Courier New', monospace",
              padding: "0.5rem 0.75rem",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "4px",
            }}
          >
            {slot.inputValue}
          </div>
        )}

        {/* Unfilled + not editable (only when house labels on and not my slot) */}
        {!slot.isFilled && !canEdit && isFilling && (
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--card-text-color)",
              opacity: 0.4,
              fontStyle: "italic",
            }}
          >
            {slot.houseName
              ? `Waiting for ${slot.houseName}...`
              : "Awaiting data..."}
          </div>
        )}

        {/* After reveal: show everyone's values (if not already shown above) */}
        {phase === "revealed" && !slot.isFilled && (
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--card-text-color)",
              opacity: 0.4,
              fontStyle: "italic",
            }}
          >
            No data submitted
          </div>
        )}
      </div>
    </div>
  );
}

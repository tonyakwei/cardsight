import type { ShowtimeSlotView } from "@cardsight/shared";
import { ShowtimeSlot } from "./ShowtimeSlot";
import { SyncButton } from "./SyncButton";

interface Props {
  phase: string;
  slots: ShowtimeSlotView[];
  showHouseLabels: boolean;
  syncFailed: boolean;
  onSlotSubmit: (slotId: string, value: string) => Promise<{ accepted: boolean; message: string }>;
  onSyncPress: () => Promise<void>;
}

export function ShowtimeConsole({
  phase,
  slots,
  showHouseLabels,
  syncFailed,
  onSlotSubmit,
  onSyncPress,
}: Props) {
  const filledCount = slots.filter((s) => s.isFilled).length;
  const totalCount = slots.length;

  return (
    <div>
      {/* Console header */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--card-accent-color)",
            opacity: 0.6,
            marginBottom: "0.5rem",
          }}
        >
          Joint Analysis Console
        </div>
        <div
          style={{
            fontSize: "0.8rem",
            color: "var(--card-text-color)",
            opacity: 0.5,
          }}
        >
          {phase === "filling"
            ? `${filledCount} of ${totalCount} data sources connected`
            : phase === "syncing"
              ? "All data received — synchronized analysis required"
              : "Analysis complete"}
        </div>
      </div>

      {/* Progress bar */}
      {phase === "filling" && (
        <div
          style={{
            height: "3px",
            borderRadius: "2px",
            background: "rgba(255,255,255,0.08)",
            marginBottom: "1.25rem",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(filledCount / totalCount) * 100}%`,
              background: "var(--card-accent-color)",
              borderRadius: "2px",
              transition: "width 0.5s ease",
            }}
          />
        </div>
      )}

      {/* Slots */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {slots.map((slot) => (
          <ShowtimeSlot
            key={slot.id}
            slot={slot}
            phase={phase}
            showHouseLabels={showHouseLabels}
            onSubmit={onSlotSubmit}
          />
        ))}
      </div>

      {/* Sync button — only in syncing phase */}
      {phase === "syncing" && (
        <SyncButton
          slots={slots}
          syncFailed={syncFailed}
          onPress={onSyncPress}
        />
      )}
    </div>
  );
}

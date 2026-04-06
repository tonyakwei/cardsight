import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "react-router";
import {
  fetchShowtime,
  pollShowtime,
  submitSlot,
  pressSyncButton,
} from "../../api/showtime";
import { CardShell } from "../card-viewer/CardShell";
import { AnimationWrapper } from "../card-viewer/animations/AnimationWrapper";
import { OverlayRenderer } from "../card-viewer/overlays/OverlayRenderer";
import { ShowtimeConsole } from "./ShowtimeConsole";
import { ShowtimeReveal } from "./ShowtimeReveal";
import type {
  ShowtimePlayerResponse,
  ShowtimeSlotView,
  ShowtimePhase,
  CardDesign,
} from "@cardsight/shared";

export function ShowtimeViewer() {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const [searchParams] = useSearchParams();
  const houseId = searchParams.get("house") ?? "";

  const [data, setData] = useState<ShowtimePlayerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncFailed, setSyncFailed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPressedRef = useRef<boolean[]>([]);

  // Initial load
  const loadData = useCallback(async () => {
    if (!showtimeId || !houseId) {
      setError("Missing showtime ID or house parameter.");
      setLoading(false);
      return;
    }
    try {
      const d = await fetchShowtime(showtimeId, houseId);
      setData(d);
    } catch (err: any) {
      setError(err?.message ?? "Showtime not found or your house is not part of it.");
    } finally {
      setLoading(false);
    }
  }, [showtimeId, houseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling
  useEffect(() => {
    if (!showtimeId || !houseId || !data) return;
    if (data.phase === "revealed") return;

    const interval = data.phase === "syncing" ? 500 : 3000;

    intervalRef.current = setInterval(async () => {
      try {
        const poll = await pollShowtime(showtimeId, houseId);

        // Detect sync reset (presses went back to false)
        const currentPressed = poll.slots.map((s) => s.syncPressed);
        const prevPressed = prevPressedRef.current;
        if (
          prevPressed.length > 0 &&
          prevPressed.some((p) => p) &&
          currentPressed.every((p) => !p)
        ) {
          setSyncFailed(true);
          setTimeout(() => setSyncFailed(false), 3000);
        }
        prevPressedRef.current = currentPressed;

        setData((prev) =>
          prev
            ? {
                ...prev,
                phase: poll.phase,
                slots: poll.slots,
                revealedAt: poll.revealedAt,
                // If just revealed, we need the full data — refetch
                revealDescription:
                  poll.phase === "revealed" && prev.phase !== "revealed"
                    ? null // Will trigger refetch below
                    : prev.revealDescription,
              }
            : prev,
        );

        // Full refetch on phase transition to revealed (to get reveal description + design)
        if (poll.phase === "revealed") {
          const full = await fetchShowtime(showtimeId, houseId);
          setData(full);
        }
      } catch {
        // Ignore poll errors
      }
    }, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [showtimeId, houseId, data?.phase]);

  const handleSlotSubmit = useCallback(
    async (slotId: string, value: string) => {
      if (!showtimeId || !houseId) return { accepted: false, message: "Error" };
      const result = await submitSlot(showtimeId, houseId, slotId, value);
      if (result.accepted) {
        // Refetch to get updated state
        const d = await fetchShowtime(showtimeId, houseId);
        setData(d);
      }
      return result;
    },
    [showtimeId, houseId],
  );

  const handleSyncPress = useCallback(async () => {
    if (!showtimeId || !houseId) return;
    const result = await pressSyncButton(showtimeId, houseId);
    if (result.phase === "revealed") {
      const d = await fetchShowtime(showtimeId, houseId);
      setData(d);
    }
  }, [showtimeId, houseId]);

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid rgba(255,255,255,0.1)",
            borderTopColor: "#4fc3f7",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#888",
          fontFamily: "system-ui",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        {error || "Something went wrong."}
      </div>
    );
  }

  // Revealed state — wrap in CardShell with design + animation
  if (data.phase === "revealed") {
    return (
      <CardShell design={data.design}>
        <OverlayRenderer effect={data.design?.overlayEffect ?? null} />
        <AnimationWrapper type={data.design?.animationIn ?? "decrypt"}>
          <ShowtimeReveal
            revealTitle={data.revealTitle}
            revealDescription={data.revealDescription}
            slots={data.slots}
          />
        </AnimationWrapper>
      </CardShell>
    );
  }

  // Filling / Syncing state — use design for theming but show console
  return (
    <CardShell design={data.design}>
      <OverlayRenderer effect={data.design?.overlayEffect ?? null} />
      <ShowtimeConsole
        phase={data.phase}
        slots={data.slots}
        showHouseLabels={data.showHouseLabels}
        syncFailed={syncFailed}
        onSlotSubmit={handleSlotSubmit}
        onSyncPress={handleSyncPress}
      />
    </CardShell>
  );
}

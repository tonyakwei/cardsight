import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { fetchTimerState, pollTimerState } from "../../api/eventTimer";
import { DAY_THEMES } from "./dayThemes";
import type { EventTimerState } from "@cardsight/shared";

const POLL_MS = 3000;
const TICK_MS = 1000;
const CINZEL_FONT = "'Cinzel', serif";
const CINZEL_FONT_URL =
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800&display=swap";

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

interface Anchor {
  remainingMs: number;
  serverNow: number;
  status: EventTimerState["status"];
}

export function TimerDisplay() {
  const { gameId } = useParams<{ gameId: string }>();

  const [state, setState] = useState<EventTimerState | null>(null);
  const [displayMs, setDisplayMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const anchorRef = useRef<Anchor | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const applyState = useCallback((s: EventTimerState) => {
    setState(s);
    setError(null);
    anchorRef.current = {
      remainingMs: s.remainingMs,
      serverNow: new Date(s.serverNow).getTime(),
      status: s.status,
    };
    setDisplayMs(s.remainingMs);
  }, []);

  // Initial load
  useEffect(() => {
    if (!gameId) return;
    fetchTimerState(gameId)
      .then(applyState)
      .catch((err: any) => setError(err?.message ?? "Failed to load timer"));
  }, [gameId, applyState]);

  // Poll every 3s
  useEffect(() => {
    if (!gameId) return;
    const id = setInterval(() => {
      pollTimerState(gameId).then(applyState).catch(() => {});
    }, POLL_MS);
    return () => clearInterval(id);
  }, [gameId, applyState]);

  // Local 1s tick between polls, anchored to the last known server time
  useEffect(() => {
    const id = setInterval(() => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      if (anchor.status !== "running") {
        setDisplayMs(anchor.remainingMs);
        return;
      }
      const elapsed = Date.now() - anchor.serverNow;
      setDisplayMs(Math.max(0, anchor.remainingMs - elapsed));
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Screen Wake Lock — keep the phone awake for the AirPlay mirror
  const acquireWakeLock = useCallback(async () => {
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> };
    };
    if (!nav.wakeLock) return;
    try {
      const lock = await nav.wakeLock.request("screen");
      wakeLockRef.current = lock;
    } catch {
      // Ignore — will retry on next visibility change
    }
  }, []);

  useEffect(() => {
    acquireWakeLock();
    const onVis = () => {
      if (document.visibilityState === "visible") acquireWakeLock();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [acquireWakeLock]);

  // Load Cinzel from Google Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = CINZEL_FONT_URL;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  if (error) {
    return (
      <div style={fullScreenStyle("#0a0a0a")}>
        <div style={{ color: "#888", fontFamily: CINZEL_FONT, textAlign: "center", padding: "2rem" }}>
          {error}
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div style={fullScreenStyle("#0a0a0a")}>
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid rgba(255,255,255,0.1)",
            borderTopColor: "#fff",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  const theme = DAY_THEMES[state.day] ?? DAY_THEMES[1];
  const showOverride = state.overrideText != null;

  return (
    <div
      style={{
        ...fullScreenStyle(theme.horizon),
        background: theme.sky,
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "6%",
          fontFamily: CINZEL_FONT,
          fontSize: "clamp(4rem, 8.8vw, 8rem)",
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.75)",
          textShadow: "0 2px 12px rgba(0,0,0,0.4)",
        }}
      >
        {theme.label.split(" · ")[0]}
      </div>

      {state.status === "paused" && !showOverride && (
        <div
          style={{
            position: "absolute",
            top: "16%",
            fontFamily: CINZEL_FONT,
            fontSize: "clamp(0.8rem, 1.6vw, 1.4rem)",
            letterSpacing: "0.2em",
            padding: "0.3em 1em",
            borderRadius: 999,
            background: "rgba(0,0,0,0.35)",
            color: "#ffd54a",
            border: "1px solid rgba(255,213,74,0.5)",
          }}
        >
          PAUSED
        </div>
      )}

      {showOverride ? (
        <div
          style={{
            fontFamily: CINZEL_FONT,
            fontWeight: 700,
            fontSize: "clamp(2rem, 7vw, 6rem)",
            color: "#fff",
            textAlign: "center",
            padding: "0 5vw",
            textShadow: "0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          {state.overrideText}
        </div>
      ) : (
        <div
          style={{
            fontFamily: CINZEL_FONT,
            fontWeight: 700,
            fontSize: "clamp(4rem, 22vw, 22rem)",
            color: "#fff",
            textShadow: "0.03em 0.04em 0 rgba(0,0,0,0.55)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatDuration(displayMs)}
        </div>
      )}

      <div className="timer-rotate-nudge">Rotate to landscape</div>
      <style>{`
        .timer-rotate-nudge {
          display: none;
        }
        @media (orientation: portrait) {
          .timer-rotate-nudge {
            display: flex;
            position: absolute;
            inset: 0;
            align-items: center;
            justify-content: center;
            background: rgba(0,0,0,0.75);
            color: #fff;
            font-family: 'Cinzel', serif;
            font-size: 1.5rem;
            text-align: center;
            padding: 2rem;
            z-index: 10;
          }
        }
      `}</style>
    </div>
  );
}

function fullScreenStyle(background: string): React.CSSProperties {
  return {
    width: "100dvw",
    height: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background,
  };
}

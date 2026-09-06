import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { fetchTimerState, pollTimerState } from "../../api/eventTimer";
import { DAY_THEMES } from "./dayThemes";
import { endingCaptionParts } from "./templeEndingConfig";
import type { EventTimerState } from "@cardsight/shared";

const POLL_MS = 2000;
const TICK_MS = 1000;
const CINZEL_FONT = "'Cinzel', serif";
const CINZEL_FONT_URL =
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800&display=swap";

interface TribunalPayload {
  title: string;
  subtitle?: string;
  meetings: { label: string; teams: [string, string] }[];
}

interface ArtifactPayload {
  artifactName: string;
  label: string;
  imageUrl: string;
  /** 1-based position in the ending stack, and how many endings play in all. */
  index?: number;
  total?: number;
}

interface EndingPayload {
  title: string;
}

interface VanishingPayload {
  /** Optional message shown beneath the title art, e.g. "Kick off at 6:55 PM". */
  text: string | null;
}

const VANISHING_BACKGROUND_URL = "/assets/vanishing/background.png";
const VANISHING_TITLE_URL = "/assets/vanishing/title.png";

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

  // Poll every 2s
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
  const tribunalPayload = getTribunalPayload(state);
  const artifactPayload = getArtifactPayload(state);
  const endingPayload = getEndingPayload(state);

  if (state.displayMode === "artifact" && artifactPayload) {
    return <ArtifactDisplay payload={artifactPayload} />;
  }

  if (state.displayMode === "ending" && endingPayload) {
    return <EndingDisplay title={endingPayload.title} />;
  }

  if (state.displayMode === "vanishing") {
    return <VanishingDisplay text={getVanishingPayload(state).text} />;
  }

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
      {state.displayMode !== "tribunal" && (
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
      )}

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
            fontSize:
              state.displayMode === "tribunal"
                ? "clamp(3rem, 8vw, 8rem)"
                : "clamp(4rem, 22vw, 22rem)",
            color: "#fff",
            textShadow: "0.03em 0.04em 0 rgba(0,0,0,0.55)",
            fontVariantNumeric: "tabular-nums",
            position: state.displayMode === "tribunal" ? "absolute" : "static",
            bottom: state.displayMode === "tribunal" ? "5%" : undefined,
          }}
        >
          {formatDuration(displayMs)}
        </div>
      )}

      {state.displayMode === "tribunal" && tribunalPayload && (
        <TribunalDisplay payload={tribunalPayload} />
      )}
    </div>
  );
}

function getPayloadRecord(state: EventTimerState): Record<string, unknown> | null {
  const payload = state.displayPayload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  return payload as Record<string, unknown>;
}

function getTribunalPayload(state: EventTimerState): TribunalPayload | null {
  const payload = getPayloadRecord(state);
  if (!payload) return null;
  if (typeof payload.title !== "string" || !Array.isArray(payload.meetings)) return null;
  const meetings = payload.meetings.filter(isMeetingPayload);
  if (meetings.length === 0) return null;
  return {
    title: payload.title,
    subtitle: typeof payload.subtitle === "string" ? payload.subtitle : undefined,
    meetings,
  };
}

function isMeetingPayload(value: unknown): value is TribunalPayload["meetings"][number] {
  if (!value || typeof value !== "object") return false;
  const meeting = value as { label?: unknown; teams?: unknown };
  return (
    typeof meeting.label === "string" &&
    Array.isArray(meeting.teams) &&
    meeting.teams.length === 2 &&
    typeof meeting.teams[0] === "string" &&
    typeof meeting.teams[1] === "string"
  );
}

function getArtifactPayload(state: EventTimerState): ArtifactPayload | null {
  const payload = getPayloadRecord(state);
  if (!payload) return null;
  if (
    typeof payload.artifactName !== "string" ||
    typeof payload.label !== "string" ||
    typeof payload.imageUrl !== "string"
  ) {
    return null;
  }
  return {
    artifactName: payload.artifactName,
    label: payload.label,
    imageUrl: payload.imageUrl,
    index: typeof payload.index === "number" ? payload.index : undefined,
    total: typeof payload.total === "number" ? payload.total : undefined,
  };
}

function getEndingPayload(state: EventTimerState): EndingPayload | null {
  const payload = getPayloadRecord(state);
  if (!payload || typeof payload.title !== "string") return null;
  return { title: payload.title };
}

function getVanishingPayload(state: EventTimerState): VanishingPayload {
  const payload = getPayloadRecord(state);
  const text =
    typeof payload?.text === "string" && payload.text.trim().length > 0 ? payload.text : null;
  return { text };
}

function TribunalDisplay({ payload }: { payload: TribunalPayload }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "7vh 6vw 32vh",
        gap: "3vh",
        pointerEvents: "none",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: CINZEL_FONT,
            fontSize: "clamp(3rem, 8vw, 7.5rem)",
            fontWeight: 800,
            color: "#fff",
            textShadow: "0 4px 24px rgba(0,0,0,0.55)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {payload.title}
        </div>
        {payload.subtitle && (
          <div
            style={{
              marginTop: "0.4rem",
              fontFamily: CINZEL_FONT,
              fontSize: "clamp(1rem, 2vw, 1.8rem)",
              color: "rgba(255,255,255,0.78)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            {payload.subtitle}
          </div>
        )}
      </div>

      <div
        style={{
          width: "min(1200px, 92vw)",
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "2vw",
        }}
      >
        {payload.meetings.map((meeting) => (
          <div
            key={meeting.label}
            style={{
              minHeight: "22vh",
              border: "1px solid rgba(255,255,255,0.28)",
              background: "rgba(0,0,0,0.34)",
              boxShadow: "0 20px 70px rgba(0,0,0,0.28)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "2.5vw",
            }}
          >
            <div
              style={{
                fontFamily: CINZEL_FONT,
                fontSize: "clamp(0.9rem, 1.5vw, 1.35rem)",
                color: "#ffd54a",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginBottom: "1rem",
              }}
            >
              {meeting.label}
            </div>
            <div
              style={{
                fontFamily: CINZEL_FONT,
                fontSize: "clamp(2rem, 4.8vw, 5rem)",
                fontWeight: 700,
                color: "#fff",
                textAlign: "center",
                lineHeight: 1.05,
              }}
            >
              {meeting.teams[0]}
            </div>
            <div
              style={{
                fontFamily: CINZEL_FONT,
                fontSize: "clamp(1rem, 2vw, 2rem)",
                color: "rgba(255,255,255,0.68)",
                margin: "0.5rem 0",
              }}
            >
              meets
            </div>
            <div
              style={{
                fontFamily: CINZEL_FONT,
                fontSize: "clamp(2rem, 4.8vw, 5rem)",
                fontWeight: 700,
                color: "#fff",
                textAlign: "center",
                lineHeight: 1.05,
              }}
            >
              {meeting.teams[1]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * A Day 3 ending plate: the image full-bleed, a golden seal top-left counting the
 * ending's place in the stack, and a hovering caption naming the artifact that
 * caused it. Every size is a share of the viewport so it holds at TV scale.
 */
function ArtifactDisplay({ payload }: { payload: ArtifactPayload }) {
  const caption = endingCaptionParts(payload.artifactName);
  const showSeal = payload.index != null && payload.total != null && payload.total > 0;

  return (
    <div style={{ ...fullScreenStyle("#050505"), position: "relative", overflow: "hidden" }}>
      <img
        key={payload.imageUrl}
        src={payload.imageUrl}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          animation: "artifactFade 700ms ease-out both",
          background: "#050505",
        }}
      />

      {showSeal && (
        <div key={`seal-${payload.imageUrl}`} style={SEAL_STYLE}>
          <div style={SEAL_RATIO_STYLE}>
            {payload.index}
            <span style={{ fontWeight: 700, opacity: 0.62, margin: "0 0.06em" }}>/</span>
            {payload.total}
          </div>
          <div style={SEAL_SHEEN_STYLE} />
        </div>
      )}

      <div key={`band-${payload.imageUrl}`} style={BAND_STYLE}>
        <div style={BAND_TEXT_STYLE}>
          {caption.before}
          <span style={BAND_NAME_STYLE}>{caption.name}</span>
          {caption.after}
        </div>
      </div>

      <style>{`
        @keyframes artifactFade {
          from { opacity: 0; transform: scale(1.012); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes endingChromeFade {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const SEAL_STYLE: React.CSSProperties = {
  position: "absolute",
  zIndex: 3,
  top: "4.2%",
  left: "3%",
  width: "12.6%",
  aspectRatio: "1",
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  color: "#2b1d04",
  background:
    "radial-gradient(circle at 36% 26%, #fff8de 0%, #f0d88c 9%, #dcae42 33%, #b8821f 61%, #7c5612 85%, #573b0b 100%)",
  boxShadow:
    "inset 0 2px 3px rgba(255,255,255,.75), inset 0 -3px 6px rgba(60,38,0,.6), 0 0 0 2px rgba(74,52,10,.85), 0 10px 26px rgba(0,0,0,.62)",
  textShadow: "0 1px 0 rgba(255,247,214,.6)",
  animation: "endingChromeFade 800ms ease-out 220ms both",
};

const SEAL_RATIO_STYLE: React.CSSProperties = {
  gridArea: "1 / 1",
  fontFamily: CINZEL_FONT,
  fontWeight: 900,
  fontSize: "clamp(16px, 3.9vw, 120px)",
  lineHeight: 1,
  letterSpacing: "0.01em",
  whiteSpace: "nowrap",
};

const SEAL_SHEEN_STYLE: React.CSSProperties = {
  gridArea: "1 / 1",
  alignSelf: "stretch",
  justifySelf: "stretch",
  borderRadius: "50%",
  background:
    "linear-gradient(150deg, rgba(255,255,255,.20) 0%, rgba(255,255,255,0) 34%, rgba(0,0,0,.30) 100%)",
  pointerEvents: "none",
};

const BAND_STYLE: React.CSSProperties = {
  position: "absolute",
  zIndex: 2,
  left: 0,
  right: 0,
  bottom: 0,
  padding: "3.2% 6% 3.6%",
  background:
    "linear-gradient(180deg, rgba(6,5,3,0) 0%, rgba(6,5,3,.72) 34%, rgba(6,5,3,.93) 100%)",
  borderTop: "1px solid rgba(217,172,69,.55)",
  textAlign: "center",
  animation: "endingChromeFade 800ms ease-out 220ms both",
};

const BAND_TEXT_STYLE: React.CSSProperties = {
  fontFamily: CINZEL_FONT,
  fontWeight: 700,
  fontSize: "clamp(13px, 2.75vw, 88px)",
  lineHeight: 1.15,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  color: "#fbf4e2",
  textShadow: "0 2px 14px rgba(0,0,0,.85)",
};

const BAND_NAME_STYLE: React.CSSProperties = {
  color: "#f3c95e",
  textShadow: "0 2px 14px rgba(0,0,0,.9), 0 0 24px rgba(217,172,69,.28)",
};

function EndingDisplay({ title }: { title: string }) {
  return (
    <div
      style={{
        ...fullScreenStyle("#050505"),
        flexDirection: "column",
        background:
          "radial-gradient(circle at center, rgba(255,213,74,0.18), transparent 35%), linear-gradient(180deg, #070707, #15100a 55%, #050505)",
        color: "#fff",
        textAlign: "center",
        padding: "8vw",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontFamily: CINZEL_FONT,
          fontSize: "clamp(1rem, 2vw, 1.8rem)",
          color: "rgba(255,213,74,0.78)",
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          marginBottom: "1.2rem",
        }}
      >
        The expedition's legacy
      </div>
      <div
        key={title}
        style={{
          fontFamily: CINZEL_FONT,
          fontSize: "clamp(3.4rem, 10vw, 9rem)",
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          textShadow: "0 6px 40px rgba(0,0,0,0.7)",
          animation: "endingFade 850ms ease-out both",
        }}
      >
        {title}
      </div>
      <style>{`
        @keyframes endingFade {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/**
 * Ambient "kickoff" screen: the poster art (with the "Mystery Room Presents..." banner
 * baked into the image) full-bleed, the specially-designed "THE VANISHING" title art on
 * top, and an optional message beneath it (e.g. "Kick off at 6:55 PM"). The whole group
 * fades in, holds, fades out, and holds blank on a 20s loop (1.5s in, 12s hold, 1.5s out,
 * 5s blank) — same pacing as the pre-rendered YouTube loop this replaces.
 */
function VanishingDisplay({ text }: { text: string | null }) {
  return (
    <div style={{ ...fullScreenStyle("#000"), position: "relative", overflow: "hidden" }}>
      <img
        src={VANISHING_BACKGROUND_URL}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <div
        key={text ?? "_default"}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "2.5vh",
          padding: "0 6vw",
          animation: "vanishTextPulse 20s linear infinite",
        }}
      >
        <img
          src={VANISHING_TITLE_URL}
          alt="The Vanishing"
          style={{ width: "min(74vw, 1400px)", maxHeight: "48vh", objectFit: "contain" }}
        />
        {text && (
          <div
            style={{
              fontFamily: CINZEL_FONT,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              textAlign: "center",
              color: "#fff",
              WebkitTextStroke: "0.03em rgba(0,0,0,0.9)",
              textShadow: "0 0.05em 0.3em rgba(0,0,0,0.55), 0 0 1em rgba(0,0,0,0.35)",
              fontSize: vanishingSubtitleFontSize(text),
            }}
          >
            {text}
          </div>
        )}
      </div>
      <style>{`
        @keyframes vanishTextPulse {
          0% { opacity: 0; }
          7.5% { opacity: 1; }
          67.5% { opacity: 1; }
          75% { opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function vanishingSubtitleFontSize(text: string): string {
  const len = text.length;
  if (len <= 20) return "clamp(1.7rem, 5.2vw, 4.6rem)";
  if (len <= 32) return "clamp(1.45rem, 4vw, 3.6rem)";
  return "clamp(1.2rem, 3vw, 2.8rem)";
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

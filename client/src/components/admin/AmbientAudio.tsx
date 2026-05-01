import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import {
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Badge,
  Switch,
  ScrollArea,
} from "@mantine/core";
import { fetchAudioFeed, type AudioFeedEvent } from "../../api/admin";

const POLL_MS = 1500;
const STAGGER_MS = 450;
const CATCHUP_MAX_MS = 8000;

const SOUND_FILES: Record<AudioFeedEvent["type"], string> = {
  card_correct: "/audio/gong.mp3",
  card_incorrect: "/audio/bum-bum.mp3",
  mission_correct: "/audio/gong.mp3",
  mission_incorrect: "/audio/bum-bum.mp3",
};

const TYPE_LABELS: Record<AudioFeedEvent["type"], string> = {
  card_correct: "Card solved",
  card_incorrect: "Card miss",
  mission_correct: "Mission complete",
  mission_incorrect: "Mission miss",
};

type WakeStatus = "off" | "held" | "released" | "unsupported";

export function AmbientAudio() {
  const { gameId } = useParams<{ gameId: string }>();

  const [running, setRunning] = useState(false);
  const [includeCardEvents, setIncludeCardEvents] = useState(true);
  const [wakeStatus, setWakeStatus] = useState<WakeStatus>("off");
  const [recent, setRecent] = useState<AudioFeedEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cursorRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playQueueRef = useRef<AudioFeedEvent[]>([]);
  const playingRef = useRef(false);
  const audiosRef = useRef<Record<string, HTMLAudioElement>>({});
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const includeCardEventsRef = useRef(includeCardEvents);

  useEffect(() => {
    includeCardEventsRef.current = includeCardEvents;
  }, [includeCardEvents]);

  const playNextInQueue = useCallback(() => {
    if (playingRef.current) return;
    const next = playQueueRef.current.shift();
    if (!next) return;
    playingRef.current = true;
    const audio = audiosRef.current[SOUND_FILES[next.type]];
    if (!audio) {
      playingRef.current = false;
      setTimeout(playNextInQueue, 0);
      return;
    }
    const finish = () => {
      playingRef.current = false;
      setTimeout(playNextInQueue, STAGGER_MS);
    };
    try {
      audio.currentTime = 0;
      const p = audio.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          // Wait for "ended" to advance, but cap with a fallback in case
          // metadata isn't loaded.
          const onEnded = () => {
            audio.removeEventListener("ended", onEnded);
            finish();
          };
          audio.addEventListener("ended", onEnded);
          setTimeout(() => {
            audio.removeEventListener("ended", onEnded);
            if (playingRef.current) finish();
          }, 4000);
        }).catch(() => finish());
      } else {
        setTimeout(finish, 1500);
      }
    } catch {
      finish();
    }
  }, []);

  const enqueue = useCallback(
    (events: AudioFeedEvent[]) => {
      const filtered = includeCardEventsRef.current
        ? events
        : events.filter(
            (e) => e.type === "mission_correct" || e.type === "mission_incorrect",
          );
      if (filtered.length === 0) return;
      playQueueRef.current.push(...filtered);
      playNextInQueue();
    },
    [playNextInQueue],
  );

  const tick = useCallback(async () => {
    if (!gameId) return;
    try {
      const data = await fetchAudioFeed(gameId, cursorRef.current);
      cursorRef.current = data.cursor;
      if (data.events.length > 0) {
        setRecent((prev) => [...data.events, ...prev].slice(0, 25));
        enqueue(data.events);
      }
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Poll failed");
    }
  }, [gameId, enqueue]);

  // Polling loop
  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    const loop = async () => {
      if (cancelled) return;
      await tick();
      if (cancelled) return;
      pollTimerRef.current = setTimeout(loop, POLL_MS);
    };
    loop();
    return () => {
      cancelled = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [running, tick]);

  // Wake lock acquire/release on visibility changes
  const acquireWakeLock = useCallback(async () => {
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> };
    };
    if (!nav.wakeLock) {
      setWakeStatus("unsupported");
      return;
    }
    try {
      const lock = await nav.wakeLock.request("screen");
      wakeLockRef.current = lock;
      setWakeStatus("held");
      lock.addEventListener("release", () => {
        if (wakeLockRef.current === lock) {
          setWakeStatus("released");
        }
      });
    } catch {
      setWakeStatus("released");
    }
  }, []);

  useEffect(() => {
    if (!running) return;
    const onVis = () => {
      if (document.visibilityState === "visible") {
        // Re-acquire wake lock when tab is foregrounded.
        acquireWakeLock();
        // Drop stale catch-up: jump cursor near now to avoid sound floods.
        const cutoff = new Date(Date.now() - CATCHUP_MAX_MS).toISOString();
        if (!cursorRef.current || cursorRef.current < cutoff) {
          cursorRef.current = cutoff;
        }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [running, acquireWakeLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, []);

  const handleStart = useCallback(async () => {
    // Preload audio elements during the user gesture so iOS allows them later.
    const unique = Array.from(new Set(Object.values(SOUND_FILES)));
    for (const src of unique) {
      if (!audiosRef.current[src]) {
        const el = new Audio(src);
        el.preload = "auto";
        // A silent play+pause primes iOS to allow programmatic playback later.
        try {
          el.muted = true;
          await el.play().catch(() => {});
          el.pause();
          el.currentTime = 0;
          el.muted = false;
        } catch {
          /* ignore */
        }
        audiosRef.current[src] = el;
      }
    }
    // Initialize cursor to "now" so we don't replay history on startup.
    cursorRef.current = new Date().toISOString();
    await acquireWakeLock();
    setRunning(true);
  }, [acquireWakeLock]);

  const handleStop = useCallback(() => {
    setRunning(false);
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    playQueueRef.current = [];
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
    setWakeStatus("off");
  }, []);

  const testSound = useCallback(
    (type: AudioFeedEvent["type"]) => {
      if (!running) return;
      enqueue([
        {
          id: `test-${Date.now()}`,
          type,
          at: new Date().toISOString(),
          house: null,
        },
      ]);
    },
    [enqueue, running],
  );

  const wakeColor =
    wakeStatus === "held"
      ? "green"
      : wakeStatus === "released"
        ? "yellow"
        : wakeStatus === "unsupported"
          ? "red"
          : "gray";

  const wakeLabel =
    wakeStatus === "held"
      ? "🔒 Awake"
      : wakeStatus === "released"
        ? "💤 Sleeping"
        : wakeStatus === "unsupported"
          ? "Wake lock unsupported"
          : "Wake lock off";

  return (
    <Stack gap="lg" style={{ maxWidth: 640 }}>
      <div>
        <Text size="xl" fw={600} c="yellow.5">
          Ambient Audio
        </Text>
        <Text size="sm" c="dimmed" mt={4}>
          Park this page on a phone hooked to a Bluetooth speaker. It plays a
          gong on every correct answer and a low &quot;bum-bum&quot; on every
          miss, polling every {Math.round(POLL_MS / 1000)}s.
        </Text>
      </div>

      <Paper p="md" withBorder bg="dark.8">
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <Badge color={running ? "green" : "gray"} variant="light">
              {running ? "● Live" : "○ Idle"}
            </Badge>
            <Badge color={wakeColor} variant="light">
              {wakeLabel}
            </Badge>
          </Group>
          {!running ? (
            <Button color="yellow" onClick={handleStart}>
              Start ambience
            </Button>
          ) : (
            <Button color="gray" variant="light" onClick={handleStop}>
              Stop
            </Button>
          )}
        </Group>

        <Switch
          checked={includeCardEvents}
          onChange={(e) => setIncludeCardEvents(e.currentTarget.checked)}
          label="Include card answer events"
          description="Off = only mission successes/misses (sparser, more dramatic)."
          color="yellow"
        />

        {running && (
          <Group gap="xs" mt="md">
            <Button size="xs" variant="default" onClick={() => testSound("mission_correct")}>
              Test gong
            </Button>
            <Button size="xs" variant="default" onClick={() => testSound("mission_incorrect")}>
              Test bum-bum
            </Button>
          </Group>
        )}

        {error && (
          <Text size="xs" c="red.4" mt="xs">
            {error}
          </Text>
        )}
      </Paper>

      <Paper p="md" withBorder bg="dark.8">
        <Text size="sm" fw={600} mb="xs">
          Recent events
        </Text>
        {recent.length === 0 ? (
          <Text size="xs" c="dimmed">
            Waiting for activity…
          </Text>
        ) : (
          <ScrollArea h={280}>
            <Stack gap={6}>
              {recent.map((e) => {
                const correct =
                  e.type === "card_correct" || e.type === "mission_correct";
                return (
                  <Group key={e.id} gap="xs" wrap="nowrap">
                    <Text size="xs" c="dimmed" style={{ width: 64 }}>
                      {new Date(e.at).toLocaleTimeString()}
                    </Text>
                    <Badge
                      size="xs"
                      color={correct ? "green" : "red"}
                      variant="light"
                    >
                      {TYPE_LABELS[e.type]}
                    </Badge>
                    {e.house && (
                      <Badge
                        size="xs"
                        variant="light"
                        styles={{
                          root: { backgroundColor: e.house.color + "33", color: "#eee" },
                        }}
                      >
                        {e.house.name}
                      </Badge>
                    )}
                  </Group>
                );
              })}
            </Stack>
          </ScrollArea>
        )}
      </Paper>
    </Stack>
  );
}

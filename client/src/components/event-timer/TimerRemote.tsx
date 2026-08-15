import { useCallback, useState } from "react";
import { useParams } from "react-router";
import { Badge, Button, Group, Paper, Stack, Text, TextInput } from "@mantine/core";
import {
  fetchTimerState,
  pauseTimer,
  resumeTimer,
  setTimerDay,
  setTimerOverrideText,
  setTimerOverrideTime,
} from "../../api/eventTimer";
import { DAY_THEMES } from "./dayThemes";
import { usePolling } from "../../hooks/usePolling";
import type { EventTimerState } from "@cardsight/shared";

const POLL_MS = 3000;

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function parseMmSs(input: string): number | null {
  const match = input.trim().match(/^(\d{1,3}):([0-5]?\d)$/);
  if (!match) return null;
  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  return (minutes * 60 + seconds) * 1000;
}

export function TimerRemote() {
  const { gameId } = useParams<{ gameId: string }>();

  const [state, setState] = useState<EventTimerState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [timeInput, setTimeInput] = useState("");
  const [messageInput, setMessageInput] = useState("");

  const load = useCallback(async () => {
    if (!gameId) return;
    try {
      const data = await fetchTimerState(gameId);
      setState(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load timer");
    }
  }, [gameId]);

  usePolling(load, POLL_MS);

  const withBusy = useCallback(
    async (fn: () => Promise<EventTimerState>) => {
      setBusy(true);
      try {
        const data = await fn();
        setState(data);
        setError(null);
      } catch (err: any) {
        setError(err?.message ?? "Action failed");
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  if (!gameId) return null;

  const isPaused = state?.status === "paused";

  return (
    <Stack gap="lg" style={{ maxWidth: 560 }}>
      <div>
        <Text size="xl" fw={600} c="yellow.5">
          Timer Remote
        </Text>
        <Text size="sm" c="dimmed" mt={4}>
          Controls the countdown shown on{" "}
          <code>/timer/{gameId}</code>. Open that URL on the AirPlay phone.
        </Text>
      </div>

      <Paper p="md" withBorder bg="dark.8">
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <Badge color={isPaused ? "yellow" : "green"} variant="light">
              {isPaused ? "⏸ Paused" : "▶ Running"}
            </Badge>
            {state?.overrideText && (
              <Badge color="blue" variant="light">
                Message override active
              </Badge>
            )}
          </Group>
          <Text size="lg" fw={700} ff="monospace">
            {state ? formatDuration(state.remainingMs) : "--:--"}
          </Text>
        </Group>

        <Group>
          {isPaused ? (
            <Button
              color="green"
              loading={busy}
              onClick={() => gameId && withBusy(() => resumeTimer(gameId))}
            >
              Resume
            </Button>
          ) : (
            <Button
              color="yellow"
              loading={busy}
              onClick={() => gameId && withBusy(() => pauseTimer(gameId))}
            >
              Pause
            </Button>
          )}
        </Group>
      </Paper>

      <Paper p="md" withBorder bg="dark.8">
        <Text size="sm" fw={600} mb="sm">
          Day
        </Text>
        <Group>
          {[1, 2, 3].map((day) => (
            <Button
              key={day}
              variant={state?.day === day ? "filled" : "default"}
              color="yellow"
              size="sm"
              loading={busy}
              onClick={() => gameId && withBusy(() => setTimerDay(gameId, day as 1 | 2 | 3))}
            >
              {DAY_THEMES[day].label}
            </Button>
          ))}
        </Group>
      </Paper>

      <Paper p="md" withBorder bg="dark.8">
        <Text size="sm" fw={600} mb="sm">
          Override time
        </Text>
        <Group align="flex-end">
          <TextInput
            label="mm:ss"
            placeholder="12:30"
            value={timeInput}
            onChange={(e) => setTimeInput(e.currentTarget.value)}
            style={{ width: 140 }}
          />
          <Button
            variant="default"
            loading={busy}
            onClick={() => {
              const ms = parseMmSs(timeInput);
              if (ms == null || !gameId) return;
              withBusy(() => setTimerOverrideTime(gameId, ms));
            }}
          >
            Set time
          </Button>
        </Group>

        <Text size="sm" fw={600} mt="lg" mb="sm">
          Override message
        </Text>
        <Group align="flex-end">
          <TextInput
            label="Message"
            placeholder="Shown in place of the countdown"
            value={messageInput}
            onChange={(e) => setMessageInput(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button
            variant="default"
            loading={busy}
            onClick={() => {
              if (!gameId || !messageInput.trim()) return;
              withBusy(() => setTimerOverrideText(gameId, messageInput.trim()));
            }}
          >
            Show message
          </Button>
          <Button
            variant="subtle"
            color="gray"
            loading={busy}
            onClick={() => gameId && withBusy(() => setTimerOverrideText(gameId, null))}
          >
            Clear message
          </Button>
        </Group>
      </Paper>

      {error && (
        <Text size="xs" c="red.4">
          {error}
        </Text>
      )}
    </Stack>
  );
}

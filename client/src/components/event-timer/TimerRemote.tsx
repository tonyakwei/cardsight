import { useCallback, useState } from "react";
import { useParams } from "react-router";
import {
  Badge,
  Button,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {
  fetchTimerState,
  pauseTimer,
  resumeTimer,
  setTimerDisplay,
  setTimerDay,
  setTimerOverrideText,
  setTimerOverrideTime,
} from "../../api/eventTimer";
import { DAY_THEMES } from "./dayThemes";
import {
  ARTIFACT_IMAGES,
  TRIBUNALS,
  TRIBUNAL_DURATION_MS,
  type ArtifactImageButton,
} from "./templeEndingConfig";
import { usePolling } from "../../hooks/usePolling";
import type { EventTimerState } from "@cardsight/shared";

const POLL_MS = 2000;

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
  const [endingInput, setEndingInput] = useState("");

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
  const groupedArtifactImages = groupArtifactImages(ARTIFACT_IMAGES);

  return (
    <Stack gap="lg" style={{ maxWidth: 1120 }}>
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
            <Badge color="grape" variant="light">
              {state?.displayMode ?? "timer"}
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
          <Button
            variant="default"
            loading={busy}
            onClick={() => gameId && withBusy(() => setTimerDisplay(gameId, "timer"))}
          >
            Show timer
          </Button>
        </Group>
      </Paper>

      <Paper p="md" withBorder bg="dark.8">
        <Text size="sm" fw={600} mb="xs">
          Day 3 tribunals
        </Text>
        <Text size="xs" c="dimmed" mb="md">
          Each button shows two simultaneous meetings and starts a 6:00 countdown.
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
          {TRIBUNALS.map((tribunal) => (
            <Button
              key={tribunal.title}
              color="yellow"
              variant={isActiveTribunal(state, tribunal.title) ? "filled" : "default"}
              loading={busy}
              onClick={() =>
                gameId &&
                withBusy(() =>
                  setTimerDisplay(gameId, "tribunal", tribunal, TRIBUNAL_DURATION_MS),
                )
              }
            >
              {tribunal.title}
            </Button>
          ))}
        </SimpleGrid>
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

      <Paper p="md" withBorder bg="dark.8">
        <Text size="sm" fw={600} mb="xs">
          Artifact images
        </Text>
        <Text size="xs" c="dimmed" mb="md">
          Buttons are grouped alphabetically by artifact. The selected image fades in on
          the TV display.
        </Text>
        <Stack gap="md">
          {groupedArtifactImages.map(([artifactName, images]) => (
            <div key={artifactName}>
              <Group justify="space-between" align="center" mb={6}>
                <Text size="sm" fw={600}>
                  {artifactName}
                </Text>
                <Text size="xs" c="dimmed">
                  {images.length} image{images.length === 1 ? "" : "s"}
                </Text>
              </Group>
              <Group gap="xs">
                {images.map((image) => (
                  <Button
                    key={image.imageUrl}
                    size="xs"
                    variant={isActiveArtifact(state, image.imageUrl) ? "filled" : "default"}
                    color={image.label.startsWith("BAD") ? "red" : "yellow"}
                    loading={busy}
                    onClick={() =>
                      gameId && withBusy(() => setTimerDisplay(gameId, "artifact", image))
                    }
                  >
                    {image.label}
                  </Button>
                ))}
              </Group>
            </div>
          ))}
        </Stack>
      </Paper>

      <Paper p="md" withBorder bg="dark.8">
        <Text size="sm" fw={600} mb="sm">
          Final ending screen
        </Text>
        <Group align="flex-end">
          <TextInput
            label="Ending title"
            placeholder="ENDING OF A NEW ERA"
            value={endingInput}
            onChange={(e) => setEndingInput(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button
            color="yellow"
            loading={busy}
            onClick={() => {
              const title = endingInput.trim();
              if (!gameId || !title) return;
              withBusy(() => setTimerDisplay(gameId, "ending", { title }));
            }}
          >
            Show ending
          </Button>
        </Group>
      </Paper>

      {error && (
        <>
          <Divider />
          <Text size="xs" c="red.4">
            {error}
          </Text>
        </>
      )}
    </Stack>
  );
}

function groupArtifactImages(
  images: ArtifactImageButton[],
): Array<[string, ArtifactImageButton[]]> {
  const groups = new Map<string, ArtifactImageButton[]>();
  for (const image of images) {
    const existing = groups.get(image.artifactName) ?? [];
    existing.push(image);
    groups.set(image.artifactName, existing);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function payloadRecord(state: EventTimerState | null): Record<string, unknown> | null {
  if (!state?.displayPayload || typeof state.displayPayload !== "object") return null;
  return state.displayPayload as Record<string, unknown>;
}

function isActiveTribunal(state: EventTimerState | null, title: string): boolean {
  const payload = payloadRecord(state);
  return state?.displayMode === "tribunal" && payload?.title === title;
}

function isActiveArtifact(state: EventTimerState | null, imageUrl: string): boolean {
  const payload = payloadRecord(state);
  return state?.displayMode === "artifact" && payload?.imageUrl === imageUrl;
}

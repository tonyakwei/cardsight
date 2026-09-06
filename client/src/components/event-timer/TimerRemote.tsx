import { useCallback, useRef, useState } from "react";
import { useParams } from "react-router";
import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
} from "@mantine/core";
import {
  fetchTimerState,
  pauseTimer,
  resumeTimer,
  setEndingSelections,
  setTimerDisplay,
  setTimerDay,
  setTimerOverrideText,
  setTimerOverrideTime,
} from "../../api/eventTimer";
import { DAY_THEMES } from "./dayThemes";
import {
  ARTIFACT_IMAGES,
  ARTIFACT_NAMES,
  ENDING_SLOT_COUNT,
  TRIBUNALS,
  TRIBUNAL_DURATION_MS,
  imagesForArtifact,
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
  const [vanishingInput, setVanishingInput] = useState("");
  const busyRef = useRef(false);

  const load = useCallback(async () => {
    if (!gameId || busyRef.current) return;
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
      busyRef.current = true;
      setBusy(true);
      try {
        const data = await fn();
        setState(data);
        setError(null);
      } catch (err: any) {
        setError(err?.message ?? "Action failed");
      } finally {
        setBusy(false);
        busyRef.current = false;
      }
    },
    [],
  );

  if (!gameId) return null;

  const isPaused = state?.status === "paused";
  const vanishingActive = state?.displayMode === "vanishing";
  const groupedArtifactImages = groupArtifactImages(ARTIFACT_IMAGES);
  const selections = state?.endingSelections ?? [];
  const stackFull = selections.length >= ENDING_SLOT_COUNT;

  const commitSelections = (next: string[]) => {
    if (!gameId) return;
    withBusy(() => setEndingSelections(gameId, next));
  };

  const toggleArtifact = (name: string) => {
    if (selections.includes(name)) {
      commitSelections(selections.filter((n) => n !== name));
    } else if (!stackFull) {
      commitSelections([...selections, name]);
    }
  };

  const moveSelection = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= selections.length) return;
    const next = [...selections];
    [next[index], next[target]] = [next[target], next[index]];
    commitSelections(next);
  };

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
        <Group justify="space-between" align="center" mb="xs">
          <Text size="sm" fw={600}>
            The Vanishing
          </Text>
          <Switch
            checked={vanishingActive}
            color="yellow"
            label={vanishingActive ? "Showing" : "Hidden"}
            disabled={busy}
            onChange={(e) => {
              if (!gameId) return;
              const checked = e.currentTarget.checked;
              if (checked) {
                withBusy(() =>
                  setTimerDisplay(gameId, "vanishing", {
                    text: vanishingInput.trim() || undefined,
                  }),
                );
              } else {
                withBusy(() => setTimerDisplay(gameId, "timer"));
              }
            }}
          />
        </Group>
        <Text size="xs" c="dimmed" mb="md">
          Full-screen temple art with the "THE VANISHING" title, fading in and out on a loop.
          Add a message below to show it underneath the title — leave it blank for just the
          title.
        </Text>
        <Group align="flex-end">
          <TextInput
            label="Message (optional, shown below the title)"
            placeholder="Kick off at 6:55 PM"
            value={vanishingInput}
            onChange={(e) => setVanishingInput(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button
            variant="default"
            loading={busy}
            disabled={!vanishingActive}
            onClick={() =>
              gameId &&
              withBusy(() =>
                setTimerDisplay(gameId, "vanishing", {
                  text: vanishingInput.trim() || undefined,
                }),
              )
            }
          >
            Update text
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
        <Group justify="space-between" align="center" mb="xs">
          <Text size="sm" fw={600}>
            Artifacts surrendered
          </Text>
          <Group gap="xs">
            <Badge color={stackFull ? "green" : "yellow"} variant="light">
              {selections.length} / {ENDING_SLOT_COUNT} recorded
            </Badge>
            {selections.length > 0 && (
              <Button
                size="compact-xs"
                variant="subtle"
                color="gray"
                loading={busy}
                onClick={() => commitSelections([])}
              >
                Clear
              </Button>
            )}
          </Group>
        </Group>
        <Text size="xs" c="dimmed" mb="md">
          Tap each artifact as a team hands it over during the tribunals. The stack plays in
          the order you tap. Tap a recorded artifact again to take it back off.
        </Text>

        {selections.length > 0 && (
          <Stack gap={6} mb="md">
            {selections.map((name, index) => (
              <Group key={name} gap="xs" wrap="nowrap">
                <Badge circle color="yellow" variant="filled">
                  {index + 1}
                </Badge>
                <Text size="sm" style={{ flex: 1 }}>
                  {name}
                </Text>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  aria-label="Move earlier"
                  disabled={busy || index === 0}
                  onClick={() => moveSelection(index, -1)}
                >
                  ↑
                </ActionIcon>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  aria-label="Move later"
                  disabled={busy || index === selections.length - 1}
                  onClick={() => moveSelection(index, 1)}
                >
                  ↓
                </ActionIcon>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="red"
                  aria-label="Remove"
                  disabled={busy}
                  onClick={() => toggleArtifact(name)}
                >
                  ×
                </ActionIcon>
              </Group>
            ))}
          </Stack>
        )}

        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs">
          {ARTIFACT_NAMES.map((name) => {
            const position = selections.indexOf(name);
            const picked = position >= 0;
            return (
              <Button
                key={name}
                size="xs"
                color="yellow"
                variant={picked ? "filled" : "default"}
                loading={busy}
                disabled={!picked && stackFull}
                onClick={() => toggleArtifact(name)}
                styles={{ label: { whiteSpace: "normal", lineHeight: 1.2 } }}
              >
                {picked ? `${position + 1} · ${name}` : name}
              </Button>
            );
          })}
        </SimpleGrid>
      </Paper>

      <Paper p="md" withBorder bg="dark.8">
        <Group justify="space-between" align="center" mb="xs">
          <Text size="sm" fw={600}>
            Play the endings
          </Text>
          {selections.length > 0 && !stackFull && (
            <Badge color="yellow" variant="light">
              {ENDING_SLOT_COUNT - selections.length} still to record
            </Badge>
          )}
        </Group>

        {selections.length === 0 ? (
          <Text size="xs" c="dimmed">
            Record the surrendered artifacts above and the stack appears here, in order.
          </Text>
        ) : (
          <>
            <Text size="xs" c="dimmed" mb="md">
              Work down the stack. Each image carries its position seal and the line
              &ldquo;As the {"{artifact}"} was selected.&rdquo;
            </Text>
            <Stack gap="md">
              {selections.map((name, index) => {
                const images = imagesForArtifact(name);
                return (
                  <div key={name}>
                    <Group gap="xs" align="center" mb={6}>
                      <Badge circle color="yellow" variant="filled">
                        {index + 1}
                      </Badge>
                      <Text size="sm" fw={600}>
                        {name}
                      </Text>
                      {images.length === 1 && (
                        <Badge size="xs" color="gray" variant="outline">
                          one image only
                        </Badge>
                      )}
                    </Group>
                    <Group gap="xs">
                      {images.length === 0 ? (
                        <Text size="xs" c="red.4">
                          No ending image exists for this artifact.
                        </Text>
                      ) : (
                        images.map((image) => (
                          <Button
                            key={image.imageUrl}
                            size="xs"
                            variant={isActiveArtifact(state, image.imageUrl) ? "filled" : "default"}
                            color={image.label.startsWith("BAD") ? "red" : "yellow"}
                            loading={busy}
                            onClick={() =>
                              gameId &&
                              withBusy(() =>
                                setTimerDisplay(gameId, "artifact", {
                                  ...image,
                                  index: index + 1,
                                  total: selections.length,
                                }),
                              )
                            }
                          >
                            {image.label}
                          </Button>
                        ))
                      )}
                    </Group>
                  </div>
                );
              })}
            </Stack>
          </>
        )}
      </Paper>

      <Paper p="md" withBorder bg="dark.8">
        <Text size="sm" fw={600} mb="xs">
          All artifact images — manual override
        </Text>
        <Text size="xs" c="dimmed" mb="md">
          Every image, grouped alphabetically, for showing one outside the stack. These carry
          the caption but no position seal.
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

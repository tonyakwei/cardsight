import { useState, useCallback } from "react";
import {
  Group,
  Text,
  Badge,
  Loader,
  Button,
  Stack,
  Paper,
  TextInput,
  Textarea,
  NumberInput,
  Collapse,
  Select,
  Switch,
} from "@mantine/core";
import { AnswerTemplateEditor } from "./AnswerTemplateEditor";
import {
  fetchShowtimes,
  fetchDesigns,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  triggerShowtime,
  resetShowtime,
  type AdminShowtime,
  type AdminDesign,
} from "../../api/admin";
import { useAdminList } from "../../hooks/useAdminList";

const PHASE_COLORS: Record<string, string> = {
  filling: "blue",
  syncing: "yellow",
  revealed: "green",
};

export function ShowtimeManager() {
  const {
    gameId, game, items: showtimes, setItems: setShowtimes,
    extras, loading, handleUpdated, handleDeleted,
  } = useAdminList<AdminShowtime>({
    fetchItems: fetchShowtimes,
    extraFetches: { designs: fetchDesigns },
    pollInterval: 5000,
  });

  const designs: AdminDesign[] = extras.designs ?? [];

  const handleCreate = useCallback(async () => {
    if (!gameId) return;
    await createShowtime(gameId, {});
    const s = await fetchShowtimes(gameId);
    setShowtimes(s);
  }, [gameId, setShowtimes]);

  if (loading) {
    return (
      <Group justify="center" pt="xl">
        <Loader color="yellow" size="sm" />
      </Group>
    );
  }

  if (!game) return null;

  return (
    <div>
      <Group justify="space-between" mb="md">
        <div>
          <Text size="xl" fw={700}>
            {game.name} — Showtimes
          </Text>
          <Text size="xs" c="dimmed">
            Synchronized reveal events · auto-refreshing
          </Text>
        </div>
        <Button size="sm" color="yellow" onClick={handleCreate}>
          + New Showtime
        </Button>
      </Group>

      {showtimes.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No Showtimes yet. Click "+ New Showtime" to create one.
        </Text>
      ) : (
        <Stack gap="md">
          {showtimes.map((st) => (
            <ShowtimeRow
              key={st.id}
              showtime={st}
              gameId={gameId!}
              designs={designs}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </Stack>
      )}
    </div>
  );
}

function ShowtimeRow({
  showtime,
  gameId,
  designs,
  onUpdated,
  onDeleted,
}: {
  showtime: AdminShowtime;
  gameId: string;
  designs: AdminDesign[];
  onUpdated: (s: AdminShowtime) => void;
  onDeleted: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const save = async (data: Record<string, any>) => {
    const updated = await updateShowtime(gameId, showtime.id, data);
    onUpdated(updated);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete showtime "${showtime.title}"?`)) return;
    await deleteShowtime(gameId, showtime.id);
    onDeleted(showtime.id);
  };

  const handleTrigger = async () => {
    if (!window.confirm("Force reveal this Showtime? This cannot be undone easily.")) return;
    const updated = await triggerShowtime(gameId, showtime.id);
    onUpdated(updated);
  };

  const handleReset = async () => {
    if (!window.confirm("Reset this Showtime? All slot data and sync presses will be cleared."))
      return;
    const updated = await resetShowtime(gameId, showtime.id);
    onUpdated(updated);
  };

  const filledCount = showtime.slots.filter((s) => s.filledAt).length;
  const pressedCount = showtime.slots.filter((s) => s.syncPressedAt).length;

  return (
    <Paper p="md" withBorder>
      {/* Summary */}
      <Group
        justify="space-between"
        style={{ cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
      >
        <Group gap="sm">
          <div>
            <Text size="sm" fw={600}>
              {showtime.title}
            </Text>
            <Text size="xs" c="dimmed">
              Act {showtime.act} · {showtime.slots.length} slots ·{" "}
              {showtime.syncWindowMs / 1000}s window
            </Text>
          </div>
        </Group>
        <Group gap="xs">
          <Badge color={PHASE_COLORS[showtime.phase] ?? "gray"} variant="filled" size="sm">
            {showtime.phase}
          </Badge>
          <Badge size="sm" variant="outline" color="gray">
            {filledCount}/{showtime.slots.length} filled
          </Badge>
          {showtime.phase === "syncing" && (
            <Badge size="sm" variant="outline" color="yellow">
              {pressedCount}/{showtime.slots.length} pressed
            </Badge>
          )}
          <Text size="xs" c="dimmed">
            {expanded ? "▲" : "▼"}
          </Text>
        </Group>
      </Group>

      <Collapse in={expanded}>
        <Stack gap="sm" mt="md">
          {/* Live slot status */}
          <Paper p="sm" style={{ background: "rgba(255,255,255,0.02)" }}>
            <Text size="xs" fw={600} mb="xs">
              Live Status
            </Text>
            <Stack gap={4}>
              {showtime.slots.map((slot) => (
                <Group key={slot.id} gap="xs">
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: slot.house.color,
                    }}
                  />
                  <Text size="xs" fw={600} style={{ width: 70 }}>
                    {slot.house.name}
                  </Text>
                  <Badge
                    size="xs"
                    color={slot.filledAt ? "green" : "gray"}
                    variant={slot.filledAt ? "filled" : "outline"}
                  >
                    {slot.filledAt ? "Filled" : "Waiting"}
                  </Badge>
                  {slot.inputValue && (
                    <Text size="xs" ff="monospace" c="dimmed">
                      {slot.inputValue}
                    </Text>
                  )}
                  {showtime.phase === "syncing" && (
                    <Badge
                      size="xs"
                      color={slot.syncPressedAt ? "yellow" : "gray"}
                      variant={slot.syncPressedAt ? "filled" : "outline"}
                    >
                      {slot.syncPressedAt ? "Pressed" : "Not pressed"}
                    </Badge>
                  )}
                </Group>
              ))}
            </Stack>
            <Group gap="xs" mt="sm">
              <Button size="xs" color="red" variant="light" onClick={handleTrigger}>
                Force Reveal
              </Button>
              <Button size="xs" color="yellow" variant="light" onClick={handleReset}>
                Reset
              </Button>
            </Group>
          </Paper>

          {/* Editable fields */}
          <Group grow>
            <TextInput
              label="Title (admin)"
              size="xs"
              defaultValue={showtime.title}
              onBlur={(e) => {
                if (e.target.value !== showtime.title) save({ title: e.target.value });
              }}
            />
            <NumberInput
              label="Act"
              size="xs"
              min={1}
              max={5}
              defaultValue={showtime.act}
              onChange={(val) => {
                if (val && val !== showtime.act) save({ act: val });
              }}
            />
            <NumberInput
              label="Sync window (ms)"
              size="xs"
              min={1000}
              max={10000}
              step={500}
              defaultValue={showtime.syncWindowMs}
              onChange={(val) => {
                if (val && val !== showtime.syncWindowMs) save({ syncWindowMs: val });
              }}
            />
          </Group>

          <Switch
            size="xs"
            label={<Text size="xs">Show house labels to players</Text>}
            checked={showtime.showHouseLabels}
            onChange={(e) => save({ showHouseLabels: e.currentTarget.checked })}
          />

          <TextInput
            label="Reveal title (shown to players)"
            size="xs"
            defaultValue={showtime.revealTitle}
            onBlur={(e) => {
              if (e.target.value !== showtime.revealTitle) save({ revealTitle: e.target.value });
            }}
          />

          <Textarea
            label="Reveal description (markdown, shown to players)"
            size="xs"
            autosize
            minRows={3}
            maxRows={10}
            defaultValue={showtime.revealDescription ?? ""}
            onBlur={(e) =>
              save({ revealDescription: e.target.value || null })
            }
          />

          <Select
            label="Design"
            size="xs"
            placeholder="None"
            clearable
            data={designs.map((d) => ({ value: d.id, label: d.name }))}
            defaultValue={showtime.designId}
            onChange={(val) => save({ designId: val ?? null })}
          />

          {/* Slot editors */}
          <Text size="xs" fw={600} mt="xs">
            Slot Configuration
          </Text>
          {showtime.slots.map((slot) => (
            <Paper key={slot.id} p="sm" withBorder style={{ borderLeft: `3px solid ${slot.house.color}` }}>
              <Text size="xs" fw={600} c={slot.house.color} mb="xs">
                {slot.house.name}
              </Text>
              <Group grow>
                <TextInput
                  label="Label"
                  size="xs"
                  defaultValue={slot.label}
                  onBlur={(e) => {
                    if (e.target.value !== slot.label) {
                      save({ slots: [{ id: slot.id, label: e.target.value }] });
                    }
                  }}
                />
                <TextInput
                  label="Description"
                  size="xs"
                  defaultValue={slot.description ?? ""}
                  onBlur={(e) => {
                    save({ slots: [{ id: slot.id, description: e.target.value || null }] });
                  }}
                />
              </Group>
              <AnswerTemplateEditor
                gameId={gameId}
                answerTemplateType={slot.answerTemplateType}
                answerId={slot.answerId}
                onAnswerCreated={(type, id) => {
                  save({ slots: [{ id: slot.id, answerTemplateType: type, answerId: id }] });
                }}
              />
            </Paper>
          ))}

          <Textarea
            label="Admin notes"
            size="xs"
            autosize
            minRows={1}
            maxRows={3}
            placeholder="Internal notes..."
            defaultValue={showtime.notes ?? ""}
            onBlur={(e) => save({ notes: e.target.value || null })}
          />

          <Text size="xs" fw={600} mt="xs">
            Player Links
          </Text>
          <Group gap="xs">
            {showtime.slots.map((slot) => (
              <Button
                key={slot.id}
                size="xs"
                variant="light"
                color="gray"
                component="a"
                href={`/showtime/${showtime.id}?house=${slot.houseId}`}
                target="_blank"
                style={{ borderLeft: `3px solid ${slot.house.color}` }}
              >
                {slot.house.name}
              </Button>
            ))}
          </Group>

          <Group justify="flex-end" mt="xs">
            <Button size="xs" variant="subtle" color="red" onClick={handleDelete}>
              Delete Showtime
            </Button>
          </Group>
        </Stack>
      </Collapse>
    </Paper>
  );
}

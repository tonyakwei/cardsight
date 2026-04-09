import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Group,
  Text,
  Badge,
  Loader,
  Button,
  Stack,
  ActionIcon,
  Tabs,
  Textarea,
  TextInput,
  NumberInput,
  Collapse,
  Paper,
} from "@mantine/core";
import {
  fetchStorySheets,
  fetchHouses,
  createStorySheet,
  updateStorySheet,
  deleteStorySheet,
  type AdminStorySheet,
  type AdminHouse,
} from "../../api/admin";
import { useAdminList } from "../../hooks/useAdminList";

export function StorySheetManager() {
  const navigate = useNavigate();
  const {
    gameId, game, items: sheets, setItems: setSheets,
    extras, loading, handleUpdated, handleDeleted,
  } = useAdminList<AdminStorySheet>({
    fetchItems: fetchStorySheets,
    extraFetches: {
      houses: fetchHouses,
    },
  });

  const houses: AdminHouse[] = extras.houses ?? [];
  const [activeTab, setActiveTab] = useState<string>("all");

  const handleCreate = useCallback(async () => {
    if (!gameId) return;
    const houseId = activeTab !== "all" ? activeTab : houses[0]?.id;
    if (!houseId) return;
    await createStorySheet(gameId, { houseId, act: 1 });
    const s = await fetchStorySheets(gameId);
    setSheets(s);
  }, [gameId, activeTab, houses, setSheets]);

  if (loading) {
    return (
      <Group justify="center" pt="xl">
        <Loader color="yellow" size="sm" />
      </Group>
    );
  }

  if (!game) return null;

  let filtered = sheets;
  if (activeTab !== "all") {
    filtered = sheets.filter((s) => s.houseId === activeTab);
  }

  const byAct = new Map<number, AdminStorySheet[]>();
  for (const s of filtered) {
    if (!byAct.has(s.act)) byAct.set(s.act, []);
    byAct.get(s.act)!.push(s);
  }
  const sortedActs = [...byAct.keys()].sort((a, b) => a - b);

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => navigate(`/admin/games/${gameId}/missions`)}
          >
            ←
          </ActionIcon>
          <div>
            <Text size="xl" fw={700}>
              {game.name} — Story Sheets
            </Text>
            <Text size="xs" c="dimmed">
              {sheets.length} story sheets across {houses.length} houses
            </Text>
          </div>
        </Group>
        <Group gap="sm">
          <Button
            size="xs"
            variant="light"
            color="yellow"
            onClick={() => navigate(`/admin/games/${gameId}/story-sheets/print`)}
          >
            Print View
          </Button>
          <Button size="sm" color="yellow" onClick={handleCreate}>
            + New Story Sheet
          </Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={(v) => setActiveTab(v ?? "all")} mb="md">
        <Tabs.List>
          <Tabs.Tab value="all">
            <Group gap={6}>
              All
              <Badge size="xs" variant="filled" color="dark">{sheets.length}</Badge>
            </Group>
          </Tabs.Tab>
          {houses.map((house) => {
            const count = sheets.filter((s) => s.houseId === house.id).length;
            return (
              <Tabs.Tab key={house.id} value={house.id}>
                <Group gap={6}>
                  <span style={{ color: house.color, fontWeight: 600 }}>{house.name}</span>
                  <Badge size="xs" variant="filled" color="dark">{count}</Badge>
                </Group>
              </Tabs.Tab>
            );
          })}
        </Tabs.List>
      </Tabs>

      {sortedActs.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No story sheets yet. Click "+ New Story Sheet" to create one.
        </Text>
      ) : (
        <Stack gap="lg">
          {sortedActs.map((act) => (
            <div key={act}>
              <Group gap="sm" mb="sm" pb="xs" style={{ borderBottom: "1px solid var(--mantine-color-dark-6)" }}>
                <Text size="sm" fw={700} c="yellow.5" tt="uppercase" lts="0.08em">
                  Act {act}
                </Text>
                <Badge size="xs" variant="filled" color="dark">
                  {byAct.get(act)!.length}
                </Badge>
              </Group>
              <Stack gap="xs">
                {byAct.get(act)!.map((sheet) => (
                  <StorySheetRow
                    key={sheet.id}
                    sheet={sheet}
                    gameId={gameId!}
                    onUpdated={handleUpdated}
                    onDeleted={handleDeleted}
                  />
                ))}
              </Stack>
            </div>
          ))}
        </Stack>
      )}
    </div>
  );
}

function StorySheetRow({
  sheet,
  gameId,
  onUpdated,
  onDeleted,
}: {
  sheet: AdminStorySheet;
  gameId: string;
  onUpdated: (s: AdminStorySheet) => void;
  onDeleted: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async (data: Record<string, any>) => {
    setSaving(true);
    const updated = await updateStorySheet(gameId, sheet.id, data);
    onUpdated(updated);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete story sheet "${sheet.title}"?`)) return;
    await deleteStorySheet(gameId, sheet.id);
    onDeleted(sheet.id);
  };

  return (
    <Paper p="sm" withBorder>
      <Group
        justify="space-between"
        style={{ cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
      >
        <Group gap="sm">
          <Badge size="sm" variant="filled" color="dark" style={{ borderLeft: `3px solid ${sheet.house.color}` }}>
            {sheet.house.name}
          </Badge>
          <Text size="sm" fw={600}>{sheet.title}</Text>
          <Text size="xs" c="dimmed">{sheet.content.length} chars</Text>
        </Group>
        <Text size="xs" c="dimmed">{expanded ? "▲" : "▼"}</Text>
      </Group>

      <Collapse in={expanded}>
        <Stack gap="sm" mt="md">
          <Group grow>
            <TextInput
              label="Title"
              size="xs"
              defaultValue={sheet.title}
              onBlur={(e) => {
                if (e.target.value !== sheet.title) save({ title: e.target.value });
              }}
            />
            <NumberInput
              label="Act"
              size="xs"
              min={1}
              max={5}
              defaultValue={sheet.act}
              onChange={(val) => {
                if (val && val !== sheet.act) save({ act: val });
              }}
            />
          </Group>

          <Textarea
            label="Content (Markdown)"
            size="xs"
            autosize
            minRows={8}
            maxRows={30}
            defaultValue={sheet.content}
            onBlur={(e) => {
              if (e.target.value !== sheet.content) save({ content: e.target.value });
            }}
            styles={{ input: { fontFamily: "'Courier New', monospace", fontSize: "0.8rem" } }}
          />

          <Textarea
            label="Admin notes"
            size="xs"
            autosize
            minRows={1}
            maxRows={3}
            placeholder="Internal notes..."
            defaultValue={sheet.notes ?? ""}
            onBlur={(e) => save({ notes: e.target.value || null })}
          />

          <Group justify="flex-end" mt="xs">
            <Text size="xs" c="dimmed">{saving ? "Saving..." : "Changes save on blur"}</Text>
            <Button size="xs" variant="subtle" color="red" onClick={handleDelete}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Collapse>
    </Paper>
  );
}

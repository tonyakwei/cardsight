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
  Select,
  MultiSelect,
  NumberInput,
  Collapse,
  Paper,
  Checkbox,
} from "@mantine/core";
import {
  fetchMissions,
  fetchCardSets,
  fetchHouses,
  createMission,
  updateMission,
  deleteMission,
  type AdminMission,
  type AdminCardSet,
  type AdminHouse,
} from "../../api/admin";
import { useAdminList } from "../../hooks/useAdminList";

export function MissionManager() {
  const navigate = useNavigate();
  const {
    gameId, game, items: missions, setItems: setMissions,
    extras, loading, handleUpdated, handleDeleted,
  } = useAdminList<AdminMission>({
    fetchItems: fetchMissions,
    extraFetches: {
      cardSets: fetchCardSets,
      houses: fetchHouses,
    },
  });

  const cardSets: AdminCardSet[] = extras.cardSets ?? [];
  const houses: AdminHouse[] = extras.houses ?? [];
  const [activeTab, setActiveTab] = useState<string>("all");

  const handleCreate = useCallback(async () => {
    if (!gameId) return;
    const houseIds = activeTab !== "all" ? [activeTab] : [];
    await createMission(gameId, { houseIds });
    const m = await fetchMissions(gameId);
    setMissions(m);
  }, [gameId, activeTab, setMissions]);

  if (loading) {
    return (
      <Group justify="center" pt="xl">
        <Loader color="yellow" size="sm" />
      </Group>
    );
  }

  if (!game) return null;

  // Filter missions by house tab
  let filtered = missions;
  if (activeTab !== "all") {
    filtered = missions.filter((m) =>
      m.missionHouses.some((mh) => mh.house.id === activeTab),
    );
  }

  // Group by act
  const byAct = new Map<number, AdminMission[]>();
  for (const m of filtered) {
    if (!byAct.has(m.act)) byAct.set(m.act, []);
    byAct.get(m.act)!.push(m);
  }
  const sortedActs = [...byAct.keys()].sort((a, b) => a - b);

  return (
    <div>
      {/* Header */}
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => navigate(`/admin/games/${gameId}`)}
          >
            ←
          </ActionIcon>
          <div>
            <Text size="xl" fw={700}>
              {game.name} — Missions
            </Text>
            <Text size="xs" c="dimmed">
              {missions.length} missions across {houses.length} houses
            </Text>
          </div>
        </Group>
        <Group gap="sm">
          <Button
            size="xs"
            variant="light"
            color="yellow"
            onClick={() => navigate(`/admin/games/${gameId}/act-break/print`)}
          >
            Print Consequences
          </Button>
          <Button
            size="xs"
            variant="light"
            color="violet"
            onClick={() => navigate(`/admin/games/${gameId}/act-break`)}
          >
            Act Break View
          </Button>
          <Button size="sm" color="yellow" onClick={handleCreate}>
            + New Mission
          </Button>
        </Group>
      </Group>

      {/* House tabs */}
      <Tabs
        value={activeTab}
        onChange={(v) => setActiveTab(v ?? "all")}
        mb="md"
      >
        <Tabs.List>
          <Tabs.Tab value="all">
            <Group gap={6}>
              All
              <Badge size="xs" variant="filled" color="dark">
                {missions.length}
              </Badge>
            </Group>
          </Tabs.Tab>
          {houses.map((house) => {
            const count = missions.filter((m) =>
              m.missionHouses.some((mh) => mh.house.id === house.id),
            ).length;
            return (
              <Tabs.Tab key={house.id} value={house.id}>
                <Group gap={6}>
                  <span style={{ color: house.color, fontWeight: 600 }}>
                    {house.name}
                  </span>
                  <Badge size="xs" variant="filled" color="dark">
                    {count}
                  </Badge>
                </Group>
              </Tabs.Tab>
            );
          })}
        </Tabs.List>
      </Tabs>

      {/* Mission list grouped by act */}
      {sortedActs.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No missions yet. Click "+ New Mission" to create one.
        </Text>
      ) : (
        <Stack gap="lg">
          {sortedActs.map((act) => (
            <div key={act}>
              <Group
                gap="sm"
                mb="sm"
                pb="xs"
                style={{
                  borderBottom: "1px solid var(--mantine-color-dark-6)",
                }}
              >
                <Text
                  size="sm"
                  fw={700}
                  c="yellow.5"
                  tt="uppercase"
                  lts="0.08em"
                >
                  Act {act}
                </Text>
                <Badge size="xs" variant="filled" color="dark">
                  {byAct.get(act)!.length}
                </Badge>
              </Group>
              <Stack gap="xs">
                {byAct.get(act)!.map((mission) => (
                  <MissionRow
                    key={mission.id}
                    mission={mission}
                    gameId={gameId!}
                    houses={houses}
                    cardSets={cardSets}
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

function MissionRow({
  mission,
  gameId,
  houses,
  cardSets,
  onUpdated,
  onDeleted,
}: {
  mission: AdminMission;
  gameId: string;
  houses: AdminHouse[];
  cardSets: AdminCardSet[];
  onUpdated: (m: AdminMission) => void;
  onDeleted: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async (data: Record<string, any>) => {
    setSaving(true);
    const updated = await updateMission(gameId, mission.id, data);
    onUpdated(updated);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete mission "${mission.title}"?`)) return;
    await deleteMission(gameId, mission.id);
    onDeleted(mission.id);
  };

  const houseNames = mission.missionHouses
    .map((mh) => mh.house.name)
    .join(", ");

  const clueSetNames = (mission.requiredClueSets ?? [])
    .map((rc: any) => {
      const cs = cardSets.find((s) => s.id === rc.cardSetId);
      return cs ? `${cs.name} (${rc.count})` : `??? (${rc.count})`;
    })
    .join(", ");

  return (
    <Paper
      p="sm"
      withBorder
      style={{
        borderColor: mission.isCompleted
          ? "var(--mantine-color-green-8)"
          : "var(--mantine-color-dark-5)",
        background: mission.isCompleted
          ? "rgba(0, 255, 0, 0.03)"
          : "transparent",
      }}
    >
      {/* Summary row */}
      <Group
        justify="space-between"
        style={{ cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
      >
        <Group gap="sm">
          <Checkbox
            size="xs"
            checked={mission.isCompleted}
            onChange={(e) => {
              e.stopPropagation();
              save({ isCompleted: e.currentTarget.checked });
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <div>
            <Text size="sm" fw={600}>
              {mission.title}
            </Text>
            <Group gap="xs">
              {mission.missionHouses.map((mh) => (
                <Badge
                  key={mh.house.id}
                  size="xs"
                  variant="filled"
                  color="dark"
                  style={{ borderLeft: `3px solid ${mh.house.color}` }}
                >
                  {mh.house.name}
                </Badge>
              ))}
              {clueSetNames && (
                <Text size="xs" c="dimmed">
                  Needs: {clueSetNames}
                </Text>
              )}
            </Group>
          </div>
        </Group>
        <Text size="xs" c="dimmed">
          {expanded ? "▲" : "▼"}
        </Text>
      </Group>

      {/* Expanded editor */}
      <Collapse in={expanded}>
        <Stack gap="sm" mt="md">
          <Group grow>
            <TextInput
              label="Title"
              size="xs"
              defaultValue={mission.title}
              onBlur={(e) => {
                if (e.target.value !== mission.title)
                  save({ title: e.target.value });
              }}
            />
            <NumberInput
              label="Act"
              size="xs"
              min={1}
              max={5}
              defaultValue={mission.act}
              onChange={(val) => {
                if (val && val !== mission.act) save({ act: val });
              }}
            />
          </Group>

          <Textarea
            label="Description (mission briefing)"
            size="xs"
            autosize
            minRows={2}
            maxRows={8}
            defaultValue={mission.description}
            onBlur={(e) => {
              if (e.target.value !== mission.description)
                save({ description: e.target.value });
            }}
          />

          <MultiSelect
            label="Houses"
            size="xs"
            data={houses.map((h) => ({ value: h.id, label: h.name }))}
            defaultValue={mission.missionHouses.map((mh) => mh.house.id)}
            onChange={(val) => save({ houseIds: val })}
          />

          <RequiredClueSetsEditor
            value={mission.requiredClueSets ?? []}
            cardSets={cardSets}
            onChange={(val) => save({ requiredClueSets: val })}
          />

          <Text size="xs" fw={600} mt="xs">
            Consequences
          </Text>

          <Group grow align="start">
            <Textarea
              label="If completed"
              size="xs"
              autosize
              minRows={3}
              maxRows={10}
              placeholder="Narrative consequence text (markdown)..."
              defaultValue={mission.consequenceCompleted ?? ""}
              onBlur={(e) =>
                save({
                  consequenceCompleted: e.target.value || null,
                })
              }
            />
            <Textarea
              label="If not completed"
              size="xs"
              autosize
              minRows={3}
              maxRows={10}
              placeholder="Narrative consequence text (markdown)..."
              defaultValue={mission.consequenceNotCompleted ?? ""}
              onBlur={(e) =>
                save({
                  consequenceNotCompleted: e.target.value || null,
                })
              }
            />
          </Group>

          <Group grow>
            <TextInput
              label="Consequence image (completed)"
              size="xs"
              placeholder="/assets/consequences/alpha-success.png"
              defaultValue={mission.consequenceImageCompleted ?? ""}
              onBlur={(e) =>
                save({
                  consequenceImageCompleted: e.target.value || null,
                })
              }
            />
            <TextInput
              label="Consequence image (not completed)"
              size="xs"
              placeholder="/assets/consequences/alpha-failure.png"
              defaultValue={mission.consequenceImageNotCompleted ?? ""}
              onBlur={(e) =>
                save({
                  consequenceImageNotCompleted: e.target.value || null,
                })
              }
            />
          </Group>

          <Textarea
            label="Mechanical effects (completed) — JSON"
            size="xs"
            autosize
            minRows={1}
            maxRows={4}
            placeholder='{"capability_gained": "deep_analysis"}'
            defaultValue={
              mission.mechanicalEffectCompleted
                ? JSON.stringify(mission.mechanicalEffectCompleted, null, 2)
                : ""
            }
            onBlur={(e) => {
              try {
                const val = e.target.value.trim()
                  ? JSON.parse(e.target.value)
                  : null;
                save({ mechanicalEffectCompleted: val });
              } catch {
                /* invalid JSON, ignore */
              }
            }}
          />

          <Textarea
            label="Mechanical effects (not completed) — JSON"
            size="xs"
            autosize
            minRows={1}
            maxRows={4}
            placeholder='{"mission_count_reduction": 1}'
            defaultValue={
              mission.mechanicalEffectNotCompleted
                ? JSON.stringify(mission.mechanicalEffectNotCompleted, null, 2)
                : ""
            }
            onBlur={(e) => {
              try {
                const val = e.target.value.trim()
                  ? JSON.parse(e.target.value)
                  : null;
                save({ mechanicalEffectNotCompleted: val });
              } catch {
                /* invalid JSON, ignore */
              }
            }}
          />

          <Textarea
            label="Admin notes"
            size="xs"
            autosize
            minRows={1}
            maxRows={3}
            placeholder="Internal notes..."
            defaultValue={mission.notes ?? ""}
            onBlur={(e) => save({ notes: e.target.value || null })}
          />

          <Group justify="flex-end" mt="xs">
            <Text size="xs" c="dimmed">
              {saving ? "Saving..." : "Changes save on blur"}
            </Text>
            <Button
              size="xs"
              variant="subtle"
              color="red"
              onClick={handleDelete}
            >
              Delete Mission
            </Button>
          </Group>
        </Stack>
      </Collapse>
    </Paper>
  );
}

function RequiredClueSetsEditor({
  value,
  cardSets,
  onChange,
}: {
  value: { cardSetId: string; count: number }[];
  cardSets: AdminCardSet[];
  onChange: (val: { cardSetId: string; count: number }[]) => void;
}) {
  const [items, setItems] = useState(value);

  const update = (next: { cardSetId: string; count: number }[]) => {
    setItems(next);
    onChange(next);
  };

  return (
    <div>
      <Text size="xs" fw={600} mb={4}>
        Required clue sets
      </Text>
      <Stack gap={4}>
        {items.map((item, i) => (
          <Group key={i} gap="xs">
            <Select
              size="xs"
              placeholder="Card set"
              data={cardSets.map((cs) => ({ value: cs.id, label: cs.name }))}
              value={item.cardSetId}
              onChange={(val) => {
                if (!val) return;
                const next = [...items];
                next[i] = { ...next[i], cardSetId: val };
                update(next);
              }}
              style={{ flex: 1 }}
            />
            <NumberInput
              size="xs"
              min={1}
              max={20}
              value={item.count}
              onChange={(val) => {
                const next = [...items];
                next[i] = { ...next[i], count: Number(val) || 1 };
                update(next);
              }}
              style={{ width: 70 }}
            />
            <ActionIcon
              size="xs"
              variant="subtle"
              color="red"
              onClick={() => update(items.filter((_, j) => j !== i))}
            >
              x
            </ActionIcon>
          </Group>
        ))}
        <Button
          size="xs"
          variant="subtle"
          color="gray"
          onClick={() => update([...items, { cardSetId: "", count: 1 }])}
        >
          + Add clue set
        </Button>
      </Stack>
    </div>
  );
}

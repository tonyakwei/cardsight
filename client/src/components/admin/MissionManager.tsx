import { useState, useCallback, useEffect } from "react";
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
  Switch,
  Grid,
} from "@mantine/core";
import {
  fetchMissions,
  fetchCardSets,
  fetchHouses,
  fetchDesigns,
  createMission,
  updateMission,
  deleteMission,
  reorderMissions,
  getMissionQRUrl,
  fetchConsequences,
  createConsequence,
  updateConsequence,
  deleteConsequence,
  type AdminMission,
  type AdminMissionConsequence,
  type AdminCardSet,
  type AdminHouse,
  type AdminDesign,
} from "../../api/admin";
import { useAdminList } from "../../hooks/useAdminList";
import { CollapsibleSection } from "./CollapsibleSection";
import { PhonePreview } from "./PhonePreview";
import { AnswerTemplateEditor } from "./AnswerTemplateEditor";

export function MissionManager() {
  const {
    gameId, game, items: missions, setItems: setMissions,
    extras, loading, handleUpdated, handleDeleted,
  } = useAdminList<AdminMission>({
    fetchItems: fetchMissions,
    extraFetches: {
      cardSets: fetchCardSets,
      houses: fetchHouses,
      designs: fetchDesigns,
    },
  });

  const cardSets: AdminCardSet[] = extras.cardSets ?? [];
  const houses: AdminHouse[] = extras.houses ?? [];
  const designs: AdminDesign[] = extras.designs ?? [];
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
        <div>
          <Text size="xl" fw={700}>
            {game.name} — Missions
          </Text>
          <Text size="xs" c="dimmed">
            {missions.length} missions across {houses.length} houses
          </Text>
        </div>
        <Button size="sm" color="yellow" onClick={handleCreate}>
          + New Mission
        </Button>
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
                    allMissions={missions}
                    houses={houses}
                    cardSets={cardSets}
                    designs={designs}
                    onUpdated={handleUpdated}
                    onDeleted={handleDeleted}
                    onReorder={async (draggedId, targetId) => {
                      const group = byAct.get(act)!;
                      const from = group.findIndex((m) => m.id === draggedId);
                      const to = group.findIndex((m) => m.id === targetId);
                      if (from === -1 || to === -1 || from === to) return;
                      const reordered = [...group];
                      const [moved] = reordered.splice(from, 1);
                      reordered.splice(to, 0, moved);
                      // Build full mission ID order: keep other acts intact, splice in reordered group
                      const next: string[] = [];
                      for (const a of sortedActs) {
                        if (a === act) {
                          next.push(...reordered.map((m) => m.id));
                        } else {
                          next.push(...byAct.get(a)!.map((m) => m.id));
                        }
                      }
                      // Optimistic local update
                      setMissions((prev) => {
                        const orderMap = new Map(next.map((id, i) => [id, i]));
                        return [...prev].sort(
                          (a, b) =>
                            a.act - b.act ||
                            (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
                        );
                      });
                      await reorderMissions(gameId!, next);
                    }}
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
  allMissions,
  houses,
  cardSets,
  designs,
  onUpdated,
  onDeleted,
  onReorder,
}: {
  mission: AdminMission;
  gameId: string;
  allMissions: AdminMission[];
  houses: AdminHouse[];
  cardSets: AdminCardSet[];
  designs: AdminDesign[];
  onUpdated: (m: AdminMission) => void;
  onDeleted: (id: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

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
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/mission-id", mission.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("text/mission-id")) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setDragOver(true);
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const draggedId = e.dataTransfer.getData("text/mission-id");
        if (draggedId && draggedId !== mission.id) {
          onReorder(draggedId, mission.id);
        }
      }}
      style={{
        borderColor: dragOver
          ? "var(--mantine-color-yellow-5)"
          : mission.isCompleted
          ? "var(--mantine-color-green-8)"
          : "var(--mantine-color-dark-5)",
        background: dragOver
          ? "rgba(255, 200, 0, 0.06)"
          : mission.isCompleted
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
          <Text
            size="sm"
            c="dimmed"
            style={{ cursor: "grab", userSelect: "none", lineHeight: 1 }}
            title="Drag to reorder"
          >
            ⋮⋮
          </Text>
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
        <Grid gutter="xl" mt="md">
          <Grid.Col span={{ base: 12, md: 8 }}>
        <Stack gap="sm">
          {/* Always visible: title + act */}
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

          <CollapsibleSection sectionKey="mission-content" label="Content">
            <Stack gap="sm">
              <Textarea
                label="Description (narrative briefing)"
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
              <Textarea
                label="Story Sheet Blurb (printed under the story brief — markdown)"
                size="xs"
                autosize
                minRows={2}
                maxRows={6}
                placeholder="The hook printed on the story sheet, next to this mission's QR code..."
                defaultValue={mission.storySheetBlurb ?? ""}
                onBlur={(e) => {
                  const val = e.target.value || null;
                  if (val !== mission.storySheetBlurb)
                    save({ storySheetBlurb: val });
                }}
                styles={{ input: { fontFamily: "'Courier New', monospace", fontSize: "0.8rem" } }}
              />
              <Textarea
                label="Puzzle Description (shown to players — markdown)"
                size="xs"
                autosize
                minRows={2}
                maxRows={8}
                defaultValue={mission.puzzleDescription ?? ""}
                onBlur={(e) => {
                  const val = e.target.value || null;
                  if (val !== mission.puzzleDescription)
                    save({ puzzleDescription: val });
                }}
                styles={{ input: { fontFamily: "'Courier New', monospace", fontSize: "0.8rem" } }}
              />
              <Group grow>
                <Select
                  label="Design"
                  size="xs"
                  clearable
                  value={mission.designId ?? ""}
                  onChange={(val) => save({ designId: val || null })}
                  data={[{ value: "", label: "(None)" }, ...designs.map((d) => ({ value: d.id, label: d.name }))]}
                />
                <div>
                  <Text size="xs" fw={500} mb={4}>QR Code</Text>
                  <Button
                    size="xs"
                    variant="light"
                    color="yellow"
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = getMissionQRUrl(gameId, mission.id);
                      a.download = `qr-mission-${mission.title.slice(0, 20).replace(/\s/g, "-")}.png`;
                      a.click();
                    }}
                  >
                    Download QR
                  </Button>
                </div>
              </Group>
            </Stack>
          </CollapsibleSection>

          <CollapsibleSection sectionKey="mission-houses" label="Houses & Clues">
            <Stack gap="sm">
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
            </Stack>
          </CollapsibleSection>

          <CollapsibleSection sectionKey="mission-answer" label="Answer">
            <Stack gap="sm">
              <Group grow>
                <Switch
                  label="Has answer"
                  size="xs"
                  color="cyan"
                  checked={!!mission.answerTemplateType}
                  onChange={(e) => {
                    if (!e.currentTarget.checked) {
                      save({ answerTemplateType: null, answerId: null });
                    } else {
                      save({ answerTemplateType: "single_answer" });
                    }
                  }}
                />
                {mission.answerTemplateType && (
                  <Select
                    label="Answer type"
                    size="xs"
                    value={mission.answerTemplateType ?? ""}
                    onChange={(v) => save({ answerTemplateType: v || null })}
                    data={[
                      { value: "single_answer", label: "Text input" },
                    ]}
                  />
                )}
              </Group>
              {mission.answerTemplateType === "single_answer" && (
                <AnswerTemplateEditor
                  gameId={gameId}
                  answerTemplateType={mission.answerTemplateType}
                  answerId={mission.answerId}
                  onAnswerCreated={(type, id) => {
                    save({ answerTemplateType: type, answerId: id });
                  }}
                />
              )}
            </Stack>
          </CollapsibleSection>

          <CollapsibleSection sectionKey="mission-consequences" label="Consequences">
            <Stack gap="sm">
              <Group grow align="start">
                <Textarea
                  label="Narrative — if completed"
                  size="xs"
                  autosize
                  minRows={2}
                  maxRows={10}
                  placeholder="Text the host reads aloud (markdown)..."
                  defaultValue={mission.consequenceCompleted ?? ""}
                  onBlur={(e) => save({ consequenceCompleted: e.target.value || null })}
                />
                <Textarea
                  label="Narrative — if not completed"
                  size="xs"
                  autosize
                  minRows={2}
                  maxRows={10}
                  placeholder="Text the host reads aloud (markdown)..."
                  defaultValue={mission.consequenceNotCompleted ?? ""}
                  onBlur={(e) => save({ consequenceNotCompleted: e.target.value || null })}
                />
              </Group>
              <Group grow>
                <TextInput
                  label="Image (completed)"
                  size="xs"
                  placeholder="/assets/consequences/..."
                  defaultValue={mission.consequenceImageCompleted ?? ""}
                  onBlur={(e) => save({ consequenceImageCompleted: e.target.value || null })}
                />
                <TextInput
                  label="Image (not completed)"
                  size="xs"
                  placeholder="/assets/consequences/..."
                  defaultValue={mission.consequenceImageNotCompleted ?? ""}
                  onBlur={(e) => save({ consequenceImageNotCompleted: e.target.value || null })}
                />
              </Group>
              <ConsequenceEditor
                gameId={gameId}
                missionId={mission.id}
                allMissions={allMissions}
              />
            </Stack>
          </CollapsibleSection>

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
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <PhonePreview missionId={mission.id} />
          </Grid.Col>
        </Grid>
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

function ConsequenceEditor({
  gameId,
  missionId,
  allMissions,
}: {
  gameId: string;
  missionId: string;
  allMissions: AdminMission[];
}) {
  const [consequences, setConsequences] = useState<AdminMissionConsequence[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchConsequences(gameId, missionId).then((c) => {
      setConsequences(c);
      setLoaded(true);
    });
  }, [gameId, missionId]);

  const handleCreate = async () => {
    const c = await createConsequence(gameId, missionId, {
      type: "warning",
      message: "",
    });
    setConsequences((prev) => [...prev, c]);
  };

  const handleUpdate = async (consequenceId: string, data: Record<string, any>) => {
    const updated = await updateConsequence(gameId, consequenceId, data);
    setConsequences((prev) => prev.map((c) => (c.id === consequenceId ? updated : c)));
  };

  const handleDelete = async (consequenceId: string) => {
    await deleteConsequence(gameId, consequenceId);
    setConsequences((prev) => prev.filter((c) => c.id !== consequenceId));
  };

  // Target missions: all missions in later acts (or same act, but not self)
  const targetOptions = allMissions
    .filter((m) => m.id !== missionId)
    .map((m) => ({ value: m.id, label: `Act ${m.act}: ${m.title}` }));

  if (!loaded) return null;

  return (
    <div>
      <Text size="xs" fw={600} mt="xs" mb={4}>
        Act Consequences
      </Text>
      <Stack gap="xs">
        {consequences.map((c) => (
          <Paper key={c.id} p="xs" withBorder style={{ background: "rgba(255,200,0,0.03)" }}>
            <Group gap="xs" mb="xs">
              <Select
                size="xs"
                value={c.type}
                onChange={(v) => v && handleUpdate(c.id, { type: v })}
                data={[
                  { value: "warning", label: "Warning" },
                  { value: "lock", label: "Lock mission" },
                  { value: "redistribute", label: "Redistribute cards" },
                ]}
                style={{ width: 150 }}
              />
              <Select
                size="xs"
                placeholder="Target mission (optional)"
                clearable
                value={c.targetMissionId ?? ""}
                onChange={(v) => handleUpdate(c.id, { targetMissionId: v || null })}
                data={targetOptions}
                style={{ flex: 1 }}
              />
              <ActionIcon size="xs" variant="subtle" color="red" onClick={() => handleDelete(c.id)}>
                x
              </ActionIcon>
            </Group>
            <Group gap="xs" mb="xs">
              <Switch
                size="xs"
                label="On failure"
                checked={c.triggerOnFailure}
                onChange={(e) => handleUpdate(c.id, { triggerOnFailure: e.currentTarget.checked })}
              />
              <Switch
                size="xs"
                label="On success"
                checked={c.triggerOnSuccess}
                onChange={(e) => handleUpdate(c.id, { triggerOnSuccess: e.currentTarget.checked })}
              />
            </Group>
            <Textarea
              size="xs"
              placeholder="Consequence message..."
              minRows={2}
              maxRows={5}
              autosize
              defaultValue={c.message}
              onBlur={(e) => {
                if (e.target.value !== c.message)
                  handleUpdate(c.id, { message: e.target.value });
              }}
            />
          </Paper>
        ))}
        <Button size="xs" variant="subtle" color="yellow" onClick={handleCreate}>
          + Add Consequence
        </Button>
      </Stack>
    </div>
  );
}

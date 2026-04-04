import { useState, useCallback } from "react";
import {
  Group,
  Text,
  Badge,
  Switch,
  Collapse,
  TextInput,
  Textarea,
  Select,
  MultiSelect,
  NumberInput,
  Button,
  Tooltip,
  Grid,
  Stack,
  Checkbox,
  ActionIcon,
} from "@mantine/core";
import {
  updateCard,
  getQRUrl,
  createCardSet,
  createHouse,
  resetCard,
  deleteCard,
  restoreCard,
  type AdminCard,
  type AdminDesign,
  type AdminCardSet,
  type AdminHouse,
} from "../../api/admin";
import { PhonePreview } from "./PhonePreview";

interface Props {
  card: AdminCard;
  gameId: string;
  designs: AdminDesign[];
  cardSets: AdminCardSet[];
  houses: AdminHouse[];
  selected: boolean;
  onToggleSelect: () => void;
  onCardUpdated: (card: AdminCard) => void;
  onCardRemoved: (id: string) => void;
  onHousesChanged: () => void;
  onCardSetsChanged: () => void;
  onReorder: (id: string, dir: "up" | "down") => void;
}

export function CardRow({
  card, gameId, designs, cardSets, houses,
  selected, onToggleSelect, onCardUpdated, onCardRemoved,
  onHousesChanged, onCardSetsChanged, onReorder,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, any>>({});
  const isDeleted = !!card.deletedAt;

  const hasChanges = Object.keys(draft).length > 0;

  const updateDraft = (field: string, value: any) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const save = useCallback(async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      const updated = await updateCard(gameId, card.id, draft);
      onCardUpdated(updated);
      setDraft({});
    } finally {
      setSaving(false);
    }
  }, [gameId, card.id, draft, hasChanges, onCardUpdated]);

  const toggleFinished = useCallback(async () => {
    setSaving(true);
    try {
      const updated = await updateCard(gameId, card.id, { isFinished: !card.isFinished });
      onCardUpdated(updated);
    } finally {
      setSaving(false);
    }
  }, [gameId, card.id, card.isFinished, onCardUpdated]);

  const handleReset = useCallback(async () => {
    if (!window.confirm(`Reset card ${card.humanCardId}? This clears self-destruct, solved status, and all scan/answer data.`)) return;
    const updated = await resetCard(gameId, card.id);
    onCardUpdated(updated);
  }, [gameId, card.id, card.humanCardId, onCardUpdated]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm(`Delete card ${card.humanCardId}?`)) return;
    await deleteCard(gameId, card.id);
    onCardRemoved(card.id);
  }, [gameId, card.id, card.humanCardId, onCardRemoved]);

  const handleRestore = useCallback(async () => {
    const updated = await restoreCard(gameId, card.id);
    onCardUpdated(updated);
  }, [gameId, card.id, onCardUpdated]);

  const currentHouseIds = "houseIds" in draft
    ? draft.houseIds
    : card.cardHouses.map((ch) => ch.house.id);

  const current = (field: string) =>
    field in draft ? draft[field] : (card as any)[field];

  const relativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const downloadQR = () => {
    const a = document.createElement("a");
    a.href = getQRUrl(gameId, card.id);
    a.download = `qr-${card.humanCardId}.png`;
    a.click();
  };

  const cardSetData = [
    { value: "", label: "(None)" },
    ...cardSets.map((s) => ({ value: s.id, label: s.name })),
    { value: "__create__", label: "+ New Card Set" },
  ];

  const houseData = [
    ...houses.map((h) => ({ value: h.id, label: h.name })),
    { value: "__create__", label: "+ New House" },
  ];

  const handleCardSetChange = async (value: string | null) => {
    if (value === "__create__") {
      const name = window.prompt("New card set name:");
      if (!name) return;
      const created = await createCardSet(gameId, { name });
      onCardSetsChanged();
      updateDraft("cardSetId", created.id);
    } else {
      updateDraft("cardSetId", value || null);
    }
  };

  const handleHousesChange = async (values: string[]) => {
    if (values.includes("__create__")) {
      const name = window.prompt("New house name:");
      if (!name) return;
      const created = await createHouse(gameId, { name });
      onHousesChanged();
      updateDraft("houseIds", values.filter((v) => v !== "__create__").concat(created.id));
    } else {
      updateDraft("houseIds", values);
    }
  };

  return (
    <div
      style={{
        border: "1px solid var(--mantine-color-dark-5)",
        borderRadius: "8px",
        marginBottom: "8px",
        overflow: "hidden",
        borderLeft: isDeleted
          ? "3px solid var(--mantine-color-red-9)"
          : card.isFinished
            ? "3px solid var(--mantine-color-green-7)"
            : "3px solid var(--mantine-color-dark-5)",
        opacity: isDeleted ? 0.5 : 1,
      }}
    >
      {/* Collapsed header row */}
      <Group
        p="sm"
        px="md"
        justify="space-between"
        wrap="nowrap"
        style={{
          cursor: "pointer",
          background: expanded ? "var(--mantine-color-dark-7)" : "transparent",
          transition: "background 0.15s",
        }}
        onClick={() => !isDeleted && setExpanded(!expanded)}
      >
        <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox size="xs" checked={selected} onChange={onToggleSelect} />
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <Group gap={2}>
              <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => onReorder(card.id, "up")}>
                ↑
              </ActionIcon>
              <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => onReorder(card.id, "down")}>
                ↓
              </ActionIcon>
            </Group>
          </div>
          <Text size="sm" fw={700} c="yellow.5" style={{ minWidth: "48px", textDecoration: isDeleted ? "line-through" : undefined }}>
            {card.humanCardId}
          </Text>
          <Text size="sm" lineClamp={1} style={{ flex: 1, minWidth: 0, textDecoration: isDeleted ? "line-through" : undefined }}>
            {card.title}
          </Text>
        </Group>

        <Group gap="sm" wrap="nowrap">
          {card.cardHouses.map((ch) => (
            <Badge key={ch.house.id} size="xs" variant="outline" style={{ borderColor: ch.house.color, color: ch.house.color }}>
              {ch.house.name}
            </Badge>
          ))}
          {card.cardSet && (
            <Badge size="xs" variant="outline" style={{ borderColor: card.cardSet.color, color: card.cardSet.color }}>
              {card.cardSet.name}
            </Badge>
          )}
          {card.isAnswerable && <Badge size="xs" variant="dot" color="cyan">Answer</Badge>}
          {card.selfDestructTimer && <Badge size="xs" variant="dot" color="red">{card.selfDestructTimer}s</Badge>}
          {card.isSolved && <Badge size="xs" variant="filled" color="green">Solved</Badge>}
          {card.selfDestructedAt && <Badge size="xs" variant="filled" color="orange">Destructed</Badge>}
          <Text size="xs" c="dimmed" style={{ minWidth: "50px", textAlign: "right" }}>
            {relativeTime(card.updatedAt)}
          </Text>
          {isDeleted ? (
            <div onClick={(e) => e.stopPropagation()}>
              <Button size="xs" variant="light" color="yellow" onClick={handleRestore}>
                Restore
              </Button>
            </div>
          ) : (
            <div onClick={(e) => e.stopPropagation()}>
              <Switch
                size="xs"
                color="green"
                checked={card.isFinished}
                onChange={toggleFinished}
                label={<Text size="xs" c="dimmed">Done</Text>}
              />
            </div>
          )}
        </Group>
      </Group>

      {/* Expanded editor */}
      {!isDeleted && (
        <Collapse in={expanded}>
          <div style={{
            padding: "1rem 1.25rem",
            borderTop: "1px solid var(--mantine-color-dark-6)",
            background: "var(--mantine-color-dark-8)",
          }}>
            <Grid gutter="xl">
              <Grid.Col span={{ base: 12, md: 7 }}>
                <Stack gap="sm">
                  <Group grow>
                    <TextInput label="Card ID" size="xs" value={current("humanCardId")} onChange={(e) => updateDraft("humanCardId", e.target.value)} />
                    <NumberInput label="Act" size="xs" value={current("act") ?? ""} onChange={(v) => updateDraft("act", v || null)} min={1} max={5} />
                  </Group>

                  <Group grow>
                    <Select label="Card Set" size="xs" value={current("cardSetId") ?? ""} onChange={handleCardSetChange} data={cardSetData} clearable />
                    <MultiSelect label="Houses" size="xs" value={currentHouseIds} onChange={handleHousesChange} data={houseData} placeholder="Select houses..." />
                  </Group>

                  <TextInput label="Visible Category" size="xs" value={current("clueVisibleCategory") ?? ""} onChange={(e) => updateDraft("clueVisibleCategory", e.target.value || null)} />
                  <TextInput label="Title" size="xs" value={current("title")} onChange={(e) => updateDraft("title", e.target.value)} />

                  <Textarea label="Description (Markdown)" size="xs" minRows={5} maxRows={12} autosize value={current("description") ?? ""} onChange={(e) => updateDraft("description", e.target.value || null)} styles={{ input: { fontFamily: "'Courier New', monospace", fontSize: "0.8rem" } }} />
                  <Textarea label="Admin Notes" size="xs" minRows={2} maxRows={5} autosize value={current("notes") ?? ""} onChange={(e) => updateDraft("notes", e.target.value || null)} styles={{ input: { background: "rgba(212, 168, 67, 0.04)", borderColor: "rgba(212, 168, 67, 0.15)" } }} />

                  <Select label="Design" size="xs" value={current("designId") ?? ""} onChange={(v) => updateDraft("designId", v || null)} data={[{ value: "", label: "(None)" }, ...designs.map((d) => ({ value: d.id, label: d.name }))]} clearable />

                  <Group grow>
                    <Switch label="Entry Gate" size="xs" checked={current("hasEntryGate")} onChange={(e) => updateDraft("hasEntryGate", e.currentTarget.checked)} />
                    <TextInput label="Gate Button Text" size="xs" value={current("entryGateText") ?? ""} onChange={(e) => updateDraft("entryGateText", e.target.value || null)} placeholder="Enter" disabled={!current("hasEntryGate")} />
                  </Group>

                  <Group grow>
                    <NumberInput label="Self-Destruct (seconds)" size="xs" value={current("selfDestructTimer") ?? ""} onChange={(v) => updateDraft("selfDestructTimer", v || null)} min={0} />
                    <Switch label="Answer visible after destruct" size="xs" checked={current("answerVisibleAfterDestruct")} onChange={(e) => updateDraft("answerVisibleAfterDestruct", e.currentTarget.checked)} />
                  </Group>

                  <TextInput label="Self-Destruct Text" size="xs" value={current("selfDestructText") ?? ""} onChange={(e) => updateDraft("selfDestructText", e.target.value || null)} placeholder="This card's information is no longer available." />

                  <Group grow>
                    <Switch label="Locked Out" size="xs" color="red" checked={current("lockedOut")} onChange={(e) => updateDraft("lockedOut", e.currentTarget.checked)} />
                    <TextInput label="Lock Reason" size="xs" value={current("lockedOutReason") ?? ""} onChange={(e) => updateDraft("lockedOutReason", e.target.value || null)} disabled={!current("lockedOut")} />
                  </Group>

                  {/* Action bar */}
                  <Group justify="space-between" mt="xs">
                    <Group gap="xs">
                      <Button size="xs" variant="light" color="orange" onClick={handleReset}>
                        Reset Runtime
                      </Button>
                      <Button size="xs" variant="light" color="red" onClick={handleDelete}>
                        Delete
                      </Button>
                    </Group>
                    <Group gap="xs">
                      {hasChanges && <Text size="xs" c="yellow.5">Unsaved changes</Text>}
                      {hasChanges && <Button size="xs" variant="subtle" color="gray" onClick={() => setDraft({})}>Discard</Button>}
                      <Button size="xs" color="yellow" onClick={save} disabled={!hasChanges} loading={saving}>
                        Save Changes
                      </Button>
                    </Group>
                  </Group>
                </Stack>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 5 }}>
                <Stack align="center" gap="md">
                  <PhonePreview cardId={card.id} />
                  <Tooltip label="Download QR code PNG">
                    <Button size="xs" variant="light" color="yellow" onClick={downloadQR} fullWidth style={{ maxWidth: "280px" }}>
                      Download QR Code
                    </Button>
                  </Tooltip>
                </Stack>
              </Grid.Col>
            </Grid>
          </div>
        </Collapse>
      )}
    </div>
  );
}

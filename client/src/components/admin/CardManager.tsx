import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Group,
  Text,
  Tabs,
  Badge,
  Loader,
  TextInput,
  Textarea,
  Button,
  Stack,
  ActionIcon,
  Switch,
  Checkbox,
} from "@mantine/core";
import {
  fetchGame,
  fetchCards,
  fetchCardSets,
  fetchDesigns,
  fetchHouses,
  fetchMissions,
  reviewCardSet,
  updateCardSet,
  createCard,
  resetAllCards,
  reorderCards,
  bulkOperation,
  type GameDetail,
  type AdminCard,
  type AdminCardSet,
  type AdminDesign,
  type AdminHouse,
  type AdminMission,
} from "../../api/admin";
import { CardRow } from "./CardRow";
import { SetReviewBanner } from "./SetReviewBanner";
import { BulkActionBar } from "./BulkActionBar";

export function CardManager() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [cards, setCards] = useState<AdminCard[]>([]);
  const [cardSets, setCardSets] = useState<AdminCardSet[]>([]);
  const [designs, setDesigns] = useState<AdminDesign[]>([]);
  const [houses, setHouses] = useState<AdminHouse[]>([]);
  const [missions, setMissions] = useState<AdminMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    const [g, c, s, d, h, m] = await Promise.all([
      fetchGame(gameId),
      fetchCards(gameId, { showDeleted: true }),
      fetchCardSets(gameId),
      fetchDesigns(gameId),
      fetchHouses(gameId),
      fetchMissions(gameId),
    ]);
    setGame(g);
    setCards(c);
    setCardSets(s);
    setDesigns(d);
    setHouses(h);
    setMissions(m);
    setLoading(false);
  }, [gameId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCardUpdated = useCallback((updated: AdminCard) => {
    setCards((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c)),
    );
    if (gameId) fetchCardSets(gameId).then(setCardSets);
  }, [gameId]);

  const handleCardRemoved = useCallback((cardId: string) => {
    loadData();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
  }, [loadData]);

  const handleReviewSet = useCallback(async (cardSetId: string) => {
    if (!gameId) return;
    await reviewCardSet(gameId, cardSetId);
    setCardSets(await fetchCardSets(gameId));
  }, [gameId]);

  const handleHousesChanged = useCallback(() => {
    if (gameId) fetchHouses(gameId).then(setHouses);
  }, [gameId]);

  const handleCardSetsChanged = useCallback(() => {
    if (gameId) fetchCardSets(gameId).then(setCardSets);
  }, [gameId]);

  const handleNewCard = useCallback(async () => {
    if (!gameId) return;
    const card = await createCard(gameId, {});
    await loadData();
  }, [gameId, loadData]);

  const handleResetAll = useCallback(async () => {
    if (!gameId) return;
    if (!window.confirm("Reset all cards? This clears self-destruct timers, solved status, and all scan/answer data.")) return;
    await resetAllCards(gameId);
    await loadData();
  }, [gameId, loadData]);

  const handleReorder = useCallback(async (cardId: string, direction: "up" | "down") => {
    if (!gameId) return;
    const idx = cards.findIndex((c) => c.id === cardId);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= cards.length) return;

    const newCards = [...cards];
    [newCards[idx], newCards[swapIdx]] = [newCards[swapIdx], newCards[idx]];
    setCards(newCards);

    await reorderCards(gameId, newCards.map((c) => c.id));
  }, [gameId, cards]);

  const handleBulkApply = useCallback(async (action: string, value?: any) => {
    if (!gameId || selectedIds.size === 0) return;
    await bulkOperation(gameId, [...selectedIds], action, value);
    setSelectedIds(new Set());
    await loadData();
  }, [gameId, selectedIds, loadData]);

  const toggleSelect = useCallback((cardId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }, []);

  if (loading) {
    return (
      <Group justify="center" pt="xl">
        <Loader color="yellow" size="sm" />
      </Group>
    );
  }

  if (!game) return null;

  // Filter cards
  const activeCards = showDeleted ? cards : cards.filter((c) => !c.deletedAt);
  let filtered = activeCards;
  if (activeTab === "__none__") {
    filtered = activeCards.filter((c) => !c.cardSetId);
  } else if (activeTab !== "all") {
    filtered = activeCards.filter((c) => c.cardSetId === activeTab);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.humanCardId.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.cardHouses.some((ch) => ch.house.name.toLowerCase().includes(q)) ||
        (c.notes?.toLowerCase().includes(q) ?? false),
    );
  }

  const currentSet = activeTab !== "all" && activeTab !== "__none__"
    ? cardSets.find((s) => s.id === activeTab)
    : null;

  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)));
    }
  };

  return (
    <div>
      {/* Header */}
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <ActionIcon variant="subtle" color="gray" onClick={() => navigate("/admin")}>
            ←
          </ActionIcon>
          <div>
            <Text size="xl" fw={700}>{game.name}</Text>
            <Text size="xs" c="dimmed">
              {game.cardCount} cards &middot; {game.finishedCount} finished
            </Text>
          </div>
        </Group>
        <Group gap="sm">
          <Switch
            size="xs"
            label={<Text size="xs" c="dimmed">Show deleted</Text>}
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.currentTarget.checked)}
          />
          <TextInput
            placeholder="Search cards..."
            size="xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 200 }}
          />
          <Button size="xs" variant="light" color="red" onClick={handleResetAll}>
            Reset All
          </Button>
          <Button
            size="xs"
            variant="light"
            color="green"
            onClick={() => navigate(`/admin/games/${gameId}/dashboard`)}
          >
            Live Dashboard
          </Button>
          <Button
            size="xs"
            variant="light"
            color="orange"
            onClick={() => navigate(`/admin/games/${gameId}/missions`)}
          >
            Missions
          </Button>
          <Button
            size="xs"
            variant="light"
            color="violet"
            onClick={() => navigate(`/admin/games/${gameId}/simulator`)}
          >
            Simulator
          </Button>
          <Button size="sm" color="yellow" onClick={handleNewCard}>
            + New Card
          </Button>
        </Group>
      </Group>

      {/* Set tabs */}
      <Tabs value={activeTab} onChange={(v) => setActiveTab(v ?? "all")} mb="md">
        <Tabs.List>
          <Tabs.Tab value="all">
            <Group gap={6}>
              All
              <Badge size="xs" variant="filled" color="dark">{activeCards.length}</Badge>
            </Group>
          </Tabs.Tab>
          {cardSets.map((set) => (
            <Tabs.Tab key={set.id} value={set.id}>
              <Group gap={6}>
                <span style={{ color: set.color, fontWeight: 600 }}>{set.name}</span>
                <Badge size="xs" variant="filled" color="dark">{set.cardCount}</Badge>
                {set.modifiedSinceReview > 0 && (
                  <Badge size="xs" variant="filled" color="yellow">{set.modifiedSinceReview}</Badge>
                )}
              </Group>
            </Tabs.Tab>
          ))}
          {activeCards.some((c) => !c.cardSetId) && (
            <Tabs.Tab value="__none__">
              <Group gap={6}>
                (No set)
                <Badge size="xs" variant="filled" color="dark">
                  {activeCards.filter((c) => !c.cardSetId).length}
                </Badge>
              </Group>
            </Tabs.Tab>
          )}
        </Tabs.List>
      </Tabs>

      {/* Set notes + missions + review banner */}
      {currentSet && (
        <>
          <EditableSetNotes
            key={currentSet.id}
            gameId={gameId!}
            cardSet={currentSet}
            onUpdated={(updated) =>
              setCardSets((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
            }
          />
          <SetMissions
            cardSetId={currentSet.id}
            cardSetColor={currentSet.color}
            missions={missions}
            gameId={gameId!}
          />
          <SetReviewBanner
            modifiedCount={currentSet.modifiedSinceReview}
            onReview={() => handleReviewSet(currentSet.id)}
          />
        </>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          designs={designs}
          cardSets={cardSets}
          onApply={handleBulkApply}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}

      {/* Select all checkbox */}
      {filtered.length > 0 && (
        <Group px="md" mb="xs">
          <Checkbox
            size="xs"
            checked={allFilteredSelected}
            indeterminate={selectedIds.size > 0 && !allFilteredSelected}
            onChange={toggleSelectAll}
            label={<Text size="xs" c="dimmed">Select all</Text>}
          />
        </Group>
      )}

      {/* Card list */}
      {filtered.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No cards match your filters.
        </Text>
      ) : activeTab === "all" ? (
        <ActGroupedCardList
          cards={filtered}
          gameId={gameId!}
          designs={designs}
          cardSets={cardSets}
          houses={houses}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onCardUpdated={handleCardUpdated}
          onCardRemoved={handleCardRemoved}
          onHousesChanged={handleHousesChanged}
          onCardSetsChanged={handleCardSetsChanged}
          onReorder={handleReorder}
        />
      ) : (
        <Stack gap={0}>
          {filtered.map((card) => (
            <CardRow
              key={card.id}
              card={card}
              gameId={gameId!}
              designs={designs}
              cardSets={cardSets}
              houses={houses}
              selected={selectedIds.has(card.id)}
              onToggleSelect={() => toggleSelect(card.id)}
              onCardUpdated={handleCardUpdated}
              onCardRemoved={handleCardRemoved}
              onHousesChanged={handleHousesChanged}
              onCardSetsChanged={handleCardSetsChanged}
              onReorder={handleReorder}
            />
          ))}
        </Stack>
      )}
    </div>
  );
}

function EditableSetNotes({
  gameId,
  cardSet,
  onUpdated,
}: {
  gameId: string;
  cardSet: AdminCardSet;
  onUpdated: (updated: AdminCardSet) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(cardSet.notes ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const updated = await updateCardSet(gameId, cardSet.id, {
      notes: draft.trim() || null,
    });
    onUpdated(updated);
    setEditing(false);
    setSaving(false);
  };

  const cancel = () => {
    setDraft(cardSet.notes ?? "");
    setEditing(false);
  };

  if (editing) {
    return (
      <Stack gap="xs" mb="sm">
        <Textarea
          autoFocus
          size="sm"
          autosize
          minRows={2}
          maxRows={6}
          placeholder="Set notes (visible only in admin)..."
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
            if (e.key === "Escape") cancel();
          }}
          styles={{
            input: {
              borderLeft: `3px solid ${cardSet.color}`,
              background: "rgba(255,255,255,0.03)",
            },
          }}
        />
        <Group gap="xs">
          <Button size="xs" color="yellow" loading={saving} onClick={save}>
            Save
          </Button>
          <Button size="xs" variant="subtle" color="gray" onClick={cancel}>
            Cancel
          </Button>
          <Text size="xs" c="dimmed">Cmd+Enter to save · Esc to cancel</Text>
        </Group>
      </Stack>
    );
  }

  return (
    <Text
      size="sm"
      c="dimmed"
      mb="sm"
      p="sm"
      style={{
        borderRadius: "6px",
        background: "rgba(255,255,255,0.03)",
        borderLeft: `3px solid ${cardSet.color}`,
        cursor: "pointer",
      }}
      onClick={() => {
        setDraft(cardSet.notes ?? "");
        setEditing(true);
      }}
    >
      {cardSet.notes || "Click to add notes..."}
    </Text>
  );
}

function SetMissions({
  cardSetId,
  cardSetColor,
  missions,
  gameId,
}: {
  cardSetId: string;
  cardSetColor: string;
  missions: AdminMission[];
  gameId: string;
}) {
  const navigate = useNavigate();

  // Find missions that require this card set
  const related = missions.filter((m) =>
    (m.requiredClueSets ?? []).some((rc: any) => rc.cardSetId === cardSetId),
  );

  if (related.length === 0) return null;

  return (
    <div
      style={{
        marginBottom: "var(--mantine-spacing-sm)",
        padding: "var(--mantine-spacing-xs) var(--mantine-spacing-sm)",
        borderRadius: "6px",
        background: "rgba(255, 200, 0, 0.03)",
        border: "1px solid var(--mantine-color-dark-5)",
      }}
    >
      <Group justify="space-between" mb={4}>
        <Text size="xs" fw={600} c="yellow.5">
          Missions using this set
        </Text>
        <ActionIcon
          size="xs"
          variant="subtle"
          color="yellow"
          onClick={() => navigate(`/admin/games/${gameId}/missions`)}
          title="Go to missions"
        >
          →
        </ActionIcon>
      </Group>
      <Stack gap={2}>
        {related.map((m) => {
          const needed = (m.requiredClueSets ?? []).find(
            (rc: any) => rc.cardSetId === cardSetId,
          ) as { count: number } | undefined;
          return (
            <Group key={m.id} gap="xs">
              <Badge
                size="xs"
                variant={m.isCompleted ? "filled" : "outline"}
                color={m.isCompleted ? "green" : "gray"}
              >
                {m.isCompleted ? "Done" : `Act ${m.act}`}
              </Badge>
              <Text size="xs">{m.title}</Text>
              {m.missionHouses.map((mh) => (
                <Badge
                  key={mh.house.id}
                  size="xs"
                  variant="dot"
                  color="gray"
                  style={{ borderColor: mh.house.color }}
                >
                  {mh.house.name}
                </Badge>
              ))}
              {needed && (
                <Text size="xs" c="dimmed">
                  (needs {needed.count})
                </Text>
              )}
            </Group>
          );
        })}
      </Stack>
    </div>
  );
}

function ActGroupedCardList({
  cards, gameId, designs, cardSets, houses, selectedIds,
  onToggleSelect, onCardUpdated, onCardRemoved, onHousesChanged, onCardSetsChanged, onReorder,
}: {
  cards: AdminCard[];
  gameId: string;
  designs: AdminDesign[];
  cardSets: AdminCardSet[];
  houses: AdminHouse[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onCardUpdated: (card: AdminCard) => void;
  onCardRemoved: (id: string) => void;
  onHousesChanged: () => void;
  onCardSetsChanged: () => void;
  onReorder: (id: string, dir: "up" | "down") => void;
}) {
  const groups = new Map<number | null, AdminCard[]>();
  for (const card of cards) {
    if (!groups.has(card.act)) groups.set(card.act, []);
    groups.get(card.act)!.push(card);
  }

  const sortedActs = [...groups.keys()].sort((a, b) => {
    if (a === null) return 1;
    if (b === null) return -1;
    return a - b;
  });

  return (
    <Stack gap="lg">
      {sortedActs.map((act) => (
        <div key={act ?? "none"}>
          <Group gap="sm" mb="sm" pb="xs" style={{ borderBottom: "1px solid var(--mantine-color-dark-6)" }}>
            <Text size="sm" fw={700} c="yellow.5" tt="uppercase" lts="0.08em">
              {act !== null ? `Act ${act}` : "No Act Assigned"}
            </Text>
            <Badge size="xs" variant="filled" color="dark">{groups.get(act)!.length}</Badge>
          </Group>
          <Stack gap={0}>
            {groups.get(act)!.map((card) => (
              <CardRow
                key={card.id}
                card={card}
                gameId={gameId}
                designs={designs}
                cardSets={cardSets}
                houses={houses}
                selected={selectedIds.has(card.id)}
                onToggleSelect={() => onToggleSelect(card.id)}
                onCardUpdated={onCardUpdated}
                onCardRemoved={onCardRemoved}
                onHousesChanged={onHousesChanged}
                onCardSetsChanged={onCardSetsChanged}
                onReorder={onReorder}
              />
            ))}
          </Stack>
        </div>
      ))}
    </Stack>
  );
}

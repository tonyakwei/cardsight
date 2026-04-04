import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Group,
  Text,
  Button,
  Tabs,
  Loader,
  ActionIcon,
} from "@mantine/core";
import {
  fetchSimulator,
  fetchGame,
  saveSimulator,
  autoDistribute,
  type SimulatorCard,
  type AdminHouse,
  type GameDetail,
} from "../../../api/admin";
import { TableColumn } from "./TableColumn";
import { PreviewSidebar } from "./PreviewSidebar";

export function TableSimulator() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [houses, setHouses] = useState<AdminHouse[]>([]);
  const [cards, setCards] = useState<SimulatorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeAct, setActiveAct] = useState<string>("1");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const loadData = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    const [g, sim] = await Promise.all([
      fetchGame(gameId),
      fetchSimulator(gameId),
    ]);
    setGame(g);
    setHouses(sim.houses);
    setCards(sim.cards);
    setLoading(false);
    setDirty(false);
  }, [gameId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const actNum = parseInt(activeAct) || null;
  const actCards = cards.filter((c) => c.act === actNum);
  const unassigned = actCards.filter((c) => !c.tableHouseId);

  const handleDrop = useCallback((cardId: string, tableHouseId: string | null) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, tableHouseId } : c)),
    );
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!gameId) return;
    setSaving(true);
    const assignments = cards.map((c) => ({
      cardId: c.id,
      tableHouseId: c.tableHouseId,
    }));
    await saveSimulator(gameId, assignments);
    setSaving(false);
    setDirty(false);
  }, [gameId, cards]);

  const handleAutoDistribute = useCallback(async () => {
    if (!gameId || !actNum) return;
    const result = await autoDistribute(gameId, actNum);
    // Apply results to local state
    const assignMap = new Map(result.map((a) => [a.cardId, a.tableHouseId]));
    setCards((prev) =>
      prev.map((c) =>
        assignMap.has(c.id) ? { ...c, tableHouseId: assignMap.get(c.id)! } : c,
      ),
    );
    setDirty(true);
  }, [gameId, actNum]);

  const selectedCard = selectedCardId
    ? cards.find((c) => c.id === selectedCardId) ?? null
    : null;

  // Compute distinct acts from cards
  const acts = [...new Set(cards.map((c) => c.act).filter((a): a is number => a !== null))].sort();

  if (loading) {
    return (
      <Group justify="center" pt="xl">
        <Loader color="yellow" size="sm" />
      </Group>
    );
  }

  return (
    <div style={{ display: "flex", gap: "0" }}>
      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
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
                {game?.name} — Table Simulator
              </Text>
              <Text size="xs" c="dimmed">
                Drag cards between tables to plan distribution
              </Text>
            </div>
          </Group>
          <Group gap="sm">
            <Button
              size="xs"
              variant="light"
              color="violet"
              onClick={handleAutoDistribute}
              disabled={!actNum}
            >
              Auto-Distribute
            </Button>
            <Button
              size="sm"
              color="yellow"
              onClick={handleSave}
              loading={saving}
              disabled={!dirty}
            >
              {dirty ? "Save Changes" : "Saved"}
            </Button>
          </Group>
        </Group>

        {/* Act tabs */}
        <Tabs value={activeAct} onChange={(v) => setActiveAct(v ?? "1")} mb="md">
          <Tabs.List>
            {acts.map((act) => (
              <Tabs.Tab key={act} value={String(act)}>
                Act {act}
              </Tabs.Tab>
            ))}
            {cards.some((c) => c.act === null) && (
              <Tabs.Tab value="none">No Act</Tabs.Tab>
            )}
          </Tabs.List>
        </Tabs>

        {/* Table columns */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            overflow: "auto",
            minHeight: "400px",
            maxHeight: "calc(100vh - 200px)",
          }}
        >
          {/* Unassigned pool */}
          <TableColumn
            title="Unassigned"
            color="#888"
            houseId={null}
            cards={unassigned}
            selectedCardId={selectedCardId}
            onCardClick={setSelectedCardId}
            onDrop={handleDrop}
          />

          {/* House tables */}
          {houses.map((house) => (
            <TableColumn
              key={house.id}
              title={`${house.name} Table`}
              color={house.color}
              houseId={house.id}
              cards={actCards.filter((c) => c.tableHouseId === house.id)}
              selectedCardId={selectedCardId}
              onCardClick={setSelectedCardId}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>

      {/* Preview sidebar */}
      {selectedCard && (
        <PreviewSidebar
          card={selectedCard}
          onClose={() => setSelectedCardId(null)}
        />
      )}
    </div>
  );
}

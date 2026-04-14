import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router";
import {
  Group,
  Text,
  Button,
  Tabs,
  Loader,
  Switch,
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
import physicalCards from "../../../../../shared/physical-cards.json";

function printDistribution(
  act: number | null,
  cards: SimulatorCard[],
  houses: AdminHouse[],
  physicalNameMap: Map<string, string>,
) {
  const byHouse = new Map<string | null, SimulatorCard[]>();
  for (const card of cards) {
    const key = card.tableHouseId;
    if (!byHouse.has(key)) byHouse.set(key, []);
    byHouse.get(key)!.push(card);
  }

  const win = window.open("", "_blank");
  if (!win) return;

  let html = `<!DOCTYPE html><html><head><title>Distribution — Act ${act}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: system-ui, sans-serif; padding: 0.5in; }
      h1 { font-size: 18px; margin-bottom: 4px; }
      h2 { font-size: 14px; margin: 16px 0 6px; padding-bottom: 4px; border-bottom: 2px solid; }
      .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px 12px; }
      .card { font-size: 12px; padding: 3px 0; display: flex; gap: 6px; align-items: center; }
      .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .sub { font-size: 11px; color: #888; }
      @media print { @page { size: letter portrait; margin: 0.5in; } }
    </style></head><body>`;

  html += `<h1>Card Distribution — Act ${act}</h1>
    <p class="sub">${cards.length} cards across ${houses.length} houses</p>`;

  for (const house of houses) {
    const houseCards = byHouse.get(house.id) ?? [];
    html += `<h2 style="border-color: ${house.color};">${house.name} (${houseCards.length} cards)</h2>`;
    html += `<div class="cards">`;
    for (const card of houseCards) {
      const name = physicalNameMap.get(card.physicalCardId) ?? card.physicalCardId.slice(0, 8);
      const setName = card.cardSet?.name ?? "";
      html += `<div class="card"><span class="dot" style="background:${card.cardSet?.color ?? '#666'}"></span><strong>${name}</strong> <span class="sub">${setName}</span></div>`;
    }
    html += `</div>`;
  }

  const unassigned = byHouse.get(null) ?? [];
  if (unassigned.length > 0) {
    html += `<h2 style="border-color: #888;">Unassigned (${unassigned.length})</h2><div class="cards">`;
    for (const card of unassigned) {
      const name = physicalNameMap.get(card.physicalCardId) ?? card.physicalCardId.slice(0, 8);
      html += `<div class="card"><strong>${name}</strong></div>`;
    }
    html += `</div>`;
  }

  html += `</body></html>`;
  win.document.write(html);
  win.document.close();
  win.print();
}

export function TableSimulator() {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [houses, setHouses] = useState<AdminHouse[]>([]);
  const [cards, setCards] = useState<SimulatorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeAct, setActiveAct] = useState<string>("1");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showPhysicalNames, setShowPhysicalNames] = useState(false);

  // Build lookup map: card UUID → physical card name
  const physicalNameMap = new Map(physicalCards.map((pc) => [pc.id, pc.name]));

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
  const acts = [...new Set(cards.map((c) => c.act))].sort();

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
          <div>
            <Text size="xl" fw={700}>
              {game?.name} — Table Simulator
            </Text>
            <Text size="xs" c="dimmed">
              Drag cards between tables to plan distribution
            </Text>
          </div>
          <Group gap="sm">
            <Switch
              label="Physical names"
              size="xs"
              checked={showPhysicalNames}
              onChange={(e) => setShowPhysicalNames(e.currentTarget.checked)}
              styles={{ label: { color: "var(--mantine-color-dimmed)", cursor: "pointer" } }}
            />
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
              size="xs"
              variant="light"
              color="cyan"
              onClick={() => printDistribution(actNum, actCards, houses, physicalNameMap)}
              disabled={!actNum || actCards.length === 0}
            >
              Print Distribution
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
            physicalNameMap={showPhysicalNames ? physicalNameMap : undefined}
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
              physicalNameMap={showPhysicalNames ? physicalNameMap : undefined}
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

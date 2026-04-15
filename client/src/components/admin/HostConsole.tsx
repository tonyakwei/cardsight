import { useState, useCallback } from "react";
import { useParams } from "react-router";
import {
  Group,
  Text,
  Badge,
  Button,
  Loader,
  SegmentedControl,
  Modal,
  Box,
} from "@mantine/core";
import {
  fetchGame,
  fetchDashboard,
  fetchCards,
  fetchMissions,
  fetchShowtimes,
  updateCard,
  resetCard,
  updateMission,
  transitionAct,
  triggerShowtime,
  resetShowtime,
  type GameDetail,
  type DashboardData,
  type AdminCard,
  type AdminMission,
  type AdminShowtime,
} from "../../api/admin";
import { pcName } from "../../utils/physicalCards";
import { usePolling } from "../../hooks/usePolling";
import { PulseTab } from "./host-console/PulseTab";
import { ActivityTab } from "./host-console/ActivityTab";
import { CardsTab } from "./host-console/CardsTab";
import { MissionsTab } from "./host-console/MissionsTab";
import { ShowtimeTab } from "./host-console/ShowtimeTab";

const POLL_INTERVAL = 5000;

type Tab = "pulse" | "activity" | "cards" | "missions" | "showtime";

export function HostConsole() {
  const { gameId } = useParams<{ gameId: string }>();
  const [tab, setTab] = useState<Tab>("pulse");
  const [game, setGame] = useState<GameDetail | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [cards, setCards] = useState<AdminCard[]>([]);
  const [missions, setMissions] = useState<AdminMission[]>([]);
  const [showtimes, setShowtimes] = useState<AdminShowtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cardSearch, setCardSearch] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const loadData = useCallback(async () => {
    if (!gameId) return;
    try {
      const [g, d, c, m, s] = await Promise.all([
        fetchGame(gameId),
        fetchDashboard(gameId),
        fetchCards(gameId),
        fetchMissions(gameId),
        fetchShowtimes(gameId),
      ]);
      setGame(g);
      setDashboard(d);
      setCards(c);
      setMissions(m);
      setShowtimes(s);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  usePolling(loadData, POLL_INTERVAL);

  // === Actions ===

  async function doAction(id: string, fn: () => Promise<void>) {
    setActionLoading(id);
    try {
      await fn();
      await loadData();
    } finally {
      setActionLoading(null);
    }
  }

  function toggleCardLock(card: AdminCard) {
    const locking = !card.lockedOut;
    doAction(card.id, () =>
      updateCard(gameId!, card.id, {
        lockedOut: locking,
        lockedOutReason: locking ? "Locked by host" : null,
      }).then(() => {}),
    );
  }

  function doResetCard(card: AdminCard) {
    setConfirmModal({
      title: "Reset Card",
      message: `Reset "${pcName(card.physicalCardId)}"? This clears examination state, self-destruct, solve status, and all scan/answer events.`,
      onConfirm: () => {
        setConfirmModal(null);
        doAction(card.id, () => resetCard(gameId!, card.id).then(() => {}));
      },
    });
  }

  function toggleMissionLock(mission: AdminMission) {
    const locking = !mission.lockedOut;
    doAction(mission.id, () =>
      updateMission(gameId!, mission.id, {
        lockedOut: locking,
        lockedOutReason: locking ? "Locked by host" : null,
      }).then(() => {}),
    );
  }

  function doEndAct(act: number) {
    setConfirmModal({
      title: `End Act ${act}`,
      message: `This will lock all Act ${act} cards, unlock Act ${act + 1} cards, and trigger consequences. Are you sure?`,
      onConfirm: () => {
        setConfirmModal(null);
        doAction(`act-${act}`, () =>
          transitionAct(gameId!, act).then(() => {}),
        );
      },
    });
  }

  function doTriggerShowtime(st: AdminShowtime) {
    setConfirmModal({
      title: "Force Trigger Reveal",
      message: `Force-trigger "${st.title}"? This skips the sync mechanic and reveals immediately.`,
      onConfirm: () => {
        setConfirmModal(null);
        doAction(st.id, () => triggerShowtime(gameId!, st.id).then(() => {}));
      },
    });
  }

  function doResetShowtime(st: AdminShowtime) {
    setConfirmModal({
      title: "Reset Showtime",
      message: `Reset "${st.title}"? Clears all slot inputs, sync state, and reverts to filling phase.`,
      onConfirm: () => {
        setConfirmModal(null);
        doAction(st.id, () => resetShowtime(gameId!, st.id).then(() => {}));
      },
    });
  }

  // === Render ===

  if (loading) {
    return (
      <Group justify="center" pt="xl">
        <Loader color="yellow" size="lg" />
      </Group>
    );
  }

  if (!game || !dashboard) return null;

  const activeAct = game.currentAct;

  return (
    <Box
      style={{
        maxWidth: 480,
        margin: "0 auto",
        paddingBottom: 80,
      }}
    >
      <Box
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "var(--mantine-color-dark-8)",
          paddingTop: 4,
          paddingBottom: 8,
        }}
      >
        <Group justify="space-between" mb={6}>
          <Text size="sm" fw={700} c="yellow.5">
            {game.name}
          </Text>
          <Badge color="yellow" variant="light" size="lg">
            Act {activeAct}
          </Badge>
        </Group>
        <SegmentedControl
          value={tab}
          onChange={(v) => setTab(v as Tab)}
          fullWidth
          size="xs"
          color="yellow"
          data={[
            { label: "Pulse", value: "pulse" },
            { label: "Activity", value: "activity" },
            { label: "Cards", value: "cards" },
            { label: "Missions", value: "missions" },
            { label: "Showtime", value: "showtime" },
          ]}
        />
      </Box>

      <Box mt="sm">
        {tab === "pulse" && (
          <PulseTab
            dashboard={dashboard}
            activeAct={activeAct}
            onEndAct={doEndAct}
            actionLoading={actionLoading}
          />
        )}
        {tab === "activity" && <ActivityTab dashboard={dashboard} />}
        {tab === "cards" && (
          <CardsTab
            cards={cards.filter((c) => !c.deletedAt)}
            search={cardSearch}
            onSearchChange={setCardSearch}
            onToggleLock={toggleCardLock}
            onReset={doResetCard}
            actionLoading={actionLoading}
          />
        )}
        {tab === "missions" && (
          <MissionsTab
            missions={missions}
            onToggleLock={toggleMissionLock}
            actionLoading={actionLoading}
          />
        )}
        {tab === "showtime" && (
          <ShowtimeTab
            showtimes={showtimes}
            onTrigger={doTriggerShowtime}
            onReset={doResetShowtime}
            actionLoading={actionLoading}
          />
        )}
      </Box>

      <Modal
        opened={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.title}
        centered
        size="sm"
        styles={{
          title: { fontWeight: 700 },
        }}
      >
        <Text size="sm" mb="lg">
          {confirmModal?.message}
        </Text>
        <Group justify="flex-end">
          <Button
            variant="default"
            size="sm"
            onClick={() => setConfirmModal(null)}
          >
            Cancel
          </Button>
          <Button
            color="red"
            size="sm"
            onClick={confirmModal?.onConfirm}
          >
            Confirm
          </Button>
        </Group>
      </Modal>
    </Box>
  );
}

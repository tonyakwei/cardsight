import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router";
import {
  Group,
  Text,
  Badge,
  Button,
  Loader,
  Stack,
  Paper,
  Progress,
  TextInput,
  ActionIcon,
  SegmentedControl,
  Modal,
  Divider,
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
import physicalCards from "../../../../shared/physical-cards.json";

// Physical card lookup
const pcMap = new Map(physicalCards.map((pc) => [pc.id, pc]));
function pcName(id: string) {
  const pc = pcMap.get(id);
  return pc ? pc.name : id.slice(0, 8);
}
function pcColor(id: string) {
  const pc = pcMap.get(id);
  return pc?.color ?? "gray";
}
function pcShort(id: string) {
  const pc = pcMap.get(id);
  return pc ? `${pc.color[0].toUpperCase()}${pc.number}` : id.slice(0, 4);
}

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    loadData();
    intervalRef.current = setInterval(loadData, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData]);

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
      {/* Tab bar — sticky at top */}
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

      {/* Confirm modal */}
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

// ========================================
// PULSE TAB
// ========================================

function PulseTab({
  dashboard,
  activeAct,
  onEndAct,
  actionLoading,
}: {
  dashboard: DashboardData;
  activeAct: number;
  onEndAct: (act: number) => void;
  actionLoading: string | null;
}) {
  const { overview, cardDiscovery, missionProgress } = dashboard;
  const discoveryPct =
    overview.totalCards > 0
      ? Math.round((overview.cardsScanned / overview.totalCards) * 100)
      : 0;

  return (
    <Stack gap="sm">
      {/* Big numbers */}
      <Paper bg="dark.7" p="md" radius="md">
        <Group justify="space-around">
          <StatBlock
            label="Scanned"
            value={`${overview.cardsScanned}/${overview.totalCards}`}
            sub={`${discoveryPct}%`}
          />
          <StatBlock label="Total Scans" value={String(overview.totalScans)} />
          <StatBlock
            label="Answers"
            value={`${overview.correctAttempts}/${overview.totalAttempts}`}
          />
        </Group>
        <Progress value={discoveryPct} color="yellow" size="sm" mt="sm" />
      </Paper>

      {/* Card discovery by set */}
      <Paper bg="dark.7" p="md" radius="md">
        <Text size="xs" fw={600} c="dimmed" mb="xs">
          DISCOVERY BY SET
        </Text>
        <Stack gap={6}>
          {cardDiscovery.map((s) => (
            <Group key={s.setId ?? "none"} justify="space-between" gap="xs">
              <Group gap="xs" style={{ flex: 1 }}>
                <Box
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    backgroundColor: s.setColor,
                    flexShrink: 0,
                  }}
                />
                <Text size="sm" lineClamp={1} style={{ flex: 1 }}>
                  {s.setName}
                </Text>
              </Group>
              <Group gap={4}>
                <Text size="xs" c="dimmed">
                  {s.scanned}/{s.total}
                </Text>
                {s.solved > 0 && (
                  <Badge size="xs" color="green" variant="light">
                    {s.solved} solved
                  </Badge>
                )}
              </Group>
            </Group>
          ))}
        </Stack>
      </Paper>

      {/* Mission progress by house */}
      <Paper bg="dark.7" p="md" radius="md">
        <Text size="xs" fw={600} c="dimmed" mb="xs">
          MISSION PROGRESS
        </Text>
        <Stack gap={8}>
          {missionProgress.map((hp) => {
            const pct =
              hp.total > 0 ? Math.round((hp.completed / hp.total) * 100) : 0;
            return (
              <div key={hp.house.id}>
                <Group justify="space-between" mb={2}>
                  <Group gap="xs">
                    <Box
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor: hp.house.color,
                      }}
                    />
                    <Text size="sm" fw={500}>
                      {hp.house.name}
                    </Text>
                  </Group>
                  <Text size="sm" fw={600}>
                    {hp.completed}/{hp.total}
                  </Text>
                </Group>
                <Progress value={pct} color={hp.house.color} size="xs" />
              </div>
            );
          })}
        </Stack>
      </Paper>

      {/* End Act button */}
      {activeAct < 3 && (
        <Button
          color="red"
          size="lg"
          fullWidth
          loading={actionLoading === `act-${activeAct}`}
          onClick={() => onEndAct(activeAct)}
          styles={{
            root: { height: 56, fontSize: "1.1rem" },
          }}
        >
          End Act {activeAct}
        </Button>
      )}
    </Stack>
  );
}

function StatBlock({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="xl" fw={700} c="yellow.4">
        {value}
      </Text>
      {sub && (
        <Text size="xs" c="dimmed">
          {sub}
        </Text>
      )}
    </div>
  );
}

// ========================================
// ACTIVITY TAB
// ========================================

function ActivityTab({ dashboard }: { dashboard: DashboardData }) {
  const { activity } = dashboard;

  if (activity.length === 0) {
    return (
      <Text c="dimmed" ta="center" pt="xl">
        No activity yet
      </Text>
    );
  }

  return (
    <Stack gap={4}>
      <Text size="xs" fw={600} c="dimmed" mb="xs">
        LIVE FEED (last 30)
      </Text>
      {activity.map((ev, i) => {
        const name = pcName(ev.cardId);
        const ago = timeAgo(ev.at);
        return (
          <Paper key={i} bg="dark.7" px="sm" py={8} radius="sm">
            <Group justify="space-between" wrap="nowrap">
              <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                <Badge
                  size="xs"
                  variant="light"
                  color={ev.type === "scan" ? "blue" : ev.isCorrect ? "green" : "red"}
                  style={{ flexShrink: 0 }}
                >
                  {ev.type === "scan"
                    ? "SCAN"
                    : ev.isCorrect
                      ? "CORRECT"
                      : "WRONG"}
                </Badge>
                <Text size="sm" lineClamp={1} style={{ minWidth: 0 }}>
                  {name}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                {ago}
              </Text>
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h`;
}

// ========================================
// CARDS TAB
// ========================================

function CardsTab({
  cards,
  search,
  onSearchChange,
  onToggleLock,
  onReset,
  actionLoading,
}: {
  cards: AdminCard[];
  search: string;
  onSearchChange: (v: string) => void;
  onToggleLock: (card: AdminCard) => void;
  onReset: (card: AdminCard) => void;
  actionLoading: string | null;
}) {
  const q = search.toLowerCase().trim();
  const filtered = q
    ? cards.filter((c) => {
        const name = pcName(c.physicalCardId).toLowerCase();
        const color = pcColor(c.physicalCardId).toLowerCase();
        const header = (c.header ?? "").toLowerCase();
        const setName = (c.cardSet?.name ?? "").toLowerCase();
        const category = (c.clueVisibleCategory ?? "").toLowerCase();
        return (
          name.includes(q) ||
          color.includes(q) ||
          header.includes(q) ||
          setName.includes(q) ||
          category.includes(q)
        );
      })
    : cards;

  // Sort: locked first, then unsolved, then solved
  const sorted = [...filtered].sort((a, b) => {
    if (a.lockedOut !== b.lockedOut) return a.lockedOut ? -1 : 1;
    if (a.isSolved !== b.isSolved) return a.isSolved ? 1 : -1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });

  return (
    <Stack gap="sm">
      <TextInput
        placeholder="Search by name, color, set, category..."
        value={search}
        onChange={(e) => onSearchChange(e.currentTarget.value)}
        size="md"
        styles={{
          input: { height: 48 },
        }}
      />
      <Text size="xs" c="dimmed">
        {filtered.length} card{filtered.length !== 1 ? "s" : ""}
        {q && ` matching "${q}"`}
      </Text>

      {sorted.map((card) => (
        <CardRow
          key={card.id}
          card={card}
          onToggleLock={onToggleLock}
          onReset={onReset}
          actionLoading={actionLoading}
        />
      ))}
    </Stack>
  );
}

function CardRow({
  card,
  onToggleLock,
  onReset,
  actionLoading,
}: {
  card: AdminCard;
  onToggleLock: (card: AdminCard) => void;
  onReset: (card: AdminCard) => void;
  actionLoading: string | null;
}) {
  const name = pcName(card.physicalCardId);
  const color = pcColor(card.physicalCardId);
  const short = pcShort(card.physicalCardId);
  const isLoading = actionLoading === card.id;
  const examined = !!card.examinedAt;
  const destructed = !!card.selfDestructedAt;

  // Color map for physical card colors
  const colorHex: Record<string, string> = {
    red: "#e03131",
    yellow: "#fcc419",
    green: "#40c057",
    blue: "#339af0",
    purple: "#9775fa",
    white: "#e9ecef",
  };

  return (
    <Paper bg="dark.7" p="sm" radius="md" withBorder={card.lockedOut} style={card.lockedOut ? { borderColor: "#e03131" } : undefined}>
      <Group justify="space-between" wrap="nowrap" mb={4}>
        <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <Badge
            size="sm"
            variant="filled"
            style={{ backgroundColor: colorHex[color] ?? "#666", flexShrink: 0 }}
          >
            {short}
          </Badge>
          <Text size="sm" fw={500} lineClamp={1} style={{ minWidth: 0 }}>
            {name}
          </Text>
        </Group>
        {/* Status badges */}
        <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
          {card.lockedOut && (
            <Badge size="xs" color="red" variant="light">
              LOCKED
            </Badge>
          )}
          {card.isSolved && (
            <Badge size="xs" color="green" variant="light">
              SOLVED
            </Badge>
          )}
          {examined && !card.isSolved && !destructed && (
            <Badge size="xs" color="yellow" variant="light">
              OPEN
            </Badge>
          )}
          {destructed && !card.isSolved && (
            <Badge size="xs" color="orange" variant="light">
              DESTROYED
            </Badge>
          )}
        </Group>
      </Group>

      {/* Card details */}
      <Group gap="xs" mb={6}>
        {card.cardSet && (
          <Badge
            size="xs"
            variant="dot"
            style={{ borderColor: card.cardSet.color }}
          >
            {card.cardSet.name}
          </Badge>
        )}
        {card.act && (
          <Text size="xs" c="dimmed">
            Act {card.act}
          </Text>
        )}
        {card.clueVisibleCategory && (
          <Text size="xs" c="dimmed" lineClamp={1}>
            {card.clueVisibleCategory}
          </Text>
        )}
      </Group>

      {/* Action buttons — big tap targets */}
      <Group gap="xs">
        <Button
          size="xs"
          variant={card.lockedOut ? "filled" : "light"}
          color={card.lockedOut ? "green" : "red"}
          loading={isLoading}
          onClick={() => onToggleLock(card)}
          style={{ flex: 1, minHeight: 36 }}
        >
          {card.lockedOut ? "Unlock" : "Lock"}
        </Button>
        <Button
          size="xs"
          variant="light"
          color="yellow"
          loading={isLoading}
          onClick={() => onReset(card)}
          style={{ flex: 1, minHeight: 36 }}
        >
          Reset
        </Button>
      </Group>
    </Paper>
  );
}

// ========================================
// MISSIONS TAB
// ========================================

function MissionsTab({
  missions,
  onToggleLock,
  actionLoading,
}: {
  missions: AdminMission[];
  onToggleLock: (m: AdminMission) => void;
  actionLoading: string | null;
}) {
  // Group by act
  const byAct = new Map<number, AdminMission[]>();
  for (const m of missions) {
    if (!byAct.has(m.act)) byAct.set(m.act, []);
    byAct.get(m.act)!.push(m);
  }
  const acts = [...byAct.keys()].sort();

  return (
    <Stack gap="sm">
      {acts.map((act) => (
        <div key={act}>
          <Text size="xs" fw={600} c="dimmed" mb="xs">
            ACT {act}
          </Text>
          <Stack gap={4}>
            {byAct.get(act)!.map((m) => (
              <MissionRow
                key={m.id}
                mission={m}
                onToggleLock={onToggleLock}
                actionLoading={actionLoading}
              />
            ))}
          </Stack>
          <Divider my="sm" color="dark.6" />
        </div>
      ))}
    </Stack>
  );
}

function MissionRow({
  mission,
  onToggleLock,
  actionLoading,
}: {
  mission: AdminMission;
  onToggleLock: (m: AdminMission) => void;
  actionLoading: string | null;
}) {
  const isLoading = actionLoading === mission.id;

  return (
    <Paper bg="dark.7" p="sm" radius="md" withBorder={mission.lockedOut} style={mission.lockedOut ? { borderColor: "#e03131" } : undefined}>
      <Group justify="space-between" wrap="nowrap" mb={4}>
        <Text size="sm" fw={500} lineClamp={1} style={{ flex: 1, minWidth: 0 }}>
          {mission.title}
        </Text>
        <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
          {mission.lockedOut && (
            <Badge size="xs" color="red" variant="light">
              LOCKED
            </Badge>
          )}
          {mission.isCompleted && (
            <Badge size="xs" color="green" variant="light">
              DONE
            </Badge>
          )}
        </Group>
      </Group>

      {/* Houses */}
      <Group gap={4} mb={6}>
        {mission.missionHouses.map((mh) => (
          <Badge
            key={mh.id}
            size="xs"
            variant="light"
            style={{ backgroundColor: mh.house.color + "22", color: mh.house.color }}
          >
            {mh.house.name}
          </Badge>
        ))}
      </Group>

      {/* Action */}
      <Button
        size="xs"
        variant={mission.lockedOut ? "filled" : "light"}
        color={mission.lockedOut ? "green" : "red"}
        loading={isLoading}
        onClick={() => onToggleLock(mission)}
        fullWidth
        style={{ minHeight: 36 }}
      >
        {mission.lockedOut ? "Unlock" : "Lock"}
      </Button>
    </Paper>
  );
}

// ========================================
// SHOWTIME TAB
// ========================================

function ShowtimeTab({
  showtimes,
  onTrigger,
  onReset,
  actionLoading,
}: {
  showtimes: AdminShowtime[];
  onTrigger: (st: AdminShowtime) => void;
  onReset: (st: AdminShowtime) => void;
  actionLoading: string | null;
}) {
  if (showtimes.length === 0) {
    return (
      <Text c="dimmed" ta="center" pt="xl">
        No showtimes configured
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      {showtimes.map((st) => (
        <ShowtimeRow
          key={st.id}
          showtime={st}
          onTrigger={onTrigger}
          onReset={onReset}
          actionLoading={actionLoading}
        />
      ))}
    </Stack>
  );
}

function ShowtimeRow({
  showtime,
  onTrigger,
  onReset,
  actionLoading,
}: {
  showtime: AdminShowtime;
  onTrigger: (st: AdminShowtime) => void;
  onReset: (st: AdminShowtime) => void;
  actionLoading: string | null;
}) {
  const isLoading = actionLoading === showtime.id;
  const phaseColor =
    showtime.phase === "filling"
      ? "yellow"
      : showtime.phase === "syncing"
        ? "orange"
        : "green";

  const filledSlots = showtime.slots.filter((s) => s.filledAt).length;
  const totalSlots = showtime.slots.length;
  const syncedSlots = showtime.slots.filter((s) => s.syncPressedAt).length;

  return (
    <Paper bg="dark.7" p="md" radius="md">
      <Group justify="space-between" mb="xs">
        <Text size="sm" fw={600}>
          {showtime.title}
        </Text>
        <Badge color={phaseColor} variant="light" size="lg" tt="uppercase">
          {showtime.phase}
        </Badge>
      </Group>

      <Text size="xs" c="dimmed" mb="xs">
        Act {showtime.act}
      </Text>

      {/* Slot status */}
      <Stack gap={4} mb="sm">
        {showtime.slots.map((slot) => (
          <Group key={slot.id} justify="space-between" gap="xs">
            <Group gap="xs" style={{ flex: 1 }}>
              <Box
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: slot.house.color,
                }}
              />
              <Text size="sm">{slot.house.name}</Text>
            </Group>
            <Group gap={4}>
              {slot.filledAt ? (
                <Badge size="xs" color="green" variant="light">
                  FILLED
                </Badge>
              ) : (
                <Badge size="xs" color="gray" variant="light">
                  EMPTY
                </Badge>
              )}
              {slot.syncPressedAt && (
                <Badge size="xs" color="orange" variant="light">
                  SYNCED
                </Badge>
              )}
            </Group>
          </Group>
        ))}
      </Stack>

      {/* Summary */}
      <Text size="xs" c="dimmed" mb="sm">
        Slots: {filledSlots}/{totalSlots} filled
        {showtime.phase === "syncing" &&
          ` — ${syncedSlots}/${totalSlots} synced`}
      </Text>

      {/* Actions */}
      <Group gap="xs">
        {showtime.phase !== "revealed" && (
          <Button
            size="sm"
            color="green"
            variant="filled"
            loading={isLoading}
            onClick={() => onTrigger(showtime)}
            style={{ flex: 1, minHeight: 44 }}
          >
            Force Reveal
          </Button>
        )}
        <Button
          size="sm"
          color="yellow"
          variant="light"
          loading={isLoading}
          onClick={() => onReset(showtime)}
          style={{ flex: 1, minHeight: 44 }}
        >
          Reset
        </Button>
      </Group>
    </Paper>
  );
}

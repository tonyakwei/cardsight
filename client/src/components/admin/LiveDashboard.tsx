import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Group,
  Text,
  Badge,
  Button,
  Loader,
  Stack,
  Paper,
  Progress,
  SimpleGrid,
  SegmentedControl,
  Tooltip,
} from "@mantine/core";
import {
  fetchGame,
  fetchDashboard,
  transitionAct,
  type GameDetail,
  type DashboardData,
} from "../../api/admin";
import physicalCards from "../../../../shared/physical-cards.json";

const POLL_INTERVAL = 5000;
const pcMap = new Map(physicalCards.map((pc) => [pc.id, pc]));
function pcLabel(id: string) { const pc = pcMap.get(id); return pc ? `${pc.color[0].toUpperCase()}${pc.number}` : id.slice(0, 8); }

export function LiveDashboard() {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    if (!gameId) return;
    try {
      const [g, d] = await Promise.all([
        fetchGame(gameId),
        fetchDashboard(gameId),
      ]);
      setGame(g);
      setData(d);
      setLastUpdated(new Date());
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

  if (loading) {
    return (
      <Group justify="center" pt="xl">
        <Loader color="yellow" size="sm" />
      </Group>
    );
  }

  if (!game || !data) return null;

  const { overview, cardDiscovery, activity, missionProgress } = data;
  const discoveryPct =
    overview.totalCards > 0
      ? Math.round((overview.cardsScanned / overview.totalCards) * 100)
      : 0;

  return (
    <div>
      {/* Header */}
      <Group justify="space-between" mb="lg">
        <div>
          <Group gap="sm" align="baseline">
            <Text size="xl" fw={700}>
              {game.name} — Live Dashboard
            </Text>
            <Badge color="yellow" variant="light" size="lg">
              Act {data.currentAct}
            </Badge>
          </Group>
          <Group gap="xs">
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#4caf50",
                animation: "pulse 2s infinite",
              }}
            />
            <Text size="xs" c="dimmed">
              Auto-refreshing every {POLL_INTERVAL / 1000}s
              {lastUpdated &&
                ` · last updated ${lastUpdated.toLocaleTimeString()}`}
            </Text>
          </Group>
        </div>
        <Group gap="sm">
          <ActTransitionButton gameId={gameId!} currentAct={data.currentAct} onTransitioned={loadData} />
        </Group>
      </Group>

      {/* Overview stats */}
      <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} mb="lg">
        <StatCard
          label="Cards Discovered"
          value={`${overview.cardsScanned} / ${overview.totalCards}`}
          sub={`${discoveryPct}%`}
          color="yellow"
        />
        <StatCard
          label="Total Scans"
          value={String(overview.totalScans)}
          color="blue"
        />
        <StatCard
          label="Answer Attempts"
          value={String(overview.totalAttempts)}
          color="violet"
        />
        <StatCard
          label="Correct Answers"
          value={String(overview.correctAttempts)}
          sub={
            overview.totalAttempts > 0
              ? `${Math.round((overview.correctAttempts / overview.totalAttempts) * 100)}% accuracy`
              : undefined
          }
          color="green"
        />
        <StatCard
          label="Missions Completed"
          value={`${missionProgress.reduce((s, h) => s + h.completed, 0)} / ${missionProgress.reduce((s, h) => s + h.total, 0)}`}
          color="orange"
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} mb="lg">
        {/* Card Discovery */}
        <Paper p="md" withBorder>
          <Text size="sm" fw={700} mb="md">
            Card Discovery by Set
          </Text>
          <Stack gap="sm">
            {cardDiscovery.map((set) => {
              const pct =
                set.total > 0
                  ? Math.round((set.scanned / set.total) * 100)
                  : 0;
              const solvedPct =
                set.total > 0
                  ? Math.round((set.solved / set.total) * 100)
                  : 0;
              return (
                <div key={set.setId ?? "__none"}>
                  <Group justify="space-between" mb={4}>
                    <Group gap="xs">
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "2px",
                          backgroundColor: set.setColor,
                        }}
                      />
                      <Text size="xs" fw={600}>
                        {set.setName}
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {set.scanned}/{set.total} found · {set.solved} solved
                    </Text>
                  </Group>
                  <Progress.Root size="sm">
                    <Progress.Section
                      value={solvedPct}
                      color="green"
                    />
                    <Progress.Section
                      value={pct - solvedPct}
                      color="yellow"
                    />
                  </Progress.Root>
                </div>
              );
            })}
          </Stack>
        </Paper>

        {/* Mission Progress */}
        <Paper p="md" withBorder>
          <Text size="sm" fw={700} mb="md">
            Mission Progress by House
          </Text>
          <Stack gap="md">
            {missionProgress.map((entry) => (
              <div key={entry.house.id}>
                <Group justify="space-between" mb={4}>
                  <Group gap="xs">
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor: entry.house.color,
                      }}
                    />
                    <Text size="sm" fw={600}>
                      {entry.house.name}
                    </Text>
                  </Group>
                  <Badge
                    size="sm"
                    variant="light"
                    color={
                      entry.completed === entry.total
                        ? "green"
                        : entry.completed > 0
                          ? "yellow"
                          : "gray"
                    }
                  >
                    {entry.completed} / {entry.total}
                  </Badge>
                </Group>
                <Progress
                  size="md"
                  value={
                    entry.total > 0
                      ? (entry.completed / entry.total) * 100
                      : 0
                  }
                  color={entry.house.color}
                />
                <Group gap={4} mt={4} wrap="wrap">
                  {entry.missions.map((m) => (
                    <Badge
                      key={m.id}
                      size="xs"
                      variant={m.isCompleted ? "filled" : "outline"}
                      color={m.isCompleted ? "green" : "dark"}
                    >
                      {m.isCompleted ? "✓" : `Act ${m.act}`} {m.title.length > 25 ? m.title.slice(0, 25) + "..." : m.title}
                    </Badge>
                  ))}
                </Group>
              </div>
            ))}
          </Stack>
        </Paper>
      </SimpleGrid>

      {/* Recent Activity */}
      <ActivitySection activity={activity} />

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

type ActivityEvent = DashboardData["activity"][number];

function ActivitySection({ activity }: { activity: ActivityEvent[] }) {
  const [view, setView] = useState<string>("list");

  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" mb="md">
        <Text size="sm" fw={700}>Recent Activity</Text>
        <SegmentedControl
          size="xs"
          value={view}
          onChange={setView}
          data={[
            { label: "List", value: "list" },
            { label: "Timeline", value: "timeline" },
          ]}
        />
      </Group>
      {activity.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="md">
          No activity yet. Waiting for scans...
        </Text>
      ) : view === "list" ? (
        <ActivityList activity={activity} />
      ) : (
        <ActivityTimeline activity={activity} />
      )}
    </Paper>
  );
}

function ActivityList({ activity }: { activity: ActivityEvent[] }) {
  return (
    <Stack gap={2}>
      {activity.map((event, i) => (
        <Group
          key={i}
          gap="sm"
          py={4}
          style={{
            borderBottom:
              i < activity.length - 1
                ? "1px solid var(--mantine-color-dark-6)"
                : undefined,
          }}
        >
          <Badge
            size="xs"
            variant="filled"
            color={
              event.type === "scan"
                ? "blue"
                : event.isCorrect
                  ? "green"
                  : "red"
            }
            style={{ width: 60, textAlign: "center" }}
          >
            {event.type === "scan"
              ? "Scan"
              : event.isCorrect
                ? "Correct"
                : "Wrong"}
          </Badge>
          <Badge size="xs" variant="dot" color="gray" style={{ width: 28, flexShrink: 0 }}>
            A{event.act}
          </Badge>
          <Text size="xs" fw={600} style={{ width: 50 }}>
            {pcLabel(event.cardId)}
          </Text>
          <Text size="xs" c="dimmed" style={{ flex: 1 }}>
            {event.cardTitle}
            {event.type === "answer" &&
              ` (attempt #${event.attemptNumber})`}
          </Text>
          <Text size="xs" c="dimmed">
            {formatTime(event.at)}
          </Text>
        </Group>
      ))}
    </Stack>
  );
}

function ActivityTimeline({ activity }: { activity: ActivityEvent[] }) {
  // Sort oldest → newest for left-to-right rendering
  const sorted = useMemo(
    () => [...activity].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()),
    [activity],
  );

  if (sorted.length === 0) return null;

  const startMs = new Date(sorted[0].at).getTime();
  const endMs = new Date(sorted[sorted.length - 1].at).getTime();
  const spanMs = Math.max(endMs - startMs, 1000); // avoid division by zero

  // Generate minute markers
  const startMin = Math.floor(startMs / 60000) * 60000;
  const markers: number[] = [];
  for (let t = startMin; t <= endMs + 60000; t += 60000) {
    if (t >= startMs - 10000) markers.push(t);
  }

  return (
    <div style={{ position: "relative", height: 120, overflow: "hidden" }}>
      {/* Time axis */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 0,
          right: 0,
          height: 1,
          background: "var(--mantine-color-dark-5)",
        }}
      />

      {/* Minute markers */}
      {markers.map((t) => {
        const pct = ((t - startMs) / spanMs) * 100;
        if (pct < 0 || pct > 100) return null;
        const d = new Date(t);
        return (
          <div key={t} style={{ position: "absolute", bottom: 0, left: `${pct}%` }}>
            <div style={{ width: 1, height: 6, background: "var(--mantine-color-dark-4)", marginLeft: -0.5 }} />
            <Text size="xs" c="dimmed" style={{ fontSize: 9, transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
              {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </div>
        );
      })}

      {/* Event dots */}
      {sorted.map((event, i) => {
        const ms = new Date(event.at).getTime();
        const pct = ((ms - startMs) / spanMs) * 100;
        const color =
          event.type === "scan"
            ? "#228be6"
            : event.isCorrect
              ? "#40c057"
              : "#fa5252";
        const label = `${pcLabel(event.cardId)}${event.cardTitle ? " — " + event.cardTitle : ""}`;
        const time = new Date(event.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        const typeLabel = event.type === "scan" ? "Scan" : event.isCorrect ? "Correct" : "Wrong";

        // Stagger vertically to reduce overlap
        const row = i % 4;
        const bottom = 26 + row * 22;

        return (
          <Tooltip
            key={i}
            label={`${typeLabel}: ${label} at ${time}`}
            position="top"
            withArrow
            styles={{ tooltip: { fontSize: 11 } }}
          >
            <div
              style={{
                position: "absolute",
                left: `${pct}%`,
                bottom,
                transform: "translateX(-50%)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: event.type === "answer" ? 10 : 7,
                  height: event.type === "answer" ? 10 : 7,
                  borderRadius: "50%",
                  background: color,
                  border: "1.5px solid rgba(0,0,0,0.3)",
                  boxShadow: `0 0 4px ${color}40`,
                }}
              />
            </div>
          </Tooltip>
        );
      })}

      {/* Legend */}
      <Group gap="md" style={{ position: "absolute", top: 0, right: 0 }}>
        {[
          { color: "#228be6", label: "Scan" },
          { color: "#40c057", label: "Correct" },
          { color: "#fa5252", label: "Wrong" },
        ].map((l) => (
          <Group key={l.label} gap={4}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: l.color }} />
            <Text size="xs" c="dimmed" style={{ fontSize: 10 }}>{l.label}</Text>
          </Group>
        ))}
      </Group>
    </div>
  );
}

function ActTransitionButton({
  gameId,
  currentAct,
  onTransitioned,
}: {
  gameId: string;
  currentAct: number;
  onTransitioned: () => void;
}) {
  const navigate = useNavigate();
  const [transitioning, setTransitioning] = useState(false);

  if (currentAct >= 3) return null;

  const handleTransition = async () => {
    const toAct = currentAct + 1;
    if (
      !window.confirm(
        `End Act ${currentAct} and begin Act ${toAct}?\n\n` +
          `This will:\n` +
          `• Lock all Act ${currentAct} cards\n` +
          `• Unlock all Act ${toAct} cards\n\n` +
          `You'll be taken to the Act Break view to review consequences.`,
      )
    )
      return;

    setTransitioning(true);
    await transitionAct(gameId, currentAct);
    setTransitioning(false);
    onTransitioned();
    navigate(`/admin/games/${gameId}/act-break`);
  };

  return (
    <Button
      size="xs"
      variant="light"
      color="red"
      loading={transitioning}
      onClick={handleTransition}
    >
      End Act {currentAct}
    </Button>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <Paper p="md" withBorder>
      <Text size="xs" c="dimmed" tt="uppercase" lts="0.05em">
        {label}
      </Text>
      <Group gap="xs" align="baseline">
        <Text size="xl" fw={700} c={`${color}.5`}>
          {value}
        </Text>
        {sub && (
          <Text size="xs" c="dimmed">
            {sub}
          </Text>
        )}
      </Group>
    </Paper>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  return d.toLocaleTimeString();
}

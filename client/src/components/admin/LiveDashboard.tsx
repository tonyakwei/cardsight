import { useState, useCallback } from "react";
import { useParams } from "react-router";
import {
  Group,
  Text,
  Badge,
  Loader,
  SimpleGrid,
  Paper,
  Stack,
  Progress,
} from "@mantine/core";
import {
  fetchGame,
  fetchDashboard,
  type GameDetail,
  type DashboardData,
} from "../../api/admin";
import { usePolling } from "../../hooks/usePolling";
import { StatCard } from "./live-dashboard/StatCard";
import { ActivitySection } from "./live-dashboard/ActivitySection";
import { ActTransitionButton } from "./live-dashboard/ActTransitionButton";

const POLL_INTERVAL = 5000;

export function LiveDashboard() {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

  usePolling(loadData, POLL_INTERVAL);

  if (loading) {
    return (
      <Group justify="center" pt="xl">
        <Loader color="yellow" size="sm" />
      </Group>
    );
  }

  if (!game || !data) return null;

  const { overview, cardDiscovery, missionProgress } = data;
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
      <ActivitySection activity={data.activity} />

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

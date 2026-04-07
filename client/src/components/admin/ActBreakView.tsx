import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Group,
  Text,
  Badge,
  Loader,
  Button,
  Stack,
  Paper,
  SegmentedControl,
  ActionIcon,
} from "@mantine/core";
import {
  fetchGame,
  fetchActBreak,
  type GameDetail,
  type ActBreakHouse,
} from "../../api/admin";

export function ActBreakView() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [act, setAct] = useState("1");
  const [summary, setSummary] = useState<ActBreakHouse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    const [g, s] = await Promise.all([
      fetchGame(gameId),
      fetchActBreak(gameId, Number(act)),
    ]);
    setGame(g);
    setSummary(s);
    setLoading(false);
  }, [gameId, act]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !game) {
    return (
      <Group justify="center" pt="xl">
        <Loader color="yellow" size="sm" />
      </Group>
    );
  }

  if (!game) return null;

  return (
    <div>
      {/* Header */}
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => navigate(`/admin/games/${gameId}/missions`)}
          >
            ←
          </ActionIcon>
          <div>
            <Text size="xl" fw={700}>
              {game.name} — Act Break
            </Text>
            <Text size="xs" c="dimmed">
              Mission results and consequences by house
            </Text>
          </div>
        </Group>
        <Group gap="sm">
          <SegmentedControl
            size="xs"
            value={act}
            onChange={setAct}
            data={[
              { label: "Act 1", value: "1" },
              { label: "Act 2", value: "2" },
              { label: "Act 3", value: "3" },
            ]}
          />
        </Group>
      </Group>

      {loading ? (
        <Group justify="center" pt="xl">
          <Loader color="yellow" size="sm" />
        </Group>
      ) : (
        <Stack gap="lg">
          {summary.map((entry) => (
            <Paper key={entry.house.id} p="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Group gap="sm">
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: entry.house.color,
                    }}
                  />
                  <Text size="lg" fw={700}>
                    {entry.house.name}
                  </Text>
                </Group>
                <Badge
                  size="lg"
                  variant="light"
                  color={
                    entry.completedCount === entry.totalCount
                      ? "green"
                      : entry.completedCount > 0
                        ? "yellow"
                        : "red"
                  }
                >
                  {entry.completedCount} / {entry.totalCount} completed
                </Badge>
              </Group>

              <Stack gap="sm">
                {entry.missions.map((m) => (
                  <Paper
                    key={m.id}
                    p="sm"
                    style={{
                      background: m.isCompleted
                        ? "rgba(0, 255, 0, 0.04)"
                        : "rgba(255, 0, 0, 0.04)",
                      borderLeft: `4px solid ${m.isCompleted ? "#4caf50" : "#f44336"}`,
                    }}
                  >
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" fw={600}>
                        {m.title}
                      </Text>
                      <Badge
                        size="sm"
                        color={m.isCompleted ? "green" : "red"}
                        variant="filled"
                      >
                        {m.isCompleted ? "Completed" : "Not Completed"}
                      </Badge>
                    </Group>

                    {m.consequence && (
                      <Paper
                        p="sm"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        <Text size="xs" fw={600} c="dimmed" mb={4}>
                          Consequence to read:
                        </Text>
                        <Text size="sm">{m.consequence}</Text>
                      </Paper>
                    )}

                    {m.mechanicalEffect && (
                      <Paper
                        mt="xs"
                        p="xs"
                        style={{ background: "rgba(255, 200, 0, 0.05)" }}
                      >
                        <Text size="xs" fw={600} c="yellow.5" mb={2}>
                          Mechanical Effect:
                        </Text>
                        <Text size="xs" ff="monospace">
                          {JSON.stringify(m.mechanicalEffect, null, 2)}
                        </Text>
                      </Paper>
                    )}
                  </Paper>
                ))}

                {entry.missions.length === 0 && (
                  <Text size="sm" c="dimmed">
                    No missions for this house in Act {act}.
                  </Text>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </div>
  );
}

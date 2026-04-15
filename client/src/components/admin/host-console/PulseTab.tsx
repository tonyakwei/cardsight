import {
  Group,
  Text,
  Badge,
  Button,
  Stack,
  Paper,
  Progress,
  Box,
} from "@mantine/core";
import type { DashboardData } from "../../../api/admin";

interface Props {
  dashboard: DashboardData;
  activeAct: number;
  onEndAct: (act: number) => void;
  actionLoading: string | null;
}

export function PulseTab({ dashboard, activeAct, onEndAct, actionLoading }: Props) {
  const { overview, cardDiscovery, missionProgress } = dashboard;
  const discoveryPct =
    overview.totalCards > 0
      ? Math.round((overview.cardsScanned / overview.totalCards) * 100)
      : 0;

  return (
    <Stack gap="sm">
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

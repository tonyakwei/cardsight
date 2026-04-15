import {
  Group,
  Text,
  Badge,
  Stack,
  Paper,
} from "@mantine/core";
import type { DashboardData } from "../../../api/admin";
import { pcName } from "../../../utils/physicalCards";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h`;
}

export function ActivityTab({ dashboard }: { dashboard: DashboardData }) {
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

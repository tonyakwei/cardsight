import { Group, Text, Paper } from "@mantine/core";

export function StatCard({
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

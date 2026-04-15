import {
  Group,
  Text,
  Badge,
  Button,
  Stack,
  Paper,
  Box,
} from "@mantine/core";
import type { AdminShowtime } from "../../../api/admin";
import type { ShowtimeTabProps } from "./types";

export function ShowtimeTab({
  showtimes,
  onTrigger,
  onReset,
  actionLoading,
}: ShowtimeTabProps) {
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
        <ConsoleShowtimeRow
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

function ConsoleShowtimeRow({
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

      <Text size="xs" c="dimmed" mb="sm">
        Slots: {filledSlots}/{totalSlots} filled
        {showtime.phase === "syncing" &&
          ` — ${syncedSlots}/${totalSlots} synced`}
      </Text>

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

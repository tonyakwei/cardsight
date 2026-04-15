import {
  Group,
  Text,
  Badge,
  Button,
  Stack,
  Paper,
  Divider,
} from "@mantine/core";
import type { AdminMission } from "../../../api/admin";
import type { MissionTabProps } from "./types";

export function MissionsTab({
  missions,
  onToggleLock,
  actionLoading,
}: MissionTabProps) {
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
              <ConsoleMissionRow
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

function ConsoleMissionRow({
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

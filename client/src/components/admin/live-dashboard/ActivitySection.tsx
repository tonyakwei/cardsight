import { useState, useMemo } from "react";
import {
  Group,
  Text,
  Badge,
  Stack,
  Paper,
  SegmentedControl,
  Tooltip,
} from "@mantine/core";
import type { DashboardData } from "../../../api/admin";
import { pcLabel } from "../../../utils/physicalCards";

type ActivityEvent = DashboardData["activity"][number];

export function ActivitySection({ activity }: { activity: ActivityEvent[] }) {
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
  const sorted = useMemo(
    () => [...activity].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()),
    [activity],
  );

  if (sorted.length === 0) return null;

  const startMs = new Date(sorted[0].at).getTime();
  const endMs = new Date(sorted[sorted.length - 1].at).getTime();
  const spanMs = Math.max(endMs - startMs, 1000);

  const startMin = Math.floor(startMs / 60000) * 60000;
  const markers: number[] = [];
  for (let t = startMin; t <= endMs + 60000; t += 60000) {
    if (t >= startMs - 10000) markers.push(t);
  }

  return (
    <div style={{ position: "relative", height: 120, overflow: "hidden" }}>
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

import {
  Group,
  Text,
  Badge,
  Button,
  Stack,
  Paper,
  TextInput,
} from "@mantine/core";
import type { AdminCard } from "../../../api/admin";
import { pcName, pcColor, pcShort } from "../../../utils/physicalCards";
import type { CardTabProps } from "./types";

export function CardsTab({
  cards,
  search,
  onSearchChange,
  onToggleLock,
  onReset,
  actionLoading,
}: CardTabProps) {
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
        <ConsoleCardRow
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

const COLOR_HEX: Record<string, string> = {
  red: "#e03131",
  yellow: "#fcc419",
  green: "#40c057",
  blue: "#339af0",
  purple: "#9775fa",
  white: "#e9ecef",
};

function ConsoleCardRow({
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
  const houseColors = card.cardHouses.map((ch) => ch.house.color);

  return (
    <Paper
      bg="dark.7"
      p="sm"
      radius="md"
      withBorder={card.lockedOut}
      style={{
        position: "relative",
        overflow: "hidden",
        paddingLeft: houseColors.length > 0 ? 14 : undefined,
        ...(card.lockedOut ? { borderColor: "#e03131" } : {}),
      }}
    >
      {houseColors.length > 0 && <HouseStripe colors={houseColors} />}
      <Group justify="space-between" wrap="nowrap" mb={4}>
        <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <Badge
            size="sm"
            variant="filled"
            style={{ backgroundColor: COLOR_HEX[color] ?? "#666", flexShrink: 0 }}
          >
            {short}
          </Badge>
          <Text size="sm" fw={500} lineClamp={1} style={{ minWidth: 0 }}>
            {name}
          </Text>
        </Group>
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

function HouseStripe({ colors, width = 5 }: { colors: string[]; width?: number }) {
  if (colors.length === 0) return null;
  const bg =
    colors.length === 1
      ? colors[0]
      : `linear-gradient(to bottom, ${colors
          .map((c, i) => {
            const start = (i / colors.length) * 100;
            const end = ((i + 1) / colors.length) * 100;
            return `${c} ${start}%, ${c} ${end}%`;
          })
          .join(", ")})`;
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        width,
        background: bg,
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}

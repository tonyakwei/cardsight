import { Group, Text, Badge } from "@mantine/core";
import type { SimulatorCard } from "../../../api/admin";

interface Props {
  card: SimulatorCard;
  isHome: boolean; // card belongs to the house whose table it's on
  isSelected: boolean;
  onClick: () => void;
}

export function SimCardChip({ card, isHome, isSelected, onClick }: Props) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", card.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onClick}
      style={{
        padding: "6px 10px",
        borderRadius: "6px",
        background: isSelected
          ? "rgba(212, 168, 67, 0.15)"
          : "var(--mantine-color-dark-6)",
        border: isSelected
          ? "1px solid rgba(212, 168, 67, 0.4)"
          : "1px solid var(--mantine-color-dark-5)",
        cursor: "grab",
        marginBottom: "4px",
        transition: "background 0.15s",
        opacity: isHome ? 1 : 0.75,
      }}
    >
      <Group gap={6} wrap="nowrap">
        {card.cardSet && (
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: card.cardSet.color,
              flexShrink: 0,
            }}
          />
        )}
        <Text size="xs" fw={700} c="yellow.5" style={{ flexShrink: 0 }}>
          {card.humanCardId}
        </Text>
        <Text size="xs" lineClamp={1} style={{ flex: 1, minWidth: 0 }}>
          {card.title}
        </Text>
        {card.cardHouses.map((ch) => (
          <Badge
            key={ch.house.id}
            size="xs"
            variant="dot"
            style={{ color: ch.house.color }}
          >
            {ch.house.name.charAt(0)}
          </Badge>
        ))}
        {isHome && (
          <Text size="xs" c="green" style={{ flexShrink: 0 }}>
            ●
          </Text>
        )}
      </Group>
    </div>
  );
}

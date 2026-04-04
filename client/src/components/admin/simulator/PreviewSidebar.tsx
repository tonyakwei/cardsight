import { Text, Group, Badge, CloseButton } from "@mantine/core";
import { PhonePreview } from "../PhonePreview";
import type { SimulatorCard } from "../../../api/admin";

interface Props {
  card: SimulatorCard;
  onClose: () => void;
}

export function PreviewSidebar({ card, onClose }: Props) {
  return (
    <div
      style={{
        width: "320px",
        flexShrink: 0,
        borderLeft: "1px solid var(--mantine-color-dark-5)",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        height: "calc(100vh - 56px - 2rem)",
        position: "sticky",
        top: "calc(56px + 1rem)",
      }}
    >
      <Group justify="space-between">
        <Text size="sm" fw={700} c="yellow.5">
          {card.humanCardId}
        </Text>
        <CloseButton size="sm" onClick={onClose} />
      </Group>

      <Text size="sm" fw={600} lineClamp={2}>
        {card.title}
      </Text>

      <Group gap="xs">
        {card.cardSet && (
          <Badge
            size="xs"
            variant="outline"
            style={{ borderColor: card.cardSet.color, color: card.cardSet.color }}
          >
            {card.cardSet.name}
          </Badge>
        )}
        {card.cardHouses.map((ch) => (
          <Badge
            key={ch.house.id}
            size="xs"
            variant="outline"
            style={{ borderColor: ch.house.color, color: ch.house.color }}
          >
            {ch.house.name}
          </Badge>
        ))}
      </Group>

      <PhonePreview cardId={card.id} />
    </div>
  );
}

import { useState } from "react";
import { Text, Badge, Stack, ScrollArea } from "@mantine/core";
import { SimCardChip } from "./SimCardChip";
import type { SimulatorCard } from "../../../api/admin";

interface Props {
  title: string;
  color: string;
  houseId: string | null; // null = unassigned pool
  cards: SimulatorCard[];
  selectedCardId: string | null;
  onCardClick: (cardId: string) => void;
  onDrop: (cardId: string, tableHouseId: string | null) => void;
}

export function TableColumn({
  title, color, houseId, cards, selectedCardId, onCardClick, onDrop,
}: Props) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const cardId = e.dataTransfer.getData("text/plain");
        if (cardId) onDrop(cardId, houseId);
      }}
      style={{
        flex: 1,
        minWidth: "220px",
        maxWidth: "320px",
        borderRadius: "8px",
        border: dragOver
          ? `2px dashed ${color}`
          : "1px solid var(--mantine-color-dark-5)",
        background: dragOver
          ? "rgba(255,255,255,0.02)"
          : "var(--mantine-color-dark-8)",
        transition: "border 0.15s, background 0.15s",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid var(--mantine-color-dark-5)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: color,
          }}
        />
        <Text size="sm" fw={600}>
          {title}
        </Text>
        <Badge size="xs" variant="filled" color="dark">
          {cards.length}
        </Badge>
      </div>
      <ScrollArea style={{ flex: 1 }} p="xs" type="auto" offsetScrollbars>
        <Stack gap={0}>
          {cards.map((card) => {
            const isHome = houseId
              ? card.cardHouses.some((ch) => ch.house.id === houseId)
              : false;
            return (
              <SimCardChip
                key={card.id}
                card={card}
                isHome={isHome}
                isSelected={selectedCardId === card.id}
                onClick={() => onCardClick(card.id)}
              />
            );
          })}
          {cards.length === 0 && (
            <Text size="xs" c="dimmed" ta="center" py="xl">
              Drop cards here
            </Text>
          )}
        </Stack>
      </ScrollArea>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@mantine/core";
import { transitionAct } from "../../../api/admin";

export function ActTransitionButton({
  gameId,
  currentAct,
  onTransitioned,
}: {
  gameId: string;
  currentAct: number;
  onTransitioned: () => void;
}) {
  const navigate = useNavigate();
  const [transitioning, setTransitioning] = useState(false);

  if (currentAct >= 3) return null;

  const handleTransition = async () => {
    const toAct = currentAct + 1;
    if (
      !window.confirm(
        `End Act ${currentAct} and begin Act ${toAct}?\n\n` +
          `This will:\n` +
          `• Lock all Act ${currentAct} cards\n` +
          `• Unlock all Act ${toAct} cards\n\n` +
          `You'll be taken to the Act Break view to review consequences.`,
      )
    )
      return;

    setTransitioning(true);
    await transitionAct(gameId, currentAct);
    setTransitioning(false);
    onTransitioned();
    navigate(`/admin/games/${gameId}/act-break`);
  };

  return (
    <Button
      size="xs"
      variant="light"
      color="red"
      loading={transitioning}
      onClick={handleTransition}
    >
      End Act {currentAct}
    </Button>
  );
}

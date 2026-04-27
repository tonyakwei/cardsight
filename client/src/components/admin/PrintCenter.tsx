import { useParams, useNavigate } from "react-router";
import { Text, Stack, Paper, Group, Button } from "@mantine/core";

export function PrintCenter() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const printOptions = [
    {
      title: "Story Sheets",
      description: "Printable narrative documents per house per act, with linked mission lists.",
      path: `/admin/games/${gameId}/story-sheets/print`,
      color: "cyan",
    },
    {
      title: "Consequence Cards",
      description: "Themed consequence cards for act breaks (2-3 per page). Switchable themes: Space, Explorer.",
      path: `/admin/games/${gameId}/act-break/print`,
      color: "yellow",
    },
    {
      title: "Item Catalog Sheets",
      description: "Universal handout with all 54 card glyphs organized by color. Players find their card's glyph and write the item classification. Print one per team per act.",
      path: `/admin/games/${gameId}/print/artifact-catalog`,
      color: "orange",
    },
    {
      title: "QRian Glyph Codex",
      description: "Player-facing translation log. Glyphs appear in scrambled order with blanks underneath; players fill in the English letter as they find rosetta cards. Print one per table.",
      path: `/admin/games/${gameId}/print/glyph-codex`,
      color: "grape",
    },
    {
      title: "Welcome Placard",
      description: "Three stone-tablet welcome placards on a single letter sheet. Print, cut along the dotted lines, hand one to each team at the door.",
      path: `/admin/games/${gameId}/print/welcome-placard`,
      color: "yellow",
    },
  ];

  return (
    <div>
      <Text size="xl" fw={700} mb="md">Print Center</Text>
      <Text size="sm" c="dimmed" mb="lg">
        Generate printable materials for your game.
      </Text>

      <Stack gap="md">
        {printOptions.map((opt) => (
          <Paper key={opt.title} p="lg" withBorder>
            <Group justify="space-between">
              <div>
                <Text size="md" fw={600}>{opt.title}</Text>
                <Text size="sm" c="dimmed" mt={4}>{opt.description}</Text>
              </div>
              <Button
                variant="light"
                color={opt.color}
                onClick={() => navigate(opt.path)}
              >
                Open
              </Button>
            </Group>
          </Paper>
        ))}
      </Stack>
    </div>
  );
}

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

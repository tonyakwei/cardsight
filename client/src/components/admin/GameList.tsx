import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Group,
  Text,
  Badge,
  SimpleGrid,
  Card,
  Stack,
  Loader,
  Button,
  Modal,
  TextInput,
  Textarea,
} from "@mantine/core";
import { fetchGames, createGame, duplicateGame, activateGame, type GameSummary } from "../../api/admin";

export function GameList() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    fetchGames()
      .then(setGames)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const game = await createGame({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      setModalOpen(false);
      setNewName("");
      setNewDesc("");
      navigate(`/admin/games/${game.id}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    const duped = await duplicateGame(gameId);
    load();
  };

  const handleActivate = async (e: React.MouseEvent, gameId: string, name: string) => {
    e.stopPropagation();
    if (!window.confirm(`Set "${name}" as the active game? Any other active game will be marked completed.`)) return;
    await activateGame(gameId);
    load();
  };

  if (loading) {
    return (
      <Group justify="center" pt="xl">
        <Loader color="yellow" size="sm" />
      </Group>
    );
  }

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Text size="xl" fw={700}>
          Games
        </Text>
        <Button size="sm" color="yellow" onClick={() => setModalOpen(true)}>
          + New Game
        </Button>
      </Group>

      {games.length === 0 ? (
        <Text c="dimmed" ta="center" pt="xl">
          No games yet. Create one to get started.
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {games.map((game) => (
            <Card
              key={game.id}
              padding="lg"
              radius="md"
              withBorder
              style={{
                cursor: "pointer",
                borderColor:
                  game.status === "active"
                    ? "var(--mantine-color-yellow-6)"
                    : "var(--mantine-color-dark-5)",
                borderWidth: game.status === "active" ? 2 : 1,
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "";
              }}
              onClick={() => navigate(`/admin/games/${game.id}`)}
            >
              <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                  <Text fw={700} size="lg" lineClamp={1}>
                    {game.name}
                  </Text>
                  <StatusBadge status={game.status} />
                </Group>

                {game.description && (
                  <Text size="sm" c="dimmed" lineClamp={2}>
                    {game.description}
                  </Text>
                )}

                <Group gap="lg" mt="xs" justify="space-between" align="flex-end">
                  <Group gap="lg">
                    <Stat label="Cards" value={game.cardCount} />
                    <Stat
                      label="Created"
                      value={new Date(game.createdAt).toLocaleDateString()}
                    />
                  </Group>
                  <Group gap="xs">
                    {game.status !== "active" && (
                      <Button
                        size="xs"
                        variant="light"
                        color="yellow"
                        onClick={(e) => handleActivate(e, game.id, game.name)}
                      >
                        Set Active
                      </Button>
                    )}
                    <Button
                      size="xs"
                      variant="subtle"
                      color="gray"
                      onClick={(e) => handleDuplicate(e, game.id)}
                    >
                      Duplicate
                    </Button>
                  </Group>
                </Group>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* New Game Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Game"
        centered
      >
        <Stack gap="sm">
          <TextInput
            label="Game Name"
            placeholder="e.g., Operation Starlight"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          <Textarea
            label="Description (optional)"
            placeholder="Brief description of the game..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            minRows={2}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="subtle" color="gray" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color="yellow"
              onClick={handleCreate}
              loading={creating}
              disabled={!newName.trim()}
            >
              Create Game
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    active: "yellow",
    draft: "gray",
    completed: "green",
    archived: "dark",
  };
  return (
    <Badge color={colorMap[status] ?? "gray"} variant="light" size="sm">
      {status}
    </Badge>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <Text size="xs" c="dimmed" tt="uppercase" lts="0.05em">
        {label}
      </Text>
      <Text size="sm" fw={600}>
        {value}
      </Text>
    </div>
  );
}

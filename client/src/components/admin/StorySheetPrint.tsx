import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import Markdown from "react-markdown";
import {
  Group,
  Text,
  Loader,
  Button,
  SegmentedControl,
  ActionIcon,
} from "@mantine/core";
import {
  fetchGame,
  fetchStorySheetPrintData,
  type GameDetail,
} from "../../api/admin";

interface PrintSheet {
  id: string;
  house: { id: string; name: string; color: string };
  act: number;
  title: string;
  content: string;
  missions: { id: string; title: string; description: string }[];
}

export function StorySheetPrint() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [sheets, setSheets] = useState<PrintSheet[]>([]);
  const [act, setAct] = useState("1");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    const [g, s] = await Promise.all([
      fetchGame(gameId),
      fetchStorySheetPrintData(gameId, Number(act)),
    ]);
    setGame(g);
    setSheets(s);
    setLoading(false);
  }, [gameId, act]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !game) {
    return (
      <Group justify="center" pt="xl">
        <Loader color="yellow" size="sm" />
      </Group>
    );
  }

  if (!game) return null;

  return (
    <div>
      {/* Controls (hidden in print) */}
      <div className="no-print" style={{ marginBottom: "1.5rem" }}>
        <Group justify="space-between" mb="md">
          <Group gap="sm">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => navigate(`/admin/games/${gameId}/story-sheets`)}
            >
              ←
            </ActionIcon>
            <Text size="xl" fw={700}>
              {game.name} — Story Sheet Print
            </Text>
          </Group>
          <Group gap="sm">
            <SegmentedControl
              size="xs"
              value={act}
              onChange={setAct}
              data={[
                { label: "Act 1", value: "1" },
                { label: "Act 2", value: "2" },
                { label: "Act 3", value: "3" },
              ]}
            />
            <Button size="sm" color="yellow" onClick={() => window.print()}>
              Print
            </Button>
          </Group>
        </Group>
      </div>

      {loading ? (
        <Group justify="center" pt="xl">
          <Loader color="yellow" size="sm" />
        </Group>
      ) : sheets.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No story sheets for Act {act}.
        </Text>
      ) : (
        <div>
          {sheets.map((sheet, i) => (
            <div
              key={sheet.id}
              style={{
                pageBreakAfter: i < sheets.length - 1 ? "always" : undefined,
                padding: "2rem",
                maxWidth: "800px",
                margin: "0 auto 2rem",
                background: "#0d1117",
                color: "#e6edf3",
                borderRadius: "12px",
                border: `2px solid ${sheet.house.color}40`,
                printColorAdjust: "exact",
                WebkitPrintColorAdjust: "exact",
              } as React.CSSProperties}
            >
              {/* House header */}
              <div style={{
                borderBottom: `2px solid ${sheet.house.color}`,
                paddingBottom: "1rem",
                marginBottom: "1.5rem",
              }}>
                <div style={{
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: sheet.house.color,
                  marginBottom: "0.5rem",
                }}>
                  {sheet.house.name} — Act {sheet.act}
                </div>
                <h1 style={{
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  color: sheet.house.color,
                  margin: 0,
                  lineHeight: 1.2,
                }}>
                  {sheet.title}
                </h1>
              </div>

              {/* Content */}
              <div style={{ fontSize: "1rem", lineHeight: 1.8 }}>
                <Markdown>{sheet.content}</Markdown>
              </div>

              {/* Mission list */}
              {sheet.missions.length > 0 && (
                <div style={{ marginTop: "2rem" }}>
                  <div style={{
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: sheet.house.color,
                    marginBottom: "1rem",
                    fontWeight: 700,
                  }}>
                    Available Missions
                  </div>
                  {sheet.missions.map((m, j) => (
                    <div
                      key={m.id}
                      style={{
                        padding: "0.75rem 1rem",
                        marginBottom: "0.5rem",
                        borderLeft: `3px solid ${sheet.house.color}40`,
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: "0 6px 6px 0",
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                        Mission {j + 1}: {m.title}
                      </div>
                      <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                        {m.description.slice(0, 150)}{m.description.length > 150 ? "..." : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}

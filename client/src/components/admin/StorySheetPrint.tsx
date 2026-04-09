import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
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
  getMissionQRUrl,
  type GameDetail,
} from "../../api/admin";

interface PrintMission {
  id: string;
  title: string;
  description: string;
}

interface PrintSheet {
  id: string;
  house: { id: string; name: string; color: string };
  act: number;
  title: string;
  content: string;
  missions: PrintMission[];
}

/** Parse content into segments: plain text or mission-marked paragraphs */
function parseContent(content: string, missions: PrintMission[]) {
  const paragraphs = content.split(/\n\n+/);
  const missionLetterMap = new Map<string, PrintMission>();
  missions.forEach((m, i) => {
    const letter = String.fromCharCode(65 + i); // A, B, C...
    missionLetterMap.set(letter, m);
  });

  return paragraphs.map((para) => {
    // Check for (A), (B), etc. anywhere in the paragraph
    const match = para.match(/\(([A-Z])\)/);
    if (match) {
      const letter = match[1];
      const mission = missionLetterMap.get(letter);
      if (mission) {
        return { type: "mission" as const, text: para, letter, mission };
      }
    }
    return { type: "text" as const, text: para };
  });
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
              onClick={() => navigate(`/admin/games/${gameId}/print`)}
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
            <SheetPage
              key={sheet.id}
              sheet={sheet}
              gameId={gameId!}
              isLast={i === sheets.length - 1}
            />
          ))}
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; }
        }
        @media screen {
          .sheet-page { margin-bottom: 2rem; }
        }
      `}</style>
    </div>
  );
}

function SheetPage({
  sheet,
  gameId,
  isLast,
}: {
  sheet: PrintSheet;
  gameId: string;
  isLast: boolean;
}) {
  const segments = parseContent(sheet.content, sheet.missions);
  const houseColor = sheet.house.color;

  return (
    <div
      className="sheet-page"
      style={{
        pageBreakAfter: isLast ? undefined : "always",
        maxWidth: "850px",
        margin: "0 auto",
        padding: "2.5rem",
        background: "#faf9f6",
        color: "#1a1a1a",
        border: `3px solid ${houseColor}`,
        borderRadius: "4px",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
      } as React.CSSProperties}
    >
      {/* Title header */}
      <div
        style={{
          borderBottom: `2px solid ${houseColor}`,
          paddingBottom: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            fontSize: "0.7rem",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: houseColor,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 700,
            marginBottom: "0.3rem",
          }}
        >
          {sheet.house.name} — Act {sheet.act}
        </div>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "#1a1a1a",
            margin: 0,
            lineHeight: 1.25,
          }}
        >
          {sheet.title}
        </h1>
      </div>

      {/* Content segments */}
      <div style={{ fontSize: "0.95rem", lineHeight: 1.85 }}>
        {segments.map((seg, j) =>
          seg.type === "mission" ? (
            <MissionBand
              key={j}
              text={seg.text}
              letter={seg.letter}
              mission={seg.mission}
              houseColor={houseColor}
              gameId={gameId}
            />
          ) : (
            <p key={j} style={{ margin: "0 0 1rem 0" }}>
              {seg.text}
            </p>
          ),
        )}
      </div>
    </div>
  );
}

function MissionBand({
  text,
  letter,
  mission,
  houseColor,
  gameId,
}: {
  text: string;
  letter: string;
  mission: PrintMission;
  houseColor: string;
  gameId: string;
}) {
  // Bold the (X) marker in the text
  const markerRegex = new RegExp(`\\(${letter}\\)`);
  const parts = text.split(markerRegex);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        margin: "1rem -1.5rem",
        padding: "1rem 1.5rem",
        background: `${houseColor}12`,
        borderLeft: `4px solid ${houseColor}`,
        borderRadius: "0 4px 4px 0",
        gap: "1rem",
        pageBreakInside: "avoid",
      }}
    >
      {/* Large letter */}
      <div
        style={{
          fontSize: "2.5rem",
          fontWeight: 700,
          color: houseColor,
          opacity: 0.35,
          lineHeight: 1,
          minWidth: "2.5rem",
          display: "flex",
          alignItems: "flex-start",
          paddingTop: "0.15rem",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {letter}
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0 }}>
          {parts[0]}
          <strong style={{ color: houseColor }}>({letter})</strong>
          {parts[1] ?? ""}
        </p>
      </div>

      {/* QR code */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <img
          src={getMissionQRUrl(gameId, mission.id)}
          alt={`QR: ${mission.title}`}
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "4px",
          }}
        />
      </div>
    </div>
  );
}

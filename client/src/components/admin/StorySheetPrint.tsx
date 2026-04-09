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
  sheetLetter: string | null;
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

// --- Theme system ---

interface SheetTheme {
  id: string;
  label: string;
  fonts?: string; // Google Fonts URL to load
  pageBg: string;
  textColor: string;
  bodyFont: string;
  headingFont: string;
  headingColor: string;
  labelColor: (houseColor: string) => string;
  borderStyle: (houseColor: string) => string;
  headerBorder: (houseColor: string) => string;
  missionBandBg: (houseColor: string) => string;
  missionBandBorder: (houseColor: string) => string;
  missionLetterColor: (houseColor: string) => string;
  missionMarkerColor: (houseColor: string) => string;
  /** Optional decorative background layers */
  renderBackground?: (houseColor: string) => React.ReactNode;
}

const classicTheme: SheetTheme = {
  id: "classic",
  label: "Classic",
  pageBg: "#faf9f6",
  textColor: "#1a1a1a",
  bodyFont: "'Georgia', 'Times New Roman', serif",
  headingFont: "'Georgia', 'Times New Roman', serif",
  headingColor: "#1a1a1a",
  labelColor: (houseColor) => houseColor,
  borderStyle: (houseColor) => `3px solid ${houseColor}`,
  headerBorder: (houseColor) => `2px solid ${houseColor}`,
  missionBandBg: (houseColor) => `${houseColor}12`,
  missionBandBorder: (houseColor) => `4px solid ${houseColor}`,
  missionLetterColor: (houseColor) => houseColor,
  missionMarkerColor: (houseColor) => houseColor,
};

const templeTheme: SheetTheme = {
  id: "temple",
  label: "Temple",
  fonts: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap",
  pageBg: "#f4e4c1",
  textColor: "#2c2118",
  bodyFont: "'Crimson Text', 'Georgia', serif",
  headingFont: "'Cinzel', serif",
  headingColor: "#3d2b1a",
  labelColor: () => "#8b5e3c",
  borderStyle: () => "4px double #8b6f47",
  headerBorder: () => "2px solid #c4a265",
  missionBandBg: () => "rgba(139, 94, 60, 0.10)",
  missionBandBorder: () => "4px solid #a0845c",
  missionLetterColor: () => "#8b5e3c",
  missionMarkerColor: () => "#6b4226",
  renderBackground: () => (
    <>
      {/* Parchment texture — subtle warm grain */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.06,
          backgroundImage: `
            radial-gradient(2px 2px at 12% 8%, rgba(120,80,30,1) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 28% 52%, rgba(140,100,50,1) 50%, transparent 100%),
            radial-gradient(2px 2px at 45% 15%, rgba(110,75,25,1) 50%, transparent 100%),
            radial-gradient(1px 1px at 58% 38%, rgba(130,90,40,1) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 72% 68%, rgba(120,85,35,1) 50%, transparent 100%),
            radial-gradient(2px 2px at 85% 25%, rgba(140,100,45,1) 50%, transparent 100%),
            radial-gradient(1px 1px at 92% 58%, rgba(110,80,30,1) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 38% 78%, rgba(130,95,42,1) 50%, transparent 100%)
          `,
        }}
      />
      {/* Aged edge darkening */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(ellipse at center, transparent 50%, rgba(100, 70, 30, 0.08) 100%)
          `,
        }}
      />
      {/* Faint crack lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.035,
          backgroundImage: `
            linear-gradient(155deg, transparent 42%, rgba(100,70,30,1) 42.3%, transparent 42.6%),
            linear-gradient(25deg, transparent 65%, rgba(100,70,30,1) 65.2%, transparent 65.5%),
            linear-gradient(100deg, transparent 78%, rgba(100,70,30,1) 78.2%, transparent 78.5%)
          `,
        }}
      />
    </>
  ),
};

const THEMES: SheetTheme[] = [classicTheme, templeTheme];

// --- Content parsing ---

/** Parse content into segments: plain text or mission-marked paragraphs.
 *  Missions are matched by their explicit sheetLetter field (set in admin). */
function parseContent(content: string, missions: PrintMission[]) {
  const paragraphs = content.split(/\n\n+/);
  const missionLetterMap = new Map<string, PrintMission>();
  for (const m of missions) {
    if (m.sheetLetter) {
      missionLetterMap.set(m.sheetLetter.toUpperCase(), m);
    }
  }

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

// --- Components ---

export function StorySheetPrint() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [sheets, setSheets] = useState<PrintSheet[]>([]);
  const [act, setAct] = useState("1");
  const [themeId, setThemeId] = useState("classic");
  const [loading, setLoading] = useState(true);

  const theme = THEMES.find((t) => t.id === themeId) ?? classicTheme;

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
      {/* Google Fonts for active theme */}
      {theme.fonts && (
        <link rel="stylesheet" href={theme.fonts} />
      )}

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
              value={themeId}
              onChange={setThemeId}
              data={THEMES.map((t) => ({ label: t.label, value: t.id }))}
            />
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
              theme={theme}
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
  theme,
  isLast,
}: {
  sheet: PrintSheet;
  gameId: string;
  theme: SheetTheme;
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
        position: "relative",
        overflow: "hidden",
        background: theme.pageBg,
        color: theme.textColor,
        border: theme.borderStyle(houseColor),
        borderRadius: "4px",
        fontFamily: theme.bodyFont,
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
      } as React.CSSProperties}
    >
      {/* Decorative background layers */}
      {theme.renderBackground?.(houseColor)}

      {/* Content (above background) */}
      <div style={{ position: "relative" }}>
        {/* Title header */}
        <div
          style={{
            borderBottom: theme.headerBorder(houseColor),
            paddingBottom: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: theme.labelColor(houseColor),
              fontFamily: theme.headingFont,
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
              color: theme.headingColor,
              fontFamily: theme.headingFont,
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
                theme={theme}
              />
            ) : (
              <p key={j} style={{ margin: "0 0 1rem 0" }}>
                {seg.text}
              </p>
            ),
          )}
        </div>
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
  theme,
}: {
  text: string;
  letter: string;
  mission: PrintMission;
  houseColor: string;
  gameId: string;
  theme: SheetTheme;
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
        background: theme.missionBandBg(houseColor),
        borderLeft: theme.missionBandBorder(houseColor),
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
          color: theme.missionLetterColor(houseColor),
          opacity: 0.35,
          lineHeight: 1,
          minWidth: "2.5rem",
          display: "flex",
          alignItems: "flex-start",
          paddingTop: "0.15rem",
          fontFamily: theme.headingFont,
        }}
      >
        {letter}
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0 }}>
          {parts[0]}
          <strong style={{ color: theme.missionMarkerColor(houseColor) }}>({letter})</strong>
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

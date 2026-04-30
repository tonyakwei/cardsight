import { useEffect, useState, useCallback, useLayoutEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Group,
  Text,
  Loader,
  Button,
  SegmentedControl,
  ActionIcon,
  Badge,
  Stack,
} from "@mantine/core";
import Markdown from "react-markdown";
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
  storySheetBlurb: string | null;
}

interface PrintSheet {
  id: string;
  house: { id: string; name: string; color: string };
  act: number;
  title: string;
  content: string;
  missions: PrintMission[];
}

function contrastTextOn(hex: string): string {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (full.length !== 6) return "#1a1a1a";
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.6 ? "#1a1a1a" : "#ffffff";
}

// --- Theme system ---

interface SheetTheme {
  id: string;
  label: string;
  fonts?: string;
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
  missionTitleColor: (houseColor: string) => string;
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
  missionTitleColor: (houseColor) => houseColor,
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
  missionTitleColor: () => "#6b4226",
  renderBackground: () => (
    <>
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

// --- Components ---

// US Letter content area at 96 DPI with 0.5in margins
const PAGE_CONTENT_HEIGHT_PX = 10 * 96; // 960px
const PAGE_WARN_RATIO = 0.9; // warn when within 10% of overflow

interface OverflowState {
  height: number;
  overflows: boolean;
  warning: boolean;
}

export function StorySheetPrint() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [sheets, setSheets] = useState<PrintSheet[]>([]);
  const [act, setAct] = useState("1");
  const [themeId, setThemeId] = useState("classic");
  const [loading, setLoading] = useState(true);
  const [overflows, setOverflows] = useState<Record<string, OverflowState>>({});

  const theme = THEMES.find((t) => t.id === themeId) ?? classicTheme;

  const recordHeight = useCallback((sheetId: string, height: number) => {
    setOverflows((prev) => {
      const next: OverflowState = {
        height,
        overflows: height > PAGE_CONTENT_HEIGHT_PX,
        warning: height > PAGE_CONTENT_HEIGHT_PX * PAGE_WARN_RATIO,
      };
      const cur = prev[sheetId];
      if (
        cur &&
        cur.height === next.height &&
        cur.overflows === next.overflows &&
        cur.warning === next.warning
      )
        return prev;
      return { ...prev, [sheetId]: next };
    });
  }, []);

  const loadData = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    setOverflows({});
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
      {theme.fonts && <link rel="stylesheet" href={theme.fonts} />}

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

      {/* Overflow summary (screen-only) */}
      {!loading && sheets.length > 0 && (
        <div className="no-print" style={{ marginBottom: "1rem" }}>
          <Stack gap={4}>
            {sheets.map((sheet) => {
              const o = overflows[sheet.id];
              if (!o) return null;
              const overshootPx = Math.max(0, o.height - PAGE_CONTENT_HEIGHT_PX);
              return (
                <Group key={sheet.id} gap="xs">
                  <Text size="xs" fw={600} style={{ minWidth: 110 }}>
                    {sheet.house.name}
                  </Text>
                  {o.overflows ? (
                    <Badge size="sm" color="red" variant="filled">
                      Overflows by ~{overshootPx}px ({Math.ceil(o.height / PAGE_CONTENT_HEIGHT_PX)} pages)
                    </Badge>
                  ) : o.warning ? (
                    <Badge size="sm" color="yellow" variant="filled">
                      Tight — {Math.round((o.height / PAGE_CONTENT_HEIGHT_PX) * 100)}% of page
                    </Badge>
                  ) : (
                    <Badge size="sm" color="teal" variant="light">
                      Fits ({Math.round((o.height / PAGE_CONTENT_HEIGHT_PX) * 100)}%)
                    </Badge>
                  )}
                </Group>
              );
            })}
          </Stack>
        </div>
      )}

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
              onMeasure={(h) => recordHeight(sheet.id, h)}
            />
          ))}
        </div>
      )}

      <style>{`
        @page { size: letter; margin: 0.5in; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          .sheet-page { margin: 0 !important; box-shadow: none !important; }
        }
        @media screen {
          .sheet-page { margin: 0 auto 2rem auto; box-shadow: 0 4px 16px rgba(0,0,0,0.4); }
        }
        .story-md p { margin: 0 0 1rem 0; }
        .story-md p:last-child { margin-bottom: 0; }
        .story-md em { font-style: italic; }
        .story-md strong { font-weight: 700; }
        .blurb-md p { margin: 0 0 0.5rem 0; }
        .blurb-md p:last-child { margin-bottom: 0; }
        .blurb-md em { font-style: italic; }
        .blurb-md strong { font-weight: 700; }
      `}</style>
    </div>
  );
}

function SheetPage({
  sheet,
  gameId,
  theme,
  isLast,
  onMeasure,
}: {
  sheet: PrintSheet;
  gameId: string;
  theme: SheetTheme;
  isLast: boolean;
  onMeasure: (heightPx: number) => void;
}) {
  const houseColor = sheet.house.color;
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => onMeasure(el.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // Re-measure once images (QR codes) have loaded
    const imgs = el.querySelectorAll("img");
    imgs.forEach((img) => {
      if (!img.complete) img.addEventListener("load", measure, { once: true });
    });
    return () => ro.disconnect();
  }, [onMeasure, sheet.content, sheet.missions.length]);

  return (
    <div
      ref={ref}
      className="sheet-page"
      style={{
        pageBreakAfter: isLast ? undefined : "always",
        width: "7.5in",
        boxSizing: "border-box",
        padding: "2.5rem",
        paddingTop: "3rem",
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
      {theme.renderBackground?.(houseColor)}

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "14px",
          background: houseColor,
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        } as React.CSSProperties}
      />

      <div
        aria-hidden
        style={{
          position: "absolute",
          right: "1.25rem",
          bottom: "1rem",
          fontFamily: theme.headingFont,
          fontSize: "9rem",
          fontWeight: 900,
          lineHeight: 1,
          color: houseColor,
          opacity: 0.1,
          pointerEvents: "none",
          letterSpacing: "-0.05em",
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        } as React.CSSProperties}
      >
        {sheet.house.name.charAt(0).toUpperCase()}
      </div>

      <div style={{ position: "relative" }}>
        {/* Title header */}
        <div
          style={{
            borderBottom: theme.headerBorder(houseColor),
            paddingBottom: "1rem",
            marginBottom: "2rem",
          }}
        >
          <span
            style={{
              display: "inline-block",
              background: houseColor,
              color: contrastTextOn(houseColor),
              fontFamily: theme.headingFont,
              fontSize: "0.7rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              padding: "0.3rem 0.7rem",
              borderRadius: "999px",
              marginBottom: "0.6rem",
              printColorAdjust: "exact",
              WebkitPrintColorAdjust: "exact",
            } as React.CSSProperties}
          >
            {sheet.house.name} — Act {sheet.act}
          </span>
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

        {/* Story content (markdown) */}
        <div
          className="story-md"
          style={{ fontSize: "0.95rem", lineHeight: 1.85 }}
        >
          <Markdown>{sheet.content}</Markdown>
        </div>

        {/* Mission list */}
        {sheet.missions.length > 0 && (
          <div style={{ marginTop: "2rem" }}>
            <div
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: theme.labelColor(houseColor),
                fontFamily: theme.headingFont,
                fontWeight: 700,
                marginBottom: "0.75rem",
              }}
            >
              Your Missions
            </div>
            <div>
              {sheet.missions.map((mission) => (
                <MissionBand
                  key={mission.id}
                  mission={mission}
                  houseColor={houseColor}
                  gameId={gameId}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MissionBand({
  mission,
  houseColor,
  gameId,
  theme,
}: {
  mission: PrintMission;
  houseColor: string;
  gameId: string;
  theme: SheetTheme;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        margin: "0.75rem 0",
        padding: "1rem 1.25rem",
        background: theme.missionBandBg(houseColor),
        borderLeft: theme.missionBandBorder(houseColor),
        borderRadius: "0 4px 4px 0",
        gap: "1rem",
        pageBreakInside: "avoid",
      }}
    >
      <div style={{ flex: 1, fontSize: "0.9rem", lineHeight: 1.6 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.4rem",
          }}
        >
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: houseColor,
              flexShrink: 0,
              printColorAdjust: "exact",
              WebkitPrintColorAdjust: "exact",
            } as React.CSSProperties}
          />
          <div
            style={{
              fontFamily: theme.headingFont,
              fontWeight: 700,
              fontSize: "1.05rem",
              color: theme.missionTitleColor(houseColor),
            }}
          >
            {mission.title}
          </div>
        </div>
        {mission.storySheetBlurb && (
          <div className="blurb-md">
            <Markdown>{mission.storySheetBlurb}</Markdown>
          </div>
        )}
      </div>

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
            width: "84px",
            height: "84px",
            borderRadius: "4px",
            border: `3px solid ${houseColor}`,
            background: "white",
            padding: "2px",
            boxSizing: "content-box",
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

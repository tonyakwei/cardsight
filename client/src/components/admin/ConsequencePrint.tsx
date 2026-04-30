import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { processQrianText } from "../../utils/qrian-text";
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
  fetchActBreak,
  fetchHouses,
  type GameDetail,
  type ActBreakHouse,
  type AdminHouse,
} from "../../api/admin";

// --- Theme definitions ---

interface CardTheme {
  id: string;
  label: string;
  fonts: string; // Google Fonts URL
  baseFont: string;
  headingFont: string;
  cardBg: string;
  textColor: string;
  headingColor: string;
  strongColor: string;
  borderRadius: string;
  /** Render background layers behind the card content */
  renderBackground: (houseColor: string) => React.ReactNode;
  /** Border style for the inset frame */
  borderStyle: (houseColor: string) => string;
  /** Extra CSS for markdown text */
  markdownStyles: string;
}

const spaceTheme: CardTheme = {
  id: "space",
  label: "Space",
  fonts: "https://fonts.googleapis.com/css2?family=Audiowide&family=Exo+2:wght@400;600;700&display=swap",
  baseFont: "'Exo 2', sans-serif",
  headingFont: "'Audiowide', sans-serif",
  cardBg: "#080c10",
  textColor: "#c8c8c8",
  headingColor: "#e8e8e8",
  strongColor: "#e8e8e8",
  borderRadius: "8px",
  borderStyle: (houseColor: string) => `3px solid ${houseColor}`,
  renderBackground: (houseColor: string) => (
    <>
      {/* Nebula / starfield */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(ellipse at 20% 50%, ${houseColor}18 0%, transparent 60%),
            radial-gradient(ellipse at 80% 30%, rgba(90, 50, 160, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 80%, rgba(30, 80, 140, 0.10) 0%, transparent 50%),
            radial-gradient(circle at 15% 20%, rgba(255,255,255,0.04) 0%, transparent 30%),
            radial-gradient(circle at 85% 70%, rgba(255,255,255,0.03) 0%, transparent 25%)
          `,
        }}
      />
      {/* Star dots */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `
            radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.5) 50%, transparent 100%),
            radial-gradient(1px 1px at 25% 60%, rgba(255,255,255,0.4) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 45% 10%, rgba(255,255,255,0.6) 50%, transparent 100%),
            radial-gradient(1px 1px at 55% 45%, rgba(255,255,255,0.35) 50%, transparent 100%),
            radial-gradient(1px 1px at 70% 75%, rgba(255,255,255,0.45) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 88% 25%, rgba(255,255,255,0.5) 50%, transparent 100%),
            radial-gradient(1px 1px at 35% 85%, rgba(255,255,255,0.3) 50%, transparent 100%),
            radial-gradient(1px 1px at 92% 55%, rgba(255,255,255,0.4) 50%, transparent 100%),
            radial-gradient(1px 1px at 5% 80%, rgba(255,255,255,0.35) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 65% 30%, rgba(255,255,255,0.55) 50%, transparent 100%)
          `,
        }}
      />
    </>
  ),
  markdownStyles: `
    .consequence-text strong { color: #e8e8e8; }
  `,
};

const adventureTheme: CardTheme = {
  id: "adventure",
  label: "Explorer",
  fonts: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap",
  baseFont: "'Crimson Text', serif",
  headingFont: "'Cinzel', serif",
  cardBg: "#1a150e",
  textColor: "#d4c9a8",
  headingColor: "#e8d5a3",
  strongColor: "#f0dfa8",
  borderRadius: "4px",
  borderStyle: () => "3px solid #b8963a",
  renderBackground: (houseColor: string) => (
    <>
      {/* Aged parchment / torchlight glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(ellipse at 15% 50%, ${houseColor}15 0%, transparent 55%),
            radial-gradient(ellipse at 85% 40%, rgba(180, 120, 40, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 90%, rgba(120, 80, 20, 0.06) 0%, transparent 45%)
          `,
        }}
      />
      {/* Subtle stone / dust texture via noise-like dots */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.06,
          backgroundImage: `
            radial-gradient(2px 2px at 8% 12%, rgba(200,180,140,1) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 22% 55%, rgba(200,180,140,1) 50%, transparent 100%),
            radial-gradient(2px 2px at 40% 8%, rgba(200,180,140,1) 50%, transparent 100%),
            radial-gradient(1px 1px at 52% 42%, rgba(200,180,140,1) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 68% 72%, rgba(200,180,140,1) 50%, transparent 100%),
            radial-gradient(2px 2px at 82% 22%, rgba(200,180,140,1) 50%, transparent 100%),
            radial-gradient(1px 1px at 90% 60%, rgba(200,180,140,1) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 35% 82%, rgba(200,180,140,1) 50%, transparent 100%),
            radial-gradient(1px 1px at 75% 15%, rgba(200,180,140,1) 50%, transparent 100%),
            radial-gradient(2px 2px at 60% 50%, rgba(200,180,140,1) 50%, transparent 100%)
          `,
        }}
      />
      {/* Cracked line accents */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.04,
          backgroundImage: `
            linear-gradient(165deg, transparent 40%, rgba(160,130,70,1) 40.5%, transparent 41%),
            linear-gradient(20deg, transparent 60%, rgba(160,130,70,1) 60.3%, transparent 60.6%),
            linear-gradient(95deg, transparent 75%, rgba(160,130,70,1) 75.2%, transparent 75.5%)
          `,
        }}
      />
    </>
  ),
  markdownStyles: `
    .consequence-text strong { color: #f0dfa8; }
  `,
};

const THEMES: CardTheme[] = [spaceTheme, adventureTheme];

// --- Shared print styles ---

const basePrintStyles = `
  .consequence-text p { margin: 0 0 0.4em 0; }
  .consequence-text p:last-child { margin-bottom: 0; }
  .consequence-text em { font-style: italic; }
  .consequence-text ul, .consequence-text ol { margin: 0.2em 0; padding-left: 1.2em; }
  .consequence-text li { margin-bottom: 0.15em; }

  @media print {
    body * { visibility: hidden; }
    .consequence-print-root,
    .consequence-print-root * { visibility: visible; }
    .consequence-print-root {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    .no-print { display: none !important; }

    @page {
      size: letter portrait;
      margin: 0.5in;
    }

    .consequence-card {
      break-inside: avoid;
      page-break-inside: avoid;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    .consequence-print-root * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
  }
`;

// --- Component ---

export function ConsequencePrint() {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [houses, setHouses] = useState<AdminHouse[]>([]);
  const [summary, setSummary] = useState<ActBreakHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [act, setAct] = useState(searchParams.get("act") ?? "1");
  const [cardsPerPage, setCardsPerPage] = useState("3");
  const [themeId, setThemeId] = useState("space");

  const theme = THEMES.find((t) => t.id === themeId) ?? spaceTheme;

  const loadData = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    const [g, h, s] = await Promise.all([
      fetchGame(gameId),
      fetchHouses(gameId),
      fetchActBreak(gameId, Number(act)),
    ]);
    setGame(g);
    setHouses(h);
    setSummary(s);
    setLoading(false);
  }, [gameId, act]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load Google Fonts + inject styles
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = theme.fonts;
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = basePrintStyles + "\n" + theme.markdownStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, [theme]);

  if (loading) {
    return (
      <Group justify="center" pt="xl">
        <Loader color="yellow" size="sm" />
      </Group>
    );
  }

  if (!game) return null;

  // Collect all consequence cards to print
  const allCards: {
    houseName: string;
    houseColor: string;
    title: string;
    isCompleted: boolean;
    consequence: string | null;
    consequenceImage: string | null;
  }[] = [];

  for (const entry of summary) {
    for (const m of entry.missions) {
      if (m.consequence) {
        allCards.push({
          houseName: entry.house.name,
          houseColor: entry.house.color,
          title: m.title,
          isCompleted: m.isCompleted,
          consequence: m.consequence,
          consequenceImage: m.consequenceImage,
        });
      }
    }
  }

  const perPage = Number(cardsPerPage);
  const cardHeight = perPage === 3 ? "3.13in" : "4.7in";

  return (
    <div className="consequence-print-root">
      {/* Toolbar — hidden when printing */}
      <div className="no-print">
        <Group justify="space-between" mb="md" p="md">
          <Group gap="sm">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => navigate(`/admin/games/${gameId}/act-break`)}
            >
              ←
            </ActionIcon>
            <Text size="xl" fw={700}>
              Print Consequence Cards
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
            <SegmentedControl
              size="xs"
              value={cardsPerPage}
              onChange={setCardsPerPage}
              data={[
                { label: "2/page", value: "2" },
                { label: "3/page", value: "3" },
              ]}
            />
            <Button size="sm" color="yellow" onClick={() => window.print()}>
              Print
            </Button>
          </Group>
        </Group>

        {allCards.length === 0 && (
          <Text c="dimmed" ta="center" py="xl">
            No consequences with text for Act {act}. Write consequence
            text on missions first.
          </Text>
        )}
      </div>

      {/* Printable cards */}
      <div
        style={{
          maxWidth: "8.5in",
          margin: "0 auto",
          fontFamily: theme.baseFont,
        }}
      >
        {allCards.map((card, i) => (
          <div
            key={i}
            className="consequence-card"
            style={{
              height: cardHeight,
              width: "100%",
              boxSizing: "border-box",
              overflow: "hidden",
              borderRadius: theme.borderRadius,
              marginBottom: "0.15in",
              padding: "0.15in 0.15in 0.15in 0.4in",
              position: "relative",
              pageBreakInside: "avoid",
              background: theme.cardBg,
            }}
          >
            {/* Theme background */}
            {theme.renderBackground(card.houseColor)}

            {/* House-colored bleed strip (left edge, full height) for sorting */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "0.3in",
                background: card.houseColor,
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  fontFamily: theme.headingFont,
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: "#ffffff",
                  mixBlendMode: "difference",
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  whiteSpace: "nowrap",
                }}
              >
                {card.houseName}
              </span>
            </div>

            {/* Thick house-colored border (inset from card edge) */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                border: theme.borderStyle(card.houseColor),
                borderRadius: "4px",
                display: "flex",
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >
              {/* Left image */}
              {card.consequenceImage ? (
                <div
                  style={{
                    width: "2.2in",
                    minWidth: "2.2in",
                    margin: "0.15in",
                    borderRadius: "4px",
                    backgroundImage: `url(${card.consequenceImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "1.5in",
                    minWidth: "1.5in",
                    margin: "0.15in",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `linear-gradient(180deg, ${card.houseColor}22 0%, ${card.houseColor}11 100%)`,
                  }}
                >
                  <div
                    style={{
                      width: "0.8in",
                      height: "0.8in",
                      borderRadius: "50%",
                      border: `3px solid ${card.houseColor}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      fontWeight: 700,
                      color: card.houseColor,
                      fontFamily: theme.headingFont,
                    }}
                  >
                    {card.houseName[0]}
                  </div>
                </div>
              )}

              {/* Content */}
              <div
                style={{
                  flex: 1,
                  padding: "0.2in 0.25in 0.2in 0.1in",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {/* House label + status */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.12in",
                  }}
                >
                  <span
                    style={{
                      fontFamily: theme.headingFont,
                      fontSize: "13px",
                      fontWeight: 400,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: card.houseColor,
                    }}
                  >
                    {card.houseName}
                  </span>
                  <span
                    style={{
                      fontFamily: theme.headingFont,
                      fontSize: "12px",
                      fontWeight: 400,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      color: card.isCompleted ? "#4caf50" : "#ef5350",
                      padding: "4px 12px",
                      borderRadius: "3px",
                      border: `1px solid ${card.isCompleted ? "#4caf50" : "#ef5350"}`,
                    }}
                  >
                    {card.isCompleted ? "Mission Complete" : "Mission Failed"}
                  </span>
                </div>

                {/* Title */}
                <div
                  style={{
                    fontFamily: theme.headingFont,
                    fontSize: "22px",
                    fontWeight: 400,
                    color: theme.headingColor,
                    marginBottom: "0.1in",
                    lineHeight: 1.2,
                    borderBottom: `1px solid ${card.houseColor}44`,
                    paddingBottom: "0.08in",
                  }}
                >
                  {card.title}
                </div>

                {/* Consequence text */}
                <div
                  style={{
                    fontSize: "21px",
                    lineHeight: 1.6,
                    color: theme.textColor,
                    flex: 1,
                    overflow: "hidden",
                  }}
                  className="consequence-text"
                >
                  <Markdown rehypePlugins={[rehypeRaw]}>{card.consequence ? processQrianText(card.consequence) : ""}</Markdown>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

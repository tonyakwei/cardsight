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

function contrastTextOn(hex: string): string {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (full.length !== 6) return "#ffffff";
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.6 ? "#1a1a1a" : "#ffffff";
}

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
  renderBackground: (houseColor: string, act: number) => React.ReactNode;
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
  renderBackground: (houseColor: string, act: number) => (
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
      {act === 1 && <ConsequenceFloodAccents />}
      {act === 2 && <ConsequenceVineAccents />}
    </>
  ),
  markdownStyles: `
    .consequence-text strong { color: #f0dfa8; }
  `,
};

function ConsequenceFloodAccents() {
  return (
    <>
      {/* Submerged wash — bottom 45% turns deep teal */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "45%",
          background:
            "linear-gradient(180deg, rgba(40,90,120,0) 0%, rgba(50,110,140,0.30) 55%, rgba(70,140,170,0.55) 100%)",
          pointerEvents: "none",
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        } as React.CSSProperties}
      />
      {/* Surface wave (top of flood) */}
      <svg
        aria-hidden
        viewBox="0 0 720 36"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "45%",
          width: "100%",
          height: "16px",
          opacity: 0.9,
          pointerEvents: "none",
        }}
      >
        <path
          d="M 0 18 Q 50 4 100 18 T 200 18 T 300 18 T 400 18 T 500 18 T 600 18 T 720 18"
          stroke="rgba(160, 215, 235, 0.75)"
          strokeWidth="1.6"
          fill="none"
        />
      </svg>
      {/* Secondary submerged wave */}
      <svg
        aria-hidden
        viewBox="0 0 720 30"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "30%",
          width: "100%",
          height: "12px",
          opacity: 0.55,
          pointerEvents: "none",
        }}
      >
        <path
          d="M 0 15 Q 80 6 160 15 T 320 15 T 480 15 T 640 15 T 720 15"
          stroke="rgba(160, 215, 235, 0.6)"
          strokeWidth="1.1"
          fill="none"
        />
      </svg>
      {/* Bubbles rising in the lower band */}
      <svg
        aria-hidden
        viewBox="0 0 720 200"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "45%",
          opacity: 0.8,
          pointerEvents: "none",
        }}
      >
        <g stroke="rgba(180, 220, 240, 0.85)" strokeWidth="1" fill="none">
          <circle cx="120" cy="170" r="3.5" />
          <circle cx="135" cy="135" r="2.2" />
          <circle cx="290" cy="180" r="3" />
          <circle cx="305" cy="145" r="2" />
          <circle cx="455" cy="160" r="3.2" />
          <circle cx="470" cy="125" r="2.3" />
          <circle cx="610" cy="175" r="3" />
          <circle cx="625" cy="140" r="2.1" />
          <circle cx="395" cy="190" r="2" />
          <circle cx="540" cy="195" r="1.8" />
        </g>
      </svg>
    </>
  );
}

function ConsequenceVineCorner({
  transform,
  position,
}: {
  transform: string;
  position: React.CSSProperties;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 240 240"
      style={{
        position: "absolute",
        width: "130px",
        height: "130px",
        opacity: 0.7,
        pointerEvents: "none",
        transform,
        transformOrigin: "center",
        ...position,
      }}
    >
      <g stroke="rgba(190, 155, 80, 0.9)" strokeWidth="1.7" fill="none" strokeLinecap="round">
        <path d="M 4 18 Q 50 44 82 70 T 142 116 Q 168 140 156 178" />
        <path d="M 22 4 Q 56 30 72 60 T 112 116" />
        <path d="M 56 48 Q 80 62 88 80" />
      </g>
      <g fill="rgba(120, 150, 75, 0.9)">
        <ellipse cx="50" cy="44" rx="11" ry="5" transform="rotate(-30 50 44)" />
        <ellipse cx="92" cy="80" rx="12" ry="5.5" transform="rotate(20 92 80)" />
        <ellipse cx="140" cy="130" rx="10" ry="4.8" transform="rotate(55 140 130)" />
        <ellipse cx="68" cy="72" rx="7" ry="3.4" transform="rotate(40 68 72)" />
        <ellipse cx="118" cy="58" rx="9" ry="4" transform="rotate(-12 118 58)" />
      </g>
      <g fill="rgba(150, 175, 95, 0.85)">
        <ellipse cx="60" cy="55" rx="4" ry="2" transform="rotate(-30 60 55)" />
        <ellipse cx="105" cy="92" rx="4.5" ry="2.2" transform="rotate(20 105 92)" />
      </g>
    </svg>
  );
}

function ConsequenceVineAccents() {
  return (
    <>
      {/* Faint mossy green wash */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(80, 110, 60, 0.06)",
          pointerEvents: "none",
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        } as React.CSSProperties}
      />
      {/* A faint top-edge vine swag, scaled for the wide-short card */}
      <svg
        aria-hidden
        viewBox="0 0 720 50"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          left: "150px",
          right: "150px",
          top: "4px",
          height: "28px",
          opacity: 0.55,
          pointerEvents: "none",
        }}
      >
        <path
          d="M 0 25 Q 60 5 120 25 T 240 25 T 360 25 T 480 25 T 600 25 T 720 25"
          stroke="rgba(190, 155, 80, 0.85)"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
        <g fill="rgba(120, 150, 75, 0.85)">
          <ellipse cx="60" cy="14" rx="9" ry="4" transform="rotate(-25 60 14)" />
          <ellipse cx="180" cy="36" rx="9" ry="4" transform="rotate(25 180 36)" />
          <ellipse cx="300" cy="14" rx="9" ry="4" transform="rotate(-25 300 14)" />
          <ellipse cx="420" cy="36" rx="9" ry="4" transform="rotate(25 420 36)" />
          <ellipse cx="540" cy="14" rx="9" ry="4" transform="rotate(-25 540 14)" />
          <ellipse cx="660" cy="36" rx="9" ry="4" transform="rotate(25 660 36)" />
        </g>
      </svg>
      {/* Mirrored bottom-edge vine swag */}
      <svg
        aria-hidden
        viewBox="0 0 720 50"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          left: "150px",
          right: "150px",
          bottom: "4px",
          height: "28px",
          opacity: 0.55,
          pointerEvents: "none",
          transform: "scaleY(-1)",
        }}
      >
        <path
          d="M 0 25 Q 60 5 120 25 T 240 25 T 360 25 T 480 25 T 600 25 T 720 25"
          stroke="rgba(190, 155, 80, 0.85)"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
        <g fill="rgba(120, 150, 75, 0.85)">
          <ellipse cx="60" cy="14" rx="9" ry="4" transform="rotate(-25 60 14)" />
          <ellipse cx="180" cy="36" rx="9" ry="4" transform="rotate(25 180 36)" />
          <ellipse cx="300" cy="14" rx="9" ry="4" transform="rotate(-25 300 14)" />
          <ellipse cx="420" cy="36" rx="9" ry="4" transform="rotate(25 420 36)" />
          <ellipse cx="540" cy="14" rx="9" ry="4" transform="rotate(-25 540 14)" />
          <ellipse cx="660" cy="36" rx="9" ry="4" transform="rotate(25 660 36)" />
        </g>
      </svg>
      <ConsequenceVineCorner transform="" position={{ top: 0, left: 0 }} />
      <ConsequenceVineCorner transform="scaleX(-1)" position={{ top: 0, right: 0 }} />
      <ConsequenceVineCorner transform="scaleY(-1)" position={{ bottom: 0, left: 0 }} />
      <ConsequenceVineCorner transform="scale(-1, -1)" position={{ bottom: 0, right: 0 }} />
    </>
  );
}

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
  const [outcomeMode, setOutcomeMode] = useState<"both" | "success" | "failure" | "actual">("both");

  const themeId = game?.printTheme === "temple" ? "adventure" : "space";
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
      const showSuccess =
        outcomeMode === "both" ||
        outcomeMode === "success" ||
        (outcomeMode === "actual" && m.isCompleted);
      const showFailure =
        outcomeMode === "both" ||
        outcomeMode === "failure" ||
        (outcomeMode === "actual" && !m.isCompleted);

      if (showSuccess && m.consequenceCompleted) {
        allCards.push({
          houseName: entry.house.name,
          houseColor: entry.house.color,
          title: m.title,
          isCompleted: true,
          consequence: m.consequenceCompleted,
          consequenceImage: m.consequenceImageCompleted,
        });
      }
      if (showFailure && m.consequenceNotCompleted) {
        allCards.push({
          houseName: entry.house.name,
          houseColor: entry.house.color,
          title: m.title,
          isCompleted: false,
          consequence: m.consequenceNotCompleted,
          consequenceImage: m.consequenceImageNotCompleted,
        });
      }
    }
  }

  const perPage = Number(cardsPerPage);
  const cardHeight = perPage === 3 ? "3.13in" : "4.7in";

  function fitText(text: string | null) {
    const len = text?.length ?? 0;
    const longThreshold = perPage === 3 ? 230 : 430;
    const xlongThreshold = perPage === 3 ? 430 : 800;
    const xxlongThreshold = perPage === 3 ? 630 : 1100;
    if (len > xxlongThreshold) return { fontSize: "12px", lineHeight: 1.3,  titleSize: "17px" };
    if (len > xlongThreshold)  return { fontSize: "14px", lineHeight: 1.35, titleSize: "18px" };
    if (len > longThreshold)   return { fontSize: "16px", lineHeight: 1.42, titleSize: "19px" };
    return { fontSize: "21px", lineHeight: 1.6, titleSize: "22px" };
  }

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
              value={outcomeMode}
              onChange={(v) => setOutcomeMode(v as typeof outcomeMode)}
              data={[
                { label: "Both", value: "both" },
                { label: "Success", value: "success" },
                { label: "Failure", value: "failure" },
                { label: "Actual", value: "actual" },
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
          maxWidth: "7.5in",
          margin: "0 auto",
          fontFamily: theme.baseFont,
        }}
      >
        {allCards.map((card, i) => {
          const fit = fitText(card.consequence);
          return (
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
            {theme.renderBackground(card.houseColor, Number(act))}

            {/* Outcome bleed strip (left edge, full height) — green for complete, red for failed */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "0.3in",
                background: card.isCompleted ? "#2e7d32" : "#c62828",
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
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  whiteSpace: "nowrap",
                }}
              >
                {card.isCompleted ? "Mission Complete" : "Mission Failed"}
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
                    width: "0.75in",
                    minWidth: "0.75in",
                    margin: "0.15in",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `linear-gradient(180deg, ${card.houseColor}22 0%, ${card.houseColor}11 100%)`,
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      fontFamily: theme.headingFont,
                      fontSize: "44px",
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: card.houseColor,
                      transform: "rotate(-90deg)",
                      whiteSpace: "nowrap",
                      lineHeight: 1,
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    } as React.CSSProperties}
                  >
                    {card.houseName.split(" ")[0]}
                  </span>
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
                {/* House tag */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "0.12in",
                  }}
                >
                  <span
                    style={{
                      fontFamily: theme.headingFont,
                      fontSize: "12px",
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: contrastTextOn(card.houseColor),
                      background: card.houseColor,
                      padding: "3px 10px",
                      borderRadius: "999px",
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    } as React.CSSProperties}
                  >
                    {card.houseName}
                  </span>
                </div>

                {/* Title */}
                <div
                  style={{
                    fontFamily: theme.headingFont,
                    fontSize: fit.titleSize,
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
                    fontSize: fit.fontSize,
                    lineHeight: fit.lineHeight,
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
          );
        })}
      </div>
    </div>
  );
}

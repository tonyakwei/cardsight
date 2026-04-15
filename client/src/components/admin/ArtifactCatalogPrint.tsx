import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Group,
  Text,
  Loader,
  Button,
  ActionIcon,
  SegmentedControl,
} from "@mantine/core";
import { fetchGame, type GameDetail } from "../../api/admin";

const GOOGLE_FONTS =
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap";

/** Physical card colors in deck order. */
const CARD_COLORS: { name: string; color: string }[] = [
  { name: "Red", color: "#c0392b" },
  { name: "Yellow", color: "#d4a017" },
  { name: "Green", color: "#27ae60" },
  { name: "Blue", color: "#2e86c1" },
  { name: "Purple", color: "#8e44ad" },
  { name: "White", color: "#7f8c8d" },
];

/**
 * The 9 card glyphs in order (card numbers 1-9).
 * Each glyph maps to a physical card's number.
 * SVG paths are simplified for clean small-size print rendering.
 */
const GLYPHS: { label: string; svg: string }[] = [
  {
    label: "Star",
    svg: '<polygon points="50,8 61,38 95,38 67,56 78,88 50,70 22,88 33,56 5,38 39,38"/>',
  },
  {
    label: "Diamond",
    svg: '<polygon points="50,8 92,50 50,92 8,50"/>',
  },
  {
    label: "Crescent",
    svg: '<path d="M55,10 A40,40 0 1,1 55,90 A52,52 0 0,0 55,10 Z"/>',
  },
  {
    label: "Compass",
    svg: '<polygon points="50,6 56,44 94,50 56,56 50,94 44,56 6,50 44,44"/><circle cx="50" cy="50" r="6" fill="none" stroke="currentColor" stroke-width="3"/>',
  },
  {
    label: "Shield",
    svg: '<path d="M50,92 C28,76 12,58 12,32 L12,18 L50,8 L88,18 L88,32 C88,58 72,76 50,92 Z M50,82 C32,70 22,55 22,35 L22,24 L50,16 L78,24 L78,35 C78,55 68,70 50,82 Z"/>',
  },
  {
    label: "Hexagram",
    svg: '<polygon points="50,8 62,35 95,35 68,55 78,85 50,67 22,85 32,55 5,35 38,35"/>',
  },
  {
    label: "Key",
    svg: '<circle cx="50" cy="30" r="18" fill="none" stroke="currentColor" stroke-width="7"/><rect x="46" y="45" width="8" height="38" rx="2"/><rect x="54" y="62" width="12" height="6" rx="1"/><rect x="54" y="74" width="9" height="6" rx="1"/>',
  },
  {
    label: "Hourglass",
    svg: '<path d="M25,10 L75,10 L75,16 L60,48 L75,80 L75,90 L25,90 L25,80 L40,48 L25,16 Z M32,16 L68,16 L56,44 L44,44 Z M32,80 L68,80 L56,52 L44,52 Z"/>',
  },
  {
    label: "Eye",
    svg: '<path d="M5,50 C5,50 25,20 50,20 C75,20 95,50 95,50 C95,50 75,80 50,80 C25,80 5,50 5,50 Z" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="50" cy="50" r="14"/><circle cx="50" cy="50" r="6" fill="none" stroke="currentColor" stroke-width="4"/>',
  },
];

const THEME = {
  pageBg: "#f0e6d0",
  text: "#3b2f20",
  border: "#8b7355",
  borderLight: "#c4a87c",
  heading: "#2c2017",
  sectionHeader: "#5c4a35",
  tableLine: "#c4a87c",
  tableLineLight: "#d4c4a0",
  colHeaderBg: "#e0d0b4",
  glyphColor: "#4a3a28",
};

export function ArtifactCatalogPrint() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [act, setAct] = useState("1");

  const loadData = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    const g = await fetchGame(gameId);
    setGame(g);
    setLoading(false);
  }, [gameId]);

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
      <link rel="stylesheet" href={GOOGLE_FONTS} />

      {/* Controls */}
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
              {game.name} — Item Catalog Sheets
            </Text>
          </Group>
          <Group gap="sm">
            <SegmentedControl
              size="xs"
              value={act}
              onChange={(v) => setAct(v)}
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

        <Text size="sm" c="dimmed" mb="md">
          Universal sheet — all 54 physical cards. Print one per team per act.
          Players find their card's color and glyph, then write the item classification next to it.
        </Text>
      </div>

      {/* Printable sheet */}
      <CatalogPage act={Number(act)} />

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          @page { size: letter portrait; margin: 0.3in; }
        }
        @media screen {
          .catalog-page { margin-bottom: 2rem; }
        }
      `}</style>
    </div>
  );
}

function CatalogPage({ act }: { act: number }) {
  const leftColors = CARD_COLORS.slice(0, 3);
  const rightColors = CARD_COLORS.slice(3);

  return (
    <div
      className="catalog-page"
      style={{
        maxWidth: "8in",
        margin: "0 auto",
        padding: "0.3in 0.35in",
        position: "relative",
        overflow: "hidden",
        background: THEME.pageBg,
        color: THEME.text,
        fontFamily: "'Crimson Text', 'Georgia', serif",
        border: `3px double ${THEME.border}`,
        borderRadius: "2px",
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
      } as React.CSSProperties}
    >
      {/* Parchment texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.05,
          backgroundImage: `
            radial-gradient(2px 2px at 10% 8%, rgba(120,80,30,1) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 30% 55%, rgba(140,100,50,1) 50%, transparent 100%),
            radial-gradient(2px 2px at 48% 18%, rgba(110,75,25,1) 50%, transparent 100%),
            radial-gradient(1px 1px at 62% 40%, rgba(130,90,40,1) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 75% 70%, rgba(120,85,35,1) 50%, transparent 100%),
            radial-gradient(2px 2px at 88% 28%, rgba(140,100,45,1) 50%, transparent 100%),
            radial-gradient(1px 1px at 15% 75%, rgba(110,80,30,1) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 40% 82%, rgba(130,95,42,1) 50%, transparent 100%)
          `,
        }}
      />
      {/* Edge darkening */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(100, 70, 30, 0.07) 100%)",
        }}
      />

      {/* Content */}
      <div style={{ position: "relative" }}>
        {/* Title + house write-in */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "0.2in",
            paddingBottom: "0.08in",
            borderBottom: `2px solid ${THEME.borderLight}`,
          }}
        >
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "18px",
              fontWeight: 700,
              color: THEME.heading,
              letterSpacing: "0.06em",
            }}
          >
            Item Catalog
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "baseline",
              gap: "0.3in",
              marginTop: "4px",
            }}
          >
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "9px",
                fontWeight: 400,
                color: THEME.border,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Act {act}
            </span>
            <span
              style={{
                fontFamily: "'Crimson Text', serif",
                fontSize: "11px",
                color: THEME.sectionHeader,
              }}
            >
              House: <span style={{
                display: "inline-block",
                width: "1.5in",
                borderBottom: `1px solid ${THEME.tableLine}`,
              }}>&nbsp;</span>
            </span>
          </div>
        </div>

        {/* Two-column grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0 0.3in",
          }}
        >
          {/* Left column */}
          <div>
            {leftColors.map((c) => (
              <ColorSection key={c.name} cardColor={c} />
            ))}
          </div>
          {/* Right column */}
          <div>
            {rightColors.map((c) => (
              <ColorSection key={c.name} cardColor={c} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GlyphIcon({ index, size = 16 }: { index: number; size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{
        fill: THEME.glyphColor,
        color: THEME.glyphColor,
        flexShrink: 0,
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
      } as React.CSSProperties}
      dangerouslySetInnerHTML={{ __html: GLYPHS[index].svg }}
    />
  );
}

function ColorSection({
  cardColor,
}: {
  cardColor: { name: string; color: string };
}) {
  return (
    <div style={{ marginBottom: "0.12in" }}>
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "1px",
          paddingBottom: "2px",
          borderBottom: `1.5px solid ${THEME.border}`,
        }}
      >
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "2px",
            background: cardColor.color,
            flexShrink: 0,
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
          } as React.CSSProperties}
        />
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "9px",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: THEME.sectionHeader,
          }}
        >
          {cardColor.name}
        </div>
      </div>

      {/* 9 glyph rows */}
      {GLYPHS.map((glyph, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            height: "22px",
            borderBottom: `1px solid ${THEME.tableLineLight}`,
            borderLeft: `3px solid ${cardColor.color}`,
            paddingLeft: "5px",
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
          } as React.CSSProperties}
        >
          <GlyphIcon index={i} size={14} />
          <div
            style={{
              flex: 1,
              borderBottom: `1px dotted ${THEME.tableLine}`,
              height: "14px",
              marginTop: "4px",
            }}
          />
        </div>
      ))}
    </div>
  );
}

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
import {
  fetchGame,
  fetchHouses,
  type GameDetail,
  type AdminHouse,
} from "../../api/admin";

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

const ROWS_PER_COLOR = 4; // 4 × 6 = 24 slots, covers ~18 cards per house per act

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
};

export function ArtifactCatalogPrint() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [houses, setHouses] = useState<AdminHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [act, setAct] = useState("1");

  const loadData = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    const [g, h] = await Promise.all([
      fetchGame(gameId),
      fetchHouses(gameId),
    ]);
    setGame(g);
    setHouses(h);
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
              {game.name} — Artifact Catalog Sheets
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

        {houses.length === 0 && (
          <Text c="dimmed" ta="center" py="xl">
            No houses configured. Add houses to your game first.
          </Text>
        )}
      </div>

      {/* Printable sheets */}
      <div>
        {houses.map((house, i) => (
          <CatalogPage
            key={`${house.id}-${act}`}
            house={house}
            act={Number(act)}
            isLast={i === houses.length - 1}
          />
        ))}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          @page { size: letter portrait; margin: 0.35in 0.4in; }
        }
        @media screen {
          .catalog-page { margin-bottom: 2rem; }
        }
      `}</style>
    </div>
  );
}

function CatalogPage({
  house,
  act,
  isLast,
}: {
  house: AdminHouse;
  act: number;
  isLast: boolean;
}) {
  const leftColors = CARD_COLORS.slice(0, 3);
  const rightColors = CARD_COLORS.slice(3);

  return (
    <div
      className="catalog-page"
      style={{
        pageBreakAfter: isLast ? undefined : "always",
        maxWidth: "8in",
        margin: "0 auto",
        padding: "0.35in 0.4in",
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
        {/* Title */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "0.25in",
            paddingBottom: "0.1in",
            borderBottom: `2px solid ${THEME.borderLight}`,
          }}
        >
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "20px",
              fontWeight: 700,
              color: THEME.heading,
              letterSpacing: "0.06em",
            }}
          >
            {house.name}
          </div>
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "10px",
              fontWeight: 400,
              color: THEME.border,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              marginTop: "3px",
            }}
          >
            Artifact Catalog — Act {act}
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

function ColorSection({
  cardColor,
}: {
  cardColor: { name: string; color: string };
}) {
  const rows = Array.from({ length: ROWS_PER_COLOR });

  return (
    <div style={{ marginBottom: "0.15in" }}>
      {/* Section header with color strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "0",
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

      {/* Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "7px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: THEME.sectionHeader,
                background: THEME.colHeaderBg,
                padding: "2px 6px",
                textAlign: "left",
                borderBottom: `1.5px solid ${THEME.border}`,
                borderTop: `1px solid ${THEME.border}`,
                width: "45%",
                printColorAdjust: "exact",
                WebkitPrintColorAdjust: "exact",
              } as React.CSSProperties}
            >
              Card
            </th>
            <th
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "7px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: THEME.sectionHeader,
                background: THEME.colHeaderBg,
                padding: "2px 6px",
                textAlign: "left",
                borderBottom: `1.5px solid ${THEME.border}`,
                borderTop: `1px solid ${THEME.border}`,
                width: "55%",
                printColorAdjust: "exact",
                WebkitPrintColorAdjust: "exact",
              } as React.CSSProperties}
            >
              Item
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((_, i) => (
            <tr key={i}>
              <td
                style={{
                  borderBottom: `1px solid ${THEME.tableLineLight}`,
                  padding: "0",
                  height: "20px",
                  borderLeft: `3px solid ${cardColor.color}`,
                  printColorAdjust: "exact",
                  WebkitPrintColorAdjust: "exact",
                } as React.CSSProperties}
              >
                &nbsp;
              </td>
              <td
                style={{
                  borderBottom: `1px solid ${THEME.tableLineLight}`,
                  padding: "0",
                  height: "20px",
                }}
              >
                &nbsp;
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

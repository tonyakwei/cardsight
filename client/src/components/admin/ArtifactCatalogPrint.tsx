import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Group,
  Text,
  Loader,
  Button,
  ActionIcon,
} from "@mantine/core";
import {
  fetchGame,
  fetchHouses,
  type GameDetail,
  type AdminHouse,
} from "../../api/admin";

const GOOGLE_FONTS =
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap";

const TABLE_ROWS = 20;

const COLORS = {
  pageBg: "#f0e6d0",
  text: "#3b2f20",
  border: "#8b7355",
  borderLight: "#c4a87c",
  heading: "#2c2017",
  tableHeader: "#5c4a35",
  tableHeaderBg: "#e0d0b4",
  tableLine: "#c4a87c",
  notesLabel: "#6b5940",
};

export function ArtifactCatalogPrint() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [houses, setHouses] = useState<AdminHouse[]>([]);
  const [loading, setLoading] = useState(true);

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
          <Button size="sm" color="yellow" onClick={() => window.print()}>
            Print
          </Button>
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
            key={house.id}
            house={house}
            isLast={i === houses.length - 1}
          />
        ))}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          @page { size: letter portrait; margin: 0.4in 0.5in; }
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
  isLast,
}: {
  house: AdminHouse;
  isLast: boolean;
}) {
  const rows = Array.from({ length: TABLE_ROWS });

  return (
    <div
      className="catalog-page"
      style={{
        pageBreakAfter: isLast ? undefined : "always",
        maxWidth: "8in",
        margin: "0 auto",
        padding: "0.5in 0.6in",
        position: "relative",
        overflow: "hidden",
        background: COLORS.pageBg,
        color: COLORS.text,
        fontFamily: "'Crimson Text', 'Georgia', serif",
        border: `3px double ${COLORS.border}`,
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
            marginBottom: "0.35in",
            paddingBottom: "0.15in",
            borderBottom: `2px solid ${COLORS.borderLight}`,
          }}
        >
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "22px",
              fontWeight: 700,
              color: COLORS.heading,
              letterSpacing: "0.06em",
            }}
          >
            {house.name}
          </div>
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "11px",
              fontWeight: 400,
              color: COLORS.border,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              marginTop: "4px",
            }}
          >
            Artifact Catalog
          </div>
        </div>

        {/* Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "0.3in",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: COLORS.tableHeader,
                  background: COLORS.tableHeaderBg,
                  padding: "6px 10px",
                  textAlign: "left",
                  borderBottom: `2px solid ${COLORS.border}`,
                  borderTop: `1px solid ${COLORS.border}`,
                  width: "50%",
                  printColorAdjust: "exact",
                  WebkitPrintColorAdjust: "exact",
                } as React.CSSProperties}
              >
                Card Name
              </th>
              <th
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: COLORS.tableHeader,
                  background: COLORS.tableHeaderBg,
                  padding: "6px 10px",
                  textAlign: "left",
                  borderBottom: `2px solid ${COLORS.border}`,
                  borderTop: `1px solid ${COLORS.border}`,
                  width: "50%",
                  printColorAdjust: "exact",
                  WebkitPrintColorAdjust: "exact",
                } as React.CSSProperties}
              >
                Classification
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((_, i) => (
              <tr key={i}>
                <td
                  style={{
                    borderBottom: `1px solid ${COLORS.tableLine}`,
                    padding: "0",
                    height: "26px",
                  }}
                >
                  &nbsp;
                </td>
                <td
                  style={{
                    borderBottom: `1px solid ${COLORS.tableLine}`,
                    padding: "0",
                    height: "26px",
                  }}
                >
                  &nbsp;
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Notes area */}
        <div>
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: COLORS.notesLabel,
              marginBottom: "8px",
            }}
          >
            Field Notes
          </div>
          <div
            style={{
              borderTop: `1px solid ${COLORS.tableLine}`,
              minHeight: "1.2in",
              backgroundImage: `repeating-linear-gradient(
                to bottom,
                transparent,
                transparent 25px,
                ${COLORS.tableLine} 25px,
                ${COLORS.tableLine} 26px
              )`,
              backgroundPosition: "0 0",
            }}
          />
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import {
  Group,
  Text,
  Loader,
  Button,
  Stack,
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

// Inline styles for print — avoids needing a separate CSS file
const printStyles = `
  @media print {
    /* Hide everything except the print area */
    body > #root > * { display: none !important; }
    body > #root > .consequence-print-root { display: block !important; }
    .no-print { display: none !important; }

    @page {
      size: letter portrait;
      margin: 0.5in;
    }

    .consequence-card {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  }
`;

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

  // Inject print styles
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = printStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
  // Card height: for 3 per page on letter (11in - 1in margins = 10in usable), each ~3.2in
  // For 2 per page, each ~4.8in
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
          fontFamily: "Georgia, 'Times New Roman', serif",
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
              display: "flex",
              overflow: "hidden",
              border: `2px solid ${card.houseColor}`,
              borderRadius: "8px",
              marginBottom: "0.15in",
              background: `linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.06) 100%)`,
              position: "relative",
              pageBreakInside: "avoid",
            }}
          >
            {/* Background pattern */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.04,
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  ${card.houseColor} 0px,
                  ${card.houseColor} 1px,
                  transparent 1px,
                  transparent 20px
                )`,
                pointerEvents: "none",
              }}
            />

            {/* Left image */}
            {card.consequenceImage ? (
              <div
                style={{
                  width: "2.2in",
                  minWidth: "2.2in",
                  height: "100%",
                  backgroundImage: `url(${card.consequenceImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  borderRight: `3px solid ${card.houseColor}`,
                }}
              />
            ) : (
              <div
                style={{
                  width: "1.5in",
                  minWidth: "1.5in",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRight: `3px solid ${card.houseColor}`,
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
                padding: "0.3in 0.35in",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* House label + status */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.15in",
                }}
              >
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: card.houseColor,
                  }}
                >
                  {card.houseName}
                </span>
                <span
                  style={{
                    fontSize: "8px",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: card.isCompleted ? "#2e7d32" : "#c62828",
                    padding: "2px 8px",
                    borderRadius: "3px",
                    border: `1px solid ${card.isCompleted ? "#2e7d32" : "#c62828"}`,
                  }}
                >
                  {card.isCompleted ? "Mission Complete" : "Mission Failed"}
                </span>
              </div>

              {/* Title */}
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  marginBottom: "0.12in",
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
                  fontSize: "11px",
                  lineHeight: 1.55,
                  color: "#333",
                  flex: 1,
                  overflow: "hidden",
                  whiteSpace: "pre-wrap",
                }}
              >
                {card.consequence}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

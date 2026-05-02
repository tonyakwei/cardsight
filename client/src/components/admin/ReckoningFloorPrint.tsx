import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Group, Text, Loader, Button, ActionIcon } from "@mantine/core";
import { fetchGame, type GameDetail } from "../../api/admin";

const COLS = 10;
const ROWS = 12;

type Coord = [number, number];

const T_CELLS: Coord[] = [
  [1, 0],
  [0, 1],
  [1, 1],
  [2, 1],
  [1, 2],
];

const I_CELLS: Coord[] = [
  [0, 3], [0, 4], [0, 5], [0, 6],
  [2, 3], [2, 4], [2, 5], [2, 6],
  [4, 3], [4, 4], [4, 5], [4, 6],
  [1, 6], [3, 6],
];

const M_CELLS: Coord[] = [
  [6, 0], [6, 1], [6, 2], [6, 3],
  [5, 4], [6, 4], [7, 4], [8, 4],
  [5, 5], [6, 5], [7, 5], [8, 5],
];

const E_CELLS: Coord[] = [
  [0, 7], [1, 7], [2, 7], [3, 7], [4, 7],
  [0, 8], [4, 8],
  [0, 9], [1, 9], [2, 9], [3, 9], [4, 9],
  [0, 10], [4, 10],
  [0, 11], [1, 11], [2, 11], [3, 11], [4, 11],
];

const DECOY_PLUS: Coord[] = [
  [6, 8],
  [5, 9], [6, 9], [7, 9],
  [6, 10],
];

const DECOY_VLINE: Coord[] = [
  [9, 0], [9, 1], [9, 2], [9, 3],
];

const DECOY_BLOCK: Coord[] = [
  [7, 10], [8, 10],
  [7, 11], [8, 11],
  [9, 10], [9, 11],
];

const DECOY_TFAKE: Coord[] = [
  [5, 6], [6, 6], [7, 6], [8, 6],
  [8, 7],
];

const DECOY_DIAG: Coord[] = [
  [3, 0], [4, 1], [5, 2],
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface RenderedCell {
  digit: number;
}

function buildGrid(seed: number): RenderedCell[][] {
  const rand = mulberry32(seed);
  const cells: (RenderedCell | null)[][] = Array.from({ length: ROWS }, () =>
    Array<RenderedCell | null>(COLS).fill(null),
  );

  const place = (list: Coord[], digit: number) => {
    for (const [c, r] of list) cells[r][c] = { digit };
  };

  place(T_CELLS, 3);
  place(I_CELLS, 5);
  place(M_CELLS, 7);
  place(E_CELLS, 9);

  place(DECOY_PLUS, 1);
  place(DECOY_VLINE, 4);
  place(DECOY_BLOCK, 6);
  place(DECOY_TFAKE, 8);
  place(DECOY_DIAG, 2);

  const decoyDigits = [0, 1, 2, 4, 6, 8];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!cells[r][c]) {
        const digit = decoyDigits[Math.floor(rand() * decoyDigits.length)];
        cells[r][c] = { digit };
      }
    }
  }
  return cells as RenderedCell[][];
}

export function ReckoningFloorPrint() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [seed, setSeed] = useState(42);

  useEffect(() => {
    if (!gameId) return;
    fetchGame(gameId).then((g) => {
      setGame(g);
      setLoading(false);
    });
  }, [gameId]);

  const grid = useMemo(() => buildGrid(seed), [seed]);

  const reroll = useCallback(() => {
    setSeed(Math.floor(Math.random() * 1e9));
  }, []);

  if (loading) {
    return (
      <Group justify="center" pt="xl">
        <Loader color="yellow" size="sm" />
      </Group>
    );
  }
  if (!game) return null;

  return (
    <div>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&display=swap"
      />

      <div className="no-print" style={{ marginBottom: "1rem" }}>
        <Group justify="space-between">
          <Group gap="sm">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => navigate(`/admin/games/${gameId}/print`)}
            >
              ←
            </ActionIcon>
            <Text size="xl" fw={700}>
              {game.name} — The Reckoning Floor (Pebble Map)
            </Text>
          </Group>
          <Group gap="xs">
            <Button size="xs" variant="light" color="gray" onClick={reroll}>
              Reroll decoys
            </Button>
            <Button size="sm" color="yellow" onClick={() => window.print()}>
              Print
            </Button>
          </Group>
        </Group>
      </div>

      <div className="reckoning-floor-page">
        <div className="reckoning-floor-title">The Reckoning Floor</div>
        <div className="reckoning-floor-grid">
          {grid.flatMap((row, r) =>
            row.map((cell, c) => (
              <div key={`${r}-${c}`} className="reckoning-floor-cell">
                <span className="reckoning-floor-stone">🪨</span>
                <span className="reckoning-floor-digit">{cell.digit}</span>
              </div>
            )),
          )}
        </div>
      </div>

      <style>{`
        @page { size: letter portrait; margin: 0.5in; }
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; margin: 0 !important; }
          .reckoning-floor-page {
            color: #1a1a1a !important;
            margin: 0.5in auto !important;
          }
        }
        .reckoning-floor-page {
          width: 6.5in;
          margin: 0 auto;
          padding: 0;
          box-sizing: border-box;
          color: #1a1a1a;
          background: #fff;
          font-family: 'Georgia', 'Times New Roman', serif;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        .reckoning-floor-title {
          font-family: 'Cinzel', serif;
          font-size: 1.4rem;
          font-weight: 700;
          text-align: center;
          letter-spacing: 0.04em;
          margin: 0 0 0.25in 0;
          padding-top: 0.05in;
        }
        .reckoning-floor-grid {
          display: grid;
          grid-template-columns: repeat(${COLS}, 0.75in);
          grid-auto-rows: 0.75in;
          width: 7.5in;
          gap: 0;
          border-left: 1px solid #cbb;
          border-top: 1px solid #cbb;
        }
        .reckoning-floor-cell {
          border-right: 1px solid #cbb;
          border-bottom: 1px solid #cbb;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          position: relative;
          box-sizing: border-box;
        }
        .reckoning-floor-stone {
          font-size: 18px;
          line-height: 1;
        }
        .reckoning-floor-digit {
          font-family: 'Cinzel', serif;
          font-weight: 700;
          font-size: 22px;
          line-height: 1;
          color: #1a1a1a;
        }
      `}</style>
    </div>
  );
}

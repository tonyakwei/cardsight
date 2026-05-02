import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Group, Text, Loader, Button, ActionIcon } from "@mantine/core";
import { fetchGame, type GameDetail } from "../../api/admin";

const COLS = 10;
const ROWS = 12;

type BatchCell = { col: number; row: number; n: number | null };

// E (🌸 Batch A) — 8 numbered cells trace square + middle bar.
const E_CELLS: BatchCell[] = [
  { col: 1, row: 1, n: 1 }, // ML upper
  { col: 1, row: 0, n: 2 }, // TL
  { col: 5, row: 0, n: 3 }, // TR
  { col: 5, row: 2, n: 4 }, // MR lower (line 3→4 covers full upper-right edge)
  { col: 1, row: 2, n: 5 }, // ML lower (line 4→5 = horizontal middle bar)
  { col: 1, row: 4, n: 6 }, // BL
  { col: 5, row: 4, n: 7 }, // BR
  { col: 5, row: 1, n: 8 }, // MR upper (line 7→8 traces lower-right back up)
];

// B (🪻 Batch B) — 6 numbered cells trace U-shape; 1 unnumbered dot at center.
const B_CELLS: BatchCell[] = [
  { col: 1, row: 6, n: 1 },
  { col: 1, row: 8, n: 2 },
  { col: 1, row: 10, n: 3 },
  { col: 5, row: 10, n: 4 },
  { col: 5, row: 8, n: 5 },
  { col: 5, row: 6, n: 6 },
  { col: 3, row: 8, n: null }, // dot
];

// Y (🥀 Batch C) — 6 numbered cells trace ⊣ shape.
const Y_CELLS: BatchCell[] = [
  { col: 5, row: 7, n: 1 },
  { col: 7, row: 7, n: 2 },
  { col: 8, row: 7, n: 3 },
  { col: 8, row: 4, n: 4 },
  { col: 8, row: 8, n: 5 },
  { col: 8, row: 11, n: 6 },
];

const SUPER: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
};
const toSuperscript = (n: number) =>
  String(n).split("").map((d) => SUPER[d] ?? d).join("");

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
  emoji: string;
  n: number | null;
}

function buildGrid(seed: number): RenderedCell[][] {
  const rand = mulberry32(seed);
  const cells: (RenderedCell | null)[][] = Array.from({ length: ROWS }, () =>
    Array<RenderedCell | null>(COLS).fill(null),
  );
  const place = (list: BatchCell[], emoji: string) => {
    for (const c of list) {
      cells[c.row][c.col] = { emoji, n: c.n };
    }
  };
  place(E_CELLS, "🌸");
  place(B_CELLS, "🪻");
  place(Y_CELLS, "🥀");

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!cells[r][c]) {
        const emoji = rand() < 0.55 ? "🌼" : "🌺";
        // Decoy carries a meaningless red-herring superscript so it doesn't
        // visually stand out as "unnumbered."
        const n = 1 + Math.floor(rand() * 9);
        cells[r][c] = { emoji, n };
      }
    }
  }
  return cells as RenderedCell[][];
}

export function QuietBedGridPrint() {
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
              {game.name} — Powder of the Quiet Bed (Print Grid)
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

      <div className="quiet-bed-page">
        <div className="quiet-bed-title">Powder of the Quiet Bed</div>
        <div className="quiet-bed-grid">
          {grid.flatMap((row, r) =>
            row.map((cell, c) => (
              <div key={`${r}-${c}`} className="quiet-bed-cell">
                <span className="quiet-bed-emoji">{cell.emoji}</span>
                {cell.n != null && (
                  <span className="quiet-bed-num">{toSuperscript(cell.n)}</span>
                )}
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
          .quiet-bed-page {
            color: #1a1a1a !important;
            margin: 0.5in auto !important;
          }
        }
        .quiet-bed-page {
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
        .quiet-bed-title {
          font-family: 'Cinzel', serif;
          font-size: 1.4rem;
          font-weight: 700;
          text-align: center;
          letter-spacing: 0.04em;
          margin: 0 0 0.25in 0;
          padding-top: 0.05in;
        }
        .quiet-bed-grid {
          display: grid;
          grid-template-columns: repeat(${COLS}, 0.75in);
          grid-auto-rows: 0.75in;
          width: 7.5in;
          gap: 0;
          border-left: 1px solid #cbb;
          border-top: 1px solid #cbb;
        }
        .quiet-bed-cell {
          border-right: 1px solid #cbb;
          border-bottom: 1px solid #cbb;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-sizing: border-box;
        }
        .quiet-bed-emoji {
          font-size: 32px;
          line-height: 1;
        }
        .quiet-bed-num {
          position: absolute;
          top: 4px;
          right: 6px;
          font-family: 'Georgia', serif;
          font-size: 11px;
          font-weight: 700;
          color: #444;
          line-height: 1;
        }
      `}</style>
    </div>
  );
}

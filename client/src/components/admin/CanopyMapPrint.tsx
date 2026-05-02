import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Group, Text, Loader, Button, ActionIcon } from "@mantine/core";
import { fetchGame, type GameDetail } from "../../api/admin";

const COLS = 10;
const ROWS = 12;

type GlyphCell = { col: number; row: number; n: number | null };

// J (🤐 Closers) — 4 numbered cells trace the leftmost vertical stroke;
// 8 unnumbered Closer cells stand alone forming the middle and right strokes.
const J_CELLS: GlyphCell[] = [
  { col: 1, row: 1, n: 1 },
  { col: 1, row: 2, n: 2 },
  { col: 1, row: 3, n: 3 },
  { col: 1, row: 4, n: 4 },
  { col: 3, row: 1, n: null },
  { col: 3, row: 2, n: null },
  { col: 3, row: 3, n: null },
  { col: 3, row: 4, n: null },
  { col: 5, row: 1, n: null },
  { col: 5, row: 2, n: null },
  { col: 5, row: 3, n: null },
  { col: 5, row: 4, n: null },
];

// A (😮 Openers) — 7 numbered cells trace top + right + bottom of a square
// (open on the left); 1 unnumbered dot at center.
const A_CELLS: GlyphCell[] = [
  { col: 0, row: 6, n: 1 },
  { col: 2, row: 6, n: 2 },
  { col: 4, row: 6, n: 3 },
  { col: 4, row: 8, n: 4 },
  { col: 4, row: 10, n: 5 },
  { col: 2, row: 10, n: 6 },
  { col: 0, row: 10, n: 7 },
  { col: 2, row: 8, n: null },
];

// W (😤 Carriers) — 7 numbered cells trace a serif T (stem + top stroke,
// 6→7 retraces leftward across the top); 2 unnumbered serifs hang below corners.
const W_CELLS: GlyphCell[] = [
  { col: 7, row: 8, n: 1 },
  { col: 7, row: 7, n: 2 },
  { col: 7, row: 6, n: 3 },
  { col: 7, row: 5, n: 4 },
  { col: 8, row: 5, n: 5 },
  { col: 9, row: 5, n: 6 },
  { col: 5, row: 5, n: 7 },
  { col: 5, row: 6, n: null },
  { col: 9, row: 6, n: null },
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
  const place = (list: GlyphCell[], emoji: string) => {
    for (const c of list) {
      cells[c.row][c.col] = { emoji, n: c.n };
    }
  };
  place(J_CELLS, "🤐");
  place(A_CELLS, "😮");
  place(W_CELLS, "😤");

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!cells[r][c]) {
        // Decoys are mouth-neutral faces that don't read as any of the three
        // articulation classes (closed / parted / breath).
        const emoji = rand() < 0.55 ? "😶" : "🫥";
        const n = 1 + Math.floor(rand() * 9);
        cells[r][c] = { emoji, n };
      }
    }
  }
  return cells as RenderedCell[][];
}

export function CanopyMapPrint() {
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
              {game.name} — Hanging Garden Canopy Map (Print Grid)
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

      <div className="canopy-map-page">
        <div className="canopy-map-title">The Hanging Garden of Names</div>
        <div className="canopy-map-grid">
          {grid.flatMap((row, r) =>
            row.map((cell, c) => (
              <div key={`${r}-${c}`} className="canopy-map-cell">
                <span className="canopy-map-emoji">{cell.emoji}</span>
                {cell.n != null && (
                  <span className="canopy-map-num">{toSuperscript(cell.n)}</span>
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
          .canopy-map-page {
            color: #1a1a1a !important;
            margin: 0.5in auto !important;
          }
        }
        .canopy-map-page {
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
        .canopy-map-title {
          font-family: 'Cinzel', serif;
          font-size: 1.4rem;
          font-weight: 700;
          text-align: center;
          letter-spacing: 0.04em;
          margin: 0 0 0.25in 0;
          padding-top: 0.05in;
        }
        .canopy-map-grid {
          display: grid;
          grid-template-columns: repeat(${COLS}, 0.75in);
          grid-auto-rows: 0.75in;
          width: 7.5in;
          gap: 0;
          border-left: 1px solid #cbb;
          border-top: 1px solid #cbb;
        }
        .canopy-map-cell {
          border-right: 1px solid #cbb;
          border-bottom: 1px solid #cbb;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-sizing: border-box;
        }
        .canopy-map-emoji {
          font-size: 32px;
          line-height: 1;
        }
        .canopy-map-num {
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

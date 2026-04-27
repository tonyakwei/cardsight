import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Group,
  Text,
  Loader,
  Button,
  ActionIcon,
} from "@mantine/core";
import { fetchGame, type GameDetail } from "../../api/admin";

const GOOGLE_FONTS =
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap";

// Scrambled order — players shouldn't be able to deduce which glyph is which
// from position alone. Numerals are excluded: digits stay legible as digits.
const SCRAMBLED_LETTERS = [
  "T", "K", "R", "A", "M", "S", "J",
  "X", "V", "B", "F", "U", "P", "E",
  "Y", "H", "L", "Z", "D", "C", "O",
  "N", "W", "I", "Q", "G",
];

const PARCHMENT = "#f4ead2";
const INK = "#1a1a1a";
const BORDER = "rgba(94, 77, 47, 0.4)";
const BORDER_STRONG = "rgba(94, 77, 47, 0.55)";
const ACCENT = "#5e4d2f";

export function GlyphCodexPrint() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    setGame(await fetchGame(gameId));
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

      {/* Controls — hidden on print */}
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
              {game.name} — Glyph Codex
            </Text>
          </Group>
          <Button size="sm" color="yellow" onClick={() => window.print()}>
            Print
          </Button>
        </Group>

        <Text size="sm" c="dimmed" mb="md">
          Player-facing translation log — one per table. Glyphs appear in a
          scrambled order with blank spaces beneath each. Players fill in the
          English letter as they discover the mapping from rosetta cards in
          the temple.
        </Text>
      </div>

      {/* Printable sheet */}
      <div className="codex-page">
        <div className="codex-header">
          <h1 className="codex-title">QRian Glyph &rarr; English Translation Codex</h1>
        </div>

        <p className="codex-preamble">
          As you uncover translated QRian glyphs through your adventures, you can record your findings…
        </p>

        <div className="codex-grid">
          {SCRAMBLED_LETTERS.map((letter) => (
            <div className="codex-pair" key={letter}>
              <span className="codex-glyph">{letter}</span>
              <span className="codex-blank" />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          @page { size: letter portrait; margin: 0.5in; }
          .codex-page { box-shadow: none !important; margin: 0 !important; }
        }

        .codex-page {
          max-width: 8.5in;
          margin: 0 auto;
          padding: 36px 44px;
          background: ${PARCHMENT};
          color: ${INK};
          font-family: 'Crimson Text', Georgia, serif;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .codex-header {
          text-align: center;
          border-bottom: 1px solid ${BORDER};
          padding-bottom: 14px;
          margin-bottom: 22px;
        }

        .codex-title {
          font-family: 'Cinzel', serif;
          font-weight: 700;
          font-size: 24px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: ${ACCENT};
          margin: 0;
        }

        .codex-preamble {
          font-style: italic;
          font-size: 13.5px;
          line-height: 1.5;
          margin-bottom: 22px;
          color: ${ACCENT};
          text-align: center;
        }

        .codex-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 12px 14px;
        }

        .codex-pair {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 4px 8px;
          border: 1px solid ${BORDER};
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.25);
          min-height: 90px;
        }

        .codex-glyph {
          font-family: 'Qrian', serif;
          font-size: 40px;
          line-height: 1;
          color: ${INK};
          letter-spacing: 0;
          user-select: none;
          -webkit-user-select: none;
        }

        .codex-blank {
          display: block;
          width: 42px;
          height: 22px;
          border-bottom: 1.5px solid ${BORDER_STRONG};
          margin-top: 14px;
        }
      `}</style>
    </div>
  );
}

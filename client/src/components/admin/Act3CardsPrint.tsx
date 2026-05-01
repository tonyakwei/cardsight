import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Group,
  Text,
  Loader,
  Button,
  ActionIcon,
  SegmentedControl,
} from "@mantine/core";
import Markdown from "react-markdown";
import {
  fetchGame,
  fetchCards,
  type GameDetail,
  type AdminCard,
} from "../../api/admin";

const GOOGLE_FONTS =
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap";

type HouseTheme = "drake" | "jones" | "croft" | "neutral";
type CardTheme = HouseTheme | "twilight";

function houseThemeFromCard(card: AdminCard): HouseTheme {
  const name = card.cardHouses[0]?.house?.name?.toLowerCase() ?? "";
  if (name.includes("drake")) return "drake";
  if (name.includes("jones")) return "jones";
  if (name.includes("croft")) return "croft";
  return "neutral";
}

function houseLabelFromCard(card: AdminCard): string {
  return card.cardHouses[0]?.house?.name ?? "—";
}

function houseInitial(theme: CardTheme): string {
  if (theme === "drake") return "D";
  if (theme === "jones") return "J";
  if (theme === "croft") return "C";
  return "·";
}

/**
 * History card descriptions begin with an italic dateline, e.g.
 *   *2 Seasons After The Source · From the first year of the valley schools*
 *   <blank line>
 *   <body...>
 * Split that into { dateline, body } so we can style the dateline distinctly.
 */
function splitHistoryDescription(desc: string | null): {
  dateline: string | null;
  body: string;
} {
  if (!desc) return { dateline: null, body: "" };
  const lines = desc.split("\n");
  const first = (lines[0] ?? "").trim();
  const isItalic =
    first.startsWith("*") && first.endsWith("*") && !first.startsWith("**");
  if (!isItalic) return { dateline: null, body: desc };
  const dateline = first.slice(1, -1).trim();
  const body = lines.slice(1).join("\n").trim();
  return { dateline, body };
}

type CardKind = "history" | "clause";

interface PreparedCard {
  id: string;
  kind: CardKind;
  theme: CardTheme;
  houseLabel: string;
  header: string;
  description: string;
  /** History cards: 1..12 timeline order. */
  order: number | null;
}

function prepareCards(cards: AdminCard[]): PreparedCard[] {
  const history: PreparedCard[] = cards
    .filter((c) => c.subtype === "history")
    .map((c) => ({
      id: c.id,
      kind: "history" as const,
      theme: "twilight" as const,
      houseLabel: houseLabelFromCard(c),
      header: c.header ?? "Untitled History",
      description: c.description ?? "",
      order: c.historyTimelineOrder ?? null,
    }))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  const clauses: PreparedCard[] = cards
    .filter(
      (c) =>
        c.subtype === "reference" &&
        (c.notes ?? "").toLowerCase().includes("clause"),
    )
    .map((c) => ({
      id: c.id,
      kind: "clause" as const,
      theme: houseThemeFromCard(c),
      houseLabel: houseLabelFromCard(c),
      header: c.header ?? "Untitled Clause",
      description: c.description ?? "",
      order: null,
    }))
    .sort((a, b) => {
      if (a.theme !== b.theme) return a.theme.localeCompare(b.theme);
      return a.header.localeCompare(b.header);
    });

  return [...history, ...clauses];
}

function HistoryFace({ card }: { card: PreparedCard }) {
  const { dateline, body } = splitHistoryDescription(card.description);
  return (
    <div className="card-face history">
      <div className="bg-fx" />
      <div className="bg-mark" />
      <div className="vignette" />

      <header className="card-head">
        <span className="kicker">Twisting Tales · Act III · History</span>
      </header>

      {dateline && (
        <div className="dateline-block">
          <div className="dateline">{dateline}</div>
          <div className="dateline-rule" />
        </div>
      )}

      <h2 className="title history-title">{card.header}</h2>

      <div className="body history-body">
        <Markdown
          components={{
            p: ({ children }) => <p>{children}</p>,
            blockquote: ({ children }) => <blockquote>{children}</blockquote>,
            em: ({ children }) => <em>{children}</em>,
            strong: ({ children }) => <strong>{children}</strong>,
          }}
        >
          {body}
        </Markdown>
      </div>
    </div>
  );
}

function ClauseFace({ card }: { card: PreparedCard }) {
  return (
    <div className="card-face clause">
      <div className="bg-fx" />
      <div className="bg-mark" />
      <div className="vignette" />

      <header className="card-head">
        <span className="kicker">Twisting Tales · Act III · Settlement Clause</span>
      </header>

      <h2 className="title clause-title">{card.header}</h2>

      <div className="rule">
        <span className="line" />
        <span className="rule-glyph">§</span>
        <span className="line" />
      </div>

      <div className="body clause-body">
        <Markdown>{card.description}</Markdown>
      </div>

      <footer className="card-foot">
        <span className="house-mark" aria-label={card.houseLabel}>
          {houseInitial(card.theme)}
        </span>
        <span className="house-label">Proposed by {card.houseLabel}</span>
      </footer>
    </div>
  );
}

function CardSlot({ card }: { card: PreparedCard | null }) {
  if (!card) return <div className="card-slot empty" aria-hidden="true" />;
  return (
    <div className={`card-slot theme-${card.theme}`}>
      {card.kind === "history" ? (
        <HistoryFace card={card} />
      ) : (
        <ClauseFace card={card} />
      )}
    </div>
  );
}

type Filter = "all" | "history" | "clause";

export function Act3CardsPrint() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [cards, setCards] = useState<AdminCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const loadData = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    const [g, c] = await Promise.all([
      fetchGame(gameId),
      fetchCards(gameId, { act: 3 }),
    ]);
    setGame(g);
    setCards(c);
    setLoading(false);
  }, [gameId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const prepared = useMemo(() => prepareCards(cards), [cards]);

  const filtered = useMemo(() => {
    if (filter === "all") return prepared;
    return prepared.filter((c) => c.kind === filter);
  }, [prepared, filter]);

  // Chunk into pages of 3 (3-up landscape letter).
  const pages = useMemo(() => {
    const out: (PreparedCard | null)[][] = [];
    for (let i = 0; i < filtered.length; i += 3) {
      const page: (PreparedCard | null)[] = [
        filtered[i] ?? null,
        filtered[i + 1] ?? null,
        filtered[i + 2] ?? null,
      ];
      out.push(page);
    }
    return out;
  }, [filtered]);

  if (loading && !game) {
    return (
      <Group justify="center" pt="xl">
        <Loader color="yellow" size="sm" />
      </Group>
    );
  }
  if (!game) return null;

  const historyCount = prepared.filter((c) => c.kind === "history").length;
  const clauseCount = prepared.filter((c) => c.kind === "clause").length;

  return (
    <div>
      <link rel="stylesheet" href={GOOGLE_FONTS} />

      <div className="no-print" style={{ marginBottom: "1.25rem" }}>
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
              {game.name} — Act 3 Cards
            </Text>
          </Group>
          <Group gap="sm">
            <SegmentedControl
              size="xs"
              value={filter}
              onChange={(v) => setFilter(v as Filter)}
              data={[
                { label: `All (${historyCount + clauseCount})`, value: "all" },
                { label: `History (${historyCount})`, value: "history" },
                { label: `Clauses (${clauseCount})`, value: "clause" },
              ]}
            />
            <Button size="sm" color="yellow" onClick={() => window.print()}>
              Print
            </Button>
          </Group>
        </Group>

        <Text size="sm" c="dimmed" mb="md">
          3×5″ portrait cards, 3-up on letter landscape. Print on cardstock and cut along the
          marks. House theming: Drake (oxblood), Jones (gold), Croft (violet). Each card carries
          its narrative content directly — affix a programmable NFC tag on the back if you want
          it to participate in scan-based mechanics (history timeline verification, clause
          analytics).
        </Text>
      </div>

      {pages.map((page, pageIdx) => (
        <section className="page" key={pageIdx}>
          {page.map((card, slotIdx) => (
            <CardSlot key={`${pageIdx}-${slotIdx}`} card={card} />
          ))}
          {/* Cut marks at card corners */}
          <div className="cut-marks" aria-hidden="true">
            {[0, 1, 2].map((col) => (
              <div key={col} className={`marks col-${col}`}>
                <span className="m tl" />
                <span className="m tr" />
                <span className="m bl" />
                <span className="m br" />
              </div>
            ))}
          </div>
        </section>
      ))}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          @page { size: letter landscape; margin: 0; }
          .page { box-shadow: none !important; margin: 0 !important; }
        }

        @media screen {
          .page {
            margin: 0 auto 0.5in;
            box-shadow: 0 6px 28px rgba(0, 0, 0, 0.45);
            background: #1b1410;
          }
        }

        /* ============ Page (letter landscape, 3-up) ============ */

        .page {
          position: relative;
          width: 11in;
          height: 8.5in;
          padding: 1.75in 0.75in;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.25in;
          page-break-after: always;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
          box-sizing: border-box;
        }
        .page:last-child { page-break-after: auto; }

        .card-slot {
          width: 3in;
          height: 5in;
          position: relative;
          flex: 0 0 auto;
        }
        .card-slot.empty { visibility: hidden; }

        /* ============ Cut marks ============ */

        .cut-marks {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .cut-marks .marks {
          position: absolute;
          width: 3in;
          height: 5in;
          top: 1.75in;
        }
        .cut-marks .col-0 { left: 0.75in; }
        .cut-marks .col-1 { left: 4in; }
        .cut-marks .col-2 { left: 7.25in; }
        .cut-marks .m {
          position: absolute;
          width: 0.18in;
          height: 0.18in;
          border-color: rgba(120, 120, 120, 0.55);
        }
        .cut-marks .m.tl {
          top: -0.09in; left: -0.09in;
          border-top: 0.5pt solid; border-left: 0.5pt solid;
        }
        .cut-marks .m.tr {
          top: -0.09in; right: -0.09in;
          border-top: 0.5pt solid; border-right: 0.5pt solid;
        }
        .cut-marks .m.bl {
          bottom: -0.09in; left: -0.09in;
          border-bottom: 0.5pt solid; border-left: 0.5pt solid;
        }
        .cut-marks .m.br {
          bottom: -0.09in; right: -0.09in;
          border-bottom: 0.5pt solid; border-right: 0.5pt solid;
        }

        /* ============ Card face (shared) ============ */

        .card-face {
          position: relative;
          width: 100%;
          height: 100%;
          padding: 0.22in 0.22in 0.2in;
          overflow: hidden;
          font-family: 'Cormorant Garamond', 'Georgia', serif;
          display: flex;
          flex-direction: column;
          color: var(--text);
          background: var(--bg);
          border-radius: 0.08in;
          box-sizing: border-box;
        }

        .card-face .bg-fx,
        .card-face .bg-mark,
        .card-face .vignette {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }
        .card-face .vignette { z-index: 2; }
        .card-face > header,
        .card-face > .title,
        .card-face > .dateline-block,
        .card-face > .body,
        .card-face > .rule,
        .card-face > footer { position: relative; z-index: 3; }

        .card-face .card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.1in;
          margin-bottom: 0.06in;
        }
        .card-face .kicker {
          font-family: 'Cinzel', serif;
          font-weight: 600;
          font-size: 5.4pt;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: var(--accent);
          opacity: 0.85;
        }

        .card-face .title {
          font-family: 'Cinzel', serif;
          color: var(--title);
          margin: 0.04in 0 0.06in;
          letter-spacing: 0.01em;
        }
        .card-face .history-title {
          font-weight: 700;
          font-size: 14.5pt;
          line-height: 1.1;
          text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
        }
        .card-face .clause-title {
          font-weight: 800;
          font-size: 16pt;
          line-height: 1.05;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          text-align: center;
          margin-top: 0.08in;
          text-shadow: 0 1px 0 rgba(0, 0, 0, 0.45);
        }

        .card-face .dateline-block {
          margin: 0.04in 0 0.06in;
        }
        .card-face .dateline {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 8.2pt;
          line-height: 1.3;
          color: var(--accent);
          opacity: 0.92;
        }
        .card-face .dateline-rule {
          height: 0.5pt;
          background: linear-gradient(to right, transparent, var(--accent) 15%, var(--accent) 85%, transparent);
          opacity: 0.6;
          margin-top: 0.05in;
        }

        .card-face .rule {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.08in;
          margin: 0.06in auto 0.08in;
          width: 80%;
          color: var(--accent);
          opacity: 0.7;
          font-family: 'Cinzel', serif;
          font-size: 9pt;
          font-weight: 600;
        }
        .card-face .rule .line {
          flex: 1;
          height: 0.5pt;
          background: linear-gradient(to right, transparent, currentColor 30%, currentColor 70%, transparent);
        }

        .card-face .body {
          flex: 1 1 auto;
          overflow: hidden;
        }
        .card-face .body p {
          margin: 0 0 0.06in;
          color: var(--text);
        }
        .card-face .body p:last-child { margin-bottom: 0; }
        .card-face .body em {
          font-style: italic;
          color: var(--accent);
        }
        .card-face .body strong {
          font-weight: 700;
          color: var(--title);
        }
        .card-face .body blockquote {
          margin: 0.08in 0;
          padding-left: 0.12in;
          border-left: 0.5pt solid var(--accent);
          color: var(--text);
          opacity: 0.95;
        }

        .card-face .history-body p {
          font-size: 16.8pt;
          line-height: 1.18;
        }
        .card-face .history-body blockquote { font-style: italic; }
        .card-face .history-body blockquote p { font-size: 16pt; }

        .card-face .clause-body p {
          text-align: center;
          font-size: 27.6pt;
          line-height: 1.18;
        }
        .card-face .clause-body blockquote p { font-size: 24pt; }

        .card-face .card-foot {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 0.08in;
          padding-top: 0.1in;
          border-top: 0.5pt solid var(--accent);
          opacity: 0.85;
        }
        .card-face .house-mark {
          font-family: 'Cinzel', serif;
          font-weight: 700;
          font-size: 8pt;
          width: 0.18in;
          height: 0.18in;
          border-radius: 999px;
          border: 0.5pt solid var(--accent);
          color: var(--accent);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        .card-face .house-label {
          font-family: 'Cinzel', serif;
          font-weight: 600;
          font-size: 5.6pt;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--accent);
        }

        /* =========================================================
           DRAKE — oxblood, ember sparks, scorched starburst
           ========================================================= */

        .theme-drake .card-face {
          --bg: radial-gradient(ellipse at 50% 38%, #5a1410 0%, #2a0907 60%, #0e0302 100%);
          --text: #f3d5b5;
          --title: #ffb074;
          --accent: #ff8a4a;
          --badge-bg: rgba(50, 12, 8, 0.65);
        }
        .theme-drake .card-face {
          border: 0.7pt solid rgba(255, 110, 40, 0.45);
        }
        .theme-drake .card-face .bg-fx {
          opacity: 0.7;
          background-image:
            radial-gradient(1.6px 1.6px at 12% 12%, rgba(255, 150, 70, 0.85) 50%, transparent 100%),
            radial-gradient(1px 1px at 28% 26%, rgba(255, 110, 40, 0.7) 50%, transparent 100%),
            radial-gradient(1.8px 1.8px at 48% 8%, rgba(255, 130, 50, 0.85) 50%, transparent 100%),
            radial-gradient(1.2px 1.2px at 70% 22%, rgba(255, 100, 35, 0.7) 50%, transparent 100%),
            radial-gradient(1.4px 1.4px at 88% 14%, rgba(255, 140, 60, 0.8) 50%, transparent 100%),
            radial-gradient(1.6px 1.6px at 8% 56%, rgba(255, 130, 50, 0.8) 50%, transparent 100%),
            radial-gradient(1px 1px at 32% 78%, rgba(255, 110, 40, 0.7) 50%, transparent 100%),
            radial-gradient(1.4px 1.4px at 72% 86%, rgba(255, 130, 50, 0.8) 50%, transparent 100%),
            radial-gradient(1.2px 1.2px at 92% 70%, rgba(255, 100, 35, 0.7) 50%, transparent 100%),
            radial-gradient(1.6px 1.6px at 50% 96%, rgba(255, 140, 60, 0.8) 50%, transparent 100%);
        }
        .theme-drake .card-face .bg-mark {
          background:
            repeating-conic-gradient(
              from 0deg at 50% 50%,
              rgba(255, 90, 30, 0.05) 0deg,
              rgba(255, 90, 30, 0.05) 2.5deg,
              transparent 2.5deg,
              transparent 11deg
            );
          mask-image: radial-gradient(circle at 50% 50%, #000 0in, #000 0.9in, transparent 1.7in);
          -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 0in, #000 0.9in, transparent 1.7in);
        }
        .theme-drake .card-face .vignette {
          background: radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.55) 100%);
        }

        /* =========================================================
           JONES — gold, dust motes, scholar's light
           ========================================================= */

        .theme-jones .card-face {
          --bg: radial-gradient(ellipse at 50% 30%, #5a3e0f 0%, #2c1f06 60%, #0e0904 100%);
          --text: #fbeed0;
          --title: #ffd56a;
          --accent: #f0b73a;
          --badge-bg: rgba(40, 26, 6, 0.7);
        }
        .theme-jones .card-face {
          border: 0.7pt solid rgba(202, 138, 4, 0.5);
        }
        .theme-jones .card-face .bg-fx {
          background:
            repeating-conic-gradient(
              from -90deg at 50% 28%,
              rgba(255, 220, 130, 0.08) 0deg,
              rgba(255, 220, 130, 0.08) 2.5deg,
              transparent 2.5deg,
              transparent 13deg
            );
          mask-image: radial-gradient(ellipse at 50% 28%, #000 0in, #000 0.7in, transparent 3in);
          -webkit-mask-image: radial-gradient(ellipse at 50% 28%, #000 0in, #000 0.7in, transparent 3in);
          opacity: 0.85;
        }
        .theme-jones .card-face .bg-mark {
          background-image:
            radial-gradient(0.9px 0.9px at 14% 26%, rgba(255, 215, 130, 0.55) 50%, transparent 100%),
            radial-gradient(0.7px 0.7px at 28% 48%, rgba(255, 215, 130, 0.45) 50%, transparent 100%),
            radial-gradient(1.1px 1.1px at 56% 36%, rgba(255, 215, 130, 0.55) 50%, transparent 100%),
            radial-gradient(0.7px 0.7px at 72% 60%, rgba(255, 215, 130, 0.45) 50%, transparent 100%),
            radial-gradient(0.9px 0.9px at 86% 30%, rgba(255, 215, 130, 0.55) 50%, transparent 100%),
            radial-gradient(0.7px 0.7px at 18% 78%, rgba(255, 215, 130, 0.45) 50%, transparent 100%),
            radial-gradient(0.9px 0.9px at 88% 80%, rgba(255, 215, 130, 0.55) 50%, transparent 100%),
            radial-gradient(0.7px 0.7px at 44% 84%, rgba(255, 215, 130, 0.45) 50%, transparent 100%);
          opacity: 0.5;
        }
        .theme-jones .card-face .vignette {
          background: radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.6) 100%);
        }

        /* =========================================================
           CROFT — violet, cold concentric rings, faint sigil
           ========================================================= */

        .theme-croft .card-face {
          --bg: radial-gradient(ellipse at 50% 38%, #321558 0%, #1b0a35 60%, #080214 100%);
          --text: #ece0fc;
          --title: #d6bdff;
          --accent: #b89dff;
          --badge-bg: rgba(28, 12, 56, 0.7);
        }
        .theme-croft .card-face {
          border: 0.7pt solid rgba(124, 58, 237, 0.5);
        }
        .theme-croft .card-face .bg-fx {
          background:
            radial-gradient(circle at 50% 50%, transparent 0.7in, rgba(184, 157, 255, 0.10) 0.71in, transparent 0.74in),
            radial-gradient(circle at 50% 50%, transparent 1.05in, rgba(184, 157, 255, 0.085) 1.06in, transparent 1.09in),
            radial-gradient(circle at 50% 50%, transparent 1.45in, rgba(184, 157, 255, 0.07) 1.46in, transparent 1.49in),
            radial-gradient(circle at 50% 50%, transparent 1.9in, rgba(184, 157, 255, 0.06) 1.91in, transparent 1.94in);
          opacity: 0.9;
        }
        .theme-croft .card-face .bg-mark {
          background-image:
            radial-gradient(circle at 50% 50%, rgba(184, 157, 255, 0.07) 0%, rgba(184, 157, 255, 0.07) 0.16in, transparent 0.17in),
            radial-gradient(circle at 50% 50%, transparent 0.26in, rgba(184, 157, 255, 0.08) 0.27in, rgba(184, 157, 255, 0.08) 0.29in, transparent 0.3in);
        }
        .theme-croft .card-face .vignette {
          background: radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.55) 100%);
        }

        /* =========================================================
           TWILIGHT — unified history palette (deep purple, gold)
           ========================================================= */

        .theme-twilight .card-face {
          --bg: linear-gradient(180deg, #1a1432 0%, #0d0a1f 60%, #050309 100%);
          --text: #e0d4f0;
          --title: #f1d99c;
          --accent: #d4a85f;
          --badge-bg: rgba(13, 10, 31, 0.7);
        }
        .theme-twilight .card-face {
          border: 0.7pt solid rgba(212, 168, 95, 0.35);
        }
        .theme-twilight .card-face .bg-fx {
          background-image:
            radial-gradient(0.8px 0.8px at 12% 18%, rgba(220, 200, 240, 0.45) 50%, transparent 100%),
            radial-gradient(0.6px 0.6px at 28% 32%, rgba(220, 200, 240, 0.35) 50%, transparent 100%),
            radial-gradient(0.9px 0.9px at 48% 14%, rgba(220, 200, 240, 0.45) 50%, transparent 100%),
            radial-gradient(0.6px 0.6px at 70% 26%, rgba(220, 200, 240, 0.35) 50%, transparent 100%),
            radial-gradient(0.8px 0.8px at 88% 18%, rgba(220, 200, 240, 0.4) 50%, transparent 100%),
            radial-gradient(0.7px 0.7px at 14% 60%, rgba(220, 200, 240, 0.35) 50%, transparent 100%),
            radial-gradient(0.9px 0.9px at 38% 78%, rgba(220, 200, 240, 0.4) 50%, transparent 100%),
            radial-gradient(0.6px 0.6px at 64% 86%, rgba(220, 200, 240, 0.3) 50%, transparent 100%),
            radial-gradient(0.8px 0.8px at 86% 70%, rgba(220, 200, 240, 0.4) 50%, transparent 100%),
            radial-gradient(0.7px 0.7px at 50% 94%, rgba(220, 200, 240, 0.35) 50%, transparent 100%);
          opacity: 0.75;
        }
        .theme-twilight .card-face .bg-mark {
          background:
            radial-gradient(circle at 50% 50%, transparent 1in, rgba(212, 168, 95, 0.045) 1.01in, transparent 1.05in),
            radial-gradient(circle at 50% 50%, transparent 1.45in, rgba(212, 168, 95, 0.035) 1.46in, transparent 1.5in);
          opacity: 0.85;
        }
        .theme-twilight .card-face .vignette {
          background: radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.55) 100%);
        }

        /* =========================================================
           NEUTRAL fallback (uncategorized cards)
           ========================================================= */

        .theme-neutral .card-face {
          --bg: radial-gradient(ellipse at 50% 38%, #2a2a2e 0%, #141417 60%, #060608 100%);
          --text: #d8d8de;
          --title: #f0f0f4;
          --accent: #aab0bd;
          --badge-bg: rgba(20, 20, 24, 0.75);
        }
        .theme-neutral .card-face {
          border: 0.7pt solid rgba(170, 176, 189, 0.4);
        }
      `}</style>
    </div>
  );
}

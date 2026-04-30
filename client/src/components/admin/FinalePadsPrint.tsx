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
import {
  FINALE_OUTCOMES,
  type FinaleOutcomeDefinition,
  type FinaleOutcomeId,
} from "../../../../shared/finale";

const GOOGLE_FONTS =
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap";

type PadTheme = "destroy" | "recontain" | "open";

const PAD_THEMES: Record<FinaleOutcomeId, PadTheme> = {
  destroy_source: "destroy",
  recontain_source: "recontain",
  open_for_research: "open",
};

function Pad({ outcome, theme }: { outcome: FinaleOutcomeDefinition; theme: PadTheme }) {
  return (
    <div className={`pad pad-${theme}`}>
      <div className="bg-fx" />
      <div className="bg-mark" />
      <div className="vignette" />

      <span className="corner tl">Q</span>
      <span className="corner tr">T</span>
      <span className="corner bl">M</span>
      <span className="corner br">R</span>

      <div className="title-block">
        <div className="kicker">The Reckoning · Major Outcome</div>
        <h1 className="title">{outcome.label}</h1>
        <div className="rule">
          <span className="line" />
          <span className="rule-glyph">I</span>
          <span className="line" />
        </div>
      </div>

      <div className="stack">
        <div className="card card-back-3" />
        <div className="card card-back-2" />
        <div className="card card-back-1" />
        <div className="card card-front">
          <span className="stack-label">Place cards here</span>
        </div>
      </div>

      <p className="tagline">{outcome.description}</p>
    </div>
  );
}

export function FinalePadsPrint() {
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
              {game.name} — Finale Pads
            </Text>
          </Group>
          <Button size="sm" color="yellow" onClick={() => window.print()}>
            Print
          </Button>
        </Group>

        <Text size="sm" c="dimmed" mb="md">
          Three letter-portrait pads — one per major outcome. Lay them on the table during the
          Reckoning; players place cards on the pad they're advocating for and move them as the
          room argues.
        </Text>
      </div>

      <div className="pad-sheet">
        {FINALE_OUTCOMES.map((outcome) => (
          <Pad
            key={outcome.id}
            outcome={outcome}
            theme={PAD_THEMES[outcome.id]}
          />
        ))}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          @page { size: letter portrait; margin: 0; }
          .pad-sheet { box-shadow: none !important; margin: 0 !important; }
          .pad { box-shadow: none !important; }
        }

        @media screen {
          .pad-sheet {
            padding: 0.4in 0;
            margin: 0 auto;
          }
          .pad {
            margin: 0 auto 0.4in;
            box-shadow: 0 6px 28px rgba(0, 0, 0, 0.55);
          }
        }

        .pad-sheet {
          width: 8.5in;
          margin: 0 auto;
        }

        .pad {
          position: relative;
          width: 8.5in;
          height: 11in;
          padding: 0.7in 0.7in 0.85in;
          overflow: hidden;
          page-break-after: always;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: 'Cormorant Garamond', 'Georgia', serif;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        .pad:last-child { page-break-after: auto; }

        .pad > .title-block,
        .pad > .stack,
        .pad > .tagline,
        .pad > .corner { position: relative; z-index: 3; }

        .pad .bg-fx,
        .pad .bg-mark,
        .pad .vignette {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }
        .pad .vignette { z-index: 2; }

        /* ============ Shared title / corners / stack ============ */

        .pad .title-block {
          text-align: center;
          margin-top: 0.1in;
        }

        .pad .kicker {
          font-family: 'Cinzel', serif;
          font-weight: 600;
          font-size: 12.5px;
          letter-spacing: 0.42em;
          text-transform: uppercase;
          opacity: 0.75;
          margin-bottom: 14px;
        }

        .pad .title {
          font-family: 'Cinzel', serif;
          font-weight: 900;
          font-size: 56px;
          line-height: 1.05;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin: 0;
        }

        .pad .rule {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin: 18px auto 0;
          width: 4.6in;
          font-family: 'Qrian', serif;
          font-size: 22px;
          opacity: 0.75;
        }
        .pad .rule .line {
          flex: 1;
          height: 1px;
        }

        .pad .corner {
          position: absolute;
          font-family: 'Qrian', serif;
          font-size: 36px;
          opacity: 0.42;
          user-select: none;
          letter-spacing: 0;
          line-height: 1;
        }
        .pad .corner.tl { top: 0.34in; left: 0.42in; }
        .pad .corner.tr { top: 0.34in; right: 0.42in; }
        .pad .corner.bl { bottom: 0.42in; left: 0.42in; }
        .pad .corner.br { bottom: 0.42in; right: 0.42in; }

        .pad .stack {
          position: relative;
          width: 3.5in;
          height: 5.75in;
          margin: 0.55in 0 0.45in;
          flex: 0 0 auto;
        }

        .pad .stack .card {
          position: absolute;
          inset: 0;
          border-radius: 0.18in;
          border: 2px dashed currentColor;
        }
        .pad .stack .card-back-3 {
          transform: rotate(-5deg) translate(-0.22in, 0.18in);
          opacity: 0.18;
        }
        .pad .stack .card-back-2 {
          transform: rotate(-2.5deg) translate(-0.10in, 0.10in);
          opacity: 0.32;
        }
        .pad .stack .card-back-1 {
          transform: rotate(2deg) translate(0.10in, 0.05in);
          opacity: 0.55;
        }
        .pad .stack .card-front {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.04);
        }

        .pad .stack-label {
          font-family: 'Cinzel', serif;
          font-weight: 600;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          font-size: 13px;
          opacity: 0.7;
        }

        .pad .tagline {
          margin: auto 0 0;
          text-align: center;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 19px;
          line-height: 1.5;
          max-width: 6.2in;
          opacity: 0.92;
        }

        /* ===================================================== */
        /* DESTROY THE SOURCE — scorched, embers, oxblood        */
        /* ===================================================== */

        .pad-destroy {
          background:
            radial-gradient(ellipse at 50% 38%, #5a1410 0%, #220707 55%, #0a0202 100%);
          color: #f3d5b5;
        }
        .pad-destroy .kicker { color: #ff8a4a; }
        .pad-destroy .title {
          color: #ffb074;
          text-shadow:
            0 0 18px rgba(255, 110, 40, 0.55),
            0 0 4px rgba(255, 90, 30, 0.7),
            0 2px 0 rgba(0, 0, 0, 0.55);
        }
        .pad-destroy .rule { color: #c0421b; }
        .pad-destroy .rule .line {
          background: linear-gradient(to right, transparent, #c0421b 40%, #c0421b 60%, transparent);
        }
        .pad-destroy .corner { color: #c0421b; }
        .pad-destroy .stack .card { color: #ff8a4a; }
        .pad-destroy .stack-label { color: #ffc090; }
        .pad-destroy .tagline { color: #f0c8a8; }

        /* embers + sparks */
        .pad-destroy .bg-fx {
          opacity: 0.7;
          background-image:
            radial-gradient(2.4px 2.4px at 8% 14%, rgba(255, 150, 70, 0.85) 50%, transparent 100%),
            radial-gradient(1.6px 1.6px at 22% 30%, rgba(255, 110, 40, 0.7) 50%, transparent 100%),
            radial-gradient(2.8px 2.8px at 38% 8%, rgba(255, 130, 50, 0.85) 50%, transparent 100%),
            radial-gradient(1.4px 1.4px at 56% 22%, rgba(255, 100, 35, 0.65) 50%, transparent 100%),
            radial-gradient(2.2px 2.2px at 78% 12%, rgba(255, 140, 60, 0.8) 50%, transparent 100%),
            radial-gradient(1.8px 1.8px at 92% 28%, rgba(255, 110, 40, 0.7) 50%, transparent 100%),
            radial-gradient(2.6px 2.6px at 12% 52%, rgba(255, 130, 50, 0.8) 50%, transparent 100%),
            radial-gradient(1.4px 1.4px at 86% 60%, rgba(255, 100, 35, 0.65) 50%, transparent 100%),
            radial-gradient(2.2px 2.2px at 6% 78%, rgba(255, 140, 60, 0.8) 50%, transparent 100%),
            radial-gradient(1.8px 1.8px at 30% 88%, rgba(255, 110, 40, 0.7) 50%, transparent 100%),
            radial-gradient(2.6px 2.6px at 56% 94%, rgba(255, 130, 50, 0.8) 50%, transparent 100%),
            radial-gradient(1.4px 1.4px at 78% 86%, rgba(255, 100, 35, 0.65) 50%, transparent 100%),
            radial-gradient(2.4px 2.4px at 94% 78%, rgba(255, 140, 60, 0.8) 50%, transparent 100%),
            radial-gradient(1.6px 1.6px at 48% 50%, rgba(255, 100, 35, 0.55) 50%, transparent 100%);
        }

        /* faint scorched starburst behind the stack */
        .pad-destroy .bg-mark {
          background:
            repeating-conic-gradient(
              from 0deg at 50% 50%,
              rgba(255, 90, 30, 0.06) 0deg,
              rgba(255, 90, 30, 0.06) 3deg,
              transparent 3deg,
              transparent 12deg
            );
          mask-image: radial-gradient(circle at 50% 50%, #000 0in, #000 2.6in, transparent 4.2in);
          -webkit-mask-image: radial-gradient(circle at 50% 50%, #000 0in, #000 2.6in, transparent 4.2in);
        }

        .pad-destroy .vignette {
          background: radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.55) 100%);
        }

        /* ===================================================== */
        /* RECONTAIN THE SOURCE — sealed stone, slate, cold       */
        /* ===================================================== */

        .pad-recontain {
          background:
            radial-gradient(ellipse at 50% 38%, #2e3e54 0%, #18222f 55%, #080d14 100%);
          color: #d8e2ee;
        }
        .pad-recontain .kicker { color: #8fb4d8; }
        .pad-recontain .title {
          color: #c8dcf2;
          text-shadow:
            inset 0 -2px 0 rgba(0, 0, 0, 0.4),
            0 1px 0 rgba(255, 255, 255, 0.08),
            0 2px 4px rgba(0, 0, 0, 0.6);
        }
        .pad-recontain .rule { color: #6b8ab2; }
        .pad-recontain .rule .line {
          background: linear-gradient(to right, transparent, #6b8ab2 40%, #6b8ab2 60%, transparent);
        }
        .pad-recontain .corner { color: #6b8ab2; opacity: 0.42; }
        .pad-recontain .stack .card { color: #8fb4d8; }
        .pad-recontain .stack-label { color: #b8d0ea; }
        .pad-recontain .tagline { color: #c0cee0; }

        /* concentric vault rings closing inward */
        .pad-recontain .bg-fx {
          background:
            radial-gradient(circle at 50% 50%, transparent 1.4in, rgba(140, 180, 220, 0.10) 1.41in, transparent 1.46in),
            radial-gradient(circle at 50% 50%, transparent 1.95in, rgba(140, 180, 220, 0.085) 1.96in, transparent 2.01in),
            radial-gradient(circle at 50% 50%, transparent 2.55in, rgba(140, 180, 220, 0.07) 2.56in, transparent 2.61in),
            radial-gradient(circle at 50% 50%, transparent 3.2in, rgba(140, 180, 220, 0.06) 3.21in, transparent 3.26in),
            radial-gradient(circle at 50% 50%, transparent 3.9in, rgba(140, 180, 220, 0.05) 3.91in, transparent 3.96in);
          opacity: 0.9;
        }

        /* large faint seal glyph behind the stack */
        .pad-recontain .bg-mark {
          background-image:
            radial-gradient(circle at 50% 50%, rgba(140, 180, 220, 0.08) 0%, rgba(140, 180, 220, 0.08) 0.45in, transparent 0.46in),
            radial-gradient(circle at 50% 50%, transparent 0.7in, rgba(140, 180, 220, 0.10) 0.71in, rgba(140, 180, 220, 0.10) 0.75in, transparent 0.76in);
        }

        .pad-recontain .vignette {
          background: radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.5) 100%);
        }

        /* ===================================================== */
        /* OPEN IT FOR RESEARCH — gold dawn, illuminated rays    */
        /* ===================================================== */

        .pad-open {
          background:
            radial-gradient(ellipse at 50% 30%, #fff7dc 0%, #f1d895 50%, #c89540 100%);
          color: #3a2410;
        }
        .pad-open .kicker { color: #8a5a20; }
        .pad-open .title {
          color: #5a3408;
          text-shadow:
            0 1px 0 rgba(255, 240, 200, 0.7),
            0 2px 6px rgba(180, 120, 30, 0.25);
        }
        .pad-open .rule { color: #8a5a20; }
        .pad-open .rule .line {
          background: linear-gradient(to right, transparent, #8a5a20 40%, #8a5a20 60%, transparent);
        }
        .pad-open .corner { color: #8a5a20; opacity: 0.55; }
        .pad-open .stack .card { color: #6b3e10; }
        .pad-open .stack .card-front { background: rgba(255, 248, 220, 0.45); }
        .pad-open .stack-label { color: #5a3408; opacity: 0.7; }
        .pad-open .tagline { color: #4a2c0e; }

        /* radiating sun rays from above the stack */
        .pad-open .bg-fx {
          background: repeating-conic-gradient(
            from -90deg at 50% 32%,
            rgba(255, 248, 200, 0.55) 0deg,
            rgba(255, 248, 200, 0.55) 3deg,
            transparent 3deg,
            transparent 14deg
          );
          mask-image: radial-gradient(ellipse at 50% 32%, #000 0in, #000 2in, transparent 7.5in);
          -webkit-mask-image: radial-gradient(ellipse at 50% 32%, #000 0in, #000 2in, transparent 7.5in);
          opacity: 0.85;
        }

        /* dust motes / scholar's light */
        .pad-open .bg-mark {
          background-image:
            radial-gradient(1.4px 1.4px at 14% 26%, rgba(120, 80, 30, 0.22) 50%, transparent 100%),
            radial-gradient(1px 1px at 28% 48%, rgba(120, 80, 30, 0.18) 50%, transparent 100%),
            radial-gradient(1.6px 1.6px at 56% 36%, rgba(120, 80, 30, 0.22) 50%, transparent 100%),
            radial-gradient(1px 1px at 72% 60%, rgba(120, 80, 30, 0.18) 50%, transparent 100%),
            radial-gradient(1.4px 1.4px at 86% 30%, rgba(120, 80, 30, 0.20) 50%, transparent 100%),
            radial-gradient(1px 1px at 18% 78%, rgba(120, 80, 30, 0.18) 50%, transparent 100%),
            radial-gradient(1.4px 1.4px at 88% 80%, rgba(120, 80, 30, 0.22) 50%, transparent 100%),
            radial-gradient(1px 1px at 44% 84%, rgba(120, 80, 30, 0.18) 50%, transparent 100%);
          opacity: 0.55;
        }

        .pad-open .vignette {
          background: radial-gradient(ellipse at center, transparent 55%, rgba(120, 70, 10, 0.25) 100%);
        }
      `}</style>
    </div>
  );
}

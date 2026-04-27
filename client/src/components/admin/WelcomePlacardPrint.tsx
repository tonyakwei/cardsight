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
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap";

function Placard() {
  return (
    <div className="placard">
      <span className="corner tl">Q</span>
      <span className="corner tr">T</span>
      <span className="corner bl">M</span>
      <span className="corner br">R</span>

      <div className="content">
        <h1>Welcome to the Temple of the QRians</h1>

        <div className="rule">
          <span className="line"></span>
          <span>I</span>
          <span className="line"></span>
        </div>

        <p className="greeting">I hope you're ready for an adventure!!</p>

        <div className="body">
          <p>
            Tonight, your expedition team (alongside two rival teams) will enter a newly discovered,{" "}
            <strong>long-forgotten stone temple</strong>.
          </p>
          <p>
            Over three acts, you'll have <strong>full rein as to what you'll try to explore and uncover</strong>{" "}
            with your pressingly limited time. The artifacts in your possession — or the ones you decide to trade
            for during your journey — may help you unravel the deep mysteries of the QRian temple.
          </p>
          <p>
            In the end, <strong>you and your rivals may be forced to come together</strong>… and make a decision
            that may decide the fate of the temple… and perhaps the world at large…
          </p>
        </div>

        <p className="closing">Good luck · have fun · it's up to you to figure out what happened here…</p>
      </div>
    </div>
  );
}

export function WelcomePlacardPrint() {
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
              {game.name} — Welcome Placard
            </Text>
          </Group>
          <Button size="sm" color="yellow" onClick={() => window.print()}>
            Print
          </Button>
        </Group>

        <Text size="sm" c="dimmed" mb="md">
          Three placards on a single letter-portrait sheet. Print, then cut along the dotted lines and hand one
          to each team at the door.
        </Text>
      </div>

      {/* The print sheet */}
      <div className="print-sheet">
        <Placard />
        <div className="cut-line" />
        <Placard />
        <div className="cut-line" />
        <Placard />
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          @page { size: letter portrait; margin: 0; }
          .print-sheet { box-shadow: none !important; margin: 0 !important; }
        }

        @media screen {
          .print-sheet {
            background: #1a140d;
            padding: 0.25in 0;
            margin: 0 auto;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
          }
        }

        .print-sheet {
          width: 8.5in;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .cut-line {
          width: 6in;
          height: 0;
          border-top: 1px dashed rgba(180, 150, 100, 0.55);
          margin: 0.04in 0;
        }

        .placard {
          position: relative;
          width: 6in;
          height: 3.5in;
          padding: 0.18in 0.28in;
          color: #ecdfc4;
          background: radial-gradient(ellipse at 50% 38%, #4a3d2c 0%, #312719 55%, #1d160e 100%);
          border: 1px solid #6a5230;
          box-shadow:
            inset 0 0 0 4px #1c130a,
            inset 0 0 0 5px #8a6a3a,
            inset 0 0 38px rgba(0, 0, 0, 0.55);
          overflow: hidden;
          font-family: 'Cormorant Garamond', 'Georgia', serif;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .placard::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.18;
          background-image:
            radial-gradient(1.4px 1.4px at 12% 18%, rgba(180, 150, 100, 0.55) 50%, transparent 100%),
            radial-gradient(1px 1px at 28% 60%, rgba(200, 170, 110, 0.45) 50%, transparent 100%),
            radial-gradient(1.7px 1.7px at 52% 12%, rgba(160, 130, 90, 0.5) 50%, transparent 100%),
            radial-gradient(1px 1px at 68% 78%, rgba(190, 155, 100, 0.5) 50%, transparent 100%),
            radial-gradient(1.4px 1.4px at 82% 32%, rgba(170, 140, 95, 0.5) 50%, transparent 100%),
            radial-gradient(1.1px 1.1px at 18% 84%, rgba(180, 150, 100, 0.5) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 90% 88%, rgba(160, 130, 90, 0.5) 50%, transparent 100%),
            radial-gradient(1px 1px at 44% 44%, rgba(200, 170, 110, 0.45) 50%, transparent 100%),
            radial-gradient(1.6px 1.6px at 60% 30%, rgba(170, 140, 95, 0.5) 50%, transparent 100%),
            radial-gradient(1px 1px at 8% 50%, rgba(180, 150, 100, 0.5) 50%, transparent 100%);
        }

        .placard::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.45) 100%);
        }

        .placard .corner {
          position: absolute;
          font-family: 'Qrian', serif;
          font-size: 26px;
          color: #b58a4a;
          opacity: 0.42;
          user-select: none;
          letter-spacing: 0;
          z-index: 1;
          line-height: 1;
        }
        .placard .corner.tl { top: 0.10in; left: 0.14in; }
        .placard .corner.tr { top: 0.10in; right: 0.14in; }
        .placard .corner.bl { bottom: 0.10in; left: 0.14in; }
        .placard .corner.br { bottom: 0.10in; right: 0.14in; }

        .placard .content {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .placard h1 {
          font-family: 'Cinzel', serif;
          font-weight: 700;
          font-size: 19px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #e6b85a;
          text-align: center;
          text-shadow: 0 1px 0 rgba(0, 0, 0, 0.6);
          margin: 0 0 2px;
          line-height: 1.15;
        }

        .placard .rule {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin: 4px auto 6px;
          width: 65%;
          color: #8a6a3a;
          font-family: 'Qrian', serif;
          font-size: 14px;
          opacity: 0.85;
        }
        .placard .rule .line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, #8a6a3a 40%, #8a6a3a 60%, transparent);
        }

        .placard .greeting {
          font-style: italic;
          font-size: 14.5px;
          color: #d4b078;
          text-align: center;
          margin: 0 0 6px;
        }

        .placard .body {
          font-size: 16px;
          line-height: 1.4;
          color: #ecdfc4;
          text-align: justify;
          hyphens: auto;
        }

        .placard .body p { margin: 0 0 6px; }
        .placard .body p:last-of-type { margin-bottom: 0; }

        .placard .body strong {
          font-weight: 600;
          color: #f4d68a;
        }

        .placard .closing {
          margin-top: auto;
          padding-top: 6px;
          text-align: center;
          font-family: 'Cinzel', serif;
          font-size: 12.5px;
          letter-spacing: 0.07em;
          color: #d4a857;
        }
      `}</style>
    </div>
  );
}

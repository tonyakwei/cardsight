import { useState, useEffect, useRef } from "react";

function StaticNoise() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Small canvas, scaled up via CSS for grainy look
    const W = 128;
    const H = 128;
    canvas.width = W;
    canvas.height = H;

    const imageData = ctx.createImageData(W, H);
    const data = imageData.data;
    let raf: number;

    function draw() {
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 18; // very subtle
      }
      ctx!.putImageData(imageData, 0, 0);
      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.6,
      }}
    />
  );
}

interface Props {
  itemName: string | null;
  examineText: string | null;
  selfDestructTimer: number | null;
  onExamine: () => Promise<void>;
}

const EXAMINE_DELAY_MS = 2000;

export function SplashGate({ itemName, examineText, selfDestructTimer, onExamine }: Props) {
  const [examining, setExamining] = useState(false);
  const [showExamine, setShowExamine] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowExamine(true), EXAMINE_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleExamine = async () => {
    setExamining(true);
    await onExamine();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60dvh",
        textAlign: "center",
        gap: "1.5rem",
        animation: "splashFadeIn 0.6s ease-out",
        position: "relative",
        zIndex: 1,
      }}
    >
      <StaticNoise />

      <div
        style={{
          fontSize: "0.65rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          opacity: 0.4,
        }}
      >
        Item
      </div>

      {itemName && (
        <div
          style={{
            fontSize: "2.2rem",
            fontWeight: 700,
            color: "var(--card-accent-color)",
            letterSpacing: "0.03em",
            lineHeight: 1.2,
            maxWidth: "320px",
            padding: "0 1rem",
          }}
        >
          {itemName}
        </div>
      )}

      {showExamine && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            marginTop: "1rem",
            animation: "examineReveal 0.8s ease-out",
          }}
        >
          <button
            onClick={handleExamine}
            disabled={examining}
            style={{
              padding: "1rem 3rem",
              fontSize: "1.1rem",
              fontWeight: 600,
              fontFamily: "var(--card-font-family)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              borderRadius: "12px",
              border: "1px solid var(--card-accent-color)",
              background: "rgba(255,255,255,0.04)",
              color: "var(--card-accent-color)",
              cursor: examining ? "wait" : "pointer",
              opacity: examining ? 0.6 : 1,
              transition: "all 0.2s ease",
            }}
          >
            {examining ? (
              <span style={{ opacity: 0.7 }}>...</span>
            ) : (
              examineText || "Examine"
            )}
          </button>

          <div
            style={{
              fontSize: "0.8rem",
              opacity: 0.5,
              fontStyle: "italic",
              maxWidth: "260px",
              lineHeight: 1.6,
            }}
          >
            Only examine if you're sure you want to use this item for your mission.
          </div>

          {selfDestructTimer && (
            <div
              style={{
                fontSize: "0.7rem",
                opacity: 0.3,
                maxWidth: "240px",
                lineHeight: 1.5,
              }}
            >
              Content will be visible for {selfDestructTimer} seconds after examining
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes splashFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes examineReveal {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

import { useEffect, useState } from "react";
import physicalCards from "../../../../shared/physical-cards.json";

// --- Color themes (from card-preview.html) ---
const THEMES: Record<string, {
  bg: string; border: string; darkBorder: string; text: string;
  sparkle: string; shaftColor: string; shaftFade: string;
}> = {
  red: {
    bg: '#7A1520', border: '#C41E3A', darkBorder: 'rgba(0,0,0,0.55)',
    text: '#FFFFFF', sparkle: 'rgba(255,200,200,0.9)',
    shaftColor: 'rgba(255,180,180,0.07)', shaftFade: 'rgba(255,180,180,0.02)',
  },
  yellow: {
    bg: '#7A6200', border: '#D4A017', darkBorder: 'rgba(0,0,0,0.55)',
    text: '#FFFFFF', sparkle: 'rgba(255,250,200,0.9)',
    shaftColor: 'rgba(255,240,180,0.08)', shaftFade: 'rgba(255,240,180,0.02)',
  },
  green: {
    bg: '#0A4A25', border: '#1B8C4F', darkBorder: 'rgba(0,0,0,0.55)',
    text: '#FFFFFF', sparkle: 'rgba(200,255,220,0.9)',
    shaftColor: 'rgba(180,255,200,0.07)', shaftFade: 'rgba(180,255,200,0.02)',
  },
  blue: {
    bg: '#1A3278', border: '#2E52A8', darkBorder: 'rgba(0,0,0,0.45)',
    text: '#FFFFFF', sparkle: 'rgba(200,220,255,0.9)',
    shaftColor: 'rgba(180,200,255,0.10)', shaftFade: 'rgba(180,200,255,0.03)',
  },
  purple: {
    bg: '#3D1A6A', border: '#7E35BF', darkBorder: 'rgba(0,0,0,0.45)',
    text: '#FFFFFF', sparkle: 'rgba(230,200,255,0.9)',
    shaftColor: 'rgba(220,180,255,0.10)', shaftFade: 'rgba(220,180,255,0.03)',
  },
  white: {
    bg: '#C8C8CC', border: '#E4E4E8', darkBorder: 'rgba(0,0,0,0.35)',
    text: '#1A1A2E', sparkle: 'rgba(255,255,255,0.95)',
    shaftColor: 'rgba(255,255,255,0.2)', shaftFade: 'rgba(255,255,255,0.05)',
  },
};

// --- Icon SVGs (viewBox 0 0 100 100) keyed by card number ---
const ICONS: Record<number, string> = {
  1: '<svg viewBox="0 0 100 100"><polygon points="50,5 61,38 97,38 68,59 79,93 50,72 21,93 32,59 3,38 39,38"/></svg>',
  2: '<svg viewBox="0 0 100 100"><polygon points="50,5 95,50 50,95 5,50"/></svg>',
  3: '<svg viewBox="0 0 100 100"><path d="M50,15 A35,35 0 0,1 50,85 A55,55 0 0,0 50,15 Z"/></svg>',
  4: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-width="4"/><polygon points="50,6 55,44 94,50 55,56 50,94 45,56 6,50 45,44" /><polygon points="50,20 53,44 78,22 55,46 78,78 55,54 50,80 45,54 22,78 45,46 22,22 47,44" opacity="0.4"/></svg>',
  5: '<svg viewBox="0 0 100 100"><path d="M50,95 C25,75 10,55 10,30 L10,15 L50,5 L90,15 L90,30 C90,55 75,75 50,95 Z"/><path d="M50,85 C30,70 20,53 20,33 L20,22 L50,14 L80,22 L80,33 C80,53 70,70 50,85 Z" fill="var(--flash-bg)"/><path d="M50,78 C34,65 27,51 27,35 L27,27 L50,20 L73,27 L73,35 C73,51 66,65 50,78 Z"/></svg>',
  6: '<svg viewBox="0 0 100 100"><path d="M50,5 L58,30 L85,15 L72,40 L97,50 L72,60 L85,85 L58,70 L50,95 L42,70 L15,85 L28,60 L3,50 L28,40 L15,15 L42,30 Z"/></svg>',
  7: '<svg viewBox="62 62 617 617"><g transform="translate(0,740) scale(0.1,-0.1)"><path d="M3825 6507 c-618 -300 -938 -723 -912 -1205 8 -138 28 -211 116 -408 82 -186 108 -262 121 -356 27 -191 -62 -385 -198 -434 -56 -20 -143 -17 -207 7 -168 63 -260 220 -273 465 -5 83 -10 121 -17 116 -6 -4 -40 -41 -76 -82 -251 -292 -463 -725 -538 -1105 -118 -593 26 -1203 385 -1636 331 -399 890 -630 1524 -630 207 0 341 13 505 47 613 130 1083 487 1261 961 14 37 37 115 52 173 23 94 26 124 26 290 1 201 -10 277 -63 433 -93 274 -276 496 -499 607 -33 16 -65 30 -70 30 -5 0 -1 -30 10 -67 25 -89 27 -223 4 -278 -22 -52 -61 -92 -103 -106 -83 -27 -197 27 -245 116 -73 135 -36 291 136 565 196 314 178 717 -48 1065 -84 129 -209 248 -411 390 -356 251 -471 419 -469 690 1 145 44 281 121 383 15 20 19 32 11 32 -7 0 -71 -29 -143 -63z"/></g></svg>',
  8: '<svg viewBox="0 0 100 100"><polygon points="25,8 75,8 85,18 85,18"/><polygon points="15,92 85,92 75,82 25,82"/><polygon points="25,8 15,18 15,18"/><polygon points="75,8 85,18 85,18"/><path d="M25,8 L15,18 L35,50 L15,82 L25,92 L75,92 L85,82 L65,50 L85,18 L75,8 Z M30,14 L70,14 L78,20 L60,50 L78,80 L70,86 L30,86 L22,80 L40,50 L22,20 Z"/><polygon points="45,25 48,28 45,31 42,28"/><polygon points="57,36 60,39 57,42 54,39"/><polygon points="40,66 43,69 40,72 37,69"/><polygon points="55,73 58,76 55,79 52,76"/></svg>',
  9: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="6"/><circle cx="50" cy="50" r="22"/><circle cx="50" cy="50" r="8" fill="var(--flash-bg)"/><path d="M50,4 L50,0 M50,96 L50,100 M4,50 L0,50 M96,50 L100,50 M17,17 L13,13 M83,17 L87,13 M17,83 L13,87 M83,83 L87,87" stroke="currentColor" stroke-width="5"/></svg>',
};

// Shaft layout (scaled down from 1050px card)
const SHAFTS = [
  { x: '8%', w: 38 }, { x: '22%', w: 13 }, { x: '35%', w: 61 },
  { x: '50%', w: 19 }, { x: '62%', w: 48 }, { x: '75%', w: 10 },
  { x: '85%', w: 34 }, { x: '15%', w: 27 }, { x: '45%', w: 11 },
  { x: '92%', w: 17 },
];

interface PhysicalCardFlashProps {
  cardId: string;
  onComplete: () => void;
}

export function PhysicalCardFlash({ cardId, onComplete }: PhysicalCardFlashProps) {
  const [exiting, setExiting] = useState(false);

  const card = physicalCards.find((c) => c.id === cardId);
  const theme = card ? THEMES[card.color] : null;

  useEffect(() => {
    if (!card) {
      onComplete();
      return;
    }

    // Try to preload the font for future scans
    if (typeof document !== "undefined") {
      const existing = document.querySelector('link[href*="Cinzel+Decorative"]');
      if (!existing) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap";
        document.head.appendChild(link);
      }
      document.fonts?.load('700 1em "Cinzel Decorative"').catch(() => {});
    }

    const showTimer = setTimeout(() => setExiting(true), 700);
    const doneTimer = setTimeout(() => onComplete(), 1100); // 700 + 400

    return () => {
      clearTimeout(showTimer);
      clearTimeout(doneTimer);
    };
  }, [card, onComplete]);

  if (!card || !theme) return null;

  const words = card.name.split(" ");

  return (
    <div style={styles.backdrop}>
      {/* Top half */}
      <div
        style={{
          ...styles.card,
          "--flash-bg": theme.bg,
          "--flash-border": theme.border,
          "--flash-dark-border": theme.darkBorder,
          "--flash-text": theme.text,
          "--flash-sparkle": theme.sparkle,
          "--flash-shaft": theme.shaftColor,
          "--flash-shaft-fade": theme.shaftFade,
          clipPath: "inset(0 0 50% 0)",
          animation: exiting ? "flashSliceTop 400ms ease-in-out forwards" : "none",
        } as React.CSSProperties}
      >
        <CardInner card={card} words={words} theme={theme} />
      </div>

      {/* Bottom half */}
      <div
        style={{
          ...styles.card,
          "--flash-bg": theme.bg,
          "--flash-border": theme.border,
          "--flash-dark-border": theme.darkBorder,
          "--flash-text": theme.text,
          "--flash-sparkle": theme.sparkle,
          "--flash-shaft": theme.shaftColor,
          "--flash-shaft-fade": theme.shaftFade,
          clipPath: "inset(50% 0 0 0)",
          animation: exiting ? "flashSliceBottom 400ms ease-in-out forwards" : "none",
        } as React.CSSProperties}
      >
        <CardInner card={card} words={words} theme={theme} />
      </div>

      <style>{keyframes}</style>
    </div>
  );
}

// Lookup helper for physical cards (used by CardViewer to decide whether to show flash)
export function isPhysicalCard(cardId: string): boolean {
  return physicalCards.some((c) => c.id === cardId);
}

// --- Internal card rendering ---

function CardInner({
  card,
  words,
  theme,
}: {
  card: (typeof physicalCards)[number];
  words: string[];
  theme: (typeof THEMES)[string];
}) {
  return (
    <>
      {/* Background */}
      <div style={{ ...styles.bg, background: theme.bg }} />

      {/* Light shafts */}
      <div style={styles.shafts}>
        {SHAFTS.map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute" as const,
              top: "-60%",
              height: "280%",
              left: s.x,
              width: s.w,
              transform: "rotate(30deg)",
              transformOrigin: "center center",
              background: `linear-gradient(to right, transparent 0%, ${theme.shaftColor} 20%, ${theme.shaftColor} 50%, ${theme.shaftFade} 80%, transparent 100%)`,
            }}
          />
        ))}
      </div>

      {/* Sparkles (simplified for phone size) */}
      <div
        style={{
          ...styles.sparkles,
          background: [
            `radial-gradient(1.5px 1.5px at 34px 48px, ${theme.sparkle}, transparent)`,
            `radial-gradient(1.5px 1.5px at 143px 77px, ${theme.sparkle}, transparent)`,
            `radial-gradient(1px 1px at 76px 134px, ${theme.sparkle}, transparent)`,
            `radial-gradient(1px 1px at 162px 172px, ${theme.sparkle}, transparent)`,
            `radial-gradient(1.5px 1.5px at 48px 211px, ${theme.sparkle}, transparent)`,
            `radial-gradient(1px 1px at 114px 249px, ${theme.sparkle}, transparent)`,
            `radial-gradient(1px 1px at 171px 287px, ${theme.sparkle}, transparent)`,
            `radial-gradient(1.5px 1.5px at 29px 297px, ${theme.sparkle}, transparent)`,
            `radial-gradient(1px 1px at 95px 58px, ${theme.sparkle}, transparent)`,
          ].join(", "),
        }}
      />

      {/* Borders: outer dark → outer color → gap → inner color */}
      <div style={{ ...styles.outerDarkBorder, borderColor: theme.darkBorder }} />
      <div style={{ ...styles.outerColorBorder, borderColor: theme.border }} />
      <div style={{ ...styles.innerColorBorder, borderColor: theme.border }} />

      {/* Corner spades */}
      {cornerPositions.map((pos, i) => (
        <div key={i} style={{ ...styles.spade, ...pos, color: theme.border }}>
          ♠
        </div>
      ))}

      {/* Card name */}
      <div style={styles.nameArea}>
        <div
          style={{
            ...styles.name,
            color: theme.text,
          }}
        >
          {words.map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>
      </div>

      {/* Center icon */}
      <div
        style={{ ...styles.icon, color: theme.text, fill: "currentColor" }}
        dangerouslySetInnerHTML={{ __html: ICONS[card.number] || "" }}
      />
    </>
  );
}

// --- Corner spade positions (pointing inward) ---
const cornerPositions: React.CSSProperties[] = [
  { top: 8, left: 10, transform: "rotate(135deg)" },   // top-left
  { top: 8, right: 10, transform: "rotate(-135deg)" },  // top-right → note: using scaleX(-1) would mirror, but rotation is simpler
  { bottom: 8, left: 10, transform: "rotate(45deg)" },  // bottom-left
  { bottom: 8, right: 10, transform: "rotate(-45deg)" }, // bottom-right
];

// --- Keyframes ---
const keyframes = `
@keyframes flashSliceTop {
  0% { clip-path: inset(0 0 50% 0); transform: translateY(0); opacity: 1; }
  100% { clip-path: inset(0 0 50% 0); transform: translateY(-120%); opacity: 0; }
}
@keyframes flashSliceBottom {
  0% { clip-path: inset(50% 0 0 0); transform: translateY(0); opacity: 1; }
  100% { clip-path: inset(50% 0 0 0); transform: translateY(120%); opacity: 0; }
}
`;

// --- Inline styles ---
const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#000",
    zIndex: 9999,
  },
  card: {
    position: "absolute",
    width: 200,
    height: 330,
    borderRadius: 8,
    overflow: "hidden",
  },
  bg: {
    position: "absolute",
    inset: 0,
  },
  shafts: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    pointerEvents: "none" as const,
  },
  sparkles: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none" as const,
  },
  outerDarkBorder: {
    position: "absolute",
    inset: 0,
    border: "2px solid",
    borderRadius: 8,
    pointerEvents: "none" as const,
    zIndex: 3,
  },
  outerColorBorder: {
    position: "absolute",
    inset: 2,
    border: "4px solid",
    borderRadius: 6,
    pointerEvents: "none" as const,
    zIndex: 3,
  },
  innerColorBorder: {
    position: "absolute",
    inset: 10,
    border: "4px solid",
    borderRadius: 4,
    pointerEvents: "none" as const,
    zIndex: 3,
  },
  spade: {
    position: "absolute",
    zIndex: 4,
    fontSize: 10,
    lineHeight: 1,
    pointerEvents: "none" as const,
  },
  nameArea: {
    position: "absolute",
    top: 20,
    left: 18,
    right: 18,
    height: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  name: {
    fontFamily: '"Cinzel Decorative", "Cinzel", Georgia, serif',
    fontWeight: 700,
    fontSize: 20,
    lineHeight: 1.15,
    textAlign: "center" as const,
    textShadow: "0 1px 4px rgba(0,0,0,0.5)",
  },
  icon: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 60,
    height: 60,
    zIndex: 5,
    filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.4))",
  },
};

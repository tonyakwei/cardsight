import { useEffect, useState, useCallback, useLayoutEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Group,
  Text,
  Loader,
  Button,
  SegmentedControl,
  ActionIcon,
  Badge,
  Stack,
} from "@mantine/core";
import Markdown from "react-markdown";
import {
  fetchGame,
  fetchStorySheetPrintData,
  getMissionQRUrl,
  type GameDetail,
} from "../../api/admin";

interface PrintMission {
  id: string;
  title: string;
  description: string;
  storySheetBlurb: string | null;
}

interface PrintSheet {
  id: string;
  house: { id: string; name: string; color: string };
  act: number;
  title: string;
  content: string;
  missions: PrintMission[];
}

function contrastTextOn(hex: string): string {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (full.length !== 6) return "#1a1a1a";
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.6 ? "#1a1a1a" : "#ffffff";
}

// --- Theme system ---

interface SheetTheme {
  id: string;
  label: string;
  fonts?: string;
  pageBg: string;
  textColor: string;
  bodyFont: string;
  headingFont: string;
  headingColor: string;
  labelColor: (houseColor: string) => string;
  borderStyle: (houseColor: string) => string;
  headerBorder: (houseColor: string) => string;
  missionBandBg: (houseColor: string) => string;
  missionBandBorder: (houseColor: string) => string;
  missionTitleColor: (houseColor: string) => string;
  renderBackground?: (houseColor: string, act: number) => React.ReactNode;
}

const classicTheme: SheetTheme = {
  id: "classic",
  label: "Classic",
  pageBg: "#faf9f6",
  textColor: "#1a1a1a",
  bodyFont: "'Georgia', 'Times New Roman', serif",
  headingFont: "'Georgia', 'Times New Roman', serif",
  headingColor: "#1a1a1a",
  labelColor: (houseColor) => houseColor,
  borderStyle: (houseColor) => `3px solid ${houseColor}`,
  headerBorder: (houseColor) => `2px solid ${houseColor}`,
  missionBandBg: (houseColor) => `${houseColor}12`,
  missionBandBorder: (houseColor) => `4px solid ${houseColor}`,
  missionTitleColor: (houseColor) => houseColor,
};

const templeTheme: SheetTheme = {
  id: "temple",
  label: "Temple",
  fonts: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap",
  pageBg: "#f4e4c1",
  textColor: "#2c2118",
  bodyFont: "'Crimson Text', 'Georgia', serif",
  headingFont: "'Cinzel', serif",
  headingColor: "#3d2b1a",
  labelColor: () => "#8b5e3c",
  borderStyle: () => "4px double #8b6f47",
  headerBorder: () => "2px solid #c4a265",
  missionBandBg: () => "rgba(139, 94, 60, 0.10)",
  missionBandBorder: () => "4px solid #a0845c",
  missionTitleColor: () => "#6b4226",
  renderBackground: (_houseColor, act) => (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.06,
          backgroundImage: `
            radial-gradient(2px 2px at 12% 8%, rgba(120,80,30,1) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 28% 52%, rgba(140,100,50,1) 50%, transparent 100%),
            radial-gradient(2px 2px at 45% 15%, rgba(110,75,25,1) 50%, transparent 100%),
            radial-gradient(1px 1px at 58% 38%, rgba(130,90,40,1) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 72% 68%, rgba(120,85,35,1) 50%, transparent 100%),
            radial-gradient(2px 2px at 85% 25%, rgba(140,100,45,1) 50%, transparent 100%),
            radial-gradient(1px 1px at 92% 58%, rgba(110,80,30,1) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 38% 78%, rgba(130,95,42,1) 50%, transparent 100%)
          `,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(ellipse at center, transparent 50%, rgba(100, 70, 30, 0.08) 100%)
          `,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.035,
          backgroundImage: `
            linear-gradient(155deg, transparent 42%, rgba(100,70,30,1) 42.3%, transparent 42.6%),
            linear-gradient(25deg, transparent 65%, rgba(100,70,30,1) 65.2%, transparent 65.5%),
            linear-gradient(100deg, transparent 78%, rgba(100,70,30,1) 78.2%, transparent 78.5%)
          `,
        }}
      />
      {act === 1 && <FloodAccents />}
      {act === 2 && <VineAccents />}
    </>
  ),
};

function FloodAccents() {
  return (
    <>
      {/* deep rising water tint — taller, darker */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "40%",
          background:
            "linear-gradient(180deg, rgba(40,95,115,0) 0%, rgba(38,92,112,0.16) 40%, rgba(28,80,102,0.30) 75%, rgba(20,68,92,0.42) 100%)",
          pointerEvents: "none",
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        } as React.CSSProperties}
      />
      {/* darker dampness halos in bottom corners */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(ellipse 220px 160px at 0% 100%, rgba(20,60,82,0.28) 0%, transparent 70%),
            radial-gradient(ellipse 220px 160px at 100% 100%, rgba(20,60,82,0.28) 0%, transparent 70%),
            radial-gradient(ellipse 280px 80px at 50% 100%, rgba(15,55,78,0.22) 0%, transparent 80%)
          `,
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        } as React.CSSProperties}
      />
      {/* primary water-line (top of flood) — thicker, more opaque */}
      <svg
        aria-hidden
        viewBox="0 0 720 36"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "40%",
          width: "100%",
          height: "20px",
          opacity: 0.85,
          pointerEvents: "none",
        }}
      >
        <path
          d="M 0 18 Q 50 4 100 18 T 200 18 T 300 18 T 400 18 T 500 18 T 600 18 T 720 18"
          stroke="rgba(20, 70, 92, 0.75)"
          strokeWidth="1.8"
          fill="none"
        />
      </svg>
      {/* secondary wave */}
      <svg
        aria-hidden
        viewBox="0 0 720 36"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "32%",
          width: "100%",
          height: "16px",
          opacity: 0.6,
          pointerEvents: "none",
        }}
      >
        <path
          d="M 0 18 Q 70 6 140 18 T 280 18 T 420 18 T 560 18 T 720 18"
          stroke="rgba(20, 70, 92, 0.7)"
          strokeWidth="1.4"
          fill="none"
        />
      </svg>
      {/* tertiary wave deeper down */}
      <svg
        aria-hidden
        viewBox="0 0 720 30"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "22%",
          width: "100%",
          height: "12px",
          opacity: 0.45,
          pointerEvents: "none",
        }}
      >
        <path
          d="M 0 15 Q 90 6 180 15 T 360 15 T 540 15 T 720 15"
          stroke="rgba(20, 70, 92, 0.6)"
          strokeWidth="1.1"
          fill="none"
        />
      </svg>
      {/* deepest wave near bottom */}
      <svg
        aria-hidden
        viewBox="0 0 720 30"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "10%",
          width: "100%",
          height: "10px",
          opacity: 0.35,
          pointerEvents: "none",
        }}
      >
        <path
          d="M 0 15 Q 120 8 240 15 T 480 15 T 720 15"
          stroke="rgba(20, 70, 92, 0.55)"
          strokeWidth="1"
          fill="none"
        />
      </svg>
      {/* rising air bubbles in submerged region */}
      <svg
        aria-hidden
        viewBox="0 0 720 400"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "40%",
          opacity: 0.6,
          pointerEvents: "none",
        }}
      >
        <g stroke="rgba(20, 70, 92, 0.85)" strokeWidth="1" fill="none">
          <circle cx="80" cy="320" r="4" />
          <circle cx="92" cy="280" r="2.5" />
          <circle cx="74" cy="240" r="2" />
          <circle cx="200" cy="350" r="3" />
          <circle cx="210" cy="310" r="4.5" />
          <circle cx="195" cy="270" r="2" />
          <circle cx="430" cy="340" r="3.5" />
          <circle cx="445" cy="295" r="2.5" />
          <circle cx="438" cy="250" r="1.8" />
          <circle cx="600" cy="360" r="4" />
          <circle cx="615" cy="320" r="2.8" />
          <circle cx="608" cy="282" r="2" />
          <circle cx="320" cy="370" r="2.5" />
          <circle cx="540" cy="385" r="2" />
        </g>
      </svg>
      {/* vertical rivulets dripping from top edge */}
      <svg
        aria-hidden
        viewBox="0 0 720 960"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.35,
          pointerEvents: "none",
        }}
      >
        <g stroke="rgba(25, 75, 100, 0.6)" strokeWidth="1" fill="none" strokeLinecap="round">
          <path d="M 110 0 Q 108 60 112 130 Q 116 200 108 270" />
          <path d="M 360 0 Q 364 50 358 110 Q 354 170 362 220" />
          <path d="M 600 0 Q 596 70 604 150 Q 612 220 600 290" />
        </g>
        <g fill="rgba(25, 75, 100, 0.7)">
          <ellipse cx="108" cy="270" rx="2.2" ry="3" />
          <ellipse cx="362" cy="220" rx="2" ry="2.8" />
          <ellipse cx="600" cy="290" rx="2.3" ry="3.2" />
        </g>
      </svg>
      {/* a couple of ripple rings on the surface */}
      <svg
        aria-hidden
        viewBox="0 0 60 30"
        style={{
          position: "absolute",
          left: "12%",
          bottom: "38%",
          width: "62px",
          height: "26px",
          opacity: 0.5,
          pointerEvents: "none",
        }}
      >
        <ellipse cx="30" cy="15" rx="24" ry="4" stroke="rgba(20, 70, 92, 0.8)" strokeWidth="1.1" fill="none" />
        <ellipse cx="30" cy="15" rx="14" ry="2.5" stroke="rgba(20, 70, 92, 0.6)" strokeWidth="0.9" fill="none" />
        <ellipse cx="30" cy="15" rx="6" ry="1.2" stroke="rgba(20, 70, 92, 0.5)" strokeWidth="0.7" fill="none" />
      </svg>
      <svg
        aria-hidden
        viewBox="0 0 60 30"
        style={{
          position: "absolute",
          right: "16%",
          bottom: "39%",
          width: "50px",
          height: "22px",
          opacity: 0.42,
          pointerEvents: "none",
        }}
      >
        <ellipse cx="30" cy="15" rx="20" ry="3.5" stroke="rgba(20, 70, 92, 0.7)" strokeWidth="1" fill="none" />
        <ellipse cx="30" cy="15" rx="10" ry="2" stroke="rgba(20, 70, 92, 0.55)" strokeWidth="0.8" fill="none" />
      </svg>
    </>
  );
}

function VineCorner({
  transform,
  position,
}: {
  transform: string;
  position: React.CSSProperties;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 240 240"
      style={{
        position: "absolute",
        width: "240px",
        height: "240px",
        opacity: 0.5,
        pointerEvents: "none",
        transform,
        transformOrigin: "center",
        ...position,
      }}
    >
      <g stroke="#2f5024" strokeWidth="1.8" fill="none" strokeLinecap="round">
        <path d="M 4 18 Q 50 44 82 70 T 142 116 Q 168 140 156 178" />
        <path d="M 22 4 Q 56 30 72 60 T 112 116 Q 132 140 122 170" />
        <path d="M 56 48 Q 80 62 88 80" />
        <path d="M 100 100 Q 130 105 138 122" />
      </g>
      <g fill="#446a36">
        <ellipse cx="50" cy="44" rx="11" ry="5" transform="rotate(-30 50 44)" />
        <ellipse cx="92" cy="80" rx="12" ry="5.5" transform="rotate(20 92 80)" />
        <ellipse cx="140" cy="130" rx="10" ry="4.8" transform="rotate(55 140 130)" />
        <ellipse cx="68" cy="72" rx="7" ry="3.4" transform="rotate(40 68 72)" />
        <ellipse cx="118" cy="58" rx="9" ry="4" transform="rotate(-12 118 58)" />
        <ellipse cx="32" cy="80" rx="7.5" ry="3.5" transform="rotate(70 32 80)" />
        <ellipse cx="156" cy="92" rx="8" ry="4" transform="rotate(-25 156 92)" />
        <ellipse cx="80" cy="130" rx="9" ry="4.2" transform="rotate(35 80 130)" />
      </g>
      <g fill="#5a8a4c" opacity="0.85">
        <ellipse cx="60" cy="55" rx="4" ry="2" transform="rotate(-30 60 55)" />
        <ellipse cx="105" cy="92" rx="4.5" ry="2.2" transform="rotate(20 105 92)" />
        <ellipse cx="150" cy="148" rx="3.8" ry="1.8" transform="rotate(55 150 148)" />
      </g>
    </svg>
  );
}

const vineTileH = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='52' viewBox='0 0 150 52'>
    <path d='M 0 26 Q 38 6 75 26 T 150 26' stroke='#2f5024' stroke-width='1.8' fill='none' stroke-linecap='round'/>
    <ellipse cx='38' cy='14' rx='11' ry='5' fill='#446a36' transform='rotate(-30 38 14)'/>
    <ellipse cx='112' cy='38' rx='11' ry='5' fill='#446a36' transform='rotate(30 112 38)'/>
    <ellipse cx='75' cy='26' rx='7.5' ry='3.5' fill='#5a8a4c' transform='rotate(15 75 26)'/>
    <ellipse cx='12' cy='34' rx='6' ry='2.8' fill='#446a36' transform='rotate(20 12 34)'/>
    <ellipse cx='138' cy='18' rx='6' ry='2.8' fill='#446a36' transform='rotate(-20 138 18)'/>
    <circle cx='95' cy='14' r='1.5' fill='#2f5024'/>
    <circle cx='55' cy='38' r='1.5' fill='#2f5024'/>
  </svg>`,
);

const vineTileV = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='52' height='150' viewBox='0 0 52 150'>
    <path d='M 26 0 Q 6 38 26 75 T 26 150' stroke='#2f5024' stroke-width='1.8' fill='none' stroke-linecap='round'/>
    <ellipse cx='14' cy='38' rx='5' ry='11' fill='#446a36' transform='rotate(-30 14 38)'/>
    <ellipse cx='38' cy='112' rx='5' ry='11' fill='#446a36' transform='rotate(30 38 112)'/>
    <ellipse cx='26' cy='75' rx='3.5' ry='7.5' fill='#5a8a4c' transform='rotate(15 26 75)'/>
    <ellipse cx='34' cy='12' rx='2.8' ry='6' fill='#446a36' transform='rotate(20 34 12)'/>
    <ellipse cx='18' cy='138' rx='2.8' ry='6' fill='#446a36' transform='rotate(-20 18 138)'/>
    <circle cx='14' cy='95' r='1.5' fill='#2f5024'/>
    <circle cx='38' cy='55' r='1.5' fill='#2f5024'/>
  </svg>`,
);

function Flower({
  cx,
  cy,
  scale = 1,
  color = "#c98ba5",
  rotation = 0,
}: {
  cx: number;
  cy: number;
  scale?: number;
  color?: string;
  rotation?: number;
}) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rotation}) scale(${scale})`}>
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="0"
          cy="-7"
          rx="3.6"
          ry="5.2"
          fill={color}
          transform={`rotate(${deg})`}
        />
      ))}
      <circle r="2.2" fill="#e8c977" />
    </g>
  );
}

function VineAccents() {
  return (
    <>
      {/* stronger green wash over the page */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(70, 100, 55, 0.07)",
          pointerEvents: "none",
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        } as React.CSSProperties}
      />
      {/* moss patches in random spots */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(ellipse 90px 50px at 4% 38%, rgba(70,110,55,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 110px 60px at 96% 62%, rgba(70,110,55,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 70px 40px at 50% 96%, rgba(70,110,55,0.14) 0%, transparent 70%)
          `,
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        } as React.CSSProperties}
      />
      {/* horizontal vine garland along top edge */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "6px",
          left: "180px",
          right: "180px",
          height: "52px",
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,${vineTileH}")`,
          backgroundRepeat: "repeat-x",
          backgroundSize: "150px 52px",
          opacity: 0.55,
          pointerEvents: "none",
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        } as React.CSSProperties}
      />
      {/* horizontal vine garland along bottom edge */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "6px",
          left: "180px",
          right: "180px",
          height: "52px",
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,${vineTileH}")`,
          backgroundRepeat: "repeat-x",
          backgroundSize: "150px 52px",
          opacity: 0.55,
          pointerEvents: "none",
          transform: "scaleY(-1)",
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        } as React.CSSProperties}
      />
      {/* vertical vine column along left edge */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "180px",
          bottom: "180px",
          left: "6px",
          width: "52px",
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,${vineTileV}")`,
          backgroundRepeat: "repeat-y",
          backgroundSize: "52px 150px",
          opacity: 0.55,
          pointerEvents: "none",
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        } as React.CSSProperties}
      />
      {/* vertical vine column along right edge */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "180px",
          bottom: "180px",
          right: "6px",
          width: "52px",
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,${vineTileV}")`,
          backgroundRepeat: "repeat-y",
          backgroundSize: "52px 150px",
          opacity: 0.55,
          pointerEvents: "none",
          transform: "scaleX(-1)",
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        } as React.CSSProperties}
      />
      {/* corners (sit on top of edge garlands for a thicker bouquet) */}
      <VineCorner transform="" position={{ top: 0, left: 0 }} />
      <VineCorner transform="scaleX(-1)" position={{ top: 0, right: 0 }} />
      <VineCorner transform="scaleY(-1)" position={{ bottom: 0, left: 0 }} />
      <VineCorner transform="scale(-1, -1)" position={{ bottom: 0, right: 0 }} />
      {/* scattered flower blossoms on the vines */}
      <svg
        aria-hidden
        viewBox="0 0 720 960"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.75,
          pointerEvents: "none",
        }}
      >
        <Flower cx={70} cy={45} scale={1.2} color="#c98ba5" rotation={-10} />
        <Flower cx={310} cy={28} scale={1.0} color="#e0a86a" rotation={20} />
        <Flower cx={520} cy={42} scale={1.1} color="#c98ba5" rotation={5} />
        <Flower cx={660} cy={60} scale={0.9} color="#dca06b" rotation={-25} />
        <Flower cx={32} cy={310} scale={1.0} color="#c98ba5" rotation={45} />
        <Flower cx={42} cy={580} scale={0.9} color="#e0a86a" rotation={-20} />
        <Flower cx={690} cy={250} scale={1.0} color="#c98ba5" rotation={-30} />
        <Flower cx={680} cy={520} scale={0.95} color="#dca06b" rotation={15} />
        <Flower cx={690} cy={780} scale={1.1} color="#c98ba5" rotation={50} />
        <Flower cx={50} cy={830} scale={1.0} color="#e0a86a" rotation={30} />
        <Flower cx={250} cy={920} scale={1.05} color="#c98ba5" rotation={-15} />
        <Flower cx={460} cy={930} scale={1.0} color="#dca06b" rotation={20} />
        <Flower cx={620} cy={918} scale={1.1} color="#c98ba5" rotation={-40} />
      </svg>
      {/* one big fallen leaf drifting near the lower-mid area, off-center */}
      <svg
        aria-hidden
        viewBox="0 0 80 50"
        style={{
          position: "absolute",
          left: "62%",
          bottom: "18%",
          width: "44px",
          height: "28px",
          opacity: 0.35,
          pointerEvents: "none",
          transform: "rotate(28deg)",
        }}
      >
        <path
          d="M 5 25 Q 20 5 40 8 Q 65 12 75 25 Q 65 40 40 42 Q 20 45 5 25 Z"
          fill="#446a36"
          stroke="#2f5024"
          strokeWidth="0.8"
        />
        <path d="M 8 25 Q 40 24 72 25" stroke="#2f5024" strokeWidth="0.6" fill="none" />
      </svg>
    </>
  );
}

const THEMES: SheetTheme[] = [classicTheme, templeTheme];

// --- Components ---

// US Letter content area at 96 DPI with 0.5in margins
const PAGE_CONTENT_HEIGHT_PX = 10 * 96; // 960px
const PAGE_WARN_RATIO = 0.9; // warn when within 10% of overflow

interface OverflowState {
  height: number;
  overflows: boolean;
  warning: boolean;
}

export function StorySheetPrint() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [sheets, setSheets] = useState<PrintSheet[]>([]);
  const [act, setAct] = useState("1");
  const [themeId, setThemeId] = useState("classic");
  const [loading, setLoading] = useState(true);
  const [overflows, setOverflows] = useState<Record<string, OverflowState>>({});

  const theme = THEMES.find((t) => t.id === themeId) ?? classicTheme;

  const recordHeight = useCallback((sheetId: string, height: number) => {
    setOverflows((prev) => {
      const next: OverflowState = {
        height,
        overflows: height > PAGE_CONTENT_HEIGHT_PX,
        warning: height > PAGE_CONTENT_HEIGHT_PX * PAGE_WARN_RATIO,
      };
      const cur = prev[sheetId];
      if (
        cur &&
        cur.height === next.height &&
        cur.overflows === next.overflows &&
        cur.warning === next.warning
      )
        return prev;
      return { ...prev, [sheetId]: next };
    });
  }, []);

  const loadData = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    setOverflows({});
    const [g, s] = await Promise.all([
      fetchGame(gameId),
      fetchStorySheetPrintData(gameId, Number(act)),
    ]);
    setGame(g);
    setSheets(s);
    setLoading(false);
  }, [gameId, act]);

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
      {theme.fonts && <link rel="stylesheet" href={theme.fonts} />}

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
              {game.name} — Story Sheet Print
            </Text>
          </Group>
          <Group gap="sm">
            <SegmentedControl
              size="xs"
              value={themeId}
              onChange={setThemeId}
              data={THEMES.map((t) => ({ label: t.label, value: t.id }))}
            />
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
            <Button size="sm" color="yellow" onClick={() => window.print()}>
              Print
            </Button>
          </Group>
        </Group>
      </div>

      {/* Overflow summary (screen-only) */}
      {!loading && sheets.length > 0 && (
        <div className="no-print" style={{ marginBottom: "1rem" }}>
          <Stack gap={4}>
            {sheets.map((sheet) => {
              const o = overflows[sheet.id];
              if (!o) return null;
              const overshootPx = Math.max(0, o.height - PAGE_CONTENT_HEIGHT_PX);
              return (
                <Group key={sheet.id} gap="xs">
                  <Text size="xs" fw={600} style={{ minWidth: 110 }}>
                    {sheet.house.name}
                  </Text>
                  {o.overflows ? (
                    <Badge size="sm" color="red" variant="filled">
                      Overflows by ~{overshootPx}px ({Math.ceil(o.height / PAGE_CONTENT_HEIGHT_PX)} pages)
                    </Badge>
                  ) : o.warning ? (
                    <Badge size="sm" color="yellow" variant="filled">
                      Tight — {Math.round((o.height / PAGE_CONTENT_HEIGHT_PX) * 100)}% of page
                    </Badge>
                  ) : (
                    <Badge size="sm" color="teal" variant="light">
                      Fits ({Math.round((o.height / PAGE_CONTENT_HEIGHT_PX) * 100)}%)
                    </Badge>
                  )}
                </Group>
              );
            })}
          </Stack>
        </div>
      )}

      {loading ? (
        <Group justify="center" pt="xl">
          <Loader color="yellow" size="sm" />
        </Group>
      ) : sheets.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No story sheets for Act {act}.
        </Text>
      ) : (
        <div>
          {sheets.map((sheet, i) => (
            <SheetPage
              key={sheet.id}
              sheet={sheet}
              gameId={gameId!}
              theme={theme}
              isLast={i === sheets.length - 1}
              onMeasure={(h) => recordHeight(sheet.id, h)}
            />
          ))}
        </div>
      )}

      <style>{`
        @page { size: letter; margin: 0.5in; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          .sheet-page { margin: 0 !important; box-shadow: none !important; }
        }
        @media screen {
          .sheet-page { margin: 0 auto 2rem auto; box-shadow: 0 4px 16px rgba(0,0,0,0.4); }
        }
        .story-md p { margin: 0 0 1rem 0; }
        .story-md p:last-child { margin-bottom: 0; }
        .story-md em { font-style: italic; }
        .story-md strong { font-weight: 700; }
        .blurb-md p { margin: 0 0 0.5rem 0; }
        .blurb-md p:last-child { margin-bottom: 0; }
        .blurb-md em { font-style: italic; }
        .blurb-md strong { font-weight: 700; }
      `}</style>
    </div>
  );
}

function SheetPage({
  sheet,
  gameId,
  theme,
  isLast,
  onMeasure,
}: {
  sheet: PrintSheet;
  gameId: string;
  theme: SheetTheme;
  isLast: boolean;
  onMeasure: (heightPx: number) => void;
}) {
  const houseColor = sheet.house.color;
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => onMeasure(el.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // Re-measure once images (QR codes) have loaded
    const imgs = el.querySelectorAll("img");
    imgs.forEach((img) => {
      if (!img.complete) img.addEventListener("load", measure, { once: true });
    });
    return () => ro.disconnect();
  }, [onMeasure, sheet.content, sheet.missions.length]);

  return (
    <div
      ref={ref}
      className="sheet-page"
      style={{
        pageBreakAfter: isLast ? undefined : "always",
        width: "7.5in",
        boxSizing: "border-box",
        padding: "2.5rem",
        paddingTop: "3rem",
        position: "relative",
        overflow: "hidden",
        background: theme.pageBg,
        color: theme.textColor,
        border: theme.borderStyle(houseColor),
        borderRadius: "4px",
        fontFamily: theme.bodyFont,
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
      } as React.CSSProperties}
    >
      {theme.renderBackground?.(houseColor, sheet.act)}

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "14px",
          background: houseColor,
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        } as React.CSSProperties}
      />

      <div
        aria-hidden
        style={{
          position: "absolute",
          right: "1.25rem",
          bottom: "1rem",
          fontFamily: theme.headingFont,
          fontSize: "9rem",
          fontWeight: 900,
          lineHeight: 1,
          color: houseColor,
          opacity: 0.1,
          pointerEvents: "none",
          letterSpacing: "-0.05em",
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        } as React.CSSProperties}
      >
        {sheet.house.name.charAt(0).toUpperCase()}
      </div>

      <div style={{ position: "relative" }}>
        {/* Title header */}
        <div
          style={{
            borderBottom: theme.headerBorder(houseColor),
            paddingBottom: "1rem",
            marginBottom: "2rem",
          }}
        >
          <span
            style={{
              display: "inline-block",
              background: houseColor,
              color: contrastTextOn(houseColor),
              fontFamily: theme.headingFont,
              fontSize: "0.7rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              padding: "0.3rem 0.7rem",
              borderRadius: "999px",
              marginBottom: "0.6rem",
              printColorAdjust: "exact",
              WebkitPrintColorAdjust: "exact",
            } as React.CSSProperties}
          >
            {sheet.house.name} — Act {sheet.act}
          </span>
          <h1
            style={{
              fontSize: "1.6rem",
              fontWeight: 700,
              color: theme.headingColor,
              fontFamily: theme.headingFont,
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            {sheet.title}
          </h1>
        </div>

        {/* Story content (markdown) */}
        <div
          className="story-md"
          style={{ fontSize: "0.95rem", lineHeight: 1.85 }}
        >
          <Markdown>{sheet.content}</Markdown>
        </div>

        {/* Mission list */}
        {sheet.missions.length > 0 && (
          <div style={{ marginTop: "2rem" }}>
            <div
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: theme.labelColor(houseColor),
                fontFamily: theme.headingFont,
                fontWeight: 700,
                marginBottom: "0.75rem",
              }}
            >
              Your Missions
            </div>
            <div>
              {sheet.missions.map((mission) => (
                <MissionBand
                  key={mission.id}
                  mission={mission}
                  houseColor={houseColor}
                  gameId={gameId}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MissionBand({
  mission,
  houseColor,
  gameId,
  theme,
}: {
  mission: PrintMission;
  houseColor: string;
  gameId: string;
  theme: SheetTheme;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        margin: "0.75rem 0",
        padding: "1rem 1.25rem",
        background: theme.missionBandBg(houseColor),
        borderLeft: theme.missionBandBorder(houseColor),
        borderRadius: "0 4px 4px 0",
        gap: "1rem",
        pageBreakInside: "avoid",
      }}
    >
      <div style={{ flex: 1, fontSize: "0.9rem", lineHeight: 1.6 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.4rem",
          }}
        >
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: houseColor,
              flexShrink: 0,
              printColorAdjust: "exact",
              WebkitPrintColorAdjust: "exact",
            } as React.CSSProperties}
          />
          <div
            style={{
              fontFamily: theme.headingFont,
              fontWeight: 700,
              fontSize: "1.05rem",
              color: theme.missionTitleColor(houseColor),
            }}
          >
            {mission.title}
          </div>
        </div>
        {mission.storySheetBlurb && (
          <div className="blurb-md">
            <Markdown>{mission.storySheetBlurb}</Markdown>
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <img
          src={getMissionQRUrl(gameId, mission.id)}
          alt={`QR: ${mission.title}`}
          style={{
            width: "84px",
            height: "84px",
            borderRadius: "4px",
            border: `3px solid ${houseColor}`,
            background: "white",
            padding: "2px",
            boxSizing: "content-box",
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

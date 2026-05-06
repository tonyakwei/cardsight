export function FloodBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, #050a14 0%, #07182a 35%, #0a223c 70%, #0d2a48 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "-15%",
          background:
            "radial-gradient(ellipse 60% 40% at 30% 20%, rgba(40, 110, 170, 0.22) 0%, transparent 65%)",
          animation: "floodCausticA 22s ease-in-out infinite alternate",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "-15%",
          background:
            "radial-gradient(ellipse 70% 50% at 70% 75%, rgba(60, 140, 200, 0.18) 0%, transparent 65%)",
          animation: "floodCausticB 28s ease-in-out infinite alternate",
        }}
      />

      <svg
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id="floodWave1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="rgba(80, 160, 220, 0.32)" />
            <stop offset="1" stopColor="rgba(20, 60, 110, 0.55)" />
          </linearGradient>
          <linearGradient id="floodWave2" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="rgba(60, 130, 190, 0.28)" />
            <stop offset="1" stopColor="rgba(15, 45, 85, 0.5)" />
          </linearGradient>
          <linearGradient id="floodWave3" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="rgba(40, 100, 160, 0.24)" />
            <stop offset="1" stopColor="rgba(10, 30, 65, 0.45)" />
          </linearGradient>
        </defs>

        <g style={{ animation: "floodDriftRight 24s linear infinite" }}>
          <path
            d="M -1200 580 Q -1100 540 -1000 580 Q -900 620 -800 580 Q -700 540 -600 580 Q -500 620 -400 580 Q -300 540 -200 580 Q -100 620 0 580 Q 100 540 200 580 Q 300 620 400 580 Q 500 540 600 580 Q 700 620 800 580 Q 900 540 1000 580 Q 1100 620 1200 580 Q 1300 540 1400 580 Q 1500 620 1600 580 Q 1700 540 1800 580 Q 1900 620 2000 580 Q 2100 540 2200 580 Q 2300 620 2400 580 L 2400 800 L -1200 800 Z"
            fill="url(#floodWave1)"
          />
        </g>
        <g style={{ animation: "floodDriftLeft 18s linear infinite" }}>
          <path
            d="M -1200 680 Q -1100 655 -1000 680 Q -900 705 -800 680 Q -700 655 -600 680 Q -500 705 -400 680 Q -300 655 -200 680 Q -100 705 0 680 Q 100 655 200 680 Q 300 705 400 680 Q 500 655 600 680 Q 700 705 800 680 Q 900 655 1000 680 Q 1100 705 1200 680 Q 1300 655 1400 680 Q 1500 705 1600 680 Q 1700 655 1800 680 Q 1900 705 2000 680 Q 2100 655 2200 680 Q 2300 705 2400 680 L 2400 800 L -1200 800 Z"
            fill="url(#floodWave2)"
          />
        </g>
        <g style={{ animation: "floodDriftRight 14s linear infinite" }}>
          <path
            d="M -1200 750 Q -1100 738 -1000 750 Q -900 762 -800 750 Q -700 738 -600 750 Q -500 762 -400 750 Q -300 738 -200 750 Q -100 762 0 750 Q 100 738 200 750 Q 300 762 400 750 Q 500 738 600 750 Q 700 762 800 750 Q 900 738 1000 750 Q 1100 762 1200 750 Q 1300 738 1400 750 Q 1500 762 1600 750 Q 1700 738 1800 750 Q 1900 762 2000 750 Q 2100 738 2200 750 Q 2300 762 2400 750 L 2400 800 L -1200 800 Z"
            fill="url(#floodWave3)"
          />
        </g>
      </svg>

      {Array.from({ length: 8 }).map((_, i) => {
        const delay = (i * 1.6) % 11;
        const duration = 13 + (i % 4) * 2.5;
        const left = (i * 13 + 7) % 100;
        const size = 3 + (i % 3) * 2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              bottom: "-30px",
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: "50%",
              background: "rgba(180, 220, 255, 0.35)",
              boxShadow: "0 0 6px rgba(180, 220, 255, 0.5)",
              animation: `floodBubble ${duration}s linear ${delay}s infinite`,
            }}
          />
        );
      })}

      <style>{`
        @keyframes floodDriftRight {
          from { transform: translateX(0); }
          to   { transform: translateX(400px); }
        }
        @keyframes floodDriftLeft {
          from { transform: translateX(0); }
          to   { transform: translateX(-400px); }
        }
        @keyframes floodCausticA {
          from { opacity: 0.65; transform: translate(0, 0); }
          to   { opacity: 1;    transform: translate(20px, 12px); }
        }
        @keyframes floodCausticB {
          from { opacity: 0.55; transform: translate(0, 0); }
          to   { opacity: 1;    transform: translate(-25px, -10px); }
        }
        @keyframes floodBubble {
          0%   { transform: translateY(0) scale(0.6); opacity: 0; }
          8%   { opacity: 1; }
          90%  { opacity: 0.7; }
          100% { transform: translateY(-115vh) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

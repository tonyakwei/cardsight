// Leaf paths (centered around 0,0; rotated/translated per instance)
const LEAF_PATHS = [
  // Slim lance leaf
  "M 0 0 Q 6 -8 10 -22 Q 14 -8 20 0 Q 14 6 10 16 Q 6 6 0 0 Z",
  // Rounder leaf
  "M 0 0 Q 4 -10 14 -18 Q 24 -10 28 0 Q 24 8 14 14 Q 4 8 0 0 Z",
  // Pointed leaf
  "M 0 0 Q 10 -16 16 -28 Q 22 -16 26 0 Q 22 4 16 12 Q 10 4 0 0 Z",
];

const LEAVES = Array.from({ length: 14 }).map((_, i) => {
  const path = LEAF_PATHS[i % LEAF_PATHS.length];
  const startX = (i * 17 + 5) % 100;
  const drift = -8 - (i % 5) * 4;
  const rotate = (i * 53) % 360;
  const rotateEnd = rotate + (i % 2 === 0 ? 220 : -180);
  const duration = 22 + (i % 5) * 4;
  const delay = (i * 1.7) % 18;
  const scale = 0.55 + ((i * 13) % 7) * 0.08;
  const isAmber = i % 4 === 0;
  return { i, path, startX, drift, rotate, rotateEnd, duration, delay, scale, isAmber };
});

export function LeafyBackground() {
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
          "linear-gradient(180deg, #0a1812 0%, #0e2018 30%, #112619 65%, #0c1a12 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "-15%",
          background:
            "radial-gradient(ellipse 55% 40% at 25% 15%, rgba(170, 140, 60, 0.18) 0%, transparent 65%)",
          animation: "leafyDappleA 24s ease-in-out infinite alternate",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "-15%",
          background:
            "radial-gradient(ellipse 65% 45% at 75% 80%, rgba(80, 130, 70, 0.18) 0%, transparent 65%)",
          animation: "leafyDappleB 30s ease-in-out infinite alternate",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "-10%",
          background:
            "radial-gradient(ellipse 40% 30% at 60% 40%, rgba(200, 170, 90, 0.10) 0%, transparent 70%)",
          animation: "leafyDappleC 36s ease-in-out infinite alternate",
        }}
      />

      <svg
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id="canopyTop" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="rgba(20, 50, 28, 0.55)" />
            <stop offset="1" stopColor="rgba(20, 50, 28, 0)" />
          </linearGradient>
          <linearGradient id="canopyBot" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="rgba(15, 38, 22, 0)" />
            <stop offset="1" stopColor="rgba(15, 38, 22, 0.6)" />
          </linearGradient>
        </defs>

        <path
          d="M 0 0 L 1200 0 L 1200 95 Q 1100 130 1000 105 Q 920 85 850 110 Q 780 135 700 105 Q 620 80 540 110 Q 460 140 380 105 Q 300 75 220 110 Q 140 145 60 110 Q 25 100 0 95 Z"
          fill="url(#canopyTop)"
        />
        <path
          d="M 0 720 Q 100 700 180 720 Q 260 740 350 720 Q 430 700 520 720 Q 610 745 700 720 Q 790 700 870 720 Q 950 740 1040 720 Q 1120 705 1200 720 L 1200 800 L 0 800 Z"
          fill="url(#canopyBot)"
        />
      </svg>

      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
      >
        {LEAVES.map((leaf) => (
          <g
            key={leaf.i}
            style={{
              transformOrigin: "center",
              animation: `leafyFall${leaf.i % 3} ${leaf.duration}s linear ${leaf.delay}s infinite, leafySpin${leaf.i % 2} ${leaf.duration}s ease-in-out ${leaf.delay}s infinite`,
            }}
          >
            <g transform={`translate(${leaf.startX}vw, -40) scale(${leaf.scale}) rotate(${leaf.rotate})`}>
              <path
                d={leaf.path}
                fill={
                  leaf.isAmber
                    ? "rgba(190, 140, 60, 0.55)"
                    : "rgba(70, 110, 65, 0.6)"
                }
              />
            </g>
          </g>
        ))}
      </svg>

      <style>{`
        @keyframes leafyDappleA {
          from { opacity: 0.65; transform: translate(0, 0); }
          to   { opacity: 1;    transform: translate(25px, 18px); }
        }
        @keyframes leafyDappleB {
          from { opacity: 0.55; transform: translate(0, 0); }
          to   { opacity: 1;    transform: translate(-30px, -15px); }
        }
        @keyframes leafyDappleC {
          from { opacity: 0.4;  transform: translate(0, 0); }
          to   { opacity: 0.9;  transform: translate(15px, -20px); }
        }
        @keyframes leafyFall0 {
          0%   { transform: translate(0, 0); opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translate(-12vw, 115vh); opacity: 0; }
        }
        @keyframes leafyFall1 {
          0%   { transform: translate(0, 0); opacity: 0; }
          10%  { opacity: 1; }
          88%  { opacity: 1; }
          100% { transform: translate(-22vw, 115vh); opacity: 0; }
        }
        @keyframes leafyFall2 {
          0%   { transform: translate(0, 0); opacity: 0; }
          12%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translate(-4vw, 115vh); opacity: 0; }
        }
        @keyframes leafySpin0 {
          0%   { rotate: 0deg; }
          100% { rotate: 360deg; }
        }
        @keyframes leafySpin1 {
          0%   { rotate: 0deg; }
          100% { rotate: -300deg; }
        }
      `}</style>
    </div>
  );
}

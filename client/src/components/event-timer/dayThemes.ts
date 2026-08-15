export const DAY_THEMES: Record<number, { label: string; sky: string; horizon: string }> = {
  1: {
    label: "Day One · Morning",
    sky: "linear-gradient(180deg, #0d1f3d 0%, #17396a 34%, #3d72a8 64%, #86b8d8 88%, #cfe3ee 100%)",
    horizon: "#0a1830",
  },
  2: {
    label: "Day Two · Evening",
    sky: "linear-gradient(180deg, #55190a 0%, #973b0e 34%, #d97a2e 64%, #f0b06a 88%, #fbdfb8 100%)",
    horizon: "#3d1206",
  },
  3: {
    label: "Day Three · Night",
    sky: "linear-gradient(180deg, #250c38 0%, #4a2160 34%, #7c4489 64%, #b287bb 88%, #ddc7e0 100%)",
    horizon: "#1b0828",
  },
};

import { useEffect, useRef } from "react";

export function StaticNoise() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Low-res for performance
    canvas.width = 128;
    canvas.height = 128;

    let animId: number;
    let lastFrame = 0;
    const FPS = 8; // Low FPS for subtle effect
    const interval = 1000 / FPS;

    function draw(time: number) {
      if (time - lastFrame >= interval) {
        const imageData = ctx!.createImageData(128, 128);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const v = Math.random() * 255;
          data[i] = v;
          data[i + 1] = v;
          data[i + 2] = v;
          data[i + 3] = 12; // Very low opacity
        }
        ctx!.putImageData(imageData, 0, 0);
        lastFrame = time;
      }
      animId = requestAnimationFrame(draw);
    }
    animId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animId);
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
        zIndex: 10,
        imageRendering: "pixelated",
        opacity: 0.5,
      }}
    />
  );
}

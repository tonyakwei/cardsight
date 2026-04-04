import { useState, useEffect } from "react";

export function VisibilityGuard() {
  const [hidden, setHidden] = useState(false);
  const [fadingIn, setFadingIn] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      if (document.hidden) {
        setHidden(true);
        setFadingIn(false);
      } else {
        // Delay removal so the overlay is visible when they return
        setFadingIn(true);
        setTimeout(() => {
          setHidden(false);
          setFadingIn(false);
        }, 400);
      }
    };

    document.addEventListener("visibilitychange", handleChange);
    return () => document.removeEventListener("visibilitychange", handleChange);
  }, []);

  if (!hidden) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "var(--card-bg-color, #0a0a0a)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1rem",
        opacity: fadingIn ? 0 : 1,
        transition: "opacity 0.35s ease-out",
      }}
    >
      <div
        style={{
          fontSize: "0.85rem",
          color: "var(--card-accent-color, #4fc3f7)",
          opacity: 0.6,
          fontFamily: "var(--card-font-family, system-ui)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        Return to continue
      </div>
    </div>
  );
}

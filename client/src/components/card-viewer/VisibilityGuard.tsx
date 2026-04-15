import { useState, useEffect, useRef } from "react";

const BLUR_DURATION_MS = 5000;

interface Props {
  nudgeEnabled?: boolean;
}

export function VisibilityGuard({ nudgeEnabled = false }: Props) {
  const [hidden, setHidden] = useState(false);
  const [fadingIn, setFadingIn] = useState(false);
  const clearTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleChange = () => {
      if (document.hidden) {
        setHidden(true);
        setFadingIn(false);
        if (clearTimer.current) clearTimeout(clearTimer.current);
      } else if (nudgeEnabled) {
        // Keep overlay visible for BLUR_DURATION_MS with nudge message
        clearTimer.current = setTimeout(() => {
          setFadingIn(true);
          setTimeout(() => {
            setHidden(false);
            setFadingIn(false);
          }, 400);
        }, BLUR_DURATION_MS);
      } else {
        // Original behavior — fade out quickly
        setFadingIn(true);
        setTimeout(() => {
          setHidden(false);
          setFadingIn(false);
        }, 400);
      }
    };

    document.addEventListener("visibilitychange", handleChange);
    return () => {
      document.removeEventListener("visibilitychange", handleChange);
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, [nudgeEnabled]);

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
        gap: "1.5rem",
        padding: "2rem",
        opacity: fadingIn ? 0 : 1,
        transition: "opacity 0.35s ease-out",
      }}
    >
      {nudgeEnabled ? (
        <>
          <div
            style={{
              fontSize: "0.95rem",
              color: "var(--card-accent-color, #4fc3f7)",
              fontFamily: "var(--card-font-family, system-ui)",
              lineHeight: 1.7,
              textAlign: "center",
              maxWidth: "280px",
              fontStyle: "italic",
            }}
          >
            You put the item down and now you're scrambling to find where you
            placed it...
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              opacity: 0.5,
              fontFamily: "var(--card-font-family, system-ui)",
              textAlign: "center",
              maxWidth: "260px",
            }}
          >
            What if you'd just written down the key details?
          </div>
        </>
      ) : (
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
      )}
    </div>
  );
}

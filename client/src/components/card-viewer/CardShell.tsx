import type { ReactNode } from "react";
import type { CardDesign } from "@cardsight/shared";

interface Props {
  design: CardDesign | null;
  children: ReactNode;
}

export function CardShell({ design, children }: Props) {
  const d = design;

  const style: React.CSSProperties = {
    "--card-bg-color": d?.bgColor ?? "#0a0a0a",
    "--card-bg-gradient": d?.bgGradient ?? "none",
    "--card-text-color": d?.textColor ?? "#e0e0e0",
    "--card-accent-color": d?.accentColor ?? "#4fc3f7",
    "--card-secondary-color": d?.secondaryColor ?? d?.accentColor ?? "#4fc3f7",
    "--card-font-family": d?.fontFamily ?? "system-ui",
    "--card-border-style": d?.borderStyle ?? "none",

    minHeight: "100dvh",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "2rem 1.25rem",
    position: "relative",
    overflow: "hidden",

    background: d?.bgGradient ?? d?.bgColor ?? "#0a0a0a",
    color: d?.textColor ?? "#e0e0e0",
    fontFamily: d?.fontFamily ?? "system-ui",
    border: d?.borderStyle ?? "none",
  } as React.CSSProperties;

  if (d?.bgImageUrl) {
    style.backgroundImage = `url(${d.bgImageUrl})`;
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
  }

  return (
    <div style={style}>
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {children}
      </div>

      {d?.customCss && <style dangerouslySetInnerHTML={{ __html: d.customCss }} />}
    </div>
  );
}

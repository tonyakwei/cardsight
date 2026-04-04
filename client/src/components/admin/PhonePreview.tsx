import { useState, useRef } from "react";
import { ActionIcon, Tooltip } from "@mantine/core";

interface Props {
  cardId: string;
}

export function PhonePreview({ cardId }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0);

  const refresh = () => setKey((k) => k + 1);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <span
          style={{
            fontSize: "0.7rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--mantine-color-dimmed)",
          }}
        >
          Player Preview
        </span>
        <Tooltip label="Refresh preview">
          <ActionIcon variant="subtle" size="sm" onClick={refresh} color="yellow">
            ↻
          </ActionIcon>
        </Tooltip>
      </div>
      <div
        style={{
          width: "280px",
          height: "500px",
          borderRadius: "24px",
          border: "3px solid var(--mantine-color-dark-4)",
          overflow: "hidden",
          background: "#000",
          position: "relative",
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100px",
            height: "20px",
            background: "var(--mantine-color-dark-4)",
            borderRadius: "0 0 12px 12px",
            zIndex: 2,
          }}
        />
        <iframe
          ref={iframeRef}
          key={key}
          src={`/c/${cardId}`}
          style={{
            width: "375px",
            height: "667px",
            border: "none",
            transform: "scale(0.746)",
            transformOrigin: "top left",
          }}
          title="Card Preview"
        />
      </div>
    </div>
  );
}

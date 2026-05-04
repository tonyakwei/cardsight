import { Portal, Text } from "@mantine/core";

interface Props {
  visible: boolean;
  message?: string;
}

export function SavedToast({ visible, message = "Saved" }: Props) {
  return (
    <Portal>
      <div
        aria-hidden={!visible}
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
          opacity: visible ? 1 : 0,
          transition: "opacity 200ms ease, transform 200ms ease",
          pointerEvents: "none",
          zIndex: 9999,
          padding: "10px 18px",
          borderRadius: 999,
          background: "rgba(15, 30, 25, 0.95)",
          border: "1px solid rgba(105, 240, 174, 0.35)",
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.35)",
        }}
      >
        <Text size="sm" c="teal.3" fw={500}>
          {message}
        </Text>
      </div>
    </Portal>
  );
}

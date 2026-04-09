import { Collapse, Group, Text, UnstyledButton } from "@mantine/core";
import { useSectionOpen } from "../../hooks/useSectionCollapse";

interface Props {
  sectionKey: string;
  label: string;
  children: React.ReactNode;
}

export function CollapsibleSection({ sectionKey, label, children }: Props) {
  const [open, toggle] = useSectionOpen(sectionKey);

  return (
    <div>
      <UnstyledButton onClick={toggle} w="100%">
        <Group gap={6} mb={open ? 6 : 0}>
          <Text size="xs" c="dimmed" style={{ width: 12, textAlign: "center" }}>
            {open ? "▾" : "▸"}
          </Text>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" lts="0.06em">
            {label}
          </Text>
        </Group>
      </UnstyledButton>
      <Collapse in={open}>
        {children}
      </Collapse>
    </div>
  );
}

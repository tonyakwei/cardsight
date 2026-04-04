import { useState } from "react";
import { Group, Text, Select, Button } from "@mantine/core";
import type { AdminDesign, AdminCardSet } from "../../api/admin";

interface Props {
  selectedCount: number;
  designs: AdminDesign[];
  cardSets: AdminCardSet[];
  onApply: (action: string, value?: any) => Promise<void>;
  onClearSelection: () => void;
}

export function BulkActionBar({
  selectedCount,
  designs,
  cardSets,
  onApply,
  onClearSelection,
}: Props) {
  const [action, setAction] = useState<string | null>(null);
  const [value, setValue] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const needsValue = action === "assignDesign" || action === "assignCardSet" || action === "setAct";

  const valueData =
    action === "assignDesign"
      ? [{ value: "", label: "(None)" }, ...designs.map((d) => ({ value: d.id, label: d.name }))]
      : action === "assignCardSet"
        ? [{ value: "", label: "(None)" }, ...cardSets.map((s) => ({ value: s.id, label: s.name }))]
        : action === "setAct"
          ? [{ value: "", label: "(None)" }, { value: "1", label: "Act 1" }, { value: "2", label: "Act 2" }, { value: "3", label: "Act 3" }]
          : [];

  const handleApply = async () => {
    if (!action) return;
    setApplying(true);
    try {
      let resolvedValue: any = undefined;
      if (action === "assignDesign" || action === "assignCardSet") {
        resolvedValue = value || null;
      } else if (action === "setAct") {
        resolvedValue = value ? Number(value) : null;
      }
      await onApply(action, resolvedValue);
      setAction(null);
      setValue(null);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Group
      p="sm"
      px="md"
      mb="md"
      justify="space-between"
      style={{
        borderRadius: "8px",
        background: "rgba(212, 168, 67, 0.1)",
        border: "1px solid rgba(212, 168, 67, 0.3)",
        position: "sticky",
        top: 56,
        zIndex: 10,
      }}
    >
      <Group gap="md">
        <Text size="sm" fw={600} c="yellow.5">
          {selectedCount} card{selectedCount !== 1 ? "s" : ""} selected
        </Text>
        <Select
          size="xs"
          placeholder="Choose action..."
          value={action}
          onChange={(v) => { setAction(v); setValue(null); }}
          data={[
            { group: "Assign", items: [
              { value: "assignDesign", label: "Set Design" },
              { value: "assignCardSet", label: "Set Card Set" },
              { value: "setAct", label: "Set Act" },
            ]},
            { group: "Status", items: [
              { value: "lock", label: "Lock" },
              { value: "unlock", label: "Unlock" },
              { value: "markFinished", label: "Mark Finished" },
              { value: "markUnfinished", label: "Mark Unfinished" },
            ]},
            { group: "Dangerous", items: [
              { value: "delete", label: "Delete" },
              { value: "resetRuntime", label: "Reset Runtime" },
            ]},
          ]}
          style={{ width: 180 }}
        />
        {needsValue && (
          <Select
            size="xs"
            placeholder="Select value..."
            value={value}
            onChange={setValue}
            data={valueData}
            style={{ width: 200 }}
          />
        )}
        <Button
          size="xs"
          color={action === "delete" || action === "resetRuntime" ? "red" : "yellow"}
          onClick={handleApply}
          disabled={!action || (needsValue && value === null)}
          loading={applying}
        >
          Apply
        </Button>
      </Group>
      <Button size="xs" variant="subtle" color="gray" onClick={onClearSelection}>
        Clear
      </Button>
    </Group>
  );
}

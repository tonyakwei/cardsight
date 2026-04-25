import { useEffect, useState, useCallback } from "react";
import {
  Stack,
  TextInput,
  Textarea,
  Switch,
  NumberInput,
  Text,
  Group,
  Button,
  Badge,
  ActionIcon,
  Loader,
  Divider,
} from "@mantine/core";
import {
  fetchAnswerTemplate,
  createAnswerTemplate,
  updateAnswerTemplate,
} from "../../api/admin";
import type { MultipleAnswerTemplate, MultipleAnswerField } from "@cardsight/shared";

interface Props {
  gameId: string;
  answerId: string | null;
  onAnswerCreated: (type: string, id: string) => void;
}

const emptyField = (): MultipleAnswerField => ({
  prompt: null,
  correctAnswer: "",
  acceptAlternatives: [],
  caseSensitive: false,
  trimWhitespace: true,
});

export function MultipleAnswerEditor({ gameId, answerId, onAnswerCreated }: Props) {
  const [template, setTemplate] = useState<MultipleAnswerTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fields, setFields] = useState<MultipleAnswerField[]>([emptyField(), emptyField()]);
  const [hint, setHint] = useState("");
  const [hintAfterAttempts, setHintAfterAttempts] = useState(3);
  const [maxAttempts, setMaxAttempts] = useState<number | null>(null);

  // Per-field "alternative input" buffer for the tag-input UI
  const [altInputs, setAltInputs] = useState<string[]>([]);

  useEffect(() => {
    if (!answerId) {
      setTemplate(null);
      return;
    }
    setLoading(true);
    fetchAnswerTemplate(gameId, "multiple_text", answerId)
      .then((t) => {
        const tt = t as MultipleAnswerTemplate;
        setTemplate(tt);
        const loadedFields = (tt.fields ?? []).map((f) => ({
          prompt: f.prompt ?? null,
          correctAnswer: f.correctAnswer ?? "",
          acceptAlternatives: f.acceptAlternatives ?? [],
          caseSensitive: f.caseSensitive ?? false,
          trimWhitespace: f.trimWhitespace ?? true,
        }));
        setFields(loadedFields.length > 0 ? loadedFields : [emptyField()]);
        setAltInputs(loadedFields.map(() => ""));
        setHint(tt.hint ?? "");
        setHintAfterAttempts(tt.hintAfterAttempts);
        setMaxAttempts(tt.maxAttempts);
      })
      .catch(() => setTemplate(null))
      .finally(() => setLoading(false));
  }, [gameId, answerId]);

  // Keep altInputs length aligned with fields length
  useEffect(() => {
    setAltInputs((prev) => {
      if (prev.length === fields.length) return prev;
      const next = [...prev];
      while (next.length < fields.length) next.push("");
      return next.slice(0, fields.length);
    });
  }, [fields.length]);

  const updateField = (idx: number, patch: Partial<MultipleAnswerField>) => {
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  const addField = () => setFields((prev) => [...prev, emptyField()]);
  const removeField = (idx: number) => {
    if (fields.length <= 1) return;
    setFields((prev) => prev.filter((_, i) => i !== idx));
  };

  const addAlternative = (idx: number) => {
    const val = (altInputs[idx] ?? "").trim();
    if (!val) return;
    const current = fields[idx].acceptAlternatives;
    if (current.includes(val)) return;
    updateField(idx, { acceptAlternatives: [...current, val] });
    setAltInputs((prev) => prev.map((v, i) => (i === idx ? "" : v)));
  };

  const removeAlternative = (idx: number, altIdx: number) => {
    const current = fields[idx].acceptAlternatives;
    updateField(idx, {
      acceptAlternatives: current.filter((_, i) => i !== altIdx),
    });
  };

  const save = useCallback(async () => {
    setSaving(true);
    const data = {
      fields,
      hint: hint.trim() || null,
      hintAfterAttempts,
      maxAttempts,
    };

    if (template && answerId) {
      const updated = (await updateAnswerTemplate(
        gameId,
        "multiple_text",
        answerId,
        data,
      )) as MultipleAnswerTemplate;
      setTemplate(updated);
    } else {
      const created = (await createAnswerTemplate(
        gameId,
        "multiple_text",
        data,
      )) as MultipleAnswerTemplate;
      setTemplate(created);
      onAnswerCreated("multiple_text", created.id);
    }
    setSaving(false);
  }, [
    gameId, answerId, template, fields, hint, hintAfterAttempts, maxAttempts, onAnswerCreated,
  ]);

  if (loading) return <Loader size="xs" color="yellow" />;

  const allValid = fields.every((f) => f.correctAnswer.trim().length > 0);
  const hasChanges = template
    ? JSON.stringify(fields) !== JSON.stringify(template.fields) ||
      hint !== (template.hint ?? "") ||
      hintAfterAttempts !== template.hintAfterAttempts ||
      maxAttempts !== template.maxAttempts
    : allValid;

  return (
    <Stack
      gap="xs"
      p="sm"
      style={{
        borderRadius: "6px",
        border: "1px solid var(--mantine-color-dark-5)",
        background: "rgba(255, 200, 0, 0.02)",
      }}
    >
      <Group justify="space-between" align="center">
        <Text size="xs" fw={600} c="yellow.5">
          Multi-Text Answer Template {template ? "" : "(new)"}
        </Text>
        <Button
          size="xs"
          variant="subtle"
          color="yellow"
          onClick={addField}
        >
          + Add field
        </Button>
      </Group>

      {fields.map((field, idx) => (
        <div
          key={idx}
          style={{
            border: "1px solid var(--mantine-color-dark-5)",
            borderRadius: "4px",
            padding: "0.5rem",
          }}
        >
          <Group justify="space-between" align="center" mb={4}>
            <Text size="xs" fw={500} c="dimmed">
              Field {idx + 1}
            </Text>
            <ActionIcon
              size="xs"
              variant="transparent"
              color="red"
              onClick={() => removeField(idx)}
              disabled={fields.length <= 1}
              title="Remove field"
            >
              x
            </ActionIcon>
          </Group>

          <Stack gap={6}>
            <TextInput
              label="Prompt / label (optional)"
              size="xs"
              placeholder="e.g. First derived concept"
              value={field.prompt ?? ""}
              onChange={(e) =>
                updateField(idx, { prompt: e.target.value || null })
              }
            />

            <TextInput
              label="Correct answer"
              size="xs"
              placeholder="Required answer for this field..."
              value={field.correctAnswer}
              onChange={(e) => updateField(idx, { correctAnswer: e.target.value })}
              required
            />

            <div>
              <Text size="xs" fw={500} mb={4}>
                Accepted alternatives
              </Text>
              {field.acceptAlternatives.length > 0 && (
                <Group gap={4} mb="xs">
                  {field.acceptAlternatives.map((alt, altIdx) => (
                    <Badge
                      key={altIdx}
                      size="sm"
                      variant="filled"
                      color="dark"
                      rightSection={
                        <ActionIcon
                          size={14}
                          variant="transparent"
                          color="gray"
                          onClick={() => removeAlternative(idx, altIdx)}
                        >
                          x
                        </ActionIcon>
                      }
                    >
                      {alt}
                    </Badge>
                  ))}
                </Group>
              )}
              <Group gap="xs">
                <TextInput
                  size="xs"
                  placeholder="Add alternative..."
                  value={altInputs[idx] ?? ""}
                  onChange={(e) =>
                    setAltInputs((prev) =>
                      prev.map((v, i) => (i === idx ? e.target.value : v)),
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAlternative(idx);
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  size="xs"
                  variant="light"
                  color="gray"
                  onClick={() => addAlternative(idx)}
                  disabled={!(altInputs[idx] ?? "").trim()}
                >
                  Add
                </Button>
              </Group>
            </div>

            <Group grow>
              <Switch
                size="xs"
                label={<Text size="xs">Case sensitive</Text>}
                checked={field.caseSensitive}
                onChange={(e) =>
                  updateField(idx, { caseSensitive: e.currentTarget.checked })
                }
              />
              <Switch
                size="xs"
                label={<Text size="xs">Trim whitespace</Text>}
                checked={field.trimWhitespace}
                onChange={(e) =>
                  updateField(idx, { trimWhitespace: e.currentTarget.checked })
                }
              />
            </Group>
          </Stack>
        </div>
      ))}

      <Divider my="xs" />

      <Textarea
        label="Hint (shown after N wrong attempts)"
        size="xs"
        autosize
        minRows={1}
        maxRows={3}
        placeholder="Optional hint shown after a failure..."
        value={hint}
        onChange={(e) => setHint(e.target.value)}
      />

      <Group grow>
        <NumberInput
          label="Show hint after N attempts"
          size="xs"
          min={1}
          max={20}
          value={hintAfterAttempts}
          onChange={(val) => setHintAfterAttempts(Number(val) || 3)}
        />
        <NumberInput
          label="Lock out after N attempts"
          size="xs"
          min={1}
          max={50}
          placeholder="No limit"
          value={maxAttempts ?? ""}
          onChange={(val) => setMaxAttempts(val ? Number(val) : null)}
          allowDecimal={false}
        />
      </Group>

      <Group justify="flex-end">
        <Button
          size="xs"
          color="yellow"
          loading={saving}
          disabled={!hasChanges || !allValid}
          onClick={save}
        >
          {template ? "Update Answer" : "Create Answer"}
        </Button>
      </Group>
    </Stack>
  );
}

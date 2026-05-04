import { useEffect, useRef, useState, useCallback } from "react";
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
import { SavedToast } from "./SavedToast";

interface Props {
  gameId: string;
  answerId: string | null;
  onAnswerCreated: (type: string, id: string) => void;
}

interface SaveData {
  fields: MultipleAnswerField[];
  hint: string | null;
  hintEnabled: boolean;
  hintAfterAttempts: number;
  maxAttempts: number | null;
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
  const [savedFlash, setSavedFlash] = useState(false);

  const [fields, setFields] = useState<MultipleAnswerField[]>([emptyField(), emptyField()]);
  const [hint, setHint] = useState("");
  const [hintEnabled, setHintEnabled] = useState(false);
  const [hintAfterAttempts, setHintAfterAttempts] = useState(3);
  const [maxAttempts, setMaxAttempts] = useState<number | null>(null);

  // Per-field "alternative input" buffer for the tag-input UI
  const [altInputs, setAltInputs] = useState<string[]>([]);

  // Save coordination
  const savingRef = useRef(false);
  const pendingRef = useRef<SaveData | null>(null);
  const lastSavedRef = useRef<SaveData | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!answerId) {
      setTemplate(null);
      lastSavedRef.current = null;
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
        const initialFields = loadedFields.length > 0 ? loadedFields : [emptyField()];
        setFields(initialFields);
        setAltInputs(initialFields.map(() => ""));
        setHint(tt.hint ?? "");
        setHintEnabled(tt.hintEnabled);
        setHintAfterAttempts(tt.hintAfterAttempts);
        setMaxAttempts(tt.maxAttempts);
        lastSavedRef.current = {
          fields: initialFields,
          hint: tt.hint ?? null,
          hintEnabled: tt.hintEnabled,
          hintAfterAttempts: tt.hintAfterAttempts,
          maxAttempts: tt.maxAttempts,
        };
      })
      .catch(() => {
        setTemplate(null);
        lastSavedRef.current = null;
      })
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

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  const flashSaved = useCallback(() => {
    setSavedFlash(true);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setSavedFlash(false), 1500);
  }, []);

  const performSave = useCallback(
    async (data: SaveData): Promise<void> => {
      // All fields must have a non-empty correctAnswer (preserve old disabled semantics)
      if (!data.fields.every((f) => f.correctAnswer.trim().length > 0)) return;

      if (savingRef.current) {
        pendingRef.current = data;
        return;
      }

      savingRef.current = true;
      try {
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
        lastSavedRef.current = data;
        flashSaved();
      } finally {
        savingRef.current = false;
        const queued = pendingRef.current;
        pendingRef.current = null;
        if (queued && JSON.stringify(queued) !== JSON.stringify(data)) {
          void performSave(queued);
        }
      }
    },
    [gameId, answerId, template, onAnswerCreated, flashSaved],
  );

  const buildData = useCallback(
    (overrides: Partial<SaveData> = {}): SaveData => ({
      fields,
      hint: hint.trim() || null,
      hintEnabled,
      hintAfterAttempts,
      maxAttempts,
      ...overrides,
    }),
    [fields, hint, hintEnabled, hintAfterAttempts, maxAttempts],
  );

  const saveIfChanged = useCallback(
    (data: SaveData) => {
      const last = lastSavedRef.current;
      if (last && JSON.stringify(last) === JSON.stringify(data)) return;
      void performSave(data);
    },
    [performSave],
  );

  // Functional update helpers that also trigger a save with the new fields
  const mutateFieldsAndSave = (mutator: (prev: MultipleAnswerField[]) => MultipleAnswerField[]) => {
    setFields((prev) => {
      const next = mutator(prev);
      saveIfChanged(buildData({ fields: next }));
      return next;
    });
  };

  const updateField = (idx: number, patch: Partial<MultipleAnswerField>) => {
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  // Used for text-input blurs on prompt/correctAnswer — fields state has already been
  // updated character by character; on blur, push the latest fields snapshot.
  const blurField = () => {
    saveIfChanged(buildData());
  };

  const addField = () => {
    mutateFieldsAndSave((prev) => [...prev, emptyField()]);
  };

  const removeField = (idx: number) => {
    if (fields.length <= 1) return;
    mutateFieldsAndSave((prev) => prev.filter((_, i) => i !== idx));
  };

  const addAlternative = (idx: number) => {
    const val = (altInputs[idx] ?? "").trim();
    if (!val) return;
    const current = fields[idx].acceptAlternatives;
    if (current.includes(val)) return;
    const newField = { ...fields[idx], acceptAlternatives: [...current, val] };
    mutateFieldsAndSave((prev) => prev.map((f, i) => (i === idx ? newField : f)));
    setAltInputs((prev) => prev.map((v, i) => (i === idx ? "" : v)));
  };

  const removeAlternative = (idx: number, altIdx: number) => {
    const current = fields[idx].acceptAlternatives;
    const newField = {
      ...fields[idx],
      acceptAlternatives: current.filter((_, i) => i !== altIdx),
    };
    mutateFieldsAndSave((prev) => prev.map((f, i) => (i === idx ? newField : f)));
  };

  if (loading) return <Loader size="xs" color="yellow" />;

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
        <Group gap="xs">
          <Button
            size="xs"
            variant="subtle"
            color="yellow"
            onClick={addField}
          >
            + Add field
          </Button>
        </Group>
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
              onBlur={blurField}
            />

            <TextInput
              label="Correct answer"
              size="xs"
              placeholder="Required answer for this field..."
              value={field.correctAnswer}
              onChange={(e) => updateField(idx, { correctAnswer: e.target.value })}
              onBlur={blurField}
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
                onChange={(e) => {
                  const v = e.currentTarget.checked;
                  const newField = { ...fields[idx], caseSensitive: v };
                  mutateFieldsAndSave((prev) =>
                    prev.map((f, i) => (i === idx ? newField : f)),
                  );
                }}
              />
              <Switch
                size="xs"
                label={<Text size="xs">Trim whitespace</Text>}
                checked={field.trimWhitespace}
                onChange={(e) => {
                  const v = e.currentTarget.checked;
                  const newField = { ...fields[idx], trimWhitespace: v };
                  mutateFieldsAndSave((prev) =>
                    prev.map((f, i) => (i === idx ? newField : f)),
                  );
                }}
              />
            </Group>
          </Stack>
        </div>
      ))}

      <Divider my="xs" />

      <Switch
        size="xs"
        label={<Text size="xs">Show hint to players</Text>}
        checked={hintEnabled}
        onChange={(e) => {
          const v = e.currentTarget.checked;
          setHintEnabled(v);
          saveIfChanged(buildData({ hintEnabled: v }));
        }}
      />

      {hintEnabled && (
        <>
          <Textarea
            label="Hint (shown after N wrong attempts)"
            size="xs"
            autosize
            minRows={1}
            maxRows={3}
            placeholder="Optional hint shown after a failure..."
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            onBlur={() => saveIfChanged(buildData())}
          />
          <NumberInput
            label="Show hint after N attempts"
            size="xs"
            min={1}
            max={20}
            value={hintAfterAttempts}
            onChange={(val) => {
              const n = Number(val) || 3;
              setHintAfterAttempts(n);
              saveIfChanged(buildData({ hintAfterAttempts: n }));
            }}
          />
        </>
      )}

      <NumberInput
        label="Lock out after N attempts"
        size="xs"
        min={1}
        max={50}
        placeholder="No limit"
        value={maxAttempts ?? ""}
        onChange={(val) => {
          const n = val ? Number(val) : null;
          setMaxAttempts(n);
          saveIfChanged(buildData({ maxAttempts: n }));
        }}
        allowDecimal={false}
      />
      <SavedToast visible={savedFlash} />
    </Stack>
  );
}

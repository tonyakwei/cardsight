import { prisma } from "../lib/prisma.js";

interface MultipleAnswerField {
  prompt?: string | null;
  correctAnswer: string;
  acceptAlternatives?: string[];
  caseSensitive?: boolean;
  trimWhitespace?: boolean;
}

function normalizeField(value: string, field: MultipleAnswerField): string {
  let result = value;
  if (field.trimWhitespace !== false) result = result.trim();
  if (!field.caseSensitive) result = result.toLowerCase();
  return result;
}

function fieldMatches(given: string, field: MultipleAnswerField): boolean {
  const normalizedGiven = normalizeField(given, field);
  const normalizedCorrect = normalizeField(field.correctAnswer, field);
  if (normalizedGiven === normalizedCorrect) return true;
  return (field.acceptAlternatives ?? []).some(
    (alt) => normalizeField(alt, field) === normalizedGiven,
  );
}

export interface ValidationResult {
  correct: boolean;
  fieldResults?: boolean[];
}

export async function validateAnswer(
  type: string,
  answerId: string,
  answer: string | string[] | Record<string, string>,
): Promise<ValidationResult> {
  if (type === "single_answer") {
    const template = await prisma.singleAnswer.findUnique({
      where: { id: answerId },
    });
    if (!template) return { correct: false };

    const given = typeof answer === "string" ? answer : String(answer);
    const normalize = (s: string) => {
      let result = s;
      if (template.trimWhitespace) result = result.trim();
      if (!template.caseSensitive) result = result.toLowerCase();
      return result;
    };

    const normalizedGiven = normalize(given);
    const normalizedCorrect = normalize(template.correctAnswer);

    if (normalizedGiven === normalizedCorrect) return { correct: true };

    const correct = template.acceptAlternatives.some(
      (alt: string) => normalize(alt) === normalizedGiven,
    );
    return { correct };
  }

  if (type === "multiple_text") {
    const template = await prisma.multipleAnswer.findUnique({
      where: { id: answerId },
    });
    if (!template) return { correct: false };

    const fields = (template.fields as unknown as MultipleAnswerField[]) ?? [];
    if (fields.length === 0) return { correct: false };

    // Normalize incoming answer to Record keyed by field index
    let givenByIdx: Record<string, string>;
    if (Array.isArray(answer)) {
      givenByIdx = Object.fromEntries(answer.map((v, i) => [String(i), v]));
    } else if (typeof answer === "object" && answer !== null) {
      givenByIdx = answer as Record<string, string>;
    } else {
      givenByIdx = { "0": String(answer) };
    }

    const fieldResults = fields.map((field, idx) => {
      const given = givenByIdx[String(idx)];
      if (typeof given !== "string") return false;
      return fieldMatches(given, field);
    });

    return {
      correct: fieldResults.every(Boolean),
      fieldResults,
    };
  }

  // Other types not yet implemented
  return { correct: false };
}

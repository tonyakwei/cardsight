import { prisma } from "../lib/prisma.js";

export async function validateAnswer(
  type: string,
  answerId: string,
  answer: string | string[] | Record<string, string>,
): Promise<boolean> {
  if (type === "single_answer") {
    const template = await prisma.singleAnswer.findUnique({
      where: { id: answerId },
    });
    if (!template) return false;

    const given = typeof answer === "string" ? answer : String(answer);
    const normalize = (s: string) => {
      let result = s;
      if (template.trimWhitespace) result = result.trim();
      if (!template.caseSensitive) result = result.toLowerCase();
      return result;
    };

    const normalizedGiven = normalize(given);
    const normalizedCorrect = normalize(template.correctAnswer);

    if (normalizedGiven === normalizedCorrect) return true;

    return template.acceptAlternatives.some(
      (alt: string) => normalize(alt) === normalizedGiven,
    );
  }

  // Other types not yet implemented
  return false;
}

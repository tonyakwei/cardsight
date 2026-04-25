import { useCallback } from "react";
import { postAnswer } from "../../../api/cards";
import { getSessionHash } from "../../../utils/session";
import { MultiTextAnswerInput } from "../../shared/MultiTextAnswerInput";
import type { AnswerMeta } from "@cardsight/shared";

interface Props {
  cardId: string;
  answerMeta: AnswerMeta | null;
  onSolved: () => void;
}

export function MultipleAnswerInput({ cardId, answerMeta, onSolved }: Props) {
  const handleSubmit = useCallback(
    async (answers: Record<string, string>) => {
      const result = await postAnswer(cardId, answers, getSessionHash());
      return {
        correct: result.correct,
        attemptNumber: result.attemptNumber,
        hint: result.hint,
      };
    },
    [cardId],
  );

  return (
    <MultiTextAnswerInput
      answerMeta={answerMeta}
      onSubmit={handleSubmit}
      onSuccess={onSolved}
    />
  );
}

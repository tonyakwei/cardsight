import { useCallback } from "react";
import { postAnswer } from "../../../api/cards";
import { getSessionHash } from "../../../utils/session";
import { AnswerInput } from "../../shared/AnswerInput";
import type { AnswerMeta } from "@cardsight/shared";

interface Props {
  cardId: string;
  answerMeta: AnswerMeta | null;
  onSolved: () => void;
}

export function SingleAnswerInput({ cardId, answerMeta, onSolved }: Props) {
  const handleSubmit = useCallback(
    async (answer: string) => {
      const result = await postAnswer(cardId, answer, getSessionHash());
      return {
        correct: result.correct,
        attemptNumber: result.attemptNumber,
        hint: result.hint,
      };
    },
    [cardId],
  );

  return (
    <AnswerInput
      answerMeta={answerMeta}
      onSubmit={handleSubmit}
      onSuccess={onSolved}
    />
  );
}

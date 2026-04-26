import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router";
import { fetchCard, postScan, postExamine, CardNotFoundError, CardWrongActError } from "../../api/cards";
import { getSessionHash } from "../../utils/session";
import { CardShell } from "./CardShell";
import { CardContent } from "./CardContent";
import { SplashGate } from "./SplashGate";
import { VisibilityGuard } from "./VisibilityGuard";
import { LoadingState } from "./states/LoadingState";
import { NotFoundState } from "./states/NotFoundState";
import { LockedOutState } from "./states/LockedOutState";
import { SelfDestructedState } from "./states/SelfDestructedState";
import { AlreadyAnsweredState } from "./states/AlreadyAnsweredState";
import { SingleAnswerInput } from "./answers/SingleAnswerInput";
import { MultipleAnswerInput } from "./answers/MultipleAnswerInput";
import { SelfDestructTimer } from "./SelfDestructTimer";
import { AnimationWrapper } from "./animations/AnimationWrapper";
import { OverlayRenderer } from "./overlays/OverlayRenderer";
import { PhysicalCardFlash, isPhysicalCard } from "./PhysicalCardFlash";
import type { CardViewerResponse, HistoryTimelineScanResult } from "@cardsight/shared";

export function CardViewer() {
  const { cardId } = useParams<{ cardId: string }>();
  const [card, setCard] = useState<CardViewerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [wrongAct, setWrongAct] = useState(false);
  const [examined, setExamined] = useState(false);
  const [justSolved, setJustSolved] = useState(false);
  const [timelineResult, setTimelineResult] = useState<HistoryTimelineScanResult | null>(null);
  const [scanResolved, setScanResolved] = useState(false);
  const [flashDone, setFlashDone] = useState(
    () => !cardId || !isPhysicalCard(cardId),
  );

  const loadCard = useCallback(async () => {
    if (!cardId) return;
    setScanResolved(false);
    setTimelineResult(null);
    try {
      const data = await fetchCard(cardId);
      setCard(data);

      // Skip splash for non-available states, direct-view cards, or already-examined cards
      if (
        data.status !== "available" ||
        data.isExamined ||
        data.subtype === "history" ||
        data.subtype === "reference"
      ) {
        setExamined(true);
      }
    } catch (err) {
      if (err instanceof CardNotFoundError) {
        setNotFound(true);
      } else if (err instanceof CardWrongActError) {
        setWrongAct(true);
      }
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    loadCard();
  }, [loadCard]);

  // Fire scan event after card loads
  useEffect(() => {
    if (!cardId || !card || card.status === "locked_out") return;
    let cancelled = false;
    const session = getSessionHash();
    if (!(card.subtype === "history" && card.historyTimeline?.isArmed)) {
      setScanResolved(true);
    }
    postScan(cardId, session)
      .then((result) => {
        if (cancelled) return;
        setTimelineResult(result.historyTimeline);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setScanResolved(true);
      });
    return () => {
      cancelled = true;
    };
  }, [cardId, card?.id, card?.status, card?.subtype, card?.historyTimeline?.isArmed]);

  const handleExamine = useCallback(async () => {
    if (!cardId) return;
    const result = await postExamine(cardId);
    setCard((prev) =>
      prev
        ? { ...prev, isExamined: true, selfDestructedAt: result.selfDestructedAt ?? prev.selfDestructedAt }
        : prev,
    );
    setExamined(true);
  }, [cardId]);

  const handleSolved = useCallback(() => {
    setJustSolved(true);
    setCard((prev) =>
      prev ? { ...prev, isSolved: true, status: "answered" } : prev,
    );
  }, []);

  const handleSelfDestruct = useCallback(() => {
    setCard((prev) =>
      prev ? { ...prev, status: "self_destructed" } : prev,
    );
  }, []);

  if (!loading && card && card.subtype !== "history" && !flashDone && cardId) {
    return <PhysicalCardFlash cardId={cardId} act={card?.act ?? undefined} onComplete={() => setFlashDone(true)} />;
  }
  if (loading) return <LoadingState />;
  if (wrongAct) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "100dvh", color: "#888", fontFamily: "system-ui", padding: "2rem", textAlign: "center",
      }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>~</div>
        <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "#aaa", marginBottom: "0.5rem" }}>
          This card is not active right now
        </div>
        <div style={{ fontSize: "0.85rem", color: "#666" }}>
          Check with your host for the current act's cards.
        </div>
      </div>
    );
  }
  if (notFound || !card) return <NotFoundState />;

  const isHistoryCard = card.subtype === "history";
  const isReferenceCard = card.subtype === "reference";
  const isDirectViewCard = isHistoryCard || isReferenceCard;
  const isHistoryVerification = isHistoryCard && !!card.historyTimeline?.isArmed;
  const isComplex = card.complexity === "complex";

  // Only complex cards show the answer input
  const showAnswerInput =
    !isDirectViewCard &&
    isComplex &&
    card.isAnswerable &&
    (card.answerTemplateType === "single_answer" ||
      card.answerTemplateType === "multiple_text") &&
    cardId &&
    !card.isSolved;

  const renderAnswerInput = () => {
    if (!cardId) return null;
    if (card.answerTemplateType === "multiple_text") {
      return (
        <MultipleAnswerInput
          cardId={cardId}
          answerMeta={card.answerMeta}
          onSolved={handleSolved}
        />
      );
    }
    return (
      <SingleAnswerInput
        cardId={cardId}
        answerMeta={card.answerMeta}
        onSolved={handleSolved}
      />
    );
  };

  return (
    <CardShell design={card.design}>
      <OverlayRenderer effect={card.design?.overlayEffect ?? null} />
      {examined && card.status === "available" && !isDirectViewCard && (
        <VisibilityGuard nudgeEnabled={card.blurNudgeEnabled} />
      )}

      {/* Locked out */}
      {card.status === "locked_out" && (
        <AnimationWrapper type="fade">
          <LockedOutState reason={card.lockedOutReason} />
        </AnimationWrapper>
      )}

      {/* Already answered (complex cards that were solved) */}
      {card.status === "answered" && (
        <AnimationWrapper type={card.design?.animationIn ?? "fade"}>
          <AlreadyAnsweredState card={card} justSolved={justSolved} />
        </AnimationWrapper>
      )}

      {/* Self-destructed */}
      {card.status === "self_destructed" && (
        <AnimationWrapper type="fade">
          <SelfDestructedState
            text={card.selfDestructText}
            header={card.answerVisibleAfterDestruct ? card.header : undefined}
          >
            {card.answerVisibleAfterDestruct && showAnswerInput && renderAnswerInput()}
          </SelfDestructedState>
        </AnimationWrapper>
      )}

      {/* Available — show splash gate or content */}
      {card.status === "available" && isHistoryVerification && !scanResolved && (
        <AnimationWrapper type="fade">
          <HistoryTimelineVerificationState state="pending" />
        </AnimationWrapper>
      )}

      {card.status === "available" && isHistoryVerification && scanResolved && timelineResult && (
        <AnimationWrapper type="fade">
          <HistoryTimelineVerificationState state={timelineResult.result} result={timelineResult} />
        </AnimationWrapper>
      )}

      {card.status === "available" && isHistoryVerification && scanResolved && !timelineResult && (
        <AnimationWrapper type="fade">
          <HistoryTimelineVerificationState state="failed" />
        </AnimationWrapper>
      )}

      {card.status === "available" && !examined && (
        <SplashGate
          itemName={card.clueVisibleCategory}
          examineText={card.examineText}
          selfDestructTimer={card.selfDestructTimer}
          onExamine={handleExamine}
        />
      )}

      {card.status === "available" && examined && !isHistoryVerification && (
        <AnimationWrapper type={card.design?.animationIn ?? "fade"}>
          <CardContent
            header={card.header}
            description={card.description}
            itemName={card.clueVisibleCategory}
          />

          {card.selfDestructedAt && (
            <SelfDestructTimer
              deadline={card.selfDestructedAt}
              onExpired={handleSelfDestruct}
            />
          )}

          {showAnswerInput && renderAnswerInput()}
        </AnimationWrapper>
      )}
    </CardShell>
  );
}

function HistoryTimelineVerificationState({
  state,
  result,
}: {
  state: "pending" | "correct" | "failed" | "solved";
  result?: HistoryTimelineScanResult;
}) {
  const colors = {
    pending: "#60a5fa",
    correct: "#4ade80",
    failed: "#f87171",
    solved: "#facc15",
  } as const;

  const titles = {
    pending: "Verifying history...",
    correct: "Sequence confirmed",
    failed: "History incorrect",
    solved: "HISTORY VERIFIED",
  } as const;

  const body =
    state === "pending"
      ? "Checking this position in the timeline."
      : result?.message ?? "The chronology broke. Ask your host to re-arm the timeline check and start again from the first card.";

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {state === "solved" && <TimelineConfetti />}
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          border: `1px solid ${colors[state]}55`,
          borderRadius: 20,
          padding: "1.5rem",
          background: "rgba(0, 0, 0, 0.5)",
          textAlign: "center",
          boxShadow: `0 0 40px ${colors[state]}22`,
        }}
      >
        <div
          style={{
            fontSize: "0.8rem",
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            color: colors[state],
            marginBottom: "0.75rem",
            fontWeight: 700,
          }}
        >
          {titles[state]}
        </div>
        {result && state !== "pending" && (
          <div
            style={{
              fontSize: "2.4rem",
              fontWeight: 800,
              color: "#fff",
              marginBottom: "0.75rem",
              fontFamily: "system-ui",
            }}
          >
            {result.currentIndex}/{result.totalCards}
          </div>
        )}
        <div
          style={{
            color: "#d4d4d8",
            lineHeight: 1.6,
            fontSize: "0.95rem",
          }}
        >
          {body}
        </div>
      </div>
    </div>
  );
}

function TimelineConfetti() {
  const pieces = Array.from({ length: 18 }, (_, index) => index);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {pieces.map((piece) => (
        <div
          key={piece}
          style={{
            position: "absolute",
            top: `${-8 - (piece % 4) * 4}%`,
            left: `${5 + piece * 5}%`,
            width: 10,
            height: 18,
            borderRadius: 2,
            background: ["#facc15", "#4ade80", "#60a5fa", "#f472b6"][piece % 4],
            transform: `rotate(${piece * 17}deg)`,
            opacity: 0.9,
            animation: `history-confetti-fall ${1.6 + (piece % 5) * 0.18}s linear infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes history-confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(115dvh) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

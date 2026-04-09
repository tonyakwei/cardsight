// === Enums ===

export type GameStatus = "draft" | "active" | "completed" | "archived";

export type AnswerTemplateType =
  | "single_answer"
  | "multiple_choice"
  | "multiple_text"
  | "photo_select";

// === API Response Types (Player-Facing) ===

export interface CardDesign {
  bgColor: string;
  bgGradient: string | null;
  bgImageUrl: string | null;
  textColor: string;
  accentColor: string;
  secondaryColor: string | null;
  fontFamily: string;
  cardStyle: string;
  animationIn: string | null;
  borderStyle: string | null;
  overlayEffect: string | null;
  customCss: string | null;
}

export interface CardViewerResponse {
  id: string;
  humanCardId: string;
  title: string;
  description: string | null;
  clueVisibleCategory: string | null;
  act: number | null;
  design: CardDesign | null;

  // State
  status: "available" | "locked_out" | "self_destructed" | "answered";
  lockedOutReason: string | null;
  selfDestructText: string | null;

  // Self-destruct
  selfDestructedAt: string | null; // ISO timestamp
  selfDestructTimer: number | null; // seconds

  // Examine state
  isExamined: boolean;
  examinedAt: string | null;
  examineText: string | null;

  // Answer
  isAnswerable: boolean;
  answerTemplateType: AnswerTemplateType | null;
  answerMeta: AnswerMeta | null;
  answerVisibleAfterDestruct: boolean;

  // If already solved
  isSolved: boolean;
}

export interface AnswerMeta {
  type: AnswerTemplateType;
  // Multiple choice options (without correct flags)
  options?: { label: string; value: string }[];
  // Multiple text labels
  labels?: string[];
  // Photo select
  photos?: { url: string; altText: string }[];
  selectCount?: number;
  // Hint info
  hintAvailable: boolean;
  hintAfterAttempts?: number;
}

export interface ScanResponse {
  selfDestructedAt: string | null;
  alreadyScanned: boolean;
}

export interface ExamineResponse {
  selfDestructedAt: string | null;
}

export interface AnswerSubmission {
  answer: string | string[] | Record<string, string>;
  sessionHash?: string;
}

export interface AnswerResponse {
  correct: boolean;
  attemptNumber: number;
  hint: string | null;
  lockedOut: boolean;
  message: string;
}

// === Showtime ===

export type ShowtimePhase = "filling" | "syncing" | "revealed";

export interface ShowtimeSlotView {
  id: string;
  houseId: string;
  houseName: string;
  houseColor: string;
  label: string;
  description: string | null;
  isFilled: boolean;
  isMySlot: boolean;
  inputValue: string | null;
  isCorrect: boolean | null;
  syncPressed: boolean;
}

export interface ShowtimePlayerResponse {
  id: string;
  phase: ShowtimePhase;
  revealTitle: string;
  revealDescription: string | null;
  design: CardDesign | null;
  showHouseLabels: boolean;
  syncWindowMs: number;
  slots: ShowtimeSlotView[];
  mySlotId: string;
  revealedAt: string | null;
}

export interface ShowtimePollResponse {
  phase: ShowtimePhase;
  slots: ShowtimeSlotView[];
  revealedAt: string | null;
}

export interface ShowtimeSlotSubmitResponse {
  accepted: boolean;
  isCorrect: boolean | null;
  message: string;
}

export interface ShowtimeSyncPressResponse {
  accepted: boolean;
  phase: ShowtimePhase;
  message: string;
}

// === Admin Types ===

export * from "./admin-types.js";

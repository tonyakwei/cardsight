import type {
  GameStatus,
  AnswerTemplateType,
  CardComplexity,
  CardSubtype,
  ShowtimePhase,
  ConsequenceType,
} from "./types.js";
import type {
  FinaleClauseId,
  FinaleEvaluation,
  FinaleOutcomeId,
} from "./finale.js";

// === Admin Types ===
// Single source of truth for all admin API response shapes.
// These are re-exported from types.ts so consumers can import from "@cardsight/shared".

/** { id, name, color } — used for house/set references throughout admin types */
export type HouseRef = { id: string; name: string; color: string };

/** { id, name } — used for design references throughout admin types */
export type DesignRef = { id: string; name: string };

// === Games ===

export interface GameSummary {
  id: string;
  name: string;
  description: string | null;
  status: GameStatus;
  currentAct: number;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GameDetail extends GameSummary {
  designCount: number;
  finishedCount: number;
  blurNudgeEnabled: boolean;
  historyTimelineArmed: boolean;
  historyTimelineAttemptIndex: number;
  historyTimelineSolvedAt: string | null;
  historyTimelineCardCount: number;
  finale: FinaleAdminState;
}

// === Cards ===

export interface AdminCard {
  id: string;
  gameId: string;
  physicalCardId: string;
  header: string | null;
  description: string | null;
  act: number;
  subtype: CardSubtype;
  cardSetId: string | null;
  cardSet: HouseRef | null;
  cardHouses: { id: string; house: HouseRef }[];
  clueVisibleCategory: string | null;
  complexity: CardComplexity;
  clueContent: string | null;
  notes: string | null;
  designId: string | null;
  design: DesignRef | null;
  answerTemplateType: AnswerTemplateType | null;
  answerId: string | null;
  isAnswerable: boolean;
  lockedOut: boolean;
  lockedOutReason: string | null;
  selfDestructTimer: number | null;
  selfDestructedAt: string | null;
  selfDestructText: string | null;
  examinedAt: string | null;
  examineText: string | null;
  answerVisibleAfterDestruct: boolean;
  historyTimelineOrder: number | null;
  isFinished: boolean;
  isSolved: boolean;
  sortOrder: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// === Card Sets ===

export interface AdminCardSet {
  id: string;
  name: string;
  color: string;
  notes: string | null;
  cardCount: number;
  reviewedAt: string | null;
  modifiedSinceReview: number;
}

// === Houses ===

export interface AdminHouse {
  id: string;
  name: string;
  color: string;
  _count?: { cards: number };
}

// === Designs ===

export interface AdminDesign {
  id: string;
  name: string;
  bgColor: string;
  accentColor: string;
  cardStyle: string;
}

// === Answer Templates ===

export interface SingleAnswerTemplate {
  id: string;
  gameId: string;
  correctAnswer: string;
  caseSensitive: boolean;
  trimWhitespace: boolean;
  acceptAlternatives: string[];
  hint: string | null;
  hintAfterAttempts: number;
  maxAttempts: number | null;
}

/**
 * One sub-answer in a MultipleAnswer template. Each field is independently
 * validated against its own correctAnswer (and acceptAlternatives) — players
 * must answer ALL fields correctly to solve the puzzle.
 */
export interface MultipleAnswerField {
  /** Optional label shown above this input (e.g. "First derived concept") */
  prompt: string | null;
  correctAnswer: string;
  acceptAlternatives: string[];
  caseSensitive: boolean;
  trimWhitespace: boolean;
}

export interface MultipleAnswerTemplate {
  id: string;
  gameId: string;
  fields: MultipleAnswerField[];
  hint: string | null;
  hintAfterAttempts: number;
  maxAttempts: number | null;
}

// === Missions ===

export interface AdminMission {
  id: string;
  gameId: string;
  act: number;
  missionCardId: string | null;
  missionCard: { id: string; physicalCardId: string; header: string | null } | null;
  title: string;
  sheetLetter: string | null;
  description: string;
  puzzleDescription: string | null;
  requiredClueSets: { cardSetId: string; count: number }[];
  answerTemplateType: AnswerTemplateType | null;
  answerId: string | null;
  designId: string | null;
  design: DesignRef | null;
  isCompleted: boolean;
  lockedOut: boolean;
  lockedOutReason: string | null;
  completedAt: string | null;
  consequenceCompleted: string | null;
  consequenceNotCompleted: string | null;
  consequenceImageCompleted: string | null;
  consequenceImageNotCompleted: string | null;
  sortOrder: number;
  notes: string | null;
  missionHouses: { id: string; house: HouseRef }[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminMissionConsequence {
  id: string;
  sourceMissionId: string;
  targetMissionId: string | null;
  targetMission: { id: string; title: string; act: number } | null;
  triggerOnFailure: boolean;
  triggerOnSuccess: boolean;
  type: ConsequenceType;
  message: string;
  sortOrder: number;
}

export interface AdminTriggeredConsequence {
  id: string;
  consequenceId: string;
  consequence: {
    type: ConsequenceType;
    message: string;
    sourceMission: { id: string; title: string };
    targetMission: { id: string; title: string } | null;
  };
  house: HouseRef;
  triggeredAtAct: number;
  triggeredAt: string;
}

export interface ActBreakHouse {
  house: HouseRef;
  missions: {
    id: string;
    title: string;
    isCompleted: boolean;
    completedAt: string | null;
    consequence: string | null;
    consequenceImage: string | null;
  }[];
  triggeredConsequences: AdminTriggeredConsequence[];
  completedCount: number;
  totalCount: number;
}

// === Story Sheets ===

export interface AdminStorySheet {
  id: string;
  gameId: string;
  houseId: string;
  house: HouseRef;
  act: number;
  title: string;
  content: string;
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// === Showtimes ===

export interface AdminShowtimeSlot {
  id: string;
  houseId: string;
  house: HouseRef;
  label: string;
  description: string | null;
  answerTemplateType: AnswerTemplateType | null;
  answerId: string | null;
  inputValue: string | null;
  filledAt: string | null;
  isCorrect: boolean | null;
  syncPressedAt: string | null;
  sortOrder: number;
}

export interface AdminShowtime {
  id: string;
  gameId: string;
  act: number;
  title: string;
  revealTitle: string;
  revealDescription: string | null;
  designId: string | null;
  design: DesignRef | null;
  phase: ShowtimePhase;
  showHouseLabels: boolean;
  syncWindowMs: number;
  revealedAt: string | null;
  sortOrder: number;
  notes: string | null;
  slots: AdminShowtimeSlot[];
  createdAt: string;
  updatedAt: string;
}

// === Act Transitions ===

export interface ActTransitionResult {
  fromAct: number;
  toAct: number;
  cardsLocked: number;
  cardsUnlocked: number;
  triggeredConsequences: AdminTriggeredConsequence[];
}

// === Live Dashboard ===

export interface DashboardData {
  currentAct: number;
  historyTimeline: {
    cardCount: number;
    armed: boolean;
    attemptIndex: number;
    solvedAt: string | null;
  };
  overview: {
    totalCards: number;
    cardsScanned: number;
    totalScans: number;
    totalAttempts: number;
    correctAttempts: number;
  };
  cardDiscovery: {
    setId: string | null;
    setName: string;
    setColor: string;
    total: number;
    scanned: number;
    solved: number;
  }[];
  activity: {
    type: "scan" | "answer";
    at: string;
    cardId: string;
    cardTitle: string;
    act: number;
    isCorrect?: boolean;
    attemptNumber?: number;
  }[];
  missionProgress: {
    house: HouseRef;
    total: number;
    completed: number;
    missions: {
      id: string;
      title: string;
      act: number;
      isCompleted: boolean;
    }[];
  }[];
}

export interface FinaleAdminState {
  outcomeId: FinaleOutcomeId | null;
  clauseIds: FinaleClauseId[];
  evaluation: FinaleEvaluation;
}

// === Simulator ===

export interface SimulatorCard {
  id: string;
  physicalCardId: string;
  header: string | null;
  act: number;
  tableHouseId: string | null;
  cardSet: { id: string; name: string; color: string } | null;
  cardHouses: { house: HouseRef }[];
}

export interface SimulatorData {
  houses: AdminHouse[];
  cards: SimulatorCard[];
}

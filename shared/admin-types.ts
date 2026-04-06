// === Admin Types ===
// Single source of truth for all admin API response shapes.
// These are re-exported from types.ts so consumers can import from "@cardsight/shared".

// === Games ===

export interface GameSummary {
  id: string;
  name: string;
  description: string | null;
  status: string;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GameDetail extends GameSummary {
  designCount: number;
  finishedCount: number;
}

// === Cards ===

export interface AdminCard {
  id: string;
  gameId: string;
  humanCardId: string;
  title: string;
  description: string | null;
  act: number | null;
  cardSetId: string | null;
  cardSet: { id: string; name: string; color: string } | null;
  cardHouses: { id: string; house: { id: string; name: string; color: string } }[];
  clueVisibleCategory: string | null;
  notes: string | null;
  designId: string | null;
  design: { id: string; name: string } | null;
  answerTemplateType: string | null;
  answerId: string | null;
  isAnswerable: boolean;
  lockedOut: boolean;
  lockedOutReason: string | null;
  selfDestructTimer: number | null;
  selfDestructedAt: string | null;
  selfDestructText: string | null;
  hasEntryGate: boolean;
  entryGateText: string | null;
  answerVisibleAfterDestruct: boolean;
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

// === Missions ===

export interface AdminMission {
  id: string;
  gameId: string;
  act: number;
  missionCardId: string | null;
  missionCard: { id: string; humanCardId: string; title: string } | null;
  title: string;
  description: string;
  requiredClueSets: { cardSetId: string; count: number }[];
  answerTemplateType: string | null;
  answerId: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  consequenceCompleted: string | null;
  consequenceNotCompleted: string | null;
  consequenceImageCompleted: string | null;
  consequenceImageNotCompleted: string | null;
  mechanicalEffectCompleted: any | null;
  mechanicalEffectNotCompleted: any | null;
  sortOrder: number;
  notes: string | null;
  missionHouses: { id: string; house: { id: string; name: string; color: string } }[];
  createdAt: string;
  updatedAt: string;
}

export interface ActBreakHouse {
  house: { id: string; name: string; color: string };
  missions: {
    id: string;
    title: string;
    isCompleted: boolean;
    completedAt: string | null;
    consequence: string | null;
    consequenceImage: string | null;
    mechanicalEffect: any | null;
  }[];
  completedCount: number;
  totalCount: number;
}

// === Showtimes ===

export interface AdminShowtimeSlot {
  id: string;
  houseId: string;
  house: { id: string; name: string; color: string };
  label: string;
  description: string | null;
  answerTemplateType: string | null;
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
  design: { id: string; name: string } | null;
  phase: string;
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
}

// === Live Dashboard ===

export interface DashboardData {
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
    isCorrect?: boolean;
    attemptNumber?: number;
  }[];
  missionProgress: {
    house: { id: string; name: string; color: string };
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

// === Simulator ===

export interface SimulatorCard {
  id: string;
  humanCardId: string;
  title: string;
  act: number | null;
  tableHouseId: string | null;
  cardSet: { id: string; name: string; color: string } | null;
  cardHouses: { house: { id: string; name: string; color: string } }[];
}

export interface SimulatorData {
  houses: AdminHouse[];
  cards: SimulatorCard[];
}

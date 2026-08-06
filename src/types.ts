// ─── Room IDs ─────────────────────────────────────────────────────────────────
export type RoomId =
  | 'entrance'
  | 'guardians'
  | 'echoes'
  | 'puzzle'
  | 'library'
  | 'flooded'
  | 'elements'
  | 'sanctum'
  | 'final';

// ─── Inventory ────────────────────────────────────────────────────────────────
export type ItemCategory = 'collectible' | 'key' | 'relic' | 'tool' | 'consumable';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  inspectionText: string;       // Shown when player examines the item
  category: ItemCategory;
  icon?: string;
  condition?: string;
  usable: boolean;
  stackable: boolean;
  quantity: number;
  usageRules?: string;          // Describes when/how the item can be used
}

// ─── Objectives ───────────────────────────────────────────────────────────────
export interface ObjectiveTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Objective {
  id: string;
  title: string;
  tasks: ObjectiveTask[];
  completed: boolean;
  archived: boolean;
}

// ─── Journal ──────────────────────────────────────────────────────────────────
export type JournalCategory = 'lore' | 'observation' | 'teaching' | 'discovery' | 'event';

export interface JournalEntry {
  id: string;
  text: string;
  turn: number;
  roomId: RoomId;
  category: JournalCategory;
}

// ─── Player Stats ─────────────────────────────────────────────────────────────
export interface PlayerStats {
  torchFuel: number;           // 0–100
  resolve: 'Steady' | 'Uneasy' | 'Fraying' | 'Thin' | 'Hardened' | 'Resolute' | 'Unbroken';
  templeFavor: 'Neutral' | 'Watched' | 'Curious' | 'Tested' | 'Wary' | 'Favored' | 'Recognised' | 'Chosen';
  observationScore: number;
  curiosityScore: number;
  patienceScore: number;
  integrityScore: number;
  greedScore: number;
}

// ─── Room Flags (per-room mutable state) ──────────────────────────────────────
export interface RoomFlags {
  visited: boolean;
  puzzleSolved: boolean;
  puzzleProgress: number;        // 0–100
  itemsCollected: string[];      // item ids picked up in this room
  actionsCompleted: string[];    // action ids that have been completed
  customData: Record<string, unknown>;
}

// ─── Global Flags ─────────────────────────────────────────────────────────────
export type GlobalFlags = Record<string, boolean | number | string>;

// ─── Game State ───────────────────────────────────────────────────────────────
export interface GameState {
  currentRoomId: RoomId;
  previousRoomId: RoomId | null;
  visitedRooms: RoomId[];
  unlockedRooms: Record<RoomId, boolean>;

  inventory: InventoryItem[];
  equippedItemId: string | null;

  objectives: Record<RoomId, Objective>;
  completedObjectives: string[];   // objective ids
  activeObjectiveId: string | null;

  journal: JournalEntry[];

  roomFlags: Record<RoomId, RoomFlags>;
  globalFlags: GlobalFlags;

  playerStats: PlayerStats;

  currentTurn: number;
  templeStability: number;         // 0–100, decreases as temple degrades
  floodLevel: number;              // 0–100, relevant to flooded corridor
  templePhase: number;             // 1–3

  completedActions: string[];      // globally-unique action ids that fired
  eventHistory: { turn: number; text: string; roomId: RoomId }[];

  /** Runtime puzzle progress — keyed by puzzleId */
  puzzleProgress: Record<string, PuzzleProgress>;

  isCollapsing: boolean;
  gameCompleted: boolean;
  gameEnding?: 'transformed' | 'escaped' | 'failed';
}

// ─── Action Buttons ───────────────────────────────────────────────────────────
export interface ActionButton {
  id: string;
  label: string;
  iconName: string;
  command: string;
  primary?: boolean;
  disabled?: boolean;
  tooltip?: string;
}

// ─── Room Data (static, never mutated) ────────────────────────────────────────
export interface RoomData {
  id: RoomId;
  chapter: string;
  title: string;
  subtitle?: string;
  objectiveTitle: string;
  visualTheme: {
    primaryColor: string;
    ambientLight: string;
    particles: 'dust' | 'fog' | 'embers' | 'water' | 'sparks' | 'void';
  };
  narrationLines: string[];           // default room-entry narration
  baseActions: ActionButton[];        // always-available actions for the room
  initialItems: string[];             // item ids available to collect on first visit
  objective: Omit<Objective, 'completed' | 'archived'>;
  entryJournalText?: string;          // auto-recorded when room is first entered
}

// ─── Puzzle Engine ────────────────────────────────────────────────────────────

/** One discrete step inside a puzzle */
export interface PuzzleStep {
  id: string;
  description: string;
  /** command keywords that satisfy this step */
  triggerKeywords: string[];
  /** item ids that must be in inventory to attempt */
  requiredItems?: string[];
  /** narration shown when step is completed */
  successNarration: string;
  /** narration shown when attempted without required items */
  missingItemNarration?: string;
  /** journal entry recorded on success */
  journalText?: string;
  journalCategory?: JournalCategory;
  /** items added to inventory on success */
  rewardItems?: string[];
  /** items consumed on success */
  consumedItems?: string[];
  /** objective task index to complete on success */
  objectiveTaskIndex?: number;
  /** audio event to play */
  audioEvent?: 'click' | 'stone' | 'bell' | 'water';
}

/** Full puzzle definition — pure data, never mutated */
export interface PuzzleDefinition {
  id: string;
  roomId: RoomId;
  title: string;
  description: string;
  steps: PuzzleStep[];
  /** Item ids that MUST be in inventory before puzzle can be started */
  requiredItems?: string[];
  /** Items added when ALL steps complete */
  completionRewardItems?: string[];
  /** Items consumed when ALL steps complete */
  completionConsumedItems?: string[];
  /** Room to unlock when all steps complete */
  unlocksRoom?: RoomId;
  /** Completion journal entry */
  completionJournalText?: string;
  /** Completion audio */
  completionAudioEvent?: 'click' | 'stone' | 'bell' | 'water';
  /** Narration on full puzzle completion */
  completionNarration: string;
}

/** Mutable runtime state for one puzzle — stored in GameState.puzzleProgress */
export interface PuzzleProgress {
  puzzleId: string;
  currentStepIndex: number;
  completed: boolean;
  failed: boolean;
  stepsCompleted: string[];  // step ids
}

// ─── Command Result ───────────────────────────────────────────────────────────
export interface CommandResult {
  narration: string;
  stateUpdate: Partial<GameState> | null;
  journalEntry?: { text: string; category: JournalCategory };
  itemsAdded?: string[];
  itemsRemoved?: string[];
  objectiveUpdates?: { roomId: RoomId; taskIndex: number }[];
  audioEvent?: 'click' | 'stone' | 'bell' | 'water';
  unlockRoom?: RoomId;
  completedActionId?: string;
  endGame?: boolean;
}

// ─── Legacy shim — keeps existing EvaluationMetrics alias working ─────────────
export type EvaluationMetrics = PlayerStats & { torch: number };

// ─── Legacy WorldModel shim — keeps older component props compiling ───────────
export interface WorldModel {
  currentRoomId: RoomId;
  unlockedRooms: Record<RoomId, boolean>;
  inventory: InventoryItem[];
  objectives: Record<RoomId, Objective>;
  journal: JournalEntry[];
  evaluation: EvaluationMetrics;
  turns: number;
  puzzleStates: Record<RoomId, { solved: boolean; progress: number; customData?: Record<string, unknown> }>;
  eventHistory: { turn: number; text: string; roomId: RoomId }[];
  templePhase: number;
  isCollapsing: boolean;
  gameCompleted: boolean;
  gameEnding?: 'transformed' | 'escaped' | 'failed';
}

export interface AICommandResponse {
  narration: string;
  worldUpdate?: Partial<WorldModel>;
  templeAiEvaluation?: string;
  explorerRecommendation?: string;
  actionResultText?: string;
}

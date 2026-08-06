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

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: 'collectible' | 'key' | 'relic' | 'tool';
  icon?: string;
  condition?: string;
}

export interface ObjectiveTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Objective {
  id: string;
  title: string;
  tasks: ObjectiveTask[];
}

export interface JournalEntry {
  id: string;
  day?: string;
  text: string;
  timestamp?: number;
  category?: 'lore' | 'observation' | 'teaching';
}

export interface EvaluationMetrics {
  torch: number; // Percentage 0 - 100
  resolve: 'Steady' | 'Uneasy' | 'Fraying' | 'Thin' | 'Hardened' | 'Resolute' | 'Unbroken';
  templeFavor: 'Neutral' | 'Watched' | 'Curious' | 'Tested' | 'Wary' | 'Favored' | 'Recognised' | 'Chosen';
  observationScore: number;
  curiosityScore: number;
  patienceScore: number;
  integrityScore: number;
  greedScore: number;
}

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
  narrationLines: string[];
  contextualActions: ActionButton[];
  defaultItems: InventoryItem[];
  objective: Objective;
  journalEntries: JournalEntry[];
  evaluationState: Partial<EvaluationMetrics>;
  puzzleSolved: boolean;
}

export interface ActionButton {
  id: string;
  label: string;
  iconName: string; // Lucide icon identifier
  command: string;
  primary?: boolean;
}

export interface WorldModel {
  currentRoomId: RoomId;
  unlockedRooms: Record<RoomId, boolean>;
  inventory: InventoryItem[];
  objectives: Record<RoomId, Objective>;
  journal: JournalEntry[];
  evaluation: EvaluationMetrics;
  turns: number;
  puzzleStates: Record<RoomId, { solved: boolean; progress: number; customData?: Record<string, any> }>;
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

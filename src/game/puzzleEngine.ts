/**
 * puzzleEngine.ts
 * Reusable engine that processes commands against PuzzleDefinitions.
 * Returns CommandResults. Never mutates state.
 */
import { GameState, CommandResult, PuzzleProgress, RoomId } from '../types';
import { PuzzleDefinition, PuzzleStep } from '../types';
import { PUZZLE_REGISTRY, ROOM_PUZZLE_MAP } from './puzzleRegistry';

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasItem(state: GameState, id: string): boolean {
  return state.inventory.some((i) => i.id === id);
}

function getPuzzleProgress(state: GameState, puzzleId: string): PuzzleProgress {
  return state.puzzleProgress[puzzleId] ?? {
    puzzleId,
    currentStepIndex: 0,
    completed: false,
    failed: false,
    stepsCompleted: [],
  };
}

function stepMatches(step: PuzzleStep, cmd: string): boolean {
  return step.triggerKeywords.some((kw) => cmd.includes(kw));
}

function makeOk(narration: string, extra: Partial<CommandResult> = {}): CommandResult {
  return { narration, stateUpdate: null, ...extra };
}

// ── Core engine function ──────────────────────────────────────────────────────

/**
 * Try to advance a puzzle with the given command.
 * Returns null if no puzzle step matches (caller should handle normally).
 * Returns a CommandResult if a step was triggered.
 */
export function tryAdvancePuzzle(
  state: GameState,
  cmd: string,
  roomId: RoomId,
): CommandResult | null {
  const puzzleId = ROOM_PUZZLE_MAP[roomId];
  if (!puzzleId) return null;

  const def = PUZZLE_REGISTRY[puzzleId];
  if (!def) return null;

  const progress = getPuzzleProgress(state, puzzleId);
  if (progress.completed) return null; // puzzle done, fall through to normal handler

  // Find any step whose keywords match — allow any unsolved step (not just sequential)
  // This gives players freedom to explore steps in any order while the engine tracks completion
  const matchingStep = def.steps.find(
    (step) =>
      stepMatches(step, cmd) &&
      !progress.stepsCompleted.includes(step.id),
  );

  if (!matchingStep) return null;

  // Check required items
  if (matchingStep.requiredItems && matchingStep.requiredItems.length > 0) {
    const missing = matchingStep.requiredItems.filter((id) => !hasItem(state, id));
    if (missing.length > 0) {
      const missingNames = missing.join(', ');
      return makeOk(
        matchingStep.missingItemNarration ??
          `You need: ${missingNames} to do this.`,
      );
    }
  }

  // Step succeeds — build new progress
  const newStepsCompleted = [...progress.stepsCompleted, matchingStep.id];
  const allStepsComplete = def.steps.every((s) => newStepsCompleted.includes(s.id));

  const newProgress: PuzzleProgress = {
    puzzleId,
    currentStepIndex: progress.currentStepIndex + 1,
    completed: allStepsComplete,
    failed: false,
    stepsCompleted: newStepsCompleted,
  };

  const result: CommandResult = {
    narration: allStepsComplete ? def.completionNarration : matchingStep.successNarration,
    stateUpdate: {
      puzzleProgress: {
        ...state.puzzleProgress,
        [puzzleId]: newProgress,
      },
    },
    audioEvent: allStepsComplete
      ? (def.completionAudioEvent ?? matchingStep.audioEvent)
      : matchingStep.audioEvent,
  };

  // Step journal entry
  if (matchingStep.journalText && !allStepsComplete) {
    result.journalEntry = {
      text: matchingStep.journalText,
      category: matchingStep.journalCategory ?? 'observation',
    };
  }

  // Step reward items
  if (matchingStep.rewardItems) {
    result.itemsAdded = matchingStep.rewardItems;
  }

  // Step consumed items
  if (matchingStep.consumedItems) {
    result.itemsRemoved = matchingStep.consumedItems;
  }

  // Step objective update
  if (matchingStep.objectiveTaskIndex !== undefined) {
    result.objectiveUpdates = [
      { roomId, taskIndex: matchingStep.objectiveTaskIndex },
    ];
  }

  // If all steps done, apply puzzle completion rewards
  if (allStepsComplete) {
    if (def.completionRewardItems) {
      result.itemsAdded = [
        ...(result.itemsAdded ?? []),
        ...def.completionRewardItems,
      ];
    }
    if (def.completionConsumedItems) {
      result.itemsRemoved = [
        ...(result.itemsRemoved ?? []),
        ...def.completionConsumedItems,
      ];
    }
    if (def.unlocksRoom) {
      result.unlockRoom = def.unlocksRoom;
    }
    if (def.completionJournalText) {
      result.journalEntry = {
        text: def.completionJournalText,
        category: 'event',
      };
    }
    // Mark room solved via stateUpdate
    result.stateUpdate = {
      ...result.stateUpdate,
      roomFlags: {
        ...state.roomFlags,
        [roomId]: {
          ...state.roomFlags[roomId],
          puzzleSolved: true,
          puzzleProgress: 100,
        },
      },
      puzzleProgress: {
        ...state.puzzleProgress,
        [puzzleId]: newProgress,
      },
    };
    result.completedActionId = `puzzle_completed_${puzzleId}`;
  }

  return result;
}

/** Returns how many steps of a puzzle have been completed */
export function getPuzzleStepCount(state: GameState, puzzleId: string): number {
  return getPuzzleProgress(state, puzzleId).stepsCompleted.length;
}

/** Returns whether a specific puzzle step has been completed */
export function isPuzzleStepDone(state: GameState, puzzleId: string, stepId: string): boolean {
  return getPuzzleProgress(state, puzzleId).stepsCompleted.includes(stepId);
}

/** Returns whether a room's puzzle is fully complete */
export function isRoomPuzzleComplete(state: GameState, roomId: RoomId): boolean {
  const puzzleId = ROOM_PUZZLE_MAP[roomId];
  if (!puzzleId) return false;
  return getPuzzleProgress(state, puzzleId).completed;
}

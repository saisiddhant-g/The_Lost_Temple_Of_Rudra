/**
 * templeMemoryEngine.ts
 * Records and queries everything the temple knows about the player.
 * Pure functions — returns updated TempleMemory objects.
 */
import { TempleMemory, RoomId, GameState } from '../types';

// ── Factory ───────────────────────────────────────────────────────────────────

export function buildInitialTempleMemory(): TempleMemory {
  return {
    roomsVisited: [],
    puzzlesSolved: [],
    failedAttempts: {},
    hintsRequested: {},
    relicsCollected: [],
    itemsIgnored: [],
    dangerousChoices: [],
    moralChoices: [],
    explorationActions: 0,
    hiddenDiscoveries: [],
    loreRead: 0,
    guideConversations: 0,
    templeConversations: 0,
    lastTempleWhisper: '',
    lastGuideResponse: '',
    consecutiveFails: 0,
    consecutiveSolves: 0,
    playerDecisions: [],
  };
}

// ── Update helpers ────────────────────────────────────────────────────────────

export function recordRoomVisit(mem: TempleMemory, roomId: RoomId): TempleMemory {
  if (mem.roomsVisited.includes(roomId)) return mem;
  return { ...mem, roomsVisited: [...mem.roomsVisited, roomId] };
}

export function recordPuzzleSolved(mem: TempleMemory, puzzleId: string): TempleMemory {
  if (mem.puzzlesSolved.includes(puzzleId)) return mem;
  return {
    ...mem,
    puzzlesSolved: [...mem.puzzlesSolved, puzzleId],
    consecutiveFails: 0,
    consecutiveSolves: mem.consecutiveSolves + 1,
  };
}

export function recordFailedAttempt(mem: TempleMemory, puzzleId: string): TempleMemory {
  const prev = mem.failedAttempts[puzzleId] ?? 0;
  return {
    ...mem,
    failedAttempts: { ...mem.failedAttempts, [puzzleId]: prev + 1 },
    consecutiveFails: mem.consecutiveFails + 1,
    consecutiveSolves: 0,
  };
}

export function recordHintRequested(mem: TempleMemory, roomId: RoomId): TempleMemory {
  const prev = mem.hintsRequested[roomId] ?? 0;
  return {
    ...mem,
    hintsRequested: { ...mem.hintsRequested, [roomId]: prev + 1 },
    guideConversations: mem.guideConversations + 1,
  };
}

export function recordTempleAsked(mem: TempleMemory): TempleMemory {
  return { ...mem, templeConversations: mem.templeConversations + 1 };
}

export function recordRelicCollected(mem: TempleMemory, itemId: string): TempleMemory {
  if (mem.relicsCollected.includes(itemId)) return mem;
  return { ...mem, relicsCollected: [...mem.relicsCollected, itemId] };
}

export function recordExplorationAction(mem: TempleMemory): TempleMemory {
  return { ...mem, explorationActions: mem.explorationActions + 1 };
}

export function recordLoreRead(mem: TempleMemory): TempleMemory {
  return { ...mem, loreRead: mem.loreRead + 1 };
}

export function recordHiddenDiscovery(mem: TempleMemory, discoveryId: string): TempleMemory {
  if (mem.hiddenDiscoveries.includes(discoveryId)) return mem;
  return { ...mem, hiddenDiscoveries: [...mem.hiddenDiscoveries, discoveryId] };
}

export function recordItemIgnored(mem: TempleMemory, itemId: string): TempleMemory {
  if (mem.itemsIgnored.includes(itemId)) return mem;
  return { ...mem, itemsIgnored: [...mem.itemsIgnored, itemId] };
}

export function recordDangerousChoice(mem: TempleMemory, actionId: string): TempleMemory {
  if (mem.dangerousChoices.includes(actionId)) return mem;
  return { ...mem, dangerousChoices: [...mem.dangerousChoices, actionId] };
}

export function recordMoralChoice(
  mem: TempleMemory,
  turn: number,
  choice: string,
  tag: 'noble' | 'greedy' | 'neutral',
): TempleMemory {
  return {
    ...mem,
    moralChoices: [...mem.moralChoices, { turn, choice, tag }],
  };
}

export function recordPlayerDecision(
  mem: TempleMemory,
  turn: number,
  roomId: RoomId,
  decision: string,
): TempleMemory {
  return {
    ...mem,
    playerDecisions: [...mem.playerDecisions, { turn, roomId, decision }],
  };
}

export function setLastTempleWhisper(mem: TempleMemory, text: string): TempleMemory {
  return { ...mem, lastTempleWhisper: text };
}

export function setLastGuideResponse(mem: TempleMemory, text: string): TempleMemory {
  return { ...mem, lastGuideResponse: text };
}

// ── Query helpers ─────────────────────────────────────────────────────────────

export function totalHintsRequested(mem: TempleMemory): number {
  return Object.values(mem.hintsRequested).reduce((a, b) => a + b, 0);
}

export function totalFailedAttempts(mem: TempleMemory): number {
  return Object.values(mem.failedAttempts).reduce((a, b) => a + b, 0);
}

export function failsForPuzzle(mem: TempleMemory, puzzleId: string): number {
  return mem.failedAttempts[puzzleId] ?? 0;
}

export function hintsForRoom(mem: TempleMemory, roomId: RoomId): number {
  return mem.hintsRequested[roomId] ?? 0;
}

export function isFirstVisit(mem: TempleMemory, roomId: RoomId): boolean {
  return !mem.roomsVisited.includes(roomId);
}

export function solvedWithoutHints(mem: TempleMemory, roomId: RoomId): boolean {
  return (mem.hintsRequested[roomId] ?? 0) === 0;
}

/** Returns a personality profile string based on memory */
export function getTemplePersonalityLabel(mem: TempleMemory): string {
  const hints = totalHintsRequested(mem);
  const fails = totalFailedAttempts(mem);
  const explores = mem.explorationActions;
  const lore = mem.loreRead;

  if (hints > 8) return 'dependent';
  if (fails > 12) return 'reckless';
  if (lore > 6 && hints < 3) return 'scholar';
  if (explores > 15) return 'explorer';
  if (mem.consecutiveSolves > 3) return 'sharp';
  if (mem.moralChoices.filter(m => m.tag === 'greedy').length > 2) return 'greedy';
  if (mem.moralChoices.filter(m => m.tag === 'noble').length > 2) return 'noble';
  return 'balanced';
}

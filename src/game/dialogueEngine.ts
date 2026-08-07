/**
 * dialogueEngine.ts
 * Generates contextual Temple whispers and Explorer Guide responses.
 * Never repeats the same line twice in a session.
 * Adapts to traits, memory, puzzle progress, and room context.
 */
import { GameState, RoomId, PlayerTraits, TempleMemory, DialogueContext } from '../types';
import {
  totalHintsRequested,
  totalFailedAttempts,
  getTemplePersonalityLabel,
  solvedWithoutHints,
} from './templeMemoryEngine';
import { getDominantTrait } from './traitEngine';
import { ROOM_PUZZLE_MAP } from './puzzleRegistry';

// ── Dedup helpers ─────────────────────────────────────────────────────────────

function pickUnused(options: string[], log: string[]): string {
  const unused = options.filter((o) => !log.includes(o));
  if (unused.length > 0) return unused[Math.floor(Math.random() * unused.length)];
  // All used — pick a random one (reset cycle)
  return options[Math.floor(Math.random() * options.length)];
}

// ── Temple whispers ───────────────────────────────────────────────────────────

/** Returns a contextual temple whisper and updated dialogue context */
export function getTempleWhisper(
  state: GameState,
): { whisper: string; newContext: DialogueContext } {
  const { templeMemory: mem, playerTraits: traits, dialogueContext: ctx, currentRoomId: roomId } = state;
  const profile = getTemplePersonalityLabel(mem);
  const puzzlesDone = mem.puzzlesSolved.length;
  const roomsSeen = mem.roomsVisited.length;
  const totalHints = totalHintsRequested(mem);
  const totalFails = totalFailedAttempts(mem);
  const roomSolved = state.roomFlags[roomId]?.puzzleSolved ?? false;
  const roomFailCount = state.hintState.roomFailCount[roomId] ?? 0;

  const candidates: string[] = [];

  // ── Profile-based whispers ──────────────────────────────────────────────
  if (profile === 'dependent') {
    candidates.push(
      'The temple whispers: "You seek answers before seeking understanding."',
      'The temple whispers: "Every question asked is a wall built against insight."',
      'The temple whispers: "The one who waits for guidance will wait forever."',
      'The temple whispers: "You arrive at each door asking for the key. Search yourself first."',
    );
  }
  if (profile === 'reckless') {
    candidates.push(
      'The temple whispers: "Speed earns nothing here that patience would not have granted more gracefully."',
      'The temple whispers: "The corridor remembers every wrong turn."',
      'The temple whispers: "Haste is not courage. The temple knows the difference."',
      'The temple whispers: "You repeat the same gesture expecting a different stone. Observe, then act."',
    );
  }
  if (profile === 'scholar') {
    candidates.push(
      'The temple whispers: "Your mind grows sharper with each chamber."',
      'The temple whispers: "You read what others walk past. This is not lost on the temple."',
      'The temple whispers: "The one who reads everything will eventually read the right thing."',
      'The temple whispers: "Knowledge carried lightly becomes wisdom. The temple sees this in you."',
    );
  }
  if (profile === 'explorer') {
    candidates.push(
      'The temple whispers: "Curiosity is the only key the temple has never locked a door against."',
      'The temple whispers: "You look at everything. Good. The temple hides answers inside other answers."',
      'The temple whispers: "An explorer who observes finds the room within the room."',
    );
  }
  if (profile === 'sharp') {
    candidates.push(
      'The temple whispers: "You solve without asking. The temple approves of this."',
      'The temple whispers: "Three chambers without assistance. The pattern is noted."',
      'The temple whispers: "Few have moved through these halls with such clarity of purpose."',
    );
  }
  if (profile === 'greedy') {
    candidates.push(
      'The temple whispers: "The temple remembers every hand that takes."',
      'The temple whispers: "What you carry, the temple will weigh at the door."',
      'The temple whispers: "Accumulation is not progress."',
      'The temple whispers: "You gather what was not meant to leave. The sanctum will ask about this."',
    );
  }
  if (profile === 'noble') {
    candidates.push(
      'The temple whispers: "You offer what others would keep. The temple weighs this."',
      'The temple whispers: "Humility moves faster through this place than certainty."',
      'The temple whispers: "The empty hand is recognised here as the open hand."',
    );
  }

  // ── Room-specific whispers ───────────────────────────────────────────────
  const roomWhispers: Record<RoomId, string[]> = {
    entrance: [
      'The temple whispers: "Every visitor begins at the threshold. Few reach what is beyond it."',
      'The temple whispers: "The inscription has waited a thousand years for someone to read it properly."',
      'The temple whispers: "This is where intention becomes action. The temple watches from here."',
    ],
    guardians: [
      'The temple whispers: "The watchers are patient. They have not been wrong yet."',
      'The temple whispers: "Four witnesses. One test. The geometry does not lie."',
      'The temple whispers: "They have seen a thousand who tried to rush past. None did."',
    ],
    echoes: [
      'The temple whispers: "You are not the first to hear the second footstep."',
      'The temple whispers: "The hall remembers frequencies. It has kept them for you."',
      'The temple whispers: "Sound is memory made physical. Listen to what has been here before you."',
    ],
    puzzle: [
      'The temple whispers: "The blank plate is the temple\'s own silence. Respect it."',
      'The temple whispers: "Creation. Preservation. Dissolution. Everything else follows."',
      'The temple whispers: "Those who decode before they rotate are the only ones who leave this room intact."',
    ],
    library: [
      'The temple whispers: "A thousand voices whispering different things. One of them is correct. Silence is the clue."',
      'The temple whispers: "The true archive does not speak. It waits."',
      'The temple whispers: "Clay talks. Stone holds its tongue. Trust the silence."',
    ],
    flooded: [
      'The temple whispers: "The water was not an accident. It was a test of patience."',
      'The temple whispers: "The first valve floods. The second locks. The third is the one you want."',
      'The temple whispers: "Something was left here before the corridor filled. It is still waiting."',
    ],
    elements: [
      'The temple whispers: "Earth holds everything that follows. Begin there."',
      'The temple whispers: "The circuit is unbroken. Do not be the one to break it."',
      'The temple whispers: "Four elements. One sequence. The relic in your pack already knows the order."',
    ],
    sanctum: [
      'The temple whispers: "The empty hand is the posture of receiving, not demanding."',
      'The temple whispers: "What you brought through the chambers — all of it — is being weighed."',
      'The temple whispers: "Rudra does not ask for more than you gathered with clean hands."',
    ],
    final: [
      'The temple whispers: "Thousands of years of waiting conclude with you."',
      'The temple whispers: "The cycle accepts either answer. There is no wrong choice — only the choice you can live with."',
      'The temple whispers: "You have carried this far. What you carry out defines the journey."',
    ],
  };

  if (roomWhispers[roomId]) {
    candidates.push(...roomWhispers[roomId]);
  }

  // ── Trait-triggered whispers ─────────────────────────────────────────────
  if (traits.wisdom > 60) {
    candidates.push('The temple whispers: "The accumulation of understanding does not go unnoticed here."');
    candidates.push('The temple whispers: "Each inscription you have read lives in you now. The temple intended that."');
  }
  if (traits.greed > 50) {
    candidates.push('The temple whispers: "The temple remembers every hand that takes."');
    candidates.push('The temple whispers: "Weight has meaning here beyond the physical."');
  }
  if (traits.patience > 60) {
    candidates.push('The temple whispers: "Patience here is its own form of devotion."');
    candidates.push('The temple whispers: "You did not rush. The temple measured this."');
  }
  if (traits.recklessness > 50) {
    candidates.push('The temple whispers: "Urgency has cost others more than it earned them."');
    candidates.push('The temple whispers: "The stone holds its record of every failed attempt. It is patient."');
  }
  if (traits.curiosity > 60) {
    candidates.push('The temple whispers: "Questions lead where answers cannot."');
    candidates.push('The temple whispers: "You examine what others ignore. The temple opens differently for curious hands."');
  }
  if (traits.courage > 60) {
    candidates.push('The temple whispers: "You moved forward without certainty. That is the only way to move here."');
  }
  if (traits.observation > 60) {
    candidates.push('The temple whispers: "The one who sees everything eventually sees the thing that matters."');
  }
  if (traits.compassion > 50) {
    candidates.push('The temple whispers: "Restraint in the face of temptation is a form of strength this place recognises."');
  }

  // ── Hidden discovery whispers ────────────────────────────────────────────
  if (mem.hiddenDiscoveries.length > 0) {
    candidates.push('The temple whispers: "You found what was hidden. The temple acknowledges the eye that sees within the obvious."');
  }
  if (mem.hiddenDiscoveries.length >= 2) {
    candidates.push('The temple whispers: "Two hidden things found. The builders would be satisfied."');
  }

  // ── Memory-driven milestone whispers ────────────────────────────────────
  if (puzzlesDone === 0 && roomsSeen === 1) {
    candidates.push('The temple whispers: "The threshold is crossed. What follows is not reversible."');
  }
  if (puzzlesDone === 3) {
    candidates.push('The temple whispers: "You have reached the middle of the temple. The second half remembers the first."');
  }
  if (puzzlesDone >= 6) {
    candidates.push('The temple whispers: "The temple has been watching since the entrance. It has formed an opinion."');
  }
  if (roomSolved && solvedWithoutHints(mem, roomId)) {
    candidates.push('The temple whispers: "You solved it alone. This has not happened in some time."');
  }
  if (roomFailCount >= 3 && !roomSolved) {
    candidates.push('The temple whispers: "Persistence without reflection is a closed circuit. Consider what you have not yet read."');
  }
  if (totalHints === 0 && puzzlesDone > 0) {
    candidates.push('The temple whispers: "No guidance requested. The temple notes the independence."');
  }
  if (mem.consecutiveFails >= 4) {
    candidates.push('The temple whispers: "You are caught in the same loop. Something you know already holds the answer."');
  }
  if (mem.consecutiveSolves >= 3) {
    candidates.push('The temple whispers: "Three chambers in sequence without hesitation. The temple has been watching you find your rhythm."');
  }
  if (mem.loreRead >= 5) {
    candidates.push('The temple whispers: "You have read almost everything. The temple approves of thoroughness."');
  }
  if (mem.explorationActions >= 20) {
    candidates.push('The temple whispers: "Every corner examined. The builders hid things for someone exactly like you."');
  }
  if (mem.relicsCollected.length >= 4) {
    candidates.push('The temple whispers: "The relics remember their rooms. They will be asked to account for themselves at the end."');
  }
  if (mem.guideConversations >= 5) {
    candidates.push('The temple whispers: "Your companion speaks often. Listen, but also look."');
  }
  if (mem.moralChoices.filter(m => m.tag === 'greedy').length >= 2) {
    candidates.push('The temple whispers: "The tally of acquisition grows. The sanctum will weigh it against the tally of wisdom."');
  }
  if (mem.moralChoices.filter(m => m.tag === 'noble').length >= 2) {
    candidates.push('The temple whispers: "Restraint, offered twice. The temple does not forget generosity of spirit."');
  }

  const whisper = pickUnused(candidates, ctx.templeWhistersLog);
  const newContext: DialogueContext = {
    ...ctx,
    templeWhistersLog: [...ctx.templeWhistersLog, whisper],
    lastConversationTurn: state.currentTurn,
  };

  return { whisper, newContext };
}

// ── Explorer Guide responses ──────────────────────────────────────────────────

/** Returns a contextual guide response and updated dialogue context */
export function getGuideResponse(
  state: GameState,
  hintText: string,
  hintLevel: 1 | 2 | 3,
): { response: string; newContext: DialogueContext } {
  const { templeMemory: mem, playerTraits: traits, dialogueContext: ctx, currentRoomId: roomId } = state;
  const roomSolved = state.roomFlags[roomId]?.puzzleSolved ?? false;
  const hintCount = mem.hintsRequested[roomId] ?? 0;
  const failCount = state.hintState.roomFailCount[roomId] ?? 0;
  const puzzlesDone = mem.puzzlesSolved.length;
  const prevConversations = mem.guideConversations;

  // ── Solved room response ─────────────────────────────────────────────────
  if (roomSolved) {
    const solvedResponses = [
      'Guide: "You\'ve already solved this room — the next chamber waits."',
      'Guide: "Nothing more to do here. Your instincts served you well."',
      'Guide: "Room\'s done. Move on when you\'re ready."',
      'Guide: "This one\'s behind you. Focus forward."',
    ];
    const response = pickUnused(solvedResponses, ctx.guideResponseLog);
    const newContext: DialogueContext = {
      ...ctx,
      guideResponseLog: [...ctx.guideResponseLog, response],
      lastConversationTurn: state.currentTurn,
    };
    return { response, newContext };
  }

  // ── Context-aware preamble ───────────────────────────────────────────────
  let preamble = 'Guide: "';

  if (hintCount === 0 && failCount === 0) {
    const firstTimePreambles = [
      'First time asking — ',
      'You\'re just starting on this one — ',
      'Early days here — ',
    ];
    preamble += pickUnused(firstTimePreambles, ctx.guideResponseLog);
  } else if (hintCount >= 3 || failCount >= 4) {
    const stuckPreambles = [
      'You\'ve been at this a while — ',
      'Still here — let me be more direct — ',
      'This one has you properly stuck — ',
    ];
    preamble += pickUnused(stuckPreambles, ctx.guideResponseLog);
  } else if (failCount >= 2) {
    const failPreambles = [
      'You\'ve tried a few approaches — ',
      'A couple of misses — ',
      'After what I\'ve watched — ',
    ];
    preamble += pickUnused(failPreambles, ctx.guideResponseLog);
  } else if (puzzlesDone >= 5) {
    const latePreambles = [
      'You\'ve come far — ',
      'Five chambers behind you — ',
      'At this stage — ',
    ];
    preamble += pickUnused(latePreambles, ctx.guideResponseLog);
  } else if (prevConversations >= 3) {
    const repeatPreambles = [
      'Again — ',
      'Back at it — ',
    ];
    preamble += pickUnused(repeatPreambles, ctx.guideResponseLog);
  }

  // ── Level prefixes (getting progressively more direct) ───────────────────
  const levelPrefixes: Record<1 | 2 | 3, string[]> = {
    1: [
      'here\'s something worth noticing — ',
      'pay attention to what\'s around you — ',
      'there is something here that deserves a closer look — ',
      'observe carefully — ',
    ],
    2: [
      'have a closer look at a specific thing — ',
      'the answer involves something you may have passed over — ',
      'focus your attention on what the room is actually telling you — ',
      'something specific in this room holds the key — ',
    ],
    3: [
      'I can tell you the mechanism — ',
      'here is what the puzzle actually requires — ',
      'let me be direct — ',
      'straight answer — ',
    ],
  };

  const prefix = pickUnused(levelPrefixes[hintLevel], ctx.guideResponseLog);
  let response = preamble + prefix + hintText + '"';

  // ── Trait-aware commentary appended ─────────────────────────────────────
  if (traits.recklessness > 40 && failCount >= 2) {
    response += ' (Slow down — you\'ve been moving faster than you\'re reading.)';
  } else if (traits.wisdom > 50 && hintLevel === 1) {
    response += ' (Your instincts are good. Trust them a little longer before asking again.)';
  } else if (traits.patience < 30 && hintLevel >= 2) {
    response += ' (The temple rewards the methodical. Take it one step at a time.)';
  } else if (traits.observation > 50 && hintCount === 0) {
    response += ' (You\'ve been observant — this should confirm something you\'ve already half-noticed.)';
  }

  // ── Memory callback: reference prior successes ───────────────────────────
  if (puzzlesDone >= 2 && hintLevel >= 2 && Math.random() < 0.4) {
    const callbacks = [
      ' You solved the earlier chambers without needing this much. The principle is the same.',
      ' Remember how the last room worked — the same logic applies here in a different form.',
      ' You\'ve seen harder than this. Trust what you already know.',
    ];
    response += callbacks[Math.floor(Math.random() * callbacks.length)];
  }

  const newContext: DialogueContext = {
    ...ctx,
    guideResponseLog: [...ctx.guideResponseLog, response],
    lastConversationTurn: state.currentTurn,
  };

  return { response, newContext };
}

// ── Guide discovery reactions ─────────────────────────────────────────────────

/** Called when player finds something notable — returns guide comment for journal/narration */
export function getGuideDiscoveryComment(
  state: GameState,
  discoveryType: 'puzzle_solved' | 'item_found' | 'lore_read' | 'hidden_found' | 'room_entered' | 'failed_sequence',
): string | null {
  const { dialogueContext: ctx, templeMemory: mem, playerTraits: traits } = state;
  const puzzlesDone = mem.puzzlesSolved.length;

  const pools: Record<typeof discoveryType, string[]> = {
    puzzle_solved: [
      'Guide (quietly): "Well done. That was not straightforward."',
      'Guide: "Marked. On to the next."',
      'Guide: "That\'s one more chamber that knows your name."',
      'Guide: "Clean solve. The temple noticed."',
      'Guide: "That\'s how it\'s done."',
    ],
    item_found: [
      'Guide: "Take it. Items here are never placed carelessly."',
      'Guide: "That will matter later. Hold onto it."',
      'Guide: "Good find. Keep everything you pick up in this place."',
      'Guide: "The builders left things for the ones who looked. You\'re looking."',
    ],
    lore_read: [
      'Guide: "That inscription pre-dates the outer structure by at least two centuries."',
      'Guide: "Cross-reference that with your journal — it may explain something you saw earlier."',
      'Guide: "The builders wrote for whoever came after them. Worth reading twice."',
      'Guide: "Every inscription is a breadcrumb. You\'re collecting the right ones."',
    ],
    hidden_found: [
      'Guide: "You found that without my help. Noted."',
      'Guide: "Remarkable. Most people walk past that entirely."',
      'Guide: "Hidden deliberately. The builder trusted the observer, not the searcher."',
      'Guide: "That\'s the kind of thing that changes the final accounting."',
    ],
    room_entered: [
      'Guide: "New room. Take a moment before acting."',
      'Guide: "First thing — look at everything before touching anything."',
      'Guide: "The first minute in a new chamber is the most informative. Use it."',
      'Guide: "Observe before you commit. The rooms reward patience."',
    ],
    failed_sequence: [
      'Guide (aside): "Something didn\'t respond. Read more before trying again."',
      'Guide: "That didn\'t land. Step back — what haven\'t you read yet?"',
      'Guide: "The mechanism is telling you something with that non-response."',
      'Guide: "Failure here is information. What did you skip?"',
    ],
  };

  const candidates = pools[discoveryType];
  const used = ctx.guideResponseLog;
  const unused = candidates.filter((c) => !used.includes(c));
  if (unused.length === 0) return null;
  return unused[Math.floor(Math.random() * unused.length)];
}

// ── Auto-journal field note generator ────────────────────────────────────────

/** 
 * Generates an explorer-voice field note for automatic journal recording.
 * Called when significant narrative events occur.
 */
export function generateFieldNote(
  state: GameState,
  event: 'puzzle_solved' | 'item_collected' | 'lore_discovered' | 'temple_whisper' | 'hidden_found' | 'moral_choice',
  context: string,
): string {
  const { currentRoomId: roomId, playerTraits: traits, currentTurn: turn } = state;

  const roomNames: Record<RoomId, string> = {
    entrance: 'Temple Entrance',
    guardians: 'Hall of Guardians',
    echoes: 'Hall of Echoes',
    puzzle: 'Puzzle Chamber',
    library: 'Library of Whispers',
    flooded: 'Flooded Corridor',
    elements: 'Chamber of Elements',
    sanctum: 'Sanctum of Rudra',
    final: 'Final Chamber',
  };

  const room = roomNames[roomId] ?? roomId;

  switch (event) {
    case 'puzzle_solved':
      if (traits.wisdom > 50) {
        return `[${room}] ${context} — The pattern was in the inscriptions all along. I should have read more carefully from the start.`;
      }
      return `[${room}] ${context} — Solved by working through each step in sequence. The builders were methodical; the solution rewards the same.`;

    case 'item_collected':
      return `[${room}] Recovered: ${context}. Items in this temple are not decorative. Keeping everything until I understand its purpose.`;

    case 'lore_discovered':
      return `[${room}] Inscription noted: ${context}`;

    case 'temple_whisper':
      return `[${room}] The temple spoke again: ${context}`;

    case 'hidden_found':
      return `[${room}] Hidden discovery: ${context} — Found only because I looked twice at something that seemed finished.`;

    case 'moral_choice':
      return `[${room}] Decision recorded: ${context}`;

    default:
      return `[${room}] ${context}`;
  }
}


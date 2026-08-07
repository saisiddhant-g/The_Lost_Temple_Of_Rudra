/**
 * traitEngine.ts
 * Derives and updates PlayerTraits from actions.
 * Pure functions — never mutate state directly.
 */
import { PlayerTraits, GameState, RoomId } from '../types';

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

function delta(traits: PlayerTraits, changes: Partial<Record<keyof PlayerTraits, number>>): PlayerTraits {
  const next = { ...traits };
  for (const [key, d] of Object.entries(changes) as [keyof PlayerTraits, number][]) {
    next[key] = clamp(next[key] + d);
  }
  return next;
}

// ── Event tags ────────────────────────────────────────────────────────────────

export type TraitEvent =
  | 'read_inscription'     // +wisdom +observation
  | 'read_lore'            // +wisdom +curiosity
  | 'look_around'          // +curiosity +observation
  | 'inspect_object'       // +observation +curiosity
  | 'examine_item'         // +observation
  | 'solve_puzzle_no_hint' // +wisdom +courage +patience
  | 'solve_puzzle_hint'    // +wisdom -patience
  | 'failed_attempt'       // +recklessness -patience
  | 'request_hint'         // -courage  (mild)
  | 'collect_relic'        // +greed (small)
  | 'offer_relic'          // -greed +compassion +wisdom
  | 'refuse_final_relic'   // +compassion +wisdom -greed
  | 'accept_final_relic'   // +courage +greed
  | 'restore_final_relic'  // +wisdom +compassion -greed
  | 'probe_carefully'      // +patience +observation
  | 'rush_movement'        // +recklessness -patience
  | 'use_consumable'       // +patience
  | 'discover_hidden'      // +curiosity +observation +wisdom
  | 'ignore_lore'          // -wisdom -curiosity (if called explicitly)
  | 'new_room_entered'     // +courage
  | 'consecutive_fails'    // ++recklessness
  | 'moral_noble'          // +compassion +integrity
  | 'moral_greedy';        // +greed -compassion

const TRAIT_DELTAS: Record<TraitEvent, Partial<Record<keyof PlayerTraits, number>>> = {
  read_inscription:     { wisdom: 8, observation: 5 },
  read_lore:            { wisdom: 6, curiosity: 4 },
  look_around:          { curiosity: 4, observation: 3 },
  inspect_object:       { observation: 5, curiosity: 3 },
  examine_item:         { observation: 4 },
  solve_puzzle_no_hint: { wisdom: 12, courage: 8, patience: 6 },
  solve_puzzle_hint:    { wisdom: 6, patience: -4 },
  failed_attempt:       { recklessness: 5, patience: -3 },
  request_hint:         { courage: -2 },
  collect_relic:        { greed: 4 },
  offer_relic:          { greed: -6, compassion: 8, wisdom: 4 },
  refuse_final_relic:   { compassion: 15, wisdom: 10, greed: -10 },
  accept_final_relic:   { courage: 10, greed: 8 },
  restore_final_relic:  { wisdom: 15, compassion: 12, greed: -12 },
  probe_carefully:      { patience: 6, observation: 4 },
  rush_movement:        { recklessness: 4, patience: -3 },
  use_consumable:       { patience: 5 },
  discover_hidden:      { curiosity: 10, observation: 8, wisdom: 6 },
  ignore_lore:          { wisdom: -4, curiosity: -3 },
  new_room_entered:     { courage: 4 },
  consecutive_fails:    { recklessness: 8, patience: -5 },
  moral_noble:          { compassion: 6 },
  moral_greedy:         { greed: 6, compassion: -4 },
};

/**
 * Apply a trait event — returns updated PlayerTraits.
 */
export function applyTraitEvent(
  traits: PlayerTraits,
  event: TraitEvent,
): PlayerTraits {
  const changes = TRAIT_DELTAS[event];
  if (!changes) return traits;
  return delta(traits, changes);
}

/**
 * Derives a text label for the dominant trait.
 */
export function getDominantTrait(traits: PlayerTraits): string {
  const entries = Object.entries(traits) as [keyof PlayerTraits, number][];
  const top = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  const labels: Record<keyof PlayerTraits, string> = {
    curiosity: 'The Curious Scholar',
    wisdom: 'The Wise Interpreter',
    courage: 'The Brave Explorer',
    greed: 'The Acquisitive Seeker',
    compassion: 'The Humble Pilgrim',
    patience: 'The Patient Observer',
    recklessness: 'The Reckless Adventurer',
    observation: 'The Keen Observer',
  };
  return labels[top[0]] ?? 'The Explorer';
}

/**
 * Map command string to trait event (called by commandEngine to auto-apply traits).
 */
export function commandToTraitEvent(cmd: string): TraitEvent | null {
  if (cmd.includes('read inscription') || cmd.includes('translate') || cmd.includes('lintel')) return 'read_inscription';
  if (cmd.includes('read') || cmd.includes('decode') || cmd.includes('carvings') || cmd.includes('scroll')) return 'read_lore';
  if (cmd.includes('look around') || cmd.includes('look')) return 'look_around';
  if (cmd.includes('inspect') || cmd.includes('examine') || cmd.includes('study')) return 'inspect_object';
  if (cmd.includes('probe') || cmd.includes('test depth')) return 'probe_carefully';
  if (cmd.includes('use oil') || cmd.includes('oil flask')) return 'use_consumable';
  if (cmd.includes('ask guide') || cmd.includes('ask explorer')) return 'request_hint';
  return null;
}

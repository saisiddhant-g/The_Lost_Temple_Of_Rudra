/**
 * gameItems.ts
 * Canonical item catalog. Each item is fully described.
 * Items are referenced by id throughout the game engine.
 */
import { InventoryItem } from '../types';

export const ITEM_CATALOG: Record<string, InventoryItem> = {

  // ── Starting gear ────────────────────────────────────────────────────────
  ancient_torch: {
    id: 'ancient_torch',
    name: 'Ancient Torch',
    description: 'A heavy iron bracket torch imbued with tallow and resin. Burns with a steady gold flame.',
    inspectionText: 'The flame does not waver. Whatever resin coats the tallow is older than you and has not gone dry. The torch will last as long as your resolve.',
    category: 'tool',
    condition: 'Lit',
    usable: true,
    stackable: false,
    quantity: 1,
    usageRules: 'Light braziers, reveal hidden inscriptions, or ward off shadows.',
  },

  temple_map: {
    id: 'temple_map',
    name: 'Temple Map',
    description: 'Incomplete field diagram of the temple\'s known passages, hand-inked on rice paper.',
    inspectionText: 'Half the corridors taper into question marks. The chamber marked "Final" has been circled three times by whoever drew this — and the pencil was pressed hard enough to score the paper.',
    category: 'collectible',
    condition: 'Partial',
    usable: true,
    stackable: false,
    quantity: 1,
    usageRules: 'Read to recall approximate temple layout and known hazards.',
  },

  bronze_key: {
    id: 'bronze_key',
    name: 'Bronze Key',
    description: 'A flat-headed ceremonial key cast in worn bronze. The grip bears a trident motif.',
    inspectionText: 'Three prongs on the grip — Rudra\'s trident. The key is too ceremonial to be functional, yet the ward profile matches something you haven\'t found yet.',
    category: 'key',
    condition: 'Tarnished',
    usable: true,
    stackable: false,
    quantity: 1,
    usageRules: 'Unlocks mechanisms engraved with the trident seal.',
  },

  rope: {
    id: 'rope',
    name: 'Rope Coil',
    description: 'Heavy hemp rope, sixty feet. Suitable for descending shafts or securing crossings.',
    inspectionText: 'You tested this rope before you left camp. It held two hundred pounds without creaking. The flooded corridor will need it if the bridge has failed.',
    category: 'tool',
    condition: 'Sturdy',
    usable: true,
    stackable: false,
    quantity: 1,
    usageRules: 'Descend shafts, bridge gaps, or secure unstable structures.',
  },

  stone_tablet: {
    id: 'stone_tablet',
    name: 'Stone Tablet',
    description: 'A palm-sized baked clay tablet covered in Proto-Shaiva script.',
    inspectionText: 'The script is Proto-Shaiva — fourth century, maybe earlier. The visible fragment reads: "...the guardian does not sleep. It merely agrees not to notice." You put it away carefully.',
    category: 'collectible',
    condition: 'Fragile',
    usable: true,
    stackable: false,
    quantity: 1,
    usageRules: 'Cross-reference with other inscriptions to decode room puzzles.',
  },

  oil_flask: {
    id: 'oil_flask',
    name: 'Oil Flask',
    description: 'Brass flask filled with pressed temple-sesame oil. Burns clean.',
    inspectionText: 'A full flask. The oil smells faintly of sandalwood and dried flowers — ritual oil, not lamp oil. Burning it will do the job, but it feels like a small sacrilege.',
    category: 'consumable',
    condition: 'Full',
    usable: true,
    stackable: true,
    quantity: 1,
    usageRules: 'Refuel the Ancient Torch or anoint shrine braziers. Consumed on use.',
  },

  temple_seal: {
    id: 'temple_seal',
    name: 'Temple Seal',
    description: 'A heavy disc of black obsidian engraved with the eight-armed Rudra sigil.',
    inspectionText: 'The seal catches light strangely — it absorbs torchlight on one face and reflects it doubled on the other. The obsidian is flawless. Whatever this opens, it was meant to stay shut.',
    category: 'key',
    condition: 'Intact',
    usable: true,
    stackable: false,
    quantity: 1,
    usageRules: 'Activates seal-locked mechanisms in the Sanctum and inner chambers.',
  },

  // ── Collectibles found during play ───────────────────────────────────────
  threshold_rubbing: {
    id: 'threshold_rubbing',
    name: 'Threshold Rubbing',
    description: 'Charcoal transfer of the entrance lintel inscription on rice paper.',
    inspectionText: 'Held at arm\'s length, the rubbing resolves into three clear lines: a flame glyph, a door glyph, and a glyph you don\'t recognise — possibly a name. Possibly a warning.',
    category: 'collectible',
    condition: 'Legible',
    usable: false,
    stackable: false,
    quantity: 1,
  },

  resonance_shard: {
    id: 'resonance_shard',
    name: 'Resonance Shard',
    description: 'A triangular crystal sliver that vibrates at 432Hz near ancient temple machinery.',
    inspectionText: 'When you press it against your wrist you can feel a faint oscillation — not the crystal, but something underneath it resonating in return. The Hall of Echoes wants this back.',
    category: 'relic',
    condition: 'Resonant',
    usable: true,
    stackable: false,
    quantity: 1,
    usageRules: 'Amplifies acoustic mechanisms. Required for resonance puzzles.',
  },

  glyph_rubbing: {
    id: 'glyph_rubbing',
    name: 'Glyph Rubbing',
    description: 'Detailed parchment rubbing of the five Sanskrit glyph plates from the Puzzle Chamber.',
    inspectionText: 'Five impressions in sequence: Creation, Preservation, Dissolution, and — between the last two — a blank space. The fifth plate was left blank on purpose. The unspeakable syllable.',
    category: 'collectible',
    condition: 'Complete',
    usable: true,
    stackable: false,
    quantity: 1,
    usageRules: 'Reference glyph order when interpreting further Sanskrit inscriptions.',
  },

  drainage_tablet: {
    id: 'drainage_tablet',
    name: 'Drainage Tablet',
    description: 'Heavy slate engraved with hydraulic canal diagrams and valve notation.',
    inspectionText: 'The diagram is an engineer\'s cross-section of the flooded corridor sluice system. Three valves are labelled. The third is circled twice in what looks like rust — or old blood.',
    category: 'relic',
    condition: 'Intact',
    usable: true,
    stackable: false,
    quantity: 1,
    usageRules: 'Identifies the correct valve in the Flooded Corridor drainage system.',
  },

  bronze_fish: {
    id: 'bronze_fish',
    name: 'Bronze Fish',
    description: 'A weighted mechanical key in the shape of a river fish. Used in sluice gate mechanisms.',
    inspectionText: 'The fish is weighted to match sluice valve torque exactly. Someone cast this to open the third gate and nothing else. The tail fits a socket you remember seeing on the upper wall.',
    category: 'tool',
    condition: 'Functional',
    usable: true,
    stackable: false,
    quantity: 1,
    usageRules: 'Turns the third sluice valve in the Flooded Corridor.',
  },

  ember_vessel: {
    id: 'ember_vessel',
    name: 'Ember Vessel',
    description: 'A sacred brass vessel carrying perpetual ritual ash that never fully cools.',
    inspectionText: 'The ash inside glows faint orange even in darkness. You hold your hand above the lip and feel warmth — not heat. The kind of warmth that means something is still alive in there.',
    category: 'relic',
    condition: 'Warm',
    usable: true,
    stackable: false,
    quantity: 1,
    usageRules: 'Kindles elemental shrines in the correct sequence.',
  },

  temple_core_fragment: {
    id: 'temple_core_fragment',
    name: 'Temple Core Fragment',
    description: 'A pulsing crystal shard containing the living memory of Rudra.',
    inspectionText: 'When you close your hand around it, you see things: not visions — memories. A city. Fires. A choice made once that is being offered again. The fragment is warm. It is waiting.',
    category: 'relic',
    condition: 'Pulsing',
    usable: false,
    stackable: false,
    quantity: 1,
  },

  // ── New puzzle-specific items ─────────────────────────────────────────────
  echo_crystal_fragment: {
    id: 'echo_crystal_fragment',
    name: 'Echo Crystal',
    description: 'A small quartz crystal that vibrates and hums when held near resonant surfaces.',
    inspectionText: 'Three faces of the crystal are smooth. One face is fractured and raw — it broke free from something larger. Pressing it to the wall of the Hall of Echoes produces a faint tone.',
    category: 'relic',
    condition: 'Active',
    usable: true,
    stackable: false,
    quantity: 1,
    usageRules: 'Activate Echo Crystals throughout the Hall of Echoes to build the resonance sequence.',
  },

  hidden_symbol_rubbing: {
    id: 'hidden_symbol_rubbing',
    name: 'Hidden Symbol Rubbing',
    description: 'Charcoal transfer of the concealed glyphs revealed beneath the entrance inscription.',
    inspectionText: 'Under the public inscription, a second layer of symbols was carved — smaller, older, different script. These read: "The name above is the key. The name below is the lock. Both must be spoken."',
    category: 'collectible',
    condition: 'Legible',
    usable: true,
    stackable: false,
    quantity: 1,
    usageRules: 'Cross-reference with glyph plates in the Puzzle Chamber.',
  },

  submerged_relic: {
    id: 'submerged_relic',
    name: 'Submerged Relic',
    description: 'A bronze plaque recovered from the flooded corridor floor. Depicts the temple\'s founding ritual.',
    inspectionText: 'The plaque was cast when the temple was new. It shows four priests in sequence — earth, water, fire, air — performing a ritual that looks identical to what the Chamber of Elements requires. The order is confirmed: Earth first.',
    category: 'relic',
    condition: 'Waterlogged',
    usable: true,
    stackable: false,
    quantity: 1,
    usageRules: 'Confirms the correct elemental order for the Chamber of Elements.',
  },

  guardian_seal: {
    id: 'guardian_seal',
    name: 'Guardian Seal',
    description: 'A small obsidian disc that fell from one sentinel\'s base when they were rotated.',
    inspectionText: 'The disc is carved with the same floor markings as the Hall of Guardians. Where those markings indicate convergence, this disc has a hole. It is a key — or a lesson. Both, probably.',
    category: 'key',
    condition: 'Intact',
    usable: true,
    stackable: false,
    quantity: 1,
    usageRules: 'Used in the Sanctum as supplementary offering proof of having mastered the Hall.',
  },

  missing_tablet_fragment: {
    id: 'missing_tablet_fragment',
    name: 'Missing Tablet Fragment',
    description: 'A broken slate piece that completes one of the Library\'s drainage diagrams.',
    inspectionText: 'The fragment fits a gap in the main drainage tablet diagram like a lock accepting its key. With it placed, the full hydraulic diagram is readable — all three valves and their downstream destinations.',
    category: 'collectible',
    condition: 'Fragile',
    usable: true,
    stackable: false,
    quantity: 1,
    usageRules: 'Combine with Drainage Tablet to reveal the complete sluice diagram.',
  },

  ancient_compass: {
    id: 'ancient_compass',
    name: 'Ancient Compass',
    description: 'A temple-made navigational instrument aligned to Rudra\'s cardinal axes, not magnetic north.',
    inspectionText: 'Four arms point to temple-defined directions: Dharma (truth), Karma (action), Moksha (liberation), Maya (illusion). The Dharma arm vibrates when you face the sanctum. The Maya arm points back the way you came.',
    category: 'tool',
    condition: 'Functional',
    usable: true,
    stackable: false,
    quantity: 1,
    usageRules: 'Navigate the temple by Rudra\'s four directional principles rather than cardinal compass points.',
  },

  compass: {
    id: 'compass',
    name: 'Brass Compass',
    description: 'An ancient magnetic compass that spins erratically near Rudra stonework.',
    inspectionText: 'The needle refuses to settle on north. Instead it oscillates between two fixed points — one toward the entrance you came through, one toward something deeper in the mountain.',
    category: 'tool',
    condition: 'Functional',
    usable: true,
    stackable: false,
    quantity: 1,
    usageRules: 'Indicates proximity to magnetically active temple mechanisms.',
  },

  field_journal: {
    id: 'field_journal',
    name: 'Field Journal',
    description: 'Leather-bound archaeological notes from previous expeditions into this site.',
    inspectionText: 'The previous entries stop abruptly at page forty-three. The last sentence reads: "If you find this, do not go past the Sanctum without —" and then nothing. The pen tore the page.',
    category: 'collectible',
    condition: 'Used',
    usable: true,
    stackable: false,
    quantity: 1,
    usageRules: 'Reading it recalls earlier expedition notes and cross-references current puzzles.',
  },
};

/** Helper: get an item from the catalog by id. Throws if not found. */
export function getItem(id: string): InventoryItem {
  const item = ITEM_CATALOG[id];
  if (!item) throw new Error(`Item not found in catalog: ${id}`);
  return { ...item };
}

/** Helper: get multiple items by id array */
export function getItems(ids: string[]): InventoryItem[] {
  return ids.map(getItem);
}

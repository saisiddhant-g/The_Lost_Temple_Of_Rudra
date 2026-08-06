/**
 * puzzleRegistry.ts
 * All 9 room puzzle definitions. Pure data — no mutations.
 * Each puzzle has multi-step chains with item dependencies.
 */
import { PuzzleDefinition } from '../types';

// ── ENTRANCE ──────────────────────────────────────────────────────────────────
const PUZZLE_ENTRANCE: PuzzleDefinition = {
  id: 'puzzle_entrance',
  roomId: 'entrance',
  title: 'The Sealed Threshold',
  description: 'The ancient gate is held by a thermal lock. Decode the inscription, reveal the hidden layer, then light the brazier.',
  completionNarration: 'Golden fire leaps across the brazier bracket. Deep counterweights disengage with a floor-shaking thud and the lion doors swing wide, releasing cold air from the temple interior.',
  unlocksRoom: 'guardians',
  completionRewardItems: ['threshold_rubbing'],
  completionJournalText: 'Solved the Sealed Threshold. Inscription decoded, hidden symbols revealed, brazier lit. The Hall of Guardians lies ahead.',
  completionAudioEvent: 'stone',
  steps: [
    {
      id: 'entrance_s1',
      description: 'Read the lintel inscription',
      triggerKeywords: ['read inscription', 'read the inscription', 'read lintel', 'read', 'inscription', 'lintel', 'translate'],
      successNarration: 'The lintel script flares gold as your torch passes close. You translate it carefully: "Bring warmth to the cold stone; only light may unbolt the eternal threshold." Something stirs in the masonry above — a mechanism waiting.',
      journalText: 'Lintel inscription: "Bring warmth to the cold stone; only light may unbolt the eternal threshold." There is a second layer of text beneath — partially legible.',
      journalCategory: 'lore',
      objectiveTaskIndex: 0,
      audioEvent: 'click',
    },
    {
      id: 'entrance_s2',
      description: 'Reveal the hidden symbols beneath the inscription',
      triggerKeywords: ['inspect symbols', 'hidden symbols', 'second inscription', 'reveal', 'rub', 'trace', 'charcoal', 'look closer', 'look close', 'examine lintel', 'examine inscription'],
      requiredItems: ['ancient_torch'],
      successNarration: 'You hold the torch directly against the stone. The heat causes a secondary inscription to emerge — written in a different hand, older script: "The name below is the lock. Fire speaks the key." You make a charcoal rubbing immediately.',
      missingItemNarration: 'You need a light source to reveal the heat-reactive hidden symbols beneath the inscription.',
      rewardItems: ['hidden_symbol_rubbing'],
      journalText: 'Hidden inscription found: "The name below is the lock. Fire speaks the key." Heat-reactive secondary text — someone encoded two messages in the same stone.',
      journalCategory: 'discovery',
      objectiveTaskIndex: 1,
      audioEvent: 'click',
    },
    {
      id: 'entrance_s3',
      description: 'Light the brazier with the Ancient Torch',
      triggerKeywords: ['light brazier', 'light the brazier', 'brazier', 'ignite', 'torch to brazier', 'kindle', 'fire', 'light'],
      requiredItems: ['ancient_torch'],
      successNarration: 'You press the Ancient Torch to the dry tallow. It catches in a single breath — a column of gold fire rises from the iron bracket, and the thermal lock above the lintel releases.',
      missingItemNarration: 'The brazier bracket is cold and dry. You need a flame source to light it.',
      journalText: 'Lit the threshold brazier. The thermal lock disengaged and the lion doors opened.',
      journalCategory: 'event',
      objectiveTaskIndex: 2,
      audioEvent: 'stone',
    },
  ],
};

// ── HALL OF GUARDIANS ─────────────────────────────────────────────────────────
const PUZZLE_GUARDIANS: PuzzleDefinition = {
  id: 'puzzle_guardians',
  roomId: 'guardians',
  title: 'The Four Watchers',
  description: 'Four sentinels guard the passage. Study their orientation, read the carvings, then rotate each to face inward.',
  completionNarration: 'The last sentinel grinds inward on perfect bearings. A floor pin disengages with a clean mechanical click and the northern arch unseals, releasing a breath of cooler air from the Hall of Echoes.',
  unlocksRoom: 'echoes',
  completionRewardItems: ['guardian_seal'],
  completionJournalText: 'Solved: The Four Watchers. All sentinels rotated inward. Guardian Seal recovered from pedestal base.',
  completionAudioEvent: 'stone',
  steps: [
    {
      id: 'guardians_s1',
      description: 'Study the floor markings',
      triggerKeywords: ['look around', 'floor markings', 'floor', 'markings', 'study', 'floor pattern', 'geometric', 'inlay', 'copper'],
      successNarration: 'The copper-inlaid floor channels form a convergence pattern — eight lines from the room\'s perimeter all leading to the central altar. The pattern is not decorative. It is instructional.',
      journalText: 'Floor channels converge on the central altar. The geometry is a map of orientation, not decoration.',
      journalCategory: 'observation',
      objectiveTaskIndex: 0,
    },
    {
      id: 'guardians_s2',
      description: 'Read the pedestal carvings',
      triggerKeywords: ['read carvings', 'read the carvings', 'carvings', 'pedestal', 'read pedestal', 'read', 'translate carvings'],
      successNarration: '"When the four sentinels turn their gaze inward to the central altar, the path shall open without sound." Below that, in a different script: "Do not look at their faces while they move. The watchers interpret movement as aggression."',
      journalText: '"When four sentinels face inward to the altar, the path opens." Warning: do not make eye contact during rotation.',
      journalCategory: 'lore',
      objectiveTaskIndex: 1,
    },
    {
      id: 'guardians_s3',
      description: 'Rotate the sentinels inward — all four',
      triggerKeywords: ['rotate statue', 'rotate statues', 'rotate sentinel', 'rotate all', 'turn statue', 'turn sentinels', 'rotate', 'turn inward', 'align', 'face inward'],
      successNarration: 'Keeping your eyes averted, you grip each sentinel\'s shoulder and rotate it inward. The stone moves on magnetic bearings — silent, counterintuitively smooth. Fourth sentinel done.',
      journalText: 'Rotated all four sentinels inward toward the altar. Floor mechanism engaged.',
      journalCategory: 'event',
      objectiveTaskIndex: 2,
      audioEvent: 'stone',
    },
  ],
};

// ── HALL OF ECHOES ────────────────────────────────────────────────────────────
const PUZZLE_ECHOES: PuzzleDefinition = {
  id: 'puzzle_echoes',
  roomId: 'echoes',
  title: 'The Resonance Sequence',
  description: 'Three Echo Crystals are hidden in the hall. Activate each, listen to the sequence they produce, then attune the central orb.',
  completionNarration: 'The three crystals sing together in a perfect triad. The central orb locks onto the chord, amplifying it through the mechanism until a clear bell-tone rings out and the hidden doorway slides open.',
  unlocksRoom: 'puzzle',
  completionRewardItems: ['resonance_shard'],
  completionJournalText: 'Solved: The Resonance Sequence. All three Echo Crystals activated in sequence. Resonance Shard recovered. Eastern passage open.',
  completionAudioEvent: 'bell',
  steps: [
    {
      id: 'echoes_s1',
      description: 'Listen carefully to the hall',
      triggerKeywords: ['listen', 'listen carefully', 'be still', 'silence', 'hear', 'sound', 'echo', 'stand still'],
      successNarration: 'You hold your breath. The hall gives back every sound precisely 1.5 seconds later — a fixed interval, not random reverb. Three distinct tones layer within the echo: low, mid, high. The niches are tuned differently.',
      journalText: 'Echo interval: exactly 1.5 seconds. Three distinct tones in the reverb — the alcoves are tuned instruments.',
      journalCategory: 'observation',
      objectiveTaskIndex: 0,
    },
    {
      id: 'echoes_s2',
      description: 'Activate the Echo Crystals hidden in the niches',
      triggerKeywords: ['activate crystal', 'echo crystal', 'crystal', 'touch crystal', 'niches', 'read niches', 'activate niches', 'touch niches', 'alcoves', 'activate'],
      successNarration: 'You touch the crystal fragment to each niche in sequence. The first hums low. The second rings mid. The third sings high. Each releases a sustained tone that builds into a chord — the hall is a musical instrument.',
      rewardItems: ['echo_crystal_fragment'],
      journalText: 'Three Echo Crystals activated: low-mid-high sequence. The hall now resonates at 432Hz composite.',
      journalCategory: 'discovery',
      objectiveTaskIndex: 1,
      audioEvent: 'bell',
    },
    {
      id: 'echoes_s3',
      description: 'Attune the central orb to complete the resonance',
      triggerKeywords: ['touch orb', 'attune orb', 'attune', 'orb', 'central orb', 'match tone', 'activate orb'],
      requiredItems: ['echo_crystal_fragment'],
      successNarration: 'You press your palm to the central orb with the Echo Crystal against your wrist. The orb recognises the 432Hz frequency and locks on. The resonance completes.',
      missingItemNarration: 'The orb responds to your touch but slides back to neutral. It needs a resonance catalyst — one of the crystal fragments from the niches.',
      journalText: 'Central orb attuned. Resonance sequence complete. Hidden doorway opened.',
      journalCategory: 'event',
      objectiveTaskIndex: 2,
      audioEvent: 'bell',
    },
  ],
};

// ── PUZZLE CHAMBER ────────────────────────────────────────────────────────────
const PUZZLE_CHAMBER: PuzzleDefinition = {
  id: 'puzzle_chamber',
  roomId: 'puzzle',
  title: 'The Glyph Alignment',
  description: 'Five Sanskrit glyph plates must be aligned in cosmic sequence. Inspect them, decode the order, then rotate them correctly.',
  completionNarration: 'Each plate clicks into position with a resonant tone. On the final rotation the floor trembles, massive counterweights engage, and a section of floor slides aside to reveal descending steps.',
  unlocksRoom: 'library',
  completionRewardItems: ['glyph_rubbing'],
  completionJournalText: 'Solved: The Glyph Alignment. Cosmic sequence locked: Creation → Preservation → Dissolution. Blank plate untouched. Library stairs opened.',
  completionAudioEvent: 'stone',
  steps: [
    {
      id: 'puzzle_s1',
      description: 'Inspect the five glyph plates',
      triggerKeywords: ['inspect plates', 'inspect the plates', 'plates', 'examine plates', 'inspect', 'look at plates', 'study plates'],
      successNarration: 'Five basalt plates in a cross pattern, each glowing with bioluminescent Sanskrit. Four are labelled. The fifth — the centre plate — is blank, its surface polished smooth. Someone chose specifically to leave it unmarked.',
      journalText: 'Five glyph plates: four labelled in Sanskrit, one deliberately blank at the centre. The blank one must not be moved.',
      journalCategory: 'observation',
      objectiveTaskIndex: 0,
    },
    {
      id: 'puzzle_s2',
      description: 'Decode the Sanskrit cosmic-cycle symbols',
      triggerKeywords: ['read symbols', 'decode symbols', 'translate', 'decode glyphs', 'read glyphs', 'glyph', 'cosmic', 'sanskrit', 'decipher', 'read'],
      successNarration: 'The four labelled plates read: Srishti (Creation), Sthiti (Preservation), Samhara (Dissolution), and Anugraha (Grace). A wall inscription warns: "The blank plate is the unspeakable syllable — it is already in its correct position."',
      journalText: 'Glyph order decoded: Creation → Preservation → Dissolution → Grace. Blank plate = unspeakable syllable. Do not touch it.',
      journalCategory: 'lore',
      objectiveTaskIndex: 1,
    },
    {
      id: 'puzzle_s3',
      description: 'Rotate the plates into the correct celestial order',
      triggerKeywords: ['rotate plate', 'rotate plates', 'align plates', 'rotate', 'align', 'arrange', 'order plates', 'sequence'],
      successNarration: 'You rotate Creation to north, Preservation to east, Dissolution to south — each click producing a clear tone as the mechanism registers the correct alignment.',
      journalText: 'Plates rotated into cosmic sequence. Mechanism engaged. Stairs to Library of Whispers revealed.',
      journalCategory: 'event',
      objectiveTaskIndex: 2,
      audioEvent: 'stone',
    },
  ],
};

// ── LIBRARY OF WHISPERS ───────────────────────────────────────────────────────
const PUZZLE_LIBRARY: PuzzleDefinition = {
  id: 'puzzle_library',
  roomId: 'library',
  title: 'The Whispering Archive',
  description: 'Locate the missing tablet fragment, combine it with the drainage diagram, translate the complete schematic, then take the Drainage Tablet.',
  completionNarration: 'With the fragment in place, the drainage diagram is complete. You trace the third valve\'s path — it leads to the aquifer, exactly as needed. You slide the full slate tablet free from its housing and a hidden passage opens.',
  unlocksRoom: 'flooded',
  completionRewardItems: ['drainage_tablet'],
  completionConsumedItems: ['missing_tablet_fragment'],
  completionJournalText: 'Solved: The Whispering Archive. Fragment combined, full drainage schematic read. Drainage Tablet secured. Flooded Corridor passage open.',
  completionAudioEvent: 'stone',
  steps: [
    {
      id: 'library_s1',
      description: 'Survey the tablet stacks — distinguish silent from whispering',
      triggerKeywords: ['look around', 'survey stacks', 'inspect tablets', 'survey', 'scan', 'search stacks', 'explore', 'survey tablets'],
      successNarration: 'Two distinct categories: baked clay tablets that whisper continuously, and heavy slate tablets that are silent. The whispers are misinformation — you learned that much outside. The slate tablets are the real archive.',
      journalText: 'Clay tablets whisper (false information). Slate tablets are silent (true archive). The drainage tablet will be slate.',
      journalCategory: 'observation',
      objectiveTaskIndex: 0,
    },
    {
      id: 'library_s2',
      description: 'Find and retrieve the missing tablet fragment',
      triggerKeywords: ['search fragment', 'fragment', 'missing piece', 'broken tablet', 'piece', 'look for fragment', 'find fragment', 'search floor', 'ground'],
      successNarration: 'Between two shelving units, partially buried under silt, you find a broken slate fragment — the missing piece from the main drainage diagram. The break is old. It was dropped here, not placed.',
      rewardItems: ['missing_tablet_fragment'],
      journalText: 'Found the missing tablet fragment behind the second shelving unit. Fits the drainage diagram gap precisely.',
      journalCategory: 'discovery',
      objectiveTaskIndex: 1,
    },
    {
      id: 'library_s3',
      description: 'Combine fragment with main diagram and read the complete schematic',
      triggerKeywords: ['read scroll', 'read tablet', 'combine fragment', 'assemble', 'read drainage', 'read diagram', 'read', 'translate', 'study tablet'],
      requiredItems: ['missing_tablet_fragment'],
      successNarration: 'You press the fragment into the gap. The diagram completes: three valves, their downstream paths clearly labelled. The third valve — marked with a fish — drains to the deep aquifer. The first floods the hall. The second gates the entrance.',
      missingItemNarration: 'The main drainage diagram has a gap — a piece is missing somewhere in this room.',
      journalText: '"Third valve (fish symbol) → aquifer drain → clears the corridor. Do NOT open first valve (floods hall) or second (locks entrance)."',
      journalCategory: 'lore',
    },
  ],
  // take_tablet handled separately as it consumes the fragment and completes the puzzle
};

// ── FLOODED CORRIDOR ──────────────────────────────────────────────────────────
const PUZZLE_FLOODED: PuzzleDefinition = {
  id: 'puzzle_flooded',
  roomId: 'flooded',
  title: 'The Third Sluice',
  description: 'The corridor is flooded. Probe the depth, read the valve markings, recover the submerged relic, then engage the correct sluice.',
  completionNarration: 'The Bronze Fish engages the socket with a precise click. The third sluice opens and water roars downward into the aquifer. Within a minute the corridor floor is bare stone.',
  unlocksRoom: 'elements',
  completionJournalText: 'Solved: The Third Sluice. Corridor drained. Submerged Relic recovered. Chamber of Elements accessible.',
  completionAudioEvent: 'stone',
  steps: [
    {
      id: 'flooded_s1',
      description: 'Probe the flooded floor',
      triggerKeywords: ['probe water', 'probe floor', 'probe', 'test depth', 'rope', 'test water', 'depth', 'wade', 'feel bottom'],
      requiredItems: ['rope'],
      successNarration: 'You lower the rope into the dark water — two feet deep, with submerged stone steps clearly present. You feel something hard on the floor: metal, rectangular, heavy. A relic, left here long before the flooding.',
      missingItemNarration: 'You need something to probe the depth safely — the water is opaque and you cannot see the bottom.',
      journalText: 'Water depth: two feet. Submerged stone steps confirmed. Metal object detected on floor — relic?',
      journalCategory: 'observation',
      objectiveTaskIndex: 0,
      audioEvent: 'water',
    },
    {
      id: 'flooded_s2',
      description: 'Recover the submerged relic from the floor',
      triggerKeywords: ['recover relic', 'submerged relic', 'reach down', 'retrieve', 'grab object', 'floor object', 'pick up', 'dive', 'submerged'],
      successNarration: 'You reach into the cold water and close your fingers around the object — a heavy bronze plaque. You pull it free and wipe the silt away. It depicts the founding ritual of this temple in perfect relief.',
      rewardItems: ['submerged_relic'],
      journalText: 'Recovered a bronze founding-ritual plaque from the floor. Shows elemental shrine sequence clearly: Earth → Water → Fire → Air.',
      journalCategory: 'discovery',
      objectiveTaskIndex: 1,
    },
    {
      id: 'flooded_s3',
      description: 'Read the sluice valve markings',
      triggerKeywords: ['read markings', 'valve markings', 'markings', 'read valves', 'inscription', 'glyph valve', 'read'],
      successNarration: '"First valve: the flood remembers its origin. Second valve: the gate remembers its lock. Third valve: the aquifer remembers its thirst." The fish symbol is on the third valve. The Drainage Tablet confirms it.',
      journalText: '"Third valve (fish) = aquifer drain." Matches the Library\'s schematic exactly.',
      journalCategory: 'observation',
      objectiveTaskIndex: 2,
    },
  ],
  // open_sluice handled separately — requires bronze_fish + drainage_tablet
};

// ── CHAMBER OF ELEMENTS ───────────────────────────────────────────────────────
const PUZZLE_ELEMENTS: PuzzleDefinition = {
  id: 'puzzle_elements',
  roomId: 'elements',
  title: 'The Elemental Circuit',
  description: 'Four elemental shrines must be kindled in the correct order. Inspect each, read the ritual inscription, then light them: Earth → Water → Fire → Air.',
  completionNarration: 'Earth lights steady. Water blooms cold-blue. Fire erupts amber. Air breathes a thin clear flame that bends toward nothing. The gold circuit floods with light and the sanctum gates swing open.',
  unlocksRoom: 'sanctum',
  completionRewardItems: ['ember_vessel'],
  completionJournalText: 'Solved: The Elemental Circuit. All four shrines kindled in order. Ember Vessel recovered. Sanctum of Rudra open.',
  completionAudioEvent: 'bell',
  steps: [
    {
      id: 'elements_s1',
      description: 'Inspect each shrine and identify the elements',
      triggerKeywords: ['inspect shrines', 'inspect shrine', 'examine shrine', 'look at shrines', 'study shrines', 'inspect'],
      successNarration: 'Basalt (earth) — warm and still. Aquamarine (water) — cool with a constant mist rising. Obsidian (fire) — faint warmth, faint sulfur. Pumice (air) — a slow, sourceless draft. Four materials, four weathers.',
      journalText: 'Four shrines: Earth (basalt), Water (aquamarine), Fire (obsidian), Air (pumice). Each has its own microclimate.',
      journalCategory: 'observation',
      objectiveTaskIndex: 0,
    },
    {
      id: 'elements_s2',
      description: 'Read the ritual sequence inscription',
      triggerKeywords: ['read ritual', 'ritual inscription', 'floor inscription', 'read floor', 'inlay', 'inscription', 'read', 'ritual', 'sequence'],
      successNarration: '"Earth holds. Water carries. Fire changes. Air remains. Kindle them in their nature and the circuit completes. Earth is the foundation — it must be first always." The Submerged Relic confirms it.',
      journalText: '"Earth first. Water second. Fire third. Air last." The Submerged Relic plaque matches this exactly.',
      journalCategory: 'lore',
      objectiveTaskIndex: 1,
    },
    {
      id: 'elements_s3',
      description: 'Kindle Fire shrine (third in sequence)',
      triggerKeywords: ['kindle fire', 'light fire', 'fire shrine', 'kindle shrine', 'kindle third', 'activate fire'],
      requiredItems: ['ancient_torch'],
      successNarration: 'The obsidian fire shrine ignites — a column of amber flame rises from its basin. The gold inlay between Water and Fire lights up, confirming the sequence.',
      missingItemNarration: 'You need a fire source to kindle the shrines.',
      journalText: 'Fire shrine kindled — third in sequence. Gold circuit partially lit.',
      journalCategory: 'event',
      objectiveTaskIndex: 2,
      audioEvent: 'bell',
    },
  ],
  // Full elemental sequence handled in commandEngine for Earth→Water→Fire→Air chain
};

// ── SANCTUM OF RUDRA ──────────────────────────────────────────────────────────
const PUZZLE_SANCTUM: PuzzleDefinition = {
  id: 'puzzle_sanctum',
  roomId: 'sanctum',
  title: 'The Sacred Offering',
  description: 'Approach the statue, read the pedestal inscription, then present all gathered relics at Rudra\'s feet.',
  completionNarration: 'The obsidian eyes open. Not metaphorically — they open. Gold light falls in two columns. The floor parts and the Final Chamber is revealed beneath.',
  unlocksRoom: 'final',
  completionJournalText: 'Solved: The Sacred Offering. Relics presented. Rudra acknowledged the offering. Final Chamber unsealed.',
  completionAudioEvent: 'bell',
  steps: [
    {
      id: 'sanctum_s1',
      description: 'Approach the statue and study it',
      triggerKeywords: ['inspect statue', 'approach statue', 'look at statue', 'examine statue', 'study statue', 'inspect', 'approach'],
      successNarration: 'Twenty feet of obsidian, eight arms each holding a divine attribute — trident, flame, drum, lotus, skull, serpent, bow. One hand is open, palm outward, empty. That hand faces you. Rudra is waiting to receive something.',
      journalText: 'Rudra\'s eight arms: all attributes held except one — an open empty palm facing the visitor. The posture of receiving.',
      journalCategory: 'observation',
      objectiveTaskIndex: 0,
    },
    {
      id: 'sanctum_s2',
      description: 'Read the pedestal inscription',
      triggerKeywords: ['read inscription', 'pedestal', 'read pedestal', 'translate', 'inscription', 'read base', 'read'],
      successNarration: '"Offer that which you gathered without greed and receive eternal vision. Offer that which you gathered with greed and receive eternal silence." Below that, scratched in charcoal by a past visitor: "Leave the Ember Vessel here. It belongs to this room."',
      journalText: '"Offer without greed: eternal vision. Offer with greed: eternal silence." The Ember Vessel must be among the offerings.',
      journalCategory: 'teaching',
      objectiveTaskIndex: 1,
    },
    {
      id: 'sanctum_s3',
      description: 'Perform the ritual offering',
      triggerKeywords: ['make offering', 'offer relics', 'place relics', 'offer', 'present relics', 'ritual', 'give relics'],
      requiredItems: ['ember_vessel'],
      successNarration: 'You place the relics at the statue\'s feet. Each one settles onto the gold inlay with a soft resonant tone, as if the floor itself is accepting them.',
      missingItemNarration: 'You need the sacred relics you gathered through the temple — especially the Ember Vessel from the Chamber of Elements.',
      journalText: 'Offering made at Rudra\'s feet. The gate to the Final Chamber opened.',
      journalCategory: 'event',
      objectiveTaskIndex: 2,
      audioEvent: 'bell',
    },
  ],
};

// ── FINAL CHAMBER ─────────────────────────────────────────────────────────────
const PUZZLE_FINAL: PuzzleDefinition = {
  id: 'puzzle_final',
  roomId: 'final',
  title: 'The Eye of Rudra',
  description: 'Face the Eye of Rudra. Inspect it, read its message, then make your final choice: accept, refuse, or return it.',
  completionNarration: 'The choice is made. The temple cycle completes.',
  completionJournalText: 'Entered the Final Chamber. Faced the Eye of Rudra. The choice was made.',
  steps: [
    {
      id: 'final_s1',
      description: 'Approach and inspect the Eye of Rudra',
      triggerKeywords: ['inspect relic', 'inspect eye', 'examine relic', 'look at relic', 'approach relic', 'study relic', 'inspect core', 'look'],
      successNarration: 'The Eye is a sphere of violet light in a bronze lattice. Space bends slightly around it. Your hand distorts at the edge of its field. Inside the light — very small, very far — something moves.',
      journalText: 'The Eye of Rudra: violet light, bronze lattice. Space distorts around it. Something living inside the light.',
      journalCategory: 'discovery',
      objectiveTaskIndex: 1,
    },
    {
      id: 'final_s2',
      description: 'Read the core — let it speak',
      triggerKeywords: ['read core', 'listen to core', 'hear relic', 'core message', 'relic speaks', 'read', 'listen', 'core'],
      successNarration: 'The core speaks directly into your mind: "Thousands of years of waiting conclude with you. Carry the memory forward — or leave it here to wait again. The cycle accepts either answer."',
      journalText: '"Carry us forward or leave us here. The cycle accepts either answer." The final choice has no wrong answer.',
      journalCategory: 'teaching',
      objectiveTaskIndex: 0,
    },
  ],
  // accept/refuse/return handled as endings in commandEngine
};

// ── Registry ──────────────────────────────────────────────────────────────────
export const PUZZLE_REGISTRY: Record<string, PuzzleDefinition> = {
  [PUZZLE_ENTRANCE.id]: PUZZLE_ENTRANCE,
  [PUZZLE_GUARDIANS.id]: PUZZLE_GUARDIANS,
  [PUZZLE_ECHOES.id]: PUZZLE_ECHOES,
  [PUZZLE_CHAMBER.id]: PUZZLE_CHAMBER,
  [PUZZLE_LIBRARY.id]: PUZZLE_LIBRARY,
  [PUZZLE_FLOODED.id]: PUZZLE_FLOODED,
  [PUZZLE_ELEMENTS.id]: PUZZLE_ELEMENTS,
  [PUZZLE_SANCTUM.id]: PUZZLE_SANCTUM,
  [PUZZLE_FINAL.id]: PUZZLE_FINAL,
};

/** Map from roomId to puzzle id */
export const ROOM_PUZZLE_MAP: Record<string, string> = {
  entrance: PUZZLE_ENTRANCE.id,
  guardians: PUZZLE_GUARDIANS.id,
  echoes: PUZZLE_ECHOES.id,
  puzzle: PUZZLE_CHAMBER.id,
  library: PUZZLE_LIBRARY.id,
  flooded: PUZZLE_FLOODED.id,
  elements: PUZZLE_ELEMENTS.id,
  sanctum: PUZZLE_SANCTUM.id,
  final: PUZZLE_FINAL.id,
};

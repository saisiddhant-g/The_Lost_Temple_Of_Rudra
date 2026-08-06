/**
 * templeData.ts
 * Static room definitions — visual themes, narration, chapter titles.
 * Game state is managed in GameState, not here.
 */
import { RoomData, RoomId } from '../types';

export const ROOM_DATA: Record<RoomId, RoomData> = {
  entrance: {
    id: 'entrance',
    chapter: 'CHAPTER I',
    title: 'TEMPLE ENTRANCE',
    objectiveTitle: 'Light the brazier and open the sealed gate',
    visualTheme: { primaryColor: '#c8aa6e', ambientLight: 'rgba(212,142,44,0.25)', particles: 'dust' },
    narrationLines: [
      'Rain has been falling on this doorway for a thousand years. It has not worn it down.',
      'Two lion guardians hold the threshold, their manes furred with vine. Between them, stone doors taller than three men.',
      'Your torch finds an inscription cut deep into the lintel — and something behind it stirs, as if the temple has been waiting for a reader.',
    ],
    baseActions: [],
    initialItems: [],
    objective: {
      id: 'obj_entrance',
      title: 'Light the brazier and open the sealed gate',
      tasks: [
        { id: 'ent_t1', text: 'Read the threshold inscription', completed: false },
        { id: 'ent_t2', text: 'Light the brazier', completed: false },
        { id: 'ent_t3', text: 'Pass through the open gate', completed: false },
      ],
    },
    entryJournalText: 'Entered the Temple Entrance. The threshold inscription is visible on the lintel.',
  },

  guardians: {
    id: 'guardians',
    chapter: 'CHAPTER II',
    title: 'HALL OF GUARDIANS',
    objectiveTitle: 'Pass the four watchers without waking them',
    visualTheme: { primaryColor: '#8ca6cc', ambientLight: 'rgba(64,120,192,0.25)', particles: 'dust' },
    narrationLines: [
      'Four sentinels stand where the corridor widens, carved from a single vein of black stone.',
      'Pale blue light falls from a fracture far above, and the geometric markings on the floor drink it in.',
      'Their eyes follow the torch. Not you — the torch.',
    ],
    baseActions: [],
    initialItems: [],
    objective: {
      id: 'obj_guardians',
      title: 'Pass the four watchers without waking them',
      tasks: [
        { id: 'gua_t1', text: 'Study the floor markings', completed: false },
        { id: 'gua_t2', text: 'Rotate the sentinels inward', completed: false },
        { id: 'gua_t3', text: 'Cross to the far arch', completed: false },
      ],
    },
    entryJournalText: 'Entered the Hall of Guardians. Four black-stone sentinels watch from each corner.',
  },

  echoes: {
    id: 'echoes',
    chapter: 'CHAPTER III',
    title: 'HALL OF ECHOES',
    objectiveTitle: "Attune the resonance mechanism to the temple's pulse",
    visualTheme: { primaryColor: '#e0bb6b', ambientLight: 'rgba(224,187,107,0.3)', particles: 'sparks' },
    narrationLines: [
      'The hall answers every footstep twice — once for you, once for something a half-second behind.',
      'Wet stone mirrors the torchlight. A circular mechanism waits at the centre, ringed by niched deities.',
      'When you hold your breath, the second footstep keeps walking.',
    ],
    baseActions: [],
    initialItems: [],
    objective: {
      id: 'obj_echoes',
      title: "Attune the resonance mechanism to the temple's pulse",
      tasks: [
        { id: 'ech_t1', text: 'Locate the central resonance orb', completed: false },
        { id: 'ech_t2', text: 'Listen for the echo interval', completed: false },
        { id: 'ech_t3', text: 'Touch the orb to attune it', completed: false },
      ],
    },
    entryJournalText: 'Entered the Hall of Echoes. A resonance mechanism occupies the centre of the chamber.',
  },

  puzzle: {
    id: 'puzzle',
    chapter: 'CHAPTER IV',
    title: 'PUZZLE CHAMBER',
    objectiveTitle: "Align the glyph plates to spell Rudra's name",
    visualTheme: { primaryColor: '#e5ab53', ambientLight: 'rgba(229,171,83,0.35)', particles: 'sparks' },
    narrationLines: [
      'Golden script crawls across the floor and up the walls, alive and unhurried.',
      'Five plates sit in a cross. Behind them, a gate held by ancient engineering — counterweights the size of oxen.',
      'Every wrong rotation dims one torch. The room keeps the tally.',
    ],
    baseActions: [],
    initialItems: [],
    objective: {
      id: 'obj_puzzle',
      title: "Align the glyph plates to spell Rudra's name",
      tasks: [
        { id: 'puz_t1', text: 'Inspect the five stone plates', completed: false },
        { id: 'puz_t2', text: 'Read the cosmic-cycle symbols', completed: false },
        { id: 'puz_t3', text: 'Rotate plates into correct sequence', completed: false },
      ],
    },
    entryJournalText: 'Entered the Puzzle Chamber. Five glyph plates glow with Sanskrit script.',
  },

  library: {
    id: 'library',
    chapter: 'CHAPTER V',
    title: 'LIBRARY OF WHISPERS',
    objectiveTitle: 'Recover the drainage tablet from the whispering stacks',
    visualTheme: { primaryColor: '#7baed0', ambientLight: 'rgba(92,160,200,0.3)', particles: 'dust' },
    narrationLines: [
      'Thousands of stone tablets rise into the dark, each one a sentence the temple refused to forget.',
      'Cold blue light drifts down through the fracture. Dust hangs in it, unmoving, as if listening back.',
      'The whispers are not one voice. Some of them are lying.',
    ],
    baseActions: [],
    initialItems: ['bronze_fish'],
    objective: {
      id: 'obj_library',
      title: 'Recover the drainage tablet from the whispering stacks',
      tasks: [
        { id: 'lib_t1', text: 'Survey the tablet stacks', completed: false },
        { id: 'lib_t2', text: 'Read the drainage scroll', completed: false },
        { id: 'lib_t3', text: 'Take the Drainage Tablet', completed: false },
      ],
    },
    entryJournalText: 'Entered the Library of Whispers. The clay tablets whisper; the slate ones are silent.',
  },

  flooded: {
    id: 'flooded',
    chapter: 'CHAPTER VI',
    title: 'FLOODED CORRIDOR',
    objectiveTitle: 'Open the third sluice and drain the corridor',
    visualTheme: { primaryColor: '#5a9aa8', ambientLight: 'rgba(50,130,150,0.35)', particles: 'water' },
    narrationLines: [
      "Black water swallows the carved pillars. Roots hang from the ceiling like severed cable.",
      "Your torch doubles itself on the surface — two flames, one of them slower.",
      "Ahead, the bridge has given up. Beneath it, the temple's old drainage throats gape in a row.",
    ],
    baseActions: [],
    initialItems: [],
    objective: {
      id: 'obj_flooded',
      title: 'Open the third sluice and drain the corridor',
      tasks: [
        { id: 'flo_t1', text: 'Probe the flooded floor', completed: false },
        { id: 'flo_t2', text: 'Read the valve markings', completed: false },
        { id: 'flo_t3', text: 'Engage the third sluice valve', completed: false },
      ],
    },
    entryJournalText: 'Entered the Flooded Corridor. Knee-deep water conceals the floor. Three sluice valves on the far wall.',
  },

  elements: {
    id: 'elements',
    chapter: 'CHAPTER VII',
    title: 'CHAMBER OF ELEMENTS',
    objectiveTitle: 'Kindle the four shrines in the true order',
    visualTheme: { primaryColor: '#df924b', ambientLight: 'rgba(223,146,75,0.35)', particles: 'embers' },
    narrationLines: [
      'Four shrines face a ritual platform ringed in gold inlay: fire, water, earth, air.',
      'Each breathes its own weather — embers, mist, dust, a slow cold draft that has nowhere to come from.',
      'The inlay is a single unbroken line. Break the order and it will close on you instead.',
    ],
    baseActions: [],
    initialItems: [],
    objective: {
      id: 'obj_elements',
      title: 'Kindle the four shrines in the true order',
      tasks: [
        { id: 'ele_t1', text: 'Inspect each elemental shrine', completed: false },
        { id: 'ele_t2', text: 'Read the ritual sequence inscription', completed: false },
        { id: 'ele_t3', text: 'Kindle shrines: Earth → Water → Fire → Air', completed: false },
      ],
    },
    entryJournalText: 'Entered the Chamber of Elements. Four elemental shrines surround a gold-inlay floor circuit.',
  },

  sanctum: {
    id: 'sanctum',
    chapter: 'CHAPTER VIII',
    title: 'SANCTUM OF RUDRA',
    objectiveTitle: 'Make the offering Rudra will accept',
    visualTheme: { primaryColor: '#e07a38', ambientLight: 'rgba(224,122,56,0.4)', particles: 'embers' },
    narrationLines: [
      'The hall opens into something that should not fit inside a mountain.',
      'Rudra sits in stone, many-armed, crowned in flame, eyes lowered at the ring of gold beneath your feet.',
      'Embers drift upward instead of down. The temple is holding its breath with you.',
    ],
    baseActions: [],
    initialItems: [],
    objective: {
      id: 'obj_sanctum',
      title: 'Make the offering Rudra will accept',
      tasks: [
        { id: 'san_t1', text: 'Approach the divine statue', completed: false },
        { id: 'san_t2', text: 'Read the pedestal inscription', completed: false },
        { id: 'san_t3', text: 'Present the gathered relics', completed: false },
      ],
    },
    entryJournalText: 'Entered the Sanctum of Rudra. The divine statue is twenty feet of solid obsidian. Embers rise instead of falling.',
  },

  final: {
    id: 'final',
    chapter: 'CHAPTER IX',
    title: 'FINAL CHAMBER',
    objectiveTitle: 'Face the Eye of Rudra and choose',
    visualTheme: { primaryColor: '#b27edb', ambientLight: 'rgba(178,126,219,0.45)', particles: 'sparks' },
    narrationLines: [
      'The core hangs above a cracked altar: a sphere of violet light bound in carved bronze.',
      'Pillars fail one by one. Slabs lift instead of falling, caught in whatever the relic is doing to gravity.',
      'The whispers resolve into a single voice, and it is using your own cadence.',
    ],
    baseActions: [],
    initialItems: [],
    objective: {
      id: 'obj_final',
      title: 'Face the Eye of Rudra and choose',
      tasks: [
        { id: 'fin_t1', text: 'Reach the temple core', completed: false },
        { id: 'fin_t2', text: 'Inspect the Eye of Rudra', completed: false },
        { id: 'fin_t3', text: 'Claim or refuse the relic', completed: false },
      ],
    },
    entryJournalText: 'Entered the Final Chamber. The Eye of Rudra hangs above the altar in a sphere of violet light.',
  },
};

// Keep legacy export name working for any imports that still use INITIAL_ROOM_DATA
export const INITIAL_ROOM_DATA = ROOM_DATA;

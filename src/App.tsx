import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { CinematicViewport } from './components/CinematicViewport';
import { ActionButtonBar } from './components/ActionButtonBar';
import { CommandBar } from './components/CommandBar';
import { RightSidebar } from './components/RightSidebar';
import { OpeningCinematicModal } from './components/OpeningCinematicModal';
import { EndingSequenceModal } from './components/EndingSequenceModal';
import { MoreActionsModal } from './components/MoreActionsModal';

import { INITIAL_ROOM_DATA, INITIAL_WORLD_MODEL } from './data/templeData';
import { RoomId, RoomData, WorldModel, InventoryItem } from './types';
import { audioEngine } from './audio/audioEngine';

export default function App() {
  const [showIntroModal, setShowIntroModal] = useState<boolean>(true);
  const [showMoreModal, setShowMoreModal] = useState<boolean>(false);
  const [showEndingModal, setShowEndingModal] = useState<boolean>(false);

  // Persistent World State
  const [worldModel, setWorldModel] = useState<WorldModel>(() => {
    const saved = localStorage.getItem('TEMPLE_OF_RUDRA_STATE');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load saved state:', e);
      }
    }
    return INITIAL_WORLD_MODEL;
  });

  // Active Room Data (used for room-specific static data: actions, images, etc.)
  const [rooms] = useState<Record<RoomId, RoomData>>(INITIAL_ROOM_DATA);

  // Dedicated narration state — decoupled from room data to avoid stale renders
  const [currentNarration, setCurrentNarration] = useState<string>(
    INITIAL_ROOM_DATA.entrance.narrationLines.join('\n\n')
  );
  const [narrationKey, setNarrationKey] = useState<number>(0);

  // Ref to always have latest worldModel inside handleCommand without stale closure
  const worldModelRef = useRef<WorldModel>(worldModel);
  useEffect(() => {
    worldModelRef.current = worldModel;
  }, [worldModel]);

  // Auto-save state on change
  useEffect(() => {
    localStorage.setItem('TEMPLE_OF_RUDRA_STATE', JSON.stringify(worldModel));
  }, [worldModel]);

  const currentRoom = rooms[worldModel.currentRoomId] || rooms.entrance;

  // Helper to push new narration and increment the key so CinematicViewport resets typewriter
  const pushNarration = useCallback((text: string) => {
    setCurrentNarration(text);
    setNarrationKey((k) => k + 1);
  }, []);

  // Handle Command Submissions & Actions
  const handleCommand = useCallback(async (commandStr: string, actionId?: string) => {
    const cmd = commandStr.toLowerCase().trim();

    // Always read from ref so we never close over stale state
    const worldSnapshot: WorldModel = JSON.parse(JSON.stringify(worldModelRef.current));
    const roomId = worldSnapshot.currentRoomId;

    // Play click / ambient audio
    audioEngine.playClick();

    let updatedWorld: WorldModel = worldSnapshot;
    updatedWorld.turns += 1;

    let customNarration: string | null = null;

    // Helper to add item to inventory safely
    const addItem = (item: InventoryItem) => {
      if (!updatedWorld.inventory.some((i) => i.id === item.id)) {
        updatedWorld.inventory.push(item);
      }
    };

    // Helper to add journal entry safely
    const addJournal = (text: string, category: 'lore' | 'observation' | 'teaching' = 'observation') => {
      if (!updatedWorld.journal.some((j) => j.text === text)) {
        updatedWorld.journal.push({
          id: `j_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          text,
          category,
        });
      }
    };

    // Helper to complete task
    const completeTask = (rId: RoomId, taskIndex: number) => {
      if (updatedWorld.objectives[rId]?.tasks[taskIndex]) {
        updatedWorld.objectives[rId].tasks[taskIndex].completed = true;
      }
    };

    // Movement command handling
    const roomSequence: RoomId[] = [
      'entrance',
      'guardians',
      'echoes',
      'puzzle',
      'library',
      'flooded',
      'elements',
      'sanctum',
      'final',
    ];

    const currentIdx = roomSequence.indexOf(roomId);
    const nextRoomId = currentIdx < roomSequence.length - 1 ? roomSequence[currentIdx + 1] : null;

    const isMovement =
      cmd.includes('move') ||
      cmd.includes('wade') ||
      cmd.includes('pass') ||
      cmd.includes('go ') ||
      cmd.includes('forward') ||
      cmd.includes('north') ||
      cmd.includes('east') ||
      cmd.includes('down') ||
      cmd.includes('inward') ||
      cmd.includes('deeper');

    if (isMovement && nextRoomId && updatedWorld.unlockedRooms[nextRoomId]) {
      audioEngine.playStoneMovement();
      updatedWorld.currentRoomId = nextRoomId;
      setWorldModel(updatedWorld);
      // Show the new room's default narration
      pushNarration(INITIAL_ROOM_DATA[nextRoomId].narrationLines.join('\n\n'));
      return;
    }

    // Contextual actions per room
    if (cmd === 'inventory' || cmd === 'items' || cmd === 'bag') {
      customNarration = `Carrying (${updatedWorld.inventory.length} items):\n` +
        updatedWorld.inventory.map((item) => `• ${item.name}${item.condition ? ` [${item.condition}]` : ''} - ${item.description}`).join('\n');
    } else if (cmd.startsWith('examine ') || cmd.startsWith('inspect ')) {
      const targetName = cmd.replace(/^(examine|inspect)\s+/, '').trim();
      const matchedItem = updatedWorld.inventory.find((i) => i.name.toLowerCase().includes(targetName) || i.id.toLowerCase().includes(targetName));
      if (matchedItem) {
        customNarration = `[Item Analysis] ${matchedItem.name}: ${matchedItem.description} ${matchedItem.condition ? `(Condition: ${matchedItem.condition})` : ''}`;
      } else {
        customNarration = `You carefully examine the surroundings for '${targetName}'. Ancient dust and carved stonework reflect your gaze.`;
      }
    } else if (cmd.startsWith('use ')) {
      const itemToUse = cmd.replace(/^use\s+/, '').trim();
      if (itemToUse.includes('torch')) {
        customNarration = `You hold the Oil Torch high. Golden flame illuminates hidden wall channels and dispels shadows. (Torch Level: ${updatedWorld.evaluation.torch}%)`;
      } else if (itemToUse.includes('compass')) {
        customNarration = 'The Brass Compass needle spins erratically before pointing toward the subterranean core of the temple.';
      } else if (itemToUse.includes('journal')) {
        customNarration = 'Field Journal Records:\n' + updatedWorld.journal.map((j) => `• ${j.text}`).join('\n');
      } else {
        customNarration = `You attempt to use ${itemToUse}. The ancient temple stones respond with quiet silence.`;
      }
    } else if (cmd === 'help' || cmd === 'commands') {
      customNarration = `Available Actions in ${rooms[roomId].title}:\n` +
        rooms[roomId].contextualActions.map((a) => `[${a.label}]`).join('  ') +
        `\nOr type commands like 'examine <item>', 'inventory', 'journal', 'look around', or 'use torch'.`;
    } else if (roomId === 'entrance') {
      if (cmd.includes('read inscription') || cmd.includes('read') || cmd.includes('inscription') || cmd.includes('lintel')) {
        completeTask('entrance', 0);
        addJournal('“The threshold inscription reacts to light — Rudra demands enlightenment before passage.”', 'lore');
        customNarration = 'You decipher the lintel script: “Bring warmth to the cold stone; only light may unbolt the eternal threshold.” The text flares faint gold!';
        updatedWorld.evaluation.observationScore = Math.min(100, updatedWorld.evaluation.observationScore + 5);
      } else if (cmd.includes('light brazier') || cmd.includes('light') || cmd.includes('brazier') || cmd.includes('fire') || cmd.includes('torch')) {
        updatedWorld.unlockedRooms.guardians = true;
        updatedWorld.puzzleStates.entrance.solved = true;
        completeTask('entrance', 0);
        completeTask('entrance', 1);
        completeTask('entrance', 2);
        addJournal('“Lit the threshold brazier. Heavy counterweights disengaged the gate seal.”', 'observation');
        customNarration = 'Golden fire leaps across the iron brazier bracket! Heavy stone counterweights rumble inside the walls as the lion doors swing wide into the Hall of Guardians!';
        audioEngine.playStoneMovement();
      } else if (cmd.includes('inspect doors') || cmd.includes('inspect door') || cmd.includes('inspect')) {
        completeTask('entrance', 0);
        customNarration = 'You examine the ancient basalt threshold. Deep counterweight grooves lead into the masonry above the lintel, held fast by an ancient thermal lock.';
        updatedWorld.evaluation.observationScore = Math.min(100, updatedWorld.evaluation.observationScore + 5);
      } else if (cmd.includes('look around') || cmd.includes('look') || cmd.includes('search')) {
        customNarration = 'Cold rain glimmers on the twin stone lion sentinels. Moss-draped Sanskrit verses line the entrance archway.';
        updatedWorld.evaluation.curiosityScore = Math.min(100, updatedWorld.evaluation.curiosityScore + 5);
      } else if (cmd.includes('ask explorer guide') || cmd.includes('guide')) {
        customNarration = "Guide's Advice: 'The inscription mentions bringing warmth. Light the torch bracket or brazier beside the doorway to trigger the door counterweights!'";
      } else if (cmd.includes('ask temple')) {
        customNarration = "Temple Guardian Echo: 'Only those who bear light into the dark shall pass through Rudra's gate.'";
      }
    } else if (roomId === 'guardians') {
      if (cmd.includes('rotate statue') || cmd.includes('rotate') || cmd.includes('align') || cmd.includes('turn')) {
        updatedWorld.unlockedRooms.echoes = true;
        updatedWorld.puzzleStates.guardians.solved = true;
        completeTask('guardians', 0);
        completeTask('guardians', 1);
        completeTask('guardians', 2);
        addItem({ id: 'rubbing', name: 'Threshold Rubbing', description: 'Charcoal transfer of sentinel pedestal runes.', category: 'collectible' });
        addJournal('“Rotated the four sentinels inward toward the altar. Disengaged the floor grilles.”', 'observation');
        customNarration = 'You rotate the heavy obsidian sentinels inward toward the central altar! Counterweight pins click underneath, unsealing the northern archway!';
        audioEngine.playStoneMovement();
      } else if (cmd.includes('inspect statues') || cmd.includes('inspect statue') || cmd.includes('inspect')) {
        completeTask('guardians', 0);
        customNarration = 'Four stoic sentinels carved from a single volcanic vein. Their cut quartz crystal eyes reflect torchlight along cardinal celestial coordinates.';
        updatedWorld.evaluation.observationScore = Math.min(100, updatedWorld.evaluation.observationScore + 5);
      } else if (cmd.includes('read carvings') || cmd.includes('read')) {
        completeTask('guardians', 1);
        addJournal('“Pedestal carvings read: When the four sentinels turn inward to the altar, safe passage opens.”', 'lore');
        customNarration = 'The pedestal carvings read: “When the four sentinels turn their gaze inward to the central altar, the path shall open without sound.”';
      } else if (cmd.includes('look around') || cmd.includes('look')) {
        customNarration = 'Pale cobalt rays stream from a ceiling fissure, casting dramatic shadows across copper-inlaid floor channels.';
        updatedWorld.evaluation.curiosityScore = Math.min(100, updatedWorld.evaluation.curiosityScore + 5);
      } else if (cmd.includes('ask temple')) {
        customNarration = "Temple Guardian Echo: 'The sentinels watch those who rush in haste. Turn their gaze inward to earn safe passage.'";
      } else if (cmd.includes('ask explorer guide') || cmd.includes('guide')) {
        customNarration = "Guide's Advice: 'Read the pedestal carvings at the base—rotate the four sentinel statues so they all face inward toward the central altar.'";
      }
    } else if (roomId === 'echoes') {
      if (cmd.includes('touch orb') || cmd.includes('attune') || cmd.includes('touch') || cmd.includes('orb')) {
        updatedWorld.unlockedRooms.puzzle = true;
        updatedWorld.puzzleStates.echoes.solved = true;
        completeTask('echoes', 0);
        completeTask('echoes', 1);
        completeTask('echoes', 2);
        addItem({ id: 'shard', name: 'Resonance Shard', description: 'Vibrates near ancient machinery.', category: 'relic' });
        addJournal('“Attuned the resonance wheel at 432Hz. Harmonic resonance unsealed the eastern doorway.”', 'teaching');
        customNarration = 'You touch the central resonance orb and match the 432Hz harmonic frequency! The orb hums in warm golden light as a resonant bell chime echoes and the eastern door opens!';
        audioEngine.playResonanceBell();
      } else if (cmd.includes('listen')) {
        completeTask('echoes', 1);
        addJournal('“Recorded the echo delay interval: 1.5 seconds at 432Hz.”', 'teaching');
        customNarration = 'You hold your breath. The chamber reverberates with a distinct 1.5-second harmonic echo delay matching the temple pulse!';
      } else if (cmd.includes('inspect mechanism') || cmd.includes('inspect')) {
        completeTask('echoes', 0);
        customNarration = 'An intricate bronze and slate acoustic wheel floats on a magnetic counter-spindle in the center of the hall.';
        updatedWorld.evaluation.observationScore = Math.min(100, updatedWorld.evaluation.observationScore + 5);
      } else if (cmd.includes('read niches') || cmd.includes('read')) {
        completeTask('echoes', 1);
        customNarration = 'Small carved alcoves house bronze wind deities, each tuned to a distinct acoustic frequency.';
      } else if (cmd.includes('look around') || cmd.includes('look')) {
        customNarration = 'Reflective damp stone mirrors your torchlight in twin reflections. Dust motes dance in the golden resonance glow.';
      } else if (cmd.includes('ask explorer guide') || cmd.includes('guide')) {
        customNarration = "Guide's Advice: 'Listen carefully to the echo delay, then touch the orb to attune it to the 432Hz pulse of the temple.'";
      } else if (cmd.includes('ask temple')) {
        customNarration = "Temple Guardian Echo: 'Harmony yields passage where physical force achieves nothing.'";
      }
    } else if (roomId === 'puzzle') {
      if (cmd.includes('rotate plate') || cmd.includes('rotate') || cmd.includes('align') || cmd.includes('symbols')) {
        updatedWorld.unlockedRooms.library = true;
        updatedWorld.puzzleStates.puzzle.solved = true;
        completeTask('puzzle', 0);
        completeTask('puzzle', 1);
        completeTask('puzzle', 2);
        addItem({ id: 'glyph_rubbing', name: 'Glyph Rubbing', description: 'Parchment rubbing of Sanskrit plates.', category: 'collectible' });
        addJournal('“Aligned glyph plates in cosmic order: Srishti (Creation) -> Sthiti (Preservation) -> Samhara (Dissolution).”', 'lore');
        customNarration = 'You rotate the glyph plates into sacred cosmic sequence: Creation, Preservation, Dissolution! Massive floor gears rumble overhead as the path down to the library unseals!';
        audioEngine.playStoneMovement();
      } else if (cmd.includes('inspect plates') || cmd.includes('inspect')) {
        completeTask('puzzle', 0);
        customNarration = 'Five heavy stone plates engraved with luminous bioluminescent Sanskrit characters.';
        updatedWorld.evaluation.observationScore = Math.min(100, updatedWorld.evaluation.observationScore + 5);
      } else if (cmd.includes('read symbols') || cmd.includes('read')) {
        completeTask('puzzle', 1);
        addJournal('“Sanskrit glyphs represent Creation, Preservation, and Dissolution.”', 'lore');
        customNarration = 'The glyphs spell out the sacred cosmic cycle: Creation (Srishti), Preservation (Sthiti), and Dissolution (Samhara).';
      } else if (cmd.includes('reset puzzle') || cmd.includes('reset')) {
        customNarration = 'You pull the counterweight reset lever. The floor plates slide back to their initial neutral positions with a heavy thud.';
        audioEngine.playStoneMovement();
      } else if (cmd.includes('look around') || cmd.includes('look')) {
        customNarration = 'Carved stone serpents coil around the perimeter walls, their quartz eyes glowing faintly in the dim ambient light.';
      } else if (cmd.includes('ask explorer guide') || cmd.includes('guide')) {
        customNarration = "Guide's Advice: 'Rotate the glyph plates to follow the cosmic cycle: Creation (Srishti) -> Preservation (Sthiti) -> Dissolution (Samhara).'";
      } else if (cmd.includes('ask temple')) {
        customNarration = "Temple Guardian Echo: 'The word of power requires Dissolution before Grace.'";
      }
    } else if (roomId === 'library') {
      if (cmd.includes('take tablet') || cmd.includes('take') || cmd.includes('grab') || cmd.includes('tablet')) {
        updatedWorld.unlockedRooms.flooded = true;
        updatedWorld.puzzleStates.library.solved = true;
        completeTask('library', 0);
        completeTask('library', 1);
        completeTask('library', 2);
        addItem({ id: 'drainage_tablet', name: 'Drainage Tablet', description: 'Heavy slate inscribed with hydraulic canal diagrams.', category: 'relic' });
        addJournal('“Retrieved the slate Drainage Tablet. Unsealed the stairs leading down to the flooded corridor.”', 'lore');
        customNarration = 'You carefully retrieve the slate Drainage Tablet from the third stack! A hidden stone staircase slides open behind the shelves, revealing the passage down to the flooded corridor!';
        audioEngine.playStoneMovement();
      } else if (cmd.includes('inspect tablets') || cmd.includes('inspect')) {
        completeTask('library', 0);
        customNarration = 'Thousands of baked slate tablets shelved in towering alcoves. Subtle air drafts make them whisper softly in the dark.';
        updatedWorld.evaluation.observationScore = Math.min(100, updatedWorld.evaluation.observationScore + 5);
      } else if (cmd.includes('read scroll') || cmd.includes('read tablet') || cmd.includes('read')) {
        completeTask('library', 1);
        addJournal('“The third sluice gate directs floodwaters into the subterranean aquifer.”', 'lore');
        customNarration = 'You read a slate tablet explaining the lower drainage system: “The third sluice gate directs the reservoir floodwaters into the deep aquifer.”';
      } else if (cmd.includes('look around') || cmd.includes('look')) {
        customNarration = 'Cold azure sunlight streams through high stone fractures, illuminating dust motes suspended in silence.';
      } else if (cmd.includes('ask explorer guide') || cmd.includes('guide')) {
        customNarration = "Guide's Advice: 'Search the third stack for the slate Drainage Tablet—taking it triggers the counterweight to open the stairs down!'";
      } else if (cmd.includes('ask temple')) {
        customNarration = "Temple Guardian Echo: 'Truth rests quietly amidst a thousand whispering falsehoods.'";
      }
    } else if (roomId === 'flooded') {
      if (cmd.includes('open sluice') || cmd.includes('drain') || cmd.includes('sluice') || cmd.includes('valve')) {
        updatedWorld.unlockedRooms.elements = true;
        updatedWorld.puzzleStates.flooded.solved = true;
        completeTask('flooded', 0);
        completeTask('flooded', 1);
        completeTask('flooded', 2);
        addItem({ id: 'bronze_fish', name: 'Bronze Fish', description: 'Weighted mechanical counterweight key used in sluice gates.', category: 'tool' });
        addJournal('“Turned the third sluice valve. The floodwaters drained into the aquifer in minutes.”', 'observation');
        customNarration = 'You engage the Bronze Fish key into the third sluice valve and turn it! Water cascades down the deep aquifer drain with a roar! The corridor clears, revealing the Chamber of Elements!';
        audioEngine.playStoneMovement();
      } else if (cmd.includes('inspect sluices') || cmd.includes('inspect')) {
        completeTask('flooded', 0);
        customNarration = 'Three bronze sluice valves coat the upper masonry wall above the knee-deep water. Markings warn: “Avoid the first valve.”';
        updatedWorld.evaluation.observationScore = Math.min(100, updatedWorld.evaluation.observationScore + 5);
      } else if (cmd.includes('probe water') || cmd.includes('probe')) {
        customNarration = 'You probe the dark water with your staff. Submerged stone steps lead safely toward the central valve controls.';
        updatedWorld.evaluation.patienceScore = Math.min(100, updatedWorld.evaluation.patienceScore + 5);
      } else if (cmd.includes('read markings') || cmd.includes('read')) {
        completeTask('flooded', 1);
        addJournal('“Sluice markings: The third valve redirects reservoir water into the subterranean aquifer.”', 'observation');
        customNarration = 'Bronze glyphs near the valves read: “The first valve floods the hall, the second locks the gate, the third drains the deep.”';
      } else if (cmd.includes('look around') || cmd.includes('look')) {
        customNarration = 'Bioluminescent moss on the ceiling casts a surreal cyan glow across the rippling water surface.';
      } else if (cmd.includes('ask explorer guide') || cmd.includes('guide')) {
        customNarration = "Guide's Advice: 'Use the Drainage Tablet diagram to turn the third sluice valve and drain the hall.'";
      } else if (cmd.includes('ask temple')) {
        customNarration = "Temple Guardian Echo: 'Water obeys the vessel that understands its channel.'";
      }
    } else if (roomId === 'elements') {
      if (cmd.includes('kindle shrine') || cmd.includes('kindle') || cmd.includes('shrine') || cmd.includes('rotate basin') || cmd.includes('order')) {
        updatedWorld.unlockedRooms.sanctum = true;
        updatedWorld.puzzleStates.elements.solved = true;
        completeTask('elements', 0);
        completeTask('elements', 1);
        completeTask('elements', 2);
        addItem({ id: 'ember_vessel', name: 'Ember Vessel', description: 'Sacred brass vessel carrying perpetual ritual ash.', category: 'relic' });
        addJournal('“Kindled the elemental shrines in order: Earth -> Water -> Fire -> Air. Unsealed the Sanctum gates.”', 'lore');
        customNarration = 'You kindle the elemental shrines in sacred order: Earth -> Water -> Fire -> Air! Mystical energy arcs across the floor inlay as the grand Sanctum gates swing wide!';
        audioEngine.playResonanceBell();
      } else if (cmd.includes('inspect shrines') || cmd.includes('inspect')) {
        completeTask('elements', 0);
        customNarration = 'Four ornate shrines carved from basalt, aquamarine, obsidian, and pumice surround a gold inlay floor circle.';
        updatedWorld.evaluation.observationScore = Math.min(100, updatedWorld.evaluation.observationScore + 5);
      } else if (cmd.includes('read ritual') || cmd.includes('read')) {
        completeTask('elements', 1);
        addJournal('“Elemental order: Earth holds, Water carries, Fire changes, Air remains.”', 'lore');
        customNarration = 'The floor seal inscription reads: “Earth holds, Water carries, Fire changes, Air remains. Kindle them in sequence.”';
      } else if (cmd.includes('look around') || cmd.includes('look')) {
        customNarration = 'Shifting elemental energies cast warm flickering shadows across the grand vaulted ceiling.';
      } else if (cmd.includes('ask explorer guide') || cmd.includes('guide')) {
        customNarration = "Guide's Advice: 'Kindle the four shrines in cosmic order: Earth, Water, Fire, then Air.'";
      } else if (cmd.includes('ask temple')) {
        customNarration = "Temple Guardian Echo: 'Master the four elements before stepping into the divine presence.'";
      }
    } else if (roomId === 'sanctum') {
      if (cmd.includes('make offering') || cmd.includes('offer') || cmd.includes('offering')) {
        updatedWorld.unlockedRooms.final = true;
        updatedWorld.puzzleStates.sanctum.solved = true;
        completeTask('sanctum', 0);
        completeTask('sanctum', 1);
        completeTask('sanctum', 2);
        addJournal('“Offered sacred relics at Rudra’s feet. The Guardian unsealed the inner core chamber.”', 'teaching');
        customNarration = 'You place your gathered sacred relics at Rudra’s feet! The statue’s obsidian eyes flash with golden divine illumination as the floor parts to reveal the Final Core Chamber!';
        audioEngine.playResonanceBell();
      } else if (cmd.includes('inspect statue') || cmd.includes('inspect')) {
        completeTask('sanctum', 0);
        customNarration = 'A monumental twenty-foot obsidian icon of Rudra, crowned in perpetually floating embers.';
        updatedWorld.evaluation.observationScore = Math.min(100, updatedWorld.evaluation.observationScore + 5);
      } else if (cmd.includes('read inscription') || cmd.includes('read')) {
        completeTask('sanctum', 1);
        addJournal('“Pedestal inscription: Present sacred relics to prove purity of intention.”', 'teaching');
        customNarration = 'The pedestal reads: “Offer that which you have gathered in humility, and receive eternal vision.”';
      } else if (cmd.includes('look around') || cmd.includes('look')) {
        customNarration = 'Golden embers drift slowly upward like floating stars toward the vaulted stone dome.';
      } else if (cmd.includes('ask explorer guide') || cmd.includes('guide')) {
        customNarration = "Guide's Advice: 'Place your gathered relics on the altar as an offering to Rudra to unseal the final core.'";
      } else if (cmd.includes('ask temple')) {
        customNarration = "Temple Guardian Echo: 'Humility and wisdom open the final portal where strength cannot.'";
      }
    } else if (roomId === 'final') {
      if (cmd.includes('take relic') || cmd.includes('claim') || cmd.includes('relic') || cmd.includes('take')) {
        completeTask('final', 0);
        completeTask('final', 1);
        completeTask('final', 2);
        updatedWorld.puzzleStates.final.solved = true;
        addItem({ id: 'fragment', name: 'Temple Core Fragment', description: 'Pulsing crystal containing living memory of Rudra.', category: 'relic' });
        addJournal('“Embraced the Eye of Rudra. The ancient temple cycle is complete.”', 'teaching');
        customNarration = 'You step forward into the violet illumination and embrace the Eye of Rudra! Cosmic harmony saturates your mind with living memory! Your expedition achieves eternal glory!';
        updatedWorld.gameCompleted = true;
        setShowEndingModal(true);
        audioEngine.playResonanceBell();
      } else if (cmd.includes('refuse relic') || cmd.includes('refuse')) {
        completeTask('final', 0);
        completeTask('final', 1);
        completeTask('final', 2);
        updatedWorld.puzzleStates.final.solved = true;
        addJournal('“Refused the relic in humility. Granted safe passage back into the world as a sage.”', 'teaching');
        customNarration = 'You bow deeply before the Eye of Rudra and step back in humility. The relic stabilizes, granting you peaceful passage back into the world as an enlightened sage.';
        updatedWorld.gameCompleted = true;
        setShowEndingModal(true);
        audioEngine.playResonanceBell();
      } else if (cmd.includes('inspect relic') || cmd.includes('inspect')) {
        completeTask('final', 0);
        customNarration = 'The Eye of Rudra hangs suspended in violet plasma, distorting gravity and time around the central altar.';
        updatedWorld.evaluation.observationScore = Math.min(100, updatedWorld.evaluation.observationScore + 5);
      } else if (cmd.includes('read core') || cmd.includes('read')) {
        completeTask('final', 1);
        customNarration = 'The core speaks directly into your mind: “Will you become the next Guardian of the sacred flame?”';
      } else if (cmd.includes('look around') || cmd.includes('look')) {
        customNarration = 'Pillars float weightlessly in cosmic violet space as gravitational forces warp around the central altar.';
      } else if (cmd.includes('ask explorer guide') || cmd.includes('guide')) {
        customNarration = "Guide's Advice: 'You stand before the Eye of Rudra! Touch the relic to complete your epic archaeological journey!'";
      } else if (cmd.includes('ask temple')) {
        customNarration = "Temple Guardian Echo: 'Thousands of years of waiting conclude with you. Claim or refuse the Eye.'";
      }
    }

    // Default narration fallback if custom action wasn't explicitly trapped above
    if (!customNarration) {
      customNarration = `You execute '${commandStr}' in the ${rooms[roomId].title}. The ancient stone walls reverberate with your presence.`;
    }

    // Push narration immediately — typewriter resets and starts
    pushNarration(customNarration);

    // Apply world model updates (objectives, inventory, journal, etc.)
    setWorldModel(updatedWorld);

    // Call Backend Express Gemini Route for dynamic AI narration enhancement (if API key configured)
    // We capture the current narrationKey so we only update if no newer action has fired
    const keyAtDispatch = narrationKey + 1;
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: commandStr,
          currentRoom: rooms[roomId],
          worldModel: updatedWorld,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Only replace narration if no newer action has fired since this request started
        if (data.narration && !data.fallback) {
          setNarrationKey((currentKey) => {
            if (currentKey === keyAtDispatch) {
              setCurrentNarration(data.narration);
            }
            return currentKey;
          });
        }
      }
    } catch (e) {
      console.warn('Backend server response fallback used', e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushNarration, rooms]);

  // Change room navigation
  const handleRoomSelect = (roomId: RoomId) => {
    if (worldModelRef.current.unlockedRooms[roomId]) {
      audioEngine.playStoneMovement();
      setWorldModel((prev) => ({
        ...prev,
        currentRoomId: roomId,
      }));
      pushNarration(INITIAL_ROOM_DATA[roomId].narrationLines.join('\n\n'));
    }
  };

  // Reset puzzle in current room
  const handleResetPuzzle = () => {
    audioEngine.playStoneMovement();
    const roomId = worldModelRef.current.currentRoomId;
    pushNarration(INITIAL_ROOM_DATA[roomId].narrationLines.join('\n\n'));
  };

  // Explicit Save game state
  const handleSaveGame = () => {
    localStorage.setItem('TEMPLE_OF_RUDRA_STATE', JSON.stringify(worldModel));
  };

  // Handle inventory item clicks
  const handleItemClick = (item: InventoryItem) => {
    audioEngine.playClick();
    handleCommand(`examine ${item.name}`);
  };

  return (
    <div className="w-full h-screen bg-[#0c0c08] text-[#e3d5ca] font-serif flex flex-col overflow-hidden select-none">
      {/* 1. Header Navigation Bar */}
      <Header onOpenJournalModal={() => setShowMoreModal(true)} />

      {/* 2. Main Game Screen Layout Container */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden p-3 sm:p-4 lg:p-6 gap-4">
        {/* Left Column: Viewport, Action Buttons & Command Line */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto custom-scrollbar">
          {/* Main Cinematic Viewport */}
          <CinematicViewport
            room={{
              ...currentRoom,
              objective: worldModel.objectives[currentRoom.id] || currentRoom.objective,
            }}
            narration={currentNarration}
            narrationKey={narrationKey}
            isCollapsing={worldModel.isCollapsing}
          />

          {/* Action Buttons */}
          <ActionButtonBar
            actions={currentRoom.contextualActions}
            onActionClick={(cmd, id) => handleCommand(cmd, id)}
            onOpenMoreModal={() => setShowMoreModal(true)}
          />

          {/* Command Input Bar */}
          <CommandBar
            currentRoomId={worldModel.currentRoomId}
            unlockedRooms={worldModel.unlockedRooms}
            onCommandSubmit={(cmd) => handleCommand(cmd)}
            onRoomSelect={handleRoomSelect}
          />
        </div>

        {/* Right Column: Mini Map, Objectives, Inventory, Explorer State */}
        <RightSidebar
          currentRoomId={worldModel.currentRoomId}
          inventory={worldModel.inventory}
          objective={worldModel.objectives[worldModel.currentRoomId] || currentRoom.objective}
          journal={worldModel.journal}
          evaluation={worldModel.evaluation}
          unlockedRooms={worldModel.unlockedRooms}
          onRoomSelect={handleRoomSelect}
          onItemClick={handleItemClick}
        />
      </main>

      {/* Modals */}
      {showIntroModal && (
        <OpeningCinematicModal
          onStartJourney={() => {
            setShowIntroModal(false);
          }}
        />
      )}

      {showMoreModal && (
        <MoreActionsModal
          room={currentRoom}
          worldModel={worldModel}
          onClose={() => setShowMoreModal(false)}
          onExecuteCommand={(cmd) => handleCommand(cmd)}
          onResetPuzzle={handleResetPuzzle}
          onSaveGame={handleSaveGame}
        />
      )}

      {showEndingModal && (
        <EndingSequenceModal
          evaluation={worldModel.evaluation}
          onRestartGame={() => {
            localStorage.removeItem('TEMPLE_OF_RUDRA_STATE');
            setWorldModel(INITIAL_WORLD_MODEL);
            pushNarration(INITIAL_ROOM_DATA.entrance.narrationLines.join('\n\n'));
            setShowEndingModal(false);
            setShowIntroModal(true);
          }}
        />
      )}
    </div>
  );
}

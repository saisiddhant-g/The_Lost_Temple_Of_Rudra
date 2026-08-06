import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RoomData, RoomId } from '../types';

import templeEntranceImg from '../assets/images/temple_entrance_1786053985416.jpg';
import hallGuardiansImg from '../assets/images/hall_guardians_1786053998017.jpg';
import hallEchoesImg from '../assets/images/hall_echoes_1786054013079.jpg';
import puzzleChamberImg from '../assets/images/puzzle_chamber_1786054023206.jpg';
import libraryWhispersImg from '../assets/images/library_whispers_1786054044512.jpg';
import floodedCorridorImg from '../assets/images/flooded_corridor_1786054059514.jpg';
import chamberElementsImg from '../assets/images/chamber_elements_1786054071674.jpg';
import sanctumRudraImg from '../assets/images/sanctum_rudra_1786054033085.jpg';
import finalChamberImg from '../assets/images/final_chamber_1786054083868.jpg';

const ROOM_BACKGROUND_IMAGES: Record<RoomId, string> = {
  entrance: templeEntranceImg,
  guardians: hallGuardiansImg,
  echoes: hallEchoesImg,
  puzzle: puzzleChamberImg,
  library: libraryWhispersImg,
  flooded: floodedCorridorImg,
  elements: chamberElementsImg,
  sanctum: sanctumRudraImg,
  final: finalChamberImg,
};

interface CinematicViewportProps {
  room: RoomData;
  narration: string;
  narrationKey: number;
  onNarrationComplete?: () => void;
  isCollapsing?: boolean;
}

export const CinematicViewport: React.FC<CinematicViewportProps> = ({
  room,
  narration,
  narrationKey,
  isCollapsing = false,
}) => {
  const [displayedText, setDisplayedText] = useState('');

  // Typewriter effect — restarts whenever narrationKey changes (every new action)
  useEffect(() => {
    setDisplayedText('');
    let index = 0;

    const interval = setInterval(() => {
      if (index < narration.length) {
        index += 1;
        setDisplayedText(narration.slice(0, index));
      } else {
        clearInterval(interval);
      }
    }, 14);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrationKey]);

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] md:h-[500px] lg:h-[520px] bg-[#050503] border border-[#2b2b24] rounded-none overflow-hidden select-none shadow-2xl flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Room Transition Container with Cinematic Fade & Zoom */}
      <AnimatePresence mode="wait">
        <motion.div
          key={room.id}
          initial={{ opacity: 0, scale: 1.08, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.96, filter: 'blur(4px)' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 pointer-events-none"
        >
          {/* Photorealistic Background Artwork with Camera Drift */}
          <div className={`w-full h-full overflow-hidden ${isCollapsing ? 'animate-bounce' : ''}`}>
            <div className="w-full h-full animate-camera-drift">
              <img
                src={ROOM_BACKGROUND_IMAGES[room.id]}
                alt={room.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Volumetric God Rays Layer */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden animate-god-ray">
        <div className="absolute -top-20 left-1/4 w-96 h-[600px] bg-gradient-to-b from-[#d4af37]/20 via-[#b8860b]/5 to-transparent transform -rotate-12 blur-xl" />
        <div className="absolute -top-20 left-2/3 w-80 h-[600px] bg-gradient-to-b from-[#81d4fa]/15 via-transparent to-transparent transform -rotate-6 blur-2xl" />
      </div>

      {/* Torch Light Ambient Glow Flicker */}
      <div className="absolute inset-0 pointer-events-none z-10 animate-torch-flicker">
        <div className="absolute top-1/3 left-10 w-64 h-64 bg-[radial-gradient(circle,rgba(229,169,60,0.18)_0%,transparent_70%)] blur-2xl" />
        <div className="absolute top-1/2 right-12 w-64 h-64 bg-[radial-gradient(circle,rgba(229,169,60,0.15)_0%,transparent_70%)] blur-2xl" />
      </div>

      {/* Animated Fog Layers */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-40 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(184,134,11,0.15)_0%,transparent_70%)] animate-fog-1" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(100,181,246,0.1)_0%,transparent_80%)] animate-fog-2" />
      </div>

      {/* Floating Dust Particles */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <div className="absolute top-3/4 left-1/6 w-1 h-1 bg-[#d4af37] rounded-full animate-particle-1" />
        <div className="absolute top-2/3 left-1/2 w-1.5 h-1.5 bg-[#e8a93c] rounded-full animate-particle-2" />
        <div className="absolute top-4/5 left-4/5 w-1 h-1 bg-[#ffffff] rounded-full opacity-60 animate-particle-3" />
      </div>

      {/* Ember Particles */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <div className="absolute bottom-10 left-1/4 w-1.5 h-1.5 bg-[#ff6f00] rounded-full blur-[0.5px] animate-ember-1" />
        <div className="absolute bottom-16 left-3/4 w-1 h-1 bg-[#ffab00] rounded-full blur-[0.5px] animate-ember-2" />
        <div className="absolute bottom-12 left-1/2 w-1 h-1 bg-[#d4af37] rounded-full blur-[0.5px] animate-ember-3" />
      </div>

      {/* Vignette & Atmospheric Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#0c0c08]/20 to-[#0c0c08] pointer-events-none z-15" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(12,12,8,0.85)_100%)] pointer-events-none z-15" />

      {/* TOP OVERLAYS */}
      <div className="relative z-20 flex items-start justify-between gap-4">
        {/* Left: Current Location Eyebrow, Chapter & Room Title */}
        <AnimatePresence mode="wait">
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-xl"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#b8860b] font-sans font-bold">
                CURRENT LOCATION
              </span>
              <div className="h-[1px] w-20 bg-gradient-to-r from-[#b8860b]/50 to-transparent" />
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif tracking-tight text-[#d4af37] font-light uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]">
              {room.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-[#a19286] uppercase font-sans tracking-wider">Temple</span>
              <span className="text-[10px] text-[#7a6a5d]">&bull;</span>
              <span className="text-[10px] text-[#a19286] uppercase font-sans tracking-wider">{room.chapter}</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Right: Objective Box */}
        <AnimatePresence mode="wait">
          <motion.div
            key={room.objectiveTitle}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-[#0c0c08]/90 backdrop-blur-md border border-[#b8860b]/40 p-3 sm:p-4 max-w-[220px] sm:max-w-[280px] rounded-none shadow-2xl"
          >
            <p className="text-[9px] sm:text-[10px] font-sans tracking-[0.2em] text-[#b8860b] font-bold uppercase mb-1">
              CURRENT OBJECTIVE
            </p>
            <p className="text-xs sm:text-sm font-serif text-[#e3d5ca] leading-snug">
              {room.objectiveTitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* BOTTOM OVERLAY: Narration text with Typewriter animation */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="relative z-20 mt-auto max-w-3xl bg-[#0c0c08]/85 border-t border-[#b8860b]/40 p-4 sm:p-6 shadow-2xl backdrop-blur-sm"
      >
        <div className="font-serif text-sm sm:text-base md:text-lg text-[#e3d5ca] font-light leading-relaxed tracking-wide whitespace-pre-line">
          {displayedText}
          <span className="inline-block w-2 h-4 sm:h-5 bg-[#b8860b] ml-1 animate-pulse align-middle" />
        </div>
      </motion.div>
    </div>
  );
};

import React, { useState } from 'react';
import { Flame, Volume2, VolumeX } from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';

interface HeaderProps {
  onOpenJournalModal?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const [ambienceOn, setAmbienceOn] = useState(false);

  const toggleAudio = () => {
    const newState = audioEngine.toggleAmbience();
    setAmbienceOn(newState);
  };

  return (
    <header className="h-14 bg-[#0c0c08] border-b border-[#3d2b1f] flex items-center justify-between px-4 sm:px-6 select-none z-20">
      {/* Brand Logo */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center text-[#d4af37]">
          <Flame className="w-5 h-5 text-[#d4af37] animate-pulse" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="font-serif text-lg font-light tracking-[0.2em] text-[#d4af37]">
            RUDRA
          </span>
          <span className="text-[10px] sm:text-xs font-sans tracking-[0.2em] text-[#7a6a5d] uppercase font-bold">
            THE LOST TEMPLE
          </span>
        </div>
      </div>

      {/* Right Action: Ambience Button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleAudio}
          className="flex items-center space-x-2 px-3 py-1.5 text-[11px] tracking-widest uppercase font-sans border border-[#b8860b] bg-[#1a1a14] hover:bg-[#b8860b] text-[#d4af37] hover:text-[#0c0c08] transition-colors duration-300 rounded-none cursor-pointer"
        >
          {ambienceOn ? (
            <>
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              <span>AMBIENCE ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-[#7a6a5d]" />
              <span>AMBIENCE OFF</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

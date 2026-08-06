import React, { useState, useEffect } from 'react';
import { Flame, Compass } from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';

interface OpeningCinematicModalProps {
  onStartJourney: () => void;
}

export const OpeningCinematicModal: React.FC<OpeningCinematicModalProps> = ({ onStartJourney }) => {
  const [stage, setStage] = useState<number>(0);

  useEffect(() => {
    // Stage 0: Black screen with dust & wind
    // Stage 1: Ancient inscription
    // Stage 2: Narrative text
    const t1 = setTimeout(() => setStage(1), 2500);
    const t2 = setTimeout(() => setStage(2), 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#0c0c08] text-[#e3d5ca] flex flex-col items-center justify-center p-6 select-none animate-fadeIn">
      {/* Background Dust & Fog Effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(184,134,11,0.2)_0%,transparent_70%)]" />

      {stage === 0 && (
        <div className="text-center space-y-4 animate-pulse">
          <Flame className="w-12 h-12 text-[#b8860b] mx-auto" />
          <p className="font-serif tracking-[0.3em] text-sm text-[#b8860b] uppercase">
            THE LOST TEMPLE OF RUDRA
          </p>
        </div>
      )}

      {stage === 1 && (
        <div className="max-w-2xl text-center space-y-6 animate-fadeIn">
          <p className="text-xs font-sans tracking-[0.3em] text-[#b8860b] uppercase font-bold">
            MASTER BLUEPRINT &bull; ANCIENT CHRONICLES
          </p>
          <blockquote className="text-xl sm:text-2xl font-serif italic text-[#d4af37] leading-relaxed drop-shadow-lg">
            “Civilizations rise... civilizations fall... but knowledge endures only if someone chooses to protect it.”
          </blockquote>
        </div>
      )}

      {stage === 2 && (
        <div className="max-w-2xl text-center space-y-8 animate-fadeIn">
          <div className="p-8 bg-[#080806] border border-[#b8860b]/40 rounded-none shadow-2xl space-y-5">
            <h2 className="text-2xl font-serif tracking-[0.2em] text-[#d4af37] font-light uppercase">
              THE ENTRYWAY INSCRIPTION
            </h2>
            <blockquote className="text-lg font-serif italic text-[#e3d5ca] leading-relaxed">
              “The temple does not remember your name. It remembers your choices.”
            </blockquote>
            <p className="text-xs font-sans text-[#7a6a5d] leading-normal pt-3 border-t border-[#1a1a14]">
              As you step across the ancient threshold, stone doors behind you slowly seal shut with a deep rumble echoing through the mountain.
            </p>
          </div>

          <button
            onClick={() => {
              audioEngine.playStoneMovement();
              onStartJourney();
            }}
            className="inline-flex items-center space-x-3 px-8 py-3.5 bg-[#1a1a14] hover:bg-[#b8860b] border border-[#b8860b] text-[#d4af37] hover:text-[#0c0c08] font-sans text-xs tracking-[0.25em] font-bold uppercase rounded-none transition-colors shadow-[0_0_15px_rgba(184,134,11,0.3)] cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>ENTER THE TEMPLE</span>
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Sparkles, ShieldCheck, RefreshCw } from 'lucide-react';
import { EvaluationMetrics } from '../types';
import { audioEngine } from '../audio/audioEngine';

interface EndingSequenceModalProps {
  evaluation: EvaluationMetrics;
  onRestartGame: () => void;
}

export const EndingSequenceModal: React.FC<EndingSequenceModalProps> = ({
  evaluation,
  onRestartGame,
}) => {
  const [step, setStep] = useState<'revelation' | 'judgment' | 'transformation' | 'credits'>('revelation');

  return (
    <div className="fixed inset-0 z-50 bg-[#0c0c08] text-[#e3d5ca] flex flex-col items-center justify-center p-6 select-none animate-fadeIn">
      {/* Radiant Glow Effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(184,134,11,0.25)_0%,transparent_70%)] animate-pulse" />

      {step === 'revelation' && (
        <div className="max-w-2xl text-center space-y-6 z-10 animate-fadeIn">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-[#b8860b] to-[#d4af37] p-0.5 shadow-[0_0_30px_rgba(184,134,11,0.5)] animate-spin duration-3000">
            <div className="w-full h-full bg-[#0c0c08] rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#d4af37]" />
            </div>
          </div>

          <h2 className="text-3xl font-serif tracking-[0.2em] text-[#d4af37] font-light uppercase">
            THE EYE SPEAKS
          </h2>

          <p className="text-xl font-serif italic text-[#e3d5ca] leading-relaxed">
            “Explorer... You searched for the Eye of Rudra. But the Eye has been searching for you.”
          </p>

          <p className="text-sm font-sans text-[#a19286] leading-relaxed max-w-lg mx-auto">
            The Eye of Rudra is not an object. It was never a treasure or ancient weapon. It is a Guardian Consciousness passed from one protector to the next across thousands of years.
          </p>

          <button
            onClick={() => {
              audioEngine.playResonanceBell();
              setStep('judgment');
            }}
            className="px-8 py-3 bg-[#1a1a14] hover:bg-[#b8860b] border border-[#b8860b] text-[#d4af37] hover:text-[#0c0c08] font-sans text-xs tracking-[0.2em] font-bold uppercase rounded-none transition-colors shadow-[0_0_15px_rgba(184,134,11,0.3)] cursor-pointer"
          >
            BEHOLD THE TEMPLE'S EVALUATION
          </button>
        </div>
      )}

      {step === 'judgment' && (
        <div className="max-w-3xl w-full bg-[#080806] border border-[#b8860b]/40 p-6 sm:p-8 rounded-none shadow-2xl z-10 space-y-6 animate-fadeIn">
          <div className="text-center space-y-2 border-b border-[#1a1a14] pb-4">
            <ShieldCheck className="w-8 h-8 text-[#b8860b] mx-auto" />
            <h2 className="text-2xl font-serif tracking-[0.2em] text-[#d4af37] font-light uppercase">
              GUARDIAN EVALUATION PROFILE
            </h2>
            <p className="text-xs font-serif italic text-[#a19286]">
              “The temple was never testing intelligence. It was observing character.”
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-sans">
            <div className="p-3 bg-[#1a1a14] border border-[#3d2b1f] rounded-none text-center">
              <p className="text-[#7a6a5d] uppercase font-bold text-[10px]">Observation</p>
              <p className="text-lg font-bold text-[#d4af37] mt-1">{evaluation.observationScore} / 100</p>
            </div>
            <div className="p-3 bg-[#1a1a14] border border-[#3d2b1f] rounded-none text-center">
              <p className="text-[#7a6a5d] uppercase font-bold text-[10px]">Curiosity</p>
              <p className="text-lg font-bold text-[#d4af37] mt-1">{evaluation.curiosityScore} / 100</p>
            </div>
            <div className="p-3 bg-[#1a1a14] border border-[#3d2b1f] rounded-none text-center">
              <p className="text-[#7a6a5d] uppercase font-bold text-[10px]">Patience</p>
              <p className="text-lg font-bold text-[#d4af37] mt-1">{evaluation.patienceScore} / 100</p>
            </div>
            <div className="p-3 bg-[#1a1a14] border border-[#3d2b1f] rounded-none text-center">
              <p className="text-[#7a6a5d] uppercase font-bold text-[10px]">Integrity</p>
              <p className="text-lg font-bold text-[#d4af37] mt-1">{evaluation.integrityScore} / 100</p>
            </div>
            <div className="p-3 bg-[#1a1a14] border border-[#3d2b1f] rounded-none text-center">
              <p className="text-[#7a6a5d] uppercase font-bold text-[10px]">Resolve</p>
              <p className="text-lg font-bold text-[#d4af37] mt-1">{evaluation.resolve}</p>
            </div>
            <div className="p-3 bg-[#1a1a14] border border-[#3d2b1f] rounded-none text-center">
              <p className="text-[#7a6a5d] uppercase font-bold text-[10px]">Temple Favor</p>
              <p className="text-lg font-bold text-[#d4af37] mt-1">{evaluation.templeFavor}</p>
            </div>
          </div>

          <div className="text-center pt-4">
            <button
              onClick={() => {
                audioEngine.playResonanceBell();
                setStep('transformation');
              }}
              className="px-8 py-3.5 bg-[#1a1a14] hover:bg-[#b8860b] border border-[#b8860b] text-[#d4af37] hover:text-[#0c0c08] font-sans text-xs tracking-[0.2em] font-bold uppercase rounded-none transition-colors shadow-[0_0_20px_rgba(184,134,11,0.4)] cursor-pointer"
            >
              ACCEPT GUARDIAN SUCCESSION
            </button>
          </div>
        </div>
      )}

      {step === 'transformation' && (
        <div className="max-w-2xl text-center space-y-6 z-10 animate-fadeIn">
          <p className="text-xs font-sans tracking-[0.3em] text-[#b8860b] font-bold uppercase">
            CHAPTER X &bull; TRANSFORMATION
          </p>
          <blockquote className="text-2xl sm:text-3xl font-serif italic text-[#d4af37] leading-relaxed">
            “Will you protect knowledge... even if no one remembers your name?”
          </blockquote>
          <p className="text-sm font-sans text-[#a19286] leading-relaxed">
            The radiant Eye slowly dissolves into light. Illumination fills the chamber. The Guardian Consciousness merges with your mind as you ascend the ancient stone throne.
          </p>
          <p className="text-xs font-serif text-[#d4af37] tracking-widest uppercase">
            YOU HAVE BECOME THE EYE OF RUDRA.
          </p>

          <button
            onClick={() => setStep('credits')}
            className="px-8 py-3 bg-[#1a1a14] hover:bg-[#b8860b] border border-[#b8860b] text-[#d4af37] hover:text-[#0c0c08] font-sans text-xs tracking-[0.2em] font-bold uppercase rounded-none transition-colors cursor-pointer"
          >
            VIEW CREDITS
          </button>
        </div>
      )}

      {step === 'credits' && (
        <div className="max-w-2xl text-center space-y-6 z-10 animate-fadeIn">
          <h2 className="text-3xl font-serif tracking-[0.25em] text-[#d4af37] font-light uppercase">
            THE LOST TEMPLE OF RUDRA
          </h2>
          <p className="text-xs font-sans tracking-[0.2em] text-[#7a6a5d] font-bold">
            CREATED & DESIGNED BY LEAD GAME ARCHITECTS
          </p>

          <div className="space-y-3 text-xs font-serif text-[#a19286] border-y border-[#1a1a14] py-6">
            <p><strong className="text-[#d4af37]">Game Design & World Model:</strong> Persistent Memory Architecture</p>
            <p><strong className="text-[#d4af37]">AI Reasoning Layer:</strong> Temple AI & Explorer AI</p>
            <p><strong className="text-[#d4af37]">Visual Identity & Graphics:</strong> AAA Cinematic Presentation</p>
            <p><strong className="text-[#d4af37]">Audio & Atmosphere:</strong> Web Audio Synthesizer Engine</p>
          </div>

          <p className="text-xs font-serif italic text-[#d4af37]">
            “Years later... another explorer discovers the forgotten entrance hidden beneath the jungle. The cycle continues.”
          </p>

          <button
            onClick={onRestartGame}
            className="inline-flex items-center space-x-2 px-8 py-3.5 bg-[#1a1a14] hover:bg-[#b8860b] border border-[#b8860b] text-[#d4af37] hover:text-[#0c0c08] font-sans text-xs tracking-[0.2em] font-bold uppercase rounded-none transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>BEGIN NEW JOURNEY</span>
          </button>
        </div>
      )}
    </div>
  );
};

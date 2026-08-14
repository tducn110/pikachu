import React from "react";
import { Play, RotateCcw, Volume2, VolumeX, Music } from "lucide-react";
import { playSfx } from "../../utils/audio";
import { HyperIcon } from "./hyperUi";
import { HyperModal } from "./overlays/HyperModal";
import { HyperModalButton } from "./ui/HyperModalButton";

export function PauseOverlay({
  onClose,
  onRestart,
  sfxEnabled,
  musicEnabled,
  setSfxEnabled,
  setMusicEnabled,
}: {
  onClose: () => void;
  onRestart: () => void;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  setSfxEnabled: (v: boolean) => void;
  setMusicEnabled: (v: boolean) => void;
}) {
  return (
    <HyperModal offsetTop>
      <h2 className="text-3xl font-black text-[var(--hyper-purple-ink)] uppercase mb-6 mt-2 shadow-text">
        TẠM DỪNG
      </h2>

      <div className="w-full mb-4">
        <HyperModalButton 
          onClick={() => { playSfx("click"); onClose(); }} 
          variant="primary"
          className="py-4"
        >
          <div className="flex items-center gap-2">
            <Play size={24} strokeWidth={3} />
            <span className="text-xl">TIẾP TỤC</span>
          </div>
        </HyperModalButton>
      </div>

      <div className="flex w-full justify-center sm:justify-between gap-3 sm:gap-4 mt-2 px-0 sm:px-2">
        <button 
          className="flex flex-col items-center gap-1 opacity-90 hover:opacity-100 transition-transform active:scale-95"
          onClick={() => { playSfx("click"); onRestart(); onClose(); }}
        >
          <div className="w-14 h-14 rounded-full bg-[var(--hyper-gold)] flex items-center justify-center shadow-lg border-2 border-[var(--hyper-brown)]">
            <RotateCcw size={26} strokeWidth={3} className="text-[var(--hyper-brown)]" />
          </div>
          <span className="text-[var(--hyper-purple-ink)] font-bold text-sm">Chơi lại</span>
        </button>

        <button 
          className={`flex flex-col items-center gap-1 transition-transform active:scale-95 ${!sfxEnabled ? 'opacity-50 grayscale' : 'opacity-90 hover:opacity-100'}`}
          onClick={() => { playSfx("toggle"); setSfxEnabled(!sfxEnabled); }}
        >
          <div className="w-14 h-14 rounded-full bg-[var(--hyper-gold)] flex items-center justify-center shadow-lg border-2 border-[var(--hyper-brown)]">
            {sfxEnabled ? (
              <Volume2 size={26} strokeWidth={3} className="text-[var(--hyper-brown)]" />
            ) : (
              <VolumeX size={26} strokeWidth={3} className="text-[var(--hyper-brown)]" />
            )}
          </div>
          <span className="text-[var(--hyper-purple-ink)] font-bold text-sm">Âm thanh</span>
        </button>

        <button 
          className={`flex flex-col items-center gap-1 transition-transform active:scale-95 ${!musicEnabled ? 'opacity-50 grayscale' : 'opacity-90 hover:opacity-100'}`}
          onClick={() => { playSfx("toggle"); setMusicEnabled(!musicEnabled); }}
        >
          <div className="w-14 h-14 rounded-full bg-[var(--hyper-gold)] flex items-center justify-center shadow-lg border-2 border-[var(--hyper-brown)]">
            <Music size={26} strokeWidth={3} className="text-[var(--hyper-brown)]" />
          </div>
          <span className="text-[var(--hyper-purple-ink)] font-bold text-sm">Nhạc</span>
        </button>
      </div>
    </HyperModal>
  );
}

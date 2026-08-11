import React from "react";
import { Play, RotateCcw } from "lucide-react";
import { playSfx } from "../../utils/audio";
import { HyperIcon } from "./hyperUi";

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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tạm dừng"
      className="hyper-modal-backdrop hyper-modal-backdrop--pause"
      onClick={onClose}
    >
      <div
        className="hyper-modal hyper-modal--pause"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hyper-modal-inner hyper-modal-inner--pause flex flex-col items-center">
          <h2 className="hyper-pause-title">TẠM DỪNG</h2>
          
          <button 
            className="hyper-pause-continue" 
            onClick={() => { playSfx("click"); onClose(); }}
          >
            <Play className="hyper-pause-continue-icon" fill="currentColor" size={28} />
            <span>Tiếp tục</span>
          </button>

          <div className="hyper-pause-actions">
            <button 
              className="hyper-pause-action-btn" 
              onClick={() => { playSfx("click"); onRestart(); onClose(); }}
              aria-label="Chơi lại"
            >
              <div className="hyper-pause-action-icon-wrap">
                <RotateCcw size={28} strokeWidth={2.5} />
              </div>
              <span>Chơi lại</span>
            </button>

            <button 
              className={`hyper-pause-action-btn ${!sfxEnabled ? 'off' : ''}`}
              onClick={() => { playSfx("toggle"); setSfxEnabled(!sfxEnabled); }}
              aria-label="Âm thanh"
            >
              <div className="hyper-pause-action-icon-wrap">
                <HyperIcon name="sound" className="h-4/5 w-4/5 object-contain" />
              </div>
              <span>Âm thanh</span>
            </button>

            <button 
              className={`hyper-pause-action-btn ${!musicEnabled ? 'off' : ''}`}
              onClick={() => { playSfx("toggle"); setMusicEnabled(!musicEnabled); }}
              aria-label="Nhạc"
            >
              <div className="hyper-pause-action-icon-wrap">
                <HyperIcon name="music" className="h-4/5 w-4/5 object-contain" />
              </div>
              <span>Nhạc</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

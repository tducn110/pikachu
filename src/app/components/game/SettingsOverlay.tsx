import React from "react";
import { Volume2, VolumeX, Music } from "lucide-react";
import { Overlay } from "./Overlay";
import { palette as c } from "./gameThemes";

function ToggleRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center justify-between rounded-2xl px-4 py-3 bg-white/70 border-[1.5px] border-[#8a7d65]/30 transition-colors active:bg-white/90"
    >
      <span className="flex items-center gap-2 font-semibold text-[#2a2418] text-sm md:text-base">
        {value ? icon : <VolumeX size={18} className="text-[#8a7d65]" />}
        {label}
      </span>
      <span
        className={`flex h-6 w-11 items-center rounded-full px-0.5 transition-colors ${value ? 'bg-[#e87432]' : 'bg-[#8a7d65]'}`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white transition-transform ${value ? 'translate-x-[20px]' : 'translate-x-0'}`}
        />
      </span>
    </button>
  );
}

export function SettingsOverlay({
  onClose,
  sfxEnabled,
  musicEnabled,
  setSfxEnabled,
  setMusicEnabled,
}: {
  onClose: () => void;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  setSfxEnabled: (v: boolean) => void;
  setMusicEnabled: (v: boolean) => void;
}) {
  return (
    <Overlay onClose={onClose} title="Cài đặt">
      <ToggleRow
        icon={<Volume2 size={18} />}
        label="Âm thanh hiệu ứng"
        value={sfxEnabled}
        onChange={setSfxEnabled}
      />
      <ToggleRow
        icon={<Music size={18} />}
        label="Nhạc nền"
        value={musicEnabled}
        onChange={setMusicEnabled}
      />
    </Overlay>
  );
}

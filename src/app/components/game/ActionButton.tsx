import React from "react";
import { palette as c } from "./gameThemes";

export function ActionButton({
  onClick,
  icon,
  label,
  primary,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`
        flex items-center justify-center gap-1.5 rounded-full px-4 py-2 transition-all active:scale-95
        text-[13px] md:text-sm
        ${primary 
          ? "bg-gradient-to-b from-[#f08a48] to-[#e87432] border-2 border-[#d95a1a] text-white font-extrabold shadow-[0_8px_18px_rgba(232,116,50,0.4)]" 
          : "bg-white/85 border-2 border-[#8a7d65] text-[#2a2418] font-bold"}
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

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
        flex items-center justify-center gap-1.5 rounded-full px-3 py-2 transition-all active:scale-95
        text-[12px] font-bold md:px-4 md:text-sm
        ${primary 
          ? "border-2 border-[#e56d12] bg-gradient-to-b from-[#ffad42] to-[#ff8128] text-white font-extrabold shadow-[0_7px_16px_rgba(255,140,47,0.32)]"
          : "border border-[#b9ddfa] bg-[#f7fbff] text-[#23618e]"}
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

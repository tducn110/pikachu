import React from "react";
import { X } from "lucide-react";
import { palette as c } from "./gameThemes";

export function Overlay({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#18324f]/35 p-4 backdrop-blur-[12px] animate-[bolac-fade_0.2s]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl border-2 border-[#b9ddfa] bg-white p-6 shadow-[0_18px_50px_rgba(51,104,145,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-[#18324f] md:text-2xl">{title}</h2>
          <button type="button" aria-label="Đóng" onClick={onClose} className="text-[#8a7d65] hover:text-[#2a2418] transition-colors">
            <X size={20} color={c.pencilGray} />
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-3">{children}</div>
      </div>
    </div>
  );
}

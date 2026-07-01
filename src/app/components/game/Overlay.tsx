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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2a2418]/55 backdrop-blur-[12px] animate-[bolac-fade_0.2s]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 bg-[#fdf6ea] border-2 border-[#f7b731]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-extrabold text-[#2a2418]">{title}</h2>
          <button type="button" aria-label="Đóng" onClick={onClose} className="text-[#8a7d65] hover:text-[#2a2418] transition-colors">
            <X size={20} color={c.pencilGray} />
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-3">{children}</div>
      </div>
    </div>
  );
}

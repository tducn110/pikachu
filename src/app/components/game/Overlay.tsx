import React from "react";
import { X } from "lucide-react";
import { playSfx } from "../../utils/audio";

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
      className="hyper-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="hyper-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hyper-modal-inner">
          <div className="hyper-modal-heading">
            <h2>{title}</h2>
            <button type="button" aria-label="Đóng" onClick={() => { playSfx("close"); onClose(); }} className="hyper-close-button">
              <X size={16} />
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

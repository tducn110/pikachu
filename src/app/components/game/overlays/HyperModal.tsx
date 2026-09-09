import React, { ReactNode } from "react";
import { createPortal } from "react-dom";

export function HyperModal({
  children,
  className = "",
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  const modalContent = (
    <div
      className="hyper-modal-backdrop hyper-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div className={`hyper-modal-v2 hyper-scale-up ${className}`}>
        {children}
      </div>
    </div>
  );

  if (typeof document !== "undefined" && document.body) {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}

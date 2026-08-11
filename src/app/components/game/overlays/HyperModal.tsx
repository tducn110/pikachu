import React, { ReactNode } from "react";

export function HyperModal({ children, offsetTop = false }: { children: ReactNode, offsetTop?: boolean }) {
  return (
    <div className="hyper-modal-backdrop hyper-fade-in absolute inset-0 z-50 flex items-center justify-center p-4">
      <div className={`hyper-modal-v2 hyper-scale-up ${offsetTop ? '-translate-y-8 md:-translate-y-12' : ''}`}>
        {children}
      </div>
    </div>
  );
}

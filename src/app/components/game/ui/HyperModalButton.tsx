import React, { ReactNode } from "react";

interface HyperModalButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  className?: string;
  disabled?: boolean;
}

export function HyperModalButton({ children, onClick, variant = "primary", className = "", disabled = false }: HyperModalButtonProps) {
  const baseClass = "hyper-modal-btn";
  const variantClass = variant === "primary" ? "hyper-modal-btn-primary" : "hyper-modal-btn-secondary";
  
  return (
    <button 
      className={`${baseClass} ${variantClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

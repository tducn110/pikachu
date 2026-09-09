import React, { ReactNode } from "react";
import { playSfx } from "../../../utils/audio";

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
  
  const handleClick = () => {
    // ponytail: central click sfx for all modal buttons
    playSfx("click");
    onClick?.();
  };

  return (
    <button 
      className={`${baseClass} ${variantClass} ${className}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

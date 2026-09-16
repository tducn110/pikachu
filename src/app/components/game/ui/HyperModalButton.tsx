import React, { ReactNode } from "react";
import { playSfx } from "../../../utils/audio";

interface HyperModalButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  className?: string;
  disabled?: boolean;
  sound?: boolean;
  ariaLabel?: string;
}

export function HyperModalButton({ children, onClick, variant = "primary", className = "", disabled = false, sound = true, ariaLabel }: HyperModalButtonProps) {
  const baseClass = "hyper-modal-btn";
  const variantClass = variant === "primary" ? "hyper-modal-btn-primary" : "hyper-modal-btn-secondary";
  
  const handleClick = () => {
    if (sound) playSfx("click");
    onClick?.();
  };

  return (
    <button
      type="button"
      className={`${baseClass} ${variantClass} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

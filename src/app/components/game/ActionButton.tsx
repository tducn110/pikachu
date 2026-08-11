import React from "react";
import { playSfx } from "../../utils/audio";

export function ActionButton({
  onClick,
    icon,
    label,
    primary,
    sound = true,
  }: {
  onClick: () => void;
  icon: React.ReactNode;
    label: string;
    primary?: boolean;
    sound?: boolean;
  }) {
  const handleClick = () => {
    if (sound) playSfx("click");
    onClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={`hyper-action-button ${primary ? "" : "hyper-action-button--secondary"}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

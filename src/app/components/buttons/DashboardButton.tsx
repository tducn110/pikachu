import type { ButtonHTMLAttributes, ReactNode } from "react";

type DashboardButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export function DashboardButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: DashboardButtonProps) {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      className={`dashboard-button dashboard-button--${variant} ${className}`.trim()}
    >
      {children}
    </button>
  );
}

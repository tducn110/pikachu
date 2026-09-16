import React, { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function HyperModal({
  children,
  className = "",
  labelledBy,
  onRequestClose,
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  onRequestClose?: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusFirst = () => {
      const first = dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (first ?? dialog).focus();
    };
    const frame = window.requestAnimationFrame(focusFirst);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onRequestClose) {
        event.preventDefault();
        onRequestClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [onRequestClose]);

  const modalContent = (
    <div
      className="hyper-modal-backdrop hyper-fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onRequestClose?.();
      }}
    >
      <div
        ref={dialogRef}
        className={`hyper-modal-v2 hyper-scale-up ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );

  if (typeof document !== "undefined" && document.body) {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}

import React from "react";
import { HyperIcon } from "./hyperUi";

export function WrongToast({ reason }: { reason: "different-kind" | "blocked-path" }) {
  const message = reason === "different-kind"
    ? "Hai hình không giống nhau!"
    : "Không thể nối trong 2 góc!";

  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="hyper-toast">
        <HyperIcon name="bomb" />
        <div className="hyper-toast-title text-[#c83b4d]">
        {message}
        </div>
      </div>
    </div>
  );
}

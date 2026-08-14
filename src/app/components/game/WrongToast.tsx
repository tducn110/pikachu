import React from "react";
import { X } from "lucide-react";

export function WrongToast({ reason }: { reason: "different-kind" | "blocked-path" }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="hyper-scale-up flex items-center justify-center">
        <X 
          size={160} 
          strokeWidth={4} 
          className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.9)]" 
        />
      </div>
    </div>
  );
}

import React from "react";
import { Shuffle } from "lucide-react";

export function ShuffleToast() {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="hyper-scale-up flex items-center justify-center">
        <Shuffle 
          size={160} 
          strokeWidth={4} 
          className="text-[#ffbd19] drop-shadow-[0_0_20px_rgba(255,189,25,0.9)]" 
        />
      </div>
    </div>
  );
}

import React from "react";

export function WrongToast({ reason }: { reason: "different-kind" | "blocked-path" }) {
  const message = reason === "different-kind"
    ? "Hai hình không giống nhau!"
    : "Không thể nối trong 2 góc!";

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50 animate-in fade-in zoom-in duration-200">
      <div className="bg-red-500 text-white font-extrabold text-xl px-6 py-3 rounded-full shadow-lg border-2 border-red-700">
        {message}
      </div>
    </div>
  );
}

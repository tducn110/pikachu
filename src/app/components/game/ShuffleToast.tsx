import { palette as c } from "./gameThemes";

export function ShuffleToast() {
  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl px-6 py-4 text-center z-50 bg-[#fdf6ea]/95 border-2 border-[#e87432] shadow-[0_10px_30px_rgba(0,0,0,0.15)] backdrop-blur-sm animate-[bolac-fade_0.2s_ease-out_forwards]"
    >
      <div className="text-lg md:text-xl font-extrabold text-[#2a2418] mb-1">
        Hết đường đi!
      </div>
      <div className="text-sm md:text-base text-[#8a7d65]">
        Đang trộn lại bảng...
      </div>
    </div>
  );
}

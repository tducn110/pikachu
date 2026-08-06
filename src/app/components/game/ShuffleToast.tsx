import { palette as c } from "./gameThemes";

export function ShuffleToast() {
  return (
    <div
      className="absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-[#ffb13b] bg-white/95 px-6 py-4 text-center shadow-[0_10px_30px_rgba(51,104,145,0.18)] backdrop-blur-sm animate-[bolac-fade_0.2s_ease-out_forwards]"
    >
      <div className="mb-1 text-lg font-black text-[#18324f] md:text-xl">
        Hết đường đi!
      </div>
      <div className="text-sm text-[#69819b] md:text-base">
        Đang trộn lại bảng...
      </div>
    </div>
  );
}

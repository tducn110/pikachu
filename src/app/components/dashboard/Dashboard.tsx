import React, { useState, useEffect } from "react";
import { Trophy, Clock, Target, Medal, Award } from "lucide-react";
import { palette as c } from "../game/gameThemes";
import { loadStats } from "../../utils/stats";

export function Dashboard() {
  const [stats, setStats] = useState(loadStats());

  useEffect(() => {
    const handleUpdate = () => setStats(loadStats());
    window.addEventListener("stats-updated", handleUpdate);
    return () => window.removeEventListener("stats-updated", handleUpdate);
  }, []);

  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 z-10 relative">
      <h2 className="text-3xl md:text-4xl font-extrabold text-[#2a2418] text-center mb-10">
        Bảng Điểm Cá Nhân
      </h2>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard icon={<Trophy color={c.mascotYellow} />} label="ĐIỂM CAO NHẤT" value={stats.best} />
        <StatCard icon={<Target color={c.orangeCta} />} label="ĐIỂM VỪA RỒI" value={stats.last} />
        <StatCard icon={<Clock color={c.bambooGreen} />} label="SỐ VÁN ĐÃ CHƠI" value={stats.totalGames} />
        <StatCard icon={<Medal color={c.alertRed} />} label="HẠNG CỦA BẠN" value={"---"} />
      </div>

      {/* Grid dưới: Lịch sử cá nhân */}
      <div className="max-w-2xl mx-auto w-full">
        <PersonalHistory />
      </div>
    </section>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-3xl p-4 md:p-5 flex flex-col items-center justify-center gap-2 bg-white/85 border-[1.5px] border-[#8a7d65]/30 shadow-[0_8px_24px_rgba(42,36,24,0.06)]">
      <div className="p-3 rounded-full bg-[#fdf6ea]">
        {icon}
      </div>
      <div className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-[#8a7d65]">
        {label}
      </div>
      <div className="text-2xl md:text-3xl font-extrabold text-[#2a2418]">
        {value}
      </div>
    </div>
  );
}


function PersonalHistory() {
  return (
    <div className="rounded-3xl p-5 md:p-8 flex flex-col bg-white/85 border-[1.5px] border-dashed border-[#8a7d65]/40 shadow-[0_8px_24px_rgba(42,36,24,0.06)]">
      <div className="flex items-center gap-3 mb-6">
        <Clock size={28} className="text-[#8a7d65]" />
        <h3 className="text-xl md:text-2xl font-extrabold text-[#2a2418]">Lịch Sử Cá Nhân</h3>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center py-10">
        <p className="italic text-[#8a7d65] text-center">
          Bạn chưa chơi ván nào gần đây.<br/>Hãy chơi thử một ván nhé!
        </p>
      </div>
    </div>
  );
}

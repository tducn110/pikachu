import React, { useState } from "react";
import { Volume2, VolumeX, User, X } from "lucide-react";
import { palette as c } from "../game/gameThemes";

export function TopNav({ onLoginClick }: { onLoginClick: () => void }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 lg:px-8 h-16 bg-[#f5ecd7]/85 backdrop-blur-[10px] border-b border-[#8a7d65]/18 font-sans">
      {/* Trái: logo bubble + tên brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full text-white font-extrabold text-xl bg-[radial-gradient(circle,#f8c860_0%,#d99820_100%)] border-2 border-[#2a2418]">
          L
        </div>
        <span className="text-[#2a2418] font-extrabold text-lg hidden sm:block">
          Bộ Lạc Đậu Phộng
        </span>
      </div>

      {/* Giữa: dotted-progress nav */}
      <div className="hidden md:flex items-center gap-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-[#e87432] opacity-100' : 'bg-[#8a7d65] opacity-40'}`}
          />
        ))}
      </div>

      {/* Phải: nút mute, pill VIE, CTA */}
      <div className="flex items-center gap-2 md:gap-3">
        <button
          className="p-2 rounded-full border-2 border-[#8a7d65] text-[#2a2418] transition-colors hover:bg-black/5"
          aria-label="Mute"
        >
          <Volume2 size={18} />
        </button>
        <div className="hidden sm:flex items-center px-3 py-1 rounded-full text-sm font-bold border-2 border-[#8a7d65] text-[#2a2418]">
          VIE
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="py-10 md:py-12 px-6 lg:px-8 z-10 relative bg-gradient-to-b from-[#efe3c4] to-[#e6d8b2] border-t border-dashed border-[#8a7d65]/30 font-sans">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full text-white font-extrabold text-lg bg-[radial-gradient(circle,#f8c860_0%,#d99820_100%)] border-2 border-[#2a2418]">
              L
            </div>
            <span className="text-[#2a2418] font-extrabold text-base">
              Bộ Lạc Đậu Phộng
            </span>
          </div>
          <div className="inline-block px-4 py-2 rounded-full text-sm font-bold border-[1.5px] border-dashed border-[#e87432] text-[#e87432] bg-[#e87432]/5">
            hello@bolacdauphong.vn
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-2">
          <h4 className="text-[#2a2418] font-extrabold mb-2">
            Điều hướng
          </h4>
          {["Về chúng tôi", "Nhân vật", "Luật chơi", "Liên hệ"].map((link) => (
            <a
              key={link}
              href="#"
              className="text-[#8a7d65] font-semibold text-sm hover:text-[#e87432] transition-colors"
            >
              {link}
            </a>
          ))}
        </div>

        {/* Apps */}
        <div>
          <h4 className="text-[#2a2418] font-extrabold mb-2">
            Tải ứng dụng
          </h4>
          <div className="flex flex-col gap-3 items-start">
            <button className="px-4 py-2 bg-black text-white rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors">
              App Store
            </button>
            <button className="px-4 py-2 bg-black text-white rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors">
              Google Play
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto mt-10 md:mt-12 pt-6 text-center text-xs border-t border-[#8a7d65]/20 text-[#8a7d65]">
        © 2026 Bộ Lạc Đậu Phộng. All rights reserved.
      </div>
    </footer>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5ecd7]">
      <TopNav onLoginClick={() => {}} />
      <main className="flex-1 relative flex flex-col">{children}</main>
      <Footer />
    </div>
  );
}

import React from "react";
import { BotAnimation } from "@/components/bot-animation";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 md:p-10 relative overflow-hidden font-sans">
      <BotAnimation />
      
        <div className="relative z-10 w-full max-w-sm animate-blur-fade">
          <Link href="/" className="flex flex-col items-center gap-4 mb-12 group transition-all duration-500 hover:scale-[1.02]">
            <div className="w-12 h-12 rounded-none bg-blue-500 flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <span className="text-black font-black text-xl italic tracking-tighter">TV</span>
            </div>
            <span className="font-black tracking-[0.3em] text-sm uppercase italic">
              Telo<span className="text-blue-500">Vendo</span>
            </span>
          </Link>
          {children}
        </div>

      <div className="absolute bottom-10 text-[10px] uppercase font-black tracking-[0.4em] text-neutral-800 opacity-50 z-0 select-none">
        Portal Automatizado / Restricted Access
      </div>
    </div>
  );
}

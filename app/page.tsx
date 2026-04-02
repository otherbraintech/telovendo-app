import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, ShoppingCart, ArrowRight, LogIn, Bot, Zap, Activity, ShieldCheck, Globe, Command, ListFilter, Users } from "lucide-react";
import { cookies } from "next/headers";
import { BotAnimation } from "@/components/bot-animation";
import { ModeToggle } from "@/components/mode-toggle";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token");
  const isAuthenticated = !!sessionToken;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-blue-500/30 font-sans transition-colors duration-500">
      <BotAnimation />
      
      {/* Mini Navbar */}
      <nav className="fixed top-0 w-full z-50 p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/iconTeloVendo.svg" alt="TeloVendo Logo" className="w-6 h-6 animate-pulse dark:invert" />
          <span className="font-bold tracking-[0.2em] text-xs uppercase text-foreground">Telo<span className="opacity-50">Vendo</span></span>
        </div>
        <ModeToggle />
      </nav>

      <main className="relative flex flex-col items-center max-w-5xl mx-auto px-6">
        {/* Full-screen Hero Section */}
        <section className="flex flex-col items-center justify-center min-h-[100svh] w-full py-20 text-center relative overflow-hidden">
          {/* Logo Watermark Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none z-0">
             <img src="/iconTeloVendo.svg" alt="" className="w-[500px] h-[500px] animate-pulse dark:invert" />
          </div>

          <div className="space-y-4 mb-12 relative z-10">
            <div className="space-y-3">
              <div className="flex justify-center mb-6 animate-blur-fade">
                <img src="/iconTeloVendo.svg" alt="TeloVendo Icon" className="w-16 h-16 md:w-24 md:h-24 dark:invert" />
              </div>
              <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase italic leading-none animate-title-reveal">
                TeloVendo
              </h1>
              <div className="w-full max-w-full px-4 mx-auto">
                <p className="text-[9px] md:text-xs text-neutral-500 font-mono tracking-widest md:tracking-[0.4em] uppercase animate-typing-tech break-words">
                  Red de Automatización / Marketplace / V1.0
                </p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-lg mx-auto animate-blur-fade [animation-delay:0.4s] opacity-0" style={{ animationFillMode: "forwards" }}>
            {isAuthenticated ? (
               <div className="w-full bg-card border border-border p-6 backdrop-blur-md space-y-6 shadow-xl">
                 <div className="text-left space-y-4">
                   <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-blue-500">Publicación Rápida</h2>
                   <div className="space-y-4">
                     <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">URL del Producto (Facebook)</label>
                       <input 
                         type="text" 
                         placeholder="https://facebook.com/marketplace/item/..." 
                         className="w-full bg-black border border-white/10 p-4 text-sm focus:border-blue-500 outline-none transition-colors font-mono"
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Cantidad Bots</label>
                         <input 
                           type="number" 
                           defaultValue={50} 
                           className="w-full bg-black border border-white/10 p-4 text-sm focus:border-blue-500 outline-none transition-colors font-mono"
                         />
                       </div>
                      <button className="h-full rounded-none border border-blue-500/50 bg-transparent text-blue-500 hover:bg-blue-500 hover:text-black font-black text-xs uppercase tracking-widest self-end transition-all duration-150 px-6 cursor-pointer">
                        PUBLICAR AHORA
                      </button>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <Link href="/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-blue-500 transition-colors">Ver Dashboard Completo →</Link>
                </div>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="h-16 px-10 rounded-none border border-blue-500/50 bg-transparent text-blue-500 hover:bg-blue-500 hover:text-black font-black text-sm uppercase tracking-[0.2em] transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_50px_rgba(59,130,246,0.4)] flex items-center justify-center gap-4 group cursor-pointer"
              >
                Acceder al sistema
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-20 [animation-delay:1s]">
            <div className="w-px h-12 bg-gradient-to-b from-blue-500 to-transparent" />
          </div>
        </section>

        {/* System Cards (Below the fold) */}
        <section className="w-full pb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl animate-blur-fade [animation-delay:0.7s] opacity-0" style={{ animationFillMode: "forwards" }}>
            <div className="group bg-card border border-border p-6 hover:border-blue-500/30 transition-all duration-500 shadow-sm">
               <Activity className="w-4 h-4 text-blue-500 mb-4" />
               <div className="space-y-1">
                  <div className="text-2xl font-black italic tracking-tighter">99.8%</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Uptime</div>
               </div>
            </div>

            <div className="group bg-card border border-border p-6 hover:border-blue-500/30 transition-all duration-500 shadow-sm">
               <Bot className="w-4 h-4 text-blue-500 mb-4" />
               <div className="space-y-1">
                  <div className="text-2xl font-black italic tracking-tighter">20</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Bots Activos</div>
               </div>
            </div>

            <div className="group bg-card border border-border p-6 hover:border-blue-500/30 transition-all duration-500 shadow-sm">
               <ShieldCheck className="w-4 h-4 text-blue-500 mb-4" />
               <div className="space-y-1">
                  <div className="text-2xl font-black italic tracking-tighter">SECURED</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Protección</div>
               </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full flex flex-col md:flex-row justify-between items-center px-12 py-12 border-t border-border text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground gap-6">
        <div>TeloVendo &copy; {new Date().getFullYear()} / Acceso Restringido</div>
        <div className="flex gap-12">
           <a href="#" className="hover:text-blue-500 transition-colors">Documentation</a>
           <a href="#" className="hover:text-blue-500 transition-colors">System Status</a>
        </div>
      </footer>
    </div>
  );
}

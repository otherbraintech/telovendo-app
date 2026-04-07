import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { ArrowRight, ShoppingCart, Globe, Command } from "lucide-react";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth-utils";
import { PublicUserMenu } from "@/components/public-user-menu";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const isAuthenticated = !!session;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 flex flex-col">
      {/* NAVBAR */}
      <nav className="sticky top-0 w-full z-50 px-6 py-4 backdrop-blur-xl border-b border-white/5 bg-background/50 flex justify-between items-center">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-4 group">
            <img src="/iconTeloVendo.svg" alt="Logo" className="w-8 h-8 animate-pulse dark:invert transition-transform group-hover:scale-110" />
            <span className="font-black tracking-[0.2em] text-lg uppercase italic">Telo<span className="text-blue-600 dark:text-blue-500">Vendo</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 transition-colors">
            <Link href="/" className="hover:text-blue-500 transition-colors">Inicio</Link>
            <Link href="/marketplace" className="hover:text-blue-500 transition-colors flex items-center gap-2">
              <ShoppingCart className="size-3" />
              Marketplace
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <ModeToggle />
          {isAuthenticated ? (
            <PublicUserMenu user={session.user} />
          ) : (
            <Link 
              href="/login" 
              className="px-5 py-2 border border-foreground/20 hover:bg-foreground hover:text-background font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer"
            >
              Ingresar
            </Link>
          )}
        </div>
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="w-full px-12 py-16 border-t border-border/40 text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground bg-neutral-50/50 dark:bg-black/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src="/iconTeloVendo.svg" alt="Logo" className="w-5 h-5 dark:invert opacity-50" />
                <span className="font-black italic">TeloVendo <span className="opacity-30">Marketplace</span></span>
              </div>
              <p className="max-w-xs leading-relaxed text-muted-foreground/40 normal-case tracking-normal font-medium">
                Encuentra lo que buscas con la mejor plataforma de marketplace local.
              </p>
           </div>
           
           <div className="flex flex-col md:flex-row gap-12 md:gap-24">
              <div className="space-y-4">
                 <h4 className="text-foreground/80">Navegación</h4>
                 <div className="flex flex-col gap-2 opacity-50">
                    <Link href="/" className="hover:text-blue-500 transition-colors">Inicio</Link>
                    <Link href="/marketplace" className="hover:text-blue-500 transition-colors">Marketplace</Link>
                    <Link href={isAuthenticated ? "/dashboard" : "/login"} className="hover:text-blue-500 transition-colors">
                      {isAuthenticated ? "Panel de Control" : "Iniciar Sesión"}
                    </Link>
                 </div>
              </div>
           </div>
        </div>
        <div className="mt-16 pt-8 border-t border-border/20 text-center opacity-30">
           TeloVendo &copy; {new Date().getFullYear()} / Desarrollado por OB-LABS
        </div>
      </footer>
    </div>
  );
}

import { Metadata } from "next";
import Link from "next/link";
import { 
  ShoppingBag, 
  ArrowRight, 
  Car, 
  Home, 
  Smartphone, 
  Tag, 
  Package, 
  LayoutDashboard, 
  ShoppingCart, 
  Laptop, 
  Tv, 
  Bike, 
  Shirt, 
  Bed, 
  Sofa, 
  Watch, 
  Headphones, 
  Zap, 
  Hammer, 
  Camera,
  Wand2,
  Cpu,
  Globe,
  Rocket
} from "lucide-react";
import { getPublicPublications } from "@/lib/actions/public";
import { getSession } from "@/lib/auth-utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export const metadata: Metadata = {
  title: "TeloVendo | Marketplace Global & Gestión de Bots",
  description: "La plataforma definitiva para comprar y vender vehículos, inmuebles y tecnología con orquestación inteligente de bots. Encuentra las mejores ofertas hoy.",
  keywords: ["marketplace", "bolivia", "comprar", "vender", "vehículos", "inmuebles", "tecnología", "bots"],
};

const formatPrice = (price: any) => {
  const num = Number(price?.$numberDecimal || price) || 0;
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

export default async function LandingPage() {
  const session = await getSession();
  const isAuthenticated = !!session;
  
  const recentItems = await getPublicPublications();
  const displayItems = recentItems.slice(0, 3);
  
  return (
    <div className="relative w-full overflow-hidden flex flex-col items-center">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
        .marquee-container:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}} />
      {/* GLOBAL TECH BACKGROUND SYSTEM (Spans entire page) */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
         {/* Modern Dotted Grid */}
         <div className="fixed inset-0 opacity-[0.05] dark:opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 0.5px, transparent 0)', backgroundSize: '32px 32px' }} />
         
         {/* High-Impact Peripheral Glows (Strategically placed to NOT be cut) */}
         <div className="absolute top-[-5%] left-[-10%] w-[60%] lg:w-[40%] h-[40%] bg-blue-500/5 blur-[130px] rounded-full animate-pulse" />
         <div className="absolute top-[20%] right-[-10%] w-[50%] lg:w-[35%] h-[35%] bg-blue-600/3 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '12s' }} />
         <div className="absolute top-[60%] left-[-15%] w-[50%] lg:w-[45%] h-[40%] bg-emerald-500/3 blur-[140px] rounded-full animate-pulse" style={{ animationDuration: '15s' }} />
         <div className="absolute bottom-[5%] right-[-10%] w-[60%] lg:w-[40%] h-[45%] bg-blue-500/5 blur-[150px] rounded-full animate-pulse" style={{ animationDuration: '9s' }} />
         
         {/* Economy Galaxy Background - Denser, balanced icons & soft motion */}
         {[
            { I: Car, t: '3%', l: '8%', s: 'size-12', d: '25s', a: 'animate-bounce' },
            { I: Home, t: '8%', r: '12%', s: 'size-16', d: '18s', a: 'animate-pulse' },
            { I: Smartphone, t: '12%', l: '20%', s: 'size-10', d: '22s', a: 'animate-bounce' },
            { I: Laptop, t: '16%', r: '32%', s: 'size-14', d: '20s', a: 'animate-pulse' },
            { I: Tv, t: '20%', r: '10%', s: 'size-16', d: '16s', a: 'animate-bounce' },
            { I: ShoppingCart, t: '25%', l: '35%', s: 'size-12', d: '30s', a: 'animate-pulse' },
            { I: Tag, t: '30%', r: '22%', s: 'size-10', d: '15s', a: 'animate-pulse' },
            { I: Package, t: '35%', l: '10%', s: 'size-14', d: '19s', a: 'animate-pulse' },
            { I: Bike, t: '40%', r: '28%', s: 'size-12', d: '28s', a: 'animate-bounce' },
            { I: Shirt, t: '45%', l: '30%', s: 'size-10', d: '24s', a: 'animate-pulse' },
            { I: Bed, t: '50%', r: '8%', s: 'size-16', d: '17s', a: 'animate-bounce' },
            { I: Sofa, t: '55%', l: '15%', s: 'size-14', d: '23s', a: 'animate-pulse' },
            { I: Watch, t: '60%', r: '35%', s: 'size-10', d: '16s', a: 'animate-bounce' },
            { I: Headphones, t: '65%', l: '22%', s: 'size-12', d: '21s', a: 'animate-pulse' },
            { I: Zap, t: '70%', r: '15%', s: 'size-10', d: '11s', a: 'animate-bounce' },
            { I: Hammer, t: '75%', l: '32%', s: 'size-14', d: '29s', a: 'animate-pulse' },
            { I: Camera, t: '80%', r: '12%', s: 'size-12', d: '13s', a: 'animate-bounce' },
            { I: Car, t: '85%', l: '12%', s: 'size-14', d: '22s', a: 'animate-pulse' },
            { I: Home, t: '90%', r: '28%', s: 'size-12', d: '19s', a: 'animate-bounce' },
            { I: Package, t: '95%', l: '25%', s: 'size-14', d: '25s', a: 'animate-pulse' },
            { I: ShoppingCart, t: '15%', r: '50%', s: 'size-10', d: '35s', a: 'animate-pulse' },
            { I: Laptop, t: '45%', r: '5%', s: 'size-12', d: '22s', a: 'animate-bounce' },
            { I: Smartphone, t: '75%', r: '40%', s: 'size-10', d: '18s', a: 'animate-pulse' },
         ].map((item, i) => (
            <div 
              key={i} 
              className={`absolute opacity-[0.04] dark:opacity-[0.06]`}
              style={{ 
                top: item.t, 
                ...(item.l ? { left: item.l } : { right: item.r }),
                transform: `rotate(${i * 15}deg)`
              }}
            >
               <item.I className={item.s} />
            </div>
         ))}
         
         {/* Central Branding Ghost Mark (Fixed in Hero area) */}
         <div className="absolute top-0 left-0 w-full h-[85svh] flex items-center justify-center opacity-[0.01] dark:opacity-[0.015]">
            <img src="/iconTeloVendo.svg" alt="" className="w-[800px] h-[800px] animate-pulse dark:invert" />
         </div>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-7xl mx-auto px-6 w-full">
      {/* Full-screen Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-[75svh] w-full py-12 text-center relative overflow-visible">
        <div className="space-y-4 mb-12 relative z-10 transition-all duration-700">
          <div className="space-y-4">
            <div className="flex justify-center mb-4 animate-blur-fade">
              <img src="/iconTeloVendo.svg" alt="TeloVendo Icon" className="w-40 h-40 md:w-48 md:h-48 dark:invert" />
            </div>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-none animate-title-reveal text-foreground">
              TeloVendo
            </h1>
            <div className="w-full max-w-full px-4 mx-auto">
              <p className="text-xs md:text-sm text-neutral-500 font-bold tracking-[0.2em] uppercase animate-blur-fade [animation-delay:0.3s] opacity-0 break-words max-w-2xl mx-auto" style={{ animationFillMode: "forwards" }}>
                Tu próximo destino de compras. Encuentra articulos, vehiculos e inmuebles.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-5 w-full max-w-xl mx-auto animate-blur-fade [animation-delay:0.5s] opacity-0 relative z-20" style={{ animationFillMode: "forwards" }}>
          <Link 
            href="/marketplace" 
            className="flex-1 py-4 font-black tracking-tighter uppercase italic leading-none px-6 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold text-base uppercase tracking-wide transition-all active:scale-[0.98] shadow-lg hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center justify-center gap-3 group"
          >
            <ShoppingBag className="size-5 transition-transform group-hover:-rotate-12 group-hover:scale-110" />
            <span>Explorar</span>
          </Link>

          {isAuthenticated ? (
            <Link 
              href="/dashboard" 
              className="flex-1 py-4 px-6 font-black tracking-tighter uppercase italic leading-none rounded-lg bg-neutral-100 dark:bg-black/40 backdrop-blur-md border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white/90 hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-black hover:border-black dark:hover:border-white font-bold text-base uppercase tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-3 group shadow-lg"
            >
              <LayoutDashboard className="size-5 text-blue-600 dark:text-blue-500 transition-transform group-hover:rotate-12" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link 
              href="/login" 
              className="flex-1 py-4 px-6 rounded-lg bg-neutral-100 dark:bg-black/40 backdrop-blur-md border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white/90 hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-black hover:border-black dark:hover:border-white font-bold text-base uppercase tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-3 group shadow-lg"
            >
              <Tag className="size-5 text-blue-600 dark:text-blue-500 transition-transform group-hover:scale-125" />
              <span>Publicar</span>
            </Link>
          )}
        </div>
      </section>

      {/* VALUE PROPOSITION SECTION */}
      <section className="w-full py-12 md:py-16 space-y-12 relative z-10 border-t border-border/40">
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-blue-500 animate-pulse">Tecnología de Vanguardia</span>
          <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-tight">
            Orquestación <span className="text-blue-500">Inteligente</span>
          </h2>
          <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest max-w-xl">
            La combinación perfecta entre Inteligencia Artificial y Automatización para dominar el mercado.
          </p>
        </div>

        {/* MOBILE: INFINITE MARQUEE */}
        <div className="md:hidden marquee-container overflow-hidden w-full relative py-4">
          <div className="flex animate-marquee w-fit gap-6 px-4">
            {/* Set 1 */}
            <div className="w-72 group space-y-6 p-8 bg-card/50 backdrop-blur-sm border border-border/50 hover:border-blue-500/40 transition-all duration-500 relative overflow-hidden shrink-0">
              <div className="absolute -left-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-700">
                <Wand2 className="size-32 text-blue-500" />
              </div>
              <div className="size-12 bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                <Wand2 className="size-6 text-blue-500" />
              </div>
              <div className="space-y-3 relative z-10">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-foreground">Visión Artificial</h3>
                <p className="text-[10px] text-muted-foreground font-bold leading-relaxed tracking-wide group-hover:text-foreground transition-colors uppercase whitespace-normal">
                  Subes una foto y nuestra IA genera títulos, descripciones y sugiere el precio óptimo.
                </p>
              </div>
            </div>

            <div className="w-72 group space-y-6 p-8 bg-card/50 backdrop-blur-sm border border-border/50 hover:border-cyan-500/40 transition-all duration-500 relative overflow-hidden shrink-0">
              <div className="absolute -left-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-700">
                <Cpu className="size-32 text-cyan-500" />
              </div>
              <div className="size-12 bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
                <Cpu className="size-6 text-cyan-500" />
              </div>
              <div className="space-y-3 relative z-10">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-foreground">Red de Bots</h3>
                <p className="text-[10px] text-muted-foreground font-bold leading-relaxed tracking-wide group-hover:text-foreground transition-colors uppercase whitespace-normal">
                  Despacha tus publicaciones a través de una flota de bots en múltiples cuentas.
                </p>
              </div>
            </div>

            <div className="w-72 group space-y-6 p-8 bg-card/50 backdrop-blur-sm border border-border/50 hover:border-amber-500/40 transition-all duration-500 relative overflow-hidden shrink-0">
              <div className="absolute -left-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-700">
                <Rocket className="size-32 text-amber-500" />
              </div>
              <div className="size-12 bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                <Rocket className="size-6 text-amber-500" />
              </div>
              <div className="space-y-3 relative z-10">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-foreground">Variantes</h3>
                <p className="text-[10px] text-muted-foreground font-bold leading-relaxed tracking-wide group-hover:text-foreground transition-colors uppercase whitespace-normal">
                  Creamos variantes optimizadas para saturar el mercado y estar siempre visible.
                </p>
              </div>
            </div>

            {/* Set 2 - Duplicate for mobile seamless loop */}
            <div className="w-72 group space-y-6 p-8 bg-card/50 backdrop-blur-sm border border-border/50 hover:border-blue-500/40 transition-all duration-500 relative overflow-hidden shrink-0">
              <div className="absolute -left-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-700">
                <Wand2 className="size-32 text-blue-500" />
              </div>
              <div className="size-12 bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                <Wand2 className="size-6 text-blue-500" />
              </div>
              <div className="space-y-3 relative z-10">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-foreground">Visión Artificial</h3>
                <p className="text-[10px] text-muted-foreground font-bold leading-relaxed tracking-wide group-hover:text-foreground transition-colors uppercase whitespace-normal">
                  Subes una foto y nuestra IA genera títulos, descripciones y sugiere el precio óptimo.
                </p>
              </div>
            </div>

            <div className="w-72 group space-y-6 p-8 bg-card/50 backdrop-blur-sm border border-border/50 hover:border-cyan-500/40 transition-all duration-500 relative overflow-hidden shrink-0">
              <div className="absolute -left-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-700">
                <Cpu className="size-32 text-cyan-500" />
              </div>
              <div className="size-12 bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
                <Cpu className="size-6 text-cyan-500" />
              </div>
              <div className="space-y-3 relative z-10">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-foreground">Red de Bots</h3>
                <p className="text-[10px] text-muted-foreground font-bold leading-relaxed tracking-wide group-hover:text-foreground transition-colors uppercase whitespace-normal">
                  Despacha tus publicaciones a través de una flota de bots en múltiples cuentas.
                </p>
              </div>
            </div>

            <div className="w-72 group space-y-6 p-8 bg-card/50 backdrop-blur-sm border border-border/50 hover:border-amber-500/40 transition-all duration-500 relative overflow-hidden shrink-0">
              <div className="absolute -left-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-700">
                <Rocket className="size-32 text-amber-500" />
              </div>
              <div className="size-12 bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                <Rocket className="size-6 text-amber-500" />
              </div>
              <div className="space-y-3 relative z-10">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-foreground">Variantes</h3>
                <p className="text-[10px] text-muted-foreground font-bold leading-relaxed tracking-wide group-hover:text-foreground transition-colors uppercase whitespace-normal">
                  Creamos variantes optimizadas para saturar el mercado y estar siempre visible.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP: STATIC GRID */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 md:gap-12 w-full max-w-6xl mx-auto px-4">
          <div className="group space-y-6 p-8 bg-card/50 backdrop-blur-sm border border-border/50 hover:border-blue-500/40 transition-all duration-500 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-700">
              <Wand2 className="size-32 text-blue-500" />
            </div>
            <div className="size-12 bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Wand2 className="size-6 text-blue-500" />
            </div>
            <div className="space-y-3 relative z-10">
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-foreground">Visión Artificial</h3>
              <p className="text-[11px] text-muted-foreground font-bold leading-relaxed tracking-wide group-hover:text-foreground transition-colors uppercase">
                Subes una foto y nuestra IA genera títulos ganadores, descripciones persuasivas y sugiere el precio óptimo basándose en tendencias globales.
              </p>
            </div>
          </div>

          <div className="group space-y-6 p-8 bg-card/50 backdrop-blur-sm border border-border/50 hover:border-cyan-500/40 transition-all duration-500 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-700">
              <Cpu className="size-32 text-cyan-500" />
            </div>
            <div className="size-12 bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <Cpu className="size-6 text-cyan-500" />
            </div>
            <div className="space-y-3 relative z-10">
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-foreground">Red de Bots</h3>
              <p className="text-[11px] text-muted-foreground font-bold leading-relaxed tracking-wide group-hover:text-foreground transition-colors uppercase">
                Despacha tus publicaciones a través de una flota de bots dedicados que operan en múltiples cuentas de Marketplace simultáneamente.
              </p>
            </div>
          </div>

          <div className="group space-y-6 p-8 bg-card/50 backdrop-blur-sm border border-border/50 hover:border-amber-500/40 transition-all duration-500 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-700">
              <Rocket className="size-32 text-amber-500" />
            </div>
            <div className="size-12 bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Rocket className="size-6 text-amber-500" />
            </div>
            <div className="space-y-3 relative z-10">
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-foreground">Variantes Masivas</h3>
              <p className="text-[11px] text-muted-foreground font-bold leading-relaxed tracking-wide group-hover:text-foreground transition-colors uppercase">
                Creamos docenas de variantes optimizadas de un solo producto para saturar el mercado y garantizar que tu oferta esté siempre visible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RECENT ITEMS DISPLAY */}
      <section className="w-full pb-12 space-y-6 relative z-10">
        {displayItems.length > 0 && (
          <div className="pt-0 space-y-6 animate-blur-fade [animation-delay:0.8s] opacity-0" style={{ animationFillMode: "forwards" }}>
             <div className="space-y-1 text-center md:text-left">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Novedades</span>
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Publicaciones Recientes</h3>
             </div>
             
             <Carousel className="w-full">
                <CarouselContent className="-ml-4">
                   {displayItems.map((item: any) => (
                     <CarouselItem key={item.id} className="pl-4 basis-[70%] sm:basis-1/2 md:basis-1/4">
                       <Link 
                         href="/marketplace" 
                         className="group block bg-card border border-border overflow-hidden hover:border-blue-500/40 transition-all duration-300 h-full"
                       >
                         <div className="aspect-square bg-muted relative overflow-hidden">
                            <img 
                              src={item.imageUrls?.[0] || "/iconTeloVendo.svg"} 
                              className={`size-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110 ${!item.imageUrls?.[0] ? 'opacity-10 scale-50' : ''}`}
                              alt={item.listingTitle} 
                            />
                            <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md text-[8px] font-black italic uppercase text-white tracking-widest border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.listingCategory?.replace(/_/g, ' ')}
                            </div>
                         </div>
                         <div className="p-4 space-y-1">
                            <div className="text-[11px] font-black text-blue-500 tracking-tighter">
                               {item.listingCurrency === "DOLAR" ? "$" : "Bs"} {formatPrice(item.listingPrice)}
                            </div>
                            <h4 className="text-[10px] font-bold uppercase tracking-tight text-foreground truncate">{item.listingTitle || item.orderName}</h4>
                         </div>
                       </Link>
                     </CarouselItem>
                   ))}

                   {/* EXPLORE MORE CARD ITEM */}
                   <CarouselItem className="pl-4 basis-[70%] sm:basis-1/2 md:basis-1/4">
                     <Link 
                       href="/marketplace" 
                       className="group bg-black dark:bg-blue-600 border border-neutral-800 dark:border-blue-500 overflow-hidden hover:bg-neutral-900 dark:hover:bg-blue-700 transition-all duration-300 flex flex-col items-center justify-center p-6 text-center space-y-4 shadow-xl shadow-black/10 dark:shadow-blue-500/10 h-full aspect-square"
                     >
                       <div className="size-12 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                         <ArrowRight className="size-6 text-white" />
                       </div>
                       <div className="space-y-1">
                         <h4 className="text-xs font-black uppercase italic tracking-tighter text-white">Explorar Todo</h4>
                         <p className="text-[9px] font-bold uppercase text-white/70 tracking-widest">Marketplace completo</p>
                       </div>
                     </Link>
                   </CarouselItem>
                </CarouselContent>
                
                {/* NAVIGATION ARROWS */}
                <div className="hidden md:flex items-center gap-2 absolute top-0 right-0 -translate-y-12">
                   <CarouselPrevious className="static translate-y-0" />
                   <CarouselNext className="static translate-y-0" />
                </div>
                {/* Mobile indicators or just simple scroll is enough, but shadcn arrows work if placed correctly */}
             </Carousel>
          </div>
        )}
      </section>
    </div>
  </div>
  );
}
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
  Camera 
} from "lucide-react";
import { cookies } from "next/headers";
import { getPublicPublications } from "@/lib/actions/public";
import { getSession } from "@/lib/auth-utils";

const formatPrice = (price: any) => {
  const num = Number(price?.$numberDecimal || price) || 0;
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

export default async function LandingPage() {
  const session = await getSession();
  const isAuthenticated = !!session;
  
  const recentItems = await getPublicPublications();
  const displayItems = recentItems.slice(0, 4);
  return (
    <div className="relative w-full overflow-hidden flex flex-col items-center">
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
      <section className="flex flex-col items-center justify-center min-h-[85svh] w-full py-20 text-center relative overflow-visible">
        <div className="space-y-4 mb-16 relative z-10 transition-all duration-700">
          <div className="space-y-4">
            <div className="flex justify-center mb-4 animate-blur-fade">
              <img src="/iconTeloVendo.svg" alt="TeloVendo Icon" className="w-40 h-40 md:w-48 md:h-48 dark:invert" />
            </div>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-none animate-title-reveal text-foreground">
              TeloVendo
            </h1>
            <div className="w-full max-w-full px-4 mx-auto">
              <p className="text-xs md:text-sm text-neutral-500 font-bold tracking-[0.2em] uppercase animate-blur-fade [animation-delay:0.3s] opacity-0 break-words max-w-2xl mx-auto" style={{ animationFillMode: "forwards" }}>
                Tu próximo destino de compras. Encuentra vehículos, inmuebles y más.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-5 w-[85%] md:w-full max-w-xs md:max-w-2xl mx-auto animate-blur-fade [animation-delay:0.5s] opacity-0 relative z-20" style={{ animationFillMode: "forwards" }}>
          <Link 
            href="/marketplace" 
            className="flex-1 min-h-[52px] md:min-h-[70px] px-8 rounded-none bg-blue-600 text-white hover:bg-white hover:text-blue-600 font-black text-sm md:text-base uppercase tracking-[0.25em] transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] shadow-2xl flex flex-col items-center justify-center gap-1.5 group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              Explorar
              <ShoppingBag className="size-5 md:size-6 transition-transform group-hover:translate-y-[-2px]" />
            </div>
            <span className="text-[7px] md:text-[8px] opacity-40 font-bold tracking-[0.3em] uppercase group-hover:text-blue-600/60">Catálogo</span>
          </Link>

          {isAuthenticated ? (
            <Link 
              href="/dashboard" 
              className="flex-1 min-h-[52px] md:min-h-[70px] px-8 rounded-none border border-foreground/30 bg-muted/20 text-foreground hover:bg-foreground hover:text-background font-black text-sm md:text-base uppercase tracking-[0.25em] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center gap-1.5 group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                Dashboard
                <LayoutDashboard className="size-5 md:size-6 transition-transform group-hover:rotate-12" />
              </div>
              <span className="text-[7px] md:text-[8px] opacity-40 font-bold tracking-[0.3em] uppercase group-hover:text-background/60">Control</span>
            </Link>
          ) : (
            <Link 
              href="/login" 
              className="flex-1 min-h-[76px] md:min-h-[70px] px-8 rounded-none border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background font-black text-sm md:text-base uppercase tracking-[0.25em] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center gap-1.5 group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                Publicar
                <Tag className="size-5 md:size-6 transition-transform group-hover:scale-125" />
              </div>
              <span className="text-[7px] md:text-[8px] opacity-40 font-bold tracking-[0.3em] uppercase group-hover:text-background/60">Vender</span>
            </Link>
          )}
        </div>
      </section>

      {/* Featured Categories */}
      <section className="w-full pb-32 space-y-16 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border pb-8">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">¿Qué necesitas hoy?</span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter italic uppercase leading-none">Explora Categorías</h2>
            </div>
            <Link href="/marketplace" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-blue-500 transition-colors flex items-center gap-2">
               Ver Todo el Marketplace <ArrowRight className="size-3" />
            </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-6xl mx-auto">
          <Link href="/marketplace" className="group bg-card border border-border p-6 md:p-10 hover:border-blue-500/30 transition-all duration-500 shadow-sm relative overflow-hidden cursor-pointer">
             <div className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-700">
                <Car className="size-32 md:size-48 text-blue-500" />
             </div>
             <Car className="w-6 h-6 text-blue-500 mb-6 group-hover:scale-110 transition-transform" />
             <div className="space-y-2">
                <div className="text-xl md:text-2xl font-black italic tracking-tighter uppercase leading-none">Vehículos</div>
                <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Autos, Motos y más</div>
             </div>
          </Link>

          <Link href="/marketplace" className="group bg-card border border-border p-6 md:p-10 hover:border-emerald-500/30 transition-all duration-500 shadow-sm relative overflow-hidden cursor-pointer">
             <div className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-700">
                <Home className="size-32 md:size-48 text-emerald-500" />
             </div>
             <Home className="w-6 h-6 text-emerald-500 mb-6 group-hover:scale-110 transition-transform" />
             <div className="space-y-2">
                <div className="text-xl md:text-2xl font-black italic tracking-tighter uppercase leading-none">Inmuebles</div>
                <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Ventas y Alquileres</div>
             </div>
          </Link>

          <Link href="/marketplace" className="group bg-card border border-border p-6 md:p-10 hover:border-amber-500/30 transition-all duration-500 shadow-sm relative overflow-hidden cursor-pointer sm:col-span-2 md:col-span-1">
             <div className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-700">
                <Smartphone className="size-32 md:size-48 text-amber-500" />
             </div>
             <Smartphone className="w-6 h-6 text-amber-500 mb-6 group-hover:scale-110 transition-transform" />
             <div className="space-y-2">
                <div className="text-xl md:text-2xl font-black italic tracking-tighter uppercase leading-none">Electrónica</div>
                <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Tecnología de punta</div>
             </div>
          </Link>
        </div>

        {/* RECENT ITEMS DISPLAY */}
        {displayItems.length > 0 && (
          <div className="pt-20 space-y-12 animate-blur-fade [animation-delay:0.8s] opacity-0" style={{ animationFillMode: "forwards" }}>
             <div className="space-y-2 text-center md:text-left">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Novedades</span>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Publicaciones Recientes</h3>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {displayItems.map((item: any) => (
                  <Link 
                    key={item.id} 
                    href="/marketplace" 
                    className="group bg-card border border-border overflow-hidden hover:border-blue-500/40 transition-all duration-300"
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
                ))}
             </div>
          </div>
        )}
      </section>
    </div>
  </div>
  );
}

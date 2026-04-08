import { getPublicPublications } from "@/lib/actions/public";
import { MarketplaceClient } from "./MarketplaceClient";
import { 
  ShoppingCart, 
  Package, 
  Filter, 
  Search, 
  Car, 
  Home, 
  Smartphone, 
  Tag, 
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
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "TeloVendo : Marketplace",
  description: "Explora los mejores artículos en el marketplace más dinámico de la región.",
};

export default async function MarketplacePage() {
  const publications = await getPublicPublications();

  return (
    <div className="relative w-full overflow-hidden flex flex-col items-center">
      {/* GLOBAL TECH BACKGROUND SYSTEM (Spans entire page) */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
         {/* Modern Dotted Grid */}
         <div className="fixed inset-0 opacity-[0.05] dark:opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 0.5px, transparent 0)', backgroundSize: '32px 32px' }} />
         
         {/* Marketplace Specific Peripheral Glows */}
         <div className="absolute top-[10%] left-[-15%] w-[60%] lg:w-[45%] h-[40%] bg-blue-500/5 blur-[130px] rounded-full animate-pulse" />
         <div className="absolute top-[50%] right-[-15%] w-[60%] lg:w-[40%] h-[45%] bg-blue-600/3 blur-[150px] rounded-full animate-pulse" style={{ animationDuration: '12s' }} />
         <div className="absolute bottom-[0%] left-[-10%] w-[50%] lg:w-[35%] h-[35%] bg-blue-500/5 blur-[140px] rounded-full animate-pulse" style={{ animationDuration: '10s' }} />
         
         {/* Denser, balanced icons & soft motion at spectral opacity */}
         {[
            { I: Car, t: '5%', l: '8%', s: 'size-12', d: '25s', a: 'animate-bounce' },
            { I: Home, t: '12%', r: '12%', s: 'size-16', d: '18s', a: 'animate-pulse' },
            { I: Smartphone, t: '22%', l: '20%', s: 'size-10', d: '22s', a: 'animate-bounce' },
            { I: Laptop, t: '32%', r: '28%', s: 'size-14', d: '20s', a: 'animate-pulse' },
            { I: Tv, t: '42%', l: '35%', s: 'size-12', d: '30s', a: 'animate-bounce' },
            { I: ShoppingCart, t: '52%', r: '15%', s: 'size-14', d: '25s', a: 'animate-pulse' },
            { I: Tag, t: '62%', l: '10%', s: 'size-10', d: '15s', a: 'animate-bounce' },
            { I: Package, t: '72%', r: '25%', s: 'size-14', d: '19s', a: 'animate-pulse' },
            { I: Bike, t: '82%', l: '15%', s: 'size-12', d: '28s', a: 'animate-bounce' },
            { I: Shirt, t: '92%', r: '12%', s: 'size-10', d: '24s', a: 'animate-pulse' },
            { I: Bed, t: '25%', r: '45%', s: 'size-16', d: '17s', a: 'animate-bounce' },
            { I: Sofa, t: '65%', l: '45%', s: 'size-14', d: '23s', a: 'animate-pulse' },
            { I: Watch, t: '85%', r: '45%', s: 'size-10', d: '16s', a: 'animate-bounce' },
            { I: Headphones, t: '15%', l: '45%', s: 'size-12', d: '21s', a: 'animate-pulse' },
            { I: Zap, t: '45%', r: '5%', s: 'size-10', d: '11s', a: 'animate-bounce' },
         ].map((item, i) => (
            <div 
              key={i} 
              className={`absolute opacity-[0.04] dark:opacity-[0.06]`}
              style={{ 
                top: item.t, 
                ...(item.l ? { left: item.l } : { right: item.r }),
                transform: `rotate(${i * 25}deg)`
              }}
            >
               <item.I className={item.s} />
            </div>
         ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 space-y-12 w-full">
        {/* HEADER MARKETPLACE */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-10">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic uppercase text-foreground">
              TeloVendo : <span className="text-blue-500">Marketplace</span>
            </h1>
            <div className="flex items-center gap-3">
               <div className="h-[2px] w-12 bg-blue-500" />
               <p className="text-xs uppercase font-black tracking-[0.2em] text-muted-foreground/60">
                 Catálogo de artículos seleccionados
               </p>
            </div>
          </div>

        </div>

        {/* GRID DE PRODUCTOS */}
        {publications.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4 border border-dashed border-border rounded-2xl bg-neutral-50/30 dark:bg-white/[0.02]">
             <ShoppingCart className="size-16 text-muted-foreground/20" />
             <p className="text-lg font-bold text-muted-foreground/40 uppercase tracking-widest">No hay artículos publicados aún</p>
             <p className="text-xs text-muted-foreground/30">Vuelve más tarde para ver nuevas ofertas.</p>
          </div>
        ) : (
          <MarketplaceClient publications={publications} />
        )}
      </div>
    </div>
  );
}

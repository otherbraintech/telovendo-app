"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { 
  ShoppingCart, 
  ExternalLink, 
  Tag, 
  Package, 
  Filter, 
  Search, 
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Clock,
  ShieldCheck
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function MarketplaceClient({ publications }: { publications: any[] }) {
  const [selectedPub, setSelectedPub] = useState<any>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [search, setSearch] = useState("");

  const filteredPublications = publications.filter((pub: any) => 
    pub.listingTitle?.toLowerCase().includes(search.toLowerCase()) ||
    pub.listingCategory?.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (price: any) => {
    const num = parseFloat(price?.$numberDecimal || price || "0");
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <>
      {/* SEARCH INTERFACE (Integrated) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 w-full">
         <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-colors group-focus-within:text-blue-500" />
            <input 
              type="text" 
              placeholder="Buscar por título o categoría..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border/50 rounded-none py-4 pl-12 pr-4 text-xs font-bold uppercase tracking-widest focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
            />
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
         </div>
         <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
              {filteredPublications.length} Artículos encontrados
            </span>
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredPublications.map((pub: any) => (
          <Card 
            key={pub.id} 
            onClick={() => { setSelectedPub(pub); setActiveImageIndex(0); }}
            className="group rounded-none border-border/40 bg-card/50 hover:border-blue-500 transition-all duration-500 flex flex-col overflow-hidden shadow-sm hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] cursor-pointer relative"
          >
            <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-900 border-b border-border/10">
              {pub.imageUrls && pub.imageUrls[0] ? (
                <img 
                  src={pub.imageUrls[0]} 
                  alt={pub.listingTitle} 
                  loading="lazy"
                  className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground/20">
                  <Package className="size-12" />
                </div>
              )}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                 <Badge className="bg-blue-600 hover:bg-blue-600 text-white border-0 text-[9px] font-black tracking-widest uppercase py-1 px-2 rounded-none">
                    {pub.listingCondition || "NUEVO"}
                 </Badge>
              </div>
            </div>

            <CardHeader className="p-5 space-y-3 pb-2">
              <div className="flex justify-between items-start gap-4">
                 <h3 className="font-black text-sm md:text-base leading-tight uppercase italic text-foreground/90 group-hover:text-blue-500 transition-colors line-clamp-2">
                   {pub.listingTitle}
                 </h3>
              </div>
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <span className="text-xs font-black tracking-tighter">{pub.listingCurrency === "DOLAR" ? "$" : "Bs"}</span>
                  <span className="text-xl font-black italic tracking-tighter">
                    {formatPrice(pub.listingPrice)}
                  </span>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-0 flex-grow">
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3 font-medium opacity-70">
                 {pub.listingDescription}
              </p>
            </CardContent>

            <CardFooter className="p-5 pt-4 border-t border-border/30 flex flex-col gap-3">
               <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">
                    <Tag className="size-3" />
                    {(pub.listingCategory || "VARIOS").replace(/_/g, ' ')}
                  </div>
                  <Info className="size-3 text-blue-500/30 group-hover:text-blue-500 transition-colors" />
               </div>
               <Button 
                onClick={(e) => { e.stopPropagation(); }}
                className="w-full bg-foreground text-background hover:bg-blue-600 hover:text-white rounded-none h-10 font-black text-[10px] tracking-[0.2em] uppercase transition-all duration-300 group/btn"
               >
                  Ver en Marketplace
                  <ExternalLink className="size-3 ml-2 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
               </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* DETAIL DIALOG */}
      <Dialog open={!!selectedPub} onOpenChange={(open) => !open && setSelectedPub(null)}>
        <DialogContent className="sm:max-w-none w-[95vw] md:max-w-5xl lg:max-w-6xl p-0 bg-card border-border rounded-none gap-0 overflow-y-auto custom-scrollbar md:overflow-hidden max-h-[90vh] md:h-auto border-none shadow-[0_0_100px_rgba(0,0,0,0.5)]">
          <DialogHeader className="sr-only">
             <DialogTitle>{selectedPub?.listingTitle}</DialogTitle>
             <DialogDescription>{selectedPub?.listingDescription}</DialogDescription>
          </DialogHeader>
          
          {/* Custom Close Button for better visibility */}
          <button 
            onClick={() => setSelectedPub(null)}
            className="absolute top-4 right-4 z-[100] size-10 bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-red-500 transition-all cursor-pointer group"
          >
            <X className="size-6 transition-transform group-active:scale-90" />
          </button>
          {selectedPub && (
            <div className="flex flex-col md:flex-row w-full h-full min-h-[500px]">
              {/* IMAGE SECTION */}
              <div className="w-full md:w-1/2 bg-neutral-900 md:bg-muted/20 flex flex-col border-b md:border-b-0 md:border-r border-border min-h-[400px] md:h-auto">
                <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-neutral-900 group">
                  {selectedPub.imageUrls && selectedPub.imageUrls[activeImageIndex] ? (
                    <img 
                      src={selectedPub.imageUrls[activeImageIndex]} 
                      alt={selectedPub.listingTitle} 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Package className="size-20 text-muted-foreground/10" />
                  )}
                  
                  {selectedPub.imageUrls?.length > 1 && (
                    <>
                      <button 
                        onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : selectedPub.imageUrls.length - 1))}
                        className="absolute left-4 top-1/2 -translate-y-1/2 size-10 bg-black/50 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronLeft className="size-6" />
                      </button>
                      <button 
                        onClick={() => setActiveImageIndex((prev) => (prev < selectedPub.imageUrls.length - 1 ? prev + 1 : 0))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 size-10 bg-black/50 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="size-6" />
                      </button>
                    </>
                  )}
                </div>

                {selectedPub.imageUrls?.length > 1 && (
                  <div className="p-4 bg-background/50 border-t border-border/50 flex items-center gap-3 overflow-x-auto scrollbar-hide">
                    {selectedPub.imageUrls.map((img: string, idx: number) => (
                      <button 
                        key={idx} 
                        onClick={() => setActiveImageIndex(idx)}
                        className={`size-16 shrink-0 border-2 transition-all ${activeImageIndex === idx ? 'border-blue-500 scale-105' : 'border-transparent opacity-40 hover:opacity-100'}`}
                      >
                        <img src={img} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* INFO SECTION */}
              <div className="flex-1 p-6 md:p-12 space-y-8 md:overflow-y-auto custom-scrollbar md:max-h-[90vh]">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="bg-blue-600 text-white border-0 text-[10px] font-black tracking-widest uppercase rounded-none py-1.5 px-3">
                      {selectedPub.listingCondition || "NUEVO"}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-[10px] uppercase tracking-widest bg-emerald-500/10 px-2 py-1">
                       <ShieldCheck className="size-3" /> Verificado por Bots
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter text-blue-950 dark:text-blue-50 leading-none">
                    {selectedPub.listingTitle}
                  </h2>

                  <div className="flex items-baseline gap-2 pt-2">
                    <span className="text-xl font-black text-blue-600">{selectedPub.listingCurrency === "DOLAR" ? "$" : "Bs"}</span>
                    <span className="text-5xl font-black italic tracking-tighter text-blue-600">
                      {formatPrice(selectedPub.listingPrice)}
                    </span>
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-border/40">
                  {selectedPub.listingType === "VEHICULO" && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 border border-border/50 rounded-none">
                       <div className="space-y-1">
                          <h4 className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">Año</h4>
                          <p className="text-xs font-black uppercase">{selectedPub.vehicleYear || "N/A"}</p>
                       </div>
                       <div className="space-y-1">
                          <h4 className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">Marca</h4>
                          <p className="text-xs font-black uppercase">{selectedPub.vehicleMake || "N/A"}</p>
                       </div>
                       <div className="space-y-1">
                          <h4 className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">Modelo</h4>
                          <p className="text-xs font-black uppercase">{selectedPub.vehicleModel || "N/A"}</p>
                       </div>
                       <div className="space-y-1">
                          <h4 className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">Kilometraje</h4>
                          <p className="text-xs font-black uppercase">{selectedPub.vehicleMileage ? `${selectedPub.vehicleMileage} km` : "N/A"}</p>
                       </div>
                    </div>
                  )}

                  {selectedPub.listingType === "PROPIEDAD" && (
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 border border-border/50 rounded-none">
                       <div className="space-y-1">
                          <h4 className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">Hab.</h4>
                          <p className="text-xs font-black uppercase">{selectedPub.propRooms || "N/A"}</p>
                       </div>
                       <div className="space-y-1">
                          <h4 className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">Baños</h4>
                          <p className="text-xs font-black uppercase">{selectedPub.propBathrooms || "N/A"}</p>
                       </div>
                       <div className="space-y-1">
                          <h4 className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">Superficie</h4>
                          <p className="text-xs font-black uppercase">{selectedPub.propArea ? `${selectedPub.propArea} m²` : "N/A"}</p>
                       </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Descripción Técnica</h4>
                    <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap font-medium">
                      {selectedPub.listingDescription}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-4">
                    <div className="space-y-1">
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Categoría</h4>
                      <p className="text-xs font-black uppercase text-foreground">{selectedPub.listingCategory?.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Disponibilidad</h4>
                      <p className="text-xs font-black uppercase text-foreground">Inmediata</p>
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex flex-col gap-4">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-none h-14 font-black text-xs tracking-[0.3em] uppercase transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                    Contactar Vendedor
                    <ShoppingCart className="size-4 ml-3" />
                  </Button>
                  <Button variant="outline" className="w-full border-border rounded-none h-12 font-black text-[10px] tracking-[0.2em] uppercase transition-all hover:bg-muted opacity-60 hover:opacity-100">
                    Ver en Facebook Marketplace
                    <ExternalLink className="size-3 ml-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

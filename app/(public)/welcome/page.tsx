"use client";

import { useState } from "react";
import { 
  ShoppingBag, 
  Zap, 
  Mail, 
  Bot, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Send
} from "lucide-react";
import Link from "next/link";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function WelcomePage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Side: Illustration & Message */}
        <div className="space-y-8 animate-in slide-in-from-left-8 duration-700">
           <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                 <ShieldCheck className="size-3" />
                 Cuenta verificada
              </div>
              <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter text-foreground leading-[0.9]">
                 ¡Bienvenido a <br /><span className="text-blue-500 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">TeloVendo</span>!
              </h1>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-sm">
                 Tu cuenta ha sido creada con éxito. Ahora eres parte de la red más dinámica de comercio automatizado.
              </p>
           </div>

           <div className="space-y-4 pt-4 border-t border-border/40">
              <div className="flex items-start gap-4">
                 <div className="size-10 bg-muted border border-border flex items-center justify-center shrink-0">
                    <CheckCircle2 className="size-5 text-blue-500" />
                 </div>
                 <div>
                    <p className="text-[11px] font-black uppercase text-foreground">Acceso Espectador</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase leading-tight mt-1">Navega libremente por todos los productos publicados en tiempo real.</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Side: Choices */}
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-700 delay-200">
           
           <Link href="/marketplace" className="group flex flex-col p-8 bg-card border border-border hover:border-blue-500/40 transition-all duration-500 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
                 <ShoppingBag className="size-20 text-foreground" />
              </div>
              <div className="relative z-10 space-y-4">
                 <div className="size-12 bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <ShoppingBag className="size-6 text-blue-500" />
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-xl font-black uppercase italic tracking-tight text-foreground group-hover:text-blue-500 transition-colors">Explorar Marketplace</h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Encuentra los mejores artículos ahora</p>
                 </div>
                 <div className="flex items-center gap-2 text-[9px] font-black uppercase text-blue-500 group-hover:translate-x-2 transition-transform">
                    Ir al catálogo <ArrowRight className="size-3" />
                 </div>
              </div>
           </Link>

           <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <div className="group flex flex-col p-8 bg-blue-600 hover:bg-blue-700 transition-all duration-500 shadow-2xl shadow-blue-600/20 relative overflow-hidden cursor-pointer">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                     <Zap className="size-20 text-white" />
                  </div>
                  <div className="relative z-10 space-y-4">
                     <div className="size-12 bg-white/10 flex items-center justify-center border border-white/20">
                        <Zap className="size-6 text-white" />
                     </div>
                     <div className="space-y-1">
                        <h3 className="text-xl font-black uppercase italic tracking-tight text-white">Requerir Servicio</h3>
                        <p className="text-[10px] text-white/60 uppercase font-bold tracking-widest">Publica tus productos con bots</p>
                     </div>
                     <div className="flex items-center gap-2 text-[9px] font-black uppercase text-white/80 group-hover:translate-x-2 transition-transform">
                        Ver requisitos <ArrowRight className="size-3" />
                     </div>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-xl rounded-none border border-border p-0 overflow-hidden bg-card">
                 <div className="h-1.5 w-full bg-blue-600" />
                 <div className="p-8 md:p-12 space-y-8">
                    <DialogHeader className="space-y-3">
                       <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                          Acceso <span className="text-blue-500">Master Seller</span>
                       </DialogTitle>
                       <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Bot className="size-4 text-blue-500" />
                          Automatización Masiva de Ventas
                       </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                       <p className="text-sm font-medium leading-relaxed text-foreground/80">
                          Para convertirte en un vendedor premium de <span className="font-black italic">TeloVendo</span> y utilizar nuestra red de <span className="text-blue-500 font-bold">Bots de Marketplace</span> para publicar tus artículos de forma masiva y automática, por favor contáctanos.
                       </p>

                       <div className="bg-muted p-6 space-y-4 border border-border">
                          <div className="flex items-center gap-4">
                             <div className="size-10 bg-card border border-border flex items-center justify-center">
                                <Mail className="size-5 text-blue-500" />
                             </div>
                             <div>
                                <p className="text-[9px] font-black uppercase text-muted-foreground">Enviar solicitud a:</p>
                                <p className="text-sm font-black text-blue-600 font-mono">admin@otherbrain.tech</p>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50 text-center">Nuestro equipo evaluará tu solicitud para darte acceso al Dashboard completo.</p>
                       </div>
                    </div>

                    <div className="flex flex-col gap-3">
                       <Button 
                         asChild
                         className="h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest rounded-none shadow-xl shadow-blue-600/20"
                       >
                          <a href="mailto:admin@otherbrain.tech?subject=Solicitud de Acceso Full - TeloVendo&body=Hola, me gustaría solicitar acceso completo para publicar mis artículos usando bots en TeloVendo.">
                            <Send className="size-4 mr-2" /> Enviar Correo Ahora
                          </a>
                       </Button>
                       <Button 
                         variant="ghost" 
                         onClick={() => setIsOpen(false)}
                         className="h-10 text-[10px] uppercase font-bold tracking-widest opacity-60 hover:opacity-100"
                       >
                          Volver
                       </Button>
                    </div>
                 </div>
              </DialogContent>
           </Dialog>

        </div>
      </div>
    </div>
  );
}

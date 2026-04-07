"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProjectEnforcer({ projectsCount }: { projectsCount: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [closedByUser, setClosedByUser] = useState(false);

  const isDashboardRoot = pathname === "/dashboard" || pathname === "/dashboard/";

  useEffect(() => {
    // Si no hay proyectos, y estamos en el dashboard o sub-rutas (excepto perfil, usuarios o la pagina misma de proyectos)
    // mostramos una interrupcion visual.
    const allowedWithoutProjects = ["/projects", "/dashboard/profile", "/users"];
    
    if (projectsCount === 0 && !allowedWithoutProjects.includes(pathname)) {
      if (isDashboardRoot && closedByUser) {
        setOpen(false);
      } else {
        setOpen(true);
      }
    } else {
      setOpen(false);
    }
  }, [projectsCount, pathname, closedByUser, isDashboardRoot]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val && isDashboardRoot) {
        setClosedByUser(true);
      }
    }}>
      <DialogContent className="max-w-md w-[95vw] rounded-none bg-card border border-amber-500/50 p-0 max-h-[90dvh] overflow-y-auto outline-none" 
                     onInteractOutside={(e) => { if (!isDashboardRoot) e.preventDefault(); }}
                     onEscapeKeyDown={(e) => { if (!isDashboardRoot) e.preventDefault(); }}
                     showCloseButton={isDashboardRoot}>
        <div className="h-1.5 w-full bg-amber-500 shrink-0"></div>
        <div className="p-6 md:p-8 space-y-5 md:space-y-6">
          <DialogHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
              <AlertTriangle className="size-8 text-amber-500" />
            </div>
            <div className="space-y-1 text-center">
              <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">
                Falta <span className="text-amber-500">Entorno</span>
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                No tienes proyectos activos en tu cuenta.
              </DialogDescription>
            </div>
          </DialogHeader>
          
          <p className="text-xs text-center text-muted-foreground leading-relaxed font-medium">
            Para poder gestionar publicaciones, conectar dispositivos bots, o realizar automatizaciones, primero debes establecer un flujo de trabajo creando un <strong className="text-foreground font-black">Proyecto</strong>.
          </p>

          <div className="pt-2 md:pt-4 flex flex-col gap-2 w-full">
            <Button 
               onClick={() => {
                 setOpen(false);
                 router.push("/projects");
               }}
               className="w-full rounded-none bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest text-[10px] h-12"
            >
              <Plus className="size-4 mr-2" />
              Crear Proyecto Ahora
            </Button>
            {isDashboardRoot && (
              <Button 
                variant="outline"
                onClick={() => setClosedByUser(true)}
                className="w-full rounded-none font-bold uppercase tracking-widest text-[10px] h-11 text-muted-foreground"
              >
                Ignorar por ahora
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

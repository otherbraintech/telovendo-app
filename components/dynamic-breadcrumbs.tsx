"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";
import { useProjectStore } from "@/hooks/use-project-store";

const routeMap: Record<string, string> = {
  dashboard: "Resumen",
  orders: "Mis Publicaciones",
  projects: "Mis Proyectos",
  devices: "Dispositivos",
  history: "Historial",
  generations: "Monitoreo Bots",
  profile: "Mi Perfil",
};

export function DynamicBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const { selectedProjectId, getProjectById, activeOrderName } = useProjectStore();

  if (segments.length === 0) return null;

  const activeProject = getProjectById(selectedProjectId);

  // Determinar si hay un ID de ejecución en la ruta (es una página específica)
  const isSpecificExecution = segments.some(seg => seg.length > 20 || (seg.startsWith("cmn") && seg.length > 10));

  return (
    <Breadcrumb className="hidden sm:block">
      <BreadcrumbList className="gap-1 sm:gap-2">
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-blue-500 transition-colors cursor-pointer">
            TeloVendo
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* PROYECTO SELECCIONADO (Limpio) */}
        {activeProject && (segments.includes("generations") || segments.includes("orders")) && (
          <>
            <BreadcrumbSeparator className="text-muted-foreground/30" />
            <BreadcrumbItem>
              <BreadcrumbLink 
                href="/orders" 
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-blue-500 transition-all cursor-pointer"
              >
                {activeProject.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}

        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;
          const isId = segment.length > 20 || (segment.startsWith("cmn") && segment.length > 10);
          
          // Omitir el nombre de la orden si estamos viendo muchas (vista general de monitoreo)
          // Solo mostramos el nombre de la orden si es una página específica (ID en la URL) o si el dialog está abierto en orders
          
          if (isId && activeOrderName) return null;
          if (segment === "generations" && isSpecificExecution) return null;

          const label = isId ? `Ejecución: ${segment.slice(-6).toUpperCase()}` : (routeMap[segment] || segment.toUpperCase());

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator className="text-muted-foreground/30" />
              <BreadcrumbItem>
                {isLast && !activeOrderName ? (
                  <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest text-foreground">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-blue-500 transition-colors cursor-pointer">
                    {label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}

        {/* NOMBRE PUBLICACIÓN FINAL (Condicional) */}
        {activeOrderName && (
          // Lo mostramos en 'orders' (porque indica el dialog abierto)
          // O lo mostramos en 'generations' SOLO SI es una ejecución específica (URL con ID)
          (segments.includes("orders") || (segments.includes("generations") && isSpecificExecution)) && (
            <>
              <BreadcrumbSeparator className="text-muted-foreground/30 animate-in fade-in" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-[10px] font-black uppercase tracking-widest text-blue-500 animate-in slide-in-from-left-2 transition-all">
                  {activeOrderName}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

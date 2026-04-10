"use client";

import * as React from "react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { 
  LayoutDashboard, 
  Bot, 
  Zap,
  Cpu,
  History as HistoryIcon,
  ShieldCheck,
  Home,
  Globe,
  ExternalLink,
  Rocket
} from "lucide-react"
import { CURRENT_VERSION } from "@/lib/versions"

export function AppSidebar({ 
  user, 
  projects,
  ...props 
}: { 
  user: any; 
  projects: any[] 
} & React.ComponentProps<typeof Sidebar>) {
  
  const teams = projects.length > 0 
    ? projects.map(p => ({
        name: p.name,
        logo: <img src="/iconTeloVendo.svg" className="size-4 animate-pulse brightness-125" />,
        plan: "PROYECTO ACTIVO",
        id: p.id
      }))
    : [{
        name: "Sistema Vacío",
        logo: <img src="/iconTeloVendo.svg" className="size-4 opacity-50 grayscale" />,
        plan: "SISTEMA IDLE",
        id: "none"
      }];

  const navMain = [
    {
      title: "Resumen",
      url: "/dashboard",
      icon: <LayoutDashboard className="size-4 text-blue-600" />,
    },
    {
      title: "Mis publicaciones",
      url: "/orders",
      icon: <Zap className="size-4 text-amber-500" />,
    },
    {
      title: "Mis proyectos",
      url: "/projects",
      icon: <img src="/iconTeloVendo.svg" className="size-4 brightness-110" />,
    },
    {
      title: "Mis Bots en Vivo",
      url: "/generations",
      icon: <Cpu className="size-4 text-purple-500" />,
    },
    {
      title: "Novedades & Releases",
      url: "/releases",
      icon: <Rocket className="size-4 text-rose-500" />,
    },
  ];

  if (user.role === "ADMIN") {
    navMain.push({
      title: "Dispositivos",
      url: "/devices",
      icon: <Bot className="size-4 text-emerald-500" />,
    });
    navMain.push({
      title: "Gestión Usuarios",
      url: "/users",
      icon: <ShieldCheck className="size-4 text-blue-500" />,
    });
    navMain.push({
      title: "Historial",
      url: "/history",
      icon: <HistoryIcon className="size-4 text-neutral-500" />,
    });
  }

  const userData = {
    name: user.name,
    email: user.username,
    avatar: "",
  }

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-blue-500/10 bg-sidebar"
      {...props}
    >
      <SidebarHeader className="p-4 bg-sidebar">
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      
      <SidebarContent className="px-2 bg-sidebar space-y-6">
        <div className="mt-8 px-4 mb-2 text-[8px] uppercase font-black tracking-[0.6em] text-sidebar-primary/40">
          Navegación
        </div>
        <NavMain items={navMain} />
        
        <div className="mt-8 px-4 mb-2 text-[8px] uppercase font-black tracking-[0.6em] text-sidebar-primary/40">
          Portal Público
        </div>
        <NavMain items={[
          {
            title: "Ir a la Web",
            url: "/",
            icon: <Home className="size-4 text-emerald-500" />,
          },
          {
            title: "Market Explorer",
            url: "/marketplace",
            icon: <Globe className="size-4 text-blue-500" />,
          }
        ]} />

        <div className="absolute bottom-24 left-0 w-full px-4 opacity-50 pointer-events-none flex items-center justify-between">
           <div className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase">Bot Orchestrator</div>
           <div className="text-[9px] font-mono tracking-widest text-blue-500/80 uppercase font-bold">v{CURRENT_VERSION}</div>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-blue-500/10 bg-sidebar">
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail className="bg-sidebar" />
    </Sidebar>
  )
}

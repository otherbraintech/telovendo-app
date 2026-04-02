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
  Frame, 
  Bot, 
  Settings2,
  PackageSearch,
  Zap,
  Box,
  Cpu,
  History,
  ShieldCheck
} from "lucide-react"

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
        plan: "Unidad Activa",
        id: p.id
      }))
    : [{
        name: "Sistema Vacío",
        logo: <img src="/iconTeloVendo.svg" className="size-4 opacity-50 grayscale" />,
        plan: "Inicia Secuencia",
        id: "none"
      }];

  const navMain = [
    {
      title: "Resumen",
      url: "/dashboard",
      icon: <LayoutDashboard className="size-4 text-blue-600" />,
      isActive: true,
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
      title: "Historial",
      url: "/history",
      icon: <History className="size-4 text-neutral-500" />,
    },
    {
      title: "Configuración",
      url: "/settings",
      icon: <Settings2 className="size-4 text-neutral-400" />,
    },
  ]

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
        
        <div className="absolute bottom-24 left-0 w-full px-4 opacity-20 pointer-events-none">
           <div className="text-[10px] font-mono tracking-widest uppercase">System V1.0</div>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-blue-500/10 bg-sidebar">
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail className="bg-sidebar" />
    </Sidebar>
  )
}

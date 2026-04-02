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
        logo: <Box className="size-4 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]" />,
        plan: "Unidad Activa",
        id: p.id
      }))
    : [{
        name: "Sistema Vacío",
        logo: <PackageSearch className="size-4 text-blue-900" />,
        plan: "Inicia Secuencia",
        id: "none"
      }];

  const navMain = [
    {
      title: "Resumen",
      url: "/dashboard",
      icon: <LayoutDashboard className="size-4 text-blue-500" />,
      isActive: true,
    },
    {
      title: "Publicar",
      url: "#",
      icon: <Zap className="size-4 text-amber-500" />,
      items: [
        {
          title: "Crear publicación",
          url: "/marketplace-bot",
        },
        {
          title: "Mis publicaciones",
          url: "/orders",
        },
      ],
    },
    {
      title: "Mi cuenta",
      url: "#",
      icon: <Cpu className="size-4 text-cyan-500" />,
      items: [
        {
          title: "Mis proyectos",
          url: "/projects",
        },
        {
          title: "Historial",
          url: "/history",
        },
      ],
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
      
      <SidebarContent className="px-2 bg-sidebar">
        <div className="mt-8 px-4 mb-4 text-[8px] uppercase font-black tracking-[0.6em] text-blue-500/30">
          Menú principal
        </div>
        <NavMain items={navMain} />
        
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-blue-500/10 bg-sidebar">
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail className="bg-sidebar" />
    </Sidebar>
  )
}

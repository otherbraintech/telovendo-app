"use client"

import * as React from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react"

import { useProjectStore } from "@/hooks/use-project-store"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string
    logo: React.ReactNode
    plan: string
    id: string
  }[]
}) {
  const { isMobile } = useSidebar()
  const { selectedProjectId, setSelectedProjectId } = useProjectStore()
  const router = useRouter()
  
  // Set default project if none selected
  useEffect(() => {
    if (!selectedProjectId && teams.length > 0 && teams[0].id !== "none") {
      setSelectedProjectId(teams[0].id)
    }
  }, [teams, selectedProjectId, setSelectedProjectId])

  const activeTeam = teams.find(t => t.id === selectedProjectId) || teams[0]

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="bg-card border border-border hover:border-blue-500/40 hover:bg-muted transition-all duration-500 shadow-sm"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-none bg-blue-500 text-white font-black italic shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                {activeTeam.logo}
              </div>
              <div className="grid flex-1 text-left text-[10px] leading-tight uppercase font-black tracking-widest text-foreground/80 transition-colors">
                <span className="truncate">{activeTeam.name}</span>
                <span className="truncate text-[8px] text-muted-foreground/40 group-hover:text-blue-500 transition-colors">{activeTeam.plan}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-3 text-muted-foreground/20" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-none bg-card border-border text-foreground shadow-xl"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-[9px] uppercase font-black tracking-[0.4em] text-blue-500 px-3 py-3 border-b border-border mb-1">
              Seleccionar Unidad
            </DropdownMenuLabel>
            {teams.map((team) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => setSelectedProjectId(team.id)}
                className="gap-3 p-3 focus:bg-blue-500 focus:text-white cursor-pointer group rounded-none border-b border-border/5 last:border-0"
              >
                <div className="flex size-6 items-center justify-center border border-border group-focus:border-white/30 transition-colors">
                  {team.logo}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest">{team.name}</span>
                  <span className="text-[8px] opacity-40 uppercase tracking-tighter">{team.plan}</span>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem 
              className="gap-3 p-3 focus:bg-blue-400 focus:text-white cursor-pointer rounded-none group"
              onClick={() => router.push("/projects?new=true")}
            >
              <div className="flex size-6 items-center justify-center border border-border group-focus:border-white/30 bg-muted">
                <PlusIcon className="size-3" />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest">Nuevo Proyecto</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

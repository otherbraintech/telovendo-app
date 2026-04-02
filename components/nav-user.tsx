"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronsUpDownIcon, LogOutIcon, User, Settings, Bell, Loader2, AlertTriangle } from "lucide-react"
import { useState } from "react"
import { logout } from "@/lib/actions/auth"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  } 
}) {
  const { isMobile } = useSidebar()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logout()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setShowLogoutConfirm(false)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-300 group rounded-none border-t border-sidebar-border/50"
            >
              <Avatar className="h-8 w-8 rounded-none border border-border group-hover:border-blue-500/50 transition-colors">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-none bg-transparent">
                  <img src="/iconTeloVendo.svg" alt="Bot Icon" className="size-4 opacity-80 backdrop-brightness-110 dark:invert dark:brightness-125" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-[10px] leading-tight uppercase font-black tracking-widest text-foreground/70">
                <span className="truncate">{user.name}</span>
                <span className="truncate text-[8px] text-muted-foreground/40 font-mono tracking-tighter">{user.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-3 text-muted-foreground/20" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-none bg-sidebar border-sidebar-border text-sidebar-foreground shadow-2xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-4 text-left text-sm bg-sidebar-accent/30 border-b border-sidebar-border/50 translate-items-all duration-300">
                <Avatar className="h-8 w-8 rounded-none border border-sidebar-border group-hover:border-blue-500/30">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-none bg-transparent">
                    <img src="/iconTeloVendo.svg" alt="Bot Icon" className="size-4 backdrop-brightness-110 dark:invert dark:brightness-125" />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-[10px] leading-tight uppercase font-black tracking-widest text-sidebar-foreground">
                  <span className="truncate font-black">{user.name}</span>
                  <span className="truncate text-[8px] text-muted-foreground/60 font-mono">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="gap-3 p-3 focus:bg-sidebar-accent focus:text-sidebar-accent-foreground cursor-pointer rounded-none border-b border-sidebar-border/5">
                <Link href="/profile" className="flex items-center gap-3 w-full">
                  <User className="size-3" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Perfil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="gap-3 p-3 focus:bg-sidebar-accent focus:text-sidebar-accent-foreground cursor-pointer rounded-none border-b border-sidebar-border/5">
                <Link href="/settings" className="flex items-center gap-3 w-full">
                  <Settings className="size-3" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Configuración</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="gap-3 p-3 focus:bg-sidebar-accent focus:text-sidebar-accent-foreground cursor-pointer rounded-none">
                <Link href="/notifications" className="flex items-center gap-3 w-full">
                  <Bell className="size-3" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Notificaciones</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-blue-500/10" />
            <DropdownMenuItem 
              className="gap-3 p-3 focus:bg-red-500 focus:text-white cursor-pointer rounded-none"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <LogOutIcon className="size-3" />
              <span className="text-[9px] font-black uppercase tracking-widest">Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutConfirm(false) }}
        >
          <div className="w-full max-w-sm bg-card border border-border p-8 space-y-6 shadow-2xl relative">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-3 bg-red-500/10 text-red-500 rounded-none border border-red-500/20">
                <AlertTriangle className="size-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-black uppercase tracking-tight text-foreground">¿Cerrar Sesión?</h2>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Tu sesión actual terminará y deberás volver a ingresar tus credenciales.</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 h-11 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                full-width="true"
                onClick={handleLogout}
                disabled={loading}
                className="flex-[2] h-11 bg-red-600 hover:bg-neutral-900 disabled:opacity-30 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer border border-red-500/50 hover:border-white/20"
              >
                {loading ? <Loader2 className="size-4 animate-spin text-white" /> : "TERMINAR SESIÓN"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarMenu>
  )
}

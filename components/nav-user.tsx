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
              <DropdownMenuItem asChild className="gap-3 p-3 focus:bg-sidebar-accent focus:text-sidebar-accent-foreground cursor-pointer rounded-none">
                <Link href="/profile" className="flex items-center gap-3 w-full">
                  <User className="size-3" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Perfil</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-blue-500/10" />
            <form action={logout}>
              <DropdownMenuItem 
                asChild
                className="gap-3 p-3 focus:bg-red-500 focus:text-white cursor-pointer rounded-none"
              >
                <button type="submit" className="flex items-center gap-3 w-full border-none bg-transparent p-0">
                  <LogOutIcon className="size-3" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Cerrar sesión</span>
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
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
import { ChevronsUpDownIcon, LogOutIcon, User, Settings, Bell } from "lucide-react"

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

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="bg-card border border-border hover:border-blue-500/30 hover:bg-muted transition-all duration-500 group shadow-sm"
            >
              <Avatar className="h-8 w-8 rounded-none border border-border group-hover:border-blue-500/50 transition-colors">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-none bg-blue-500 text-white font-black text-[10px]">
                  {user.name.slice(0, 2).toUpperCase()}
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
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-none bg-card border-border text-foreground shadow-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-4 text-left text-sm bg-muted/50">
                <Avatar className="h-8 w-8 rounded-none border border-border">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-none bg-blue-500 text-white font-black text-[10px]">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-[10px] leading-tight uppercase font-black tracking-widest">
                  <span className="truncate text-foreground font-black">{user.name}</span>
                  <span className="truncate text-[8px] text-muted-foreground font-mono">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuGroup>
              <DropdownMenuItem className="gap-3 p-3 focus:bg-blue-500 focus:text-black cursor-pointer rounded-none">
                <User className="size-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 p-3 focus:bg-blue-500 focus:text-black cursor-pointer rounded-none">
                <Settings className="size-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 p-3 focus:bg-blue-500 focus:text-black cursor-pointer rounded-none">
                <Bell className="size-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Notificaciones</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-blue-500/10" />
            <DropdownMenuItem 
              className="gap-3 p-3 focus:bg-red-500 focus:text-black cursor-pointer rounded-none"
              onClick={async () => {
                const { logout } = await import("@/lib/actions/auth");
                await logout();
              }}
            >
              <LogOutIcon className="size-3" />
              <span className="text-[9px] font-black uppercase tracking-widest">Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

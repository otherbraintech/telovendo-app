"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, LogOut, User, ChevronDown } from "lucide-react";
import Link from "next/link";
import { logout } from "@/lib/actions/auth";

export function PublicUserMenu({ user }: { user: any }) {
  const initial = user.name ? user.name.charAt(0).toUpperCase() : "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 px-3 py-1.5 border border-border hover:border-blue-500/40 hover:bg-muted/30 transition-all cursor-pointer group outline-none">
          <Avatar className="h-7 w-7 rounded-none border border-border group-hover:border-blue-500 transition-colors">
            <AvatarFallback className="rounded-none bg-blue-600 text-white text-[10px] font-black">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80 hidden sm:block">
              {user.name.split(' ')[0]}
            </span>
            <ChevronDown className="size-3 text-muted-foreground group-hover:text-blue-500 transition-colors" />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 rounded-none bg-card border-border shadow-2xl animate-in zoom-in-95 duration-200" align="end" sideOffset={12}>
        <DropdownMenuLabel className="p-5 border-b border-border/50 bg-muted/20">
           <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground leading-none">{user.name}</span>
              <span className="text-[8px] font-mono font-bold text-muted-foreground opacity-50 tracking-tighter">{user.username}</span>
           </div>
        </DropdownMenuLabel>
        <div className="p-1">
          {user.role !== "ESPECTADOR" && (
            <DropdownMenuItem asChild className="p-4 focus:bg-blue-600 focus:text-white cursor-pointer rounded-none group/item">
              <Link href="/projects" className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="size-4 opacity-50 group-hover/item:opacity-100 transition-opacity" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Panel de Control</span>
                </div>
                <div className="size-1.5 rounded-full bg-blue-500 animate-pulse group-hover:bg-white" />
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild className="p-4 focus:bg-blue-600 focus:text-white cursor-pointer rounded-none group/item border-t border-border/5">
            <Link 
              href={user.role !== "ESPECTADOR" ? "/dashboard/profile" : "/profile"} 
              className="flex items-center gap-3 w-full"
            >
              <User className="size-4 opacity-50 group-hover/item:opacity-100 transition-opacity" />
              <span className="text-[10px] font-black uppercase tracking-widest">Configurar Cuenta</span>
            </Link>
          </DropdownMenuItem>
        </div>
        <DropdownMenuSeparator className="bg-border" />
        <div className="p-1">
          <form action={logout}>
            <DropdownMenuItem asChild className="p-4 focus:bg-red-600 focus:text-white cursor-pointer rounded-none group/item">
              <button type="submit" className="flex items-center gap-3 w-full text-left bg-transparent border-none p-0">
                 <LogOut className="size-4 opacity-50 group-hover/item:opacity-100 transition-opacity text-red-500 group-hover:text-white" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Finalizar Sesión</span>
              </button>
            </DropdownMenuItem>
          </form>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

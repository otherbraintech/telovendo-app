import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { getSession } from "@/lib/auth-utils"
import { getProjects } from "@/lib/actions/projects"
import { redirect } from "next/navigation"

import { ModeToggle } from "@/components/mode-toggle"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const projects = await getProjects();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground font-sans selection:bg-blue-500/30">
        <AppSidebar user={session.user} projects={projects} />
        <SidebarInset className="bg-transparent">
          <header className="flex h-14 md:h-16 shrink-0 items-center justify-between gap-2 border-b border-blue-500/10 px-4 md:px-6 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-blue-500 transition-colors" />
              <div className="h-4 w-[1px] bg-border" />
              <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 hidden sm:inline">TeloVendo</span>
            </div>
            <ModeToggle />
          </header>
          
          <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            <div className="mx-auto max-w-7xl relative animate-in fade-in slide-in-from-bottom-6 duration-700">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

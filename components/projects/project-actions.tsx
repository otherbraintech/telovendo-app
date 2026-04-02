"use client";

import { Trash2, Copy, Edit2, ArrowRight } from "lucide-react"
import { useProjectStore } from "@/hooks/use-project-store"
import { useRouter } from "next/navigation"

export function ProjectActions({ project }: { project: any }) {
  const { setSelectedProjectId } = useProjectStore()
  const router = useRouter()

  const handleSelectAndViewOrders = () => {
    setSelectedProjectId(project.id)
    router.push("/orders")
  }

  return (
    <>
      <button 
        onClick={handleSelectAndViewOrders}
        className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase text-blue-500 hover:text-blue-400 transition-colors px-2 py-1.5"
      >
        <span>Ver Publicaciones</span>
        <ArrowRight className="size-3" />
      </button>
      <div className="flex-1" />
      <button className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase text-muted-foreground/40 hover:text-blue-500 transition-colors px-2 py-1.5">
        <Edit2 className="size-3" />
      </button>
      <button className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase text-muted-foreground/40 hover:text-blue-400 transition-colors px-2 py-1.5">
        <Copy className="size-3" />
      </button>
      <button className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase text-muted-foreground/40 hover:text-red-500 transition-colors px-2 py-1.5">
        <Trash2 className="size-3" />
      </button>
    </>
  )
}

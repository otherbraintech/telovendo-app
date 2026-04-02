"use client";

import { Trash2, Copy, Edit2, ArrowRight, Loader2, FolderEdit } from "lucide-react"
import { useProjectStore } from "@/hooks/use-project-store"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { deleteProject, duplicateProject, updateProject, publishProjectOrders } from "@/lib/actions/projects"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"

export function ProjectActions({ project }: { project: any }) {
  const { setSelectedProjectId } = useProjectStore()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(project.name)
  const [loading, setLoading] = useState(false)

  const handleSelectAndViewOrders = () => {
    setSelectedProjectId(project.id)
    router.push("/orders")
  }

  const handleDelete = async () => {
    if (!confirm("¿Seguro que deseas eliminar este proyecto y todas sus publicaciones?")) return
    setLoading(true)
    try {
      await deleteProject(project.id)
      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicate = async () => {
    setLoading(true)
    try {
      await duplicateProject(project.id)
      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName) return
    setLoading(true)
    try {
      await updateProject(project.id, editName)
      setIsEditing(false)
      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handlePublishAll = async () => {
    // This function is no longer needed in the projects list view as per user request
  }



  return (
    <>
      <button 
        onClick={handleSelectAndViewOrders}
        className="flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase text-blue-500 hover:text-blue-400 transition-colors px-2 py-1.5 cursor-pointer"
      >
        <span>Ver Publicaciones</span>
        <ArrowRight className="size-3" />
      </button>

      <div className="flex-1" />

      <TooltipProvider>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center justify-center size-8 text-muted-foreground/40 hover:text-blue-500 transition-colors cursor-pointer"
              >
                <Edit2 className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-sidebar border-sidebar-border text-[10px] font-bold uppercase tracking-widest text-foreground rounded-none px-2 py-1">
              Editar
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={handleDuplicate}
                className="flex items-center justify-center size-8 text-muted-foreground/40 hover:text-blue-400 transition-colors cursor-pointer"
              >
                <Copy className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-sidebar border-sidebar-border text-[10px] font-bold uppercase tracking-widest text-foreground rounded-none px-2 py-1">
              Duplicar
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={handleDelete}
                className="flex items-center justify-center size-8 text-muted-foreground/40 hover:text-red-500 transition-colors cursor-pointer"
              >
                <Trash2 className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-sidebar border-sidebar-border text-[10px] font-bold uppercase tracking-widest text-foreground rounded-none px-2 py-1">
              Eliminar
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* EDIT MODAL */}
      {isEditing && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setIsEditing(false) }}
        >
          <div className="w-full max-w-md bg-card border border-border p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-500">
                <FolderEdit className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-foreground">Editar Proyecto</h2>
                <p className="text-xs text-muted-foreground">Modifica el nombre de tu unidad de trabajo.</p>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">
                  Nombre del proyecto
                </label>
                <input
                  autoFocus
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-background border border-border px-4 py-3 text-sm text-foreground outline-none focus:border-blue-500 transition-all rounded-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 h-11 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !editName.trim()}
                  className="flex-[2] h-11 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  )
}

"use client";

import { useState } from "react";
import { createProject } from "@/lib/actions/projects";
import { Plus, Loader2, FolderPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/hooks/use-project-store";

export function CreateProjectDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const router = useRouter();
  const { setSelectedProjectId } = useProjectStore();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    try {
      const project = await createProject(name);
      setSelectedProjectId(project.id);
      setOpen(false);
      setName("");
      router.refresh();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-11 px-6 border border-blue-500/50 hover:bg-blue-500 hover:text-white text-blue-500 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300"
      >
        <Plus className="size-4" /> Nuevo proyecto
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-md bg-card border border-border p-8 space-y-6 shadow-2xl">

            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-500">
                <FolderPlus className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-foreground">Crear proyecto</h2>
                <p className="text-xs text-muted-foreground">Agrupa tus publicaciones dentro de un proyecto.</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">
                  Nombre del proyecto
                </label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej: Ropa dama 2026"
                  className="w-full bg-background border border-border px-4 py-3 text-sm text-foreground outline-none focus:border-blue-500 transition-all placeholder:text-muted-foreground/40 rounded-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 h-11 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex-[2] h-11 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Crear proyecto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

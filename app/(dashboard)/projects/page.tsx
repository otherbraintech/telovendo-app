import { getProjects } from "@/lib/actions/projects"
import { Trash2, Copy, Edit2, Search, Box } from "lucide-react"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { ProjectActions } from "@/components/projects/project-actions"

export default async function ProjectsPage() {
  const projects = await getProjects()

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground">
            Mis <span className="text-blue-500">Proyectos</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            {projects.length > 0
              ? `Tienes ${projects.length} proyecto${projects.length > 1 ? "s" : ""} activo${projects.length > 1 ? "s" : ""}.`
              : "Aún no tienes proyectos. ¡Crea uno para empezar!"}
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {/* Grilla de proyectos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {projects.map((project: any) => (
          <div key={project.id} className="group relative bg-card border border-border p-6 md:p-8 flex flex-col justify-between hover:border-blue-500/40 transition-all duration-500 overflow-hidden min-h-[220px] shadow-sm">

            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform duration-1000">
              <Box className="size-24 text-blue-500" />
            </div>

            <div className="relative z-10">
              <div className="h-0.5 w-10 bg-blue-500 mb-5 group-hover:w-16 transition-all duration-700" />
              <h3 className="text-lg font-black uppercase italic tracking-tight text-foreground group-hover:text-blue-500 transition-colors mb-2">
                {project.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                Creado el {project.createdAt.toLocaleDateString("es-BO")}
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-2 border-t border-border pt-5 mt-5">
              <ProjectActions project={project} />
            </div>

          </div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full h-64 border border-dashed border-border flex flex-col items-center justify-center gap-4 text-center p-8">
            <Search className="size-10 text-muted-foreground/20" />
            <div>
              <p className="text-sm font-bold text-muted-foreground">Ningún proyecto aún</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Crea tu primer proyecto para empezar a publicar.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


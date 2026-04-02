"use client";

import { useProjectStore } from "@/hooks/use-project-store"
import { Bot, Send, ImagePlus, Loader2, CheckCircle2 } from "lucide-react"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { useState } from "react"
import { createBotOrder } from "@/lib/actions/orders"
import { useRouter } from "next/navigation"

export default function MarketplaceBotPage() {
  const { selectedProjectId } = useProjectStore()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedProjectId) return

    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      const listingTitle = formData.get("listingTitle") as string
      const listingPrice = parseFloat(formData.get("listingPrice") as string) || 0
      const listingCategory = formData.get("listingCategory") as any
      const listingCondition = formData.get("listingCondition") as any
      const listingDescription = formData.get("listingDescription") as string
      const quantity = parseInt(formData.get("quantity") as string) || 1

      // 1. Upload files first
      const uploadedUrls: string[] = []
      const token = process.env.NEXT_PUBLIC_UPLOAD_TOKEN

      if (!token) {
        throw new Error("Missing upload token")
      }

      for (const file of selectedFiles) {
         const reader = new FileReader()
         const base64Promise = new Promise<string>((resolve, reject) => {
           reader.onload = () => {
             const result = reader.result as string
             // Remove data URL prefix
             resolve(result.split(',')[1])
           }
           reader.onerror = error => reject(error)
         })
         
         reader.readAsDataURL(file)
         const base64Data = await base64Promise

         const response = await fetch("https://otherbrain-tech-ob-files-oficial.ddt6vc.easypanel.host/api/upload", {
           method: "POST",
           headers: {
             "content-type": "application/json"
           },
           body: JSON.stringify({
             token_project: token,
             filename: `${selectedProjectId}_${Date.now()}_${file.name}`,
             file: base64Data,
             mimeType: file.type
           })
         })

         if (!response.ok) {
           throw new Error("Error uploading image")
         }

         const data = await response.json()
         if (data.success && data.url) {
           uploadedUrls.push(data.url)
         }
      }

      // 2. Create Order
      await createBotOrder({ 
        projectId: selectedProjectId, 
        orderName: listingTitle, 
        listingTitle,
        listingPrice,
        listingCategory,
        listingCondition,
        listingDescription,
        listingAvailability: "DISPONIBLE",
        quantity,
        imageUrls: uploadedUrls,
      })
      
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        router.push("/orders")
      }, 2000)
    } catch (error) {
       console.error("Error submitting form", error)
       alert("Error: " + (error as any).message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4 animate-in zoom-in duration-500">
        <div className="size-20 bg-green-500 flex items-center justify-center text-white shadow-[0_0_40px_rgba(34,197,94,0.3)]">
          <CheckCircle2 className="size-10" />
        </div>
        <h2 className="text-2xl font-black uppercase text-foreground tracking-widest">¡Publicación enviada!</h2>
        <p className="text-sm text-muted-foreground">El bot ya está trabajando en tu publicación...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">

      {/* Título */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground">
          Crear una <span className="text-blue-500">Publicación</span>
        </h1>
        <p className="text-xs text-muted-foreground">
          Completa los datos como en Facebook Marketplace. Nosotros nos encargamos de publicarlo.
        </p>
      </div>

      {/* Sin proyecto seleccionado */}
      {!selectedProjectId && (
        <div className="p-8 border border-dashed border-blue-500/20 bg-blue-500/5 flex flex-col items-center justify-center gap-5 text-center">
          <div className="space-y-1">
            <p className="text-sm font-black text-blue-500">Primero elige un proyecto</p>
            <p className="text-xs text-muted-foreground">Debes tener un proyecto activo antes de crear una publicación.</p>
          </div>
          <CreateProjectDialog />
        </div>
      )}

      <form onSubmit={handleSubmit} className={`space-y-8 ${!selectedProjectId ? 'opacity-30 pointer-events-none' : ''}`}>
        
        {/* Sección de Fotos */}
        <div className="bg-card border border-border p-6 shadow-sm space-y-4">
           <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Fotos</h3>
           
           <label className="border-2 border-dashed border-border hover:border-blue-500/50 transition-colors p-10 flex flex-col items-center justify-center gap-3 text-center cursor-pointer bg-muted/30">
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
              <div className="p-4 bg-muted rounded-full">
                 <ImagePlus className="size-8 text-blue-500" />
              </div>
              <div>
                 <p className="text-sm font-bold text-foreground">
                   {selectedFiles.length > 0 ? `${selectedFiles.length} imagen(es) seleccionada(s)` : "Agregar fotos"}
                 </p>
                 <p className="text-xs text-muted-foreground">Arrastra y suelta o haz clic para subir</p>
              </div>
           </label>
           
           {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-4">
                {selectedFiles.map((f, i) => (
                   <div key={i} className="relative size-24 border border-border bg-black/5 overflow-hidden group/thumb">
                     <img 
                       src={URL.createObjectURL(f)} 
                       alt={f.name} 
                       className="w-full h-full object-cover" 
                     />
                     <div className="absolute inset-x-0 bottom-0 bg-black/70 backdrop-blur text-[8px] text-white p-1 truncate text-center">
                       {f.name}
                     </div>
                   </div>
                ))}
              </div>
           )}
        </div>

        {/* Detalles del producto */}
        <div className="bg-card border border-border p-6 shadow-sm space-y-6">
           <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Detalles del artículo</h3>
           
           <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Título</label>
                <input
                  required
                  name="listingTitle"
                  type="text"
                  placeholder="Ej: Limpiador de Carbonilla Premium"
                  className="w-full bg-background border border-border px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all text-foreground placeholder:text-muted-foreground/30"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground">Precio</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">Bs</span>
                    <input
                      required
                      name="listingPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="w-full bg-background border border-border pl-10 pr-4 py-3 text-sm focus:border-blue-500 outline-none transition-all text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground">Categoría</label>
                  <select
                    name="listingCategory"
                    defaultValue="VARIOS"
                    className="w-full bg-background border border-border px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all text-foreground appearance-none cursor-pointer"
                  >
                    <option value="VARIOS">Varios (Carbonilla, etc.)</option>
                    <option value="ELECTRONICA">Electrónica</option>
                    <option value="VEHICULOS">Vehículos</option>
                    <option value="ROPA_Y_ACCESORIOS">Ropa y Accesorios</option>
                    <option value="HOGAR_Y_JARDIN">Hogar y Jardín</option>
                    <option value="MUEBLES">Muebles</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Estado</label>
                <select
                  name="listingCondition"
                  defaultValue="NUEVO"
                  className="w-full bg-background border border-border px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all text-foreground appearance-none cursor-pointer"
                >
                  <option value="NUEVO">Nuevo</option>
                  <option value="USADO_COMO_NUEVO">Usado - Como nuevo</option>
                  <option value="USADO_BUENO">Usado - Buen estado</option>
                  <option value="USADO_REGULAR">Usado - Aceptable</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Descripción</label>
                <textarea
                  required
                  name="listingDescription"
                  rows={5}
                  placeholder="Describe tu artículo detalladamente..."
                  className="w-full bg-background border border-border px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all text-foreground placeholder:text-muted-foreground/30 resize-none"
                />
              </div>

              <div className="bg-muted px-4 py-6 border border-border space-y-4">
                 <div className="flex items-center gap-3 text-blue-500 mb-2">
                    <Bot className="size-5" />
                    <span className="text-sm font-bold uppercase tracking-widest text-foreground">Configuración del Bot</span>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground">¿Cuántos bots publicarán esto?</label>
                    <input
                      required
                      name="quantity"
                      type="number"
                      min={1}
                      max={100}
                      defaultValue={1}
                      className="w-full md:w-1/3 bg-background border border-border px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all text-foreground"
                    />
                    <p className="text-[10px] text-muted-foreground/60 italic">
                      Se asignará esta cantidad de bots de la red para abarcar más alcance.
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Panel Inferior y Botón */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-card border border-border p-6 shadow-sm">
           <div className="text-xs text-muted-foreground text-center md:text-left">
              Verifica los campos antes de enviar. El bot actuará rápidamente.
           </div>
           <button
             type="submit"
             disabled={loading || !selectedProjectId}
             className="w-full md:w-auto px-10 h-12 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300"
           >
             {loading
               ? <Loader2 className="size-4 animate-spin" />
               : <><Send className="size-4" /> Enviar Publicación</>
             }
           </button>
        </div>

      </form>
    </div>
  )
}

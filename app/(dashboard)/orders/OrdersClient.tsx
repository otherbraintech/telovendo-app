"use client";

import { useProjectStore } from "@/hooks/use-project-store"
import { Search, Filter, ArrowUpRight, ShoppingBag, Loader2, ImagePlus } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { getOrdersByProject, updateBotOrder, sendOrderToBots, createBotOrder, cancelBotOrder, deleteBotOrder } from "@/lib/actions/orders"
import { MoreVertical, Copy, XCircle, Trash2, Edit } from "lucide-react"

export default function OrdersClient() {
  const { selectedProjectId } = useProjectStore()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [editSelectedFiles, setEditSelectedFiles] = useState<File[]>([])
  const [filter, setFilter] = useState("TODAS")
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const filteredOrders = filter === "TODAS" ? orders : orders.filter(o => o.status === filter)

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEditSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      let newImageUrls: string[] | undefined = undefined;
      
      // Subir fotos nuevas si seleccionó
      if (editSelectedFiles.length > 0) {
         newImageUrls = []
         const token = process.env.NEXT_PUBLIC_UPLOAD_TOKEN;
         if (!token) throw new Error("Missing upload token");

         for (const file of editSelectedFiles) {
            const reader = new FileReader()
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve((reader.result as string).split(',')[1])
              reader.onerror = error => reject(error)
            })
            reader.readAsDataURL(file)
            const base64Data = await base64Promise

            const response = await fetch("https://otherbrain-tech-ob-files-oficial.ddt6vc.easypanel.host/api/upload", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                token_project: token,
                filename: `edit_${selectedOrder.id}_${Date.now()}_${file.name}`,
                file: base64Data,
                mimeType: file.type
              })
            })

            const data = await response.json()
            if (data.success && data.url) newImageUrls.push(data.url)
         }
      }

      const updated = await updateBotOrder(selectedOrder.id, {
        listingTitle: editForm.listingTitle,
        listingPrice: Number(editForm.listingPrice),
        listingCondition: editForm.listingCondition,
        listingCategory: editForm.listingCategory,
        listingDescription: editForm.listingDescription,
        ...(newImageUrls && newImageUrls.length > 0 ? { imageUrls: newImageUrls } : {})
      })
      
      setOrders(orders.map(o => o.id === selectedOrder.id ? updated : o))
      setSelectedOrder(updated)
      setIsEditing(false)
      setActiveImageIndex(0)
      setEditSelectedFiles([])
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async () => {
    if (!editForm.listingTitle) return alert("El título es obligatorio");
    try {
      setSaving(true)
      
      let newImageUrls: string[] = [];
      if (editSelectedFiles.length > 0) {
         const token = process.env.NEXT_PUBLIC_UPLOAD_TOKEN;
         if (!token) throw new Error("Missing upload token");

         for (const file of editSelectedFiles) {
            const reader = new FileReader()
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve((reader.result as string).split(',')[1])
              reader.onerror = error => reject(error)
            })
            reader.readAsDataURL(file)
            const base64Data = await base64Promise

            const response = await fetch("https://otherbrain-tech-ob-files-oficial.ddt6vc.easypanel.host/api/upload", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                token_project: token,
                filename: `new_${selectedProjectId}_${Date.now()}_${file.name}`,
                file: base64Data,
                mimeType: file.type
              })
            })

            const data = await response.json()
            if (data.success && data.url) newImageUrls.push(data.url)
         }
      }

      const created = await createBotOrder({
        projectId: selectedProjectId!,
        orderName: editForm.listingTitle,
        listingTitle: editForm.listingTitle,
        listingPrice: Number(editForm.listingPrice) || 0,
        listingCondition: editForm.listingCondition || "NUEVO",
        listingCategory: editForm.listingCategory || "OTROS",
        listingDescription: editForm.listingDescription || "",
        listingAvailability: "DISPONIBLE",
        quantity: Number(editForm.quantity) || 1,
        imageUrls: newImageUrls
      })
      
      setOrders([created, ...orders])
      setIsCreating(false)
      setEditForm({})
      setEditSelectedFiles([])
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleSendToBots = async () => {
    try {
      setSaving(true)
      const updated = await sendOrderToBots(selectedOrder.id)
      setOrders(orders.map(o => o.id === selectedOrder.id ? updated : o))
      setSelectedOrder(updated)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const inlineSendToBots = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation()
    try {
      setSaving(true)
      const updated = await sendOrderToBots(orderId)
      setOrders(orders.map(o => o.id === orderId ? updated : o))
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleDuplicate = async (e: React.MouseEvent, order: any) => {
    e.stopPropagation()
    setMenuOpenId(null)
    setSaving(true)
    try {
      const duplicated = await createBotOrder({
        projectId: order.projectId,
        orderName: order.orderName + " (Copia)",
        listingTitle: order.listingTitle,
        listingPrice: Number(order.listingPrice) || 0,
        listingCategory: order.listingCategory,
        listingCondition: order.listingCondition,
        listingDescription: order.listingDescription,
        listingAvailability: order.listingAvailability || "DISPONIBLE",
        quantity: order.quantity || 1,
        imageUrls: order.imageUrls || []
      })
      setOrders([duplicated, ...orders])
      setSelectedOrder(duplicated)
      setEditForm({
        listingTitle: duplicated.listingTitle || duplicated.orderName,
        listingPrice: duplicated.listingPrice,
        listingCondition: duplicated.listingCondition,
        listingCategory: duplicated.listingCategory,
        listingDescription: duplicated.listingDescription
      })
      setIsEditing(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation()
    setMenuOpenId(null)
    setSaving(true)
    try {
      const updated = await cancelBotOrder(orderId)
      setOrders(orders.map(o => o.id === orderId ? updated : o))
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation()
    setMenuOpenId(null)
    if (!confirm("¿Seguro que deseas eliminar esta publicación permanentemente?")) return
    setSaving(true)
    try {
      await deleteBotOrder(orderId)
      setOrders(orders.filter(o => o.id !== orderId))
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (selectedProjectId) {
      setLoading(true)
      getOrdersByProject(selectedProjectId).then(data => {
        setOrders(data)
        setLoading(false)
      })
    } else {
      setOrders([])
    }
  }, [selectedProjectId])

  const statusLabel: Record<string, string> = {
    LISTA: "Pendiente",
    GENERANDO: "Publicando...",
    GENERADA: "Publicada",
    COMPLETADA: "Completada",
    CANCELADA: "Cancelada",
    PAUSADA: "Pausada",
    REINTENTAR: "Reintentando",
    FALLIDA: "Falló",
  }

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground">
            Mis <span className="text-blue-500">Publicaciones</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            {selectedProjectId
              ? "Aquí puedes ver el estado de todas tus publicaciones."
              : "Selecciona un proyecto para ver sus publicaciones."}
          </p>
        </div>

        {selectedProjectId && (
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => {
                setEditForm({ listingCategory: "OTROS", listingCondition: "NUEVO", quantity: 1 });
                setEditSelectedFiles([]);
                setIsCreating(true);
              }}
              className="h-9 px-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              + Nueva
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar publicación..."
                className="w-48 sm:w-56 bg-card border border-border px-4 py-2 pl-9 text-xs focus:border-blue-500 outline-none text-foreground placeholder:text-muted-foreground/50 rounded-none"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground z-10" />
              <select 
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="h-9 w-40 sm:w-48 bg-card border border-border px-4 py-2 pl-9 text-xs focus:border-blue-500 outline-none text-foreground appearance-none cursor-pointer"
              >
                <option value="TODAS">TODAS</option>
                <option value="LISTA">PENDIENTES</option>
                <option value="GENERANDO">PUBLICANDO</option>
                <option value="GENERADA">COMPLETADAS</option>
                <option value="CANCELADA">CANCELADAS</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Sin proyecto */}
      {!selectedProjectId ? (
        <div className="h-64 border border-dashed border-border flex flex-col items-center justify-center gap-4 text-center p-8">
          <ShoppingBag className="size-10 text-muted-foreground/20" />
          <div>
            <p className="text-sm font-bold text-muted-foreground">Ningún proyecto seleccionado</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Elige un proyecto desde el menú lateral para ver sus publicaciones.</p>
          </div>
        </div>
      ) : loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="size-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOrders.map((order) => (
            <div 
              key={order.id} 
              onClick={() => { setSelectedOrder(order); setActiveImageIndex(0); }}
              className="group/card relative bg-card border border-border flex flex-col overflow-hidden hover:border-blue-500/40 transition-all duration-300 shadow-sm cursor-pointer"
            >
              
              {/* Product Image / Placeholder */}
              <div className="relative aspect-square bg-muted/20 border-b border-border overflow-hidden">
                {order.imageUrls && order.imageUrls.length > 0 ? (
                  <img 
                    src={order.imageUrls[0]} 
                    alt={order.orderName} 
                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                    <ShoppingBag className="size-16 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                )}

                {/* Status Badge Overlaid on Image */}
                <div className="absolute top-2 left-2 z-10">
                  {order.status === "GENERANDO" ? (
                     <div className="flex items-center gap-2 bg-blue-500/90 backdrop-blur-md px-2 py-0.5 rounded shadow">
                        <div className="size-1.5 bg-white rounded-full animate-pulse"></div>
                        <span className="text-white text-[9px] font-black uppercase tracking-wider">
                          Publicando...
                        </span>
                     </div>
                  ) : order.status === "CANCELADA" ? (
                     <span className="block px-2 py-0.5 rounded bg-red-500/90 backdrop-blur-md shadow text-white text-[9px] font-black uppercase tracking-wider">
                       {statusLabel[order.status] ?? order.status}
                     </span>
                  ) : order.status === "LISTA" ? (
                     <span className="block px-2 py-0.5 rounded bg-amber-500/90 backdrop-blur-md shadow text-white text-[9px] font-black uppercase tracking-wider">
                       {statusLabel[order.status] ?? order.status}
                     </span>
                  ) : (
                     <span className="block px-2 py-0.5 rounded bg-green-500/90 backdrop-blur-md shadow text-white text-[9px] font-black uppercase tracking-wider">
                       {statusLabel[order.status] ?? order.status}
                     </span>
                  )}
                </div>
              </div>

              {/* Progress Bar (Visible only when GENERANDO) */}
              {order.status === "GENERANDO" && (
                <div className="h-0.5 w-full bg-blue-500/10">
                   <div className="h-full bg-blue-500 animate-[progress_2s_ease-in-out_infinite]" style={{ width: '45%' }}></div>
                </div>
              )}

              {/* Card Details - FB Marketplace Style */}
              <div className="p-3 flex flex-col flex-1 gap-1">
                <div className="text-lg font-black text-foreground">
                  Bs {order.listingPrice?.toString() || "0"}
                </div>
                <h3 className="text-sm font-semibold text-foreground/90 line-clamp-1 leading-tight group-hover:underline decoration-blue-500/50 underline-offset-4 decoration-2">
                  {order.listingTitle || order.orderName}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 whitespace-pre-wrap">
                  {order.listingDescription || "Sin descripción detallada."}
                </p>
                <div className="text-[9px] mt-2 text-muted-foreground/40 font-mono uppercase tracking-widest flex items-center justify-between">
                  <span>{order.socialNetwork}</span>
                  {order.status === "LISTA" && (
                    <button 
                      onClick={(e) => inlineSendToBots(e, order.id)}
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded shadow shadow-blue-500/20 transition-all font-bold tracking-widest flex items-center gap-1"
                    >
                      {saving && <Loader2 className="size-2 animate-spin"/>}
                      🚀 ENVIAR
                    </button>
                  )}
                </div>
              </div>

              {/* More Options Menu */}
              <div className="absolute top-2 right-2 z-20">
                <button 
                  onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === order.id ? null : order.id); }}
                  className={`size-8 rounded-full flex items-center justify-center bg-black/50 text-white backdrop-blur-md transition-all ${menuOpenId === order.id ? 'opacity-100 bg-blue-600' : 'opacity-0 group-hover/card:opacity-100 hover:bg-black/80'}`}
                >
                  <MoreVertical className="size-4" />
                </button>

                {menuOpenId === order.id && (
                  <div className="absolute top-10 right-0 w-48 bg-card border border-border shadow-xl rounded overflow-hidden flex flex-col z-30 animate-in zoom-in-95 duration-200">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setMenuOpenId(null); 
                        setSelectedOrder(order);
                        setActiveImageIndex(0); 
                        setEditForm({
                           listingTitle: order.listingTitle || order.orderName,
                           listingPrice: order.listingPrice,
                           listingCondition: order.listingCondition,
                           listingCategory: order.listingCategory,
                           listingDescription: order.listingDescription
                         });
                        setIsEditing(true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 hover:bg-muted font-bold text-foreground transition-colors"
                    >
                      <Edit className="size-3" /> Editar rapido
                    </button>
                    <button 
                      onClick={(e) => handleDuplicate(e, order)}
                      className="w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 hover:bg-muted font-bold text-blue-500 transition-colors"
                    >
                      <Copy className="size-3" /> Duplicar Orden
                    </button>
                    {order.status !== "CANCELADA" && (
                      <button 
                        onClick={(e) => handleCancel(e, order.id)}
                        className="w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 hover:bg-muted font-bold text-amber-500 transition-colors border-t border-border"
                      >
                        <XCircle className="size-3" /> Cancelar
                      </button>
                    )}
                    <button 
                      onClick={(e) => handleDelete(e, order.id)}
                      className="w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 hover:bg-red-500/10 font-bold text-red-500 transition-colors"
                    >
                      <Trash2 className="size-3" /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="col-span-full py-16 text-center text-sm text-muted-foreground border border-dashed border-border bg-card">
              Aún no tienes publicaciones en este proyecto.
            </div>
          )}
        </div>
      )}

      {/* CREATION MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md border border-border overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
             
             <div className="w-full aspect-video bg-muted relative">
                {editSelectedFiles.length > 0 ? (
                  <img src={URL.createObjectURL(editSelectedFiles[0])} alt="Preview" className="w-full h-full object-contain bg-black/5" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                    <ShoppingBag className="size-16" />
                  </div>
                )}
                
                {editSelectedFiles.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded shadow backdrop-blur-md">
                    +{editSelectedFiles.length - 1} fotos
                  </div>
                )}

                <button 
                  onClick={() => setIsCreating(false)}
                  className="absolute top-3 right-3 bg-black/50 text-white hover:bg-black/80 size-8 flex items-center justify-center rounded-full transition-colors backdrop-blur-md cursor-pointer z-10"
                >
                  ✕
                </button>
             </div>

             <div className="p-6">
                <div className="space-y-4 animate-in fade-in duration-300">
                   <div className="flex bg-muted/30 -mx-6 -mt-6 p-4 mb-4 items-center justify-between border-b border-border">
                     <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Crear Publicación</h3>
                   </div>

                   <div className="space-y-3 h-[50vh] overflow-y-auto px-1 custom-scrollbar">
                     <label className="border-2 border-dashed border-border hover:border-blue-500/50 transition-colors p-4 flex flex-col items-center justify-center gap-2 text-center cursor-pointer bg-muted/30">
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleEditFileChange} />
                        <ImagePlus className="size-6 text-blue-500" />
                        <div>
                           <p className="text-[10px] font-bold text-foreground">
                             {editSelectedFiles.length > 0 ? `${editSelectedFiles.length} foto(s) seleccionada(s)` : "Añadir Fotos"}
                           </p>
                        </div>
                     </label>

                     <input 
                       name="listingTitle"
                       value={editForm.listingTitle || ""} 
                       onChange={handleEditChange} 
                       className="w-full bg-card border border-border px-3 py-2 text-sm focus:border-blue-500 outline-none font-bold" 
                       placeholder="Título de la publicación..." 
                     />
                     <div className="flex relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-bold">Bs</span>
                       <input 
                         type="number"
                         name="listingPrice"
                         value={editForm.listingPrice || ""} 
                         onChange={handleEditChange} 
                         className="w-full bg-card border border-border px-3 py-2 pl-9 text-sm focus:border-blue-500 outline-none" 
                         placeholder="0.00" 
                       />
                     </div>
                     
                     <div className="grid grid-cols-2 gap-3">
                        <select 
                           name="listingCategory"
                           value={editForm.listingCategory} 
                           onChange={handleEditChange} 
                           className="w-full bg-card border border-border px-3 py-2 text-sm focus:border-blue-500 outline-none text-foreground uppercase text-[10px] tracking-widest appearance-none cursor-pointer" 
                        >
                           <option value="ELECTRONICA">Electrónica</option>
                           <option value="MUEBLES">Muebles</option>
                           <option value="ROPA_CALZADO">Ropa y Calzado</option>
                           <option value="VEHICULOS">Vehículos</option>
                           <option value="BIENES_RAICES">Bienes Raíces</option>
                           <option value="JUGUETES_JUEGOS">Juguetes y Juegos</option>
                           <option value="ARTICULOS_HOGAR">Artículos para el Hogar</option>
                           <option value="DEPORTES_FITNESS">Deportes y Fitness</option>
                           <option value="HERRAMIENTAS">Herramientas</option>
                           <option value="INSTRUMENTOS_MUSICALES">Instrumentos Musicales</option>
                           <option value="OTROS">Otros</option>
                        </select>
                        <select 
                           name="listingCondition"
                           value={editForm.listingCondition} 
                           onChange={handleEditChange} 
                           className="w-full bg-card border border-border px-3 py-2 text-sm focus:border-blue-500 outline-none text-foreground uppercase text-[10px] tracking-widest appearance-none cursor-pointer" 
                        >
                           <option value="NUEVO">Nuevo</option>
                           <option value="USADO_COMO_NUEVO">Usado - Como nuevo</option>
                           <option value="USADO_BUEN_ESTADO">Usado - Buen estado</option>
                           <option value="USADO_ACEPTABLE">Usado - Aceptable</option>
                        </select>
                     </div>

                     <textarea 
                       name="listingDescription"
                       value={editForm.listingDescription || ""} 
                       onChange={handleEditChange} 
                       rows={4}
                       className="w-full bg-card border border-border px-3 py-2 text-sm focus:border-blue-500 outline-none resize-none custom-scrollbar whitespace-pre-wrap" 
                       placeholder="Descripción de la venta..." 
                     />

                     <div className="p-3 border border-border bg-muted/30">
                       <label className="text-[10px] uppercase tracking-widest font-bold text-blue-500 mb-1 block">Bots asignados</label>
                       <input 
                         type="number"
                         name="quantity"
                         value={editForm.quantity} 
                         onChange={handleEditChange} 
                         min={1}
                         className="w-full bg-card border border-border px-3 py-2 text-sm focus:border-blue-500 outline-none" 
                       />
                     </div>
                   </div>

                   <div className="mt-4 pt-4 flex gap-3 border-t border-border">
                      <button onClick={() => setIsCreating(false)} className="flex-1 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors border border-border">
                        Descartar
                      </button>
                      <button disabled={saving} onClick={handleCreate} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {saving && <Loader2 className="size-3 animate-spin"/>} Crear Publicación
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {selectedOrder && !isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md border border-border overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
             
             <div className="w-full aspect-video bg-muted relative group/carousel">
                {selectedOrder.imageUrls && selectedOrder.imageUrls.length > 0 ? (
                  <>
                    <img src={selectedOrder.imageUrls[activeImageIndex]} alt="Preview" className="w-full h-full object-contain bg-black/5" />
                    
                    {/* Carousel Navigation */}
                    {selectedOrder.imageUrls.length > 1 && (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : selectedOrder.imageUrls.length - 1)) }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/80 size-8 flex items-center justify-center rounded-full transition-colors backdrop-blur-md opacity-0 group-hover/carousel:opacity-100"
                        >
                          {"<"}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveImageIndex((prev) => (prev < selectedOrder.imageUrls.length - 1 ? prev + 1 : 0)) }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/80 size-8 flex items-center justify-center rounded-full transition-colors backdrop-blur-md opacity-0 group-hover/carousel:opacity-100"
                        >
                          {">"}
                        </button>

                        {/* Mini Previews */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-md p-1.5 rounded border border-white/10">
                          {selectedOrder.imageUrls.map((url: string, idx: number) => (
                            <button
                              key={idx}
                              onClick={(e) => { e.stopPropagation(); setActiveImageIndex(idx) }}
                              className={`size-10 rounded border-2 overflow-hidden transition-all ${activeImageIndex === idx ? 'border-blue-500 scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                            >
                              <img src={url} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                    <ShoppingBag className="size-16" />
                  </div>
                )}
                <button 
                  onClick={() => { setSelectedOrder(null); setIsEditing(false); }}
                  className="absolute top-3 right-3 bg-black/50 text-white hover:bg-black/80 size-8 flex items-center justify-center rounded-full transition-colors backdrop-blur-md cursor-pointer z-10"
                >
                  ✕
                </button>
             </div>

             <div className="p-6">
                {!isEditing ? (
                  <>
                    <div className="flex items-center justify-between gap-4 mb-2">
                       <h2 className="text-2xl font-black text-foreground">Bs {selectedOrder.listingPrice?.toString() || "0"}</h2>
                       <span className="px-2 py-1 bg-muted text-[10px] uppercase tracking-widest text-muted-foreground rounded">
                         {selectedOrder.status}
                       </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground/90 leading-tight mb-4">
                      {selectedOrder.listingTitle || selectedOrder.orderName}
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Descripción</h4>
                        <p className="text-sm text-foreground/80 leading-relaxed max-h-32 overflow-y-auto pr-2 custom-scrollbar whitespace-pre-wrap">
                          {selectedOrder.listingDescription || "No se ha proporcionado una descripción detallada para esta publicación."}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                         <div>
                           <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Categoría</h4>
                           <p className="text-xs font-semibold mt-1">{selectedOrder.listingCategory}</p>
                         </div>
                         <div>
                           <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Condición</h4>
                           <p className="text-xs font-semibold mt-1">{selectedOrder.listingCondition}</p>
                         </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 flex gap-3 border-t border-border flex-wrap">
                      <button onClick={() => { setSelectedOrder(null); setIsEditing(false); }} className="flex-1 min-w-[80px] py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                        Cerrar
                      </button>
                      <button 
                         onClick={() => {
                           setEditForm({
                             listingTitle: selectedOrder.listingTitle || selectedOrder.orderName,
                             listingPrice: selectedOrder.listingPrice,
                             listingCondition: selectedOrder.listingCondition,
                             listingCategory: selectedOrder.listingCategory,
                             listingDescription: selectedOrder.listingDescription
                           });
                           setIsEditing(true);
                         }} 
                         className="flex-1 py-2 border border-border hover:bg-muted text-foreground text-xs font-bold transition-all whitespace-nowrap"
                      >
                        Editar Publicación
                      </button>
                      {selectedOrder.status === "LISTA" && (
                        <button 
                           onClick={handleSendToBots}
                           disabled={saving}
                           className="flex-[2] py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          {saving && <Loader2 className="size-3 animate-spin"/>}
                          🚀 Enviar a Bots
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-300">
                     <div className="flex bg-muted/30 -mx-6 -mt-6 p-4 mb-4 items-center justify-between border-b border-border">
                       <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Editando Publicación</h3>
                     </div>

                     <div className="space-y-3">
                       
                       {/* Foto Upload Edit */}
                       <label className="border-2 border-dashed border-border hover:border-blue-500/50 transition-colors p-4 flex flex-col items-center justify-center gap-2 text-center cursor-pointer bg-muted/30">
                          <input type="file" multiple accept="image/*" className="hidden" onChange={handleEditFileChange} />
                          <ImagePlus className="size-6 text-blue-500" />
                          <div>
                             <p className="text-[10px] font-bold text-foreground">
                               {editSelectedFiles.length > 0 ? `${editSelectedFiles.length} foto(s) nueva(s) reemplazarán las actuales` : "Reemplazar Fotos"}
                             </p>
                          </div>
                       </label>

                       <input 
                         name="listingTitle"
                         value={editForm.listingTitle} 
                         onChange={handleEditChange} 
                         className="w-full bg-card border border-border px-3 py-2 text-sm focus:border-blue-500 outline-none font-bold" 
                         placeholder="Título" 
                       />
                       <div className="flex relative">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-bold">Bs</span>
                         <input 
                           type="number"
                           name="listingPrice"
                           value={editForm.listingPrice} 
                           onChange={handleEditChange} 
                           className="w-full bg-card border border-border px-3 py-2 pl-9 text-sm focus:border-blue-500 outline-none" 
                           placeholder="Precio" 
                         />
                       </div>
                       
                       <div className="grid grid-cols-2 gap-3">
                          <select 
                             name="listingCategory"
                             value={editForm.listingCategory} 
                             onChange={handleEditChange} 
                             className="w-full bg-card border border-border px-3 py-2 text-sm focus:border-blue-500 outline-none text-foreground uppercase text-[10px] tracking-widest appearance-none cursor-pointer" 
                          >
                             <option value="ELECTRONICA">Electrónica</option>
                             <option value="MUEBLES">Muebles</option>
                             <option value="ROPA_CALZADO">Ropa y Calzado</option>
                             <option value="VEHICULOS">Vehículos</option>
                             <option value="BIENES_RAICES">Bienes Raíces</option>
                             <option value="JUGUETES_JUEGOS">Juguetes y Juegos</option>
                             <option value="ARTICULOS_HOGAR">Artículos para el Hogar</option>
                             <option value="DEPORTES_FITNESS">Deportes y Fitness</option>
                             <option value="HERRAMIENTAS">Herramientas</option>
                             <option value="INSTRUMENTOS_MUSICALES">Instrumentos Musicales</option>
                             <option value="OTROS">Otros</option>
                          </select>
                          <select 
                             name="listingCondition"
                             value={editForm.listingCondition} 
                             onChange={handleEditChange} 
                             className="w-full bg-card border border-border px-3 py-2 text-sm focus:border-blue-500 outline-none text-foreground uppercase text-[10px] tracking-widest appearance-none cursor-pointer" 
                          >
                             <option value="NUEVO">Nuevo</option>
                             <option value="USADO_COMO_NUEVO">Usado - Como nuevo</option>
                             <option value="USADO_BUEN_ESTADO">Usado - Buen estado</option>
                             <option value="USADO_ACEPTABLE">Usado - Aceptable</option>
                          </select>
                       </div>

                       <textarea 
                         name="listingDescription"
                         value={editForm.listingDescription} 
                         onChange={handleEditChange} 
                         rows={4}
                         className="w-full bg-card border border-border px-3 py-2 text-sm focus:border-blue-500 outline-none resize-none custom-scrollbar whitespace-pre-wrap" 
                         placeholder="Descripción" 
                       />
                     </div>

                     <div className="mt-4 pt-4 flex gap-3 border-t border-border">
                        <button onClick={() => { setIsEditing(false); setEditSelectedFiles([]); }} className="flex-1 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors border border-border">
                          Cancelar
                        </button>
                        <button disabled={saving} onClick={handleSave} className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                          {saving && <Loader2 className="size-3 animate-spin"/>} Guardar Cambios
                        </button>
                     </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

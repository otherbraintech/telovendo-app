"use client";

import { useProjectStore } from "@/hooks/use-project-store"
import { Search, Filter, ShoppingBag, Loader2, ImagePlus, X, MoreVertical, Copy, Trash2, Edit, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState, useMemo, memo } from "react"
import { getOrdersByProject, updateBotOrder, sendOrderToBots, createBotOrder, cancelBotOrder, deleteBotOrder } from "@/lib/actions/orders"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const FilePreview = memo(({ file, className }: { file: File | string, className?: string }) => {
  const src = useMemo(() => {
    if (typeof file === 'string') return file;
    const url = URL.createObjectURL(file);
    return url;
  }, [file]);

  useEffect(() => {
    return () => {
      if (typeof file !== 'string') URL.revokeObjectURL(src);
    };
  }, [src, file]);

  return <img src={src} alt="Preview" className={className} />;
});
FilePreview.displayName = "FilePreview";

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
  const [touchStart, setTouchStart] = useState<number | null>(null)

  const filteredOrders = useMemo(() => 
    filter === "TODAS" ? orders : orders.filter(o => o.status === filter),
    [filter, orders]
  );

  const editingMixedImages = useMemo(() => 
    isCreating || isEditing 
      ? [...(editForm.imageUrls || []), ...editSelectedFiles] 
      : (selectedOrder?.imageUrls || []),
    [isCreating, isEditing, editForm.imageUrls, editSelectedFiles, selectedOrder?.imageUrls]
  );

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEditSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      let newImageUrls: string[] | undefined = undefined;
      
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
        imageUrls: [...(editForm.imageUrls || []), ...(newImageUrls || [])]
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
        listingCategory: editForm.listingCategory || "VARIOS",
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
        listingDescription: duplicated.listingDescription,
        imageUrls: duplicated.imageUrls || []
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

  const handleNavigate = (direction: 'next' | 'prev') => {
    if (!selectedOrder) return;
    const currentIndex = filteredOrders.findIndex(o => o.id === selectedOrder.id);
    if (currentIndex === -1) return;

    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0) nextIndex = filteredOrders.length - 1;
    if (nextIndex >= filteredOrders.length) nextIndex = 0;

    setSelectedOrder(filteredOrders[nextIndex]);
    setActiveImageIndex(0);
    setIsEditing(false);
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) handleNavigate('next');
    else if (distance < -minSwipeDistance) handleNavigate('prev');
    setTouchStart(null);
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

  useEffect(() => {
    if (isCreating || selectedOrder) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isCreating, selectedOrder]);

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground">
            Mis <span className="text-blue-500">Publicaciones</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            {selectedProjectId ? "Aquí puedes ver el estado de todas tus publicaciones." : "Selecciona un proyecto para ver sus publicaciones."}
          </p>
        </div>

        {selectedProjectId && (
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => { setEditForm({ listingCategory: "VARIOS", listingCondition: "NUEVO", quantity: 1 }); setEditSelectedFiles([]); setIsCreating(true); setActiveImageIndex(0); }}
              className="h-9 px-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              + Nueva Publicación
            </button>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
              <input type="text" placeholder="Buscar publicación..." className="w-48 sm:w-56 bg-card border border-border px-4 py-2 pl-9 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-foreground" />
            </div>
            <div className="relative group">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="h-9 w-40 sm:w-48 bg-card border border-border pl-9 text-[10px] font-black uppercase tracking-[0.1em] focus:ring-1 focus:ring-blue-500 rounded-none hover:bg-muted/50 transition-all">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                  <SelectValue placeholder="FILTRAR POR ESTADO" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border rounded-none shadow-2xl animate-in zoom-in-95 duration-200">
                  <SelectItem value="TODAS" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">TODAS LAS ÓRDENES</SelectItem>
                  <SelectItem value="LISTA" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">PENDIENTES</SelectItem>
                  <SelectItem value="GENERANDO" className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-blue-500">PUBLICANDO...</SelectItem>
                  <SelectItem value="GENERADA" className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-green-500">COMPLETADAS</SelectItem>
                  <SelectItem value="CANCELADA" className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-red-500">CANCELADAS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* PROJECT STATE CHECK */}
      {!selectedProjectId ? (
        <div className="h-96 border border-dashed border-border flex flex-col items-center justify-center gap-4 text-center p-8 bg-muted/5">
          <ShoppingBag className="size-12 text-muted-foreground/10" />
          <div className="max-w-xs">
            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Proyecto no seleccionado</p>
            <p className="text-[10px] text-muted-foreground/60 mt-2 uppercase tracking-wider leading-relaxed">Utiliza el menú lateral para gestionar tus publicaciones.</p>
          </div>
        </div>
      ) : loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <Loader2 className="size-10 text-blue-500 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 animate-pulse">Sincronizando...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOrders.map((order) => (
            <div key={order.id} onClick={() => { setSelectedOrder(order); setActiveImageIndex(0); }} className="group relative bg-card border border-border flex flex-col overflow-hidden hover:border-blue-500/50 transition-all duration-500 shadow-sm cursor-pointer">
              <div className="relative aspect-square bg-muted/20 border-b border-border overflow-hidden">
                {order.imageUrls && order.imageUrls.length > 0 ? (
                  <img src={order.imageUrls[0]} alt={order.orderName} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center"><img src="/iconTeloVendo.svg" alt="Logo" className="size-20 opacity-5 dark:invert" /></div>
                )}
                <div className="absolute top-3 left-3 z-10"><span className={`px-2 py-1 text-[8px] font-black uppercase tracking-wider rounded-none shadow-xl backdrop-blur-md border ${order.status === 'CANCELADA' ? 'bg-red-500/80 border-red-500/20 text-white' : order.status === 'LISTA' ? 'bg-amber-500/80 border-amber-500/20 text-white' : order.status === 'GENERANDO' ? 'bg-blue-600 border-blue-500/20 text-white animate-pulse' : 'bg-green-600 border-green-500/20 text-white'}`}>{statusLabel[order.status] ?? order.status}</span></div>
              </div>
              <div className="p-4 flex flex-col flex-1 gap-2 bg-gradient-to-b from-card to-muted/10">
                <div className="text-xl font-black text-blue-500 tabular-nums tracking-tighter">Bs {order.listingPrice}</div>
                <h3 className="text-sm font-bold text-foreground line-clamp-1 leading-none uppercase tracking-tight">{order.listingTitle || order.orderName}</h3>
                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed opacity-70">{order.listingDescription || "Publicación sin descripción detallada."}</p>
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">{order.socialNetwork || "Facebook"}</span>
                  {order.status === "LISTA" && (
                    <button onClick={(e) => inlineSendToBots(e, order.id)} disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 shadow-xl shadow-blue-600/30 active:scale-95">
                      {saving ? <Loader2 className="size-3 animate-spin"/> : "🚀 Enviar"}
                    </button>
                  )}
                </div>
              </div>
              <div className="absolute top-3 right-3 z-20">
                <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === order.id ? null : order.id); }} className={`size-8 flex items-center justify-center bg-card/80 border border-border text-foreground backdrop-blur-md transition-all hover:bg-blue-600 hover:text-white ${menuOpenId === order.id ? 'bg-blue-600 text-white shadow-xl' : ''}`}><MoreVertical className="size-4" /></button>
                {menuOpenId === order.id && (
                  <div className="absolute top-10 right-0 w-48 bg-card border border-border shadow-2xl z-50 animate-in slide-in-from-top-2 duration-300 rounded-none">
                    <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); setSelectedOrder(order); setEditForm({...order}); setIsEditing(true); }} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase flex items-center gap-3 hover:bg-muted transition-colors border-b border-border"><Edit className="size-3 text-blue-500" /> Editar</button>
                    <button onClick={(e) => handleDuplicate(e, order)} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase flex items-center gap-3 hover:bg-muted transition-colors border-b border-border"><Copy className="size-3 text-green-500" /> Duplicar</button>
                    <button onClick={(e) => handleDelete(e, order.id)} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase flex items-center gap-3 hover:bg-red-500/10 text-red-500 transition-colors"><Trash2 className="size-3" /> Eliminar</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredOrders.length === 0 && <div className="col-span-full py-20 text-center border border-dashed border-border bg-card/30"><p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Sin registros</p></div>}
        </div>
      )}

      {/* CREATION MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-xl p-4 md:p-8 flex items-start md:items-center justify-center overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setIsCreating(false) }}>
          <div className="relative w-full max-w-5xl bg-card border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-500 flex flex-col md:flex-row min-h-[500px]">
             <button onClick={() => setIsCreating(false)} className="absolute -top-3 -right-3 md:-top-6 md:-right-6 size-10 md:size-14 bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition-all z-[110] shadow-2xl border border-white/10 group active:scale-90"><X className="size-5 md:size-7 group-hover:rotate-90 transition-transform duration-300" /></button>
             <div className="flex-1 flex flex-col md:flex-row">
               <div className="w-full md:w-[48%] bg-muted/20 flex flex-col border-b md:border-b-0 md:border-r border-border p-6 shrink-0 md:sticky md:top-0">
                  <div className="relative aspect-square w-full bg-black/20 flex items-center justify-center overflow-hidden border border-border shadow-inner">
                    {editSelectedFiles.length > 0 ? (<FilePreview file={editSelectedFiles[activeImageIndex] || editSelectedFiles[0]} className="w-full h-full object-contain" />) : (<div className="text-center p-8"><ShoppingBag className="size-20 mx-auto text-muted-foreground/10" /><p className="text-[10px] font-black uppercase text-muted-foreground/30 mt-4 tracking-widest">Multimedia</p></div>)}
                  </div>
                  {editSelectedFiles.length > 1 && (
                    <div className="bg-background/20 mt-4 p-3 border border-border/50 flex items-center gap-3 overflow-x-auto scrollbar-hide">
                      {editSelectedFiles.map((file: File, idx: number) => (<button key={idx} onClick={() => setActiveImageIndex(idx)} className={`size-16 shrink-0 border-2 transition-all ${activeImageIndex === idx ? 'border-blue-500 scale-105 shadow-2xl z-10' : 'border-transparent opacity-40 hover:opacity-100'}`}><FilePreview file={file} className="w-full h-full object-cover" /></button>))}
                    </div>
                  )}
                  <label className="mt-4 border border-dashed border-blue-500/30 p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-blue-500/5 hover:bg-blue-500/10 transition-all group">
                     <input type="file" multiple accept="image/*" className="hidden" onChange={handleEditFileChange} /><ImagePlus className="size-8 text-blue-500 group-hover:scale-125 transition-transform duration-500" /><p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Subir</p>
                  </label>
               </div>
               <div className="flex-1 bg-card p-6 md:p-10 space-y-6 overflow-y-auto">
                 <div className="mb-4 flex items-center gap-3"><div className="h-6 w-1.5 bg-blue-500" /><h3 className="text-lg font-black uppercase tracking-widest text-foreground">Crear Publicación</h3></div>
                 <div className="space-y-5">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Título de la publicación</Label><Input className="h-11 bg-muted/20 border-border text-xs font-bold" name="listingTitle" value={editForm.listingTitle || ""} onChange={handleEditChange} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Precio Bs</Label><Input type="number" className="h-11 bg-muted/20 border-border text-base font-black text-blue-500" name="listingPrice" value={editForm.listingPrice || ""} onChange={handleEditChange} /></div>
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Bots</Label><Input type="number" className="h-11 bg-muted/20 border-border text-base font-black" name="quantity" value={editForm.quantity} onChange={handleEditChange} min={1} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Categoría</Label><Select value={editForm.listingCategory} onValueChange={v => setEditForm({...editForm, listingCategory: v})}><SelectTrigger className="h-11 bg-muted/20 text-[10px] font-bold uppercase"><SelectValue/></SelectTrigger><SelectContent>{["ELECTRONICA", "MUEBLES", "ROPA_CALZADO", "VEHICULOS", "BIENES_RAICES", "JUGUETES_JUEGOS", "ARTICULOS_HOGAR", "DEPORTES_FITNESS", "HERRAMIENTAS", "INSTRUMENTOS_MUSICALES", "VARIOS"].map(c => (<SelectItem key={c} value={c} className="text-[10px] font-bold uppercase">{c.replace('_', ' ')}</SelectItem>))}</SelectContent></Select></div>
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Condición</Label><Select value={editForm.listingCondition} onValueChange={v => setEditForm({...editForm, listingCondition: v})}><SelectTrigger className="h-11 bg-muted/20 text-[10px] font-bold uppercase"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="NUEVO">NUEVO</SelectItem><SelectItem value="USADO_COMO_NUEVO">COMO NUEVO</SelectItem><SelectItem value="USADO_BUEN_ESTADO">BUEN ESTADO</SelectItem><SelectItem value="USADO_ACEPTABLE">ACEPTABLE</SelectItem></SelectContent></Select></div>
                    </div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Descripción Detallada</Label><Textarea className="min-h-[140px] bg-muted/20 border-border text-xs leading-relaxed resize-none p-4" name="listingDescription" value={editForm.listingDescription || ""} onChange={handleEditChange} /></div>
                 </div>
                 <div className="pt-6 flex gap-3"><button onClick={() => setIsCreating(false)} className="flex-1 h-12 text-[10px] font-black uppercase tracking-[0.2em] border border-border hover:bg-muted transition-all">Cancelar</button><button disabled={saving} onClick={handleCreate} className="flex-[2] h-12 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-500/20">{saving ? <Loader2 className="size-4 animate-spin"/> : "CREAR PUBLICACIÓN"}</button></div>
                 <div className="mt-8 pt-6 border-t border-border/50 grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/10 border border-border/30"><p className="text-[8px] font-black uppercase text-muted-foreground/40 mb-1 tracking-widest">Entidad</p><p className="text-[10px] font-bold text-blue-500/50 uppercase tracking-tighter">Facebook / MP</p></div>
                    <div className="p-3 bg-muted/10 border border-border/30"><p className="text-[8px] font-black uppercase text-muted-foreground/40 mb-1 tracking-widest">Repo</p><p className="text-[10px] font-bold text-foreground/40 uppercase tracking-tighter">TeloVendo Oficial</p></div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* VIEW / EDIT MODAL */}
      {selectedOrder && !isCreating && (
        <div 
          className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-xl p-4 md:p-8 flex items-start md:items-center justify-center overflow-y-auto" 
          onClick={(e) => { if (e.target === e.currentTarget) { setSelectedOrder(null); setIsEditing(false); } }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* NAVIGATION BUTTONS (DESKTOP) */}
          <div className="hidden md:flex fixed inset-x-4 top-1/2 -translate-y-1/2 justify-between items-center z-[110] pointer-events-none">
            <button onClick={(e) => { e.stopPropagation(); handleNavigate('prev'); }} className="size-16 bg-white/5 hover:bg-blue-600 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all pointer-events-auto hover:scale-110 active:scale-95"><ChevronLeft className="size-8" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleNavigate('next'); }} className="size-16 bg-white/5 hover:bg-blue-600 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all pointer-events-auto hover:scale-110 active:scale-95"><ChevronRight className="size-8" /></button>
          </div>
          <div className="relative w-full max-w-5xl bg-card border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-500 flex flex-col md:flex-row min-h-[500px]">
             <button onClick={() => { setSelectedOrder(null); setIsEditing(false); }} className="absolute -top-3 -right-3 md:-top-6 md:-right-6 size-10 md:size-14 bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition-all z-[110] shadow-2xl border border-white/10 group active:scale-90"><X className="size-5 md:size-7 group-hover:rotate-90 transition-transform duration-300" /></button>
             <div className="flex-1 flex flex-col md:flex-row">
               <div className="w-full md:w-[48%] bg-muted/20 flex flex-col border-b md:border-b-0 md:border-r border-border p-6 shrink-0 md:sticky md:top-0">
                  <div className="relative aspect-square w-full bg-black/20 flex items-center justify-center overflow-hidden border border-border shadow-inner">
                    {editingMixedImages.length > 0 ? (<FilePreview file={editingMixedImages[activeImageIndex] || editingMixedImages[0]} className="w-full h-full object-contain" />) : (<div className="text-center p-8"><ShoppingBag className="size-20 mx-auto text-muted-foreground/10" /><p className="text-[10px] font-black uppercase text-muted-foreground/30 mt-4 tracking-widest">Multimedia</p></div>)}
                  </div>
                  {editingMixedImages.length > 1 && (
                    <div className="bg-background/20 mt-4 p-3 border border-border/50 flex items-center gap-3 overflow-x-auto scrollbar-hide">
                      {editingMixedImages.map((img: string | File, idx: number) => (
                        <div key={idx} className="relative group shrink-0">
                          <button onClick={() => setActiveImageIndex(idx)} className={`size-16 shrink-0 border-2 transition-all ${activeImageIndex === idx ? 'border-blue-500 scale-105 shadow-2xl z-10' : 'border-transparent opacity-40 hover:opacity-100'}`}><FilePreview file={img} className="w-full h-full object-cover" /></button>
                          {isEditing && (<button onClick={(e) => { e.stopPropagation(); const target = editingMixedImages[idx]; if (typeof target === 'string') { setEditForm({ ...editForm, imageUrls: editForm.imageUrls.filter((url: string) => url !== target) }); } else { setEditSelectedFiles(prev => prev.filter(f => f !== target)); } setActiveImageIndex(0); }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white size-5 flex items-center justify-center rounded-none z-20 shadow-xl active:scale-95"><X className="size-3" /></button>)}
                        </div>
                      ))}
                    </div>
                  )}
                  {isEditing && (<label className="mt-4 border border-dashed border-blue-500/30 p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-blue-500/5 hover:bg-blue-500/10 transition-all group"><input type="file" multiple accept="image/*" className="hidden" onChange={handleEditFileChange} /><ImagePlus className="size-6 text-blue-500 group-hover:scale-125 transition-transform" /><p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Añadir</p></label>)}
               </div>
               <div className="flex-1 bg-card p-6 md:p-12 space-y-6 overflow-y-auto">
                 {!isEditing ? (
                   <div className="flex flex-col h-full">
                     <div className="mb-6">
                       <div className="flex items-center gap-4 mb-2">
                         <span className="text-3xl md:text-4xl font-black tracking-tighter text-blue-500 tabular-nums">Bs {selectedOrder.listingPrice}</span>
                         <span className="h-[2px] flex-1 bg-blue-500/10" />
                         <span className={`px-2 py-1 text-[8px] font-black uppercase tracking-wider rounded-none ${selectedOrder.status === 'GENERANDO' ? 'bg-blue-600 text-white' : 'bg-green-600/20 text-green-500 border border-green-500/20'}`}>{statusLabel[selectedOrder.status]}</span>
                       </div>
                       <h2 className="text-xl md:text-2xl font-bold leading-tight uppercase tracking-tight">{selectedOrder.listingTitle || selectedOrder.orderName}</h2>
                     </div>
                     <div className="space-y-6 flex-1">
                        <div className="space-y-1.5"><h4 className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.3em]">Descripción</h4><p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap font-medium">{selectedOrder.listingDescription || "Sin descripción."}</p></div>
                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-border/50">
                           <div className="space-y-1.5"><h4 className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.3em]">Categoría</h4><p className="text-xs font-bold uppercase text-blue-500">{selectedOrder.listingCategory}</p></div>
                           <div className="space-y-1.5"><h4 className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.3em]">Condición</h4><p className="text-xs font-bold uppercase">{selectedOrder.listingCondition?.replace(/_/g, ' ')}</p></div>
                        </div>
                     </div>
                     <div className="mt-8 pt-6 flex flex-wrap gap-3 border-t border-border">
                       <div className="flex w-full gap-3 mb-2 md:mb-0 md:w-auto">
                         <button onClick={() => handleNavigate('prev')} className="flex-1 md:w-12 h-12 border border-border flex items-center justify-center hover:bg-muted transition-all active:scale-90"><ChevronLeft className="size-5"/></button>
                         <button onClick={() => handleNavigate('next')} className="flex-1 md:w-12 h-12 border border-border flex items-center justify-center hover:bg-muted transition-all active:scale-90"><ChevronRight className="size-5"/></button>
                       </div>
                       <button onClick={() => { setSelectedOrder(null); setIsEditing(false); }} className="flex-1 h-12 border border-border text-[10px] font-black uppercase tracking-[0.2em] hover:bg-muted transition-all">Cerrar</button>
                       <button onClick={() => { setEditForm({...selectedOrder}); setIsEditing(true); }} className="flex-1 h-12 border border-blue-500/30 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 hover:bg-blue-500/5 transition-all">Editar</button>
                       {selectedOrder.status === "LISTA" && (<button onClick={handleSendToBots} disabled={saving} className="flex-[2] h-12 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-500/20 active:scale-95">{saving ? <Loader2 className="size-4 animate-spin"/> : "🚀 Enviar"}</button>)}
                     </div>
                     <div className="mt-8 pt-6 border-t border-border/50 grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/10 border border-border/30"><p className="text-[8px] font-black uppercase text-muted-foreground/40 mb-1 tracking-widest">Sincronización</p><p className="text-[10px] font-bold text-foreground/40 uppercase tracking-tighter">Marketplace Activo</p></div>
                        <div className="p-3 bg-muted/10 border border-border/30"><p className="text-[8px] font-black uppercase text-muted-foreground/40 mb-1 tracking-widest">Plataforma</p><p className="text-[10px] font-bold text-foreground/40 uppercase tracking-tighter">TeloVendo App</p></div>
                     </div>
                   </div>
                 ) : (
                   <div className="space-y-6">
                      <div className="mb-4 flex items-center gap-3"><div className="h-6 w-1.5 bg-blue-500" /><h3 className="text-lg font-black uppercase tracking-widest text-foreground">Editar Publicación</h3></div>
                      <div className="space-y-5">
                        <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Título</Label><Input className="h-11 bg-muted/20 border-border text-xs font-bold" name="listingTitle" value={editForm.listingTitle || ""} onChange={handleEditChange} /></div>
                        <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Precio Bs</Label><Input type="number" className="h-11 bg-muted/20 border-border text-base font-black text-blue-500" name="listingPrice" value={editForm.listingPrice || ""} onChange={handleEditChange} /></div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Categoría</Label><Select value={editForm.listingCategory} onValueChange={v => setEditForm({...editForm, listingCategory: v})}><SelectTrigger className="h-11 bg-muted/20 text-[10px] font-bold uppercase"><SelectValue/></SelectTrigger><SelectContent>{["ELECTRONICA", "MUEBLES", "ROPA_CALZADO", "VEHICULOS", "BIENES_RAICES", "JUGUETES_JUEGOS", "ARTICULOS_HOGAR", "DEPORTES_FITNESS", "HERRAMIENTAS", "INSTRUMENTOS_MUSICALES", "VARIOS"].map(c => (<SelectItem key={c} value={c} className="text-[10px] font-bold uppercase">{c.replace('_', ' ')}</SelectItem>))}</SelectContent></Select></div>
                           <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Condición</Label><Select value={editForm.listingCondition} onValueChange={v => setEditForm({...editForm, listingCondition: v})}><SelectTrigger className="h-11 bg-muted/20 text-[10px] font-bold uppercase"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="NUEVO">NUEVO</SelectItem><SelectItem value="USADO_COMO_NUEVO">COMO NUEVO</SelectItem><SelectItem value="USADO_BUEN_ESTADO">BUEN ESTADO</SelectItem><SelectItem value="USADO_ACEPTABLE">ACEPTABLE</SelectItem></SelectContent></Select></div>
                        </div>
                        <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Descripción</Label><Textarea className="min-h-[180px] bg-muted/20 border-border text-xs leading-relaxed resize-none p-4" name="listingDescription" value={editForm.listingDescription || ""} onChange={handleEditChange} /></div>
                      </div>
                      <div className="mt-8 pt-6 flex gap-3 border-t border-border"><button onClick={() => setIsEditing(false)} className="flex-1 h-12 text-[10px] font-black uppercase tracking-[0.2em] border border-border hover:bg-muted transition-all">Cancelar</button><button disabled={saving} onClick={handleSave} className="flex-[2] h-12 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-600/20 active:scale-95">{saving ? <Loader2 className="size-4 animate-spin"/> : "GUARDAR CAMBIOS"}</button></div>
                   </div>
                 )}
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}

"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  Smartphone, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle,
  Edit,
  Trash2,
  X,
  Play,
  Pause,
  Database,
  ImagePlus,
  Ban,
  RefreshCw,
  CalendarDays,
  Timer,
  LayoutDashboard,
  Box,
  Car,
  Home
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { updateGenMarketplace, deleteGenMarketplace, updateBotOrderStatus } from "@/lib/actions/generations";
import { cancelBotOrder, deleteBotOrder } from "@/lib/actions/orders";
import { toast } from "sonner";
import { useProjectStore } from "@/hooks/use-project-store";
import { useRouter } from "next/navigation";

interface Generation {
  id: number;
  orderId: string;
  userId: string;
  status: string;
  deviceId: string | null;
  genTitle: string | null;
  genDescription: string | null;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
  botOrder: {
    id: string;
    listingTitle: string | null;
    orderName: string;
    status: string;
    listingType?: string;
  };
  device: {
    deviceName: string;
    personName: string | null;
  } | null;
}

const statusLabel: Record<string, string> = {
  LISTA: "LISTA PARA BOT",
  GENERANDO: "PUBLICANDO...",
  GENERADA: "PUBLICADA",
  COMPLETADA: "COMPLETADA",
  CANCELADA: "CANCELADA",
  PAUSADA: "PAUSADA",
  REINTENTAR: "REINTENTANDO",
  FALLIDA: "FALLIDA",
};

export default function GenerationsClient({ initialGenerations, mode = "overview" }: { initialGenerations: Generation[], mode?: "overview" | "detail" }) {
  const [generations, setGenerations] = useState<Generation[]>(initialGenerations);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("TODOS");
  const [editingGen, setEditingGen] = useState<Generation | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [orderActionLoading, setOrderActionLoading] = useState<string | null>(null);
  const { setActiveOrderName } = useProjectStore();
  const router = useRouter();

  const filtered = useMemo(() => {
    return generations.filter(g => {
      const matchesSearch = 
        (g.genTitle?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (g.botOrder.listingTitle?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (g.device?.deviceName.toLowerCase() || "").includes(search.toLowerCase());
      
      const matchesFilter = filter === "TODOS" || g.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [generations, search, filter]);

  const groupedOrders = useMemo(() => {
    const ordersMap: Record<string, { order: any, gens: Generation[] }> = {};
    filtered.forEach(g => {
      if (!ordersMap[g.orderId]) {
        ordersMap[g.orderId] = { order: g.botOrder, gens: [] };
      }
      ordersMap[g.orderId].gens.push(g);
    });
    return Object.values(ordersMap);
  }, [filtered]);

  useEffect(() => {
    if (groupedOrders.length === 1) {
      setActiveOrderName(groupedOrders[0].order.listingTitle || groupedOrders[0].order.orderName);
    }
    return () => setActiveOrderName(null);
  }, [groupedOrders, setActiveOrderName]);

  const handleUpdateGen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGen) return;
    try {
      setSaving(editingGen.id);
      const updated = await updateGenMarketplace(editingGen.id, {
        genTitle: editingGen.genTitle || "",
        genDescription: editingGen.genDescription || "",
        imageUrls: editingGen.imageUrls,
      });
      setGenerations(prev => prev.map(g => g.id === editingGen.id ? { ...g, ...updated } : g));
      setEditingGen(null);
      toast.success("Variante actualizada");
    } catch (err) {
      toast.error("Error al actualizar");
    } finally {
      setSaving(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("¿Deseas cancelar la operación completa?")) return;
    try {
      setOrderActionLoading(orderId);
      await cancelBotOrder(orderId);
      setGenerations(prev => prev.map(g => g.orderId === orderId ? { ...g, botOrder: { ...g.botOrder, status: "CANCELADA" } } : g));
      toast.success("Operación cancelada");
    } catch (err) {
      toast.error("Error al cancelar");
    } finally {
      setOrderActionLoading(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("¿Eliminar publicación permanentemente?")) return;
    try {
      setOrderActionLoading(orderId);
      await deleteBotOrder(orderId);
      toast.success("Publicación eliminada");
      if (groupedOrders.length === 1) router.push("/orders");
      else setGenerations(prev => prev.filter(g => g.orderId !== orderId));
    } catch (err) {
      toast.error("Error al eliminar");
    } finally {
      setOrderActionLoading(null);
    }
  };

  const handleChangeOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setOrderActionLoading(orderId);
      await updateBotOrderStatus(orderId, newStatus);
      setGenerations(prev => prev.map(g => g.orderId === orderId ? { ...g, botOrder: { ...g.botOrder, status: newStatus } } : g));
      toast.success(`Publicación: ${newStatus}`);
    } catch (err) {
      toast.error("Error operativo");
    } finally {
      setOrderActionLoading(null);
    }
  };

  const handleDeleteGen = async (id: number) => {
    if (!confirm("¿Eliminar ejecución específica?")) return;
    try {
      await deleteGenMarketplace(id);
      setGenerations(prev => prev.filter(g => g.id !== id));
      toast.success("Ejecución eliminada");
    } catch (err) {
      toast.error("Error al eliminar");
    }
  };

  const getTypeConfig = (type?: string) => {
    switch(type) {
      case "VEHICULO": return { label: "Vehículo", icon: Car, color: "text-amber-500" };
      case "PROPIEDAD": return { label: "Propiedad", icon: Home, color: "text-emerald-500" };
      default: return { label: "Artículo", icon: Box, color: "text-blue-500" };
    }
  };

  const getOrderStatusConfig = (status: string) => {
    switch(status) {
      case "GENERANDO": return { label: "PUBLICANDO", color: "bg-blue-600 text-white border-blue-500", icon: RefreshCw };
      case "LISTA": return { label: "LISTA PARA BOT", color: "bg-green-600 text-white border-green-500", icon: Play };
      case "EJECUTANDO": return { label: "EN PROCESO", color: "bg-cyan-600 text-white border-cyan-500", icon: Smartphone };
      case "PAUSADA": return { label: "PAUSADA", color: "bg-amber-500 text-white border-amber-400", icon: Pause };
      case "CANCELADA": return { label: "CANCELADA", color: "bg-red-500 text-white border-red-400", icon: Ban };
      default: return { label: status, color: "bg-muted text-muted-foreground border-border", icon: Clock };
    }
  };

  const genStatusConfig: Record<string, { icon: any, color: string, bg: string, label: string }> = {
    PENDIENTE: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", label: "PENDIENTE" },
    PUBLICADO: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", label: "PUBLICADO" },
    CANCELADO: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: "CANCELADO" },
    PAUSADO: { icon: Pause, color: "text-amber-600", bg: "bg-amber-600/10", label: "PAUSADO" },
    SINPUBLICAR: { icon: AlertCircle, color: "text-gray-500", bg: "bg-gray-500/10", label: "SIN PUBLICAR" },
  };

  const detailOrderName = mode === "detail" && groupedOrders.length > 0
    ? (groupedOrders[0].order.listingTitle || groupedOrders[0].order.orderName)
    : null;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          {mode === "detail" && (
            <button onClick={() => router.push("/generations")} className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-blue-500 transition-colors mb-2 cursor-pointer w-fit">
              <Play className="size-2.5 rotate-180" /> Volver a todos los envíos
            </button>
          )}
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground">
            {mode === "detail" ? (
              <>Detalle de <span className="text-blue-500">Publicación</span></>
            ) : (
              <>Estado de <span className="text-blue-500">Envío</span></>
            )}
          </h1>
          <p className="text-xs text-muted-foreground">
            {mode === "detail" && detailOrderName
              ? <>{detailOrderName} — Control individual de bots asignados.</>
              : <>Rastreo en tiempo real de tus publicaciones.</>
            }
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
            <input type="text" placeholder={mode === "detail" ? "Buscar bot..." : "Buscar publicación..."} value={search} onChange={(e) => setSearch(e.target.value)} className="w-48 sm:w-64 bg-card border border-border px-4 py-2 pl-9 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-foreground" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {groupedOrders.map(({ order, gens }) => {
          const config = getOrderStatusConfig(order.status);
          const typeConfig = getTypeConfig(order.listingType);
          const StatusIcon = config.icon;
          const TypeIcon = typeConfig.icon;
          return (
            <div key={order.id} className="border border-border bg-card group overflow-hidden shadow-sm">
              <div className="bg-muted/30 p-5 border-b border-border flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <TypeIcon className={`size-6 ${typeConfig.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{order.listingTitle || order.orderName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-0.5 bg-background border border-border">ID: {order.id.slice(-8)}</span>
                      <div className={`flex items-center gap-1.5 px-3 py-1 ${config.color} border shadow-sm`}>
                        <StatusIcon className="size-3 animate-pulse" />
                        <span className="text-[10px] font-black uppercase">{config.label}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(order.status === "LISTA" || order.status === "GENERANDO") ? (
                    <button onClick={() => handleChangeOrderStatus(order.id, "PAUSADA")} className="h-10 px-5 bg-amber-500 hover:bg-amber-400 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer"><Pause className="size-4 fill-current" /> Pausar</button>
                  ) : order.status === "PAUSADA" ? (
                    <button onClick={() => handleChangeOrderStatus(order.id, "LISTA")} className="h-10 px-5 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer"><Play className="size-4 fill-current" /> Reanudar</button>
                  ) : null}
                  <button onClick={() => handleCancelOrder(order.id)} disabled={order.status === "CANCELADA"} className="h-10 px-5 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer"><Ban className="size-4" /> Cancelar Todo</button>
                  <button onClick={() => handleDeleteOrder(order.id)} className="h-10 w-10 border border-border flex items-center justify-center hover:bg-red-500 hover:text-white transition-all cursor-pointer"><Trash2 className="size-4" /></button>
                </div>
              </div>

              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/10 border-b border-border">
                    <tr className="divide-x divide-border/20">
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground w-1/3">Configuración de Bot (Variante)</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Dispositivo</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Estado Bot</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Auditoría y Gestión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {gens.map((gen) => {
                      const gConfig = genStatusConfig[gen.status] || genStatusConfig.PENDIENTE;
                      const GIcon = gConfig.icon;
                      return (
                        <tr key={gen.id} className="hover:bg-muted/10 transition-colors group/row">
                          <td className="px-6 py-6">
                            <div className="flex gap-4">
                              <div className="flex gap-1 shrink-0">
                                {gen.imageUrls.slice(0, 1).map((url, i) => (<div key={i} className="size-16 border border-border bg-muted"><img src={url} className="w-full h-full object-cover" /></div>))}
                                {gen.imageUrls.length > 1 && (<div className="size-16 border border-border bg-muted flex items-center justify-center text-[10px] font-black">+{gen.imageUrls.length - 1}</div>)}
                              </div>
                              <div className="flex flex-col gap-1.5 overflow-hidden">
                                <span className="text-[11px] font-black text-foreground uppercase tracking-wider line-clamp-1 group-hover/row:text-blue-500 transition-colors">{gen.genTitle}</span>
                                <span className="text-[10px] text-muted-foreground/70 line-clamp-2 md:line-clamp-3 leading-relaxed">{gen.genDescription}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-3">
                              <div className="size-8 bg-blue-500/5 flex items-center justify-center border border-blue-500/10">
                                <Smartphone className="size-4 text-blue-500" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-black uppercase text-foreground">
                                  {gen.device?.deviceName || "SIN ASIGNAR"}
                                </span>
                                {gen.device?.personName && (
                                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                                    A Cargo: {gen.device.personName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6 min-w-[120px]">
                             <div className={`inline-flex items-center gap-2 px-2.5 py-1 ${gConfig.bg} ${gConfig.color} border border-current/20 font-black text-[9px] uppercase shadow-sm`}>
                               <GIcon className="size-3" />
                               {gConfig.label}
                             </div>
                          </td>
                          <td className="px-6 py-6 text-right min-w-[220px]">
                            <div className="flex flex-col items-end gap-4">
                               <div className="flex flex-col items-end gap-1.5 opacity-40 group-hover/row:opacity-100 transition-opacity">
                                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-tighter"><CalendarDays className="size-3 text-blue-500" /> GENERADA: {format(new Date(gen.createdAt), "dd/MM HH:mm", { locale: es })}</div>
                                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-tighter"><Timer className="size-3 text-amber-500" /> ACTUALIZADA: {format(new Date(gen.updatedAt), "dd/MM HH:mm", { locale: es })}</div>
                               </div>
                                <div className="flex items-center justify-end gap-1.5">
                                   {(gen.status === "PENDIENTE" || gen.status === "PUBLICADO") ? (
                                     <button onClick={async () => {
                                       await updateGenMarketplace(gen.id, { status: "PAUSADO" });
                                       setGenerations(prev => prev.map(g => g.id === gen.id ? { ...g, status: "PAUSADO" } : g));
                                       toast.success("Variante pausada");
                                     }} className="size-9 flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-600 hover:bg-amber-500 hover:text-white transition-all cursor-pointer" title="Pausar Bot"><Pause className="size-4" /></button>
                                   ) : gen.status === "PAUSADO" ? (
                                     <button onClick={async () => {
                                       await updateGenMarketplace(gen.id, { status: "PENDIENTE" });
                                       setGenerations(prev => prev.map(g => g.id === gen.id ? { ...g, status: "PENDIENTE" } : g));
                                       toast.success("Variante reanudada");
                                     }} className="size-9 flex items-center justify-center bg-green-600/10 border border-green-600/20 text-green-600 hover:bg-green-600 hover:text-white transition-all cursor-pointer" title="Reanudar Bot"><Play className="size-4" /></button>
                                   ) : null}
                                    <button 
                                      onClick={() => setEditingGen(gen)} 
                                      disabled={gen.status !== "PAUSADO"}
                                      className={`size-9 flex items-center justify-center border transition-all ${gen.status === "PAUSADO" ? 'bg-muted/50 border-border text-foreground hover:bg-blue-600 hover:text-white cursor-pointer' : 'bg-muted/10 border-border/10 text-muted-foreground/30 cursor-not-allowed'}`}
                                      title={gen.status === "PAUSADO" ? "Editar Variante" : "Pausa el bot para editar"}
                                    >
                                      <Edit className="size-4"/>
                                    </button>
                                   <button onClick={() => handleDeleteGen(gen.id)} className="size-9 flex items-center justify-center border border-border text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer" title="Eliminar"><Trash2 className="size-4"/></button>
                                </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* EDIT MODAL */}
      {editingGen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300" onClick={(e) => { if(e.target === e.currentTarget) setEditingGen(null) }}>
           <div className="w-full max-w-2xl bg-card border border-border shadow-[0_0_50px_rgba(37,99,235,0.1)] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
              <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">Configurar Variante</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">{editingGen.device?.deviceName}</p>
                </div>
                <button onClick={() => setEditingGen(null)} className="h-10 w-10 flex items-center justify-center border border-border hover:bg-red-500 hover:text-white transition-all cursor-pointer"><X className="size-5"/></button>
              </div>
              <form onSubmit={handleUpdateGen} className="p-8 space-y-6">
                 <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Título de Variante (SEO Optimizado)</label><input type="text" value={editingGen.genTitle || ""} onChange={e => setEditingGen({...editingGen, genTitle: e.target.value})} className="w-full h-12 bg-muted/20 border border-border px-4 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" /></div>
                 <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Descripción para el Marketplace</label><textarea rows={5} value={editingGen.genDescription || ""} onChange={e => setEditingGen({...editingGen, genDescription: e.target.value})} className="w-full bg-muted/20 border border-border p-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all leading-relaxed" /></div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Multimedia (Variante Única)</label>
                    <div className="flex flex-wrap gap-3 mt-2">
                       {editingGen.imageUrls.map((url, idx) => (
                         <div key={idx} className="relative size-20 border border-border group overflow-hidden shadow-sm">
                           <img src={url} className="w-full h-full object-cover" />
                           <div className="absolute inset-x-0 bottom-0 py-1 bg-black/60 text-[8px] font-black text-center text-white opacity-0 group-hover:opacity-100 transition-opacity">IMG {idx + 1}</div>
                           <button type="button" onClick={() => setEditingGen({...editingGen, imageUrls: editingGen.imageUrls.filter((_, i) => i !== idx)})} className="absolute top-1 right-1 size-6 bg-red-600 text-white rounded-none opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer shadow-lg hover:bg-black"><Trash2 className="size-3" /></button>
                         </div>
                       ))}
                       <label className="size-20 border border-dashed border-blue-500/40 bg-blue-500/5 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-500/10 hover:border-blue-500 transition-all">
                          <ImagePlus className="size-5 text-blue-500" />
                          <span className="text-[8px] font-black uppercase mt-1.5 text-blue-500/70 text-center px-1 leading-tight">Nueva<br/>Imagen</span>
                          <input type="file" className="hidden" />
                       </label>
                    </div>
                 </div>
                 <div className="pt-6 flex gap-4"><button type="button" onClick={() => setEditingGen(null)} className="flex-1 h-14 border border-border text-[11px] font-black uppercase tracking-widest cursor-pointer hover:bg-muted/50 transition-all">Descartar</button><button type="submit" disabled={saving !== null} className="flex-[2] h-14 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 cursor-pointer shadow-2xl shadow-blue-600/30 active:scale-95 hover:bg-blue-500 transition-all">{saving ? <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Guardar Configuración"}</button></div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

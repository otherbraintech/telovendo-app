"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search, Smartphone, CheckCircle2, Clock, XCircle, AlertCircle, Edit, Trash2, X, Play, Pause, Database, ImagePlus, Ban, RefreshCw, CalendarDays, Timer, LayoutDashboard, Box, Car, Home, Eye, DollarSign, Tag, Bot, Filter, Package, User as UserIcon
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { updateGenMarketplaceAdmin, deleteGenMarketplaceAdmin, updateBotOrderStatusAdmin, updateOnlyOrderStatusAdmin, deleteBotOrderAdmin } from "@/lib/actions/admin";
import { toast } from "sonner";

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
    listingPrice?: any;
    listingCurrency?: string;
    listingCategory?: string;
    listingCondition?: string;
    listingDescription?: string;
    vehicleYear?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleMileage?: number;
    propRooms?: string;
    propBathrooms?: string;
    propArea?: number;
    imageUrls: string[];
    user: {
      name: string | null;
      username: string;
    };
  };
  device: {
    serial: string;
    personName: string | null;
    redesSociales?: any;
  } | null;
}

const formatPrice = (price: any) => {
  const num = Number(price?.$numberDecimal || price) || 0;
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

export default function AdminPublicationsClient({ initialGenerations }: { initialGenerations: Generation[] }) {
  const [generations, setGenerations] = useState<Generation[]>(initialGenerations);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("TODOS");
  const [typeFilter, setTypeFilter] = useState("TODOS");
  const [editingGen, setEditingGen] = useState<Generation | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [orderActionLoading, setOrderActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; desc: string; action: () => void; isDestructive?: boolean } | null>(null);
  const [viewingSpecsOrder, setViewingSpecsOrder] = useState<any | null>(null);
  const [viewingGen, setViewingGen] = useState<Generation | null>(null);

  useEffect(() => {
    setGenerations(initialGenerations);
  }, [initialGenerations]);

  const filtered = useMemo(() => {
    return generations.filter(g => {
      const matchesSearch =
        (g.genTitle?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (g.botOrder.listingTitle?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (g.botOrder.user.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (g.botOrder.user.username?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (g.device?.serial.toLowerCase() || "").includes(search.toLowerCase());

      const matchesStatus = filter === "TODOS" || g.status === filter;
      const matchesType = typeFilter === "TODOS" || g.botOrder.listingType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [generations, search, filter, typeFilter]);

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

  const handleUpdateGen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGen) return;
    try {
      setSaving(editingGen.id);
      const updated = await updateGenMarketplaceAdmin(editingGen.id, {
        genTitle: editingGen.genTitle || "",
        genDescription: editingGen.genDescription || "",
        imageUrls: editingGen.imageUrls,
      });
      setGenerations(prev => prev.map(g => g.id === editingGen.id ? { ...g, ...updated } : g));
      setEditingGen(null);
      toast.success("Variante actualizada (Admin)");
    } catch (err) {
      toast.error("Error al actualizar");
    } finally {
      setSaving(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingGen || !e.target.files) return;
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setEditingGen({
          ...editingGen,
          imageUrls: [...editingGen.imageUrls, reader.result as string]
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "¿Eliminar publicación (GLOBAL)?",
      desc: "Acción administrativa: Se borrará permanentemente de la base de datos para este usuario.",
      isDestructive: true,
      action: async () => {
        try {
          setConfirmDialog(null);
          setOrderActionLoading(orderId);
          await deleteBotOrderAdmin(orderId);
          toast.success("Publicación eliminada globalmente");
          setGenerations(prev => prev.filter(g => g.orderId !== orderId));
        } catch (err) {
          toast.error("Error al eliminar");
        } finally {
          setOrderActionLoading(null);
        }
      }
    });
  };

  const handleChangeOrderStatus = async (orderId: string, newStatus: "PAUSADA" | "LISTA") => {
    try {
      setOrderActionLoading(orderId);
      await updateBotOrderStatusAdmin(orderId, newStatus);
      setGenerations(prev => prev.map(g => {
        if (g.orderId === orderId) {
           let updatedGenStatus = g.status;
           if (newStatus === "PAUSADA" && g.status === "PENDIENTE") updatedGenStatus = "PAUSADO";
           if (newStatus === "LISTA" && g.status === "PAUSADO") updatedGenStatus = "PENDIENTE";
           return { ...g, status: updatedGenStatus, botOrder: { ...g.botOrder, status: newStatus } };
        }
        return g;
      }));
      toast.success(`Estado global cambiado a ${newStatus}`);
    } catch (err) {
      toast.error("Error administrativo");
    } finally {
      setOrderActionLoading(null);
    }
  };

  const handleChangeOnlyOrderStatus = async (orderId: string, newStatus: any) => {
    try {
      setOrderActionLoading(orderId + "-order");
      await updateOnlyOrderStatusAdmin(orderId, newStatus);
      setGenerations(prev => prev.map(g =>
        g.orderId === orderId ? { ...g, botOrder: { ...g.botOrder, status: newStatus } } : g
      ));
      toast.success(`Orden actualizada a ${newStatus}`);
    } catch (err) {
      toast.error("Error en orden");
    } finally {
      setOrderActionLoading(null);
    }
  };

  const handleDeleteGen = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "¿Eliminar ejecución de Bot?",
      desc: "Acción administrativa irreversible.",
      isDestructive: true,
      action: async () => {
        try {
          setConfirmDialog(null);
          await deleteGenMarketplaceAdmin(id);
          setGenerations(prev => prev.filter(g => g.id !== id));
          toast.success("Ejecución eliminada");
        } catch (err) {
          toast.error("Error al eliminar");
        }
      }
    });
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground">
            Gestión <span className="text-blue-500">Global</span> de Publicaciones
          </h1>
          <p className="text-xs text-muted-foreground">Panel Administrativo para supervisar y gestionar todas las publicaciones de la red.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
            <input type="text" placeholder="Buscar por título, usuario o bot..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48 sm:w-80 bg-card border border-border px-4 py-2 pl-9 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-foreground" />
          </div>
          <div className="flex flex-wrap items-center bg-card border border-border shadow-sm p-1 gap-1">
              <button onClick={() => setTypeFilter("TODOS")} className={`h-8 px-3 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider transition-all border border-transparent cursor-pointer ${typeFilter === 'TODOS' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted-foreground hover:bg-blue-600/10 hover:text-blue-500'}`}><LayoutDashboard className="size-3" /><span className="hidden sm:inline">TODOS</span></button>
              <button onClick={() => setTypeFilter("ARTICULO")} className={`h-8 px-3 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider transition-all border border-transparent cursor-pointer ${typeFilter === 'ARTICULO' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted-foreground hover:bg-blue-600/10 hover:text-blue-500'}`}><Package className="size-3" /><span className="hidden sm:inline">ARTÍCULOS</span></button>
              <button onClick={() => setTypeFilter("VEHICULO")} className={`h-8 px-3 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider transition-all border border-transparent cursor-pointer ${typeFilter === 'VEHICULO' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted-foreground hover:bg-blue-600/10 hover:text-amber-500'}`}><Car className="size-3" /><span className="hidden sm:inline">VEHÍCULOS</span></button>
              <button onClick={() => setTypeFilter("PROPIEDAD")} className={`h-8 px-3 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider transition-all border border-transparent cursor-pointer ${typeFilter === 'PROPIEDAD' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted-foreground hover:bg-blue-600/10 hover:text-emerald-500'}`}><Home className="size-3" /><span className="hidden sm:inline">INMUEBLES</span></button>
          </div>
          <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-9 w-full sm:w-44 bg-card border border-border pl-9 text-[10px] font-black uppercase tracking-[0.1em] focus:ring-1 focus:ring-blue-500 rounded-none hover:bg-muted/50 transition-all"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" /><SelectValue placeholder="ESTADO: TODOS" /></SelectTrigger>
              <SelectContent className="bg-card border-border rounded-none shadow-2xl animate-in zoom-in-95 duration-200">
                <SelectItem value="TODOS" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">TODOS LOS ESTADOS</SelectItem>
                <SelectItem value="PENDIENTE" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">PENDIENTE</SelectItem>
                <SelectItem value="PUBLICADO" className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-green-500">PUBLICADO</SelectItem>
                <SelectItem value="PAUSADO" className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-amber-500">PAUSADO</SelectItem>
                <SelectItem value="CANCELADO" className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-red-500">CANCELADO</SelectItem>
              </SelectContent>
          </Select>
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
              <div className="bg-muted/30 px-5 pt-5 pb-4 border-b border-border/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="size-12 bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                    <TypeIcon className={`size-6 ${typeConfig.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground truncate">{order.listingTitle || order.orderName}</h3>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <div className="flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 border border-blue-500/20">
                        <UserIcon className="size-3 text-blue-500" />
                        <span className="text-[10px] font-bold text-blue-500 uppercase">{order.user.name || order.user.username}</span>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-0.5 bg-background border border-border">ID: {order.id.slice(-8)}</span>
                      <div className={`flex items-center gap-1.5 px-3 py-1 ${config.color} border shadow-sm`}>
                        <StatusIcon className="size-3 animate-pulse" />
                        <span className="text-[10px] font-black uppercase">{config.label}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 mr-1">Estado Orden:</span>
                  <button
                    onClick={() => handleChangeOnlyOrderStatus(order.id, "GENERADA")}
                    disabled={orderActionLoading === order.id + "-order" || order.status === "GENERADA"}
                    className="h-8 px-3 border border-green-500/30 text-green-500 hover:bg-green-500 hover:text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Marcar orden como Publicada"
                  >
                    <CheckCircle2 className="size-3" /> Publicada
                  </button>
                  <button
                    onClick={() => handleChangeOnlyOrderStatus(order.id, "PAUSADA")}
                    disabled={orderActionLoading === order.id + "-order" || order.status === "PAUSADA"}
                    className="h-8 px-3 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Marcar orden como Pausada"
                  >
                    <Pause className="size-3" /> Pausada
                  </button>
                  <button
                    onClick={() => handleChangeOnlyOrderStatus(order.id, "CANCELADA")}
                    disabled={orderActionLoading === order.id + "-order" || order.status === "CANCELADA"}
                    className="h-8 px-3 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Marcar orden como Cancelada"
                  >
                    <Ban className="size-3" /> Cancelar
                  </button>
                  <button onClick={() => setViewingSpecsOrder(order)} className="size-8 flex items-center justify-center bg-blue-600/10 border border-blue-500/30 text-blue-500 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"><Eye className="size-4" /></button>
                  <button onClick={() => handleDeleteOrder(order.id)} className="h-8 w-8 border border-border flex items-center justify-center hover:bg-red-500 hover:text-white transition-all cursor-pointer"><Trash2 className="size-3" /></button>
                </div>
              </div>

              <div className="bg-muted/10 px-5 py-3 border-b border-border flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mr-2">Acciones Bots (Admin):</span>
                <button
                  onClick={() => handleChangeOrderStatus(order.id, "PAUSADA")}
                  disabled={orderActionLoading === order.id || order.status === "CANCELADA"}
                  className="h-8 px-4 bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Pause className="size-3 fill-current" /> Pausar Todo
                </button>
                <button
                  onClick={() => handleChangeOrderStatus(order.id, "LISTA")}
                  disabled={orderActionLoading === order.id || order.status === "CANCELADA"}
                  className="h-8 px-4 bg-green-600/10 border border-green-600/30 text-green-500 hover:bg-green-600 hover:text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Play className="size-3 fill-current" /> Reanudar Todo
                </button>
              </div>

              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left table-fixed">
                  <tbody className="divide-y divide-border/30">
                    {gens.map((gen) => {
                      const gConfig = genStatusConfig[gen.status] || genStatusConfig.PENDIENTE;
                      const GIcon = gConfig.icon;
                      return (
                        <tr key={gen.id} className="hover:bg-muted/10 transition-colors group/row">
                          <td className="px-6 py-4 w-[45%]">
                            <div className="flex gap-4">
                              <img src={gen.imageUrls[0]} className="size-12 object-cover border border-border bg-muted shrink-0" />
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[11px] font-black text-foreground uppercase truncate group-hover/row:text-blue-500 transition-colors">{gen.genTitle}</span>
                                <span className="text-[10px] text-muted-foreground/70 truncate block">{gen.genDescription}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 w-[20%]">
                             <span className="text-[11px] font-black uppercase text-foreground truncate block">{gen.device?.serial || "SIN ASIGNAR"}</span>
                          </td>
                          <td className="px-6 py-4 w-[20%]">
                             <div className={`inline-flex items-center gap-2 px-2.5 py-1 ${gConfig.bg} ${gConfig.color} border border-current/20 font-black text-[9px] uppercase shadow-sm`}>
                               <GIcon className="size-3" />{gConfig.label}
                             </div>
                          </td>
                          <td className="px-6 py-4 w-[15%] text-right">
                             <div className="flex items-center justify-end gap-1.5 shrink-0">
                                <button onClick={() => setViewingGen(gen)} className="size-8 flex items-center justify-center bg-blue-600/10 border border-blue-500/20 text-blue-500 hover:bg-blue-600 hover:text-white transition-all cursor-pointer" title="Ver Detalles"><Eye className="size-4" /></button>

                                {gen.status === "PAUSADO" ? (
                                  <button
                                    onClick={async () => {
                                      const updated = await updateGenMarketplaceAdmin(gen.id, { status: "PENDIENTE" });
                                      setGenerations(prev => prev.map(g => g.id === gen.id ? { ...g, ...updated } : g));
                                      toast.success("Bot reanudado (Admin)");
                                    }}
                                    className="size-8 flex items-center justify-center bg-green-600/10 border border-green-600/20 text-green-600 hover:bg-green-600 hover:text-white transition-all cursor-pointer"
                                    title="Reanudar Bot"
                                  >
                                    <Play className="size-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={async () => {
                                      const updated = await updateGenMarketplaceAdmin(gen.id, { status: "PAUSADO" });
                                      setGenerations(prev => prev.map(g => g.id === gen.id ? { ...g, ...updated } : g));
                                      toast.success("Bot pausado (Admin)");
                                    }}
                                    className="size-8 flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-600 hover:bg-amber-500 hover:text-white transition-all cursor-pointer"
                                    title="Pausar Bot"
                                  >
                                    <Pause className="size-4" />
                                  </button>
                                )}

                                <button
                                  onClick={() => setEditingGen(gen)}
                                  className={`size-8 flex items-center justify-center border transition-all ${gen.status === "PAUSADO" ? 'bg-muted/50 border-border text-foreground hover:bg-blue-600 hover:text-white cursor-pointer' : 'bg-muted/10 border-border/10 text-muted-foreground/30 cursor-not-allowed'}`}
                                  title={gen.status === "PAUSADO" ? "Editar Variante" : "Pausa el bot para editar"}
                                >
                                  <Edit className="size-4"/>
                                </button>
                                <button onClick={() => handleDeleteGen(gen.id)} className="size-8 flex items-center justify-center border border-border text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer" title="Eliminar"><Trash2 className="size-4"/></button>
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
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">Configurar Variante (ADMIN)</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">{editingGen.device?.serial}</p>
                </div>
                <button onClick={() => setEditingGen(null)} className="h-10 w-10 flex items-center justify-center border border-border hover:bg-red-500 hover:text-white transition-all cursor-pointer"><X className="size-5"/></button>
              </div>
              <form onSubmit={handleUpdateGen} className="p-8 space-y-6">
                 <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Título de Variante</label><input type="text" value={editingGen.genTitle || ""} onChange={e => setEditingGen({...editingGen, genTitle: e.target.value})} className="w-full h-12 bg-muted/20 border border-border px-4 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" /></div>
                 <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Descripción</label><textarea rows={5} value={editingGen.genDescription || ""} onChange={e => setEditingGen({...editingGen, genDescription: e.target.value})} className="w-full bg-muted/20 border border-border p-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all leading-relaxed" /></div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Multimedia</label>
                     <div className="flex flex-col gap-4 mt-2">
                        <div className="flex flex-wrap gap-2">
                           {editingGen.imageUrls.map((url, idx) => (
                             <div key={idx} className="relative size-20 border border-blue-500 bg-blue-500/5 group overflow-hidden shadow-sm">
                               <img src={url} className="w-full h-full object-cover" alt={`Variant ${idx}`} />
                               <button type="button" onClick={() => setEditingGen({...editingGen, imageUrls: editingGen.imageUrls.filter((_, i) => i !== idx)})} className="absolute top-0 right-0 size-6 bg-red-600 text-white flex items-center justify-center cursor-pointer shadow-lg hover:bg-black transition-all"><Trash2 className="size-3" /></button>
                             </div>
                           ))}
                           <label className="size-20 border border-dashed border-blue-500/40 bg-blue-500/5 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-500/10 hover:border-blue-500 transition-all">
                              <ImagePlus className="size-5 text-blue-500" />
                              <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                           </label>
                        </div>
                     </div>
                 </div>
                 <div className="pt-6 flex gap-4"><button type="button" onClick={() => setEditingGen(null)} className="flex-1 h-14 border border-border text-[11px] font-black uppercase tracking-widest cursor-pointer hover:bg-muted/50 transition-all">Descartar</button><button type="submit" disabled={saving !== null} className="flex-[2] h-14 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 cursor-pointer shadow-2xl shadow-blue-600/30 active:scale-95 hover:bg-blue-500 transition-all">{saving ? <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Guardar Cambios Admin"}</button></div>
              </form>
           </div>
        </div>
      )}

      {/* SPECIFICATIONS VIEW DIALOG */}
      {viewingSpecsOrder && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300" onClick={(e) => { if(e.target === e.currentTarget) setViewingSpecsOrder(null) }}>
           <div className="w-full max-w-4xl max-h-[90vh] bg-card border border-white/5 shadow-[0_0_100px_rgba(37,99,235,0.15)] flex flex-col animate-in zoom-in-95 duration-500">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-muted/20 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                    <Eye className="size-6 text-blue-500" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-sm font-black uppercase italic tracking-[0.2em] text-foreground">Especificaciones Originales</h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-black opacity-60">ADMIN: {viewingSpecsOrder.user.username}</p>
                  </div>
                </div>
                <button onClick={() => setViewingSpecsOrder(null)} className="size-12 flex items-center justify-center border border-white/5 hover:bg-red-500 hover:text-white transition-all cursor-pointer"><X className="size-6"/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-12">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                       <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-blue-500 opacity-60">Título</label>
                          <p className="text-xl font-black uppercase italic tracking-tight text-foreground">{viewingSpecsOrder.listingTitle || viewingSpecsOrder.orderName}</p>
                       </div>
                       <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-blue-500 opacity-60">Descripción Base</label>
                          <p className="text-[11px] font-medium text-muted-foreground leading-relaxed whitespace-pre-wrap">{viewingSpecsOrder.listingDescription || "Sin descripción."}</p>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted/10 border border-white/5 p-5">
                             <div className="flex items-center gap-2 text-blue-500 mb-1"><DollarSign className="size-3" /><span className="text-[10px] font-black uppercase tracking-widest">Precio</span></div>
                             <p className="text-2xl font-black tabular-nums text-foreground">{viewingSpecsOrder.listingCurrency === "DOLAR" ? "$" : "Bs"} {formatPrice(viewingSpecsOrder.listingPrice)}</p>
                          </div>
                          <div className="bg-muted/10 border border-white/5 p-5">
                             <div className="flex items-center gap-2 text-blue-500 mb-1"><Tag className="size-3" /><span className="text-[10px] font-black uppercase tracking-widest">Categoría</span></div>
                             <p className="text-sm font-black uppercase text-foreground">{viewingSpecsOrder.listingCategory?.replace(/_/g, ' ')}</p>
                          </div>
                       </div>
                    </div>
                 </div>
                 {viewingSpecsOrder.imageUrls?.length > 0 && (
                   <div className="border-t border-white/5 pt-10">
                      <div className="flex items-center gap-3 mb-6"><ImagePlus className="size-4 text-blue-500" /><h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground">Multimedia Base ({viewingSpecsOrder.imageUrls.length})</h4></div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                         {viewingSpecsOrder.imageUrls.map((url: string, idx: number) => (
                           <div key={idx} className="relative aspect-square border border-white/5 bg-black/20 overflow-hidden"><img src={url} className="w-full h-full object-cover" /></div>
                         ))}
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm border border-border shadow-2xl flex flex-col pt-6 pb-4 px-6 gap-4">
            <div>
              <h3 className="text-lg font-black uppercase tracking-widest text-foreground">{confirmDialog.title}</h3>
              <p className="text-xs text-muted-foreground mt-2 font-medium">{confirmDialog.desc}</p>
            </div>
            <div className="flex items-center gap-3 justify-end mt-4">
              <button onClick={() => setConfirmDialog(null)} className="h-10 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cancelar</button>
              <button onClick={confirmDialog.action} className={`h-10 px-6 text-[10px] font-black uppercase tracking-widest text-white ${confirmDialog.isDestructive ? "bg-red-600" : "bg-blue-600"}`}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

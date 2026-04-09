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
  Home,
  Eye,
  ShoppingCart,
  DollarSign,
  Tag,
  Bot,
  Filter,
  Package
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { updateGenMarketplace, deleteGenMarketplace, updateBotOrderStatus, updateOnlyOrderStatus } from "@/lib/actions/generations";
import { cancelBotOrder, deleteBotOrder, retryMissingBots } from "@/lib/actions/orders";
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
    listingPrice?: any;
    listingCurrency?: string;
    listingCategory?: string;
    listingCondition?: string;
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

const getWhatsAppPhone = (redesSociales: any) => {
  if (!Array.isArray(redesSociales)) return null;
  const wa = redesSociales.find((r: any) => r?.red_social === "whatsapp");
  return wa?.telefono_asociado || wa?.user || null;
};

const getFacebookUser = (redesSociales: any) => {
  if (!Array.isArray(redesSociales)) return null;
  const fb = redesSociales.find((r: any) => r?.red_social === "facebook");
  return fb?.user || null;
};

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
  const [typeFilter, setTypeFilter] = useState("TODOS");
  const [editingGen, setEditingGen] = useState<Generation | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [orderActionLoading, setOrderActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; desc: string; action: () => void; isDestructive?: boolean } | null>(null);
  const [viewingSpecsOrder, setViewingSpecsOrder] = useState<any | null>(null);
  const [viewingGen, setViewingGen] = useState<Generation | null>(null);
  const { setActiveOrderName } = useProjectStore();
  const router = useRouter();

  const filtered = useMemo(() => {
    return generations.filter(g => {
      const matchesSearch = 
        (g.genTitle?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (g.botOrder.listingTitle?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (g.device?.serial.toLowerCase() || "").includes(search.toLowerCase());
      
      const matchesStatus = filter === "TODOS" || g.status === filter;
      const matchesType = typeFilter === "TODOS" || g.botOrder.listingType === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
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
    setConfirmDialog({
      isOpen: true,
      title: "¿Cancelar operación completa?",
      desc: "Esto cancelará la publicación y abortará todas las publicaciones que sigan pendientes en tus bots. Esta acción no se puede deshacer.",
      isDestructive: true,
      action: async () => {
        try {
          setConfirmDialog(null);
          setOrderActionLoading(orderId);
          await cancelBotOrder(orderId);
          setGenerations(prev => prev.map(g => g.orderId === orderId ? { 
            ...g, 
            status: g.status === 'PENDIENTE' ? 'CANCELADO' : g.status,
            botOrder: { ...g.botOrder, status: "CANCELADA" } 
          } : g));
          toast.success("Operación cancelada");
        } catch (err) {
          toast.error("Error al cancelar");
        } finally {
          setOrderActionLoading(null);
        }
      }
    });
  };

  const handleDeleteOrder = async (orderId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "¿Eliminar publicación permanentemente?",
      desc: "Se borrará por completo la publicación y todo su historial de generaciones de forma irreversible.",
      isDestructive: true,
      action: async () => {
        try {
          setConfirmDialog(null);
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
      }
    });
  };

  const handleChangeOrderStatus = async (orderId: string, newStatus: "PAUSADA" | "LISTA") => {
    setConfirmDialog({
      isOpen: true,
      title: newStatus === "PAUSADA" ? "¿Pausar ejecución de todos los bots?" : "¿Reanudar ejecución de todos los bots?",
      desc: newStatus === "PAUSADA" 
        ? "Esto pondrá todas las sub-publicaciones pendientes de esta orden en pausa. Los bots reservarán el espacio pero no trabajarán."
        : "Esto reactivará todas las sub-publicaciones pausadas de esta orden para que los bots comiencen a trabajar inmediatamente.",
      action: async () => {
        try {
          setConfirmDialog(null);
          setOrderActionLoading(orderId);
          await updateBotOrderStatus(orderId, newStatus);
          
          setGenerations(prev => prev.map(g => {
            if (g.orderId === orderId) {
               let updatedGenStatus = g.status;
               if (newStatus === "PAUSADA" && g.status === "PENDIENTE") updatedGenStatus = "PAUSADO";
               if (newStatus === "LISTA" && g.status === "PAUSADO") updatedGenStatus = "PENDIENTE";

               return { 
                 ...g, 
                 status: updatedGenStatus,
                 botOrder: { ...g.botOrder, status: newStatus } 
               };
            }
            return g;
          }));

          toast.success(`Publicación: ${newStatus === "LISTA" ? "REANUDADA" : "PAUSADA"}`);
        } catch (err) {
          toast.error("Error operativo");
        } finally {
          setOrderActionLoading(null);
        }
      }
    });
  };

  // Cambia solo el estado de la BotOrder (no toca GenMarketplace)
  const handleChangeOnlyOrderStatus = async (orderId: string, newStatus: any) => {
    try {
      setOrderActionLoading(orderId + "-order");
      await updateOnlyOrderStatus(orderId, newStatus);
      setGenerations(prev => prev.map(g =>
        g.orderId === orderId
          ? { ...g, botOrder: { ...g.botOrder, status: newStatus } }
          : g
      ));
      toast.success(`Orden: ${newStatus}`);
    } catch (err) {
      toast.error("Error al cambiar estado de la orden");
    } finally {
      setOrderActionLoading(null);
    }
  };

  const handleRetryMissingBots = async (orderId: string) => {
    try {
      setOrderActionLoading(orderId);
      const res = await retryMissingBots(orderId);
      if (res.success) {
        toast.success(`Se agregaron ${res.countAdded} bots faltantes. ${res.missingCount > 0 ? `Aún faltan ${res.missingCount}.` : 'Orden completa.'}`);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Error al solicitar reintento");
    } finally {
      setOrderActionLoading(null);
    }
  };

  const handleDeleteGen = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "¿Eliminar ejecución específica?",
      desc: "Estás a punto de borrar esta subtarea delegada a uno de tus bots. No se podrá recuperar.",
      isDestructive: true,
      action: async () => {
        try {
          setConfirmDialog(null);
          await deleteGenMarketplace(id);
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
              <>Detalle de <span className="text-blue-500">Ejecución</span></>
            ) : (
              <>Mis Bots en <span className="text-blue-500">Vivo</span></>
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
          {mode !== "detail" && (
            <>
            <div className="flex flex-wrap items-center bg-card border border-border shadow-sm p-1 gap-1">
              <button 
                onClick={() => setTypeFilter("TODOS")}
                className={`h-8 px-3 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider transition-all border border-transparent cursor-pointer ${typeFilter === 'TODOS' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted-foreground hover:bg-blue-600/10 hover:text-blue-500'}`}
              >
                <LayoutDashboard className="size-3" />
                <span className="hidden sm:inline">TODOS</span>
              </button>
              <button 
                onClick={() => setTypeFilter("ARTICULO")}
                className={`h-8 px-3 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider transition-all border border-transparent cursor-pointer ${typeFilter === 'ARTICULO' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted-foreground hover:bg-blue-600/10 hover:text-blue-500'}`}
              >
                <Package className="size-3" />
                <span className="hidden sm:inline">ARTÍCULOS</span>
                {typeFilter === 'ARTICULO' && <span className="sm:hidden font-black">🛍️</span>}
              </button>
              <button 
                onClick={() => setTypeFilter("VEHICULO")}
                className={`h-8 px-3 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider transition-all border border-transparent cursor-pointer ${typeFilter === 'VEHICULO' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted-foreground hover:bg-blue-600/10 hover:text-amber-500'}`}
              >
                <Car className="size-3" />
                <span className="hidden sm:inline">VEHÍCULOS</span>
                {typeFilter === 'VEHICULO' && <span className="sm:hidden font-black">🚗</span>}
              </button>
              <button 
                onClick={() => setTypeFilter("PROPIEDAD")}
                className={`h-8 px-3 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-wider transition-all border border-transparent cursor-pointer ${typeFilter === 'PROPIEDAD' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted-foreground hover:bg-blue-600/10 hover:text-emerald-500'}`}
              >
                <Home className="size-3" />
                <span className="hidden sm:inline">INMUEBLES</span>
                {typeFilter === 'PROPIEDAD' && <span className="sm:hidden font-black">🏠</span>}
              </button>
            </div>
              <div className="relative group w-full sm:w-auto">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="h-9 w-full sm:w-44 bg-card border border-border pl-9 text-[10px] font-black uppercase tracking-[0.1em] focus:ring-1 focus:ring-blue-500 rounded-none hover:bg-muted/50 transition-all">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                    <SelectValue placeholder="ESTADO: TODOS" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border rounded-none shadow-2xl animate-in zoom-in-95 duration-200">
                    <SelectItem value="TODOS" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">TODOS LOS ESTADOS</SelectItem>
                    <SelectItem value="PENDIENTE" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">PENDIENTE</SelectItem>
                    <SelectItem value="PUBLICADO" className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-green-500">PUBLICADO</SelectItem>
                    <SelectItem value="PAUSADO" className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-amber-500">PAUSADO</SelectItem>
                    <SelectItem value="CANCELADO" className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-red-500">CANCELADO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
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
              {/* ── FILA 1: Identidad + Estado de la ORDEN (BotOrder.status) ── */}
              <div className="bg-muted/30 px-5 pt-5 pb-4 border-b border-border/50 flex flex-wrap items-center justify-between gap-4">
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
                {/* Controles del estado de la ORDEN */}
                <div className="flex items-center gap-2">
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
                    <Ban className="size-3" /> Cancelada
                  </button>
                  {order.quantity > gens.length && (
                    <button 
                      onClick={() => handleRetryMissingBots(order.id)} 
                      disabled={orderActionLoading === order.id}
                      className="h-8 px-3 bg-blue-600 text-white hover:bg-blue-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-30"
                    >
                      {orderActionLoading === order.id ? <RefreshCw className="size-3 animate-spin" /> : <RefreshCw className="size-3" />} Reintentar Faltantes ({order.quantity - gens.length})
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      const mainGenWithDevice = gens.find((g) => !!g.device);
                      const mainDevice = mainGenWithDevice?.device || null;
                      const mainDeviceRedes = mainDevice ? (mainDevice as any).redesSociales : null;
                      setViewingSpecsOrder({
                        ...order,
                        quantity: gens.length,
                        mainDevice,
                        mainDevicePhone: mainDevice ? getWhatsAppPhone(mainDeviceRedes) : null,
                        mainDeviceFacebook: mainDevice ? getFacebookUser(mainDeviceRedes) : null,
                      });
                    }}
                    className="h-8 px-3 bg-blue-600/10 border border-blue-500/30 text-blue-500 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Ver Especificaciones Originales"
                  >
                    <Eye className="size-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Ver Detalles</span>
                  </button>
                  <button onClick={() => handleDeleteOrder(order.id)} className="h-8 w-8 border border-border flex items-center justify-center hover:bg-red-500 hover:text-white transition-all cursor-pointer" title="Eliminar orden permanentemente"><Trash2 className="size-3" /></button>
                </div>
              </div>

              {/* ── FILA 2: Acciones bulk sobre los BOTS (GenMarketplace) ── */}
              <div className="bg-muted/10 px-5 py-3 border-b border-border flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mr-2">Acciones Bots:</span>
                {/* Pausar Todo — pausa los GenMarketplace PENDIENTES */}
                <button
                  onClick={() => handleChangeOrderStatus(order.id, "PAUSADA")}
                  disabled={orderActionLoading === order.id || order.status === "CANCELADA"}
                  className="h-8 px-4 bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Pause className="size-3 fill-current" /> Pausar Todo
                </button>
                {/* Reanudar Todo — activa los GenMarketplace PAUSADOS */}
                <button
                  onClick={() => handleChangeOrderStatus(order.id, "LISTA")}
                  disabled={orderActionLoading === order.id || order.status === "CANCELADA"}
                  className="h-8 px-4 bg-green-600/10 border border-green-600/30 text-green-500 hover:bg-green-600 hover:text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Play className="size-3 fill-current" /> Reanudar Todo
                </button>
                {/* Cancelar Todo — cancela la orden + los GenMarketplace pendientes */}
                <button
                  onClick={() => handleCancelOrder(order.id)}
                  disabled={orderActionLoading === order.id || order.status === "CANCELADA"}
                  className="h-8 px-4 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Ban className="size-3" /> Cancelar Todo
                </button>

              </div>

              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/10 border-b border-border">
                    <tr className="divide-x divide-border/20">
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground w-1/3">Configuración de Bot (Variante)</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Dispositivo</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Estado Bot</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Estado y Gestión</th>
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
                              <div className="size-8 bg-blue-500/5 flex items-center justify-center border border-blue-500/10 shrink-0">
                                <Smartphone className="size-4 text-blue-500" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-black uppercase text-foreground">
                                  {gen.device?.serial || "SIN ASIGNAR"}
                                </span>
                                {gen.device?.personName && (
                                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight mb-1.5">
                                    A Cargo: {gen.device.personName}
                                  </span>
                                )}
                                {gen.device?.redesSociales && Array.isArray(gen.device.redesSociales) && (
                                  <div className="flex items-center gap-2 mt-0.5 pt-1.5 border-t border-border">
                                    {(() => {
                                      const wa = gen.device.redesSociales.find((r:any) => r.red_social === 'whatsapp');
                                      const fb = gen.device.redesSociales.find((r:any) => r.red_social === 'facebook');
                                      return (
                                        <>
                                          {wa && (
                                            <div className="flex items-center gap-1" title="WhatsApp">
                                              <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-500 px-1 py-0.5">WA</span>
                                              <span className="text-[9px] font-mono font-bold text-foreground opacity-80">{wa.telefono_asociado || wa.user || "S/N"}</span>
                                            </div>
                                          )}
                                          {fb && (
                                            <div className="flex items-center gap-1" title="Facebook">
                                              <span className="text-[8px] font-black bg-blue-500/10 text-blue-500 px-1 py-0.5">FB</span>
                                              <span className="text-[9px] font-bold text-foreground opacity-80 truncate max-w-[80px]">{fb.user || "N/A"}</span>
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
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
                                                   <div className="flex items-center justify-end gap-1.5">
                                    <button 
                                      onClick={() => setViewingGen(gen)}
                                      className="size-9 flex items-center justify-center bg-blue-600/10 border border-blue-500/20 text-blue-500 hover:bg-blue-600 hover:text-white transition-all cursor-pointer group/eye"
                                      title="Ver Detalles de Ejecución"
                                    >
                                      <Eye className="size-4 group-hover/eye:scale-110 transition-transform" />
                                    </button>

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
                                </div>              </div>
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
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">{editingGen.device?.serial}</p>
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
                    <p className="text-[10px] text-muted-foreground uppercase font-black opacity-60">Control Maestro de la Publicación</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingSpecsOrder(null)} 
                  className="size-12 flex items-center justify-center border border-white/5 hover:bg-red-500 hover:text-white transition-all cursor-pointer active:scale-95"
                >
                  <X className="size-6"/>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-12">
                 {/* GRID DE DATOS PRINCIPALES */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                       <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-blue-500 opacity-60">Título de la Publicación</label>
                          <p className="text-xl font-black uppercase italic tracking-tight text-foreground leading-[1.1]">{viewingSpecsOrder.listingTitle || viewingSpecsOrder.orderName}</p>
                       </div>
                       
                       <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-blue-500 opacity-60">Descripción Base</label>
                          <p className="text-[11px] font-medium text-muted-foreground leading-relaxed whitespace-pre-wrap">{viewingSpecsOrder.listingDescription || "Sin descripción proporcionada."}</p>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted/10 border border-white/5 p-5 space-y-1">
                             <div className="flex items-center gap-2 text-blue-500 mb-1">
                                <DollarSign className="size-3" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Precio</span>
                             </div>
                             <p className="text-2xl font-black tabular-nums tracking-tighter text-foreground">
                                {viewingSpecsOrder.listingCurrency === "DOLAR" ? "$" : "Bs"} {formatPrice(viewingSpecsOrder.listingPrice)}
                             </p>
                          </div>
                          <div className="bg-muted/10 border border-white/5 p-5 space-y-1">
                             <div className="flex items-center gap-2 text-blue-500 mb-1">
                                <Tag className="size-3" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Categoría</span>
                             </div>
                             <p className="text-sm font-black uppercase tracking-tight text-foreground">
                                {viewingSpecsOrder.listingCategory?.replace(/_/g, ' ')}
                             </p>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted/10 border border-white/5 p-5 space-y-1">
                             <div className="flex items-center gap-2 text-blue-500 mb-1">
                                <Smartphone className="size-3" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Tipo</span>
                             </div>
                             <p className="text-sm font-black uppercase tracking-tight text-foreground">
                                {viewingSpecsOrder.listingType}
                             </p>
                          </div>
                          <div className="bg-muted/10 border border-white/5 p-5 space-y-1">
                             <div className="flex items-center gap-2 text-blue-500 mb-1">
                                <CheckCircle2 className="size-3" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Condición</span>
                             </div>
                             <p className="text-sm font-black uppercase tracking-tight text-foreground">
                                {viewingSpecsOrder.listingCondition?.replace(/_/g, ' ')}
                             </p>
                          </div>
                       </div>

                       {viewingSpecsOrder.mainDevice && (
                         <div className="bg-muted/10 border border-white/5 p-5 space-y-3">
                           <div className="flex items-center gap-2 text-blue-500">
                             <Bot className="size-3" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Bot Principal Asignado</span>
                           </div>
                           <div className="space-y-1">
                             <p className="text-sm font-black uppercase tracking-tight text-foreground">
                               {(viewingSpecsOrder.mainDevice.personName || viewingSpecsOrder.mainDevice.serial || "SIN ASIGNAR")}
                             </p>
                             {(viewingSpecsOrder.mainDevicePhone || viewingSpecsOrder.mainDeviceFacebook) && (
                              <div className="flex flex-col gap-1.5 pt-2">
                                {viewingSpecsOrder.mainDevicePhone && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 px-1 py-0.5">WA</span>
                                    <span className="text-[11px] font-mono font-black text-emerald-500 tracking-tight">
                                      {viewingSpecsOrder.mainDevicePhone}
                                    </span>
                                  </div>
                                )}
                                {viewingSpecsOrder.mainDeviceFacebook && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black bg-blue-500/10 text-blue-500 px-1 py-0.5">FB</span>
                                    <span className="text-[11px] font-bold text-foreground/80 truncate">
                                      {viewingSpecsOrder.mainDeviceFacebook}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                           </div>
                         </div>
                       )}
                    </div>
                 </div>

                 {/* DETALLES ESPECÍFICOS SEGÚN TIPO */}
                 {(viewingSpecsOrder.listingType === "VEHICULO" || viewingSpecsOrder.listingType === "PROPIEDAD") && (
                   <div className="border-t border-white/5 pt-10">
                      <div className="flex items-center gap-3 mb-6">
                         <Database className="size-4 text-blue-500" />
                         <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground">Información Técnica</h4>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         {viewingSpecsOrder.listingType === "VEHICULO" && (
                           <>
                             <div className="p-4 bg-muted/5 border border-white/5">
                                <p className="text-[9px] font-black uppercase text-muted-foreground/60 mb-1">Año</p>
                                <p className="text-xs font-black">{viewingSpecsOrder.vehicleYear || "-"}</p>
                             </div>
                             <div className="p-4 bg-muted/5 border border-white/5">
                                <p className="text-[9px] font-black uppercase text-muted-foreground/60 mb-1">Marca</p>
                                <p className="text-xs font-black truncate">{viewingSpecsOrder.vehicleMake || "-"}</p>
                             </div>
                             <div className="p-4 bg-muted/5 border border-white/5">
                                <p className="text-[9px] font-black uppercase text-muted-foreground/60 mb-1">Modelo</p>
                                <p className="text-xs font-black truncate">{viewingSpecsOrder.vehicleModel || "-"}</p>
                             </div>
                             <div className="p-4 bg-muted/5 border border-white/5">
                                <p className="text-[9px] font-black uppercase text-muted-foreground/60 mb-1">Recorrido</p>
                                <p className="text-xs font-black">{viewingSpecsOrder.vehicleMileage || 0} km</p>
                             </div>
                           </>
                         )}

                         {viewingSpecsOrder.listingType === "PROPIEDAD" && (
                           <>
                             <div className="p-4 bg-muted/5 border border-white/5">
                                <p className="text-[9px] font-black uppercase text-muted-foreground/60 mb-1">Habitaciones</p>
                                <p className="text-xs font-black">{viewingSpecsOrder.propRooms || "-"}</p>
                             </div>
                             <div className="p-4 bg-muted/5 border border-white/5">
                                <p className="text-[9px] font-black uppercase text-muted-foreground/60 mb-1">Baños</p>
                                <p className="text-xs font-black">{viewingSpecsOrder.propBathrooms || "-"}</p>
                             </div>
                             <div className="p-4 bg-muted/5 border border-white/5">
                                <p className="text-[9px] font-black uppercase text-muted-foreground/60 mb-1">Área Total</p>
                                <p className="text-xs font-black">{viewingSpecsOrder.propArea || 0} m²</p>
                             </div>
                           </>
                         )}
                      </div>
                   </div>
                 )}

                 {/* GALERÍA DE IMÁGENES ORIGINALES */}
                 {viewingSpecsOrder.imageUrls?.length > 0 && (
                   <div className="border-t border-white/5 pt-10">
                      <div className="flex items-center gap-3 mb-6">
                         <ImagePlus className="size-4 text-blue-500" />
                         <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground">Multimedia Base ({viewingSpecsOrder.imageUrls.length})</h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                         {viewingSpecsOrder.imageUrls.map((url: string, idx: number) => (
                           <div key={idx} className="relative aspect-square border border-white/5 bg-black/20 overflow-hidden group">
                              <img src={url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                              <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                           </div>
                         ))}
                      </div>
                   </div>
                 )}
              </div>

              <div className="p-8 border-t border-white/5 bg-muted/10 shrink-0">
                 <button 
                  onClick={() => setViewingSpecsOrder(null)}
                  className="w-full h-14 bg-foreground text-background text-[11px] font-black uppercase tracking-[0.3em] hover:bg-blue-600 hover:text-white transition-all active:scale-[0.98] cursor-pointer"
                 >
                   Entendido
                 </button>
              </div>
           </div>
        </div>
      )}
      {/* GEN DETAILS DIALOG */}
      {viewingGen && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300" onClick={(e) => { if(e.target === e.currentTarget) setViewingGen(null) }}>
          <div className="w-full max-w-3xl bg-card border border-white/5 shadow-[0_0_100px_rgba(37,99,235,0.2)] flex flex-col animate-in zoom-in-95 duration-500 max-h-[90vh]">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-4">
                <div className="size-12 bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                  <Smartphone className="size-6 text-blue-500" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-black uppercase italic tracking-[0.2em] text-foreground">Estado de Ejecución del Bot</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-black opacity-60">ID Ejecución: #{viewingGen.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingGen(null)} 
                className="size-10 flex items-center justify-center border border-white/5 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
              >
                <X className="size-5"/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              {/* STATUS & DEVICE BANNER */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 border border-current/20 ${genStatusConfig[viewingGen.status]?.bg || "bg-muted/10"} ${genStatusConfig[viewingGen.status]?.color || "text-muted-foreground"} flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = genStatusConfig[viewingGen.status]?.icon || Clock;
                      return <Icon className="size-5" />;
                    })()}
                    <span className="text-xs font-black uppercase tracking-widest">{genStatusConfig[viewingGen.status]?.label || viewingGen.status}</span>
                  </div>
                  <div className="text-[8px] font-black uppercase opacity-60">Estado de Ejecución</div>
                </div>
                <div className="p-4 bg-muted/5 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Smartphone className="size-6 text-blue-500 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-foreground uppercase">{viewingGen.device?.serial || "SIN ASIGNAR"}</span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">{viewingGen.device?.personName || "Operador Desconocido"}</span>
                      
                      {viewingGen.device?.redesSociales && Array.isArray(viewingGen.device.redesSociales) && (
                        <div className="flex items-center gap-3 mt-2">
                          {(() => {
                            const wa = viewingGen.device.redesSociales.find((r:any) => r.red_social === 'whatsapp');
                            const fb = viewingGen.device.redesSociales.find((r:any) => r.red_social === 'facebook');
                            return (
                              <>
                                {wa && (
                                  <div className="flex items-center gap-1.5" title="WhatsApp">
                                    <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 border border-emerald-500/20">WA</span>
                                    <span className="text-[10px] font-mono font-bold text-foreground opacity-80">{wa.telefono_asociado || wa.user || "S/N"}</span>
                                  </div>
                                )}
                                {fb && (
                                  <div className="flex items-center gap-1.5" title="Facebook">
                                    <span className="text-[9px] font-black bg-blue-500/10 text-blue-500 px-1.5 py-0.5 border border-blue-500/20">FB</span>
                                    <span className="text-[10px] font-bold text-foreground opacity-80 truncate">{fb.user || "N/A"}</span>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-[8px] font-black uppercase opacity-60 self-start mt-1">Dispositivo/Bot</div>
                </div>
              </div>

              {/* CONSOLIDATED DETAILS - ROOT DATA & BOT VARIANT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* ORIGINAL LISTING INFO */}
                <div className="space-y-6">
                   <div className="flex items-center gap-2 mb-4">
                      <Database className="size-3.5 text-amber-500" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Publicación Original</h4>
                   </div>
                   
                   <div className="space-y-4 bg-muted/10 p-5 border-l-2 border-amber-500/50">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-wider">Precio & Moneda</span>
                        <p className="text-xl font-black italic tracking-tighter text-foreground">
                           {viewingGen.botOrder.listingCurrency === "DOLAR" ? "$" : "Bs"} {formatPrice(viewingGen.botOrder.listingPrice)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <span className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-wider">Categoría</span>
                            <p className="text-[10px] font-black uppercase text-foreground">{viewingGen.botOrder.listingCategory?.replace(/_/g, ' ')}</p>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-wider">Condición</span>
                            <p className="text-[10px] font-black uppercase text-foreground">{viewingGen.botOrder.listingCondition?.replace(/_/g, ' ')}</p>
                         </div>
                      </div>
                   </div>
                </div>

                {/* BOT VARIANT INFO */}
                <div className="space-y-6">
                   <div className="flex items-center gap-2 mb-4">
                      <Bot className="size-3.5 text-blue-500" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Variante IA del Bot</h4>
                   </div>

                   <div className="space-y-4 bg-blue-500/5 p-5 border-l-2 border-blue-500/50">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-wider">Título Optimizado</span>
                        <p className="text-[11px] font-black uppercase italic leading-tight text-foreground">{viewingGen.genTitle}</p>
                      </div>
                   </div>
                </div>
              </div>

              {/* FULL DESCRIPTION */}
              <div className="space-y-3 p-6 bg-muted/10 border border-white/5">
                 <label className="text-[10px] font-black uppercase tracking-widest text-blue-500 opacity-60">Descripción de esta Variante (Marketplace)</label>
                 <p className="text-[11px] font-medium text-muted-foreground leading-relaxed whitespace-pre-wrap">{viewingGen.genDescription}</p>
              </div>

              {/* IMAGES */}
              {viewingGen.imageUrls.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ImagePlus className="size-3.5 text-blue-500" />
                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-500 opacity-60">Multimedia de Ejecución ({viewingGen.imageUrls.length})</label>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 pt-2">
                    {viewingGen.imageUrls.map((url, idx) => (
                      <div key={idx} className="aspect-square border border-white/5 bg-black/20 overflow-hidden relative group shadow-sm hover:border-blue-500/30 transition-all">
                        <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TIMESTAMPS */}
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Generada el</span>
                  <div className="flex items-center gap-2 text-[10px] font-black text-foreground uppercase">
                    <CalendarDays className="size-3 text-blue-500" />
                    {format(new Date(viewingGen.createdAt), "dd 'de' MMMM, HH:mm", { locale: es })}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Última Actividad</span>
                  <div className="flex items-center gap-2 text-[10px] font-black text-foreground uppercase">
                    <Timer className="size-3 text-amber-500" />
                    {format(new Date(viewingGen.updatedAt), "dd 'de' MMMM, HH:mm", { locale: es })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-white/5 bg-muted/10 shrink-0">
              <button 
                onClick={() => setViewingGen(null)}
                className="w-full h-14 bg-foreground text-background text-[11px] font-black uppercase tracking-[0.3em] hover:bg-blue-600 hover:text-white transition-all active:scale-[0.98] cursor-pointer shadow-xl shadow-blue-600/10"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm border border-border shadow-2xl flex flex-col pt-6 pb-4 px-6 gap-4 animate-in zoom-in-95 duration-300">
            <div>
              <h3 className="text-lg font-black uppercase tracking-widest text-foreground">{confirmDialog.title}</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-medium">{confirmDialog.desc}</p>
            </div>
            
            <div className="flex items-center gap-3 justify-end mt-4">
              <button 
                onClick={() => setConfirmDialog(null)}
                className="h-10 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted/50 border border-transparent hover:border-border transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDialog.action}
                className={`h-10 px-6 text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg ${
                  confirmDialog.isDestructive 
                    ? "bg-red-600 hover:bg-red-500 shadow-red-600/20" 
                    : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { Plus, Cpu, Trash2, Pencil, CheckCircle2, CircleDashed, AlertCircle, Bot, RefreshCw, Loader2, Smartphone, Eye, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createDevice, updateDevice, deleteDevice, syncDevices } from "@/lib/actions/devices";

type Device = {
  id: string;
  serial: string;
  model: string | null;
  personName: string | null;
  label: string | null;
  triggerId: string | null;
  alias?: string | null;
  estadoDb?: string | null;
  redesSociales?: any;
  status: "LIBRE" | "OCUPADO" | "BLOQUEADO" | "SIN_CUENTAS";
  updatedAt: string;
};

export default function DevicesClient({ initialDevices }: { initialDevices: Device[] }) {
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [isPending, startTransition] = useTransition();
  const [isSyncing, setIsSyncing] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deviceDetails, setDeviceDetails] = useState<Device | null>(null);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState("TODOS");

  const statusPriority: Record<string, number> = {
    "LIBRE": 1,
    "OCUPADO": 2,
    "BLOQUEADO": 3,
    "SIN_CUENTAS": 4
  };

  const sortedAndFilteredDevices = useMemo(() => {
    let list = [...devices];
    
    if (statusFilter !== "TODOS") {
      list = list.filter(d => d.status === statusFilter);
    }

    return list.sort((a, b) => {
      const pA = statusPriority[a.status] || 99;
      const pB = statusPriority[b.status] || 99;
      return pA - pB;
    });
  }, [devices, statusFilter]);

  const handleSync = async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const updatedList = await syncDevices();
      setDevices(updatedList);
      setLastSync(new Date());
      if (!silent) toast.success("Sincronización completa");
    } catch (error) {
      console.error("Error al sincronizar:", error);
      if (!silent) toast.error("Error en sincronización");
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    // Polling cada 30 minutos (1800000 ms) como solicitado
    const interval = setInterval(() => {
      handleSync(true);
    }, 1800000);
    return () => clearInterval(interval);
  }, []);

  const [form, setForm] = useState({
    serial: "",
    model: "",
    personName: "",
    label: "",
    triggerId: "",
    status: "LIBRE",
  });

  const handleOpenEdit = (d: Device) => {
    setEditingId(d.id);
    setForm({
      serial: d.serial,
      model: d.model || "",
      personName: d.personName || "",
      label: d.label || "",
      triggerId: d.triggerId || "",
      status: d.status,
    });
    setOpen(true);
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setForm({
      serial: "",
      model: "",
      personName: "",
      label: "",
      triggerId: "",
      status: "LIBRE",
    });
    setOpen(true);
  };

  const handleOpenDetails = (d: Device) => {
    setDeviceDetails(d);
    setIsDetailsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serial) return toast.error("Serial obligatorio");

    startTransition(async () => {
      try {
        if (editingId) {
          const updated = await updateDevice(editingId, form);
          setDevices(prev => prev.map(d => d.id === editingId ? updated : d));
          toast.success("Dispositivo actualizado");
        } else {
          const created = await createDevice(form);
          setDevices([created, ...devices]);
          toast.success("Dispositivo creado");
        }
        setOpen(false);
      } catch (err: any) {
        toast.error("Error al guardar");
      }
    });
  };

  const handleDelete = async () => {
    if (!deviceToDelete) return;
    startTransition(async () => {
      try {
        await deleteDevice(deviceToDelete.id);
        setDevices(prev => prev.filter(d => d.id !== deviceToDelete.id));
        toast.success("Eliminado");
        setIsDeleteDialogOpen(false);
      } catch (error) {
        toast.error("Error al eliminar");
      }
    });
  };

  if (!mounted) return <div className="h-96 flex items-center justify-center"><Loader2 className="size-10 text-blue-500 animate-spin" /></div>;

  return (
    <div className="space-y-8 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground flex items-center gap-3">
            <Cpu className="size-8 text-blue-600" />
            Dispositivos
          </h1>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
             <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <div className="size-1.5 bg-blue-500 rounded-full animate-pulse" />
                Sync: Auto
             </div>
             <span>Última revisión: {lastSync.toLocaleTimeString("es-BO")}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => handleSync(false)}
            disabled={isSyncing}
            className="h-10 border-border font-black text-[10px] uppercase tracking-widest hover:bg-muted transition-all rounded-none"
          >
            <RefreshCw className={`size-3 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-40 bg-card border border-border text-[10px] font-black uppercase tracking-widest transition-all rounded-none hover:bg-muted/50">
              <SelectValue placeholder="ESTADO: TODOS" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="TODOS" className="text-[10px] font-black uppercase">TODOS LOS ESTADOS</SelectItem>
              <SelectItem value="LIBRE" className="text-[10px] font-black uppercase text-emerald-500">LIBRE (DISPONIBLES)</SelectItem>
              <SelectItem value="OCUPADO" className="text-[10px] font-black uppercase text-blue-500">OCUPADOS</SelectItem>
              <SelectItem value="SIN_CUENTAS" className="text-[10px] font-black uppercase text-orange-500">SIN CUENTAS</SelectItem>
              <SelectItem value="BLOQUEADO" className="text-[10px] font-black uppercase text-red-500">BLOQUEADOS</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenNew} className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest transition-all rounded-none shadow-lg shadow-blue-500/20">
                <Plus className="size-3 mr-2" /> Nuevo Bot
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl rounded-none border border-border" aria-describedby={undefined}>
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">
                  {editingId ? <>Editar <span className="text-blue-500">Dispositivo</span></> : <>Nuevo <span className="text-blue-500">Dispositivo</span></>}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Serial del Hardware</label><Input value={form.serial} onChange={(e) => setForm({ ...form, serial: e.target.value })} placeholder="Ej: ce0217..." className="rounded-none h-11" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Modelo de Equipo</label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Ej: Samsung S8" className="rounded-none h-11" /></div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Trigger ID</label><Input value={form.triggerId} onChange={(e) => setForm({ ...form, triggerId: e.target.value })} placeholder="trigger_..." className="rounded-none h-11" /></div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Estado</label>
                     <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as any })}>
                       <SelectTrigger className="rounded-none h-11 font-bold text-xs uppercase"><SelectValue /></SelectTrigger>
                       <SelectContent className="rounded-none">
                         <SelectItem value="LIBRE" className="text-xs uppercase font-bold text-emerald-500">LIBRE</SelectItem>
                         <SelectItem value="SIN_CUENTAS" className="text-xs uppercase font-bold text-orange-500">SIN CUENTAS</SelectItem>
                         <SelectItem value="OCUPADO" className="text-xs uppercase font-bold text-blue-500">OCUPADO</SelectItem>
                         <SelectItem value="BLOQUEADO" className="text-xs uppercase font-bold text-red-500">BLOQUEADO</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                </div>
                <Button type="submit" disabled={isPending} className="w-full h-12 bg-blue-600 font-black uppercase text-[11px] tracking-widest rounded-none mt-4">
                  {isPending ? <Loader2 className="animate-spin" /> : "Guardar Configuración"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* DEVICES TABLE */}
      <div className="bg-card border border-border shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-[10px] uppercase font-black tracking-widest px-8">Identificación Bot</TableHead>
              <TableHead className="text-[10px] uppercase font-black tracking-widest">Trigger ID</TableHead>
              <TableHead className="text-[10px] uppercase font-black tracking-widest">Cuentas</TableHead>
              <TableHead className="text-[10px] uppercase font-black tracking-widest text-center">Estado de Red</TableHead>
              <TableHead className="text-[10px] uppercase font-black tracking-widest">Último Sync</TableHead>
              <TableHead className="text-[10px] uppercase font-black tracking-widest text-right px-8">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredDevices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-xs uppercase font-bold text-muted-foreground italic tracking-widest opacity-30">
                   Sin dispositivos detectados con estos filtros
                </TableCell>
              </TableRow>
            ) : (
              sortedAndFilteredDevices.map((device) => (
                <TableRow key={device.id} className="border-border/50 hover:bg-muted/20 transition-all group">
                  <TableCell className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="size-12 bg-muted border border-border flex items-center justify-center flex-shrink-0 group-hover:border-blue-500/50 transition-colors">
                        <Smartphone className="size-6 text-muted-foreground/60 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                         <span className="text-[11px] font-black uppercase text-foreground truncate">
                           {device.personName || device.alias || device.serial}
                         </span>
                         {device.personName && (
                           <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-80 truncate">
                             Hardware: {device.serial}
                           </span>
                         )}
                         <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-60 italic">{device.model || "MODELO GENÉRICO"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-mono font-bold text-blue-500 underline underline-offset-4 decoration-blue-500/20">{device.triggerId || "SIN_TRIGGER"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      {Array.isArray(device.redesSociales) && device.redesSociales.length > 0 ? (
                        device.redesSociales.map((red: any, i: number) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${red.red_social === 'whatsapp' ? 'text-emerald-500' : red.red_social === 'facebook' ? 'text-blue-500' : 'text-muted-foreground'}`}>
                              {red.red_social === 'whatsapp' ? 'WA' : red.red_social === 'facebook' ? 'FB' : red.red_social}
                            </span>
                            <span className="text-[9px] font-bold opacity-70 truncate max-w-[120px]">
                              {red.red_social === 'whatsapp' 
                                ? (red.telefono_asociado || red.user || 'S/N') 
                                : (red.user || red.correo || 'N/A')}
                            </span>
                            <span className={`flex-shrink-0 size-1.5 rounded-full ${red.estado_cuenta === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} title={red.estado_cuenta} />
                          </div>
                        ))
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">Sin Cuentas</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`rounded-none font-black text-[8px] uppercase px-3 py-1 border-none shadow-sm ${
                      device.status === 'LIBRE' ? 'bg-emerald-500/10 text-emerald-500' :
                      device.status === 'SIN_CUENTAS' ? 'bg-orange-500/10 text-orange-500' :
                      device.status === 'OCUPADO' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {device.status === 'OCUPADO' && <RefreshCw className="size-2 mr-1.5 animate-spin" />}
                      {device.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                     <span className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(device.updatedAt).toLocaleTimeString("es-BO")}</span>
                  </TableCell>
                  <TableCell className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDetails(device)} className="size-9 rounded-none border border-border hover:bg-emerald-600 hover:text-white text-emerald-500 transition-all" title="Ver Detalles"><Eye className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(device)} className="size-9 rounded-none border border-border hover:bg-blue-600 hover:text-white transition-all" title="Editar"><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { setDeviceToDelete(device); setIsDeleteDialogOpen(true); }} className="size-9 rounded-none border border-border hover:bg-red-600 hover:text-white text-red-500 transition-all" title="Eliminar"><Trash2 className="size-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* DELETE DIALOG */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm rounded-none border-t-4 border-t-red-500 bg-card" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500 font-black uppercase italic tracking-tighter">
              <AlertCircle className="size-5" />
              Confirmar Eliminación
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight leading-relaxed">
              ¿Estás seguro de eliminar el dispositivo <span className="text-foreground font-black font-mono">{deviceToDelete?.serial}</span>? Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isPending} className="flex-1 rounded-none font-black uppercase text-[10px] h-11">Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending} className="flex-1 rounded-none font-black uppercase text-[10px] h-11">Eliminar Ahora</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* DETAILS DIALOG */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl rounded-none border border-border bg-card" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex flex-col gap-1 font-black uppercase tracking-tighter">
              <div className="flex items-center gap-2">
                <ScrollText className="size-5 text-blue-500" />
                <span className="text-xl">Detalles del <span className="text-blue-500">Bot</span></span>
              </div>
              <span className="text-xs text-muted-foreground font-mono tracking-widest">{deviceDetails?.serial}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-4">
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Identificador Lógico</span>
                 <p className="text-xs font-bold font-mono">{deviceDetails?.alias || "N/A"}</p>
               </div>
               <div>
                 <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Modelo de HW</span>
                 <p className="text-xs font-bold uppercase">{deviceDetails?.model || "Genérico"}</p>
               </div>
               <div>
                 <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Trigger Integrado</span>
                 <p className="text-xs font-bold font-mono text-blue-500">{deviceDetails?.triggerId || "Sin Asignar"}</p>
               </div>
               <div>
                 <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Estado en Granja (DB)</span>
                 <Badge variant="outline" className={`rounded-none text-[9px] uppercase ${deviceDetails?.estadoDb === 'active' ? 'text-emerald-500 border-emerald-500/30' : 'text-red-500 border-red-500/30'}`}>
                    {deviceDetails?.estadoDb || "N/A"}
                 </Badge>
               </div>
            </div>

            <div className="space-y-4">
              <span className="text-[11px] font-black uppercase text-foreground tracking-widest border-b border-border pb-2 block flex items-center gap-2">
                 <Smartphone className="size-4 text-blue-500" /> Cuentas Vinculadas (Redes Sociales)
              </span>
              
              {deviceDetails && Array.isArray(deviceDetails.redesSociales) && deviceDetails.redesSociales.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {deviceDetails.redesSociales.map((acc: any, idx: number) => (
                    <div key={idx} className="bg-muted/10 border border-border p-3 space-y-2 relative">
                       <Badge className={`absolute top-2 right-2 rounded-none text-[8px] uppercase ${acc.estado_cuenta === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                         {acc.estado_cuenta}
                       </Badge>
                       <div className="flex lg:items-center items-start gap-2 max-w-[80%]">
                         <span className={`px-2 py-0.5 text-[8px] font-black uppercase text-white ${acc.red_social === 'whatsapp' ? 'bg-emerald-600' : acc.red_social === 'facebook' ? 'bg-blue-600' : 'bg-gray-600'} rounded-none`}>
                           {acc.red_social}
                         </span>
                       </div>
                       
                       <div className="pt-2 space-y-1">
                          {acc.user && (
                            <div className="flex justify-between items-center text-[10px]">
                               <span className="text-muted-foreground font-bold uppercase tracking-widest">Titular:</span>
                               <span className="font-black uppercase truncate">{acc.user}</span>
                            </div>
                          )}
                          {acc.telefono_asociado && (
                            <div className="flex justify-between items-center text-[10px]">
                               <span className="text-muted-foreground font-bold uppercase tracking-widest">Línea WA:</span>
                               <span className="font-mono text-emerald-500 font-bold">{acc.telefono_asociado}</span>
                            </div>
                          )}
                          {acc.correo && (
                            <div className="flex justify-between items-center text-[10px]">
                               <span className="text-muted-foreground font-bold uppercase tracking-widest">Email:</span>
                               <span className="font-bold opacity-80 truncate" title={acc.correo}>{acc.correo}</span>
                            </div>
                          )}
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center border border-dashed border-border text-[10px] uppercase font-bold text-muted-foreground/50 tracking-widest">
                  Sin info. de redes en este dispositivo
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

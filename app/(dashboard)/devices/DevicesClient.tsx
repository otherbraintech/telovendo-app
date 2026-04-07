"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, Cpu, Trash2, Pencil, CheckCircle2, CircleDashed, AlertCircle, Bot, RefreshCw, Loader2, Smartphone } from "lucide-react";
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
  status: "LIBRE" | "OCUPADO" | "BLOQUEADO";
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
  const [lastSync, setLastSync] = useState<Date>(new Date());

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

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenNew} className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest transition-all rounded-none shadow-lg shadow-blue-500/20">
                <Plus className="size-3 mr-2" /> Nuevo Bot
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl rounded-none border border-border">
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
                         <SelectItem value="LIBRE" className="text-xs uppercase font-bold">LIBRE</SelectItem>
                         <SelectItem value="OCUPADO" className="text-xs uppercase font-bold">OCUPADO</SelectItem>
                         <SelectItem value="BLOQUEADO" className="text-xs uppercase font-bold">BLOQUEADO</SelectItem>
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
              <TableHead className="text-[10px] uppercase font-black tracking-widest text-center">Estado de Red</TableHead>
              <TableHead className="text-[10px] uppercase font-black tracking-widest">Último Sync</TableHead>
              <TableHead className="text-[10px] uppercase font-black tracking-widest text-right px-8">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-xs uppercase font-bold text-muted-foreground italic tracking-widest opacity-30">
                   Sin dispositivos detectados en el cluster
                </TableCell>
              </TableRow>
            ) : (
              devices.map((device) => (
                <TableRow key={device.id} className="border-border/50 hover:bg-muted/20 transition-all group">
                  <TableCell className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="size-12 bg-muted border border-border flex items-center justify-center flex-shrink-0 group-hover:border-blue-500/50 transition-colors">
                        <Smartphone className="size-6 text-muted-foreground/60 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                         <span className="text-[11px] font-black uppercase text-foreground truncate">{device.serial}</span>
                         <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60 italic">{device.model || "MODELO GENÉRICO"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-mono font-bold text-blue-500 underline underline-offset-4 decoration-blue-500/20">{device.triggerId || "SIN_TRIGGER"}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`rounded-none font-black text-[8px] uppercase px-3 py-1 border-none shadow-sm ${
                      device.status === 'LIBRE' ? 'bg-emerald-500/10 text-emerald-500' :
                      device.status === 'OCUPADO' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-red-500/10 text-red-500 text-white'
                    }`}>
                      {device.status === 'OCUPADO' && <RefreshCw className="size-2 mr-1.5 animate-spin" />}
                      {device.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                     <span className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(device.updatedAt).toLocaleTimeString("es-BO")}</span>
                  </TableCell>
                  <TableCell className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(device)} className="size-9 rounded-none border border-border hover:bg-blue-600 hover:text-white transition-all"><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { setDeviceToDelete(device); setIsDeleteDialogOpen(true); }} className="size-9 rounded-none border border-border hover:bg-red-600 hover:text-white text-red-500 transition-all"><Trash2 className="size-3.5" /></Button>
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
        <DialogContent className="max-w-sm rounded-none border-t-4 border-t-red-500 bg-card">
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
    </div>
  );
}

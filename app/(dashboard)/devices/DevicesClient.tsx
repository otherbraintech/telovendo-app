"use client";

import { useState, useTransition } from "react";
import { Plus, Cpu, Trash, Pencil, ShieldCheck, CheckCircle2, CircleDashed, AlertCircle, Bot } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createDevice, updateDevice, deleteDevice } from "@/lib/actions/devices";

type Device = {
  id: string;
  deviceName: string;
  personName: string | null;
  label: string | null;
  status: "LIBRE" | "OCUPADO" | "BLOQUEADO";
  createdAt: string;
};

export default function DevicesClient({ initialDevices }: { initialDevices: Device[] }) {
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    deviceName: "",
    personName: "",
    label: "",
    status: "LIBRE",
  });

  const handleOpenEdit = (d: Device) => {
    setEditingId(d.id);
    setForm({
      deviceName: d.deviceName,
      personName: d.personName || "",
      label: d.label || "",
      status: d.status,
    });
    setOpen(true);
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setForm({
      deviceName: "",
      personName: "",
      label: "",
      status: "LIBRE",
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.deviceName) return toast.error("El nombre del dispositivo es obligatorio");

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
        toast.error("Error al guardar dispositivo");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este dispositivo?")) return;
    startTransition(async () => {
      try {
        await deleteDevice(id);
        setDevices(prev => prev.filter(d => d.id !== id));
        toast.success("Dispositivo eliminado");
      } catch (error) {
        toast.error("Error al eliminar");
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "LIBRE": return <CheckCircle2 className="size-4 text-emerald-500" />;
      case "OCUPADO": return <CircleDashed className="size-4 text-amber-500 animate-spin-slow" />;
      case "BLOQUEADO": return <AlertCircle className="size-4 text-red-500" />;
      default: return <Cpu className="size-4 text-neutral-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER TÍTULO Y BOTÓN */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-blue-950 dark:text-blue-50 flex items-center gap-2">
            <Cpu className="size-6 text-emerald-500" /> Dispositivos Bot
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl">
            Gestión de los equipos físicos/virtuales que actúan como cuentas destino de la IA. Solo para administradores.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-transform hover:scale-[1.02]">
              <Plus className="size-4 mr-2" /> Agregar Dispositivo
            </Button>
          </DialogTrigger>
          <DialogContent className="border-emerald-500/20 bg-background/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-emerald-500 flex items-center gap-2">
                <Cpu className="size-5" /> 
                {editingId ? "Editar Dispositivo" : "Nuevo Dispositivo"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-neutral-500">Nombre del Dispositivo / Bot</label>
                <Input 
                  value={form.deviceName}
                  onChange={(e) => setForm({ ...form, deviceName: e.target.value })}
                  placeholder="Ej: BOT-001"
                  className="mt-1 bg-white/50 dark:bg-black/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-neutral-500">Encargado (Persona)</label>
                  <Input 
                    value={form.personName}
                    onChange={(e) => setForm({ ...form, personName: e.target.value })}
                    placeholder="Ej: Juan Perez"
                    className="mt-1 bg-white/50 dark:bg-black/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-neutral-500">Etiqueta</label>
                  <Input 
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    placeholder="Ej: Android"
                    className="mt-1 bg-white/50 dark:bg-black/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-neutral-500">Estado inicial</label>
                <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                  <SelectTrigger className="mt-1 bg-white/50 dark:bg-black/20">
                    <SelectValue placeholder="Seleccione un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LIBRE">Disponible / LIBRE</SelectItem>
                    <SelectItem value="OCUPADO">Trabajando / OCUPADO</SelectItem>
                    <SelectItem value="BLOQUEADO">Mantenimiento / BLOQUEADO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isPending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4">
                {isPending ? "Guardando..." : "Guardar Dispositivo"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* GRID DE DISPOSITIVOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {devices.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-emerald-500/20 rounded-xl bg-emerald-500/5">
             <Bot className="size-12 text-emerald-500/40 mb-3" />
             <p className="text-emerald-600/60 font-medium">No hay bots registrados</p>
          </div>
        ) : (
          devices.map((device) => (
            <div key={device.id} className="group relative border border-blue-500/10 rounded-xl p-4 bg-white/50 dark:bg-black/20 hover:border-emerald-500/30 transition-all overflow-hidden flex flex-col items-start gap-3 backdrop-blur-sm shadow-sm">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Bot className="size-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-wide text-foreground truncate max-w-[120px]">{device.deviceName}</h3>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-600/70">{device.label || "Sin Etiqueta"}</p>
                  </div>
                </div>
                <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-md text-[10px] items-center gap-1 font-mono tracking-widest uppercase text-muted-foreground">
                  {getStatusIcon(device.status)}
                  {device.status}
                </div>
              </div>

              <div className="w-full text-xs text-neutral-500 dark:text-neutral-400 mt-1 pl-1">
                 Persona: <span className="font-medium text-foreground">{device.personName || "N/A"}</span>
              </div>

              {/* Acciones flotantes */}
              <div className="w-full pt-3 mt-auto border-t border-blue-500/5 flex justify-end gap-2 opacity-10 md:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="size-8 hover:text-emerald-500 hover:bg-emerald-500/10" onClick={() => handleOpenEdit(device)}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8 hover:text-red-500 hover:bg-red-500/10" onClick={() => handleDelete(device.id)}>
                  <Trash className="size-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

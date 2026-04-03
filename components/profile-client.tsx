"use client";

import { useTransition, useState } from "react";
import { User, Mail, Shield, Calendar, Package, Zap } from "lucide-react";
import { updateProfile } from "@/lib/actions/auth";

export default function ProfilePage({ user, stats }: { user: any, stats: any }) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(user.name);
  const [message, setMessage] = useState("");

  const handleUpdate = () => {
    startTransition(async () => {
      try {
        await updateProfile({ name });
        setMessage("Perfil actualizado correctamente");
        setTimeout(() => setMessage(""), 3000);
      } catch (e) {
        setMessage("Error al actualizar perfil");
      }
    });
  };

  return (
    <div className="space-y-10 max-w-4xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground">
          Mi <span className="text-blue-500">Cuenta</span>
        </h1>
        <p className="text-xs text-muted-foreground">Configura tus datos personales y revisa tu actividad.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-border p-8 shadow-sm space-y-8">
            <div className="flex items-center gap-6">
              <div className="size-20 flex items-center justify-center bg-transparent">
                <img src="/iconTeloVendo.svg" alt="TeloVendo Bot" className="w-full h-full object-contain" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-black uppercase tracking-tight text-foreground">{user.name}</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="size-3 text-blue-500" />
                  <span className="font-mono uppercase tracking-widest">{user.role}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <User className="size-3" /> Nombre Público
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border px-4 py-3 text-sm text-foreground outline-none focus:border-blue-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <Mail className="size-3" /> Email / Usuario
                </label>
                <input 
                  disabled
                  type="text" 
                  value={user.username}
                  className="w-full bg-muted border border-border px-4 py-3 text-sm text-muted-foreground/60 outline-none cursor-not-allowed font-mono"
                />
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{message}</p>
              <button 
                onClick={handleUpdate}
                disabled={isPending || name === user.name}
                className="w-full sm:w-auto h-11 px-8 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
              >
                {isPending ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
              </button>
            </div>
          </div>
        </div>

        {/* Stats / Activity */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 border-b border-sidebar-border pb-3">Estadísticas</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 text-blue-500">
                    <Package className="size-4" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Proyectos</span>
                </div>
                <span className="text-lg font-black italic">{stats.projectCount}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 text-amber-500">
                    <Zap className="size-4" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Publicaciones</span>
                </div>
                <span className="text-lg font-black italic">{stats.orderCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 border-b border-sidebar-border pb-3">Última Actividad</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="size-3 mt-0.5 text-muted-foreground/40" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-muted-foreground opacity-50 uppercase font-bold">Unido al sistema</span>
                  <span className="text-[10px] font-bold uppercase tracking-tighter">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString("es-BO") : "FECHA NO DISPONIBLE"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useProjectStore } from "@/hooks/use-project-store"
import { Shield, Activity, Clock, Server, CheckCircle2, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"

const dummyLogs = [
  { id: 1, type: "SUCCESS", event: "Publicación enviada", time: "Hace 5 minutos", details: "Facebook Marketplace · Ropa dama" },
  { id: 2, type: "INFO", event: "Sistema actualizado", time: "Hace 12 minutos", details: "Bots listos para nuevas tareas" },
  { id: 3, type: "SUCCESS", event: "Proyecto creado", time: "Hace 1 hora", details: "Proyecto: Venta Verano activado" },
  { id: 4, type: "WARNING", event: "Reintento de publicación", time: "Hace 2 horas", details: "El bot reintenció la publicación automáticamente" },
]

export default function HistoryPage() {
  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-foreground">
          Historial de <span className="text-blue-500">Actividad</span>
        </h1>
        <p className="text-xs text-muted-foreground">
          Aquí puedes ver todo lo que ha pasado en tu cuenta: publicaciones, bots y cambios.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Lista de eventos */}
        <div className="lg:col-span-2 space-y-3">
          {dummyLogs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border p-4 md:p-6 hover:border-blue-500/20 transition-all flex items-start gap-4 shadow-sm"
            >
              <div className={`mt-0.5 size-9 shrink-0 flex items-center justify-center border ${
                log.type === "SUCCESS" ? "border-green-500/20 text-green-500 bg-green-500/5" :
                log.type === "WARNING" ? "border-amber-500/20 text-amber-500 bg-amber-500/5" :
                "border-blue-500/20 text-blue-500 bg-blue-500/5"
              }`}>
                {log.type === "SUCCESS" ? <CheckCircle2 className="size-4" /> :
                 log.type === "WARNING" ? <AlertTriangle className="size-4" /> :
                 <Activity className="size-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-foreground truncate">{log.event}</h3>
                  <span className="text-[9px] text-muted-foreground shrink-0">{log.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Panel de estado */}
        <div className="space-y-4">
          <div className="bg-blue-600 text-white p-6 space-y-4 shadow-md relative overflow-hidden">
            <Shield className="absolute -top-4 -right-4 size-28 text-white/10 rotate-12" />
            <div className="relative z-10">
              <p className="text-[9px] uppercase font-black tracking-widest opacity-70">Seguridad</p>
              <div className="text-3xl font-black italic">Todo bien</div>
            </div>
            <p className="text-[10px] leading-relaxed opacity-80 relative z-10">
              Tu cuenta está protegida. Toda la actividad es segura y transparente.
            </p>
          </div>

          <div className="bg-card border border-border p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-blue-500">
              <Server className="size-4" />
              <h4 className="text-xs font-black uppercase tracking-wider">Estado de los bots</h4>
            </div>
            <div className="space-y-3">
              {["Bot 1", "Bot 2", "Bot 3"].map((name, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{name}</span>
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] text-green-500 font-bold">Activo</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

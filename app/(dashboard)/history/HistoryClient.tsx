"use client";

import { useMemo, useState } from "react"
import { 
  Shield, 
  Activity, 
  Clock, 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  Bot, 
  Terminal,
  Zap,
  LayoutDashboard,
  ArrowUpRight,
  Database,
  RefreshCw
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface HistoryClientProps {
  initialLogs: any[]
}

export default function HistoryClient({ initialLogs }: HistoryClientProps) {
  const [filter, setFilter] = useState("TODOS");
  const [logs, setLogs] = useState(initialLogs);

  const filteredLogs = useMemo(() => {
    if (filter === "TODOS") return logs;
    return logs.filter((log: any) => log.category === filter);
  }, [filter, logs]);

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto">
      {/* HEADER CON DISEÑO MINIMALISTA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border/40 pb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-foreground flex items-center gap-4">
             <Activity className="size-10 text-blue-500 animate-pulse" />
             Registro de <span className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">Actividad</span>
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] font-bold border-l-2 border-blue-500/30 pl-4">
            Actividad registrada en tu cuenta del sistema ({filteredLogs.length} eventos)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-12 w-56 bg-card/50 backdrop-blur-sm border border-border/60 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-blue-500/50 transition-all rounded-none hover:bg-muted/30">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-blue-500/40" />
                <SelectValue placeholder="TODOS LOS EVENTOS" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-50 bg-card border-border rounded-none shadow-2xl">
                <SelectItem value="TODOS" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">TODOS LOS EVENTOS</SelectItem>
                <SelectItem value="BOT" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">BOTS</SelectItem>
                <SelectItem value="SISTEMA" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">SISTEMA</SelectItem>
                <SelectItem value="PROYECTO" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">PROYECTOS</SelectItem>
                <SelectItem value="PUBLICACIÓN" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">PUBLICACIONES</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* LOGS LIST */}
        <div className="space-y-5">
          {filteredLogs.map((log: any, i: number) => (
            <div
              key={log.id}
              className="group relative bg-card/60 backdrop-blur-sm border border-border/60 p-6 md:p-8 hover:border-blue-500/40 transition-all flex item-start gap-6 md:gap-8 shadow-sm overflow-hidden rounded-sm"
            >
              {/* INDICATOR LINE */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                log.type === "SUCCESS" ? "bg-green-500/50" :
                log.type === "WARNING" ? "bg-amber-500/50" :
                "bg-blue-500/50"
              }`} />

              <div className={`size-14 shrink-0 flex items-center justify-center border ${
                log.type === "SUCCESS" ? "border-green-500/30 text-green-500 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.1)]" :
                log.type === "WARNING" ? "border-amber-500/30 text-amber-500 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.1)]" :
                "border-blue-500/30 text-blue-500 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
              } transition-all group-hover:scale-105 duration-500`}>
                {log.category === "BOT" ? <Bot className="size-6" /> :
                 log.category === "SISTEMA" ? <Cpu className="size-6 rotate-90" /> :
                 log.category === "PROYECTO" ? <LayoutDashboard className="size-6" /> :
                 log.type === "SUCCESS" ? <CheckCircle2 className="size-6" /> :
                 <Activity className="size-6" />}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-[8px] font-black px-2 py-0.5 border ${
                      log.category === "BOT" ? "border-blue-500/30 text-blue-500 bg-blue-500/5" :
                      log.category === "SISTEMA" ? "border-purple-500/30 text-purple-500 bg-purple-500/5" :
                      log.category === "PROYECTO" ? "border-amber-500/30 text-amber-500 bg-amber-500/5" :
                      "border-neutral-500/30 text-neutral-500 bg-neutral-500/5"
                    } uppercase tracking-[0.25em] font-mono`}>{log.category}</span>
                    <h3 className="text-base font-black text-foreground uppercase tracking-tight group-hover:text-blue-500 transition-colors">{log.event}</h3>
                  </div>
                  <div className="flex items-center gap-5">
                    <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Clock className="size-3.5" />
                      {log.time}
                    </span>
                    <span className={`text-[9px] font-black tabular-nums px-3 py-1 border transition-all ${
                        log.status === "COMPLETADA" || log.status === "PUBLICADO" ? "bg-green-500/5 border-green-500/20 text-green-500" :
                        log.status === "LISTA" || log.status === "ACTIVE" ? "bg-blue-500/5 border-blue-500/20 text-blue-500" :
                        "bg-muted border-border/50 text-muted-foreground"
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-black uppercase tracking-wider leading-relaxed max-w-3xl opacity-70 group-hover:opacity-100 transition-opacity">
                  {log.details}
                </p>
              </div>

              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-500">
                 <ArrowUpRight className="size-5 text-blue-500/40" />
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="py-32 text-center border border-dashed border-border/60 bg-card/20 backdrop-blur-sm rounded-sm">
               <div className="relative inline-block mb-6">
                 <Database className="size-16 text-muted-foreground/10 mx-auto" />
                 <div className="absolute inset-0 size-16 border-2 border-blue-500/10 rounded-full animate-ping mx-auto" />
               </div>
               <p className="text-[11px] font-black uppercase tracking-[0.6em] text-muted-foreground/50">Base de datos sin ciclos registrados</p>
               <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 mt-2">Inicia una operación para generar logs de actividad real</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function Cpu(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>
    </svg>
  )
}

"use client";

import { useProjectStore } from "@/hooks/use-project-store"
import { Bot, History, ArrowUpRight, LayoutGrid, CheckCircle2, ListFilter } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { CountUp, RevealText, ScanlineBackground } from "@/components/dashboard-effects"
import { useState } from "react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function DashboardClient({ initialProjects, initialPublicationsCount }: { initialProjects: any[], initialPublicationsCount: number }) {
  const [projects] = useState(initialProjects);

  return (
    <div className="space-y-8 relative overflow-hidden">
      <ScanlineBackground />

      {/* Título */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 relative z-10"
      >
        <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-foreground">
          <RevealText>Resumen</RevealText>
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
          <p className="text-[10px] font-mono uppercase tracking-widest sm:tracking-[0.5em] text-blue-500/70">
            Bots: <span className="text-cyan-400 font-black">Listos</span>
          </p>
          <div className="h-1 w-1 bg-blue-500/20 rounded-full hidden sm:block" />
          <p className="text-[10px] font-mono uppercase tracking-widest sm:tracking-[0.5em] text-amber-500/70">
            Plan: <span className="font-black text-amber-400">Premium</span>
          </p>
        </div>
      </motion.div>

      {/* Estadísticas */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 relative z-10"
      >
        <DashboardCard
          title="Mis Proyectos"
          value={projects.length}
          icon={<LayoutGrid className="size-4" />}
          accent="text-blue-500"
          href="/projects"
        />
        <DashboardCard
          title="Bots"
          value={20}
          icon={<Bot className="size-4 text-amber-500" />}
          accent="text-amber-500"
          href="/marketplace-bot"
        />
        <DashboardCard
          title="Publicaciones"
          value={initialPublicationsCount}
          icon={<CheckCircle2 className="size-4 text-cyan-400" />}
          accent="text-cyan-400"
          href="/orders"
        />
        <DashboardCard
          title="Éxito"
          value={99}
          suffix="%"
          icon={<History className="size-4 text-green-500" />}
          accent="text-green-500"
          href="/history"
        />
      </motion.div>

      {/* Acción principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="lg:col-span-2 group"
        >
          <Link
            href="/marketplace-bot"
            className="relative flex flex-col justify-between min-h-[220px] md:h-[300px] bg-card overflow-hidden border border-border hover:border-blue-500/60 transition-all duration-700 shadow-sm p-6 md:p-12"
          >
            <div className="absolute inset-x-0 top-0 h-[1px] bg-blue-500 shadow-[0_0_20px_blue] group-hover:h-[2px] transition-all" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 0)', backgroundSize: '32px 32px' }} />

            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-3">
                <span className="px-3 py-1 bg-blue-500 text-white text-[8px] font-black uppercase tracking-[0.3em]">Nueva Publicación</span>
                <h3 className="text-3xl md:text-5xl font-black uppercase text-foreground italic tracking-tighter leading-tight">
                  Vender en<br /><span className="text-blue-500">Marketplace</span>
                </h3>
              </div>
              <div className="p-3 md:p-4 border border-blue-500/10 group-hover:scale-105 group-hover:rotate-6 transition-all duration-500 bg-blue-500/10 hidden sm:block">
                <Bot className="size-12 md:size-16 text-blue-500 opacity-60" />
              </div>
            </div>

            <div className="flex items-end justify-between relative z-10 mt-4">
              <div className="w-full space-y-3">
                <p className="text-xs sm:text-[10px] uppercase font-bold tracking-wider sm:tracking-[0.2em] text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors pr-4 sm:pr-0">
                  Publica tus productos en Facebook y deja que el bot lo haga automáticamente.
                </p>
                <div className="flex items-center gap-2 sm:gap-3 text-[10px] font-black uppercase tracking-widest sm:tracking-[0.4em] text-blue-500 group-hover:text-cyan-400 transition-colors">
                  Crear publicación <ArrowUpRight className="size-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Lista de Proyectos */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="bg-card border border-border flex flex-col max-h-[300px] md:h-[300px] hover:border-blue-500/40 transition-all duration-500 relative overflow-hidden shadow-sm"
        >
          <div className="bg-muted px-4 md:px-6 py-3 md:py-4 border-b border-border flex items-center justify-between shrink-0">
            <h3 className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em]">Mis Proyectos</h3>
            <ListFilter className="size-3 text-blue-500 opacity-40" />
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {projects.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between group/item opacity-60 hover:opacity-100 transition-all">
                <span className="text-[10px] uppercase font-black text-foreground group-hover/item:text-blue-500 transition-all truncate max-w-[160px]">{p.name}</span>
                <div className="text-[8px] font-mono text-green-500 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">Activo</div>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-[9px] uppercase font-bold text-muted-foreground italic tracking-[0.3em] pt-6 text-center">Aún no tienes proyectos.</p>
            )}
          </div>

          <Link href="/projects" className="p-4 border-t border-border text-center text-[9px] uppercase font-black tracking-[0.3em] text-blue-500/60 hover:text-blue-500 hover:bg-muted transition-all shrink-0">
            Ver todos mis proyectos
          </Link>
        </motion.div>

      </div>
    </div>
  )
}

function DashboardCard({ title, value, icon, href, accent, suffix = "" }: { title: string, value: number, icon: React.ReactNode, href: string, accent: string, suffix?: string }) {
  return (
    <motion.div variants={item}>
      <Link href={href} className="bg-card border border-border p-4 md:p-6 flex flex-col gap-3 md:gap-6 hover:border-blue-500/40 transition-all duration-500 group relative block overflow-hidden shadow-sm">
        <div className="flex items-center justify-between text-blue-500/30 group-hover:text-blue-500/70 transition-colors">
          {icon}
          <div className="size-1 rounded-full bg-blue-500/20 group-hover:animate-pulse" />
        </div>
        <div className="space-y-1">
          <div className="text-3xl md:text-5xl font-black text-foreground italic tracking-tighter group-hover:text-blue-500 transition-all">
            <CountUp value={value} />{suffix}
          </div>
          <div className={`text-[8px] md:text-[9px] uppercase font-black tracking-[0.2em] md:tracking-[0.3em] ${accent}`}>{title}</div>
        </div>
      </Link>
    </motion.div>
  )
}

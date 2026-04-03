"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

export function ModeToggle() {
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme } = useTheme()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative flex items-center gap-3 h-10 px-4 border border-blue-500/20 hover:border-blue-500 hover:bg-blue-500/5 transition-all text-blue-500 group overflow-hidden cursor-pointer"
    >
      <div className="relative size-4 shrink-0">
        <motion.div
           animate={{ rotate: mounted && theme === "dark" ? 0 : 90, scale: mounted && theme === "dark" ? 0 : 1, opacity: mounted && theme === "dark" ? 0 : 1 }}
           className="absolute inset-0"
        >
          <Sun className="size-4" />
        </motion.div>
        <motion.div
           animate={{ rotate: mounted && theme === "dark" ? 0 : -90, scale: mounted && theme === "dark" ? 1 : 0, opacity: mounted && theme === "dark" ? 1 : 0 }}
           className="absolute inset-0"
        >
          <Moon className="size-4" />
        </motion.div>
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest hidden md:inline-block w-20 text-left">
        {mounted ? (theme === "dark" ? "Modo Oscuro" : "Modo Claro") : "Cargando..."}
      </span>
    </button>
  )
}

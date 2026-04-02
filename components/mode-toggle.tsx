"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative flex items-center gap-3 h-10 px-4 border border-blue-500/20 hover:border-blue-500 hover:bg-blue-500/5 transition-all text-blue-500 group overflow-hidden"
    >
      <div className="relative size-4">
        <motion.div
           animate={{ rotate: theme === "dark" ? 0 : 90, scale: theme === "dark" ? 0 : 1, opacity: theme === "dark" ? 0 : 1 }}
           className="absolute inset-0"
        >
          <Sun className="size-4" />
        </motion.div>
        <motion.div
           animate={{ rotate: theme === "dark" ? 0 : -90, scale: theme === "dark" ? 1 : 0, opacity: theme === "dark" ? 1 : 0 }}
           className="absolute inset-0"
        >
          <Moon className="size-4" />
        </motion.div>
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest hidden md:inline-block">
        {theme === "dark" ? "Modo Oscuro" : "Modo Claro"}
      </span>
    </button>
  )
}

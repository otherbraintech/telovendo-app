"use client";

import { useState, useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

export function CountUp({ value }: { value: number }) {
  const springValue = useSpring(0, { stiffness: 50, damping: 20 });
  const displayValue = useTransform(springValue, (val) => Math.floor(val));
    
  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  return <motion.span>{displayValue}</motion.span>;
}

export function RevealText({ children }: { children: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}

export function ScanlineBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
      <div className="w-full h-[2px] bg-blue-500 animate-[scan_3s_linear_infinite]" />
      <style jsx>{`
        @keyframes scan {
          from { transform: translateY(-100%); }
          to { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  )
}

"use client"

import { useEffect, useState, useMemo } from "react"

export function BotAnimation() {
  const [nodes, setNodes] = useState<{ id: number; x: number; y: number; size: number }[]>([])

  useEffect(() => {
    const newNodes = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
    }))
    setNodes(newNodes)
  }, [])

  const connections = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = []
    if (nodes.length === 0) return lines
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < Math.min(i + 3, nodes.length); j++) {
        lines.push({
          x1: nodes[i].x,
          y1: nodes[i].y,
          x2: nodes[j].x,
          y2: nodes[j].y,
        })
      }
    }
    return lines
  }, [nodes])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 select-none">
      <svg className="w-full h-full" preserveAspectRatio="none">
        {connections.map((line, i) => (
          <line
            key={`l-${i}`}
            x1={`${line.x1}%`}
            y1={`${line.y1}%`}
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-blue-500/30 animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
        {nodes.map((node, i) => (
          <circle
            key={`node-${i}`}
            cx={`${node.x}%`}
            cy={`${node.y}%`}
            r={node.size}
            className="fill-blue-500/40"
          />
        ))}
      </svg>
    </div>
  )
}

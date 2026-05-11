'use client'

import { useCallback, useRef, useState } from 'react'

const INITIAL_NODES = [
  { id: '1', label: 'Client', x: 60, y: 160, color: '#7C6AEF' },
  { id: '2', label: 'Load Balancer', x: 220, y: 160, color: '#1D202A' },
  { id: '3', label: 'App Server', x: 400, y: 80, color: '#1D202A' },
  { id: '4', label: 'App Server', x: 400, y: 200, color: '#1D202A' },
  { id: '5', label: 'Database', x: 580, y: 130, color: '#3ECF8E' },
  { id: '6', label: 'Redis Cache', x: 580, y: 230, color: '#E5A93B' },
  { id: '7', label: 'CDN', x: 220, y: 280, color: '#9585F5' },
]

const EDGES = [
  ['1', '2'],
  ['2', '3'],
  ['2', '4'],
  ['3', '5'],
  ['4', '5'],
  ['3', '6'],
  ['4', '6'],
  ['1', '7'],
]

interface DragState {
  id: string
  ox: number
  oy: number
}

export function DiagramCanvas() {
  const [nodes, setNodes] = useState(INITIAL_NODES)
  const dragging = useRef<DragState | null>(null)

  const onMouseDown = (event: React.MouseEvent, id: string) => {
    event.preventDefault()
    const node = nodes.find((current) => current.id === id)
    if (!node) return
    dragging.current = { id, ox: event.clientX - node.x, oy: event.clientY - node.y }
  }

  const onMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragging.current) return
    const { id, ox, oy } = dragging.current
    setNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, x: event.clientX - ox, y: event.clientY - oy } : node,
      ),
    )
  }, [])

  const onMouseUp = () => {
    dragging.current = null
  }

  const getNode = (id: string) => nodes.find((node) => node.id === id)

  return (
    <svg
      className="w-full h-full"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{ cursor: dragging.current ? 'grabbing' : 'default' }}
    >
      {EDGES.map(([a, b]) => {
        const from = getNode(a)
        const to = getNode(b)
        if (!from || !to) return null
        return (
          <line
            key={`${a}-${b}`}
            x1={from.x + 50}
            y1={from.y + 18}
            x2={to.x + 50}
            y2={to.y + 18}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        )
      })}

      {nodes.map((node) => (
        <g
          key={node.id}
          transform={`translate(${node.x}, ${node.y})`}
          style={{ cursor: 'grab' }}
          onMouseDown={(event) => onMouseDown(event, node.id)}
        >
          <rect width={100} height={36} rx={4} fill={node.color} />
          <text
            x={50}
            y={22}
            textAnchor="middle"
            fill="#fff"
            style={{ fontSize: 11, fontWeight: 500, userSelect: 'none' }}
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

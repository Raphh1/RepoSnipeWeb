import { useState, useCallback, useEffect, useRef } from 'react'

interface FloatEntry {
  id: number
  text: string
  color: string
  x: number
  y: number
  born: number
}

let _nextId = 0
const LIFETIME = 1200 // ms

export function useFloatingNumbers() {
  const [entries, setEntries] = useState<FloatEntry[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (entries.length === 0) return
    const t = setInterval(() => {
      const now = Date.now()
      setEntries(es => es.filter(e => now - e.born < LIFETIME))
    }, 100)
    return () => clearInterval(t)
  }, [entries.length])

  const fire = useCallback((text: string, color: string, x?: number, y?: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    const cx = x ?? (rect ? rect.width / 2 : 50)
    const cy = y ?? (rect ? rect.height / 2 : 50)
    const jitter = (Math.random() - 0.5) * 40
    setEntries(es => [...es, { id: _nextId++, text, color, x: cx + jitter, y: cy, born: Date.now() }])
  }, [])

  return { containerRef, entries, fire }
}

interface FloatingNumbersLayerProps {
  entries: FloatEntry[]
}

export function FloatingNumbersLayer({ entries }: FloatingNumbersLayerProps) {
  return (
    <>
      {entries.map(e => {
        const age = Date.now() - e.born
        const progress = age / LIFETIME
        const opacity = Math.max(0, 1 - progress * progress)
        const translateY = -progress * 60
        return (
          <div
            key={e.id}
            style={{
              position: 'absolute',
              left: e.x,
              top: e.y,
              transform: `translate(-50%, calc(-50% + ${translateY}px))`,
              opacity,
              color: e.color,
              fontFamily: 'monospace',
              fontSize: '13px',
              fontWeight: 'bold',
              letterSpacing: '1px',
              pointerEvents: 'none',
              textShadow: `0 0 8px ${e.color}`,
              whiteSpace: 'nowrap',
              zIndex: 100,
              transition: 'none',
            }}
          >
            {e.text}
          </div>
        )
      })}
    </>
  )
}

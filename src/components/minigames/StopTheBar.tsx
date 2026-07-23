import { useState, useEffect, useRef } from 'react'

export type StopResult = 'perfect' | 'good' | 'miss'

interface StopTheBarProps {
  difficulty: 1 | 2 | 3
  label?: string
  onResult: (result: StopResult) => void
}

export function StopTheBar({ difficulty, label = 'FORÇAGE DE SERRURE', onResult }: StopTheBarProps) {
  const posRef = useRef(0)
  const dirRef = useRef(1)
  const [pos, setPos]         = useState(0)
  const [stopped, setStopped] = useState(false)
  const [result, setResult]   = useState<StopResult | null>(null)

  // Zone verte: difficulty 1 = 22% wide, 2 = 14% wide, 3 = 8% wide
  const zoneWidth  = [22, 14, 8][difficulty - 1]
  const zoneStart  = 50 - zoneWidth / 2
  const zoneEnd    = 50 + zoneWidth / 2
  const speed      = [1.2, 2.0, 3.2][difficulty - 1]

  useEffect(() => {
    if (stopped) return
    const t = setInterval(() => {
      posRef.current += dirRef.current * speed
      if (posRef.current >= 100) { posRef.current = 100; dirRef.current = -1 }
      if (posRef.current <= 0)   { posRef.current = 0;   dirRef.current = 1 }
      setPos(posRef.current)
    }, 16)
    return () => clearInterval(t)
  }, [stopped, speed])

  function stop() {
    if (stopped) return
    setStopped(true)
    const p = posRef.current
    let r: StopResult
    if (p >= zoneStart && p <= zoneEnd) {
      const dist = Math.abs(p - 50)
      r = dist < zoneWidth * 0.25 ? 'perfect' : 'good'
    } else {
      r = 'miss'
    }
    setResult(r)
    setTimeout(() => onResult(r), 800)
  }

  const RESULT_COLOR = { perfect: 'var(--gold)', good: 'var(--green)', miss: 'var(--red)' }
  const RESULT_LABEL = { perfect: '★ PARFAIT', good: '◆ RÉUSSI', miss: '✗ RATÉ' }

  return (
    <div className="layout">
      <div className="t-xs t-dim t-center">— {label} —</div>

      <div className="px-box">
        <div className="t-xs t-dim mb8">STOPPE LA BARRE DANS LA ZONE VERTE</div>
        <div style={{ position: 'relative', height: '32px', background: 'var(--bg)', border: '2px solid var(--border)', marginBottom: '8px' }}>
          {/* Zone verte */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: `${zoneStart}%`, width: `${zoneWidth}%`,
            background: 'rgba(64, 255, 128, 0.18)',
            borderLeft: '2px solid var(--green)', borderRight: '2px solid var(--green)',
          }} />
          {/* Curseur */}
          <div style={{
            position: 'absolute', top: '2px', bottom: '2px',
            left: `${pos}%`, width: '6px', marginLeft: '-3px',
            background: stopped ? (result === 'miss' ? 'var(--red)' : 'var(--gold)') : 'var(--text-bright)',
            transition: stopped ? 'none' : undefined,
          }} />
        </div>
        <div className="t-xs t-dim" style={{ textAlign: 'right' }}>
          Difficulté : {'■'.repeat(difficulty)}{'□'.repeat(3 - difficulty)}
        </div>
      </div>

      {!stopped && (
        <button className="px-btn px-btn--primary" onClick={stop} style={{ fontSize: '12px', padding: '18px', textAlign: 'center' }}>
          ► STOP !
        </button>
      )}

      {result && (
        <div className="px-box t-center" style={{ borderColor: RESULT_COLOR[result] }}>
          <div className="t-sm" style={{ color: RESULT_COLOR[result] }}>{RESULT_LABEL[result]}</div>
        </div>
      )}
    </div>
  )
}

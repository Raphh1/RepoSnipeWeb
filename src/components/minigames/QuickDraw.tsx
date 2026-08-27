import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  difficulty: 1 | 2 | 3
  label?: string
  onResult: (mult: number) => void
}

const ROUNDS = 3
const WINDOW_MS = [950, 680, 450]

export function QuickDraw({ difficulty, label, onResult }: Props) {
  const { t } = useTranslation('minigames')
  const displayLabel = label ?? t('quickDraw.defaultLabel')
  const windowMs = WINDOW_MS[difficulty - 1]

  const [started, setStarted] = useState(false)
  const [targetPos, setTargetPos] = useState<{ x: number; y: number } | null>(null)
  const [feedback, setFeedback] = useState<'hit' | 'miss' | null>(null)
  const [results, setResults] = useState<boolean[]>([])
  const [done, setDone] = useState(false)

  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resultsRef = useRef<boolean[]>([])

  function clearTimer() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }

  function computeMult(hits: boolean[]): number {
    const count = hits.filter(Boolean).length
    if (count === 3) return 1.8
    if (count >= 2) return 1.2
    return 0.45
  }

  function spawnTarget(round: number) {
    if (round >= ROUNDS) {
      setDone(true)
      const mult = computeMult(resultsRef.current)
      timerRef.current = setTimeout(() => onResult(mult), 900)
      return
    }
    const x = 10 + Math.random() * 73
    const y = 10 + Math.random() * 65
    setTargetPos({ x, y })
    setFeedback(null)
    timerRef.current = setTimeout(() => {
      resultsRef.current = [...resultsRef.current, false]
      setResults([...resultsRef.current])
      setTargetPos(null)
      setFeedback('miss')
      timerRef.current = setTimeout(() => spawnTarget(round + 1), 380)
    }, windowMs)
  }

  useEffect(() => {
    timerRef.current = setTimeout(() => { setStarted(true); spawnTarget(0) }, 400)
    return () => clearTimer()
  }, [])

  function handleClick() {
    if (!targetPos || done) return
    clearTimer()
    resultsRef.current = [...resultsRef.current, true]
    setResults([...resultsRef.current])
    setTargetPos(null)
    setFeedback('hit')
    const next = resultsRef.current.length
    timerRef.current = setTimeout(() => spawnTarget(next), 350)
  }

  const hitCount = results.filter(Boolean).length
  const mult = computeMult(results)

  return (
    <div className="layout">
      <div className="t-xs t-dim t-center">— {displayLabel} —</div>

      <div className="px-box">
        <div className="t-xs t-dim mb8">{t('quickDraw.instructions')}</div>

        <div
          onClick={handleClick}
          style={{
            position: 'relative',
            width: '100%', height: '168px',
            background: 'var(--bg)',
            border: `2px solid ${feedback === 'hit' ? 'var(--green)' : feedback === 'miss' ? 'var(--red)' : 'var(--border)'}`,
            cursor: targetPos ? 'crosshair' : 'default',
            overflow: 'hidden',
            marginBottom: '8px',
            transition: 'border-color 0.1s',
          }}
        >
          {/* Flash overlay */}
          {feedback === 'hit' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(64,255,128,0.07)', pointerEvents: 'none' }} />
          )}
          {feedback === 'miss' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,64,64,0.07)', pointerEvents: 'none' }} />
          )}

          {/* Target crosshair */}
          {targetPos && (
            <div style={{
              position: 'absolute',
              left: `${targetPos.x}%`, top: `${targetPos.y}%`,
              transform: 'translate(-50%, -50%)',
              width: '48px', height: '48px',
              pointerEvents: 'none',
            }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--cyan)', boxShadow: '0 0 12px var(--cyan)' }} />
              <div style={{ position: 'absolute', inset: '10px', borderRadius: '50%', border: '1px solid rgba(0,255,255,0.35)' }} />
              <div style={{ position: 'absolute', top: '50%', left: '5px', right: '5px', height: '1px', background: 'var(--cyan)', transform: 'translateY(-50%)' }} />
              <div style={{ position: 'absolute', left: '50%', top: '5px', bottom: '5px', width: '1px', background: 'var(--cyan)', transform: 'translateX(-50%)' }} />
              <div style={{ position: 'absolute', inset: '21px', borderRadius: '50%', background: 'var(--cyan)', opacity: 0.85 }} />
            </div>
          )}

          {!started && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dim)', fontSize: '10px', letterSpacing: '2px' }}>
              {t('reactFlash.ready')}
            </div>
          )}

          {done && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <div style={{ fontSize: '20px', color: mult >= 1.5 ? 'var(--gold)' : mult >= 1.0 ? 'var(--green)' : 'var(--red)' }}>
                {t('quickDraw.hits', { hits: hitCount })}
              </div>
              <div className="t-xs t-dim">{t('reactFlash.damageMult', { mult: mult.toFixed(2) })}</div>
            </div>
          )}

          {/* Progress dots */}
          <div style={{ position: 'absolute', bottom: '7px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '7px' }}>
            {Array.from({ length: ROUNDS }).map((_, i) => (
              <div key={i} style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: i < results.length
                  ? (results[i] ? 'var(--green)' : 'var(--red)')
                  : i === results.length ? 'var(--cyan)' : 'var(--border)',
              }} />
            ))}
          </div>
        </div>

        <div className="t-xs t-dim" style={{ textAlign: 'right' }}>
          {t('reactFlash.difficulty', { filled: '■'.repeat(difficulty), empty: '□'.repeat(3 - difficulty) })}
        </div>
      </div>
    </div>
  )
}

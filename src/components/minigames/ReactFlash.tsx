import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  difficulty: 1 | 2 | 3
  label?: string
  onResult: (mult: number) => void
}

const COLORS = ['ROUGE', 'BLEU', 'VERT'] as const
type Color = (typeof COLORS)[number]
const COLOR_HEX: Record<Color, string> = { ROUGE: '#ff4545', BLEU: '#4090ff', VERT: '#40ff80' }
const ROUNDS = 3
const WINDOW_MS = [1200, 850, 600]
const FLASH_MS  = 380

export function ReactFlash({ difficulty, label, onResult }: Props) {
  const { t } = useTranslation('minigames')
  const displayLabel = label ?? t('reactFlash.defaultLabel')
  const windowMs = WINDOW_MS[difficulty - 1]

  type Phase = 'waiting' | 'flash' | 'respond' | 'feedback'
  const [phase, setPhase]           = useState<Phase>('waiting')
  const [signal, setSignal]         = useState<Color | null>(null)
  const [roundResults, setRoundResults] = useState<boolean[]>([])
  const [lastResult, setLastResult] = useState<boolean | null>(null)
  const [done, setDone]             = useState(false)

  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const roundRef    = useRef(0)
  const resultsRef  = useRef<boolean[]>([])
  const signalRef   = useRef<Color | null>(null)

  function clearTimer() { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null } }

  function finish() {
    const hits = resultsRef.current.filter(Boolean).length
    const mult = hits === 3 ? 1.8 : hits >= 2 ? 1.2 : 0.5
    setDone(true)
    timerRef.current = setTimeout(() => onResult(mult), 900)
  }

  function startRound(r: number) {
    if (r >= ROUNDS) { finish(); return }
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    signalRef.current = color
    setSignal(color)
    setLastResult(null)
    setPhase('flash')
    timerRef.current = setTimeout(() => {
      setPhase('respond')
      timerRef.current = setTimeout(() => {
        const res = [...resultsRef.current, false]
        resultsRef.current = res
        setRoundResults(res)
        setLastResult(false)
        setPhase('feedback')
        const next = r + 1
        roundRef.current = next
        timerRef.current = setTimeout(() => startRound(next), 480)
      }, windowMs)
    }, FLASH_MS)
  }

  useEffect(() => {
    timerRef.current = setTimeout(() => startRound(0), 600)
    return () => clearTimer()
  }, [])

  function handleColorClick(color: Color) {
    if (phase !== 'respond') return
    clearTimer()
    const correct = color === signalRef.current
    const res = [...resultsRef.current, correct]
    resultsRef.current = res
    setRoundResults(res)
    setLastResult(correct)
    setPhase('feedback')
    const next = roundRef.current + 1
    roundRef.current = next
    timerRef.current = setTimeout(() => startRound(next), 430)
  }

  const hits = roundResults.filter(Boolean).length
  const mult = hits === 3 ? 1.8 : hits >= 2 ? 1.2 : 0.5

  return (
    <div className="layout">
      <div className="t-xs t-dim t-center">— {displayLabel} —</div>

      <div className="px-box">
        <div className="t-xs t-dim mb8">{t('reactFlash.instructions')}</div>

        {/* Signal / résultat */}
        <div style={{
          height: '76px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `2px solid ${
            done
              ? (mult >= 1.5 ? 'var(--gold)' : mult >= 1.0 ? 'var(--green)' : 'var(--red)')
              : phase === 'flash' && signal
                ? COLOR_HEX[signal]
                : phase === 'feedback'
                  ? (lastResult ? 'var(--green)' : 'var(--red)')
                  : 'var(--border)'
          }`,
          background: phase === 'flash' && signal && !done ? `${COLOR_HEX[signal]}16` : 'var(--bg)',
          marginBottom: '10px',
          transition: 'border-color 0.1s, background 0.1s',
        }}>
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', color: mult >= 1.5 ? 'var(--gold)' : mult >= 1.0 ? 'var(--green)' : 'var(--red)' }}>
                {t('reactFlash.hits', { hits })}
              </div>
              <div className="t-xs t-dim" style={{ marginTop: '4px' }}>{t('reactFlash.damageMult', { mult: mult.toFixed(2) })}</div>
            </div>
          ) : phase === 'waiting' ? (
            <span className="t-xs t-dim" style={{ letterSpacing: '2px' }}>{t('reactFlash.ready')}</span>
          ) : phase === 'flash' && signal ? (
            <span style={{ fontSize: '26px', fontWeight: 'bold', letterSpacing: '6px', color: COLOR_HEX[signal] }}>
              {t(`reactFlash.colors.${signal}`)}
            </span>
          ) : phase === 'respond' ? (
            <span className="t-xs" style={{ color: 'var(--cyan)', letterSpacing: '3px' }}>{t('reactFlash.choose')}</span>
          ) : (
            <span style={{ fontSize: '16px', color: lastResult ? 'var(--green)' : 'var(--red)' }}>
              {lastResult ? t('reactFlash.perfectReaction') : t('reactFlash.missed')}
            </span>
          )}
        </div>

        {/* Boutons couleur — toujours visibles (mémorisation spatiale) */}
        {!done && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            {COLORS.map(c => (
              <button
                key={c}
                className="px-btn"
                onClick={() => handleColorClick(c)}
                disabled={phase !== 'respond'}
                style={{
                  flex: 1, padding: '10px 0',
                  fontSize: '10px', letterSpacing: '2px', fontWeight: 'bold',
                  borderColor: COLOR_HEX[c], color: COLOR_HEX[c],
                  opacity: phase === 'respond' ? 1 : 0.35,
                  transition: 'opacity 0.15s',
                }}
              >
                {t(`reactFlash.colors.${c}`)}
              </button>
            ))}
          </div>
        )}

        {/* Progression + difficulté */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {Array.from({ length: ROUNDS }).map((_, i) => (
              <div key={i} style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: i < roundResults.length
                  ? (roundResults[i] ? 'var(--green)' : 'var(--red)')
                  : i === roundResults.length ? 'var(--cyan)' : 'var(--border)',
              }} />
            ))}
          </div>
          <span className="t-xs t-dim" style={{ marginLeft: 'auto' }}>
            {t('reactFlash.difficulty', { filled: '■'.repeat(difficulty), empty: '□'.repeat(3 - difficulty) })}
          </span>
        </div>
      </div>
    </div>
  )
}

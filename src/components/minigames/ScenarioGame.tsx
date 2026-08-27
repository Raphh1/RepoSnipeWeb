import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

interface Scenario {
  desc: string
  choices: { label: string; type: 'good' | 'neutral' | 'bad' }[]
}

// ── Types ──────────────────────────────────────────────────────────────────────
type NegoProps = {
  mode: 'negotiation'
  baseCredits: number
  onResult: (earned: number, label: string) => void
}
type NavProps = {
  mode: 'navigation'
  onResult: (shipDamage: number, bonusCredits: number) => void
}

// ── Composant ──────────────────────────────────────────────────────────────────
export function ScenarioGame(props: NegoProps | NavProps) {
  const { t } = useTranslation('scenarioGame')
  const negoScenarios = t('negoScenarios', { returnObjects: true }) as unknown as Scenario[]
  const navScenarios  = t('navScenarios', { returnObjects: true }) as unknown as Scenario[]
  const pool = props.mode === 'navigation' ? navScenarios : negoScenarios
  const timerMax = props.mode === 'navigation' ? 12 : 7

  // On ne fige que des indices (stables quelle que soit la langue, la structure
  // des tableaux traduits est identique fr/en) — jamais le texte lui-même, sinon
  // un changement de langue en cours de mini-jeu resterait figé dans l'ancienne.
  const [pickedIdx] = useState<number[]>(() =>
    pool.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, 3)
  )
  const [choiceOrders] = useState<number[][]>(() =>
    pickedIdx.map(pIdx => pool[pIdx].choices.map((_, i) => i).sort(() => Math.random() - 0.5))
  )
  const scenarios: Scenario[] = pickedIdx.map((pIdx, i) => ({
    desc: pool[pIdx].desc,
    choices: choiceOrders[i].map(cIdx => pool[pIdx].choices[cIdx]),
  }))
  const [idx, setIdx]           = useState(0)
  const [timeLeft, setTimeLeft] = useState(timerMax)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [feedbackType, setFeedbackType] = useState<'good' | 'neutral' | 'bad'>('neutral')
  const [phase, setPhase]       = useState<'playing' | 'done'>('playing')
  const [dmgSoFar, setDmgSoFar] = useState(0)
  const [displayMult, setDisplayMult] = useState(1.0)

  const goodRef    = useRef(0)
  const dmgRef     = useRef(0)
  const multRef    = useRef(1.0)
  const perfRef    = useRef<Array<'good' | 'neutral' | 'bad'>>([])
  const activeRef  = useRef(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function clearTimers() {
    if (timeoutRef.current)  clearTimeout(timeoutRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  function applyChoice(type: 'good' | 'neutral' | 'bad', msg: string) {
    activeRef.current = false
    clearTimers()
    perfRef.current = [...perfRef.current, type]

    if (props.mode === 'navigation') {
      const dmg = type === 'good' ? 0 : type === 'neutral' ? 5 : 13
      dmgRef.current += dmg
      if (type === 'good') goodRef.current++
      setDmgSoFar(dmgRef.current)
    } else {
      const badCount = perfRef.current.filter(p => p === 'bad').length
      if (badCount >= 2) {
        setFeedback(msg)
        setFeedbackType(type)
        setTimeout(() => {
          setPhase('done')
          ;(props as NegoProps).onResult(0, t('resultLabels.fail'))
        }, 900)
        return
      }
      const goodCount = perfRef.current.filter(p => p === 'good').length
      const newMult = badCount === 1 ? 0.4 : Math.min(1.5, 1.0 + goodCount * 0.25)
      multRef.current = newMult
      setDisplayMult(newMult)
    }

    setFeedback(msg)
    setFeedbackType(type)
    setTimeout(() => {
      setFeedback(null)
      if (perfRef.current.length >= scenarios.length) {
        setPhase('done')
        if (props.mode === 'navigation') {
          const bonus = goodRef.current >= 3 ? 500 : goodRef.current >= 2 ? 200 : 0
          props.onResult(dmgRef.current, bonus)
        } else {
          const earned   = Math.floor((props as NegoProps).baseCredits * multRef.current)
          const goodCnt  = perfRef.current.filter(p => p === 'good').length
          const lbl      = goodCnt >= 2 ? t('resultLabels.excellent') : goodCnt >= 1 ? t('resultLabels.good') : t('resultLabels.mediocre')
          props.onResult(earned, lbl)
        }
      } else {
        activeRef.current = true
        setIdx(i => i + 1)
      }
    }, 900)
  }

  useEffect(() => {
    if (phase !== 'playing') return
    setTimeLeft(timerMax)
    activeRef.current = true
    intervalRef.current = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    timeoutRef.current = setTimeout(() => {
      if (activeRef.current) {
        const timeoutMsg = props.mode === 'navigation' ? t('timeoutNav') : t('timeoutNego')
        applyChoice('bad', timeoutMsg)
      }
    }, timerMax * 1000)
    return clearTimers
  }, [idx, phase])

  if (phase === 'done') return null

  const scenario = scenarios[idx]
  const isNav = props.mode === 'navigation'
  const accentColor = isNav ? 'var(--orange)' : 'var(--cyan)'

  const MSGS: Record<'good' | 'neutral' | 'bad', string> = isNav
    ? { good: t('navMsgs.good'), neutral: t('navMsgs.neutral'), bad: t('navMsgs.bad') }
    : { good: t('negoMsgs.good'), neutral: t('negoMsgs.neutral'), bad: t('negoMsgs.bad') }

  return (
    <div className="layout">
      <div className="t-xs t-dim t-center">
        {isNav ? t('navHeader') : t('negoHeader')}
      </div>
      <div className="px-box" style={{ borderColor: accentColor }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
          <div className="t-xs t-dim">{t('situation', { current: idx + 1 })}</div>
          <div className="t-xs" style={{ color: timeLeft <= 2 ? 'var(--red)' : accentColor }}>⏱ {timeLeft}s</div>
          {isNav
            ? <div className="t-xs t-red">{t('shipDamage', { value: dmgSoFar })}</div>
            : <div className="t-xs" style={{ color: accentColor }}>×{displayMult.toFixed(1)}</div>
          }
        </div>
        <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
          <div style={{
            width: `${(timeLeft / timerMax) * 100}%`, height: '100%',
            background: timeLeft <= 2 ? 'var(--red)' : accentColor,
            transition: 'width 1s linear, background 0.3s',
          }} />
        </div>
        <div className="t-xs mb8" style={{
          lineHeight: '2.2',
          ...(isNav ? {} : { fontStyle: 'italic', borderLeft: '2px solid var(--border)', paddingLeft: '10px' }),
        }}>
          {scenario.desc}
        </div>
        {feedback
          ? <div className="t-xs" style={{
              color: feedbackType === 'bad' ? 'var(--red)' : 'var(--green)',
              lineHeight: '2',
            }}>{feedback}</div>
          : <div className="col gap4">
              {scenario.choices.map((c, i) => (
                <button key={i} className="px-btn" onClick={() => applyChoice(c.type, MSGS[c.type])}>
                  {c.label}
                </button>
              ))}
            </div>
        }
      </div>
      <div className="t-xs t-dim">
        {isNav
          ? t('navFooter')
          : t('negoFooter', { base: (props as NegoProps).baseCredits.toLocaleString(), mult: displayMult.toFixed(1), result: Math.floor((props as NegoProps).baseCredits * displayMult).toLocaleString() })
        }
      </div>
    </div>
  )
}

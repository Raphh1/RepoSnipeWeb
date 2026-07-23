import { useState, useEffect, useRef } from 'react'

interface Scenario {
  desc: string
  choices: { label: string; type: 'good' | 'neutral' | 'bad' }[]
}

// ── Scénarios négo ────────────────────────────────────────────────────────────
const NEGO_SCENARIOS: Scenario[] = [
  {
    desc: `Le marchand t'examine, bras croisés. "Ces prix sont standard. Tout le monde paie pareil ici."`,
    choices: [
      { label: `"Je cherche une relation long terme — ça vaut un effort mutuel."`, type: 'good' },
      { label: `"Je veux juste savoir si vous avez de la marge."`, type: 'neutral' },
      { label: `"C'est trop cher. Changez vos prix ou je repars."`, type: 'bad' },
    ],
  },
  {
    desc: `Il hésite. "J'ai d'autres acheteurs intéressés exactement par la même chose."`,
    choices: [
      { label: `"Mes contacts parleront de cette transaction. Votre réputation y gagne aussi."`, type: 'good' },
      { label: `"Alors décidez vite — moi aussi j'ai d'autres options."`, type: 'neutral' },
      { label: `"Vous bluffez. Personne d'autre ne paiera ce prix."`, type: 'bad' },
    ],
  },
  {
    desc: `Il te regarde droit dans les yeux. "Donnez-moi une bonne raison de vous faire un prix."`,
    choices: [
      { label: `"Cash, maintenant, sans paperasse ni vérifications. Propre et rapide."`, type: 'good' },
      { label: `"Parce que les deux on y gagne, non ?"`, type: 'neutral' },
      { label: `"Parce que vous avez besoin de vendre et je suis là."`, type: 'bad' },
    ],
  },
]

// ── Scénarios navigation ───────────────────────────────────────────────────────
const NAV_SCENARIOS: Scenario[] = [
  {
    desc: `Un champ d'astéroïdes bloque la route directe. Les débris dérivent lentement — mais certains sont rapides.`,
    choices: [
      { label: `Réduire les moteurs et naviguer avec précision`, type: 'good' },
      { label: `Contourner par le secteur nord (chemin plus long)`, type: 'neutral' },
      { label: `Accélérer au maximum et passer en force`, type: 'bad' },
    ],
  },
  {
    desc: `Un vaisseau abandonné dérive sur ta trajectoire. Ses systèmes d'urgence clignotent encore.`,
    choices: [
      { label: `Ajuster la trajectoire, s'écarter doucement`, type: 'good' },
      { label: `Envoyer un signal de reconnaissance avant de dévier`, type: 'neutral' },
      { label: `Maintenir le cap — le vaisseau passera`, type: 'bad' },
    ],
  },
  {
    desc: `Un signal non identifié te suit depuis plusieurs minutes. Fréquence irrégulière — probablement un chasseur.`,
    choices: [
      { label: `Couper les émissions et se dissimuler dans les débris proches`, type: 'good' },
      { label: `Envoyer une identification standard et continuer`, type: 'neutral' },
      { label: `Ignorer et maintenir la vitesse`, type: 'bad' },
    ],
  },
  {
    desc: `Une tempête de particules solaires approche. Les capteurs indiquent une fenêtre de 90 secondes.`,
    choices: [
      { label: `Activer les boucliers frontaux et ralentir`, type: 'good' },
      { label: `Virer à tribord — route plus longue mais sûre`, type: 'neutral' },
      { label: `Accélérer pour passer avant le front`, type: 'bad' },
    ],
  },
  {
    desc: `Une patrouille militaire scanne le secteur. Ton cargo pourrait attirer l'attention.`,
    choices: [
      { label: `Couper les propulseurs et dériver lentement hors du cône de scan`, type: 'good' },
      { label: `Répondre normalement à leur hail et espérer`, type: 'neutral' },
      { label: `Accélérer pour sortir de la zone de scan`, type: 'bad' },
    ],
  },
  {
    desc: `Un tunnel de débris d'une ancienne bataille croise ta route. Métal tordu, plaques flottantes.`,
    choices: [
      { label: `Passer lentement, boucliers actifs, pleine attention`, type: 'good' },
      { label: `Contourner — ça prend 20 minutes de plus`, type: 'neutral' },
      { label: `Passer en vitesse — moins de temps dans la zone dangereuse`, type: 'bad' },
    ],
  },
]

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
  const pool = props.mode === 'navigation' ? NAV_SCENARIOS : NEGO_SCENARIOS
  const timerMax = props.mode === 'navigation' ? 12 : 10

  const [scenarios] = useState<Scenario[]>(() =>
    [...pool].sort(() => Math.random() - 0.5).slice(0, 3)
  )
  const [idx, setIdx]           = useState(0)
  const [timeLeft, setTimeLeft] = useState(timerMax)
  const [feedback, setFeedback] = useState<string | null>(null)
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
      const goodCount = perfRef.current.filter(p => p === 'good').length
      const badCount  = perfRef.current.filter(p => p === 'bad').length
      const newMult   = Math.max(0.2, 1.0 + goodCount * 0.3 - badCount * 0.2)
      multRef.current = newMult
      setDisplayMult(newMult)
    }

    setFeedback(msg)
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
          const lbl      = goodCnt >= 2 ? 'EXCELLENT' : goodCnt >= 1 ? 'BON' : 'MÉDIOCRE'
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
        const timeoutMsg = props.mode === 'navigation'
          ? 'Trop lent — le vaisseau encaisse.'
          : 'Temps écoulé — tu hésites trop. Il perd patience.'
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
    ? { good: 'Manœuvre réussie. Aucun dommage.', neutral: 'Chemin alternatif — résultat acceptable. -5 PV vaisseau.', bad: 'Impact. Le vaisseau tremble. -13 PV vaisseau.' }
    : { good: 'Bonne approche. Il hoche la tête lentement.', neutral: 'Réponse correcte. Il reste sur la réserve.', bad: 'Mauvaise approche. Il se raidit visiblement.' }

  return (
    <div className="layout">
      <div className="t-xs t-dim t-center">
        {isNav ? '— NAVIGATION DANGEREUSE —' : '— MINI-JEU : NÉGOCIATION —'}
      </div>
      <div className="px-box" style={{ borderColor: accentColor }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
          <div className="t-xs t-dim">Situation {idx + 1}/3</div>
          <div className="t-xs" style={{ color: timeLeft <= 2 ? 'var(--red)' : accentColor }}>⏱ {timeLeft}s</div>
          {isNav
            ? <div className="t-xs t-red">Dégâts vaisseau : -{dmgSoFar} PV</div>
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
              color: (feedback.includes('Trop lent') || feedback.includes('Impact') || feedback.includes('perd patience') || feedback.includes('Mauvaise'))
                ? 'var(--red)' : 'var(--green)',
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
          ? '3 bonnes manœuvres = +500 cr · 2 bonnes = +200 cr · sinon rien'
          : `Base : ${(props as NegoProps).baseCredits.toLocaleString()} cr · ×${displayMult.toFixed(1)} → ${Math.floor((props as NegoProps).baseCredits * displayMult).toLocaleString()} cr`
        }
      </div>
    </div>
  )
}

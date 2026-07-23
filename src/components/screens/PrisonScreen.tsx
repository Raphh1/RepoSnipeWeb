import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { StopTheBar, type StopResult } from '../minigames/StopTheBar'

type EscapePhase = 'menu' | 'playing' | 'between' | 'caught' | 'success'

const ROUND_LABELS = [
  "Serrure de cellule",
  "Couloir de garde",
  "Porte de sortie",
]
const ROUND_DESCS = [
  "La serrure électronique de ta cellule. Le garde repasse dans quelques secondes. Un timing parfait l'ouvre en silence.",
  "Tu es dans le couloir. Une grille magnétique bloque le passage. Elle s'ouvre par à-coups. Tu dois saisir la fenêtre exacte.",
  "La porte extérieure. Le système principal. Le plus sensible. Un faux mouvement et toute la prison s'illumine.",
]
const BETWEEN_MSGS = [
  "La cellule est ouverte. Tu avances dans le couloir, dos aux murs. Un garde tourne le dos.",
  "Tu traverses la grille. La sortie est en vue. Dernier obstacle.",
]
const TOTAL_ROUNDS = 3

export function PrisonScreen() {
  const gs    = useGameStore(s => s.gs!)
  const patch = useGameStore(s => s.patch)
  const goTo  = useGameStore(s => s.goTo)

  const [msg, setMsg]       = useState<string | null>(null)
  const [freed, setFreed]   = useState(false)
  const [confiscated, setConfiscated] = useState<string[]>([])

  // Évasion mini-jeu
  const [escapePhase, setEscapePhase] = useState<EscapePhase>('menu')
  const [round, setRound]             = useState(1)

  const days    = gs.prisonDaysLeft ?? 1
  const caution = 800 + gs.day * 40

  function serveTime() {
    const debtLoss = (gs.class.dailyDebt ?? 0) * days
    patch({
      isImprisoned: false, prisonDaysLeft: 0,
      day:          gs.day + days,
      playerHp:     Math.max(1, Math.floor(gs.playerMaxHp * 0.28)),
      stamina:      Math.floor(gs.maxStamina * 0.4),
      reputation:   gs.reputation - 20,
      credits:      Math.max(0, gs.credits - debtLoss),
    })
    const lines = [`Tu fais ton temps. ${days} jour${days > 1 ? 's' : ''}.`, `Tu ressors à ${Math.floor(gs.playerMaxHp * 0.28)} PV, exténué. -20 rép.`]
    if (debtLoss > 0) lines.push(`Dettes accumulées : -${debtLoss} cr.`)
    setMsg(lines.join(' ')); setFreed(true)
  }

  function payCaution() {
    if (gs.credits < caution) { setMsg(`Il te manque ${caution - gs.credits} cr.`); return }
    patch({ credits: gs.credits - caution, isImprisoned: false, prisonDaysLeft: 0, playerHp: Math.max(1, Math.floor(gs.playerMaxHp * 0.60)), reputation: gs.reputation - 8 })
    setMsg(`Caution payée. -${caution} cr. Tu sors à ${Math.floor(gs.playerMaxHp * 0.60)} PV. -8 rép.`); setFreed(true)
  }

  function bribeGuard() {
    if (gs.credits < 400) { setMsg('Pas assez de crédits.'); return }
    const ok = Math.random() < 0.50 + (gs.reputation > 40 ? 0.10 : 0)
    if (ok) {
      patch({ credits: gs.credits - 400, isImprisoned: false, prisonDaysLeft: 0, playerHp: Math.max(1, Math.floor(gs.playerMaxHp * 0.50)), prisonEscapes: gs.prisonEscapes + 1 })
      setMsg(`Le garde empoche les 400 cr et regarde ailleurs. Tu files. ${Math.floor(gs.playerMaxHp * 0.50)} PV.`); setFreed(true)
    } else {
      patch({ credits: gs.credits - 400, prisonDaysLeft: days + 1 })
      setMsg(`Il prend l'argent ET appelle du renfort. +1 jour. ${days + 1} jours restants.`)
    }
  }

  function handleRoundResult(result: StopResult) {
    if (result === 'miss') {
      // Attrapé — dégâts proportionnels au round où tu te fais prendre
      const dmg = 20 + round * 15
      const addDays = TOTAL_ROUNDS - round + 1
      patch({ playerHp: Math.max(1, gs.playerHp - dmg), prisonDaysLeft: days + addDays })
      setEscapePhase('caught')
    } else {
      if (round >= TOTAL_ROUNDS) {
        // Succès complet
        const dmg = result === 'good' ? 15 : 8
        const recovered: typeof gs.cargo = {}
        if (Math.random() < 0.4) recovered['Médicaments'] = 1
        patch({
          isImprisoned: false, prisonDaysLeft: 0,
          playerHp:     Math.max(1, gs.playerHp - dmg),
          prisonEscapes: gs.prisonEscapes + 1,
          reputation:   gs.reputation + 25,
          cargo:        { ...gs.cargo, ...recovered },
        })
        if (Object.keys(recovered).length > 0) setConfiscated(['Médicaments'])
        setEscapePhase('success')
      } else {
        // Round suivant
        setEscapePhase('between')
      }
    }
  }

  const escapeChance: Partial<Record<string, number>> = {
    'Contrebandier': 65, 'Seigneur de guerre': 55, 'Vagabond': 50, 'Hackeur': 52, 'Vétéran': 48,
  }

  // ── MINI JEU EN COURS ────────────────────────────────────────────────────
  if (escapePhase === 'playing') {
    return (
      <div className="layout">
        <div className="t-xs t-dim t-center">— ÉVASION — Tour {round}/{TOTAL_ROUNDS} —</div>
        <div className="px-box" style={{ borderColor: 'var(--orange)' }}>
          <div className="t-xs t-orange mb4">{ROUND_LABELS[round - 1]}</div>
          <div className="t-xs t-dim" style={{ lineHeight: '2' }}>{ROUND_DESCS[round - 1]}</div>
        </div>
        <StopTheBar
          difficulty={round as 1 | 2 | 3}
          label={ROUND_LABELS[round - 1].toUpperCase()}
          onResult={handleRoundResult}
        />
      </div>
    )
  }

  // ── ENTRE DEUX ROUNDS ────────────────────────────────────────────────────
  if (escapePhase === 'between') {
    return (
      <div className="layout" style={{ justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
          <div className="t-xs t-dim t-center mb8">— ÉVASION — Tour {round}/{TOTAL_ROUNDS} passé —</div>
          <div className="px-box" style={{ borderColor: 'var(--green)', textAlign: 'center', padding: '20px' }}>
            <div className="t-xs t-green mb8">✓ PASSAGE RÉUSSI</div>
            <div className="t-xs t-dim" style={{ lineHeight: '2' }}>{BETWEEN_MSGS[round - 1]}</div>
          </div>
          <button className="px-btn px-btn--primary mt8" onClick={() => { setRound(r => r + 1); setEscapePhase('playing') }}>
            Continuer l'évasion → Tour {round + 1}/{TOTAL_ROUNDS}
          </button>
        </div>
      </div>
    )
  }

  // ── ATTRAPÉ ───────────────────────────────────────────────────────────────
  if (escapePhase === 'caught') {
    const addDays = TOTAL_ROUNDS - round + 1
    return (
      <div className="layout" style={{ justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
          <div className="t-xs t-dim t-center mb8">— ÉVASION ÉCHOUÉE —</div>
          <div className="px-box" style={{ borderColor: 'var(--red)', textAlign: 'center', padding: '20px' }}>
            <div className="t-red" style={{ fontSize: '14px', letterSpacing: '2px', marginBottom: '12px' }}>RATTRAPÉ</div>
            <div className="t-xs t-dim" style={{ lineHeight: '2.2' }}>
              {round === 1 && "La serrure résiste. Une alarme silencieuse se déclenche. Des pas dans le couloir."}
              {round === 2 && "La grille te bloque. Un garde se retourne au mauvais moment. Il crie."}
              {round === 3 && "Si près. La porte ne s'ouvre pas à temps. Des lumières s'allument partout."}
            </div>
            <div className="t-xs t-red mt8">+{addDays} jour{addDays > 1 ? 's' : ''} de peine supplémentaire.</div>
          </div>
          <button className="px-btn" onClick={() => { setEscapePhase('menu'); setRound(1) }}>
            Retour en cellule
          </button>
        </div>
      </div>
    )
  }

  // ── ÉVASION RÉUSSIE ───────────────────────────────────────────────────────
  if (escapePhase === 'success') {
    return (
      <div className="layout" style={{ justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
          <div className="t-xs t-dim t-center mb8">— ÉVASION —</div>
          <div className="px-box" style={{ borderColor: 'var(--green)', textAlign: 'center', padding: '24px' }}>
            <div className="t-green" style={{ fontSize: '14px', letterSpacing: '2px', marginBottom: '12px' }}>ÉVADÉ</div>
            <div className="t-xs t-dim" style={{ lineHeight: '2.2', marginBottom: '12px' }}>
              Tu franchis la dernière porte. L'air froid de l'espace t'accueille.
              Tu cours sans te retourner jusqu'à ton vaisseau.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="t-xs t-dim">PV</span>
                <span className="t-xs" style={{ color: gs.playerHp < gs.playerMaxHp * 0.3 ? 'var(--red)' : 'var(--green)' }}>{gs.playerHp}/{gs.playerMaxHp}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="t-xs t-dim">Réputation</span>
                <span className="t-xs t-green">+25</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="t-xs t-dim">Évasions au compteur</span>
                <span className="t-xs t-cyan">{gs.prisonEscapes}</span>
              </div>
              {confiscated.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="t-xs t-dim">Récupéré</span>
                  <span className="t-xs t-orange">{confiscated.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
          <button className="px-btn px-btn--primary mt8" onClick={() => goTo('station-hub')}>
            Disparaître dans la station →
          </button>
        </div>
      </div>
    )
  }

  // ── MENU PRINCIPAL ────────────────────────────────────────────────────────
  return (
    <div className="layout">
      <div className="t-center mb8" style={{ letterSpacing: '4px', color: 'var(--red)', fontSize: '9px' }}>
        ▓ ▓ ▓ ▓ CELLULE ▓ ▓ ▓ ▓
      </div>

      <div className="px-box" style={{ borderColor: 'var(--red)' }}>
        <div className="t-lg t-red t-center mb8">PRISON</div>
        <div className="t-xs t-dim mb8" style={{ lineHeight: '2' }}>
          Les murs sentent le métal et la défaite. Chaque heure ici coûte quelque chose.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="t-xs t-dim">Jours restants</span>
            <span className="t-xs t-red">{days} jour{days > 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="t-xs t-dim">PV actuels</span>
            <span className="t-xs" style={{ color: gs.playerHp < gs.playerMaxHp * 0.3 ? 'var(--red)' : 'var(--green)' }}>{gs.playerHp}/{gs.playerMaxHp}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="t-xs t-dim">Crédits</span>
            <span className="t-xs t-gold">{gs.credits.toLocaleString()} cr</span>
          </div>
        </div>
      </div>

      {msg && (
        <div className="px-box" style={{ borderColor: freed ? 'var(--green)' : 'var(--orange)' }}>
          <div className="t-xs" style={{ color: freed ? 'var(--green)' : 'var(--orange)', lineHeight: '2' }}>{msg}</div>
          {freed && <button className="px-btn px-btn--primary mt8" onClick={() => goTo('station-hub')}>Retour en station →</button>}
        </div>
      )}

      {!freed && (
        <div className="col gap4">
          <div className="px-box" style={{ padding: '8px 12px' }}>
            <div className="t-xs t-dim" style={{ lineHeight: '2' }}>
              ⚠ Purger : sors à <span className="t-red">28% PV</span>, <span className="t-orange">40% stamina</span>, <span className="t-red">-20 rép</span>
              {gs.class.dailyDebt ? <span className="t-red"> · dettes -{gs.class.dailyDebt * days} cr</span> : null}
            </div>
          </div>
          <button className="px-btn px-btn--danger" onClick={serveTime}>
            Purger la peine ({days} jour{days > 1 ? 's' : ''}) — sortir affaibli
          </button>
          <button className="px-btn" onClick={payCaution} disabled={gs.credits < caution}>
            Payer la caution ({caution.toLocaleString()} cr) — 60% PV, -8 rép
            {gs.credits < caution ? ` · manque ${(caution - gs.credits).toLocaleString()} cr` : ''}
          </button>
          <button className="px-btn" onClick={bribeGuard} disabled={gs.credits < 400}>
            Soudoyer un garde (400 cr · {50 + (gs.reputation > 40 ? 10 : 0)}% succès)
          </button>
          <button className="px-btn" style={{ color: 'var(--orange)', borderColor: 'var(--orange)' }}
            onClick={() => { setRound(1); setEscapePhase('playing') }}>
            ► Tenter une évasion — 3 obstacles à franchir (difficulté croissante)
          </button>
        </div>
      )}
    </div>
  )
}

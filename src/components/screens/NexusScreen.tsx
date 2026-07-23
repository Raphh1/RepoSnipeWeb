import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { NEXUS_FRAGMENTS, attemptNexusFragment } from '../../engine/nexus'
import { TIER_HIGH } from '../../data/enemies'

export function NexusScreen() {
  const gs              = useGameStore(s => s.gs!)
  const goTo            = useGameStore(s => s.goTo)
  const patch           = useGameStore(s => s.patch)
  const startCombat     = useGameStore(s => s.startCombat)
  const collectFragment = useGameStore(s => s.collectNexusFragment)
  const [msg, setMsg]   = useState<string | null>(null)
  const collected       = gs.nexusFragments ?? []

  function attempt(idx: number, action: 'force' | 'pay' | 'reputation' | 'legendary') {
    const result = attemptNexusFragment(gs, idx, action)
    if (result.triggerCombat) {
      const boss = TIER_HIGH[Math.floor(Math.random() * TIER_HIGH.length)]
      if (result.newGs) patch(result.newGs)
      startCombat({ ...boss, name: `Gardien du Fragment ${idx + 1}`, isBoss: true })
      return
    }
    if (result.success) {
      if (result.newGs) patch(result.newGs)
      collectFragment(idx)
      setMsg(`Fragment obtenu ! ${result.message}`)
    } else {
      setMsg(result.message)
    }
  }

  const isComplete = collected.length >= 4

  return (
    <div className="layout">
      <div className="row" style={{ alignItems: 'center', gap: '16px' }}>
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => goTo('station-hub')}>← RETOUR</button>
        <div className="t-sm t-bright">STATION NEXUS</div>
        <div className="t-xs t-gold">{collected.length}/4 fragments</div>
      </div>

      <div className="px-box" style={{ borderColor: 'var(--purple)' }}>
        <div className="t-xs t-purple mb4">ARC PRINCIPAL</div>
        <div className="t-xs" style={{ lineHeight: '2' }}>
          Quatre fragments éparpillés dans l'espace. Quatre gardiens. Une station légendaire à reconstruire.
          Celui qui rassemble les fragments devient Seigneur de l'Espace.
        </div>
        <div className="t-xs t-dim mt8">
          Objectif : <span className="t-bright">stationPiecesRallied ≥ 4</span> → Victoire
        </div>
      </div>

      {msg && (
        <div className="px-box" style={{ borderColor: msg.includes('obtenu') ? 'var(--gold)' : 'var(--red)' }}>
          <div className={`t-sm ${msg.includes('obtenu') ? 't-gold' : 't-red'}`}>{msg}</div>
          <button className="px-btn px-btn--sm mt8" style={{ width: 'auto' }} onClick={() => setMsg(null)}>OK</button>
        </div>
      )}

      {isComplete && (
        <div className="px-box" style={{ borderColor: 'var(--gold)' }}>
          <div className="t-lg t-gold t-center mb8">★ TOUS LES FRAGMENTS RASSEMBLÉS ★</div>
          <button className="px-btn px-btn--primary" onClick={() => goTo('victory')}>
            ACTIVER LA STATION NEXUS
          </button>
        </div>
      )}

      <div className="col gap4">
        {NEXUS_FRAGMENTS.map((f, i) => {
          const owned = collected.includes(i)
          const available = gs.currentStation === f.station && !owned
          return (
            <div key={i} className={`px-box ${owned ? '' : 'px-box--dark'}`}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
                <div className="t-sm" style={{ color: owned ? 'var(--gold)' : 'var(--text-dim)' }}>
                  {owned ? '★ ' : `${i+1}. `}{f.name}
                </div>
                {owned && <div className="tag tag--gold t-xs">COLLECTÉ</div>}
                {!owned && <div className="tag tag--dim t-xs">{f.station}</div>}
              </div>
              <div className="t-xs t-dim mb8">{f.hint}</div>

              {!owned && !available && (
                <div className="t-xs t-dim">
                  {gs.currentStation === f.station
                    ? 'Déjà collecté.'
                    : `Tu dois être à : ${f.station}`}
                </div>
              )}

              {available && (
                <div className="col gap4">
                  <div className="t-xs t-dim mb4">Comment obtenir ce fragment :</div>
                  <button className="px-btn px-btn--danger" onClick={() => attempt(i, 'force')}>
                    Forcer — combat avec le gardien
                  </button>
                  <button className="px-btn" onClick={() => attempt(i, 'pay')} disabled={gs.credits < 5000}>
                    Payer — 5 000–8 000 cr
                  </button>
                  <button className="px-btn" onClick={() => attempt(i, 'reputation')} disabled={gs.reputation < 50}>
                    Réputation — ≥ 50–100 rép requis ({gs.reputation} actuel)
                  </button>
                  {gs.weapons.some(w => w.tier >= 5) && (
                    <button className="px-btn" onClick={() => attempt(i, 'legendary')}>
                      Arme légendaire — offrir une arme Tier 5
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

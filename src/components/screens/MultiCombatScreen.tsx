import { useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { MultiCombatAction } from '../../engine/multiCombat'

const ROLE_ICON: Record<string, string> = { tank: '🛡', ranged: '🎯', support: '💚', normal: '' }
const ROLE_LABEL: Record<string, string> = { tank: 'Tank', ranged: 'Tireur', support: 'Soutien', normal: '' }

export function MultiCombatScreen() {
  const gs       = useGameStore(s => s.gs!)
  const submit   = useGameStore(s => s.submitMultiAction)
  const mcs      = gs.multiCombatState!
  const logRef   = useRef<HTMLDivElement>(null)

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [mcs.log])

  const alive     = mcs.squad.filter(m => !m.defeated)
  const phPct     = (gs.playerHp / gs.playerMaxHp) * 100
  const staPct    = (gs.stamina  / gs.maxStamina)  * 100
  const weapon    = gs.equippedWeapon

  function act(action: MultiCombatAction) { submit(action) }

  return (
    <div className="layout">
      <div className="t-center t-xs t-dim">— COMBAT MULTIPLE — {mcs.squad.length} adversaires — Tour {mcs.turn} —</div>

      {/* Player status */}
      <div className="px-box">
        <div className="row" style={{ gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div className="t-xs t-dim mb4">TOI · PV</div>
            <div className={`bar bar--hp ${phPct < 30 ? 'low' : ''}`}>
              <div className="bar__fill" style={{ width: `${phPct}%` }} />
            </div>
            <div className="t-xs mt4" style={{ color: phPct < 30 ? 'var(--red)' : 'var(--green)' }}>
              {gs.playerHp}/{gs.playerMaxHp}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="t-xs t-dim mb4">STAMINA</div>
            <div className="bar bar--sta"><div className="bar__fill" style={{ width: `${staPct}%` }} /></div>
            <div className="t-xs t-cyan mt4">{gs.stamina}/{gs.maxStamina}</div>
          </div>
          <div>
            <div className="momentum">
              {[0,1,2].map(i => <div key={i} className={`momentum__pip ${mcs.momentum > i ? `momentum__pip--${mcs.momentum}` : ''}`} />)}
            </div>
            {mcs.momentum >= 3 && <div className="t-gold t-xs blink mt4">FINISHER!</div>}
          </div>
        </div>
      </div>

      {/* Squad status */}
      <div className="px-box px-box--hi">
        <div className="t-xs t-dim mb8">COMPOSITION ENNEMIE</div>
        <div className="col gap4">
          {mcs.squad.map((m, i) => {
            const pct = (m.hp / m.base.maxHp) * 100
            return (
              <div key={i} style={{ opacity: m.defeated ? 0.35 : 1 }}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: '3px' }}>
                  <div className="t-xs" style={{ color: m.defeated ? 'var(--text-dim)' : 'var(--red)' }}>
                    {m.defeated ? '✗ ' : ROLE_ICON[m.base.role]} {m.base.name}
                    {ROLE_LABEL[m.base.role] && <span className="t-xs t-dim" style={{ marginLeft: '6px' }}>({ROLE_LABEL[m.base.role]})</span>}
                  </div>
                  <div className="t-xs" style={{ color: pct < 30 ? 'var(--red)' : 'var(--green)' }}>
                    {m.defeated ? 'Éliminé' : `${m.hp}/${m.base.maxHp}`}
                  </div>
                </div>
                {!m.defeated && (
                  <div className={`bar bar--hp ${pct < 30 ? 'low' : ''}`} style={{ height: '6px' }}>
                    <div className="bar__fill" style={{ width: `${pct}%` }} />
                  </div>
                )}
                {m.stunTurns > 0 && <div className="t-xs t-yellow" style={{ fontSize: '7px', marginTop: '2px' }}>ÉTOURDI {m.stunTurns}t</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Log */}
      <div className="px-box px-box--dark combat-log" ref={logRef}>
        {mcs.log.length === 0
          ? <div className="log-entry log-entry--info">Combat multiple commence...</div>
          : mcs.log.map(e => <div key={e.id} className={`log-entry log-entry--${e.type}`}>{e.text}</div>)
        }
      </div>

      {/* Actions */}
      <div className="px-box">
        <div className="t-xs t-dim mb8">ATTAQUER :</div>
        <div className="col gap4">
          {mcs.momentum >= 3 && (
            <button className="px-btn px-btn--primary" onClick={() => act({ type: 'finisher' })}>
              ★ FINISHER — 3× dégâts sur l'ennemi le plus faible
            </button>
          )}

          {alive.map((m, i) => {
            const realIdx = mcs.squad.indexOf(m)
            const pct = (m.hp / m.base.maxHp) * 100
            return (
              <button key={i} className="px-btn" onClick={() => act({ type: 'attack', targetIndex: realIdx })}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span>{ROLE_ICON[m.base.role]} {m.base.name} <span className="t-xs t-dim">({ROLE_LABEL[m.base.role] || 'Normal'})</span></span>
                  <span className="t-xs" style={{ color: pct < 30 ? 'var(--red)' : 'var(--green)' }}>{m.hp}/{m.base.maxHp}</span>
                </div>
              </button>
            )
          })}

          <hr className="divider" />

          {!mcs.classUsed && (
            <ClassActionMulti gs={gs} onAct={act} />
          )}

          {(gs.cargo['Médicaments'] ?? 0) > 0 && (
            <button className="px-btn px-btn--green" onClick={() => act({ type: 'heal' })}>
              Se soigner +30 PV (Médicaments ×{gs.cargo['Médicaments']})
            </button>
          )}

          {gs.fuel > 0 && (
            <button className="px-btn px-btn--danger" onClick={() => act({ type: 'flee' })}>
              Fuir ({35 + (gs.class.name === 'Contrebandier' ? 25 : 0)}% succès) — -1 carburant
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ClassActionMulti({ gs, onAct }: { gs: ReturnType<typeof useGameStore.getState>['gs'] & object; onAct: (a: MultiCombatAction) => void }) {
  if (!gs) return null
  const labels: Record<string, string> = {
    'Médecin':          '[MÉDECIN] Soin rapide +30 PV · 1×/combat',
    'Contrebandier':    '[CONTREBANDIER] Fuite garantie · -1 carburant',
    'Seigneur de guerre': '[SEIGNEUR] Intimider l\'ennemi le plus dangereux',
    'Hackeur':          '[HACKEUR] Hack de masse — tous les non-tanks étourdis',
    'Vagabond':         '[VAGABOND] Coup bas sur l\'ennemi le plus faible',
  }
  const label = labels[gs.class.name]
  if (!label) return null
  return (
    <button className="px-btn" style={{ color: 'var(--cyan)' }} onClick={() => onAct({ type: 'class' })}>
      {label}
    </button>
  )
}

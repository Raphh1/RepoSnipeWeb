import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { CombatAction } from '../../engine/combat'
import type { CombatLogEntry } from '../../types'
import { HackSequence } from '../minigames/HackSequence'

const ANIM_DELAY_MS = 850

const INTENT_LABEL: Record<string, string> = {
  normal: '→ Attaque standard',
  heavy:  '⚠ FRAPPE LOURDE IMMINENTE',
  charge: '⚡ SE CONCENTRE (frappe dévastatrice +1)',
  disarm: '✋ Vise ton arme',
  defend: '○ Se repose ce tour',
}
const INTENT_CLASS: Record<string, string> = {
  normal: 'intent--normal', heavy: 'intent--heavy', charge: 'intent--charge',
  disarm: 'intent--disarm', defend: 'intent--defend',
}

export function CombatScreen() {
  const gs             = useGameStore(s => s.gs!)
  const submit         = useGameStore(s => s.submitCombatAction)
  const resolveVictory = useGameStore(s => s.resolveVictory)
  const resolveDeath   = useGameStore(s => s.resolveDeath)
  const victoryPending = useGameStore(s => s.combatVictoryPending)
  const deathPending   = useGameStore(s => s.playerDeathPending)
  const enemy  = gs.combatEnemy!
  const cs     = gs.combatState!
  const logRef = useRef<HTMLDivElement>(null)

  const [visibleLog, setVisibleLog] = useState<CombatLogEntry[]>([])
  const [queue, setQueue]           = useState<CombatLogEntry[]>([])
  const [frozenHp, setFrozenHp]     = useState<{ player: number; enemy: number } | null>(null)
  const [hackOpen, setHackOpen]     = useState(false)
  const isAnimating = queue.length > 0

  // Pause mort : montrer l'ennemi à 0 PV puis transitionner
  useEffect(() => {
    if (!victoryPending) return
    const t = setTimeout(() => resolveVictory(), 1400)
    return () => clearTimeout(t)
  }, [victoryPending])

  // Pause mort joueur : laisser le temps de lire "Vous êtes mort." avant le game over
  useEffect(() => {
    if (!deathPending) return
    const t = setTimeout(() => resolveDeath(), 2200)
    return () => clearTimeout(t)
  }, [deathPending])

  // Chaque nouveau tour → on enfile les entrées
  useEffect(() => {
    if (cs.log.length > 0) {
      setQueue(prev => [...prev, ...cs.log])
    }
  }, [cs.log])

  // Dépiler une entrée toutes les ANIM_DELAY_MS ms
  useEffect(() => {
    if (queue.length === 0) return
    const t = setTimeout(() => {
      setVisibleLog(prev => [...prev, queue[0]])
      setQueue(prev => prev.slice(1))
    }, ANIM_DELAY_MS)
    return () => clearTimeout(t)
  }, [queue])

  // Libérer les HP gelés quand l'animation se termine
  useEffect(() => {
    if (queue.length === 0 && frozenHp !== null) {
      setFrozenHp(null)
    }
  }, [queue.length])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [visibleLog])

  const shownPlayerHp = frozenHp?.player ?? gs.playerHp
  const shownEnemyHp  = frozenHp?.enemy  ?? cs.enemyHp
  const hpPct  = (shownEnemyHp  / enemy.maxHp)    * 100
  const phPct  = (shownPlayerHp / gs.playerMaxHp) * 100
  const staPct = (gs.stamina    / gs.maxStamina)  * 100

  function act(action: CombatAction) {
    if (isAnimating || victoryPending) return
    setFrozenHp({ player: gs.playerHp, enemy: cs.enemyHp })
    submit(action)
  }

  const weapon = gs.equippedWeapon
  const hasSpecial = weapon && !['none','silence','armorPierce'].includes(weapon.effect)

  return (
    <div className="layout">
      {/* Overlay mort ennemi */}
      {victoryPending && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease-in' }}>
            <div style={{ fontSize: '11px', letterSpacing: '6px', color: 'var(--gold)', textShadow: '0 0 20px var(--gold)', marginBottom: '8px' }}>★ VICTOIRE ★</div>
            <div className="t-xs t-dim">{gs.combatEnemy?.name} est vaincu</div>
          </div>
        </div>
      )}
      {hackOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: '600px', width: '100%', padding: '16px' }}>
            <HackSequence difficulty={2} onResult={(success) => {
              setHackOpen(false)
              if (success) {
                act({ type: 'class' })
              } else {
                // Hack raté : attaque normale
                act({ type: 'attack' })
              }
            }} />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="t-center t-dim t-xs">— COMBAT —</div>

      {/* Enemy + Player status */}
      <div className="grid2">
        {/* Player */}
        <div className="px-box">
          <div className="t-sm t-bright mb8">TOI</div>
          <div className="t-xs t-dim mb4">PV</div>
          <div className={`bar bar--hp ${phPct < 30 ? 'low' : ''}`}>
            <div className="bar__fill" style={{ width: `${phPct}%` }} />
          </div>
          <div className="t-xs mt4" style={{ color: phPct < 30 ? 'var(--red)' : 'var(--green)' }}>
            {shownPlayerHp}/{gs.playerMaxHp}
          </div>

          <div className="t-xs t-dim mb4 mt8">STAMINA</div>
          <div className="bar bar--sta">
            <div className="bar__fill" style={{ width: `${staPct}%` }} />
          </div>
          <div className="t-xs t-cyan mt4">{gs.stamina}/{gs.maxStamina}</div>

          <div className="mt8 t-xs t-dim">
            {weapon ? <span className="t-orange">{weapon.name}</span> : 'Mains nues'}
            {gs.equippedArmor && <span className="t-blue" style={{ color: 'var(--blue)' }}> · {gs.equippedArmor.name}</span>}
          </div>

          <div className="momentum mt8">
            <span className="t-xs t-dim">MOMENTUM</span>
            {[0,1,2].map(i => (
              <div key={i} className={`momentum__pip ${cs.momentum > i ? `momentum__pip--${cs.momentum}` : ''}`} />
            ))}
            {cs.momentum >= 3 && <span className="t-gold t-xs blink">FINISHER!</span>}
          </div>
        </div>

        {/* Enemy */}
        <div className="px-box px-box--hi">
          <div className="t-sm t-red mb4">{enemy.name}</div>
          <div className="t-xs t-dim mb8">{enemy.description}</div>

          <div className="t-xs t-dim mb4">PV ENNEMI</div>
          <div className={`bar bar--hp ${hpPct < 30 ? 'low' : ''}`}>
            <div className="bar__fill" style={{ width: `${hpPct}%` }} />
          </div>
          <div className="t-xs mt4" style={{ color: hpPct < 30 ? 'var(--red)' : 'var(--green)' }}>
            {shownEnemyHp}/{enemy.maxHp}
          </div>

          <div className={`t-xs mt8 ${INTENT_CLASS[cs.currentIntent]}`}>
            INTENTION : {INTENT_LABEL[cs.currentIntent]}
          </div>

          {cs.enemyStunTurns > 0    && <div className="t-xs t-yellow mt4">ÉTOURDI ({cs.enemyStunTurns} tour{cs.enemyStunTurns > 1 ? 's' : ''})</div>}
          {cs.enemyBlinded           && <div className="t-xs t-yellow mt4">AVEUGLÉ</div>}
          {cs.enemyBurnTurns > 0    && <div className="t-xs t-orange mt4" style={{ color: 'var(--orange)' }}>BRÛLURE ×{cs.enemyBurnTurns}</div>}
          {cs.enemyWeaponDisabledTurns > 0 && <div className="t-xs t-cyan mt4">HACKÉ ({cs.enemyWeaponDisabledTurns}t)</div>}
          {cs.enemyCharging          && <div className="t-xs t-red mt4 blink">SE PRÉPARE !</div>}
        </div>
      </div>

      {/* Combat log */}
      <div className="px-box px-box--dark combat-log" ref={logRef}>
        {visibleLog.length === 0
          ? <div className="log-entry log-entry--info">Le combat commence...</div>
          : visibleLog.map(entry => (
              <div key={entry.id} className={`log-entry log-entry--${entry.type}`}>
                {entry.text}
              </div>
            ))
        }
        {isAnimating && <div className="log-entry log-entry--info blink">▌</div>}
      </div>

      {/* Actions */}
      <div className="px-box">
        <div className="t-xs t-dim mb8">{isAnimating ? '...' : 'ACTION :'}</div>
        <div className="col gap4">
          {cs.momentum >= 3 && (
            <button className="px-btn px-btn--primary" disabled={isAnimating} onClick={() => act({ type: 'finisher' })}>
              ★ FINISHER — 3× dégâts, reset momentum
            </button>
          )}

          <button className="px-btn" disabled={isAnimating} onClick={() => act({ type: 'attack' })}>
            {weapon ? `⚔ Attaquer avec ${weapon.name}` : '✊ Combat à mains nues'} · -20 stamina
          </button>

          {gs.stamina >= 20 && (
            <button className="px-btn" disabled={isAnimating} onClick={() => act({ type: 'offensive' })}>
              ⚡ Attaque offensive · +30% dmg, tu t'exposes (+20% reçu) · -20 sta
            </button>
          )}
          {gs.stamina >= 15 && (
            <button className="px-btn" disabled={isAnimating} onClick={() => act({ type: 'defensive' })}>
              🛡 Attaque défensive · -30% dmg reçu, +10 sta · -15 sta
            </button>
          )}
          {gs.stamina >= 10 && (
            <button className="px-btn" disabled={isAnimating} onClick={() => act({ type: 'dodge' })}>
              💨 Attaque en esquive · 40% évitement, -40% dmg infligé · -10 sta
            </button>
          )}
          {gs.stamina >= 50 && (
            <button className="px-btn" disabled={isAnimating} onClick={() => act({ type: 'focused' })}>
              🎯 Frappe concentrée · +60% dmg · -50 sta
            </button>
          )}
          {gs.moralTags.includes('cannibal') && gs.stamina >= 25 && (
            <button className="px-btn" disabled={isAnimating} onClick={() => act({ type: 'bite' })}
              style={{ color: 'var(--red)', borderColor: 'var(--red)' }}>
              🩸 Morsure · ignore armure · -15 folie · -25 sta
              {(gs.folieLevel ?? 0) >= 50 ? ` · folie ${gs.folieLevel}` : ''}
            </button>
          )}
          {hasSpecial && gs.stamina >= 35 && (
            <button className="px-btn" style={{ color: 'var(--purple)' }} disabled={isAnimating} onClick={() => act({ type: 'special' })}>
              ✨ Attaque spéciale — {weapon!.effectDesc} ({weapon!.effectChance}%) · -35 sta
            </button>
          )}

          <hr className="divider" />

          {!cs.classActionUsed && (
            <ClassAction gs={gs} onAct={(a) => {
              if (a.type === 'class' && gs.class.name === 'Hackeur') {
                if (isAnimating) return
                setHackOpen(true)
              } else {
                act(a)
              }
            }} disabled={isAnimating} />
          )}

          {gs.reputation > 0 && (
            <button className="px-btn t-dim" disabled={isAnimating} onClick={() => act({ type: 'intimidate' })}>
              😤 Intimider · {Math.floor(gs.reputation / 5)}% succès
            </button>
          )}
          <button className="px-btn t-dim" disabled={isAnimating} onClick={() => act({ type: 'negotiate' })}>
            🗣 Négocier · {20 + Math.max(0, Math.floor(gs.reputation / 8))}% succès
          </button>
          <button className="px-btn t-dim" disabled={isAnimating} onClick={() => act({ type: 'rest' })}>
            ○ Souffler · +40 stamina · l'ennemi attaque sans riposte
          </button>
          {(gs.cargo['Médicaments'] ?? 0) > 0 && (
            <button className="px-btn px-btn--green" disabled={isAnimating} onClick={() => act({ type: 'heal' })}>
              ✚ Se soigner +30 PV · Médicaments : {gs.cargo['Médicaments']}
            </button>
          )}
          {(gs.cargo['Eau purifiée'] ?? 0) > 0 && gs.stamina < gs.maxStamina && (
            <button className="px-btn px-btn--green" disabled={isAnimating} onClick={() => act({ type: 'water' })}>
              💧 Eau purifiée · stamina max · ×{gs.cargo['Eau purifiée']}
            </button>
          )}
          {(gs.cargo['Drogues de synthèse'] ?? 0) > 0 && (
            <button
              className={`px-btn ${(gs.addictionLevel ?? 0) > 0 ? 'px-btn--danger' : 'px-btn--primary'}`}
              disabled={isAnimating}
              onClick={() => act({ type: 'drug' })}
            >
              💉 Drogues de synthèse ×{gs.cargo['Drogues de synthèse']}
              {(gs.addictionLevel ?? 0) > 0 ? ' · ACCRO — overdose !' : ' · +20 PV, +25 Sta'}
            </button>
          )}
          {gs.fuel > 0 && (
            <button className="px-btn px-btn--danger" disabled={isAnimating} onClick={() => act({ type: 'flee' })}>
              🏃 Fuir · {50 + (gs.fuel > 2 ? 15 : 0) + (gs.class.name === 'Contrebandier' ? 20 : 0)}% succès · -1 carburant
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ClassAction({ gs, onAct, disabled }: { gs: ReturnType<typeof useGameStore.getState>['gs'] & object; onAct: (a: CombatAction) => void; disabled: boolean }) {
  if (!gs) return null
  switch (gs.class.name) {
    case 'Seigneur de guerre':
      return <button className="px-btn" style={{ color: 'var(--cyan)' }} disabled={disabled} onClick={() => onAct({ type: 'class' })}>
        [SEIGNEUR] Intimidation de combat · ennemi perd son tour · 1×/combat
      </button>
    case 'Médecin':
      return gs.stamina >= 20 ? <button className="px-btn" style={{ color: 'var(--cyan)' }} disabled={disabled} onClick={() => onAct({ type: 'class' })}>
        [MÉDECIN] Soin rapide +30 PV sans perdre son tour · -20 sta · 1×/combat
      </button> : null
    case 'Hackeur':
      return gs.stamina >= 30 ? <button className="px-btn" style={{ color: 'var(--cyan)' }} disabled={disabled} onClick={() => onAct({ type: 'class' })}>
        [HACKEUR] Pirater équipement ennemi · 2 tours désactivé · -30 sta · 1×/combat
      </button> : null
    case 'Contrebandier':
      return gs.fuel > 0 ? <button className="px-btn" style={{ color: 'var(--cyan)' }} disabled={disabled} onClick={() => onAct({ type: 'class' })}>
        [CONTREBANDIER] Fuite garantie · -1 carburant · 1×/combat
      </button> : null
    case 'Vagabond':
      return <button className="px-btn" style={{ color: 'var(--cyan)' }} disabled={disabled} onClick={() => onAct({ type: 'class' })}>
        [VAGABOND] Coup bas · ignore armure, dégâts élevés · -10 rép · 1×/combat
      </button>
    default: return null
  }
}

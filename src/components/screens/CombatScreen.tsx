import { useEffect, useRef, useState, useCallback } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { CombatAction } from '../../engine/combat'
import type { CombatLogEntry } from '../../types'
import { HackSequence } from '../minigames/HackSequence'
import { useFloatingNumbers, FloatingNumbersLayer } from '../ui/FloatingNumber'
import { playHit, playCrit, playHeal, playFlee, playClick, playVictory, playDeath } from '../../engine/sfx'

type NegotiateCondition = {
  id: string
  label: string
  desc: string
  available: boolean
  whyNot?: string
  accept: () => void
}

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

  const patch = useGameStore(s => s.patch)

  const [visibleLog, setVisibleLog]           = useState<CombatLogEntry[]>([])
  const [queue, setQueue]                     = useState<CombatLogEntry[]>([])
  const [frozenHp, setFrozenHp]               = useState<{ player: number; enemy: number } | null>(null)
  const [hackOpen, setHackOpen]               = useState(false)
  const [negotiateConditions, setNegotiateConditions] = useState<NegotiateCondition[] | null>(null)
  const [enemyDamaged, setEnemyDamaged]       = useState(false)
  const [playerDamaged, setPlayerDamaged]     = useState(false)
  const prevEnemyHp  = useRef(cs.enemyHp)
  const prevPlayerHp = useRef(gs.playerHp)
  const isAnimating = queue.length > 0

  const { containerRef: playerRef, entries: playerFloats, fire: firePlayer } = useFloatingNumbers()
  const { containerRef: enemyRef,  entries: enemyFloats,  fire: fireEnemy  } = useFloatingNumbers()

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

  // Shake + SFX + chiffres flottants quand les HP changent
  useEffect(() => {
    const delta = cs.enemyHp - prevEnemyHp.current
    if (delta < 0) {
      setEnemyDamaged(true)
      const t = setTimeout(() => setEnemyDamaged(false), 380)
      fireEnemy(`-${Math.abs(delta)}`, delta < -30 ? 'var(--red)' : 'var(--orange)')
      if (delta < -30) playCrit(); else playHit()
      prevEnemyHp.current = cs.enemyHp
      return () => clearTimeout(t)
    }
    prevEnemyHp.current = cs.enemyHp
  }, [cs.enemyHp])

  useEffect(() => {
    const delta = gs.playerHp - prevPlayerHp.current
    if (delta < 0) {
      setPlayerDamaged(true)
      const t = setTimeout(() => setPlayerDamaged(false), 380)
      firePlayer(`-${Math.abs(delta)}`, 'var(--red)')
      prevPlayerHp.current = gs.playerHp
      return () => clearTimeout(t)
    } else if (delta > 0) {
      firePlayer(`+${delta}`, 'var(--green)')
      playHeal()
    }
    prevPlayerHp.current = gs.playerHp
  }, [gs.playerHp])

  useEffect(() => {
    if (victoryPending) playVictory()
  }, [victoryPending])

  useEffect(() => {
    if (deathPending) playDeath()
  }, [deathPending])

  const shownPlayerHp = frozenHp?.player ?? gs.playerHp
  const shownEnemyHp  = frozenHp?.enemy  ?? cs.enemyHp
  const hpPct  = (shownEnemyHp  / enemy.maxHp)    * 100
  const phPct  = (shownPlayerHp / gs.playerMaxHp) * 100
  const staPct = (gs.stamina    / gs.maxStamina)  * 100

  function act(action: CombatAction) {
    if (isAnimating || victoryPending) return
    setFrozenHp({ player: gs.playerHp, enemy: cs.enemyHp })
    playClick()
    submit(action)
  }

  function flee() {
    playFlee()
    act({ type: 'flee' })
  }

  function generateNegotiateConditions(): NegotiateCondition[] {
    const pool: NegotiateCondition[] = []
    const demand = (Math.floor(Math.random() * 8) + 3) * 100

    pool.push({
      id: 'credits',
      label: `Payer ${demand.toLocaleString()} cr`,
      desc: `"Tu veux passer ? Montre-moi ce que ça vaut pour toi. Du liquide, maintenant."`,
      available: gs.credits >= demand,
      whyNot: gs.credits < demand ? `Il te manque ${(demand - gs.credits).toLocaleString()} cr` : undefined,
      accept: () => { patch({ credits: gs.credits - demand }); act({ type: 'negotiate-accept' }); setNegotiateConditions(null) },
    })

    if (Object.keys(gs.cargo).length > 0) {
      const cargoLabel = Object.entries(gs.cargo).map(([k, v]) => `${k} ×${v}`).join(', ')
      pool.push({
        id: 'cargo',
        label: 'Vider ta soute',
        desc: `"Laisse tout ce que t'as là-dedans — ${cargoLabel} — et tu repars avec tes os en bon état."`,
        available: true,
        accept: () => { patch({ cargo: {} }); act({ type: 'negotiate-accept' }); setNegotiateConditions(null) },
      })
    }

    pool.push({
      id: 'favor',
      label: 'Faveur personnelle',
      desc: `Il te regarde de haut en bas, s'attarde. Un sourire en coin. "Je veux une faveur. Du genre... personnel. Tu vois ce que je veux dire."`,
      available: true,
      accept: () => { patch({ reputation: gs.reputation - 5 }); act({ type: 'negotiate-accept' }); setNegotiateConditions(null) },
    })

    if (gs.equippedWeapon) {
      const w = gs.equippedWeapon
      pool.push({
        id: 'weapon',
        label: `Laisser ${w.name}`,
        desc: `"Cette arme. Pose-la par terre et recule. Je te laisse partir."`,
        available: true,
        accept: () => {
          patch({ weapons: gs.weapons.filter(x => x !== w), equippedWeapon: null })
          act({ type: 'negotiate-accept' })
          setNegotiateConditions(null)
        },
      })
    }

    if (gs.equippedArmor) {
      pool.push({
        id: 'armor',
        label: `Retirer ton armure`,
        desc: `"L'armure. Tu l'enlèves, tu la poses là. On est quittes."`,
        available: true,
        accept: () => { patch({ equippedArmor: null }); act({ type: 'negotiate-accept' }); setNegotiateConditions(null) },
      })
    }

    pool.push({
      id: 'rep',
      label: 'Jurer de quitter le secteur',
      desc: `"Tu jures sur ta vie que tu remets plus les pieds ici, et tu le fais savoir. Partout."`,
      available: true,
      accept: () => { patch({ reputation: gs.reputation - 15 }); act({ type: 'negotiate-accept' }); setNegotiateConditions(null) },
    })

    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(pool.length, Math.floor(Math.random() * 2) + 2))
  }

  const weapon = gs.equippedWeapon
  const hasSpecial = weapon && !['none','silence','armorPierce'].includes(weapon.effect)

  function dmgRange(mult: number): string {
    const classMult = gs.class.combatAttackMult ?? 1.0
    let min: number, max: number
    if (weapon) {
      const aff = (weapon.affinities as Record<string, number>)[gs.class.name] ?? 1.0
      const ap = weapon.effect === 'armorPierce' ? 1.3 : 1.0
      min = Math.floor(weapon.damageMin * aff * ap * classMult * mult)
      max = Math.floor(weapon.damageMax * aff * ap * classMult * mult)
    } else {
      let bMin = 5, bMax = 18
      if (gs.class.name === 'Seigneur de guerre') { bMin += 8; bMax += 20 }
      else if (gs.class.name === 'Vétéran') { bMin += 5; bMax += 12 }
      else if (gs.class.name === 'Vagabond') { bMin = Math.max(1, bMin - 5) }
      min = Math.floor(bMin * classMult * mult)
      max = Math.floor(bMax * classMult * mult)
    }
    return `${min}–${max}`
  }

  function enemyDmgRange(stanceMult = 1.0): string {
    const armor = gs.equippedArmor
    const defMult = gs.class.combatDefenseMult ?? 1.0
    const reductPct = armor ? armor.defense / 100 : 0
    const min = Math.max(0, Math.floor(enemy.damageMin * defMult * stanceMult * (1 - reductPct)))
    const max = Math.max(0, Math.floor(enemy.damageMax * defMult * stanceMult * (1 - reductPct)))
    return `${min}–${max}`
  }

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
      {negotiateConditions && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ maxWidth: '600px', width: '100%' }} className="col gap4">
            <div className="t-xs t-dim t-center">— NÉGOCIATION —</div>
            <div className="px-box" style={{ borderColor: 'var(--cyan)' }}>
              <div className="t-sm t-bright mb4">{enemy.name} pose ses conditions</div>
              <div className="t-xs t-dim mb8" style={{ fontStyle: 'italic', lineHeight: '2' }}>
                "Si tu veux t'en sortir vivant, voilà ce que ça va coûter."
              </div>
              <div className="col gap4">
                {negotiateConditions.map(c => (
                  <button key={c.id} className="px-btn" disabled={!c.available}
                    style={{ borderColor: c.available ? 'var(--cyan)' : undefined, textAlign: 'left' }}
                    onClick={() => c.accept()}>
                    <div className="t-xs t-bright mb4">{c.label}</div>
                    <div className="t-xs t-dim" style={{ lineHeight: '1.8' }}>{c.desc}</div>
                    {!c.available && c.whyNot && <div className="t-xs t-red mt2">{c.whyNot}</div>}
                  </button>
                ))}
              </div>
            </div>
            <button className="px-btn t-dim" onClick={() => setNegotiateConditions(null)}>
              ← Refuser — continuer le combat
            </button>
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
        <div className="px-box" ref={playerRef} style={{ position: 'relative', overflow: 'visible' }}>
          <FloatingNumbersLayer entries={playerFloats} />
          <div className="t-sm t-bright mb8">TOI</div>
          <div className="t-xs t-dim mb4">PV</div>
          <div className={`bar bar--hp ${phPct < 30 ? 'low' : phPct < 60 ? 'medium' : ''} ${playerDamaged ? 'hp-damaged' : ''}`}>
            <div className="bar__fill" style={{ width: `${phPct}%` }} />
          </div>
          <div className="t-xs mt4" style={{ color: phPct < 30 ? 'var(--red)' : phPct < 60 ? 'var(--orange)' : 'var(--green)' }}>
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
        <div className="px-box px-box--hi" ref={enemyRef} style={{ position: 'relative', overflow: 'visible' }}>
          <FloatingNumbersLayer entries={enemyFloats} />
          <div className="t-sm t-red mb4">{enemy.name}</div>
          <div className="t-xs t-dim mb8">{enemy.description}</div>

          <div className="t-xs t-dim mb4">PV ENNEMI</div>
          <div className={`bar bar--hp ${hpPct < 30 ? 'low' : hpPct < 60 ? 'medium' : ''} ${enemyDamaged ? 'hp-damaged' : ''}`}>
            <div className="bar__fill" style={{ width: `${hpPct}%` }} />
          </div>
          <div className="t-xs mt4" style={{ color: hpPct < 30 ? 'var(--red)' : hpPct < 60 ? 'var(--orange)' : 'var(--green)' }}>
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
      <div className="combat-log-wrap">
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
      </div>

      {/* Actions */}
      <div className="px-box">
        <div className="t-xs t-dim mb8">{isAnimating ? '...' : 'ACTION :'}</div>
        <div className="col gap4">
          {cs.momentum >= 3 && (
            <button className="px-btn px-btn--primary" disabled={isAnimating} onClick={() => act({ type: 'finisher' })}>
              ★ FINISHER · <span className="t-gold">{dmgRange(3)} dmg</span> · reset momentum
            </button>
          )}

          <button className="px-btn" disabled={isAnimating} onClick={() => act({ type: 'attack' })}>
            {weapon ? `⚔ ${weapon.name}` : '✊ Mains nues'}
            <span className="t-dim" style={{ marginLeft: '8px' }}><span className="t-bright">{dmgRange(1)} dmg</span> · -20 sta</span>
          </button>

          {gs.stamina >= 30 && (
            <button className="px-btn" disabled={isAnimating} onClick={() => act({ type: 'offensive' })}>
              ⚡ Offensive · <span className="t-bright">{dmgRange(1.3)} dmg</span>
              <span className="t-dim" style={{ marginLeft: '6px' }}>· tu encaisses +20% · -30 sta</span>
            </button>
          )}
          {gs.stamina >= 15 && (
            <button className="px-btn" disabled={isAnimating} onClick={() => act({ type: 'defensive' })}>
              🛡 Défensive · <span className="t-bright">{dmgRange(1)} dmg</span>
              <span className="t-dim" style={{ marginLeft: '6px' }}>· reçois <span className="t-green">{enemyDmgRange(0.70)} dmg</span> · -15 sta</span>
            </button>
          )}
          {gs.stamina >= 10 && (
            <button className="px-btn" disabled={isAnimating} onClick={() => act({ type: 'dodge' })}>
              💨 Esquive · <span className="t-bright">{dmgRange(0.6)} dmg</span>
              <span className="t-dim" style={{ marginLeft: '6px' }}>· 40% évitement · -10 sta</span>
            </button>
          )}
          {gs.stamina >= 50 && (
            <button className="px-btn" disabled={isAnimating} onClick={() => act({ type: 'focused' })}>
              🎯 Concentrée · <span className="t-bright">{dmgRange(1.6)} dmg</span>
              <span className="t-dim" style={{ marginLeft: '6px' }}>· tu es vulnérable (×1.5 reçu) · -50 sta</span>
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
              ✨ Spéciale — {weapon!.effectDesc} ({weapon!.effectChance}%) · -35 sta
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
              😤 Intimider · {Math.min(75, Math.floor(gs.reputation / 5))}% succès
            </button>
          )}
          {enemy.isBoss
            ? (
              <button className="px-btn t-dim" disabled style={{ opacity: 0.35 }}>
                🗣 Négocier — sans effet sur ce type d'ennemi
              </button>
            )
            : (() => {
              const chance = Math.min(70, 20 + Math.max(0, Math.floor(gs.reputation / 8)))
              return (
                <button className="px-btn t-dim" disabled={isAnimating} onClick={() => {
                  if (Math.random() * 100 < chance) {
                    setNegotiateConditions(generateNegotiateConditions())
                  } else {
                    act({ type: 'negotiate' })
                  }
                }}>
                  🗣 Négocier · {chance}% qu'il accepte de parler
                </button>
              )
            })()
          }
          <button className="px-btn t-dim" disabled={isAnimating} onClick={() => act({ type: 'rest' })}>
            ○ Souffler · +40 stamina · l'ennemi attaque sans riposte
          </button>
          {(gs.cargo['Médicaments'] ?? 0) > 0 && (
            <button className="px-btn px-btn--green" disabled={isAnimating || cs.medicUses >= 3} onClick={() => act({ type: 'heal' })}>
              ✚ Se soigner +30 PV · Médicaments : {gs.cargo['Médicaments']} {cs.medicUses >= 3 ? '· LIMITE ATTEINTE' : `· Soins ${cs.medicUses}/3`}
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
          {(gs.cargo['Médicaments premium'] ?? 0) > 0 && gs.playerHp < gs.playerMaxHp && (
            <button className="px-btn px-btn--green" disabled={isAnimating || cs.medicUses >= 3} onClick={() => act({ type: 'premium_med' })}>
              ✚✚ Médicaments premium +60 PV · ×{gs.cargo['Médicaments premium']} {cs.medicUses >= 3 ? '· LIMITE' : `· ${cs.medicUses}/3`}
            </button>
          )}
          {(gs.cargo['Plantes médicinales'] ?? 0) > 0 && gs.playerHp < gs.playerMaxHp && (
            <button className="px-btn px-btn--green" disabled={isAnimating || cs.medicUses >= 3} onClick={() => act({ type: 'herb' })}>
              🌿 Plantes médicinales +25 PV · ×{gs.cargo['Plantes médicinales']} {cs.medicUses >= 3 ? '· LIMITE' : `· ${cs.medicUses}/3`}
            </button>
          )}
          {(() => {
            const FOOD = ['Rations militaires', 'Rations', 'Vivres', 'Nourriture fraîche', 'Nourriture synthétique']
            const found = FOOD.find(k => (gs.cargo[k] ?? 0) > 0)
            if (!found || gs.playerHp >= gs.playerMaxHp) return null
            return (
              <button className="px-btn px-btn--green" disabled={isAnimating || cs.medicUses >= 3} onClick={() => act({ type: 'food' })}>
                🍖 {found} +15 PV · ×{gs.cargo[found]} {cs.medicUses >= 3 ? '· LIMITE' : `· ${cs.medicUses}/3`}
              </button>
            )
          })()}
          {(gs.cargo['Alcools exotiques'] ?? 0) > 0 && gs.stamina < gs.maxStamina && (
            <button className="px-btn" style={{ borderColor: 'var(--orange)', color: 'var(--orange)' }} disabled={isAnimating} onClick={() => act({ type: 'alcohol' })}>
              🥃 Alcools exotiques +60 Sta · l'ennemi attaque · ×{gs.cargo['Alcools exotiques']}
            </button>
          )}
          {gs.fuel > 0 && (
            <button className="px-btn px-btn--danger" disabled={isAnimating} onClick={flee}>
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

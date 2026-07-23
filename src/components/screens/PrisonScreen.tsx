import { useEffect, useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { StopTheBar, type StopResult } from '../minigames/StopTheBar'
import { addJournal } from '../../engine/journal'
import { tickWorldEventsMultipleDays } from '../../engine/worldEvents'
import type { GameState, WeaponData, ArmorData } from '../../types'

type EscapePhase = 'menu' | 'playing' | 'between' | 'caught' | 'escape-final-roll' | 'success' | 'execution'

const ROUND_LABELS = ["Serrure de cellule", "Couloir de garde", "Porte de sortie"]
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

const PRISON_PILLAR_STATIONS: Record<string, keyof GameState['pillarStanding']> = {
  'Emporium Requiem':     'cesarion',
  "L'Arc Perdu":          'raphazarus',
  'Arc Ouest Apocalypse': 'alanossa',
  'Scotty Golden North':  'scotty',
  'La Tribosphère':       'eliotis',
  'Paradoxa Eterna':      'maxance',
}

// ── ÉVÉNEMENTS QUOTIDIENS (non-combat) ────────────────────────────────────────

interface PrisonEvent {
  text: string
  hpDelta: number
  hpMaxDelta: number
  creditsDelta: number
  repDelta: number
}

function rollPrisonEvent(gs: GameState): PrisonEvent {
  const r = Math.random()
  if (r < 0.15) {
    // Vol nocturne
    const stolen = Math.min(gs.credits, 80 + Math.floor(Math.random() * 150))
    return { text: `Quelqu'un fouille tes affaires pendant la nuit. −${stolen} cr.`, hpDelta: 0, hpMaxDelta: 0, creditsDelta: -stolen, repDelta: 0 }
  }
  if (r < 0.27) {
    // Maladie — HP max permanent
    const loss = 5 + Math.floor(Math.random() * 8)
    return { text: `Tu tombes malade. L'infirmerie est une fiction ici. −${loss} HP max (permanent).`, hpDelta: -loss, hpMaxDelta: -loss, creditsDelta: 0, repDelta: 0 }
  }
  if (r < 0.38) {
    // Interrogatoire surprise
    return { text: `Interrogatoire surprise. Rien de neuf — mais ça use. −5 rép.`, hpDelta: -8, hpMaxDelta: 0, creditsDelta: 0, repDelta: -5 }
  }
  if (r < 0.48) {
    // Solidarité
    const heal = 8 + Math.floor(Math.random() * 12)
    return { text: `Un codétenu partage sa ration. Un geste rare. +${heal} PV.`, hpDelta: heal, hpMaxDelta: 0, creditsDelta: 0, repDelta: 0 }
  }
  if (r < 0.55) {
    // Information
    return { text: `Tu entends une conversation à travers les murs. Des noms, des routes. Ça reste.`, hpDelta: 0, hpMaxDelta: 0, creditsDelta: 0, repDelta: 3 }
  }
  return { text: `Une journée de plus. Les murs ne changent pas.`, hpDelta: 0, hpMaxDelta: 0, creditsDelta: 0, repDelta: 0 }
}

// ── RESTORATION D'ITEMS ────────────────────────────────────────────────────────

function buildItemRestore(gs: GameState, fraction: number): Partial<GameState> {
  const items = gs.prisonConfiscatedItems
  if (!items) return { prisonConfiscatedItems: null, prisonEscapeFailures: 0, prisonCellmatePending: false }

  if (fraction <= 0) {
    return { prisonConfiscatedItems: null, prisonEscapeFailures: 0, prisonCellmatePending: false }
  }

  const keepWeapon = (w: WeaponData) => fraction >= 1 || Math.random() < fraction
  const keepArmor  = (a: ArmorData)  => fraction >= 1 || Math.random() < fraction

  const weaponsBack = items.weapons.filter(keepWeapon)
  const armorsBack  = items.armors.filter(keepArmor)

  const cargoBack: Record<string, number> = {}
  for (const [item, qty] of Object.entries(items.cargo)) {
    const n = fraction >= 1 ? qty : Math.max(0, Math.floor(qty * fraction))
    if (n > 0) cargoBack[item] = n
  }

  const eqWeapon = items.equippedWeapon && weaponsBack.some(w => w.name === items.equippedWeapon?.name)
    ? items.equippedWeapon : null
  const eqArmor = items.equippedArmor && armorsBack.some(a => a.name === items.equippedArmor?.name)
    ? items.equippedArmor : null

  const mergedCargo = { ...gs.cargo }
  for (const [item, qty] of Object.entries(cargoBack)) {
    mergedCargo[item] = (mergedCargo[item] ?? 0) + qty
  }

  return {
    weapons: [...gs.weapons, ...weaponsBack],
    armors:  [...gs.armors, ...armorsBack],
    equippedWeapon: gs.equippedWeapon ?? eqWeapon,
    equippedArmor:  gs.equippedArmor  ?? eqArmor,
    cargo: mergedCargo,
    prisonConfiscatedItems: null,
    prisonEscapeFailures: 0,
    prisonCellmatePending: false,
  }
}

// ── COMPOSANT ─────────────────────────────────────────────────────────────────

export function PrisonScreen() {
  const gs           = useGameStore(s => s.gs!)
  const patch        = useGameStore(s => s.patch)
  const goTo         = useGameStore(s => s.goTo)
  const startCombat  = useGameStore(s => s.startCombat)

  const [msg, setMsg]       = useState<string | null>(null)
  const [freed, setFreed]   = useState(false)
  const [dailyLog, setDailyLog] = useState<string[]>([])
  const [escapePhase, setEscapePhase] = useState<EscapePhase>('menu')
  const [round, setRound]   = useState(1)

  const days    = gs.prisonDaysLeft ?? 1
  const caution = 800 + gs.day * 40
  const failures = gs.prisonEscapeFailures ?? 0

  // ── CONFISCATION À L'ENTRÉE ─────────────────────────────────────────────
  useEffect(() => {
    if (!gs.isImprisoned || gs.prisonConfiscatedItems !== null) return
    const cellmate = Math.random() < 0.45
    patch({
      prisonConfiscatedItems: {
        weapons: gs.weapons,
        armors:  gs.armors,
        equippedWeapon: gs.equippedWeapon,
        equippedArmor:  gs.equippedArmor,
        cargo: { ...gs.cargo },
      },
      weapons: [],
      armors:  [],
      equippedWeapon: null,
      equippedArmor:  null,
      cargo: {},
      prisonEscapeFailures: 0,
      prisonCellmatePending: cellmate,
    })
  }, [])

  // ── HELPERS ──────────────────────────────────────────────────────────────

  function getItemFractionText(frac: number) {
    if (frac >= 1)   return 'tous tes items'
    if (frac >= 0.5) return '~50% de tes items'
    if (frac > 0)    return '~25% de tes items'
    return 'aucun item'
  }

  function serveTime() {
    const debtLoss = (gs.class.dailyDebt ?? 0) * days
    const events: PrisonEvent[] = Array.from({ length: days }, () => rollPrisonEvent(gs))
    const log = events.map((e, i) => `Jour ${i + 1} : ${e.text}`)

    const evtHpDelta    = events.reduce((s, e) => s + e.hpDelta, 0)
    const evtHpMaxDelta = events.reduce((s, e) => s + e.hpMaxDelta, 0)
    const evtCrDelta    = events.reduce((s, e) => s + e.creditsDelta, 0)
    const evtRepDelta   = events.reduce((s, e) => s + e.repDelta, 0)

    const baseHpPct   = Math.max(0.05, 0.45 - days * 0.05)
    const baseStamPct = Math.max(0.10, 0.60 - days * 0.07)
    const baseRepLoss = 8 + days * 4

    const newHpMax = Math.max(10, gs.playerMaxHp + evtHpMaxDelta)
    const finalHp  = Math.max(1, Math.floor(newHpMax * baseHpPct) + evtHpDelta)
    const finalSt  = Math.max(1, Math.floor(gs.maxStamina * baseStamPct))
    const finalRep = gs.reputation - baseRepLoss + evtRepDelta
    const finalCr  = Math.max(0, gs.credits + evtCrDelta - debtLoss)

    const pillarKey = PRISON_PILLAR_STATIONS[gs.currentStation]
    const pillarPenalty = days * 3
    const newStanding = pillarKey
      ? { ...gs.pillarStanding, [pillarKey]: Math.max(-100, (gs.pillarStanding?.[pillarKey] ?? 0) - pillarPenalty) }
      : gs.pillarStanding

    // Quêtes qui expirent pendant la peine
    const expiredQuests = gs.activeQuests.filter(q => q.dayMult && gs.day + days > (q as { deadline?: number }).deadline!)
    const survivingQuests = gs.activeQuests.filter(q => !expiredQuests.includes(q))
    const expiredCount = expiredQuests.length

    // Standing faction dégradé (double pénalité si mission faction en cours)
    const hasFactionMission = gs.activeQuests.some(q => expiredQuests.includes(q) && gs.faction !== 'none')
    const factionStandingLoss = hasFactionMission ? days * 8 : days * 3

    const itemPatch = buildItemRestore(gs, 0.5)
    const journalText = `J'ai purgé ${days} jour${days > 1 ? 's' : ''} à ${gs.currentStation}. ${days >= 5 ? 'Long. Trop long.' : "Chaque heure pesait son poids."}${expiredCount > 0 ? ` ${expiredCount} contrat${expiredCount > 1 ? 's' : ''} perdu${expiredCount > 1 ? 's' : ''} en prison.` : ''}`

    const afterEvents = tickWorldEventsMultipleDays({ ...gs, day: gs.day + days }, days)

    patch({
      isImprisoned: false, prisonDaysLeft: 0,
      day: gs.day + days,
      activeWorldEvents: afterEvents.activeWorldEvents,
      stationAlerts: afterEvents.stationAlerts,
      playerHp: finalHp, playerMaxHp: newHpMax,
      stamina: finalSt,
      reputation: finalRep - (expiredCount * 5),
      credits: finalCr,
      pillarStanding: newStanding,
      activeQuests: survivingQuests,
      factionReputation: gs.faction !== 'none'
        ? { ...gs.factionReputation, [gs.faction]: Math.max(0, gs.factionReputation[gs.faction] - factionStandingLoss) }
        : gs.factionReputation,
      journal: addJournal(gs, journalText, 'prison'),
      ...itemPatch,
    })
    setDailyLog(log)
    const lines = [
      `${days} jour${days > 1 ? 's' : ''} purgé${days > 1 ? 's' : ''}.`,
      `Sortie : ${finalHp} PV (max ${newHpMax}), stamina ${finalSt}.`,
      `Réputation : ${finalRep - (expiredCount * 5) > gs.reputation ? '+' : ''}${(finalRep - (expiredCount * 5)) - gs.reputation}.`,
      finalCr < gs.credits ? `−${(gs.credits - finalCr).toLocaleString()} cr.` : null,
      pillarKey ? `−${pillarPenalty} standing ${pillarKey}.` : null,
      expiredCount > 0 ? `⚠ ${expiredCount} quête${expiredCount > 1 ? 's' : ''} expirée${expiredCount > 1 ? 's' : ''} (−${expiredCount * 5} rép supplémentaire).` : null,
      hasFactionMission ? `⚠ Mission faction abandonnée — −${factionStandingLoss} standing faction.` : null,
      `Items récupérés : ${getItemFractionText(0.5)}.`,
    ].filter(Boolean) as string[]
    setMsg(lines.join(' '))
    setFreed(true)
  }

  function payCaution() {
    if (gs.credits < caution) { setMsg(`Il te manque ${caution - gs.credits} cr.`); return }
    const itemPatch = buildItemRestore(gs, 0.5)
    patch({
      credits: gs.credits - caution,
      isImprisoned: false, prisonDaysLeft: 0,
      playerHp: Math.max(1, Math.floor(gs.playerMaxHp * 0.60)),
      reputation: gs.reputation - 8,
      journal: addJournal(gs, `J'ai payé la caution à ${gs.currentStation}. ${caution.toLocaleString()} crédits. Ma liberté a un prix.`, 'prison'),
      ...itemPatch,
    })
    setMsg(`Caution payée. −${caution} cr. 60% PV. −8 rép. ${getItemFractionText(0.5)} récupérés.`)
    setFreed(true)
  }

  function bribeGuard() {
    if (gs.credits < 400) { setMsg('Pas assez de crédits.'); return }
    const ok = Math.random() < 0.50 + (gs.reputation > 40 ? 0.10 : 0)
    if (ok) {
      const itemPatch = buildItemRestore(gs, 0.5)
      patch({
        credits: gs.credits - 400,
        isImprisoned: false, prisonDaysLeft: 0,
        playerHp: Math.max(1, Math.floor(gs.playerMaxHp * 0.50)),
        prisonEscapes: gs.prisonEscapes + 1,
        journal: addJournal(gs, `J'ai soudoyé un garde à ${gs.currentStation}. Il a regardé ailleurs. Je suis sorti.`, 'prison'),
        ...itemPatch,
      })
      setMsg(`Le garde empoche les 400 cr et regarde ailleurs. ${Math.floor(gs.playerMaxHp * 0.50)} PV. ${getItemFractionText(0.5)} récupérés.`)
      setFreed(true)
    } else {
      patch({ credits: gs.credits - 400, prisonDaysLeft: days + 1 })
      setMsg(`Il prend l'argent ET appelle du renfort. +1 jour. ${days + 1} jours restants.`)
    }
  }

  function fightCellmate() {
    const power = 30 + Math.floor(gs.day * 1.8)
    startCombat({
      name: 'Codétenu hostile',
      maxHp: power,
      damageMin: 7, damageMax: 17,
      lootMin: 60, lootMax: 180,
      description: "Il a le regard de quelqu'un qui n'a plus rien à perdre. Dans une cellule, c'est le pire type d'adversaire.",
      captureChance: 0,
      killChance: 5,
      isBoss: false,
      role: 'normal',
    })
    patch({ prisonCellmatePending: false })
  }

  function ignoreCellmate() {
    // L'ignorer coûte des PV — il te frappe de dos
    const dmg = 12 + Math.floor(Math.random() * 20)
    patch({ prisonCellmatePending: false, playerHp: Math.max(1, gs.playerHp - dmg) })
    setMsg(`Tu l'ignores. Il te frappe dans le dos. −${dmg} PV.`)
  }

  // ── RÉSULTAT D'ÉVASION ────────────────────────────────────────────────────

  function handleRoundResult(result: StopResult) {
    if (result === 'miss') {
      const dmg = 20 + round * 15
      const addDays = TOTAL_ROUNDS - round + 1
      const newFailures = failures + 1
      if (newFailures >= 4) {
        patch({ playerHp: Math.max(1, gs.playerHp - dmg), prisonDaysLeft: days + addDays, prisonEscapeFailures: newFailures })
        setEscapePhase('execution')
      } else {
        const itemFrac = newFailures >= 2 ? 0 : 0.25
        const itemPatch = buildItemRestore(gs, itemFrac)
        patch({
          playerHp: Math.max(1, gs.playerHp - dmg),
          prisonDaysLeft: days + addDays,
          prisonEscapeFailures: newFailures,
          ...itemPatch,
          prisonConfiscatedItems: itemFrac === 0 ? null : {
            weapons: [], armors: [], equippedWeapon: null, equippedArmor: null, cargo: {}
          },
        })
        setEscapePhase('caught')
      }
    } else {
      if (round >= TOTAL_ROUNDS) {
        setEscapePhase('escape-final-roll')
      } else {
        setEscapePhase('between')
      }
    }
  }

  function resolveEscapeFinalRoll() {
    const escaped = Math.random() < 0.70
    if (escaped) {
      // Vraiment libre — récupère 75% des items (tu as pris ce que tu pouvais)
      const itemPatch = buildItemRestore(gs, 0.75)
      patch({
        isImprisoned: false, prisonDaysLeft: 0,
        playerHp: Math.max(1, gs.playerHp - 10),
        prisonEscapes: gs.prisonEscapes + 1,
        reputation: gs.reputation + 25,
        journal: addJournal(gs, `Je me suis évadé de la prison de ${gs.currentStation}. Trois obstacles. Puis le vide. J'ai couru.`, 'prison'),
        ...itemPatch,
      })
      setEscapePhase('success')
    } else {
      // Rattrapé au dernier moment
      const newFailures = failures + 1
      const dmg = 25 + Math.floor(Math.random() * 20)
      if (newFailures >= 4) {
        patch({ playerHp: Math.max(1, gs.playerHp - dmg), prisonDaysLeft: days + 2, prisonEscapeFailures: newFailures })
        setEscapePhase('execution')
      } else {
        const itemFrac = newFailures >= 2 ? 0 : 0.25
        const itemPatch = buildItemRestore(gs, itemFrac)
        patch({
          playerHp: Math.max(1, gs.playerHp - dmg),
          prisonDaysLeft: days + 2,
          prisonEscapeFailures: newFailures,
          ...itemPatch,
          prisonConfiscatedItems: itemFrac === 0 ? null : {
            weapons: [], armors: [], equippedWeapon: null, equippedArmor: null, cargo: {}
          },
        })
        setEscapePhase('caught')
      }
    }
  }

  // ── COULOIR DE LA MORT ────────────────────────────────────────────────────
  if (escapePhase === 'execution') {
    return (
      <div className="layout scanlines" style={{ justifyContent: 'center', minHeight: '100vh', background: '#0a0000' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', width: '100%' }}>
          <div className="t-center" style={{ color: 'var(--red)', fontSize: '8px', letterSpacing: '6px', marginBottom: '24px' }}>
            █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █
          </div>
          <div className="px-box" style={{ borderColor: 'var(--red)', borderWidth: '2px', textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ fontSize: '11px', color: 'var(--red)', letterSpacing: '5px', marginBottom: '8px' }}>
              COULOIR DE LA MORT
            </div>
            <div style={{ fontSize: '22px', color: 'var(--red)', letterSpacing: '3px', marginBottom: '24px', fontWeight: 'bold' }}>
              SENTENCE FINALE
            </div>
            <div className="t-xs" style={{ color: 'var(--dim)', lineHeight: '2.4', marginBottom: '20px', fontStyle: 'italic' }}>
              Trois tentatives. Trois échecs.<br />
              La bêtise a ses propres limites — tu les as toutes franchies,<br />
              l'une après l'autre, avec une régularité presque admirable.
            </div>
            <div className="t-xs" style={{ color: 'var(--text)', lineHeight: '2.4', marginBottom: '20px' }}>
              On t'a accordé plus d'une chance.<br />
              Tu as refusé chacune d'entre elles.<br />
              Le couloir de la mort n'est pas fait pour les gens intelligents.<br />
              Tu t'y retrouves quand même.
            </div>
            <div className="t-xs" style={{ color: 'var(--red)', lineHeight: '2', marginBottom: '24px', letterSpacing: '1px' }}>
              Tes items ont été distribués entre les gardiens.<br />
              Personne ne s'est battu pour les avoir.
            </div>
            <div style={{ color: 'var(--dim)', fontSize: '8px', letterSpacing: '3px', marginBottom: '20px' }}>
              — FIN DE PEINE —
            </div>
          </div>
          <div className="t-center" style={{ color: 'var(--red)', fontSize: '8px', letterSpacing: '6px', margin: '16px 0' }}>
            █ █ █ █ █ █ █ █ █ █ █ █ █ █ █ █
          </div>
          <button className="px-btn px-btn--danger" style={{ letterSpacing: '2px' }} onClick={() => {
            patch({
              isDead: true,
              deathCause: 'Exécuté après trois tentatives d\'évasion. La bêtise a ses limites.',
              prisonConfiscatedItems: null,
            })
          }}>
            Accepter l'inévitable
          </button>
        </div>
      </div>
    )
  }

  // ── ROLL FINAL ÉVASION ────────────────────────────────────────────────────
  if (escapePhase === 'escape-final-roll') {
    return (
      <div className="layout" style={{ justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
          <div className="t-xs t-dim t-center mb8">— ÉVASION — Dernière porte franchie —</div>
          <div className="px-box" style={{ borderColor: 'var(--orange)', textAlign: 'center', padding: '24px' }}>
            <div className="t-xs t-orange mb8">TU ES DEHORS — PRESQUE</div>
            <div className="t-xs t-dim" style={{ lineHeight: '2.2' }}>
              Tu as franchi les trois obstacles. Mais l'espace entre toi et ton vaisseau
              est encore surveillé. 70% de chances de disparaître dans la nuit.
              30% de chances qu'ils t'attendent déjà.
            </div>
            <div className="t-xs t-dim mt8" style={{ fontStyle: 'italic' }}>
              {failures >= 3
                ? "⚠ TENTATIVE 4/4 — C'est ta dernière chance. Un échec ici, c'est la mort."
                : failures >= 2
                  ? "⚠ Tentative 3/4 — Il te reste une seule chance après celle-ci."
                  : failures >= 1
                    ? "Tentative 2/4 — Un nouvel échec et tu ne récupères plus rien."
                    : "Tentative 1/4 — Un nouvel échec te coûtera 25% de tes items."
              }
            </div>
          </div>
          <button className="px-btn px-btn--primary mt8" onClick={resolveEscapeFinalRoll}>
            Courir vers le vaisseau →
          </button>
        </div>
      </div>
    )
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
            Continuer → Tour {round + 1}/{TOTAL_ROUNDS}
          </button>
        </div>
      </div>
    )
  }

  // ── RATTRAPÉ ──────────────────────────────────────────────────────────────
  if (escapePhase === 'caught') {
    const addDays = Math.max(1, TOTAL_ROUNDS - round + 1)
    const itemLabel = failures >= 2 ? 'Aucun item récupéré' : failures >= 1 ? '25% items récupérés (reste confisqué)' : '25% items récupérés'
    return (
      <div className="layout" style={{ justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
          <div className="t-xs t-dim t-center mb8">— ÉVASION ÉCHOUÉE —</div>
          <div className="px-box" style={{ borderColor: 'var(--red)', textAlign: 'center', padding: '20px' }}>
            <div className="t-red" style={{ fontSize: '14px', letterSpacing: '2px', marginBottom: '12px' }}>RATTRAPÉ</div>
            <div className="t-xs t-dim" style={{ lineHeight: '2.2', marginBottom: '8px' }}>
              {round === 1 && "La serrure résiste. Une alarme silencieuse. Des pas dans le couloir."}
              {round === 2 && "La grille te bloque. Un garde se retourne. Il crie."}
              {round === 3 && "Si près. La porte ne s'ouvre pas à temps. Les lumières s'allument."}
            </div>
            <div className="t-xs t-red">+{addDays} jour{addDays > 1 ? 's' : ''} de peine. {itemLabel}.</div>
            {failures >= 3 && (
              <div className="t-xs mt4" style={{ color: 'var(--red)', letterSpacing: '1px', fontWeight: 'bold' }}>
                ⚠ TENTATIVE {failures}/{failures} ÉCHOUÉE — LA PROCHAINE EST LA MORT.
              </div>
            )}
            {failures === 2 && (
              <div className="t-xs t-red mt4">
                ⚠ Tentative 2/4 ratée — Il te reste 2 chances avant la mort.
              </div>
            )}
            {failures === 1 && (
              <div className="t-xs" style={{ color: 'var(--orange)' }}>
                Tentative 1/4 ratée — 3 chances restantes.
              </div>
            )}
          </div>
          <button className="px-btn mt8" onClick={() => { setEscapePhase('menu'); setRound(1) }}>
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
                <span className="t-xs t-dim">Items récupérés</span>
                <span className="t-xs t-orange">~75%</span>
              </div>
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
  const pillarKey = PRISON_PILLAR_STATIONS[gs.currentStation]
  const baseRepLoss = 8 + days * 4
  const baseHpPct   = Math.max(0.05, 0.45 - days * 0.05)
  const itemsCount  = (gs.prisonConfiscatedItems?.weapons.length ?? 0)
    + (gs.prisonConfiscatedItems?.armors.length ?? 0)
    + Object.keys(gs.prisonConfiscatedItems?.cargo ?? {}).length

  return (
    <div className="layout">
      <div className="t-center mb8" style={{ letterSpacing: '4px', color: 'var(--red)', fontSize: '9px' }}>
        ▓ ▓ ▓ ▓ CELLULE ▓ ▓ ▓ ▓
      </div>

      <div className="px-box" style={{ borderColor: 'var(--red)' }}>
        <div className="t-lg t-red t-center mb8">PRISON</div>
        <div className="t-xs t-dim mb8" style={{ lineHeight: '2' }}>
          Tes affaires ont été confisquées. Chaque tentative d'évasion ratée empire les conditions de ta libération.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="t-xs t-dim">Items confisqués</span>
            <span className="t-xs t-orange">{itemsCount} type{itemsCount !== 1 ? 's' : ''}</span>
          </div>
          {failures > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="t-xs t-dim">Tentatives d'évasion ratées</span>
              <span className="t-xs t-red">{failures}/3 {failures >= 3 ? '⚠ PROCHAINE = MORT' : failures >= 2 ? '⚠ 1 chance restante' : failures >= 1 ? '2 chances restantes' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Codétenu hostile */}
      {gs.prisonCellmatePending && (
        <div className="px-box" style={{ borderColor: 'var(--orange)' }}>
          <div className="t-xs t-orange mb4">CODÉTENU HOSTILE</div>
          <div className="t-xs t-dim mb8" style={{ lineHeight: '2' }}>
            Un type dans ta cellule te regarde comme si tu lui devais quelque chose. Il cherche les ennuis — ou une sortie. Dans les deux cas, ça finit pareil.
          </div>
          <div className="row gap4">
            <button className="px-btn px-btn--danger" style={{ flex: 1 }} onClick={fightCellmate}>
              Affronter (combat réel)
            </button>
            <button className="px-btn" style={{ flex: 1, color: 'var(--dim)' }} onClick={ignoreCellmate}>
              Ignorer (−PV garanti)
            </button>
          </div>
        </div>
      )}

      {/* Message non-libéré */}
      {!freed && msg && (
        <div className="px-box" style={{ borderColor: 'var(--orange)' }}>
          <div className="t-xs t-orange" style={{ lineHeight: '2' }}>{msg}</div>
        </div>
      )}

      {/* Résultat libération */}
      {freed && msg && (
        <div className="col gap4">
          <div className="px-box" style={{ borderColor: 'var(--green)' }}>
            <div className="t-xs t-green mb4">LIBÉRÉ</div>
            <div className="t-xs" style={{ color: 'var(--green)', lineHeight: '2' }}>{msg}</div>
          </div>
          {dailyLog.length > 0 && (
            <div className="px-box" style={{ borderColor: 'var(--border)', padding: '8px 12px' }}>
              <div className="t-xs t-dim mb4" style={{ letterSpacing: '1px' }}>JOURNAL DE CELLULE</div>
              {dailyLog.map((line, i) => (
                <div key={i} className="t-xs t-dim" style={{ lineHeight: '1.8', borderLeft: '2px solid var(--border)', paddingLeft: '8px', marginBottom: '3px' }}>
                  {line}
                </div>
              ))}
            </div>
          )}
          <button className="px-btn px-btn--primary" onClick={() => goTo('station-hub')}>Retour en station →</button>
        </div>
      )}

      {/* Actions */}
      {!freed && !gs.prisonCellmatePending && (
        <div className="col gap4">
          <div className="px-box" style={{ padding: '8px 12px', borderColor: 'var(--border)' }}>
            <div className="t-xs t-dim mb4" style={{ letterSpacing: '1px' }}>COÛT DE LA PEINE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="t-xs t-dim">Sortie à</span>
                <span className="t-xs t-red">~{Math.round(baseHpPct * 100)}% PV + événements aléatoires</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="t-xs t-dim">Réputation</span>
                <span className="t-xs t-red">−{baseRepLoss}</span>
              </div>
              {pillarKey && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="t-xs t-dim">Standing {pillarKey}</span>
                  <span className="t-xs t-red">−{days * 3}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="t-xs t-dim">Items rendus à la sortie</span>
                <span className="t-xs t-orange">50%</span>
              </div>
            </div>
          </div>

          <button className="px-btn px-btn--danger" onClick={serveTime}>
            Purger la peine ({days} jour{days > 1 ? 's' : ''})
          </button>
          <button className="px-btn" onClick={payCaution} disabled={gs.credits < caution}>
            Payer la caution ({caution.toLocaleString()} cr) — 60% PV · 50% items
            {gs.credits < caution ? ` · manque ${(caution - gs.credits).toLocaleString()} cr` : ''}
          </button>
          <button className="px-btn" onClick={bribeGuard} disabled={gs.credits < 400}>
            Soudoyer un garde (400 cr · {50 + (gs.reputation > 40 ? 10 : 0)}% succès)
          </button>
          <button
            className="px-btn"
            style={{ color: failures >= 3 ? 'var(--red)' : 'var(--orange)', borderColor: failures >= 3 ? 'var(--red)' : 'var(--orange)' }}
            onClick={() => { setRound(1); setEscapePhase('playing') }}
          >
            ► Tenter une évasion — tentative {failures + 1}/4
            {failures >= 3 ? ' ⚠ DERNIÈRE CHANCE · MORT SI RATÉ' : failures >= 2 ? ' · ⚠ 1 chance restante après' : failures >= 1 ? ' · 0 item si raté' : ' · 25% items si raté · 70% succès final'}
          </button>
        </div>
      )}
    </div>
  )
}

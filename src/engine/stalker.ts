import type { GameState } from '../types'
import i18n from '../i18n/config'
import { translateEnemyName } from './goodsI18n'

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const sk = (key: string, params?: Record<string, unknown>) => i18n.t(key, { ns: 'stalker', ...params })

export interface StalkerState {
  name: string
  station: string
  closingIn: boolean
  daysSinceLastSeen: number
  threatLevel: number  // 1-5 — escalade avec le temps
  daysActive: number   // jours depuis l'apparition du stalker
  // Si ce stalker venge un fragment volé : le pilier concerné. S'il te rattrape
  // et te bat, il récupère le fragment (voir handleCombatOutcome). Traque
  // beaucoup plus agressive qu'un stalker normal — voir checkAvengingAmbush.
  avengingPillar?: string
}

// Stalkers potentiels selon les actions du joueur
export function checkStalkerTrigger(gs: GameState): StalkerState | null {
  if (gs.stalker) return gs.stalker  // Déjà un stalker actif

  const stalkerChance =
    (gs.reputation <= -50 ? 0.15 : 0) +
    (gs.bossesDefeated >= 2 ? 0.10 : 0) +
    (gs.faction !== 'none' && gs.factionMissions >= 2 ? 0.08 : 0) +
    (gs.completedQuestIds.length >= 5 ? 0.05 : 0)

  if (Math.random() > stalkerChance) return null

  const stalkers = [
    { name: 'Chasseur Marl', threatLevel: 1 as const },
    { name: 'L\'Agent Gris', threatLevel: 2 as const },
    { name: 'Fantasma', threatLevel: 3 as const },
    { name: 'Le Père Veng', threatLevel: 1 as const },
    { name: 'Sœur Acide', threatLevel: 2 as const },
  ]

  const stalker = stalkers[Math.floor(Math.random() * stalkers.length)]
  return {
    name: stalker.name,
    station: gs.currentStation,
    closingIn: false,
    daysSinceLastSeen: 0,
    threatLevel: stalker.threatLevel,
    daysActive: 0,
  }
}

// Escalade : chaque jour actif, augmente la menace. Appeler à chaque voyage.
export function escalateStalker(stalker: StalkerState): StalkerState {
  const daysActive = stalker.daysActive + 1
  // Escalade tous les 5 jours actifs, max 5
  const newThreat = daysActive % 5 === 0 && stalker.threatLevel < 5
    ? stalker.threatLevel + 1
    : stalker.threatLevel
  return { ...stalker, daysActive, threatLevel: newThreat }
}

export interface StalkerEvent {
  title: string
  description: string
  newStalkerState?: Partial<StalkerState>
}

// Signes atmosphériques — jamais de vraie rencontre ici, ça c'est dans l'exploration/wander
export function rollStalkerEvent(gs: GameState, stalker: StalkerState): StalkerEvent | null {
  if (Math.random() > 0.65) return null  // pas toujours un signe

  const signsKey = stalker.threatLevel >= 3 ? 'signs3' : stalker.threatLevel >= 2 ? 'signs2' : 'signs1'
  const pool = i18n.t(signsKey, { ns: 'stalker', name: stalker.name, returnObjects: true }) as string[]
  return {
    title: `⚠ ${translateEnemyName(stalker.name)}`,
    description: pool[Math.floor(Math.random() * pool.length)],
    newStalkerState: { closingIn: true, daysSinceLastSeen: gs.day },
  }
}

// Chance que le stalker surgisse pendant une action (explore / wander)
export function getStalkerAmbushChance(stalker: StalkerState, action: 'explore' | 'wander'): number {
  // Un vengeur de fragment volé ne laisse aucun répit — il frappe bien plus souvent
  // qu'un stalker normal, où que tu ailles.
  if (stalker.avengingPillar) return 0.55
  const base = action === 'explore' ? 0.06 : 0.04
  const threatBonus = stalker.threatLevel * 0.04
  const closingBonus = stalker.closingIn ? 0.08 : 0
  return Math.min(0.28, base + threatBonus + closingBonus)
}

// Chance qu'un vengeur de fragment volé frappe à la simple arrivée dans une
// station — pas besoin d'explorer ou d'errer. C'est ce qui le rend inéchappable :
// contrairement à un stalker normal, il n'attend pas que tu prennes un risque.
export function getAvengingArrivalAmbushChance(stalker: StalkerState): number {
  if (!stalker.avengingPillar) return 0
  return 0.45
}

// Texte de présence atmosphérique pour le hub
export function getStalkerPresenceText(stalker: StalkerState): string {
  if (stalker.threatLevel >= 5) {
    return sk('presence.t5')
  }
  if (stalker.threatLevel >= 4) {
    return stalker.closingIn ? sk('presence.t4Closing') : sk('presence.t4')
  }
  if (stalker.threatLevel >= 3) {
    return stalker.closingIn ? sk('presence.t3Closing') : sk('presence.t3')
  }
  if (stalker.threatLevel >= 2) {
    return stalker.closingIn ? sk('presence.t2Closing') : sk('presence.t2')
  }
  return stalker.closingIn ? sk('presence.t1Closing') : sk('presence.t1')
}

export type StalkerResolution = 'fight' | 'flee' | 'talk' | 'pay'

export interface StalkerResolutionResult {
  newGs: Partial<GameState>
  message: string
  triggerCombat?: boolean
  stalkerDefeated?: boolean
}

export function resolveStalkerEncounter(
  gs: GameState,
  stalker: StalkerState,
  action: StalkerResolution
): StalkerResolutionResult {
  switch (action) {
    case 'fight':
      return { newGs: {}, message: sk('resolve.fight'), triggerCombat: true }

    case 'flee': {
      const ok = Math.random() < 0.50
      return ok
        ? { newGs: { fuel: Math.max(0, gs.fuel - 1) }, message: sk('resolve.fleeSuccess', { name: translateEnemyName(stalker.name) }) }
        : { newGs: {}, message: sk('resolve.fleeFail'), triggerCombat: true }
    }

    case 'talk': {
      const chance = 0.25 + gs.reputation / 400
      return Math.random() < chance
        ? { newGs: { reputation: gs.reputation + 20, stalker: undefined }, message: sk('resolve.talkSuccess', { name: translateEnemyName(stalker.name) }), stalkerDefeated: true }
        : { newGs: {}, message: sk('resolve.talkFail'), triggerCombat: true }
    }

    case 'pay': {
      const amount = 1000 + stalker.threatLevel * 500
      if (gs.credits < amount) return { newGs: {}, message: sk('resolve.payInsufficient'), triggerCombat: true }
      return {
        newGs: { credits: gs.credits - amount, stalker: undefined },
        message: sk('resolve.paySuccess', { amount, name: translateEnemyName(stalker.name) }),
        stalkerDefeated: true,
      }
    }
  }
}

// Créer l'ennemi stalker pour le combat
// threat 1→240hp/28-58dmg  2→330/38-76  3→420/48-94  4→560/65-120  5→750/90-160
export function stalkerToEnemy(stalker: StalkerState) {
  const t = stalker.threatLevel
  const allyDesc = t >= 5
    ? sk('enemy.allyDesc5')
    : t >= 4
    ? sk('enemy.allyDesc4')
    : ''
  return {
    name: t >= 4 ? `${stalker.name}${sk('enemy.reinforcedSuffix')}` : stalker.name,
    maxHp: t >= 5 ? 750 : t >= 4 ? 560 : 150 + t * 90,
    damageMin: t >= 5 ? 90 : t >= 4 ? 65 : 18 + t * 10,
    damageMax: t >= 5 ? 160 : t >= 4 ? 120 : 40 + t * 18,
    lootMin: 500 + t * 400,
    lootMax: 1200 + t * 800,
    description: sk('enemy.description', { allyDesc }),
    captureChance: 0,
    killChance: Math.min(80, 20 + t * 12),
    isBoss: true,
    role: 'normal' as const,
  }
}

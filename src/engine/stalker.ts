import type { GameState } from '../types'

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

export interface StalkerState {
  name: string
  station: string
  closingIn: boolean
  daysSinceLastSeen: number
  threatLevel: number  // 1-3
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
  }
}

export interface StalkerEvent {
  title: string
  description: string
  isEncounter: boolean
  newStalkerState?: Partial<StalkerState>
}

export function rollStalkerEvent(gs: GameState, stalker: StalkerState): StalkerEvent | null {
  const daysDelta = gs.day - stalker.daysSinceLastSeen
  const encounterChance = Math.min(0.60, 0.08 * daysDelta + stalker.threatLevel * 0.10)

  if (Math.random() > encounterChance) {
    // Signe du stalker seulement
    const signs = [
      `Une silhouette derrière toi au marché. Tu te retournes — personne. ${stalker.name} est proche.`,
      `Ton vaisseau a été inspecté pendant ton absence. Rien de volé. Un message : 'Bientôt.'`,
      `Un barman te signale qu'on posait des questions sur toi. Le signalement correspond à ${stalker.name}.`,
      `Tu retrouves une balle gravée sur ton siège de pilotage. Signature de ${stalker.name}.`,
    ]
    return {
      title: `Trace de ${stalker.name}`,
      description: signs[Math.floor(Math.random() * signs.length)],
      isEncounter: false,
      newStalkerState: { closingIn: true, daysSinceLastSeen: gs.day },
    }
  }

  // Vraie rencontre
  return {
    title: `RENCONTRE — ${stalker.name}`,
    description: `${stalker.name} te bloque le passage. Ses yeux ne te lâchent pas. 'Je t'attendais.' Sa main est sur son arme.`,
    isEncounter: true,
    newStalkerState: { daysSinceLastSeen: gs.day },
  }
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
      return { newGs: {}, message: "Combat avec le stalker.", triggerCombat: true }

    case 'flee': {
      const ok = Math.random() < 0.50
      return ok
        ? { newGs: { fuel: Math.max(0, gs.fuel - 1) }, message: `Tu files. -1 carburant. ${stalker.name} attend la prochaine occasion.` }
        : { newGs: {}, message: "Il est plus rapide. Combat.", triggerCombat: true }
    }

    case 'talk': {
      const chance = 0.25 + gs.reputation / 400
      return Math.random() < chance
        ? { newGs: { reputation: gs.reputation + 20, stalker: undefined }, message: `Accord trouvé. ${stalker.name} lève la menace. +20 rép.`, stalkerDefeated: true }
        : { newGs: {}, message: "Il n'est pas là pour parler. Combat.", triggerCombat: true }
    }

    case 'pay': {
      const amount = 1000 + stalker.threatLevel * 500
      if (gs.credits < amount) return { newGs: {}, message: "Pas assez de crédits. Combat.", triggerCombat: true }
      return {
        newGs: { credits: gs.credits - amount, stalker: undefined },
        message: `-${amount} cr. ${stalker.name} encaisse et disparaît. Pour l'instant.`,
        stalkerDefeated: true,
      }
    }
  }
}

// Créer l'ennemi stalker pour le combat
export function stalkerToEnemy(stalker: StalkerState) {
  return {
    name: stalker.name,
    maxHp: 60 + stalker.threatLevel * 30,
    damageMin: 10 + stalker.threatLevel * 5,
    damageMax: 25 + stalker.threatLevel * 10,
    lootMin: 300 + stalker.threatLevel * 200,
    lootMax: 800 + stalker.threatLevel * 400,
    description: `Il te traquait depuis des jours. Il se bat avec la conviction d'un obsédé.`,
    captureChance: 10,
    killChance: 10 + stalker.threatLevel * 10,
    isBoss: stalker.threatLevel >= 3,
    role: 'normal' as const,
  }
}

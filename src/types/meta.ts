export type MetaCategory = 'survie' | 'combat' | 'commerce' | 'voyage' | 'special'

export interface MetaUnlock {
  id: string
  name: string
  description: string
  cost: number
  category: MetaCategory
  requires?: string
  effect: {
    startHpBonus?: number
    defenseMult?: number
    startStaminaBonus?: number
    attackBonus?: number
    critBonus?: number
    startWeaponTier?: number
    startCreditsBonus?: number
    buyDiscountBonus?: number
    startCargoBonus?: boolean
    startFuelBonus?: number
    maxFuelBonus?: number
    seesTravelEvents?: boolean
    startReputationBonus?: number
    startNexusFragment?: boolean
    startMedkitBonus?: number
    surviveLethalOnce?: boolean   // survit à un coup mortel à 1 PV (une fois par run)
    coupDeGrace?: number          // % dégâts bonus quand ennemi < 25% PV
    startFactionRepBonus?: number // bonus rep à la faction choisie au départ
    startZoneDepthBonus?: number  // commence avec une zone déjà explorée
  }
}

export interface RunSummary {
  day: number
  className: string
  victory: boolean
  bossesKilled: number
  questsDone: number
  stationsVisited: number
  pointsEarned: number
  date: string
}

export interface MetaProgress {
  totalPointsEarned: number
  totalPointsSpent: number
  unlockedIds: string[]
  runHistory: RunSummary[]
}

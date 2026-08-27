import type { Faction, FactionId, GameState } from '../types'
import i18n from '../i18n/config'

const fa = (key: string) => i18n.t(key, { ns: 'factions' })

export function getFactions(): Faction[] {
  return [
  {
    id: 'faucons', name: fa('faucons.name'), color: '#2040ff',
    description: fa('faucons.description'),
    bonus: fa('faucons.bonus'),
  },
  {
    id: 'emporium', name: fa('emporium.name'), color: '#ffd700',
    description: fa('emporium.description'),
    bonus: fa('emporium.bonus'),
  },
  {
    id: 'gardiens', name: fa('gardiens.name'), color: '#ff4040',
    description: fa('gardiens.description'),
    bonus: fa('gardiens.bonus'),
  },
  {
    id: 'culte', name: fa('culte.name'), color: '#a040ff',
    description: fa('culte.description'),
    bonus: fa('culte.bonus'),
  },
  ]
}

export function getFactionMap(): Record<FactionId, Faction | null> {
  const factions = getFactions()
  return {
    none:     null,
    faucons:  factions[0],
    emporium: factions[1],
    gardiens: factions[2],
    culte:    factions[3],
  }
}

export function getFaction(id: FactionId): Faction | null {
  return getFactionMap()[id]
}

export function getBuyDiscount(gs: GameState): number {
  let disc = gs.class.buyDiscountPercent ?? 0
  if (gs.faction === 'emporium') disc += 15
  // Bonus réputation Emporium (stackable avec membership)
  const emporiumRep = gs.factionReputation?.emporium ?? 0
  if (emporiumRep >= 80)      disc += 15
  else if (emporiumRep >= 50) disc += 10
  else if (emporiumRep >= 20) disc += 5
  return disc
}

export function getFactionMissionReward(factionId: FactionId): { credits: number; rep: number } {
  switch (factionId) {
    case 'faucons':  return { credits: 1500, rep: 30 }
    case 'emporium': return { credits: 2000, rep: 20 }
    case 'gardiens': return { credits: 1000, rep: 50 }
    case 'culte':    return { credits: 800,  rep: 40 }
    default:         return { credits: 0, rep: 0 }
  }
}

import type { GameState } from '../types'
import i18n from '../i18n/config'

export type FactionKey = 'faucons' | 'emporium' | 'gardiens' | 'culte'

export const RIVALS: Record<FactionKey, FactionKey> = {
  faucons:  'gardiens',
  gardiens: 'faucons',
  emporium: 'culte',
  culte:    'emporium',
}

export type RepLevel = 'hostile' | 'froide' | 'neutre' | 'amicale' | 'honoree' | 'exaltee'

export function getRepLevel(rep: number): RepLevel {
  if (rep >= 80)  return 'exaltee'
  if (rep >= 50)  return 'honoree'
  if (rep >= 20)  return 'amicale'
  if (rep > -20)  return 'neutre'
  if (rep > -50)  return 'froide'
  return 'hostile'
}

export function getRepLabels(): Record<RepLevel, string> {
  return {
    hostile: i18n.t('repLabels.hostile', { ns: 'factionsScreen' }),
    froide:  i18n.t('repLabels.froide', { ns: 'factionsScreen' }),
    neutre:  i18n.t('repLabels.neutre', { ns: 'factionsScreen' }),
    amicale: i18n.t('repLabels.amicale', { ns: 'factionsScreen' }),
    honoree: i18n.t('repLabels.honoree', { ns: 'factionsScreen' }),
    exaltee: i18n.t('repLabels.exaltee', { ns: 'factionsScreen' }),
  }
}

export const REP_COLORS: Record<RepLevel, string> = {
  hostile:  'var(--red)',
  froide:   'var(--orange)',
  neutre:   'var(--text-dim)',
  amicale:  'var(--green)',
  honoree:  'var(--cyan)',
  exaltee:  'var(--gold)',
}

export function getFactionRep(gs: GameState, faction: FactionKey): number {
  return gs.factionReputation?.[faction] ?? 0
}

export function changeFactionRep(gs: GameState, faction: FactionKey, delta: number): GameState {
  const current = getFactionRep(gs, faction)
  const clamped = Math.max(-100, Math.min(100, current + delta))
  const rival   = RIVALS[faction]
  const rivalCurrent = getFactionRep(gs, rival)
  const rivalDelta   = delta > 0 ? -Math.ceil(delta / 2) : 0
  const rivalClamped = Math.max(-100, Math.min(100, rivalCurrent + rivalDelta))
  return {
    ...gs,
    factionReputation: {
      ...gs.factionReputation,
      [faction]: clamped,
      [rival]:   rivalClamped,
    },
  }
}

// Bonus emporium : réduction achat supplémentaire (%)
export function getEmporiumDiscount(gs: GameState): number {
  const level = getRepLevel(getFactionRep(gs, 'emporium'))
  if (level === 'exaltee') return 15
  if (level === 'honoree') return 10
  if (level === 'amicale') return 5
  return 0
}

// Bonus faucons : multiplicateur loot combat
export function getFauconsLootMult(gs: GameState): number {
  const level = getRepLevel(getFactionRep(gs, 'faucons'))
  if (level === 'exaltee') return 1.30
  if (level === 'honoree') return 1.20
  if (level === 'amicale') return 1.10
  return 1.0
}

// Bonus gardiens : réduction risque combat exploration (0-0.15)
export function getGardiensExplorReduction(gs: GameState): number {
  const level = getRepLevel(getFactionRep(gs, 'gardiens'))
  if (level === 'exaltee') return 0.15
  if (level === 'honoree') return 0.10
  if (level === 'amicale') return 0.05
  return 0
}

// Bonus culte : multiplicateur prix artefacts en vente
export function getCulteArtefactMult(gs: GameState): number {
  const level = getRepLevel(getFactionRep(gs, 'culte'))
  if (level === 'exaltee') return 2.00
  if (level === 'honoree') return 1.50
  if (level === 'amicale') return 1.20
  return 1.0
}

export function getFactionBonusDesc(): Record<FactionKey, string[]> {
  return {
    faucons: i18n.t('factionBonusDesc.faucons', { ns: 'factionsScreen', returnObjects: true }) as unknown as string[],
    emporium: i18n.t('factionBonusDesc.emporium', { ns: 'factionsScreen', returnObjects: true }) as unknown as string[],
    gardiens: i18n.t('factionBonusDesc.gardiens', { ns: 'factionsScreen', returnObjects: true }) as unknown as string[],
    culte: i18n.t('factionBonusDesc.culte', { ns: 'factionsScreen', returnObjects: true }) as unknown as string[],
  }
}

export const FACTION_MISSION_REP: Record<FactionKey, number> = {
  faucons:  20,
  emporium: 15,
  gardiens: 20,
  culte:    25,
}

// Stations contrôlées par chaque faction
export const STATION_FACTION_CONTROL: Record<string, FactionKey> = {
  // Faucons Noirs
  'Arc Ouest Apocalypse': 'faucons',
  'Le Nid des Faucons':   'faucons',
  'Le Perchoir':          'faucons',
  'Station Ombre':        'faucons',
  'Relais Noir':          'faucons',
  'La Tanière':           'faucons',
  'Fort de Cendres':      'faucons',
  "L'Œil du Faucon":     'faucons',
  'Repaire Vega-Sud':     'faucons',
  // Gardiens Écarlates
  'La Citadelle Écarlate': 'gardiens',
  'Fort Kharos':            'gardiens',
  'Fort Ossian':            'gardiens',
  'Bastion Mineur':         'gardiens',
  'Poste Vigie':            'gardiens',
  "L'Arsenal Écarlate":    'gardiens',
  'La Forteresse Exilée':  'gardiens',
  // Emporium
  'Emporium Requiem':   'emporium',
  'Comptoir Sud':       'emporium',
  'Annexe Commerciale': 'emporium',
  'Relais de Transit':  'emporium',
  // Culte du Vide
  'Les Abysses de Velkor': 'culte',
  'Station Quarantaine':   'culte',
  'Le Berceau':            'culte',
}

// Retourne le surcoût en % appliqué à cette station selon la réputation avec sa faction
// froide → +15%, hostile → +30%
export function getFactionSurchargeAtStation(gs: GameState, stationName: string): number {
  const faction = STATION_FACTION_CONTROL[stationName]
  if (!faction) return 0
  const level = getRepLevel(getFactionRep(gs, faction))
  if (level === 'hostile') return 30
  if (level === 'froide')  return 15
  return 0
}

// Retourne true si la faction est hostile à cette station (bloque quêtes, réparations)
export function isFactionBlockedAtStation(gs: GameState, stationName: string): boolean {
  const faction = STATION_FACTION_CONTROL[stationName]
  if (!faction) return false
  return getRepLevel(getFactionRep(gs, faction)) === 'hostile'
}

// Retourne le nom de la faction qui contrôle une station (pour l'affichage)
export function getStationFactionName(stationName: string): string | null {
  const key = STATION_FACTION_CONTROL[stationName]
  if (!key) return null
  const names: Record<FactionKey, string> = {
    faucons:  'Faucons Noirs',
    gardiens: 'Gardiens Écarlates',
    emporium: 'Emporium',
    culte:    'Culte du Vide',
  }
  return names[key]
}

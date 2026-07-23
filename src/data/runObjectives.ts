import type { GameState } from '../types'

export interface RunObjective {
  id: string
  name: string
  desc: string
  check: (gs: GameState) => boolean
  progress: (gs: GameState) => string
  metaPointReward: number
}

export const RUN_OBJECTIVES: RunObjective[] = [
  {
    id: 'magnat', name: 'Magnat du Vide',
    desc: 'Accumuler 12 000 cr en une seule run.',
    check: gs => gs.credits >= 12000,
    progress: gs => `${gs.credits.toLocaleString()} / 12 000 cr`,
    metaPointReward: 3,
  },
  {
    id: 'machine_guerre', name: 'Machine de Guerre',
    desc: 'Gagner 12 combats dans cette run.',
    check: gs => gs.explorationFightsDone >= 12,
    progress: gs => `${gs.explorationFightsDone} / 12 combats`,
    metaPointReward: 2,
  },
  {
    id: 'nomade', name: 'Nomade Stellaire',
    desc: 'Survivre jusqu\'au jour 20.',
    check: gs => gs.day >= 20,
    progress: gs => `Jour ${gs.day} / 20`,
    metaPointReward: 2,
  },
  {
    id: 'diplomate', name: 'Diplomate de l\'Ombre',
    desc: 'Rencontrer 10 PNJs différents.',
    check: gs => gs.npcsMet.length >= 10,
    progress: gs => `${gs.npcsMet.length} / 10 PNJs`,
    metaPointReward: 2,
  },
  {
    id: 'soldat_faction', name: 'Soldat de Faction',
    desc: 'Accomplir 6 missions de faction.',
    check: gs => gs.factionMissions >= 6,
    progress: gs => `${gs.factionMissions} / 6 missions`,
    metaPointReward: 3,
  },
  {
    id: 'artisan', name: 'Artisan du Vide',
    desc: 'Crafter 6 objets.',
    check: gs => (gs.craftsPerformed ?? 0) >= 6,
    progress: gs => `${gs.craftsPerformed ?? 0} / 6 crafts`,
    metaPointReward: 2,
  },
  {
    id: 'contractuel', name: 'Contractuel',
    desc: 'Accomplir 8 quêtes.',
    check: gs => gs.completedQuestIds.length >= 8,
    progress: gs => `${gs.completedQuestIds.length} / 8 quêtes`,
    metaPointReward: 2,
  },
  {
    id: 'legendaire', name: 'Légende Vivante',
    desc: 'Atteindre 60 de réputation.',
    check: gs => gs.reputation >= 60,
    progress: gs => `${gs.reputation} / 60 rép`,
    metaPointReward: 3,
  },
  {
    id: 'chasseur_boss', name: 'Chasseur de Têtes',
    desc: 'Vaincre 3 boss.',
    check: gs => gs.bossesDefeated >= 3,
    progress: gs => `${gs.bossesDefeated} / 3 boss`,
    metaPointReward: 3,
  },
  {
    id: 'collectionneur', name: 'Collectionneur',
    desc: 'Avoir 5 types d\'objets différents dans la soute simultanément.',
    check: gs => Object.keys(gs.cargo).length >= 5,
    progress: gs => `${Object.keys(gs.cargo).length} / 5 types en soute`,
    metaPointReward: 2,
  },
]

export function drawRunObjective(): RunObjective {
  return RUN_OBJECTIVES[Math.floor(Math.random() * RUN_OBJECTIVES.length)]
}

export function getRunObjective(id: string): RunObjective | undefined {
  return RUN_OBJECTIVES.find(o => o.id === id)
}

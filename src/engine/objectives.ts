import type { GameState } from '../types'

export interface Objective {
  id: string
  name: string
  description: string
  category: string
  reward: string
  creditReward: number
  repReward: number
  check: (gs: GameState) => boolean
  progress: (gs: GameState) => string
}

export const OBJECTIVES: Objective[] = [
  // PROGRESSION
  { id: 'rich_100k',      name: 'Centenaire de crédits',     category: 'Progression', creditReward: 5000,   repReward: 50,
    description: 'Accumuler 100 000 cr',            reward: '+5 000cr, +50 rép',
    check: gs => gs.credits >= 100000, progress: gs => `${gs.credits.toLocaleString()} / 100 000cr` },
  { id: 'survive_50days', name: 'Le Vieux de l\'Espace',      category: 'Progression', creditReward: 8000,   repReward: 30,
    description: 'Survivre 50 jours',               reward: '+8 000cr, +30 rép',
    check: gs => gs.day >= 50, progress: gs => `Jour ${gs.day} / 50` },
  { id: 'all_stations',   name: 'Cartographe du Vide',        category: 'Progression', creditReward: 10000,  repReward: 100,
    description: 'Visiter 15 stations différentes', reward: '+10 000cr, +100 rép',
    check: gs => gs.visitedStations.length >= 15, progress: gs => `${gs.visitedStations.length} / 15 stations` },
  { id: 'legend_rep',     name: 'Légende Vivante',             category: 'Progression', creditReward: 20000,  repReward: 0,
    description: 'Réputation ≥ 1000',               reward: '+20 000cr',
    check: gs => gs.reputation >= 1000, progress: gs => `${gs.reputation} / 1000 rép` },
  { id: 'rich_10k',       name: 'Premier millionnaire',        category: 'Progression', creditReward: 1000,   repReward: 10,
    description: 'Accumuler 10 000 cr',             reward: '+1 000cr, +10 rép',
    check: gs => gs.credits >= 10000, progress: gs => `${gs.credits.toLocaleString()} / 10 000cr` },

  // BUILD
  { id: 'tier5_weapon',   name: 'Armement Légendaire',         category: 'Build', creditReward: 0,     repReward: 50,
    description: 'Posséder une arme Tier 5',        reward: '+50 rép',
    check: gs => gs.weapons.some(w => w.tier >= 5), progress: gs => gs.weapons.some(w => w.tier >= 5) ? 'Accompli' : 'Non accompli' },
  { id: 'ship_150hp',     name: 'Vaisseau Blindé',             category: 'Build', creditReward: 5000,   repReward: 0,
    description: 'Vaisseau à 150 PV max',           reward: '+5 000cr',
    check: gs => gs.shipMaxHp >= 150, progress: gs => `${gs.shipMaxHp} / 150 PV` },
  { id: 'player_150hp',   name: 'Corps Amélioré',              category: 'Build', creditReward: 5000,   repReward: 0,
    description: 'Joueur à 150 PV max',             reward: '+5 000cr',
    check: gs => gs.playerMaxHp >= 150, progress: gs => `${gs.playerMaxHp} / 150 PV` },
  { id: 'weapon_collector',name:'Collectionneur',              category: 'Build', creditReward: 15000,  repReward: 100,
    description: 'Une arme de chaque Tier (1 à 5)', reward: '+15 000cr, +100 rép',
    check: gs => [1,2,3,4,5].every(t => gs.weapons.some(w => w.tier === t)),
    progress: gs => `${[1,2,3,4,5].filter(t => gs.weapons.some(w => w.tier === t)).length} / 5 tiers` },

  // CRIMINEL
  { id: 'enemy_public',   name: 'L\'Ennemi de Tout le Monde',  category: 'Criminel', creditReward: 5000, repReward: 0,
    description: 'Réputation ≤ -1000',              reward: '+5 000cr',
    check: gs => gs.reputation <= -1000, progress: gs => `${gs.reputation} / -1000 rép` },
  { id: 'prison_escape',  name: 'L\'Évadé',                    category: 'Criminel', creditReward: 3000, repReward: 100,
    description: "S'évader de prison une fois",     reward: '+3 000cr, +100 rép',
    check: gs => gs.prisonEscapes >= 1, progress: gs => `${gs.prisonEscapes} / 1 évasion` },
  { id: 'interrogations', name: 'Mur de Silence',              category: 'Criminel', creditReward: 3000, repReward: 50,
    description: 'Survivre à 5 interrogatoires',    reward: '+3 000cr, +50 rép',
    check: gs => gs.interrogationsSurvived >= 5, progress: gs => `${gs.interrogationsSurvived} / 5` },

  // NARRATIF
  { id: 'boss_killed',    name: 'Tueur de Légendes',           category: 'Narratif', creditReward: 5000, repReward: 50,
    description: 'Vaincre un boss nommé',           reward: '+5 000cr, +50 rép',
    check: gs => gs.bossesDefeated >= 1, progress: gs => `${gs.bossesDefeated} boss` },
  { id: 'all_npcs',       name: 'Réseau Étendu',               category: 'Narratif', creditReward: 10000, repReward: 100,
    description: 'Rencontrer 10 PNJs nommés',       reward: '+10 000cr, +100 rép',
    check: gs => gs.npcsMet.length >= 10, progress: gs => `${gs.npcsMet.length} / 10 PNJs` },
  { id: 'faction_3m',     name: 'Loyal jusqu\'au Bout',        category: 'Narratif', creditReward: 8000, repReward: 75,
    description: '3 missions pour sa faction',      reward: '+8 000cr, +75 rép',
    check: gs => gs.factionMissions >= 3 && gs.faction !== 'none', progress: gs => `${gs.factionMissions} / 3 missions` },
  { id: 'double_agent',   name: 'Le Double Jeu',               category: 'Narratif', creditReward: 5000, repReward: 0,
    description: 'Devenir agent double',            reward: '+5 000cr',
    check: gs => gs.isDoubleAgent, progress: gs => gs.isDoubleAgent ? 'Accompli' : 'Non' },

  // LÉGENDAIRE
  { id: 'all_bosses',     name: 'Grand Nettoyage',             category: 'Légendaire', creditReward: 50000, repReward: 500,
    description: 'Vaincre 8 bosses nommés',         reward: '+50 000cr, +500 rép',
    check: gs => gs.stationBossesBeaten.length >= 8, progress: gs => `${gs.stationBossesBeaten.length} / 8 bosses` },
  { id: 'space_lord',     name: 'Seigneur de l\'Espace',       category: 'Légendaire', creditReward: 100000, repReward: 1000,
    description: 'Rallier les 4 fragments Nexus',   reward: '+100 000cr, +1000 rép',
    check: gs => gs.stationPiecesRallied >= 4, progress: gs => `${gs.stationPiecesRallied} / 4 fragments` },
]

export function checkObjectives(gs: GameState): { newGs: Partial<GameState>; newlyCompleted: Objective[] } {
  const newlyCompleted: Objective[] = []
  let credits = gs.credits
  let reputation = gs.reputation
  const completedObjectives = [...gs.completedObjectives]

  for (const obj of OBJECTIVES) {
    if (completedObjectives.includes(obj.id)) continue
    if (!obj.check(gs)) continue
    completedObjectives.push(obj.id)
    credits += obj.creditReward
    reputation += obj.repReward
    newlyCompleted.push(obj)
  }

  return { newGs: { credits, reputation, completedObjectives }, newlyCompleted }
}

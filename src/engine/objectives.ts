import type { GameState } from '../types'
import i18n from '../i18n/config'

const ot = (key: string, params?: Record<string, unknown>) => i18n.t(key, { ns: 'objectivesScreen', ...params })

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

export function getObjectives(): Objective[] {
  return [
  // PROGRESSION
  { id: 'rich_100k',      name: ot('objectives.rich100k.name'),     category: 'Progression', creditReward: 5000,   repReward: 50,
    description: ot('objectives.rich100k.description'),            reward: ot('objectives.rich100k.reward'),
    check: gs => gs.credits >= 100000, progress: gs => ot('objectives.rich100k.progress', { credits: gs.credits.toLocaleString() }) },
  { id: 'survive_50days', name: ot('objectives.survive50days.name'),      category: 'Progression', creditReward: 8000,   repReward: 30,
    description: ot('objectives.survive50days.description'),               reward: ot('objectives.survive50days.reward'),
    check: gs => gs.day >= 50, progress: gs => ot('objectives.survive50days.progress', { day: gs.day }) },
  { id: 'all_stations',   name: ot('objectives.allStations.name'),        category: 'Progression', creditReward: 10000,  repReward: 100,
    description: ot('objectives.allStations.description'), reward: ot('objectives.allStations.reward'),
    check: gs => gs.visitedStations.length >= 15, progress: gs => ot('objectives.allStations.progress', { count: gs.visitedStations.length }) },
  { id: 'legend_rep',     name: ot('objectives.legendRep.name'),             category: 'Progression', creditReward: 20000,  repReward: 0,
    description: ot('objectives.legendRep.description'),               reward: ot('objectives.legendRep.reward'),
    check: gs => gs.reputation >= 1000, progress: gs => ot('objectives.legendRep.progress', { rep: gs.reputation }) },
  { id: 'rich_10k',       name: ot('objectives.rich10k.name'),        category: 'Progression', creditReward: 1000,   repReward: 10,
    description: ot('objectives.rich10k.description'),             reward: ot('objectives.rich10k.reward'),
    check: gs => gs.credits >= 10000, progress: gs => ot('objectives.rich10k.progress', { credits: gs.credits.toLocaleString() }) },

  // BUILD
  { id: 'tier5_weapon',   name: ot('objectives.tier5Weapon.name'),         category: 'Build', creditReward: 0,     repReward: 50,
    description: ot('objectives.tier5Weapon.description'),        reward: ot('objectives.tier5Weapon.reward'),
    check: gs => gs.weapons.some(w => w.tier >= 5), progress: gs => gs.weapons.some(w => w.tier >= 5) ? ot('accomplished') : ot('notAccomplished') },
  { id: 'ship_150hp',     name: ot('objectives.ship150hp.name'),             category: 'Build', creditReward: 5000,   repReward: 0,
    description: ot('objectives.ship150hp.description'),           reward: ot('objectives.ship150hp.reward'),
    check: gs => gs.shipMaxHp >= 150, progress: gs => ot('objectives.ship150hp.progress', { hp: gs.shipMaxHp }) },
  { id: 'player_150hp',   name: ot('objectives.player150hp.name'),              category: 'Build', creditReward: 5000,   repReward: 0,
    description: ot('objectives.player150hp.description'),             reward: ot('objectives.player150hp.reward'),
    check: gs => gs.playerMaxHp >= 150, progress: gs => ot('objectives.player150hp.progress', { hp: gs.playerMaxHp }) },
  { id: 'weapon_collector',name: ot('objectives.weaponCollector.name'),              category: 'Build', creditReward: 15000,  repReward: 100,
    description: ot('objectives.weaponCollector.description'), reward: ot('objectives.weaponCollector.reward'),
    check: gs => [1,2,3,4,5].every(t => gs.weapons.some(w => w.tier === t)),
    progress: gs => ot('objectives.weaponCollector.progress', { count: [1,2,3,4,5].filter(t => gs.weapons.some(w => w.tier === t)).length }) },

  // CRIMINEL
  { id: 'enemy_public',   name: ot('objectives.enemyPublic.name'),  category: 'Criminel', creditReward: 5000, repReward: 0,
    description: ot('objectives.enemyPublic.description'),              reward: ot('objectives.enemyPublic.reward'),
    check: gs => gs.reputation <= -1000, progress: gs => ot('objectives.enemyPublic.progress', { rep: gs.reputation }) },
  { id: 'prison_escape',  name: ot('objectives.prisonEscape.name'),                    category: 'Criminel', creditReward: 3000, repReward: 100,
    description: ot('objectives.prisonEscape.description'),     reward: ot('objectives.prisonEscape.reward'),
    check: gs => gs.prisonEscapes >= 1, progress: gs => ot('objectives.prisonEscape.progress', { count: gs.prisonEscapes }) },
  { id: 'interrogations', name: ot('objectives.interrogations.name'),              category: 'Criminel', creditReward: 3000, repReward: 50,
    description: ot('objectives.interrogations.description'),    reward: ot('objectives.interrogations.reward'),
    check: gs => gs.interrogationsSurvived >= 5, progress: gs => ot('objectives.interrogations.progress', { count: gs.interrogationsSurvived }) },

  // NARRATIF
  { id: 'boss_killed',    name: ot('objectives.bossKilled.name'),           category: 'Narratif', creditReward: 5000, repReward: 50,
    description: ot('objectives.bossKilled.description'),           reward: ot('objectives.bossKilled.reward'),
    check: gs => gs.bossesDefeated >= 1, progress: gs => ot('objectives.bossKilled.progress', { count: gs.bossesDefeated }) },
  { id: 'all_npcs',       name: ot('objectives.allNpcs.name'),               category: 'Narratif', creditReward: 10000, repReward: 100,
    description: ot('objectives.allNpcs.description'),       reward: ot('objectives.allNpcs.reward'),
    check: gs => gs.npcsMet.length >= 10, progress: gs => ot('objectives.allNpcs.progress', { count: gs.npcsMet.length }) },
  { id: 'faction_3m',     name: ot('objectives.faction3m.name'),        category: 'Narratif', creditReward: 8000, repReward: 75,
    description: ot('objectives.faction3m.description'),      reward: ot('objectives.faction3m.reward'),
    check: gs => gs.factionMissions >= 3 && gs.faction !== 'none', progress: gs => ot('objectives.faction3m.progress', { count: gs.factionMissions }) },
  { id: 'double_agent',   name: ot('objectives.doubleAgent.name'),               category: 'Narratif', creditReward: 5000, repReward: 0,
    description: ot('objectives.doubleAgent.description'),            reward: ot('objectives.doubleAgent.reward'),
    check: gs => gs.isDoubleAgent, progress: gs => gs.isDoubleAgent ? ot('accomplished') : ot('no') },

  // SERVICES EXCLUSIFS
  { id: 'all_implants',   name: ot('objectives.allImplants.name'),          category: 'Build', creditReward: 8000,  repReward: 50,
    description: ot('objectives.allImplants.description'),           reward: ot('objectives.allImplants.reward'),
    check: gs => (gs.implantsBought ?? []).length >= 3,
    progress: gs => ot('objectives.allImplants.progress', { count: (gs.implantsBought ?? []).length }) },
  { id: 'weapon_forged',  name: ot('objectives.weaponForged.name'),                category: 'Build', creditReward: 4000,  repReward: 30,
    description: ot('objectives.weaponForged.description'),        reward: ot('objectives.weaponForged.reward'),
    check: gs => gs.weapons.some(w => w.name.includes('[+]')) || gs.equippedWeapon?.name.includes('[+]') === true,
    progress: gs => gs.weapons.some(w => w.name.includes('[+]')) || gs.equippedWeapon?.name.includes('[+]') ? ot('accomplished') : ot('notAccomplished') },
  { id: 'rest_traveler',  name: ot('objectives.restTraveler.name'),             category: 'Progression', creditReward: 3000, repReward: 20,
    description: ot('objectives.restTraveler.description'),  reward: ot('objectives.restTraveler.reward'),
    check: gs => (gs.usedFreeRestStations ?? []).length >= 3,
    progress: gs => ot('objectives.restTraveler.progress', { count: (gs.usedFreeRestStations ?? []).length }) },
  { id: 'services_tour',  name: ot('objectives.servicesTour.name'),      category: 'Progression', creditReward: 6000, repReward: 40,
    description: ot('objectives.servicesTour.description'),    reward: ot('objectives.servicesTour.reward'),
    check: gs => ["L'Arène de Korsun", 'La Forge Noire', 'Scotty Golden North'].every(s => gs.visitedStations.includes(s)),
    progress: gs => ot('objectives.servicesTour.progress', { count: ["L'Arène de Korsun", 'La Forge Noire', 'Scotty Golden North'].filter(s => gs.visitedStations.includes(s)).length }) },

  // EXPLORATION — tiers supplémentaires
  { id: 'stations_25',    name: ot('objectives.stations25.name'),           category: 'Progression', creditReward: 15000, repReward: 150,
    description: ot('objectives.stations25.description'),            reward: ot('objectives.stations25.reward'),
    check: gs => gs.visitedStations.length >= 25, progress: gs => ot('objectives.stations25.progress', { count: gs.visitedStations.length }) },
  { id: 'stations_40',    name: ot('objectives.stations40.name'),          category: 'Légendaire', creditReward: 30000, repReward: 300,
    description: ot('objectives.stations40.description'),            reward: ot('objectives.stations40.reward'),
    check: gs => gs.visitedStations.length >= 40, progress: gs => ot('objectives.stations40.progress', { count: gs.visitedStations.length }) },

  // BOSSES — paliers supplémentaires
  { id: 'bosses_15',      name: ot('objectives.bosses15.name'),                   category: 'Légendaire', creditReward: 40000, repReward: 300,
    description: ot('objectives.bosses15.description'),                   reward: ot('objectives.bosses15.reward'),
    check: gs => gs.stationBossesBeaten.length >= 15, progress: gs => ot('objectives.bosses15.progress', { count: gs.stationBossesBeaten.length }) },
  { id: 'bosses_30',      name: ot('objectives.bosses30.name'),            category: 'Légendaire', creditReward: 80000, repReward: 500,
    description: ot('objectives.bosses30.description'),                   reward: ot('objectives.bosses30.reward'),
    check: gs => gs.stationBossesBeaten.length >= 30, progress: gs => ot('objectives.bosses30.progress', { count: gs.stationBossesBeaten.length }) },

  // LÉGENDAIRE
  { id: 'all_bosses',     name: ot('objectives.allBosses.name'),             category: 'Légendaire', creditReward: 50000, repReward: 500,
    description: ot('objectives.allBosses.description'),                    reward: ot('objectives.allBosses.reward'),
    check: gs => gs.stationBossesBeaten.length >= 8, progress: gs => ot('objectives.allBosses.progress', { count: gs.stationBossesBeaten.length }) },
  { id: 'space_lord',     name: ot('objectives.spaceLord.name'),       category: 'Légendaire', creditReward: 100000, repReward: 1000,
    description: ot('objectives.spaceLord.description'),              reward: ot('objectives.spaceLord.reward'),
    check: gs => gs.stationPiecesRallied >= 4, progress: gs => ot('objectives.spaceLord.progress', { count: gs.stationPiecesRallied }) },

  // FIN DE JEU — conditions de victoire (voilées)
  { id: 'endgame_major',  name: ot('objectives.endgameMajor.name'),                  category: 'Fin de jeu', creditReward: 0, repReward: 0,
    description: ot('objectives.endgameMajor.description'), reward: ot('objectives.endgameMajor.reward'),
    check: gs => gs.majorQuests.some(q => q.completed),
    progress: gs => gs.majorQuests.some(q => q.completed) ? ot('accomplished') : ot('objectives.endgameMajor.progressInProgress', { count: gs.majorQuests.filter(q => !q.completed && !q.failed).length }) },
  { id: 'endgame_pillar', name: ot('objectives.endgamePillar.name'),                  category: 'Fin de jeu', creditReward: 0, repReward: 0,
    description: ot('objectives.endgamePillar.description'), reward: ot('objectives.endgamePillar.reward'),
    check: gs => Object.values(gs.pillarStanding).some(v => v >= 75),
    progress: gs => { const max = Math.max(...Object.values(gs.pillarStanding)); return ot('objectives.endgamePillar.progress', { max }) } },
  { id: 'endgame_nexus',  name: ot('objectives.endgameNexus.name'),               category: 'Fin de jeu', creditReward: 0, repReward: 0,
    description: ot('objectives.endgameNexus.description'),    reward: ot('objectives.endgameNexus.reward'),
    check: gs => gs.stationPiecesRallied >= 4,
    progress: gs => ot('objectives.endgameNexus.progress', { count: gs.stationPiecesRallied }) },
  { id: 'endgame_faction',name: ot('objectives.endgameFaction.name'),           category: 'Fin de jeu', creditReward: 0, repReward: 0,
    description: ot('objectives.endgameFaction.description'),                    reward: ot('objectives.endgameFaction.reward'),
    check: gs => gs.isFactionLeader,
    progress: gs => gs.isFactionLeader ? ot('accomplished') : gs.faction !== 'none' ? ot('factionStatus', { faction: gs.faction, count: gs.factionMissions }) : ot('noFactionJoined') },
  ]
}

export function checkObjectives(gs: GameState): { newGs: Partial<GameState>; newlyCompleted: Objective[] } {
  const newlyCompleted: Objective[] = []
  let credits = gs.credits
  let reputation = gs.reputation
  const completedObjectives = [...gs.completedObjectives]

  for (const obj of getObjectives()) {
    if (completedObjectives.includes(obj.id)) continue
    if (!obj.check(gs)) continue
    completedObjectives.push(obj.id)
    credits += obj.creditReward
    reputation += obj.repReward
    newlyCompleted.push(obj)
  }

  return { newGs: { credits, reputation, completedObjectives }, newlyCompleted }
}

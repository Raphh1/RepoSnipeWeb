import type { GameState } from '../types'
import type { MetaProgress, RunSummary } from '../types/meta'
import { META_UNLOCKS } from '../data/metaUnlocks'
import { rollWeaponForTier } from '../data/weapons'

export function calculateRunPoints(gs: GameState, victory: boolean): number {
  let pts = 0
  // Survie de base
  if (gs.day >= 5)  pts += 2
  if (gs.day >= 15) pts += 3
  if (gs.day >= 30) pts += 5
  if (gs.day >= 50) pts += 5
  // Boss
  pts += gs.bossesDefeated * 2
  // Quêtes
  pts += Math.floor(gs.completedQuestIds.length / 3) * 2
  // Exploration
  if (gs.visitedStations.length >= 10) pts += 2
  if (gs.visitedStations.length >= 20) pts += 3
  // Victoire
  if (victory) pts += 15
  return Math.max(1, pts)
}

export function buildRunSummary(gs: GameState, victory: boolean): RunSummary {
  return {
    day: gs.day,
    className: gs.class.name,
    victory,
    bossesKilled: gs.bossesDefeated,
    questsDone: gs.completedQuestIds.length,
    stationsVisited: gs.visitedStations.length,
    pointsEarned: calculateRunPoints(gs, victory),
    date: new Date().toLocaleDateString('fr-FR'),
  }
}

export function applyMetaBonuses(gs: GameState, meta: MetaProgress): GameState {
  const unlocked = META_UNLOCKS.filter(u => meta.unlockedIds.includes(u.id))
  let result = { ...gs }

  let cls = { ...result.class }
  for (const unlock of unlocked) {
    const e = unlock.effect
    if (e.startHpBonus)         { result.playerMaxHp += e.startHpBonus; result.playerHp = Math.min(result.playerHp + e.startHpBonus, result.playerMaxHp) }
    if (e.startStaminaBonus)    { result.maxStamina += e.startStaminaBonus; result.stamina = Math.min(result.stamina + e.startStaminaBonus, result.maxStamina) }
    if (e.startCreditsBonus)    result.credits += e.startCreditsBonus
    if (e.startFuelBonus)       result.fuel = Math.min(result.maxFuel, result.fuel + e.startFuelBonus)
    if (e.maxFuelBonus)         { result.maxFuel += e.maxFuelBonus; result.fuel = Math.min(result.maxFuel, result.fuel + e.maxFuelBonus) }
    if (e.startReputationBonus) result.reputation += e.startReputationBonus
    if (e.startMedkitBonus)     result.cargo = { ...result.cargo, 'Médicaments': (result.cargo['Médicaments'] ?? 0) + e.startMedkitBonus }
    if (e.startCargoBonus) {
      const extras = ['Métaux bruts', 'Nourriture synthétique', 'Composants divers', 'Minerais', 'Eau purifiée']
      const pick = extras[Math.floor(Math.random() * extras.length)]
      const pick2 = extras.filter(x => x !== pick)[Math.floor(Math.random() * 4)]
      result.cargo = { ...result.cargo, [pick]: (result.cargo[pick] ?? 0) + 1, [pick2]: (result.cargo[pick2] ?? 0) + 1 }
    }
    if (e.startWeaponTier) {
      const w = rollWeaponForTier(e.startWeaponTier as 1 | 2 | 3 | 4)
      result.weapons = [...result.weapons, w]
    }
    if (e.startNexusFragment && result.nexusFragments.length === 0) {
      result.nexusFragments = [0]
    }
    // Patch class object for persistent bonuses picked up by engine
    if (e.defenseMult)       cls = { ...cls, combatDefenseMult: (cls.combatDefenseMult ?? 1.0) * e.defenseMult }
    if (e.attackBonus)       cls = { ...cls, combatAttackMult:  (cls.combatAttackMult  ?? 1.0) + (e.attackBonus * 0.06) }
    if (e.critBonus)         cls = { ...cls, combatCritBonus:   (cls.combatCritBonus   ?? 0)   + e.critBonus }
    if (e.buyDiscountBonus)  cls = { ...cls, buyDiscountPercent: (cls.buyDiscountPercent ?? 0) + e.buyDiscountBonus }
    if (e.coupDeGrace)       cls = { ...cls, coupDeGraceBonus: (cls.coupDeGraceBonus ?? 0) + e.coupDeGrace }
    // Effets directs sur le GameState
    if (e.surviveLethalOnce) result.lethalSurviveAvailable = true
    if (e.startZoneDepthBonus) result.zoneDepth = (result.zoneDepth ?? 0) + e.startZoneDepthBonus
    if (e.startFactionRepBonus && result.faction && result.faction !== 'none') {
      const fk = result.faction as import('../types').FactionId
      result.factionReputation = {
        ...result.factionReputation,
        [fk]: Math.min(100, (result.factionReputation?.[fk as keyof typeof result.factionReputation] ?? 0) + e.startFactionRepBonus),
      }
    }
  }
  result.class = cls

  return result
}

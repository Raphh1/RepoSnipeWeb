import type { CombatState, CombatLogEntry, Enemy, GameState, WeaponData, CombatOutcome, CombatStance, EnemyIntent, PlayerClassName } from '../types'
import { rollWeaponForTier } from '../data/weapons'
import { rollArmorForTier } from '../data/armors'

let logId = 0
function log(text: string, type: CombatLogEntry['type']): CombatLogEntry {
  return { id: logId++, text, type }
}

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const roll = (chance: number) => Math.random() * 100 < chance

export function initCombat(enemy: Enemy): CombatState {
  return {
    enemyHp: enemy.maxHp,
    enemyStunTurns: 0,
    enemyBurnDmg: 0,
    enemyBurnTurns: 0,
    enemyBlinded: false,
    playerFled: false,
    immunityUsed: false,
    playerStance: 'normal',
    momentum: 0,
    classActionUsed: false,
    currentIntent: 'normal',
    enemyCharging: false,
    enemyWeaponDisabledTurns: 0,
    lastPlayerDmg: 0,
    playerWeakenedTurns: 0,
    log: [],
  }
}

function generateIntent(enemy: Enemy, cs: CombatState): EnemyIntent {
  const r = rng(0, 99)
  if (cs.enemyHp < enemy.maxHp * 0.35)
    return r < 50 ? 'heavy' : r < 70 ? 'charge' : 'normal'
  if (enemy.isBoss) {
    if (r < 25) return 'normal'
    if (r < 40) return 'heavy'
    if (r < 55) return 'defend'
    if (r < 72) return 'charge'
    if (r < 88) return 'disarm'
    return 'normal'
  }
  if (r < 50) return 'normal'
  if (r < 65) return 'heavy'
  if (r < 75) return 'defend'
  if (r < 87) return 'charge'
  return 'disarm'
}

function calcWeaponDamage(weapon: WeaponData, className: PlayerClassName, special: boolean, critBonus = 0): { dmg: number; crit: boolean } {
  let dmg = rng(weapon.damageMin, weapon.damageMax)
  const affinity = weapon.affinities[className] ?? 1.0
  dmg = Math.floor(dmg * affinity)
  if (weapon.effect === 'armorPierce') dmg = Math.floor(dmg * 1.3)
  const critChance = (special ? weapon.critChance + 10 : weapon.critChance) + critBonus
  const crit = roll(critChance)
  if (crit) dmg = Math.floor(dmg * 2)
  return { dmg: Math.max(1, dmg), crit }
}

function calcBareDamage(className: PlayerClassName, critBonus = 0): { dmg: number; crit: boolean } {
  let base = rng(5, 18)
  if (className === 'Seigneur de guerre') base += rng(8, 20)
  else if (className === 'Vétéran') base += rng(5, 12)
  else if (className === 'Vagabond') base -= rng(0, 5)
  const crit = roll(10 + critBonus)
  if (crit) base = Math.floor(base * 2)
  return { dmg: Math.max(1, base), crit }
}

export type CombatAction =
  | { type: 'attack' }
  | { type: 'offensive' }
  | { type: 'defensive' }
  | { type: 'dodge' }
  | { type: 'focused' }
  | { type: 'special' }
  | { type: 'finisher' }
  | { type: 'class' }
  | { type: 'flee' }
  | { type: 'negotiate' }
  | { type: 'intimidate' }
  | { type: 'heal' }
  | { type: 'bite' }
  | { type: 'drug' }
  | { type: 'rest' }
  | { type: 'water' }

export interface CombatResult {
  newGs: Partial<GameState>
  newCs: CombatState
  outcome?: CombatOutcome
  reward?: { loot: number; weaponName?: string; armorName?: string; isBossKill: boolean }
}

export function processCombatAction(
  gs: GameState,
  cs: CombatState,
  enemy: Enemy,
  action: CombatAction
): CombatResult {
  const newCs: CombatState = { ...cs, log: [] }
  const newGs: Partial<GameState> = {}
  let playerHp = gs.playerHp
  let stamina  = gs.stamina
  let credits  = gs.credits
  let reputation = gs.reputation
  let equippedWeapon = gs.equippedWeapon
  let cargo = { ...gs.cargo }

  const weapon = equippedWeapon

  function addLog(text: string, type: CombatLogEntry['type'] = 'info') {
    newCs.log.push(log(text, type))
  }

  // ── PLAYER ACTION ──────────────────────────────────────────────────────

  if (newCs.playerWeakenedTurns > 0) newCs.playerWeakenedTurns--

  newCs.lastPlayerDmg = 0
  newCs.playerStance = 'normal'

  function dealPlayerDamage(mult = 1.0, useSpecial = false, ignoreArmor = false, stance: CombatStance = 'normal') {
    const critBonus = gs.class.combatCritBonus ?? 0
    const attackMult = gs.class.combatAttackMult ?? 1.0
    let result: { dmg: number; crit: boolean }
    if (weapon) {
      result = calcWeaponDamage(weapon, gs.class.name, useSpecial, critBonus)
    } else {
      result = calcBareDamage(gs.class.name, critBonus)
    }
    const folie = gs.folieLevel ?? 0
    const isCannibal = gs.moralTags.includes('cannibal')
    const folieMult = folie >= 80 ? 0.78 : folie >= 50 ? 0.90 : (isCannibal ? 1.15 : 1.0)
    const weakenMult = newCs.playerWeakenedTurns > 0 ? 0.65 : 1.0
    let dmg = Math.floor(result.dmg * mult * attackMult * folieMult * weakenMult)
    if (result.crit) addLog('COUP CRITIQUE !', 'crit')
    newCs.enemyHp = Math.max(0, newCs.enemyHp - dmg)
    newCs.lastPlayerDmg = dmg
    newCs.playerStance = stance
    addLog(`Tu infliges ${dmg} dégâts. ${enemy.name} : ${newCs.enemyHp}/${enemy.maxHp} PV`, 'player')

    // Self damage
    if (weapon && weapon.selfDmgChance > 0 && roll(weapon.selfDmgChance)) {
      const self = rng(Math.floor(weapon.selfDmgMax / 2), weapon.selfDmgMax)
      playerHp = Math.max(1, playerHp - self)
      addLog(`Ton arme se retourne contre toi — ${self} dégâts.`, 'warning')
    }
  }

  switch (action.type) {
    case 'attack': {
      if (stamina < 20) {
        const weak = rng(3, 10)
        newCs.enemyHp = Math.max(0, newCs.enemyHp - weak)
        newCs.lastPlayerDmg = weak
        addLog(`Tu es épuisé. Attaque faible — ${weak} dégâts.`, 'warning')
      } else {
        stamina -= 20
        dealPlayerDamage(1.0, false, false, 'normal')
      }
      break
    }
    case 'offensive': {
      stamina -= 20
      dealPlayerDamage(1.3, false, false, 'offensive')
      addLog('Tu t\'exposes (+20% dégâts reçus ce tour).', 'warning')
      break
    }
    case 'defensive': {
      stamina -= 15
      stamina = Math.min(gs.maxStamina, stamina + 10)
      dealPlayerDamage(1.0, false, false, 'defensive')
      addLog('Posture défensive — tu encaisses mieux ce tour.', 'info')
      break
    }
    case 'dodge': {
      stamina -= 10
      dealPlayerDamage(0.6, false, false, 'dodge')
      addLog('Tu te repositionnes — 40% de chance d\'éviter le prochain coup.', 'info')
      break
    }
    case 'focused': {
      stamina -= 50
      dealPlayerDamage(1.6, false, false, 'normal')
      break
    }
    case 'special': {
      if (!weapon) break
      stamina -= 35
      dealPlayerDamage(1.0, true, false, 'offensive')
      if (roll(weapon.effectChance)) {
        applyWeaponEffect(weapon.effect, newCs, addLog)
      } else {
        addLog('L\'effet spécial ne s\'est pas déclenché.', 'info')
      }
      break
    }
    case 'finisher': {
      stamina -= 0
      dealPlayerDamage(3.0, false, false, 'offensive')
      newCs.momentum = 0
      addLog('FINISHER DEVASTATEUR !', 'crit')
      break
    }
    case 'class': {
      newCs.classActionUsed = true
      switch (gs.class.name) {
        case 'Seigneur de guerre': {
          const chance = 40 + Math.max(0, Math.floor(reputation / 5))
          if (roll(chance)) {
            newCs.enemyStunTurns = 1
            addLog('Ton aura écrase l\'ennemi. Il perd son tour.', 'player')
          } else addLog('L\'intimidation n\'a pas suffi.', 'info')
          break
        }
        case 'Médecin': {
          stamina -= 20
          const healed = Math.min(30, gs.playerMaxHp - playerHp)
          playerHp = Math.min(gs.playerMaxHp, playerHp + 30)
          addLog(`Soin rapide ! +${healed} PV. ${playerHp}/${gs.playerMaxHp}`, 'player')
          break
        }
        case 'Hackeur': {
          stamina -= 30
          newCs.enemyWeaponDisabledTurns = 2
          addLog(`HACK RÉUSSI ! Armement de ${enemy.name} désactivé 2 tours.`, 'player')
          break
        }
        case 'Contrebandier': {
          if (gs.fuel > 0) {
            newGs.fuel = gs.fuel - 1
            newCs.playerFled = true
            addLog('Fuite garantie. -1 carburant.', 'info')
          }
          break
        }
        case 'Vagabond': {
          const dmg = rng(15, 35) + (weapon ? rng(weapon.damageMin, weapon.damageMax) : rng(5, 15))
          newCs.enemyHp = Math.max(0, newCs.enemyHp - dmg)
          newCs.lastPlayerDmg = dmg
          reputation -= 10
          addLog(`Coup bas — ${dmg} dégâts (armure ignorée). -10 réputation.`, 'player')
          break
        }
      }
      break
    }
    case 'flee': {
      const chance = 50 + (gs.fuel > 2 ? 15 : 0) + (gs.class.name === 'Contrebandier' ? 20 : 0)
      if (roll(chance)) {
        newGs.fuel = Math.max(0, gs.fuel - 1)
        newCs.playerFled = true
        addLog('Tu t\'échappes. -1 carburant.', 'info')
      } else {
        addLog(`${enemy.name} te coupe la route.`, 'enemy')
      }
      break
    }
    case 'negotiate': {
      const chance = 20 + Math.max(0, Math.floor(reputation / 8))
      if (roll(chance)) {
        addLog('Tu trouves les mots. L\'ennemi baisse son arme.', 'victory')
        newCs.enemyHp = 0
        reputation += 5
      } else addLog('Ça ne marche pas.', 'enemy')
      break
    }
    case 'intimidate': {
      const chance = Math.floor(reputation / 5) + (gs.class.name === 'Seigneur de guerre' ? 30 : 0)
      if (roll(chance)) {
        addLog(`Ta réputation parle. ${enemy.name} recule.`, 'victory')
        newCs.enemyHp = 0
      } else addLog('Il n\'est pas impressionné.', 'enemy')
      break
    }
    case 'heal': {
      if ((cargo['Médicaments'] ?? 0) > 0) {
        cargo['Médicaments']--
        if (cargo['Médicaments'] <= 0) delete cargo['Médicaments']
        playerHp = Math.min(gs.playerMaxHp, playerHp + 30)
        addLog(`Soigné. PV : ${playerHp}/${gs.playerMaxHp}`, 'player')
      }
      return { newGs: { ...newGs, playerHp, stamina, credits, reputation, equippedWeapon, cargo }, newCs }
    }
    case 'bite': {
      stamina -= 25
      const biteDmg = rng(18, 45) + Math.floor((gs.folieLevel ?? 0) * 0.3)
      // Ignore 30% de l'armure — appliqué directement sur enemyHp
      newCs.enemyHp = Math.max(0, newCs.enemyHp - biteDmg)
      newCs.lastPlayerDmg = biteDmg
      newCs.playerStance = 'offensive'
      addLog(`MORSURE — ${biteDmg} dégâts (ignore armure). ${enemy.name} : ${newCs.enemyHp}/${enemy.maxHp} PV`, 'crit')
      // Réduit la folie
      newGs.folieLevel = Math.max(0, (gs.folieLevel ?? 0) - 15)
      newGs.folieConsumedThisTurn = true
      break
    }
    case 'drug': {
      if ((cargo['Drogues de synthèse'] ?? 0) > 0) {
        cargo['Drogues de synthèse']--
        if (cargo['Drogues de synthèse'] <= 0) delete cargo['Drogues de synthèse']
        const addicted = (gs.addictionLevel ?? 0) > 0
        if (addicted) {
          const dmg = rng(15, 35)
          playerHp = Math.max(1, playerHp - dmg)
          newCs.playerWeakenedTurns = newCs.playerWeakenedTurns + 2
          newGs.addictionLevel = (gs.addictionLevel ?? 0) + 1
          addLog(`Overdose. -${dmg} PV. Ton corps tremble — dégâts réduits 2 tours.`, 'warning')
        } else {
          playerHp = Math.min(gs.playerMaxHp, playerHp + 20)
          stamina = Math.min(gs.maxStamina, stamina + 25)
          const hooked = Math.random() < 0.5
          if (hooked) newGs.addictionLevel = 1
          addLog(`Effet puissant. +20 PV, +25 Stamina.${hooked ? ' Quelque chose t\'accroche.' : ''}`, 'player')
        }
      } else {
        addLog('Plus de drogues de synthèse.', 'info')
      }
      break
    }
    case 'rest': {
      const gain = 40
      stamina = Math.min(gs.maxStamina, stamina + gain)
      addLog(`Tu souffles. +${gain} stamina. L'ennemi en profite.`, 'info')
      break
    }
    case 'water': {
      if ((cargo['Eau purifiée'] ?? 0) > 0) {
        cargo['Eau purifiée']--
        if (cargo['Eau purifiée'] <= 0) delete cargo['Eau purifiée']
        stamina = gs.maxStamina
        addLog('Stamina complètement restaurée.', 'player')
      } else {
        addLog('Plus d\'eau purifiée.', 'info')
      }
      return { newGs: { ...newGs, playerHp, stamina, credits, reputation, equippedWeapon, cargo }, newCs }
    }
  }

  // Check victory before enemy turn
  if (newCs.enemyHp <= 0) {
    const v = resolveVictory(gs, enemy)
    return {
      newGs: { ...newGs, playerHp, stamina, credits: credits + v.loot, reputation: reputation + 10, equippedWeapon, cargo, ...v.extra },
      newCs, outcome: 'victory', reward: v.rewardInfo,
    }
  }

  if (newCs.playerFled) {
    return { newGs: { ...newGs, playerHp, stamina, credits, reputation, equippedWeapon, cargo }, newCs, outcome: 'fled' }
  }

  // ── MOMENTUM ──────────────────────────────────────────────────────────
  if (newCs.lastPlayerDmg > 0) {
    newCs.momentum = Math.min(3, newCs.momentum + 1)
    if (newCs.momentum === 3) addLog('MOMENTUM MAX — Finisher disponible !', 'crit')
  }

  // ── BURN ──────────────────────────────────────────────────────────────
  if (newCs.enemyBurnTurns > 0) {
    newCs.enemyHp = Math.max(0, newCs.enemyHp - newCs.enemyBurnDmg)
    newCs.enemyBurnTurns--
    addLog(`Brûlure — ${newCs.enemyBurnDmg} dégâts. ${enemy.name} : ${newCs.enemyHp}/${enemy.maxHp} PV`, 'info')
    if (newCs.enemyHp <= 0) {
      const v = resolveVictory(gs, enemy)
      return {
        newGs: { ...newGs, playerHp, stamina, credits: credits + v.loot, reputation: reputation + 10, equippedWeapon, cargo, ...v.extra },
        newCs, outcome: 'victory', reward: v.rewardInfo,
      }
    }
  }

  // ── ENEMY TURN ────────────────────────────────────────────────────────
  newCs.currentIntent = newCs.enemyCharging ? 'heavy' : generateIntent(enemy, newCs)

  if (newCs.enemyStunTurns > 0) {
    newCs.enemyStunTurns--
    addLog(`${enemy.name} est étourdi — perd son tour.`, 'info')
  } else if (newCs.enemyWeaponDisabledTurns > 0) {
    newCs.enemyWeaponDisabledTurns--
    const hackDmg = rng(2, 8)
    playerHp = Math.max(0, playerHp - hackDmg)
    addLog(`[HACK] ${enemy.name} improvise — ${hackDmg} dégâts. (${newCs.enemyWeaponDisabledTurns}t restant)`, 'enemy')
  } else {
    let enemyDmg = 0
    let skipped = false

    const wasBlinded = newCs.enemyBlinded
    if (newCs.enemyBlinded) newCs.enemyBlinded = false

    switch (newCs.currentIntent) {
      case 'heavy': {
        newCs.enemyCharging = false
        enemyDmg = Math.floor(rng(enemy.damageMin, enemy.damageMax) * 1.8)
        if (wasBlinded) enemyDmg = Math.floor(enemyDmg * 0.6)
        addLog(`${enemy.name} frappe de toutes ses forces !`, 'enemy')
        break
      }
      case 'defend': {
        addLog(`${enemy.name} reprend son souffle.`, 'info')
        skipped = true
        break
      }
      case 'charge': {
        newCs.enemyCharging = true
        enemyDmg = Math.max(1, rng(1, Math.max(2, Math.floor(enemy.damageMin / 2))))
        if (wasBlinded) enemyDmg = Math.floor(enemyDmg * 0.6)
        addLog(`${enemy.name} se concentre — FRAPPE DÉVASTATRICE AU PROCHAIN TOUR !`, 'warning')
        break
      }
      case 'disarm': {
        enemyDmg = rng(Math.floor(enemy.damageMin / 2), Math.max(Math.floor(enemy.damageMin / 2) + 1, Math.floor(enemy.damageMax / 2)))
        if (wasBlinded) enemyDmg = Math.floor(enemyDmg * 0.6)
        if (equippedWeapon && roll(30)) {
          const wName = equippedWeapon.name
          equippedWeapon = null
          addLog(`${enemy.name} t'arrache ${wName} ! Tu te bats à mains nues.`, 'enemy')
        }
        break
      }
      default: { // normal
        enemyDmg = rng(enemy.damageMin, enemy.damageMax)
        if (wasBlinded) enemyDmg = Math.floor(enemyDmg * 0.6)
        if (roll(10)) {
          enemyDmg = Math.floor(enemyDmg * 1.8)
          addLog('COUP CRITIQUE ENNEMI !', 'crit')
        }
        break
      }
    }

    if (!skipped && enemyDmg > 0) {
      switch (newCs.playerStance) {
        case 'defensive': enemyDmg = Math.floor(enemyDmg * 0.70); break
        case 'offensive': enemyDmg = Math.floor(enemyDmg * 1.20); break
        case 'dodge':
          if (roll(40)) {
            addLog('Tu esquives parfaitement l\'attaque !', 'player')
            enemyDmg = 0
          }
          break
      }
    }

    if (!skipped && enemyDmg > 0) {
      enemyDmg = Math.floor(enemyDmg * (gs.class.combatDefenseMult ?? 1.0))
      const armor = gs.equippedArmor
      if (armor) {
        const reduced = Math.floor(enemyDmg * armor.defense / 100)
        enemyDmg -= reduced
        if (reduced > 0) addLog(`Armure absorbe ${reduced} dégâts.`, 'info')
        if (armor.effect === 'thorns' && enemyDmg > 0) {
          const thorns = Math.floor(enemyDmg * armor.effectValue / 100)
          newCs.enemyHp = Math.max(0, newCs.enemyHp - thorns)
          addLog(`Épines — ${thorns} dégâts renvoyés à ${enemy.name}.`, 'info')
        }
        if (armor.effect === 'immunity' && !newCs.immunityUsed && playerHp <= enemyDmg) {
          newCs.immunityUsed = true
          enemyDmg = 0
          addLog('L\'Armure du Vide absorbe le coup fatal. Une seule fois.', 'warning')
        }
      }

      if (enemyDmg > 0) {
        newCs.momentum = 0
        playerHp = Math.max(0, playerHp - enemyDmg)
        addLog(`${enemy.name} attaque — ${enemyDmg} dégâts. PV : ${playerHp}/${gs.playerMaxHp}`, 'enemy')
      }
    }
  }

  // Regen armor
  if (gs.equippedArmor?.effect === 'regen') {
    const r = gs.equippedArmor.effectValue
    playerHp = Math.min(gs.playerMaxHp, playerHp + r)
    if (r > 0) addLog(`Régénération : +${r} PV.`, 'info')
  }

  // Stamina regen
  const staminaRegen = 20 + (gs.equippedArmor?.effect === 'staminaBoost' ? gs.equippedArmor.effectValue : 0)
    + (newCs.playerStance === 'defensive' ? 10 : 0)
    + (gs.class.combatStaminaRegen ?? 0)
  stamina = Math.min(gs.maxStamina, stamina + staminaRegen)

  if (playerHp <= 0) {
    addLog(`Tu tombes. ${enemy.name} se penche sur toi...`, 'enemy')
    const r = Math.random() * 100
    let outcome: CombatOutcome = 'stunned'
    if (r < enemy.killChance) outcome = 'dead'
    else if (r < enemy.killChance + enemy.captureChance) outcome = 'captured'
    return { newGs: { ...newGs, playerHp: 0, stamina, credits, reputation, equippedWeapon, cargo }, newCs, outcome }
  }

  return { newGs: { ...newGs, playerHp, stamina, credits, reputation, equippedWeapon, cargo }, newCs }
}

function applyWeaponEffect(effect: string, cs: CombatState, addLog: (t: string, type: CombatLogEntry['type']) => void) {
  switch (effect) {
    case 'stun':        cs.enemyStunTurns = 1; addLog('Étourdi ! L\'ennemi perd son tour.', 'info'); break
    case 'paralyze':    cs.enemyStunTurns = 2; addLog('Paralysé ! L\'ennemi perd 2 tours.', 'info'); break
    case 'burn':        cs.enemyBurnDmg = rng(8, 20); cs.enemyBurnTurns = 3; addLog(`Brûlure ! ${cs.enemyBurnDmg} dégâts/tour x3.`, 'warning'); break
    case 'poison':      cs.enemyBurnDmg = rng(5, 15); cs.enemyBurnTurns = 4; addLog(`Empoisonné ! ${cs.enemyBurnDmg} dégâts/tour x4.`, 'info'); break
    case 'blind':       cs.enemyBlinded = true; addLog('Aveuglé ! -40% précision ennemi.', 'info'); break
    case 'flee':        cs.enemyHp = 0; addLog('L\'ennemi panique et fuit !', 'victory'); break
    case 'distraction': cs.enemyStunTurns = 1; addLog('Distrait ! L\'ennemi perd son tour.', 'info'); break
    case 'random':      applyWeaponEffect(['stun','burn','blind','poison','flee'][rng(0,4)], cs, addLog); break
  }
}

function resolveVictory(gs: GameState, enemy: Enemy): { loot: number; extra: Partial<GameState>; rewardInfo: { loot: number; weaponName?: string; armorName?: string; isBossKill: boolean } } {
  const loot = rng(enemy.lootMin, enemy.lootMax)
  const extra: Partial<GameState> = {}
  const bossNames = ['Alanossa', 'La Faucon', 'Directeur Pale', 'Garde du Corps d\'Eliotis',
    'Le Boucher de Velkor', 'Oracle de la Singularité', 'Amiral Voss-Kheran', 'La Curatrice',
    'Frère Ossian le Dernier', 'La Mère Mecanique', 'Veilleur du Bout du Monde',
    "L'Architecte du Chaos", 'Commandante Zara Sable', 'Le Colosse de Ferraille',
    'Le Fantôme des Ombres', 'La Bête Noire', 'La Veuve de Vega',
    "L'Exilé Écarlate", 'Patient Zéro', "L'Ombre du Vide", 'Le Roi de Nuit']
  const isBossKill = bossNames.includes(enemy.name)
  let weaponName: string | undefined
  let armorName: string | undefined

  if (isBossKill) {
    extra.bossesDefeated = (gs.bossesDefeated ?? 0) + 1
    const legendary = rollWeaponForTier(5)
    extra.weapons = [...gs.weapons, legendary]
    weaponName = legendary.name
  } else {
    const r = rng(0, 99)
    if (r < 20) {
      const w = rollWeaponForTier(rng(1, 3))
      extra.weapons = [...gs.weapons, w]
      weaponName = w.name
    } else if (r < 30) {
      const a = rollArmorForTier(rng(1, 3))
      extra.armors = [...gs.armors, a]
      armorName = a.name
    }
  }
  return { loot, extra, rewardInfo: { loot, weaponName, armorName, isBossKill } }
}

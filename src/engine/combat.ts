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
    playerStunnedTurns: 0,
    playerBurnDmg: 0,
    playerBurnTurns: 0,
    enemyWeakenedTurns: 0,
    enemyConfusedTurns: 0,
    enemySilencedTurns: 0,
    playerExposedTurns: 0,
    medicUses: 0,
    turnCount: 0,
    subBossShadowHits: 0,
    subBossDefenseStacks: 0,
    log: [],
  }
}

function generateIntent(enemy: Enemy, cs: CombatState): EnemyIntent {
  // Silence — l'ennemi ne peut qu'attaquer normalement ou se défendre
  if (cs.enemySilencedTurns > 0) {
    const rs = rng(0, 99)
    return rs < 65 ? 'normal' : 'defend'
  }

  const r = rng(0, 99)
  const lowHp = cs.enemyHp < enemy.maxHp * 0.35

  // Personnages piliers — capacité unique (30 % de chance, 40 % si PV bas)
  if (enemy.pillarAbility) {
    const threshold = lowHp ? 40 : 30
    if (r < threshold) return enemy.pillarAbility
    if (r < threshold + 12) return 'blood_rage'
    if (r < threshold + 22) return 'execution'
    if (lowHp) return r < threshold + 32 ? 'heavy' : 'charge'
    if (r < threshold + 30) return 'heavy'
    if (r < threshold + 42) return 'charge'
    if (r < threshold + 52) return 'defend'
    if (r < threshold + 62) return 'disarm'
    return 'normal'
  }

  // Tous les boss puissants — attaques spéciales génériques
  if (enemy.isBoss) {
    if (lowHp) return r < 45 ? 'heavy' : r < 60 ? 'charge' : r < 72 ? 'blood_rage' : r < 82 ? 'execution' : 'normal'
    if (r < 20) return 'normal'
    if (r < 34) return 'heavy'
    if (r < 46) return 'defend'
    if (r < 58) return 'charge'
    if (r < 68) return 'disarm'
    if (r < 78) return 'blood_rage'
    if (r < 88) return 'execution'
    return 'weaken'
  }

  // Ennemis normaux
  if (lowHp) return r < 50 ? 'heavy' : r < 70 ? 'charge' : 'normal'
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
  | { type: 'negotiate-accept' }
  | { type: 'intimidate' }
  | { type: 'heal' }
  | { type: 'bite' }
  | { type: 'drug' }
  | { type: 'rest' }
  | { type: 'water' }
  | { type: 'food' }
  | { type: 'herb' }
  | { type: 'alcohol' }
  | { type: 'premium_med' }

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
  newCs.turnCount = (cs.turnCount ?? 0) + 1
  const newGs: Partial<GameState> = {}
  let playerHp = gs.playerHp
  let stamina  = gs.stamina
  let credits  = gs.credits
  let reputation = gs.reputation
  let equippedWeapon = gs.equippedWeapon
  let cargo = { ...gs.cargo }

  const weapon = equippedWeapon
  const isSubBoss = !!enemy.isSubBoss
  const sbTurn = newCs.turnCount

  function addLog(text: string, type: CombatLogEntry['type'] = 'info') {
    newCs.log.push(log(text, type))
  }

  // ── SUB-BOSS PRE-ATTACK — Le Vigie Immortel attaque en premier ────────
  if (isSubBoss && enemy.name === 'Le Vigie Immortel') {
    const preStrikeDmg = Math.floor(rng(enemy.damageMin, enemy.damageMax) * 0.4)
    playerHp = Math.max(0, playerHp - preStrikeDmg)
    addLog(`⚡ TIR PRÉVENTIF — Le Vigie frappe en premier ! ${preStrikeDmg} dégâts. PV : ${playerHp}/${gs.playerMaxHp}`, 'enemy')
    if (playerHp <= 0) {
      const r2 = Math.random() * 100
      let outcome2: CombatOutcome = 'stunned'
      if (r2 < enemy.killChance) outcome2 = 'dead'
      else if (r2 < enemy.killChance + enemy.captureChance) outcome2 = 'captured'
      return { newGs: { ...newGs, playerHp: outcome2 === 'captured' ? Math.floor(gs.playerMaxHp / 2) : 0, stamina, credits, reputation, equippedWeapon, cargo }, newCs, outcome: outcome2 }
    }
  }

  // ── PLAYER ACTION ──────────────────────────────────────────────────────

  // Stun joueur (attaque spéciale Eliotis — party_over)
  if (newCs.playerStunnedTurns > 0) {
    newCs.playerStunnedTurns--
    addLog(`Tu es étourdi et ne peux pas agir ! (${newCs.playerStunnedTurns} tour${newCs.playerStunnedTurns !== 1 ? 's' : ''} restant${newCs.playerStunnedTurns !== 1 ? 's' : ''})`, 'warning')
    // Passe directement au tour ennemi — sans traiter l'action
    newCs.currentIntent = newCs.enemyCharging ? 'heavy' : generateIntent(enemy, newCs)
    if (newCs.enemyStunTurns > 0) {
      newCs.enemyStunTurns--
      newCs.enemyCharging = false
      addLog(`${enemy.name} est étourdi — perd son tour.`, 'info')
    } else {
      const enemyDmg2 = Math.floor(rng(enemy.damageMin, enemy.damageMax) * (gs.class.combatDefenseMult ?? 1.0))
      const armor2 = gs.equippedArmor
      const reduced2 = armor2 ? Math.floor(enemyDmg2 * armor2.defense / 100) : 0
      const finalDmg2 = Math.max(0, enemyDmg2 - reduced2)
      if (finalDmg2 > 0) {
        playerHp = Math.max(0, playerHp - finalDmg2)
        addLog(`${enemy.name} profite de ta vulnérabilité — ${finalDmg2} dégâts. PV : ${playerHp}/${gs.playerMaxHp}`, 'enemy')
      }
    }
    if (playerHp <= 0) {
      addLog(`Tu tombes. ${enemy.name} se penche sur toi...`, 'enemy')
      const r2 = Math.random() * 100
      let outcome2: CombatOutcome = 'stunned'
      if (r2 < enemy.killChance) outcome2 = 'dead'
      else if (r2 < enemy.killChance + enemy.captureChance) outcome2 = 'captured'
      const survivedHp = outcome2 === 'captured' ? Math.floor(gs.playerMaxHp / 2) : 0
      return { newGs: { ...newGs, playerHp: survivedHp, stamina, credits, reputation, equippedWeapon, cargo }, newCs, outcome: outcome2 }
    }
    return { newGs: { ...newGs, playerHp, stamina, credits, reputation, equippedWeapon, cargo }, newCs }
  }

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
    const coupDeGrace = (gs.class.coupDeGraceBonus ?? 0) > 0 && newCs.enemyHp < enemy.maxHp * 0.25
      ? 1 + (gs.class.coupDeGraceBonus ?? 0) / 100
      : 1.0
    let dmg = Math.floor(result.dmg * mult * attackMult * folieMult * weakenMult * coupDeGrace)
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
      stamina -= 30
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
      newCs.playerExposedTurns = 1
      addLog('⚡ Frappe concentrée — tu es vulnérable au prochain coup ennemi (×1.5).', 'warning')
      break
    }
    case 'special': {
      if (!weapon) break
      stamina -= 35

      switch (weapon.effect) {

        // ── EFFETS INSTANTANÉS COMPLEXES (gèrent leur propre dealPlayerDamage) ─

        case 'double_strike': {
          addLog('⚔ DOUBLE FRAPPE !', 'crit')
          dealPlayerDamage(0.85, true, false, 'offensive')
          const first = newCs.lastPlayerDmg
          dealPlayerDamage(0.85, true, false, 'offensive')
          addLog(`Deux coups — ${first} + ${newCs.lastPlayerDmg} dégâts.`, 'player')
          break
        }

        case 'sacrifice': {
          const cost = Math.floor(gs.playerMaxHp * 0.25)
          if (playerHp <= cost + 5) {
            addLog('Trop peu de PV pour activer le sacrifice — attaque normale.', 'warning')
            dealPlayerDamage(0.8, false, false, 'normal')
          } else {
            playerHp -= cost
            addLog(`🩸 SACRIFICE — ${cost} PV offerts en échange d'un coup dévastateur...`, 'warning')
            dealPlayerDamage(2.5, true, false, 'offensive')
          }
          break
        }

        case 'unstable': {
          if (roll(50)) {
            addLog('⚡ DÉCHARGE INSTABLE — RÉACTION CRITIQUE !', 'crit')
            dealPlayerDamage(3.5, true, false, 'offensive')
          } else {
            const selfDmg = rng(100, 300)
            playerHp = Math.max(1, playerHp - selfDmg)
            newCs.playerStunnedTurns = 1
            addLog(`💥 INSTABILITÉ CATASTROPHIQUE — ${selfDmg} dégâts en retour ! Tu es étourdi 1 tour.`, 'warning')
            dealPlayerDamage(0.2, false, false, 'normal')
          }
          break
        }

        case 'nuclear': {
          addLog('☢ RÉACTION NUCLÉAIRE — IMPACT TOTAL !', 'crit')
          dealPlayerDamage(4.5, true, false, 'offensive')
          if (roll(65)) {
            const selfDmg = rng(80, 200)
            playerHp = Math.max(1, playerHp - selfDmg)
            newCs.playerWeakenedTurns = Math.max(newCs.playerWeakenedTurns, 2)
            addLog(`☢ IRRADIATION — ${selfDmg} dégâts en retour, affaibli 2 tours !`, 'warning')
          } else {
            addLog('Réaction maîtrisée. Pas d\'irradiation ce tour.', 'info')
          }
          break
        }

        case 'berserker': {
          const missing = 1 - (playerHp / gs.playerMaxHp)
          const bMult = Math.min(2.5, 1.0 + missing * 1.5)
          const bPct = Math.round(bMult * 100)
          addLog(`💢 RAGE BERSERK — ${bPct}% de puissance (${Math.round(missing * 100)}% PV manquants) !`, bMult > 1.7 ? 'crit' : 'info')
          dealPlayerDamage(bMult, true, false, 'offensive')
          break
        }

        case 'lifesteal': {
          dealPlayerDamage(1.2, true, false, 'offensive')
          const stolen = Math.floor(newCs.lastPlayerDmg * 0.35)
          playerHp = Math.min(gs.playerMaxHp, playerHp + stolen)
          addLog(`🩸 VOL DE VIE — +${stolen} PV récupérés. PV : ${playerHp}/${gs.playerMaxHp}`, 'player')
          break
        }

        case 'momentum_surge': {
          dealPlayerDamage(1.1, true, false, 'offensive')
          newCs.momentum = 3
          addLog('⚡ SURGE — MOMENTUM MAX INSTANTANÉ ! Finisher disponible !', 'crit')
          break
        }

        // ── EFFETS À CHANCE (passent par applyWeaponEffect) ──────────────────

        default: {
          dealPlayerDamage(1.0, true, false, 'offensive')
          if (weapon.effectChance > 0 && roll(weapon.effectChance)) {
            applyWeaponEffect(weapon.effect, newCs, addLog)
          } else if (weapon.effectChance > 0) {
            addLog('L\'effet spécial ne s\'est pas déclenché.', 'info')
          }
        }
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
          const rawCh = 40 + Math.max(0, Math.floor(reputation / 5))
          const cappedCh = Math.min(80, rawCh)
          if (roll(cappedCh)) {
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
      addLog(`${enemy.name} refuse de négocier. Il attaque.`, 'enemy')
      break
    }
    case 'negotiate-accept': {
      newCs.enemyHp = 0
      reputation += 3
      addLog(`Accord trouvé. ${enemy.name} baisse les armes.`, 'victory')
      break
    }
    case 'intimidate': {
      // L'intimidation ne gagne JAMAIS le combat : elle affaiblit l'adversaire
      // ou lui fait louper un tour. Les boss et sous-boss y résistent davantage.
      const rawChance = Math.floor(reputation / 5) + (gs.class.name === 'Seigneur de guerre' ? 30 : 0)
      const bossResist = enemy.isBoss ? 0.5 : 1
      const chance = Math.min(enemy.isBoss ? 45 : 80, Math.floor((15 + rawChance) * bossResist))
      if (roll(chance)) {
        if (roll(50)) {
          newCs.enemyStunTurns = Math.max(newCs.enemyStunTurns, 1)
          addLog(`Ta réputation parle. ${enemy.name} hésite — il perd son prochain tour.`, 'victory')
        } else {
          const dur = enemy.isBoss ? 2 : 3
          newCs.enemyWeakenedTurns = Math.max(newCs.enemyWeakenedTurns, dur)
          addLog(`${enemy.name} est ébranlé — ses attaques sont affaiblies (-40%) pendant ${dur} tours.`, 'victory')
        }
      } else addLog(`${enemy.name} n'est pas impressionné.`, 'enemy')
      break
    }
    case 'heal': {
      if (newCs.medicUses >= 3) {
        addLog('Limite de soins atteinte (3/3).', 'warning')
        return { newGs: { ...newGs, playerHp, stamina, credits, reputation, equippedWeapon, cargo }, newCs }
      }
      if ((cargo['Médicaments'] ?? 0) > 0) {
        cargo['Médicaments']--
        if (cargo['Médicaments'] <= 0) delete cargo['Médicaments']
        playerHp = Math.min(gs.playerMaxHp, playerHp + 30)
        newCs.medicUses++
        addLog(`Soigné. PV : ${playerHp}/${gs.playerMaxHp} (${newCs.medicUses}/3 soins)`, 'player')
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
    case 'food': {
      if (newCs.medicUses >= 3) {
        addLog('Limite de soins atteinte (3/3).', 'warning')
        return { newGs: { ...newGs, playerHp, stamina, credits, reputation, equippedWeapon, cargo }, newCs }
      }
      const FOOD_ORDER = ['Rations militaires', 'Rations', 'Vivres', 'Nourriture fraîche', 'Nourriture synthétique']
      const key = FOOD_ORDER.find(k => (cargo[k] ?? 0) > 0)
      if (key) {
        cargo[key]--
        if (cargo[key] <= 0) delete cargo[key]
        playerHp = Math.min(gs.playerMaxHp, playerHp + 15)
        newCs.medicUses++
        addLog(`${key} consommé. +15 PV. (${playerHp}/${gs.playerMaxHp}) (${newCs.medicUses}/3 soins)`, 'player')
      }
      return { newGs: { ...newGs, playerHp, stamina, credits, reputation, equippedWeapon, cargo }, newCs }
    }
    case 'herb': {
      if (newCs.medicUses >= 3) {
        addLog('Limite de soins atteinte (3/3).', 'warning')
        return { newGs: { ...newGs, playerHp, stamina, credits, reputation, equippedWeapon, cargo }, newCs }
      }
      if ((cargo['Plantes médicinales'] ?? 0) > 0) {
        cargo['Plantes médicinales']--
        if (cargo['Plantes médicinales'] <= 0) delete cargo['Plantes médicinales']
        playerHp = Math.min(gs.playerMaxHp, playerHp + 25)
        newCs.medicUses++
        addLog(`Plantes médicinales appliquées. +25 PV. (${playerHp}/${gs.playerMaxHp}) (${newCs.medicUses}/3 soins)`, 'player')
      }
      return { newGs: { ...newGs, playerHp, stamina, credits, reputation, equippedWeapon, cargo }, newCs }
    }
    case 'alcohol': {
      if ((cargo['Alcools exotiques'] ?? 0) > 0) {
        cargo['Alcools exotiques']--
        if (cargo['Alcools exotiques'] <= 0) delete cargo['Alcools exotiques']
        stamina = Math.min(gs.maxStamina, stamina + 60)
        newCs.playerExposedTurns = (newCs.playerExposedTurns ?? 0) + 1
        addLog(`Alcool englouti d\'un trait. +60 stamina. Tu es ralenti — l'ennemi en profite.`, 'warning')
      }
      break
    }
    case 'premium_med': {
      if (newCs.medicUses >= 3) {
        addLog('Limite de soins atteinte (3/3).', 'warning')
        return { newGs: { ...newGs, playerHp, stamina, credits, reputation, equippedWeapon, cargo }, newCs }
      }
      if ((cargo['Médicaments premium'] ?? 0) > 0) {
        cargo['Médicaments premium']--
        if (cargo['Médicaments premium'] <= 0) delete cargo['Médicaments premium']
        playerHp = Math.min(gs.playerMaxHp, playerHp + 60)
        newCs.medicUses++
        addLog(`Médicaments premium. Soins intensifs. +60 PV. (${playerHp}/${gs.playerMaxHp}) (${newCs.medicUses}/3 soins)`, 'player')
      }
      return { newGs: { ...newGs, playerHp, stamina, credits, reputation, equippedWeapon, cargo }, newCs }
    }
  }

  // ── SUB-BOSS DAMAGE MODIFIERS (after player deals damage) ──────────────
  if (isSubBoss && newCs.lastPlayerDmg > 0) {
    // Plafond anti-farm : peu importe la puissance accumulée par le joueur,
    // un sous-boss ne peut jamais perdre plus de 12% de ses PV max en un seul
    // coup. Il faut donc tenir la distance, pas juste frapper fort une fois.
    const perHitCap = Math.ceil(enemy.maxHp * 0.12)
    if (newCs.lastPlayerDmg > perHitCap) {
      const excess = newCs.lastPlayerDmg - perHitCap
      newCs.enemyHp = Math.min(enemy.maxHp, newCs.enemyHp + excess)
      newCs.lastPlayerDmg = perHitCap
      addLog(`${enemy.name} est trop aguerri pour tomber d'un seul coup — dégâts plafonnés à ${perHitCap}.`, 'info')
    }
    const dmgDealt = newCs.lastPlayerDmg

    // Le Vigie Immortel — esquive auto tous les 3 tours
    if (enemy.name === 'Le Vigie Immortel' && sbTurn % 3 === 0) {
      newCs.enemyHp = Math.min(enemy.maxHp, newCs.enemyHp + dmgDealt)
      newCs.lastPlayerDmg = 0
      addLog('🎯 Le Vigie anticipe ton mouvement — esquive totale !', 'enemy')
    }

    // Le Fantôme des Ombres — invisible les tours impairs
    if (enemy.name === 'Le Fantôme des Ombres' && sbTurn % 2 === 1) {
      newCs.enemyHp = Math.min(enemy.maxHp, newCs.enemyHp + dmgDealt)
      newCs.lastPlayerDmg = 0
      const counterDmg = Math.floor(rng(enemy.damageMin, enemy.damageMax) * 0.5)
      playerHp = Math.max(0, playerHp - counterDmg)
      addLog(`👻 Le Fantôme est invisible — ton attaque passe à travers ! Contre-attaque : ${counterDmg} dégâts. PV : ${playerHp}/${gs.playerMaxHp}`, 'enemy')
    }

    // Le Passeur Sanguinaire — mode défensif tous les 2 tours pairs, réduit dégâts de 50%
    if (enemy.name === 'Le Passeur Sanguinaire' && sbTurn % 4 < 2) {
      const reduced = Math.floor(dmgDealt * 0.5)
      newCs.enemyHp = Math.min(enemy.maxHp, newCs.enemyHp + reduced)
      newCs.lastPlayerDmg = dmgDealt - reduced
      addLog(`🛡 Le Passeur est en mode défensif — ${reduced} dégâts absorbés !`, 'enemy')
    }

    // Le Directeur Fantôme — redirige 30% des dégâts vers le joueur
    if (enemy.name === 'Le Directeur Fantôme' && roll(30)) {
      const redirected = Math.floor(dmgDealt * 0.3)
      playerHp = Math.max(0, playerHp - redirected)
      addLog(`👤 Le Directeur Fantôme redirige l'énergie — ${redirected} dégâts renvoyés ! PV : ${playerHp}/${gs.playerMaxHp}`, 'warning')
    }

    // La Veuve de Fer — réduit 40% des dégâts physiques (armes burn/shock ignorent)
    if (enemy.name === 'La Veuve de Fer') {
      const weaponEffect = gs.equippedWeapon?.effect
      const ignoresArmor = weaponEffect === 'burn' || weaponEffect === 'shock'
      if (!ignoresArmor) {
        const absorbed = Math.floor(dmgDealt * 0.4)
        newCs.enemyHp = Math.min(enemy.maxHp, newCs.enemyHp + absorbed)
        newCs.lastPlayerDmg = dmgDealt - absorbed
        addLog(`🛡 L'Armure de deuil absorbe ${absorbed} dégâts ! Utilise des armes énergétiques.`, 'enemy')
      }
    }

    // Le Spectre du 7e — immunisé aux attaques directes tous les 2 tours
    if (enemy.name === 'Le Spectre du 7e' && sbTurn % 2 === 0) {
      newCs.enemyHp = Math.min(enemy.maxHp, newCs.enemyHp + dmgDealt)
      newCs.lastPlayerDmg = 0
      addLog('👻 Le Spectre est en phase spectrale — ton attaque le traverse ! Attends le prochain tour.', 'enemy')
    }

    // Le Maréchal Osseux — réduit les critiques de 60%, rage croissante
    if (enemy.name === 'Le Maréchal Osseux') {
      const hpPct = 1 - (newCs.enemyHp / enemy.maxHp)
      const rageBonus = Math.floor(hpPct / 0.25) * 15
      if (rageBonus > 0) {
        newCs.subBossDefenseStacks = rageBonus
        addLog(`💀 Le Maréchal Osseux rugit — rage +${rageBonus}% dégâts !`, 'enemy')
      }
    }

    // Le Roi de Nuit — ténèbres, 25% chance de rater complètement
    if (enemy.name === 'Le Roi de Nuit' && roll(25)) {
      newCs.enemyHp = Math.min(enemy.maxHp, newCs.enemyHp + dmgDealt)
      newCs.lastPlayerDmg = 0
      addLog('🌑 Les ténèbres t\'aveuglent — ton attaque ne touche rien !', 'enemy')
    }

    // Le Maître des Ombres — ombre absorbe 30% des dégâts, se brise après 3 coups
    if (enemy.name === 'Le Maître des Ombres' && (cs.subBossShadowHits ?? 0) < 3) {
      const absorbed = Math.floor(dmgDealt * 0.3)
      newCs.enemyHp = Math.min(enemy.maxHp, newCs.enemyHp + absorbed)
      newCs.lastPlayerDmg = dmgDealt - absorbed
      newCs.subBossShadowHits = (cs.subBossShadowHits ?? 0) + 1
      if (newCs.subBossShadowHits >= 3) {
        addLog(`👥 L'ombre du Maître absorbe ${absorbed} dégâts — puis se BRISE ! Plus de protection.`, 'player')
      } else {
        addLog(`👥 L'ombre absorbe ${absorbed} dégâts. (${newCs.subBossShadowHits}/3 coups avant rupture)`, 'enemy')
      }
    }

    // L'Archiviste sans Visage — copie les dégâts du joueur
    if (enemy.name === "L'Archiviste sans Visage") {
      const copyDmg = Math.floor(dmgDealt * 0.6)
      playerHp = Math.max(0, playerHp - copyDmg)
      addLog(`📋 L'Archiviste copie ton attaque — ${copyDmg} dégâts en miroir ! PV : ${playerHp}/${gs.playerMaxHp}`, 'warning')
    }
  }

  // Oracle de la Singularité — inverse les soins (si le joueur s'est soigné ce tour)
  if (isSubBoss && enemy.name === 'Oracle de la Singularité') {
    const healedThisTurn = playerHp - gs.playerHp
    if (healedThisTurn > 0) {
      newCs.enemyHp = Math.min(enemy.maxHp, newCs.enemyHp + healedThisTurn)
      addLog(`🔄 L'Oracle absorbe ton soin — +${healedThisTurn} PV pour l'ennemi ! (${newCs.enemyHp}/${enemy.maxHp})`, 'warning')
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
  if (newCs.enemySilencedTurns > 0) newCs.enemySilencedTurns--
  newCs.currentIntent = newCs.enemyCharging ? 'heavy' : generateIntent(enemy, newCs)

  if (newCs.enemyStunTurns > 0) {
    newCs.enemyStunTurns--
    newCs.enemyCharging = false   // une frappe en préparation est annulée par l'étourdissement
    addLog(`${enemy.name} est étourdi — perd son tour.`, 'info')
  } else if (newCs.enemyConfusedTurns > 0) {
    newCs.enemyConfusedTurns--
    const confuseDmg = Math.floor(rng(enemy.damageMin, enemy.damageMax) * 0.55)
    newCs.enemyHp = Math.max(0, newCs.enemyHp - confuseDmg)
    addLog(`😵 ${enemy.name} est confus et se frappe lui-même ! ${confuseDmg} dégâts auto-infligés. (${newCs.enemyConfusedTurns}t)`, 'info')
    if (newCs.enemyHp <= 0) {
      const vC = resolveVictory(gs, enemy)
      return { newGs: { ...newGs, playerHp, stamina, credits: credits + vC.loot, reputation: reputation + 10, equippedWeapon, cargo, ...vC.extra }, newCs, outcome: 'victory', reward: vC.rewardInfo }
    }
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
      // ── ATTAQUES SPÉCIALES — TOUS BOSS ──────────────────────────────────────
      case 'blood_rage': {
        const rawDmg = rng(enemy.damageMin, enemy.damageMax)
        if (wasBlinded) enemyDmg = Math.floor(rawDmg * 0.6)
        else enemyDmg = rawDmg
        const heal = Math.floor(enemyDmg * 0.35)
        newCs.enemyHp = Math.min(enemy.maxHp, newCs.enemyHp + heal)
        addLog(`SOIF DE SANG — ${enemy.name} se régénère en frappant ! (+${heal} PV)`, 'crit')
        break
      }
      case 'execution': {
        let execDmg = Math.floor(rng(enemy.damageMin, enemy.damageMax) * 1.4)
        if (wasBlinded) execDmg = Math.floor(execDmg * 0.6)
        execDmg = Math.floor(execDmg * (gs.class.combatDefenseMult ?? 1.0))
        addLog(`${enemy.name} vise les failles de ton armure — armure ignorée !`, 'warning')
        playerHp = Math.max(0, playerHp - execDmg)
        addLog(`${execDmg} dégâts (armure ignorée). PV : ${playerHp}/${gs.playerMaxHp}`, 'enemy')
        skipped = true
        break
      }
      case 'weaken': {
        enemyDmg = rng(enemy.damageMin, enemy.damageMax)
        if (wasBlinded) enemyDmg = Math.floor(enemyDmg * 0.6)
        newCs.playerWeakenedTurns = 2
        addLog(`${enemy.name} frappe dans tes articulations — tu es AFFAIBLI 2 tours (-35% dégâts).`, 'warning')
        break
      }

      // ── ATTAQUES UNIQUES — PERSONNAGES PILIERS ────────────────────────────
      case 'imperial_barrage': {
        // Cesarion — 3 coups rapides (chacun 70% des dégâts normaux)
        addLog('⚡ SALVE IMPÉRIALE ! Cesarion attaque en rafale — 3 coups !', 'crit')
        let totalBarrage = 0
        for (let i = 0; i < 3; i++) {
          const hit = Math.floor(rng(enemy.damageMin, enemy.damageMax) * 0.70)
          const armor = gs.equippedArmor
          const red = armor ? Math.floor(hit * armor.defense / 100) : 0
          const net = Math.max(1, hit - red)
          totalBarrage += net
          addLog(`  Coup ${i + 1} : ${net} dégâts.`, 'enemy')
        }
        playerHp = Math.max(0, playerHp - totalBarrage)
        newCs.playerWeakenedTurns = 1
        addLog(`Total : ${totalBarrage} dégâts. Tu es déstabilisé. PV : ${playerHp}/${gs.playerMaxHp}`, 'enemy')
        skipped = true // dégâts déjà appliqués manuellement
        break
      }
      case 'phantom_strike': {
        // Raphazarus — frappe depuis l'angle mort, ignore armure, dodge ne fonctionne pas
        enemyDmg = Math.floor(rng(enemy.damageMin, enemy.damageMax) * 1.6)
        if (wasBlinded) enemyDmg = Math.floor(enemyDmg * 0.6)
        addLog('👁 FRAPPE FANTÔME — Raphazarus surgit de l\'angle mort. Armure et esquive ignorées !', 'crit')
        // Appliqué directement sans armure ni dodge
        playerHp = Math.max(0, playerHp - enemyDmg)
        addLog(`${enemyDmg} dégâts (armure ignorée). PV : ${playerHp}/${gs.playerMaxHp}`, 'enemy')
        skipped = true
        break
      }
      case 'party_over': {
        // Eliotis — transformation instantanée : stun joueur + frappe lourde
        enemyDmg = Math.floor(rng(enemy.damageMin, enemy.damageMax) * 1.5)
        if (wasBlinded) enemyDmg = Math.floor(enemyDmg * 0.6)
        newCs.playerStunnedTurns = 1
        addLog('🎉 LA FÊTE EST TERMINÉE. Eliotis révèle sa vraie nature — tu es ÉTOURDI le prochain tour !', 'crit')
        break
      }
      case 'flora_toxin': {
        // Le Roi Maxance — poison de Paradoxa Eterna, très long et douloureux
        const toxBase = rng(enemy.damageMin, enemy.damageMax)
        enemyDmg = wasBlinded ? Math.floor(toxBase * 0.6) : toxBase
        newCs.playerBurnDmg = rng(18, 35)
        newCs.playerBurnTurns = 5
        addLog(`🌿 TOXINE DE PARADOXA — Le Roi Maxance empoisonne l'atmosphère ! ${newCs.playerBurnDmg} dégâts/tour pendant 5 tours !`, 'crit')
        break
      }
      case 'all_in': {
        // Samy Scotty — casino : 50/50 entre 0 dégâts et x3
        const allInRoll = Math.random()
        if (allInRoll < 0.50) {
          addLog('🎰 SAMY SCOTTY MISE TOUT ! ALL IN !!', 'crit')
          enemyDmg = Math.floor(rng(enemy.damageMin, enemy.damageMax) * 3.0)
          if (wasBlinded) enemyDmg = Math.floor(enemyDmg * 0.6)
          addLog(`JACKPOT ! Samy frappe pour tout ce qu'il a.`, 'crit')
        } else {
          addLog('🎰 Samy Scotty mise tout... Le bluff ne passe pas. Il perd ce tour.', 'info')
          skipped = true
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
      const stance = newCs.playerStance as import('../types').CombatStance
      switch (stance) {
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

    if (!skipped && enemyDmg > 0 && newCs.playerExposedTurns > 0) {
      const stance = newCs.playerStance as import('../types').CombatStance
      const exposedMult = stance === 'defensive' ? 1.10 : stance === 'dodge' ? 1.20 : 1.50
      enemyDmg = Math.floor(enemyDmg * exposedMult)
      newCs.playerExposedTurns = 0
      if (exposedMult < 1.5) {
        addLog(`Ta posture atténue l'exposition — ${Math.round(exposedMult * 100)}% dégâts reçus.`, 'warning')
      } else {
        addLog(`Tu étais exposé — ${enemy.name} frappe ×1.5 !`, 'enemy')
      }
    }

    if (!skipped && enemyDmg > 0 && newCs.enemyWeakenedTurns > 0) {
      enemyDmg = Math.floor(enemyDmg * 0.60)
      newCs.enemyWeakenedTurns--
      addLog(`🔮 Malédiction active — dégâts de ${enemy.name} réduits de 40% ! (${newCs.enemyWeakenedTurns} tour${newCs.enemyWeakenedTurns !== 1 ? 's' : ''} restant${newCs.enemyWeakenedTurns !== 1 ? 's' : ''})`, 'info')
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

  // ── POISON JOUEUR (flora_toxin — Le Roi Maxance) ─────────────────────────
  if (newCs.playerBurnTurns > 0) {
    playerHp = Math.max(0, playerHp - newCs.playerBurnDmg)
    newCs.playerBurnTurns--
    addLog(`☠ Toxine de Paradoxa — ${newCs.playerBurnDmg} dégâts. (${newCs.playerBurnTurns} tour${newCs.playerBurnTurns !== 1 ? 's' : ''} restant${newCs.playerBurnTurns !== 1 ? 's' : ''}). PV : ${playerHp}/${gs.playerMaxHp}`, 'warning')
    if (playerHp <= 0) {
      addLog(`Le poison t'a emporté. Tu tombes.`, 'enemy')
      const rp = Math.random() * 100
      let outcomeP: CombatOutcome = 'stunned'
      if (rp < enemy.killChance) outcomeP = 'dead'
      else if (rp < enemy.killChance + enemy.captureChance) outcomeP = 'captured'
      const survivedHpP = outcomeP === 'captured' ? Math.floor(gs.playerMaxHp / 2) : 0
      return { newGs: { ...newGs, playerHp: survivedHpP, stamina, credits, reputation, equippedWeapon, cargo }, newCs, outcome: outcomeP }
    }
  }

  // ── SUB-BOSS PASSIVE EFFECTS (each enemy turn) ──────────────────────────
  if (isSubBoss) {
    // Le Ravitailleur de l'Ombre — auto-soin 15% tous les 4 tours
    if (enemy.name === "Le Ravitailleur de l'Ombre" && sbTurn % 4 === 0) {
      const healAmt = Math.floor(enemy.maxHp * 0.15)
      newCs.enemyHp = Math.min(enemy.maxHp, newCs.enemyHp + healAmt)
      addLog(`🔧 Le Ravitailleur déploie un drone de réparation — +${healAmt} PV ! (${newCs.enemyHp}/${enemy.maxHp})`, 'enemy')
    }

    // La Faucon — crit garanti tous les 5 tours + dégâts croissants
    if (enemy.name === 'La Faucon' && sbTurn % 5 === 0) {
      const bonusDmg = Math.floor(rng(enemy.damageMin, enemy.damageMax) * 1.0)
      playerHp = Math.max(0, playerHp - bonusDmg)
      addLog(`🦅 La Faucon entre en RAGE — coup critique garanti ! ${bonusDmg} dégâts supplémentaires ! PV : ${playerHp}/${gs.playerMaxHp}`, 'crit')
    }

    // La Marchande de Mort — vol de crédits chaque tour
    if (enemy.name === 'La Marchande de Mort') {
      const stolen = rng(200, 500)
      credits = Math.max(0, credits - stolen)
      addLog(`💀 La Marchande te dépouille — ${stolen} crédits volés ! Crédits : ${credits}`, 'warning')
    }

    // Le Sergent Cendré — double attaque chaque tour, pause tous les 4 tours
    if (enemy.name === 'Le Sergent Cendré' && sbTurn % 4 !== 0) {
      const bonusDmg = rng(enemy.damageMin, Math.floor(enemy.damageMax * 0.7))
      playerHp = Math.max(0, playerHp - bonusDmg)
      addLog(`🔥 Cadence de tir ! Le Sergent Cendré frappe une deuxième fois — ${bonusDmg} dégâts ! PV : ${playerHp}/${gs.playerMaxHp}`, 'warning')
    }
    if (enemy.name === 'Le Sergent Cendré' && sbTurn % 4 === 0) {
      addLog('⏸ Le Sergent recharge — il ne peut pas attaquer ce tour.', 'info')
    }

    // Le Maréchal Osseux — sa rage augmente ses dégâts d'ennemi
    if (enemy.name === 'Le Maréchal Osseux' && (newCs.subBossDefenseStacks ?? 0) > 0) {
      const bonusDmg = Math.floor(enemyDmg * (newCs.subBossDefenseStacks ?? 0) / 100)
      playerHp = Math.max(0, playerHp - bonusDmg)
      if (bonusDmg > 0) addLog(`💀 Rage du Maréchal — +${bonusDmg} dégâts supplémentaires ! PV : ${playerHp}/${gs.playerMaxHp}`, 'warning')
    }

    // Directeur Pale — drain de stamina passif
    if (enemy.name === 'Directeur Pale') {
      stamina = Math.max(0, stamina - 15)
      addLog(`💀 Le Directeur Pale draine ton énergie — -15 stamina. (${stamina}/${gs.maxStamina})`, 'warning')
    }
  }

  // Regen armor
  if (gs.equippedArmor?.effect === 'regen') {
    const r = gs.equippedArmor.effectValue
    playerHp = Math.min(gs.playerMaxHp, playerHp + r)
    if (r > 0) addLog(`Régénération : +${r} PV.`, 'info')
  }

  // Exposition résiduele (si l'ennemi était stun) — expirée proprement en fin de tour
  if (newCs.playerExposedTurns > 0) newCs.playerExposedTurns = 0

  // Stamina regen
  const staminaRegen = 20 + (gs.equippedArmor?.effect === 'staminaBoost' ? gs.equippedArmor.effectValue : 0)
    + ((newCs.playerStance as import('../types').CombatStance) === 'defensive' ? 10 : 0)
    + (gs.class.combatStaminaRegen ?? 0)
  stamina = Math.min(gs.maxStamina, stamina + staminaRegen)

  // Victory check after enemy turn (thorns, sub-boss reflect, etc. may have killed the enemy)
  if (newCs.enemyHp <= 0) {
    const v = resolveVictory(gs, enemy)
    return {
      newGs: { ...newGs, playerHp: Math.max(1, playerHp), stamina, credits: credits + v.loot, reputation: reputation + 10, equippedWeapon, cargo, ...v.extra },
      newCs, outcome: 'victory', reward: v.rewardInfo,
    }
  }

  if (playerHp <= 0) {
    addLog(`Tu tombes. ${enemy.name} se penche sur toi...`, 'enemy')
    const r = Math.random() * 100
    let outcome: CombatOutcome = 'stunned'
    if (r < enemy.killChance) outcome = 'dead'
    else if (r < enemy.killChance + enemy.captureChance) outcome = 'captured'
    const survivedHpFinal = outcome === 'captured' ? Math.floor(gs.playerMaxHp / 2) : 0
    return { newGs: { ...newGs, playerHp: survivedHpFinal, stamina, credits, reputation, equippedWeapon, cargo }, newCs, outcome }
  }

  return { newGs: { ...newGs, playerHp, stamina, credits, reputation, equippedWeapon, cargo }, newCs }
}

function applyWeaponEffect(effect: string, cs: CombatState, addLog: (t: string, type: CombatLogEntry['type']) => void) {
  switch (effect) {
    case 'stun':          cs.enemyStunTurns = 1; addLog('Étourdi ! L\'ennemi perd son tour.', 'info'); break
    case 'paralyze':      cs.enemyStunTurns = 2; addLog('Paralysé ! L\'ennemi perd 2 tours.', 'info'); break
    case 'burn':          cs.enemyBurnDmg = rng(8, 20);  cs.enemyBurnTurns = 3; addLog(`Brûlure ! ${cs.enemyBurnDmg} dégâts/tour ×3.`, 'warning'); break
    case 'poison':        cs.enemyBurnDmg = rng(5, 15);  cs.enemyBurnTurns = 4; addLog(`Empoisonné ! ${cs.enemyBurnDmg} dégâts/tour ×4.`, 'info'); break
    case 'blind':         cs.enemyBlinded = true; addLog('Aveuglé ! -40% précision ennemi.', 'info'); break
    case 'flee':          cs.enemyHp = 0; addLog('L\'ennemi panique et fuit !', 'victory'); break
    case 'distraction':   cs.enemyStunTurns = 1; addLog('Distrait ! L\'ennemi perd son tour.', 'info'); break
    case 'shock':         cs.enemyStunTurns = 1; cs.enemyBurnDmg = rng(10, 18); cs.enemyBurnTurns = 3; addLog('⚡ CHOC — Étourdi + brûlure 10-18/tour ×3 !', 'warning'); break
    case 'curse':         cs.enemyWeakenedTurns = 3; addLog('🔮 MALÉDICTION — Dégâts ennemis -40% pendant 3 tours !', 'info'); break
    case 'confusion':     cs.enemyConfusedTurns = 2; addLog('😵 CONFUSION — L\'ennemi se prend lui-même pour cible pendant 2 tours !', 'info'); break
    case 'silence':       cs.enemySilencedTurns = 2; addLog('🔇 SILENCE — L\'ennemi est limité aux attaques basiques pendant 2 tours !', 'info'); break
    case 'disarm':        cs.enemyWeakenedTurns = Math.max(cs.enemyWeakenedTurns, 2); addLog('🗡 DÉSARMÉ — L\'ennemi a perdu son arme ! -40% dégâts pendant 2 tours.', 'info'); break
    case 'random':        applyWeaponEffect(['stun','burn','blind','poison','flee','shock','curse','confusion'][rng(0,7)], cs, addLog); break
  }
}

// Déduit le tier d'un ennemi à partir de ses stats
function inferEnemyTier(enemy: Enemy): 1 | 2 | 3 | 4 {
  if (enemy.isBoss) return 4
  if (enemy.maxHp >= 100) return 3
  if (enemy.maxHp >= 45)  return 2
  return 1
}

function resolveVictory(gs: GameState, enemy: Enemy): { loot: number; extra: Partial<GameState>; rewardInfo: { loot: number; weaponName?: string; armorName?: string; isBossKill: boolean } } {
  const fauconsRep = gs.factionReputation?.faucons ?? 0
  const lootMult = fauconsRep >= 80 ? 1.30 : fauconsRep >= 50 ? 1.20 : fauconsRep >= 20 ? 1.10 : 1.0
  // Économie dure : butin de combat réduit (cf. ECONOMY dans quests.ts).
  const loot = Math.floor(rng(enemy.lootMin, enemy.lootMax) * lootMult * 0.65)
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
    // Tier de drop lié au niveau de l'ennemi
    const enemyTier = inferEnemyTier(enemy)
    // chance de drop et fourchette de tier selon l'ennemi
    const dropChance = enemyTier === 1 ? 22 : enemyTier === 2 ? 32 : enemyTier === 3 ? 42 : 55
    const minTier    = enemyTier === 1 ? 1  : enemyTier === 2 ? 1  : enemyTier === 3 ? 2  : 3
    const maxTier    = enemyTier === 1 ? 1  : enemyTier === 2 ? 2  : enemyTier === 3 ? 3  : 4

    if (rng(0, 99) < dropChance) {
      if (Math.random() < 0.6) {
        const w = rollWeaponForTier(rng(minTier, maxTier))
        extra.weapons = [...gs.weapons, w]
        weaponName = w.name
      } else {
        const a = rollArmorForTier(rng(minTier, maxTier))
        extra.armors = [...gs.armors, a]
        armorName = a.name
      }
    }
  }
  return { loot, extra, rewardInfo: { loot, weaponName, armorName, isBossKill } }
}

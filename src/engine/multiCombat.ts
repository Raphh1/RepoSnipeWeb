import type { Enemy, GameState, CombatLogEntry, CombatOutcome } from '../types'
import { rollWeaponForTier } from '../data/weapons'
import { rollArmorForTier, grantArmor } from '../data/armors'
import { getTierLow, getTierMid, getTierHigh } from '../data/enemies'
import i18n from '../i18n/config'
import { translateEnemyName } from './goodsI18n'

const mt = (key: string, params?: Record<string, unknown>) => i18n.t(key, { ns: 'multiCombat', ...params })

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const roll = (chance: number) => Math.random() * 100 < chance

let logId = 0
function log(text: string, type: CombatLogEntry['type']): CombatLogEntry {
  return { id: logId++, text, type }
}

export interface SquadMember {
  base: Enemy
  hp: number
  stunTurns: number
  defeated: boolean
}

export interface MultiCombatState {
  squad: SquadMember[]
  momentum: number
  fled: boolean
  classUsed: boolean
  log: CombatLogEntry[]
  turn: number
}

export type MultiCombatAction =
  | { type: 'attack'; targetIndex: number }
  | { type: 'finisher' }
  | { type: 'heal' }
  | { type: 'class' }
  | { type: 'flee' }

export interface MultiCombatResult {
  newGs: Partial<GameState>
  newMcs: MultiCombatState
  outcome?: CombatOutcome
}

export function initMultiCombat(enemies: Enemy[]): MultiCombatState {
  return {
    squad: enemies.map(e => ({
      base: e,
      hp: e.role === 'tank' ? Math.floor(e.maxHp * 1.4)
        : e.role === 'ranged' ? Math.floor(e.maxHp * 0.8)
        : e.role === 'support' ? Math.floor(e.maxHp * 0.7)
        : e.maxHp,
      stunTurns: 0,
      defeated: false,
    })),
    momentum: 0,
    fled: false,
    classUsed: false,
    log: [],
    turn: 1,
  }
}

export function processMultiAction(
  gs: GameState,
  mcs: MultiCombatState,
  action: MultiCombatAction
): MultiCombatResult {
  const newMcs: MultiCombatState = {
    ...mcs,
    squad: mcs.squad.map(m => ({ ...m })),
    log: [],
    turn: mcs.turn + 1,
  }
  let playerHp = gs.playerHp
  let stamina  = gs.stamina
  let credits  = gs.credits
  let fuel     = gs.fuel
  let cargo    = { ...gs.cargo }
  const weapon = gs.equippedWeapon

  function addLog(text: string, type: CombatLogEntry['type'] = 'info') {
    newMcs.log.push(log(text, type))
  }

  function calcDmg(): number {
    if (!weapon) {
      let d = rng(5, 18)
      if (gs.class.name === 'Seigneur de guerre') d += rng(8, 20)
      if (Math.random() < 0.10) { d = Math.floor(d * 2); addLog(mt('crit'), 'crit') }
      return Math.max(1, d)
    }
    let d = rng(weapon.damageMin, weapon.damageMax)
    const aff = weapon.affinities[gs.class.name] ?? 1
    d = Math.floor(d * aff)
    if (weapon.effect === 'armorPierce') d = Math.floor(d * 1.3)
    if (Math.random() * 100 < weapon.critChance) { d = Math.floor(d * 2); addLog(mt('crit'), 'crit') }
    return Math.max(1, d)
  }

  const alive = newMcs.squad.filter(m => !m.defeated)

  // ── PLAYER ACTION ──────────────────────────────────────────────────────────
  switch (action.type) {
    case 'attack': {
      const target = newMcs.squad[action.targetIndex]
      if (!target || target.defeated) break
      let dmg = calcDmg()
      stamina = Math.max(0, stamina - 20)

      // Tank redirige 30% si vivant et différent de la cible
      const tank = alive.find(m => m.base.role === 'tank' && m !== target)
      if (tank) {
        const absorbed = Math.floor(dmg * 0.3)
        dmg -= absorbed
        tank.hp = Math.max(0, tank.hp - absorbed)
        if (tank.hp <= 0) { tank.defeated = true; addLog(mt('tankProtectDefeated', { name: translateEnemyName(tank.base.name) }), 'victory') }
        else addLog(mt('tankAbsorb', { name: translateEnemyName(tank.base.name), amount: absorbed }), 'info')
      }

      target.hp = Math.max(0, target.hp - dmg)
      newMcs.momentum = Math.min(3, newMcs.momentum + 1)
      if (target.hp <= 0) { target.defeated = true; addLog(mt('targetDefeated', { name: translateEnemyName(target.base.name) }), 'victory') }
      else addLog(mt('hitTarget', { dmg, name: translateEnemyName(target.base.name), hp: target.hp, max: target.base.maxHp }), 'player')
      if (newMcs.momentum >= 3) addLog(mt('momentumMax'), 'crit')
      break
    }
    case 'finisher': {
      if (newMcs.momentum < 3) break
      const weakest = alive.sort((a, b) => a.hp - b.hp)[0]
      if (!weakest) break
      const dmg = calcDmg() * 3
      weakest.hp = Math.max(0, weakest.hp - dmg)
      if (weakest.hp <= 0) { weakest.defeated = true; addLog(mt('finisherDefeated', { name: translateEnemyName(weakest.base.name) }), 'victory') }
      else addLog(mt('finisherHit', { dmg, name: translateEnemyName(weakest.base.name) }), 'crit')
      newMcs.momentum = 0
      break
    }
    case 'heal': {
      if ((cargo['Médicaments'] ?? 0) <= 0) break
      cargo['Médicaments']--
      if (cargo['Médicaments'] === 0) delete cargo['Médicaments']
      playerHp = Math.min(gs.playerMaxHp, playerHp + 30)
      addLog(mt('healed', { hp: playerHp, max: gs.playerMaxHp }), 'player')
      break
    }
    case 'class': {
      newMcs.classUsed = true
      switch (gs.class.name) {
        case 'Médecin': {
          stamina = Math.max(0, stamina - 20)
          playerHp = Math.min(gs.playerMaxHp, playerHp + 30)
          addLog(mt('medicClassHeal', { hp: playerHp, max: gs.playerMaxHp }), 'player'); break
        }
        case 'Contrebandier': {
          fuel = Math.max(0, fuel - 1)
          newMcs.fled = true
          addLog(mt('smugglerClassFlee'), 'info'); break
        }
        case 'Seigneur de guerre': {
          const stunTarget = alive[0]
          if (stunTarget) {
            stunTarget.stunTurns = 1
            addLog(mt('warlordStun', { name: translateEnemyName(stunTarget.base.name) }), 'player')
          }; break
        }
        case 'Hackeur': {
          stamina = Math.max(0, stamina - 30)
          alive.forEach(m => { if (m.base.role !== 'tank') m.stunTurns = 1 })
          addLog(mt('hackerMassHack'), 'player'); break
        }
        case 'Vagabond': {
          const target = alive.sort((a, b) => a.hp - b.hp)[0]
          if (target) {
            const dmg = rng(15, 35) + rng(5, 15)
            target.hp = Math.max(0, target.hp - dmg)
            if (target.hp <= 0) { target.defeated = true; addLog(mt('vagabondCheapShotDefeated', { name: translateEnemyName(target.base.name) }), 'victory') }
            else addLog(mt('vagabondCheapShot', { dmg }), 'player')
          }; break
        }
      }; break
    }
    case 'flee': {
      const chance = 35 + (gs.class.name === 'Contrebandier' ? 25 : 0)
      if (roll(chance)) {
        fuel = Math.max(0, fuel - 1)
        newMcs.fled = true
        addLog(mt('fleeOpening'), 'info')
      } else {
        addLog(mt('fleeBlocked'), 'enemy')
      }; break
    }
  }

  // Vérifier victoire
  if (newMcs.squad.every(m => m.defeated)) {
    const { loot, extra } = resolveMultiVictory(gs, newMcs.squad)
    return {
      newGs: { ...extra, playerHp, stamina, credits: credits + loot, fuel, cargo, reputation: gs.reputation + 15 },
      newMcs,
      outcome: 'victory',
    }
  }
  if (newMcs.fled) {
    return { newGs: { playerHp, stamina, credits, fuel, cargo }, newMcs, outcome: 'fled' }
  }

  // ── TOUR ENNEMIS ───────────────────────────────────────────────────────────
  const stillAlive = newMcs.squad.filter(m => !m.defeated)
  for (const m of stillAlive) {
    if (playerHp <= 0) break

    if (m.stunTurns > 0) {
      m.stunTurns--
      addLog(mt('enemyStunnedSkip', { name: translateEnemyName(m.base.name) }), 'info')
      continue
    }

    let dmg = 0
    switch (m.base.role) {
      case 'support': {
        const weakest = stillAlive.filter(s => s !== m && !s.defeated).sort((a, b) => a.hp - b.hp)[0]
        if (weakest) {
          const heal = rng(15, 30)
          weakest.hp = Math.min(weakest.base.maxHp, weakest.hp + heal)
          addLog(mt('supportHeal', { name: translateEnemyName(m.base.name), target: translateEnemyName(weakest.base.name), amount: heal }), 'info')
        }
        dmg = rng(Math.floor(m.base.damageMin / 3), Math.max(1, Math.floor(m.base.damageMax / 3)))
        break
      }
      case 'tank':
        dmg = Math.floor(rng(m.base.damageMin, m.base.damageMax) * 1.2)
        if (roll(20)) { newMcs.momentum = 0; addLog(mt('tankDestabilize', { name: translateEnemyName(m.base.name) }), 'warning') }
        break
      case 'ranged':
        dmg = rng(m.base.damageMin, m.base.damageMax)
        if (roll(15)) { dmg = Math.floor(dmg * 1.5); addLog(mt('rangedPerfectAim', { name: translateEnemyName(m.base.name) }), 'warning') }
        break
      default:
        dmg = rng(m.base.damageMin, m.base.damageMax)
        if (roll(10)) { dmg = Math.floor(dmg * 1.8); addLog(mt('enemyCrit'), 'crit') }
    }

    // Armure joueur
    if (gs.equippedArmor && dmg > 0) {
      const red = Math.floor(dmg * gs.equippedArmor.defense / 100)
      dmg -= red
      if (red > 0) addLog(mt('armorAbsorb', { amount: red }), 'info')

      if (gs.equippedArmor.effect === 'thorns' && dmg > 0) {
        const thorns = Math.floor(dmg * gs.equippedArmor.effectValue / 100)
        m.hp = Math.max(0, m.hp - thorns)
        if (m.hp <= 0) { m.defeated = true; addLog(mt('thornsDefeated', { name: translateEnemyName(m.base.name) }), 'victory') }
      }
    }

    if (dmg > 0) {
      playerHp = Math.max(0, playerHp - dmg)
      addLog(mt('enemyAttack', { name: translateEnemyName(m.base.name), dmg, hp: playerHp, max: gs.playerMaxHp }), 'enemy')
    }
  }

  // Regen armure
  if (gs.equippedArmor?.effect === 'regen') {
    playerHp = Math.min(gs.playerMaxHp, playerHp + gs.equippedArmor.effectValue)
  }
  stamina = Math.min(gs.maxStamina, stamina + 15)

  if (playerHp <= 0) {
    addLog(mt('overwhelmed'), 'enemy')
    const dominant = stillAlive.sort((a, b) => b.base.killChance - a.base.killChance)[0]
    const r = Math.random() * 100
    let outcome: CombatOutcome = 'stunned'
    if (r < (dominant?.base.killChance ?? 15)) outcome = 'dead'
    else if (r < (dominant?.base.killChance ?? 15) + (dominant?.base.captureChance ?? 20)) outcome = 'captured'
    return { newGs: { playerHp: 0, stamina, credits, fuel, cargo }, newMcs, outcome }
  }

  return { newGs: { playerHp, stamina, credits, fuel, cargo }, newMcs }
}

function resolveMultiVictory(gs: GameState, squad: SquadMember[]) {
  let loot = squad.reduce((sum, m) => sum + rng(m.base.lootMin, m.base.lootMax), 0)
  const extra: Partial<GameState> = { combatsWon: (gs.combatsWon ?? 0) + 1 }
  if (Math.random() < 0.25) {
    const w = rollWeaponForTier(Math.min(3, Math.floor(Math.random() * 3) + 1))
    extra.weapons = [...gs.weapons, w]
  } else if (Math.random() < 0.15) {
    const a = rollArmorForTier(Math.min(3, Math.floor(Math.random() * 3) + 1))
    const armorPatch = grantArmor(gs, a)
    if (armorPatch.armors) extra.armors = armorPatch.armors
    else loot += a.sellValue
  }
  return { loot, extra }
}

// Préparer des groupes d'ennemis typiques
export function buildSquad(danger: number, day: number): Enemy[] {
  const pool = danger >= 3 ? getTierHigh() : danger >= 2 ? getTierMid() : getTierLow()
  const size = danger >= 2 ? rng(2, 4) : rng(2, 3)
  const squad: Enemy[] = []
  for (let i = 0; i < size; i++) {
    const base = pool[Math.floor(Math.random() * pool.length)]
    const roles: Enemy['role'][] = i === 0 ? ['normal', 'tank'] : ['normal', 'ranged', 'support']
    squad.push({ ...base, role: roles[Math.floor(Math.random() * roles.length)] })
  }
  return squad
}

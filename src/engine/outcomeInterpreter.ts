import type { GameState } from '../types'
import { rollWeaponForTier } from '../data/weapons'

const rng  = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

const COMMON_ITEMS = ['Médicaments','Vivres','Munitions','Composants électroniques','Métaux bruts','Pièces techniques','Eau purifiée']
const RARE_ITEMS   = ['Implants','Données classifiées','Cristaux énergétiques','Artefacts','Logiciels','Informations monnayables']
const FOOD_ITEMS   = ['Nourriture fraîche','Nourriture synthétique','Rations militaires','Vivres','Plantes médicinales']

export interface OutcomeResult {
  gs: Partial<GameState>
  message: string
  type?: 'combat'
}

export function interpretOutcome(raw: string, gs: GameState): OutcomeResult {
  const codes = raw.split('+').map(s => s.trim())
  let patch: Partial<GameState> = {}
  const msgs: string[] = []
  let isCombat = false

  for (const code of codes) {
    switch (code) {
      case 'credits_tiny':        { const v = rng(50,150);   patch = { ...patch, credits: (patch.credits ?? gs.credits) + v };                           msgs.push(`+${v} cr`); break }
      case 'credits_small':       { const v = rng(100,350);  patch = { ...patch, credits: (patch.credits ?? gs.credits) + v };                           msgs.push(`+${v} cr`); break }
      case 'credits_medium':      { const v = rng(250,700);  patch = { ...patch, credits: (patch.credits ?? gs.credits) + v };                           msgs.push(`+${v} cr`); break }
      case 'credits_large':       { const v = rng(600,1600); patch = { ...patch, credits: (patch.credits ?? gs.credits) + v };                           msgs.push(`+${v} cr`); break }
      case 'credits_huge':        { const v = rng(1200,3000);patch = { ...patch, credits: (patch.credits ?? gs.credits) + v };                           msgs.push(`+${v} cr`); break }
      case 'lose_credits_tiny':   { const v = rng(40,100);   patch = { ...patch, credits: Math.max(0,(patch.credits ?? gs.credits) - v) };               msgs.push(`-${v} cr`); break }
      case 'lose_credits_small':  { const v = rng(80,250);   patch = { ...patch, credits: Math.max(0,(patch.credits ?? gs.credits) - v) };               msgs.push(`-${v} cr`); break }
      case 'lose_credits_medium': { const v = rng(200,550);  patch = { ...patch, credits: Math.max(0,(patch.credits ?? gs.credits) - v) };               msgs.push(`-${v} cr`); break }
      case 'rep_tiny':            { const v = rng(3,6);      patch = { ...patch, reputation: (patch.reputation ?? gs.reputation) + v };                  msgs.push(`+${v} rép`); break }
      case 'rep_small':           { const v = rng(6,12);     patch = { ...patch, reputation: (patch.reputation ?? gs.reputation) + v };                  msgs.push(`+${v} rép`); break }
      case 'rep_medium':          { const v = rng(12,22);    patch = { ...patch, reputation: (patch.reputation ?? gs.reputation) + v };                  msgs.push(`+${v} rép`); break }
      case 'rep_large':           { const v = rng(20,40);    patch = { ...patch, reputation: (patch.reputation ?? gs.reputation) + v };                  msgs.push(`+${v} rép`); break }
      case 'rep_minus_tiny':      { const v = rng(3,8);      patch = { ...patch, reputation: (patch.reputation ?? gs.reputation) - v };                  msgs.push(`-${v} rép`); break }
      case 'rep_minus_small':     { const v = rng(8,18);     patch = { ...patch, reputation: (patch.reputation ?? gs.reputation) - v };                  msgs.push(`-${v} rép`); break }
      case 'rep_minus_medium':    { const v = rng(15,30);    patch = { ...patch, reputation: (patch.reputation ?? gs.reputation) - v };                  msgs.push(`-${v} rép`); break }
      case 'hp_tiny':             { const v = rng(5,15);     patch = { ...patch, playerHp: Math.min(gs.playerMaxHp,(patch.playerHp ?? gs.playerHp)+v) }; msgs.push(`+${v} PV`); break }
      case 'hp_small':            { const v = rng(10,25);    patch = { ...patch, playerHp: Math.min(gs.playerMaxHp,(patch.playerHp ?? gs.playerHp)+v) }; msgs.push(`+${v} PV`); break }
      case 'hp_medium':           { const v = rng(20,40);    patch = { ...patch, playerHp: Math.min(gs.playerMaxHp,(patch.playerHp ?? gs.playerHp)+v) }; msgs.push(`+${v} PV`); break }
      case 'lose_hp_tiny':        { const v = rng(8,20);     patch = { ...patch, playerHp: Math.max(1,(patch.playerHp ?? gs.playerHp)-v) };              msgs.push(`-${v} PV`); break }
      case 'stamina_small':       { patch = { ...patch, stamina: Math.min(gs.maxStamina,(patch.stamina ?? gs.stamina)+20) };                              msgs.push(`+20 stamina`); break }
      case 'stamina_full':        { patch = { ...patch, stamina: gs.maxStamina };                                                                         msgs.push(`Stamina restaurée`); break }
      case 'item_common': {
        const item = pick(COMMON_ITEMS)
        const cargo = { ...(patch.cargo ?? gs.cargo), [item]: ((patch.cargo ?? gs.cargo)[item] ?? 0) + 1 }
        patch = { ...patch, cargo }; msgs.push(`+1 ${item}`); break
      }
      case 'item_rare': {
        const item = pick(RARE_ITEMS)
        const cargo = { ...(patch.cargo ?? gs.cargo), [item]: ((patch.cargo ?? gs.cargo)[item] ?? 0) + 1 }
        patch = { ...patch, cargo }; msgs.push(`+1 ${item}`); break
      }
      case 'item_food': {
        const item = pick(FOOD_ITEMS)
        const cargo = { ...(patch.cargo ?? gs.cargo), [item]: ((patch.cargo ?? gs.cargo)[item] ?? 0) + 1 }
        patch = { ...patch, cargo }; msgs.push(`+1 ${item}`); break
      }
      case 'item_weapon_low': {
        const w = rollWeaponForTier(rng(1,2))
        patch = { ...patch, weapons: [...(patch.weapons ?? gs.weapons), w] }
        msgs.push(`Arme récupérée : ${w.name}`); break
      }
      case 'item_weapon_mid': {
        const w = rollWeaponForTier(rng(2,3))
        patch = { ...patch, weapons: [...(patch.weapons ?? gs.weapons), w] }
        msgs.push(`Arme : ${w.name}`); break
      }
      case 'ship_repair_small': {
        const v = rng(10,25)
        patch = { ...patch, shipHp: Math.min(gs.shipMaxHp,(patch.shipHp ?? gs.shipHp)+v) }
        msgs.push(`Vaisseau +${v} PV`); break
      }
      case 'addiction': {
        patch = { ...patch, addictionLevel: (gs.addictionLevel ?? 0) + 1 }
        msgs.push(`Dépendance accrue`); break
      }
      case 'combat_easy':
      case 'combat_medium':
      case 'combat_hard':
        isCombat = true; break
      case 'nothing':
      default: break
    }
  }

  return { gs: patch, message: msgs.join(' · '), type: isCombat ? 'combat' : undefined }
}

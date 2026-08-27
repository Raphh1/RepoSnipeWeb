import type { GameState } from '../types'
import { getNamedNpcs } from '../engine/npcTracker'
import i18n from '../i18n/config'

const rm = (key: string) => i18n.t(key, { ns: 'runModifiers' })

export type ModifierTag = 'buff' | 'debuff' | 'mixed'

export interface RunModifier {
  id: string
  name: string
  desc: string
  color: string
  tag: ModifierTag
  apply: (gs: GameState) => Partial<GameState>
}

function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

export function getRunModifiers(): RunModifier[] {
  return [
  // ── BUFFS ────────────────────────────────────────────────────────────────────
  {
    id: 'fortune_initiale', name: rm('fortuneInitiale.name'), tag: 'buff', color: '#ffd700',
    desc: rm('fortuneInitiale.desc'),
    apply: gs => ({ credits: gs.credits + 800, fuel: Math.min(gs.maxFuel, gs.fuel + 2) }),
  },
  {
    id: 'vaisseau_prepare', name: rm('vaisseauPrepare.name'), tag: 'buff', color: '#40ffff',
    desc: rm('vaisseauPrepare.desc'),
    apply: gs => ({ shipHp: gs.shipMaxHp + 50, shipMaxHp: gs.shipMaxHp + 50 }),
  },
  {
    id: 'contacts_etablis', name: rm('contactsEtablis.name'), tag: 'buff', color: '#40ff80',
    desc: rm('contactsEtablis.desc'),
    apply: gs => {
      const three = [...getNamedNpcs()].sort(() => Math.random() - 0.5).slice(0, 3)
      const knownNpcs = { ...gs.knownNpcs }
      const names = new Set(gs.npcsMet)
      for (const n of three) {
        knownNpcs[n.id] = { id: n.id, name: n.name, station: n.station, firstMetDay: 1, timesMet: 1, repDelta: 35, isAlly: false, isEnemy: false, tags: ['contact'] }
        names.add(n.name)
      }
      return { knownNpcs, npcsMet: Array.from(names) }
    },
  },
  {
    id: 'medecin_de_bord', name: rm('medecinDeBord.name'), tag: 'buff', color: '#40ff80',
    desc: rm('medecinDeBord.desc'),
    apply: gs => ({
      cargo: { ...gs.cargo, 'Médicaments': (gs.cargo['Médicaments'] ?? 0) + 5 },
      playerMaxHp: gs.playerMaxHp + 10,
      playerHp: gs.playerHp + 10,
    }),
  },
  {
    id: 'endurance', name: rm('endurance.name'), tag: 'buff', color: '#40ffff',
    desc: rm('endurance.desc'),
    apply: gs => ({ maxStamina: gs.maxStamina + 2, stamina: gs.stamina + 2 }),
  },

  // ── DEBUFFS ──────────────────────────────────────────────────────────────────
  {
    id: 'dette_initiale', name: rm('detteInitiale.name'), tag: 'debuff', color: '#ff4040',
    desc: rm('detteInitiale.desc'),
    apply: gs => ({ credits: Math.max(200, Math.floor(gs.credits * 0.2)), debtDailyAmount: (gs.debtDailyAmount ?? 0) + 200 }),
  },
  {
    id: 'traque', name: rm('traque.name'), tag: 'debuff', color: '#ff4040',
    desc: rm('traque.desc'),
    apply: gs => ({
      reputation: gs.reputation - 30,
      stalker: { name: 'L\'Agent Gris', station: gs.currentStation, closingIn: false, daysSinceLastSeen: 0, threatLevel: 1 as const, daysActive: 0 },
    }),
  },
  {
    id: 'vide_poches', name: rm('videPoches.name'), tag: 'debuff', color: '#ff4040',
    desc: rm('videPoches.desc'),
    apply: gs => ({ credits: Math.max(0, Math.floor(gs.credits / 2)) }),
  },
  {
    id: 'vaisseau_epave', name: rm('vaisseauEpave.name'), tag: 'debuff', color: '#ff8040',
    desc: rm('vaisseauEpave.desc'),
    apply: gs => ({
      shipHp: 35,
      cargo: { ...gs.cargo, 'Ferraille': (gs.cargo['Ferraille'] ?? 0) + 3, 'Outils': (gs.cargo['Outils'] ?? 0) + 2 },
    }),
  },
  {
    id: 'survivant_endurci', name: rm('survivantEndurci.name'), tag: 'mixed', color: '#ff8040',
    desc: rm('survivantEndurci.desc'),
    apply: gs => ({
      playerMaxHp: Math.floor(gs.playerMaxHp * 0.75),
      playerHp: Math.floor(gs.playerHp * 0.75),
      credits: gs.credits + 1500,
    }),
  },

  // ── MIXTES ───────────────────────────────────────────────────────────────────
  {
    id: 'contrat_de_sang', name: rm('contratDeSang.name'), tag: 'mixed', color: '#ff6060',
    desc: rm('contratDeSang.desc'),
    apply: _ => ({}),
  },
  {
    id: 'economie_de_guerre', name: rm('economieDeGuerre.name'), tag: 'mixed', color: '#ffd700',
    desc: rm('economieDeGuerre.desc'),
    apply: _ => ({}),
  },
  {
    id: 'paria', name: rm('paria.name'), tag: 'mixed', color: '#a040ff',
    desc: rm('paria.desc'),
    apply: _ => ({}),
  },
  {
    id: 'boucher', name: rm('boucher.name'), tag: 'mixed', color: '#ff6040',
    desc: rm('boucher.desc'),
    apply: _ => ({}),
  },
  {
    id: 'karma_negatif', name: rm('karmaNegatif.name'), tag: 'debuff', color: '#a040ff',
    desc: rm('karmaNegatif.desc'),
    apply: _ => ({}),
  },
  ]
}

export function drawRunModifiers(count = 2): RunModifier[] {
  const shuffled = [...getRunModifiers()].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function getRunModifierById(id: string): RunModifier | undefined {
  return getRunModifiers().find(m => m.id === id)
}

// ── Helpers pour les effets en cours ─────────────────────────────────────────

function hasModifier(gs: GameState, id: string): boolean {
  return (gs.runModifiers ?? []).includes(id)
}

export function getRunBuyMult(gs: GameState): number {
  let m = 1
  if (hasModifier(gs, 'economie_de_guerre')) m *= 1.5
  if (hasModifier(gs, 'paria')) m *= 0.80
  return m
}

export function getRunSellMult(gs: GameState): number {
  return 1  // reserved for future modifiers
}

export function getRunLootMult(gs: GameState): number {
  if (hasModifier(gs, 'boucher')) return 1.5
  return 1
}

export function getRunCombatCreditBonus(gs: GameState): number {
  if (hasModifier(gs, 'contrat_de_sang')) return 200
  return 0
}

export function getRunCombatRepDelta(gs: GameState): number {
  let delta = 0
  if (hasModifier(gs, 'contrat_de_sang')) delta -= 5
  if (hasModifier(gs, 'boucher')) delta -= 3
  return delta
}

export function getRunQuestRewardMult(gs: GameState): number {
  if (hasModifier(gs, 'economie_de_guerre')) return 2
  return 1
}

export function getRunTravelFuelExtra(gs: GameState): number {
  if (hasModifier(gs, 'karma_negatif')) return 1
  return 0
}

export function getRunCombatChanceExtra(gs: GameState): number {
  if (hasModifier(gs, 'traque')) return 0.15
  return 0
}

export function canJoinFactionThisRun(gs: GameState): boolean {
  if (hasModifier(gs, 'paria')) return false
  return true
}

export function pickRandomModifier(): RunModifier {
  return pickRandom(getRunModifiers())
}

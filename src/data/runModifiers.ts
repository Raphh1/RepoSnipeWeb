import type { GameState } from '../types'
import { NAMED_NPCS } from '../engine/npcTracker'

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

export const RUN_MODIFIERS: RunModifier[] = [
  // ── BUFFS ────────────────────────────────────────────────────────────────────
  {
    id: 'fortune_initiale', name: 'Fortune Initiale', tag: 'buff', color: '#ffd700',
    desc: 'Quelqu\'un a préparé le terrain. +800 cr · +2 carburant au départ.',
    apply: gs => ({ credits: gs.credits + 800, fuel: Math.min(gs.maxFuel, gs.fuel + 2) }),
  },
  {
    id: 'vaisseau_prepare', name: 'Vaisseau Préparé', tag: 'buff', color: '#40ffff',
    desc: 'Révisé avant le départ. +50 PV vaisseau max.',
    apply: gs => ({ shipHp: gs.shipMaxHp + 50, shipMaxHp: gs.shipMaxHp + 50 }),
  },
  {
    id: 'contacts_etablis', name: 'Contacts Établis', tag: 'buff', color: '#40ff80',
    desc: 'Tu as des amis là où ça compte. 3 PNJs te connaissent et te font confiance.',
    apply: gs => {
      const three = [...NAMED_NPCS].sort(() => Math.random() - 0.5).slice(0, 3)
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
    id: 'medecin_de_bord', name: 'Médecin de Bord', tag: 'buff', color: '#40ff80',
    desc: 'Infirmerie bien fournie. +5 Médicaments · +10 HP max au départ.',
    apply: gs => ({
      cargo: { ...gs.cargo, 'Médicaments': (gs.cargo['Médicaments'] ?? 0) + 5 },
      playerMaxHp: gs.playerMaxHp + 10,
      playerHp: gs.playerHp + 10,
    }),
  },
  {
    id: 'endurance', name: 'Endurance Forgée', tag: 'buff', color: '#40ffff',
    desc: 'Corps entraîné, esprit stable. +2 stamina max.',
    apply: gs => ({ maxStamina: gs.maxStamina + 2, stamina: gs.stamina + 2 }),
  },

  // ── DEBUFFS ──────────────────────────────────────────────────────────────────
  {
    id: 'dette_initiale', name: 'En Dette', tag: 'debuff', color: '#ff4040',
    desc: 'Tu pars avec une ardoise. Crédits réduits de 80% · +200 cr de dette quotidienne.',
    apply: gs => ({ credits: Math.max(200, Math.floor(gs.credits * 0.2)), debtDailyAmount: (gs.debtDailyAmount ?? 0) + 200 }),
  },
  {
    id: 'traque', name: 'Traqué', tag: 'debuff', color: '#ff4040',
    desc: 'Quelqu\'un veut ta peau. -30 réputation · stalker actif dès le départ.',
    apply: gs => ({
      reputation: gs.reputation - 30,
      stalker: { name: 'L\'Agent Gris', station: gs.currentStation, closingIn: false, daysSinceLastSeen: 0, threatLevel: 1 as const, daysActive: 0 },
    }),
  },
  {
    id: 'vide_poches', name: 'Vide-Poches', tag: 'debuff', color: '#ff4040',
    desc: 'Tu pars sans rien. Crédits de départ ÷2.',
    apply: gs => ({ credits: Math.max(0, Math.floor(gs.credits / 2)) }),
  },
  {
    id: 'vaisseau_epave', name: 'Épave Volante', tag: 'debuff', color: '#ff8040',
    desc: 'Vaisseau décrépit. PV vaisseau → 35. Mais la soute est chargée.',
    apply: gs => ({
      shipHp: 35,
      cargo: { ...gs.cargo, 'Ferraille': (gs.cargo['Ferraille'] ?? 0) + 3, 'Outils': (gs.cargo['Outils'] ?? 0) + 2 },
    }),
  },
  {
    id: 'survivant_endurci', name: 'Survivant Endurci', tag: 'mixed', color: '#ff8040',
    desc: 'HP max -25%, mais crédits de départ +1500.',
    apply: gs => ({
      playerMaxHp: Math.floor(gs.playerMaxHp * 0.75),
      playerHp: Math.floor(gs.playerHp * 0.75),
      credits: gs.credits + 1500,
    }),
  },

  // ── MIXTES ───────────────────────────────────────────────────────────────────
  {
    id: 'contrat_de_sang', name: 'Contrat de Sang', tag: 'mixed', color: '#ff6060',
    desc: '+200 cr par victoire de combat. -5 rép par victoire.',
    apply: _ => ({}),
  },
  {
    id: 'economie_de_guerre', name: 'Économie de Guerre', tag: 'mixed', color: '#ffd700',
    desc: 'Achats ×1.5. Récompenses de quêtes ×2.',
    apply: _ => ({}),
  },
  {
    id: 'paria', name: 'Paria', tag: 'mixed', color: '#a040ff',
    desc: 'Aucune faction ne t\'acceptera. Mais les prix à l\'achat sont -20%.',
    apply: _ => ({}),
  },
  {
    id: 'boucher', name: 'Boucher', tag: 'mixed', color: '#ff6040',
    desc: 'Loot de combat ×1.5. Chaque victoire coûte -3 rép.',
    apply: _ => ({}),
  },
  {
    id: 'karma_negatif', name: 'Karma Négatif', tag: 'debuff', color: '#a040ff',
    desc: 'Chaque voyage coûte +1 carburant supplémentaire.',
    apply: _ => ({}),
  },
]

export function drawRunModifiers(count = 2): RunModifier[] {
  const shuffled = [...RUN_MODIFIERS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
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
  return pickRandom(RUN_MODIFIERS)
}

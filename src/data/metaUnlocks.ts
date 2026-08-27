import type { MetaUnlock } from '../types/meta'
import i18n from '../i18n/config'

const mu = (key: string) => i18n.t(key, { ns: 'metaUnlocks' })

export function getMetaUnlocks(): MetaUnlock[] {
  return [
  // ── SURVIE ───────────────────────────────────────────────────────────────
  {
    id: 'nanites',
    name: mu('nanites.name'),
    description: mu('nanites.description'),
    cost: 3,
    category: 'survie',
    effect: { startHpBonus: 10 },
  },
  {
    id: 'armor_boost',
    name: mu('armorBoost.name'),
    description: mu('armorBoost.description'),
    cost: 6,
    category: 'survie',
    requires: 'nanites',
    effect: { defenseMult: 0.90 },
  },
  {
    id: 'stamina_boost',
    name: mu('staminaBoost.name'),
    description: mu('staminaBoost.description'),
    cost: 4,
    category: 'survie',
    effect: { startStaminaBonus: 1 },
  },

  // ── COMBAT ───────────────────────────────────────────────────────────────
  {
    id: 'sharp_blade',
    name: mu('sharpBlade.name'),
    description: mu('sharpBlade.description'),
    cost: 4,
    category: 'combat',
    effect: { attackBonus: 2 },
  },
  {
    id: 'reflexes',
    name: mu('reflexes.name'),
    description: mu('reflexes.description'),
    cost: 6,
    category: 'combat',
    requires: 'sharp_blade',
    effect: { critBonus: 8 },
  },
  {
    id: 'starter_weapon',
    name: mu('starterWeapon.name'),
    description: mu('starterWeapon.description'),
    cost: 7,
    category: 'combat',
    requires: 'sharp_blade',
    effect: { startWeaponTier: 2 },
  },

  // ── COMMERCE ─────────────────────────────────────────────────────────────
  {
    id: 'starting_funds',
    name: mu('startingFunds.name'),
    description: mu('startingFunds.description'),
    cost: 3,
    category: 'commerce',
    effect: { startCreditsBonus: 300 },
  },
  {
    id: 'merchant_contacts',
    name: mu('merchantContacts.name'),
    description: mu('merchantContacts.description'),
    cost: 6,
    category: 'commerce',
    requires: 'starting_funds',
    effect: { buyDiscountBonus: 8 },
  },
  {
    id: 'starter_cargo',
    name: mu('starterCargo.name'),
    description: mu('starterCargo.description'),
    cost: 4,
    category: 'commerce',
    effect: { startCargoBonus: true },
  },

  // ── VOYAGE ───────────────────────────────────────────────────────────────
  {
    id: 'spare_tank',
    name: mu('spareTank.name'),
    description: mu('spareTank.description'),
    cost: 3,
    category: 'voyage',
    effect: { startFuelBonus: 2 },
  },
  {
    id: 'engine_tuning',
    name: mu('engineTuning.name'),
    description: mu('engineTuning.description'),
    cost: 5,
    category: 'voyage',
    requires: 'spare_tank',
    effect: { maxFuelBonus: 2 },
  },
  {
    id: 'travel_scanner',
    name: mu('travelScanner.name'),
    description: mu('travelScanner.description'),
    cost: 6,
    category: 'voyage',
    effect: { seesTravelEvents: true },
  },

  // ── SPÉCIAL ──────────────────────────────────────────────────────────────
  {
    id: 'reputation',
    name: mu('reputation.name'),
    description: mu('reputation.description'),
    cost: 4,
    category: 'special',
    effect: { startReputationBonus: 20 },
  },
  {
    id: 'nexus_fragment',
    name: mu('nexusFragment.name'),
    description: mu('nexusFragment.description'),
    cost: 9,
    category: 'special',
    effect: { startNexusFragment: true },
  },
  {
    id: 'medkit',
    name: mu('medkit.name'),
    description: mu('medkit.description'),
    cost: 3,
    category: 'special',
    effect: { startMedkitBonus: 2 },
  },

  // ── UNLOCKS AVANCÉS ──────────────────────────────────────────────────────
  {
    id: 'last_stand',
    name: mu('lastStand.name'),
    description: mu('lastStand.description'),
    cost: 8,
    category: 'survie',
    requires: 'armor_boost',
    effect: { surviveLethalOnce: true },
  },
  {
    id: 'coup_de_grace',
    name: mu('coupDeGrace.name'),
    description: mu('coupDeGrace.description'),
    cost: 7,
    category: 'combat',
    requires: 'reflexes',
    effect: { coupDeGrace: 40 },
  },
  {
    id: 'faction_ties',
    name: mu('factionTies.name'),
    description: mu('factionTies.description'),
    cost: 6,
    category: 'special',
    requires: 'reputation',
    effect: { startFactionRepBonus: 30 },
  },
  {
    id: 'scout_training',
    name: mu('scoutTraining.name'),
    description: mu('scoutTraining.description'),
    cost: 5,
    category: 'voyage',
    requires: 'travel_scanner',
    effect: { startZoneDepthBonus: 2 },
  },
  ]
}

import type { ArmorData, GameState } from '../types'
import i18n from '../i18n/config'

const ar = (key: string) => i18n.t(key, { ns: 'armors' })

export function getArmors(): ArmorData[] {
  return [
  // Tier 1
  { name: 'Veste en cuir renforcé',    tier: 1, defense: 10, hpBonus: 0,  effect: 'none',         effectValue: 0,  description: ar('vesteRenforcee'),                     sellValue: 80  },
  { name: 'Plastron de récupération',  tier: 1, defense: 12, hpBonus: 5,  effect: 'none',         effectValue: 0,  description: ar('plastronRecuperation'),            sellValue: 100 },
  { name: 'Exo-combinaison trouée',    tier: 1, defense: 8,  hpBonus: 10, effect: 'regen',        effectValue: 2,  description: ar('exoTrouee'),         sellValue: 120 },
  { name: 'Bouclier anti-émeute',      tier: 1, defense: 15, hpBonus: 0,  effect: 'none',         effectValue: 0,  description: ar('bouclierAntiEmeute'),                          sellValue: 90  },
  { name: 'Parka blindée',             tier: 1, defense: 11, hpBonus: 8,  effect: 'none',         effectValue: 0,  description: ar('parkaBlindee'), sellValue: 95  },

  // Tier 2
  { name: 'Armure composite légère',   tier: 2, defense: 20, hpBonus: 10, effect: 'none',         effectValue: 0,  description: ar('armureCompositeLegere'),        sellValue: 250 },
  { name: 'Gilet kevlar avancé',       tier: 2, defense: 22, hpBonus: 5,  effect: 'staminaBoost', effectValue: 10, description: ar('giletKevlarAvance'),      sellValue: 280 },
  { name: 'Armure épineuse',           tier: 2, defense: 18, hpBonus: 8,  effect: 'thorns',       effectValue: 25, description: ar('armureEpineuse'),                sellValue: 300 },
  { name: 'Combinaison de régén',      tier: 2, defense: 16, hpBonus: 15, effect: 'regen',        effectValue: 5,  description: ar('combinaisonRegen'),  sellValue: 320 },
  { name: 'Plastron de mercenaire',    tier: 2, defense: 24, hpBonus: 0,  effect: 'none',         effectValue: 0,  description: ar('plastronMercenaire'),           sellValue: 240 },

  // Tier 3
  { name: 'Armure balistique Mk3',     tier: 3, defense: 30, hpBonus: 15, effect: 'none',         effectValue: 0,  description: ar('armureBalistiqueMk3'),          sellValue: 600 },
  { name: 'Exo-squelette de combat',   tier: 3, defense: 28, hpBonus: 20, effect: 'staminaBoost', effectValue: 20, description: ar('exoSquelette'),       sellValue: 700 },
  { name: 'Armure de flux plasma',     tier: 3, defense: 25, hpBonus: 10, effect: 'thorns',       effectValue: 35, description: ar('armureFluxPlasma'),        sellValue: 750 },
  { name: 'Combinaison de survie X',   tier: 3, defense: 26, hpBonus: 25, effect: 'regen',        effectValue: 8,  description: ar('combinaisonSurvieX'),                 sellValue: 680 },
  { name: 'Armure de Faucon Noir',     tier: 3, defense: 32, hpBonus: 12, effect: 'none',         effectValue: 0,  description: ar('armureFauconNoir'),                sellValue: 650 },

  // Tier 4
  { name: 'Armure des Abysses',        tier: 4, defense: 38, hpBonus: 20, effect: 'none',         effectValue: 0,  description: ar('armureAbysses'),        sellValue: 1400 },
  { name: 'Exo-combat Noctis',         tier: 4, defense: 35, hpBonus: 30, effect: 'staminaBoost', effectValue: 30, description: ar('exoCombatNoctis'),       sellValue: 1600 },
  { name: 'Carapace épineuse avancée', tier: 4, defense: 32, hpBonus: 15, effect: 'thorns',       effectValue: 45, description: ar('carapaceEpineuseAvancee'),         sellValue: 1800 },
  { name: 'Nanite régén avancé',       tier: 4, defense: 30, hpBonus: 35, effect: 'regen',        effectValue: 12, description: ar('naniteRegenAvance'),sellValue: 1700 },
  { name: 'Armure du Vide',            tier: 4, defense: 40, hpBonus: 20, effect: 'immunity',     effectValue: 1,  description: ar('armureDuVide'),        sellValue: 2000 },

  // Tier 5
  { name: 'Armure de la Singularité',  tier: 5, defense: 48, hpBonus: 30, effect: 'none',         effectValue: 0,  description: ar('armureSingularite'),          sellValue: 4000 },
  { name: 'Exo-dieu de guerre',        tier: 5, defense: 45, hpBonus: 40, effect: 'staminaBoost', effectValue: 40, description: ar('exoDieuDeGuerre'),      sellValue: 4500 },
  { name: 'Tégument réflexif absolu',  tier: 5, defense: 40, hpBonus: 25, effect: 'thorns',       effectValue: 60, description: ar('tegumentReflexifAbsolu'),     sellValue: 5000 },
  { name: 'Armure de Résurrection',    tier: 5, defense: 42, hpBonus: 50, effect: 'regen',        effectValue: 18, description: ar('armureResurrection'),    sellValue: 4800 },
  ]
}

export function rollArmorForTier(tier: number): ArmorData {
  const pool = getArmors().filter(a => a.tier === Math.min(5, Math.max(1, tier)))
  return pool[Math.floor(Math.random() * pool.length)]
}

// Empêche d'empiler une armure identique déjà possédée (inutile, un seul exemplaire
// peut être équipé) : au lieu d'ajouter un doublon, elle est directement revendue.
export function grantArmor(gs: GameState, armor: ArmorData): Partial<GameState> {
  const alreadyOwned = gs.equippedArmor?.name === armor.name || gs.armors.some(a => a.name === armor.name)
  if (alreadyOwned) {
    return { credits: gs.credits + armor.sellValue }
  }
  return { armors: [...gs.armors, armor] }
}

import type { ArmorData } from '../types'

export const ARMORS: ArmorData[] = [
  // Tier 1
  { name: 'Veste en cuir renforcé',    tier: 1, defense: 10, hpBonus: 0,  effect: 'none',         effectValue: 0,  description: 'Basique mais efficace.',                     sellValue: 80  },
  { name: 'Plastron de récupération',  tier: 1, defense: 12, hpBonus: 5,  effect: 'none',         effectValue: 0,  description: 'Soudé avec des déchets d\'épaves.',            sellValue: 100 },
  { name: 'Exo-combinaison trouée',    tier: 1, defense: 8,  hpBonus: 10, effect: 'regen',        effectValue: 2,  description: 'Régénère 2 PV/tour malgré les trous.',         sellValue: 120 },
  { name: 'Bouclier anti-émeute',      tier: 1, defense: 15, hpBonus: 0,  effect: 'none',         effectValue: 0,  description: 'Lourd. Pas discret.',                          sellValue: 90  },
  { name: 'Parka blindée',             tier: 1, defense: 11, hpBonus: 8,  effect: 'none',         effectValue: 0,  description: 'Chaud l\'hiver, résistant le reste du temps.', sellValue: 95  },

  // Tier 2
  { name: 'Armure composite légère',   tier: 2, defense: 20, hpBonus: 10, effect: 'none',         effectValue: 0,  description: 'Standard militaire de troisième zone.',        sellValue: 250 },
  { name: 'Gilet kevlar avancé',       tier: 2, defense: 22, hpBonus: 5,  effect: 'staminaBoost', effectValue: 10, description: 'Allège les mouvements. +10 stamina/tour.',      sellValue: 280 },
  { name: 'Armure épineuse',           tier: 2, defense: 18, hpBonus: 8,  effect: 'thorns',       effectValue: 25, description: 'Renvoie 25% des dégâts reçus.',                sellValue: 300 },
  { name: 'Combinaison de régén',      tier: 2, defense: 16, hpBonus: 15, effect: 'regen',        effectValue: 5,  description: 'Nanites de réparation intégrés. +5 PV/tour.',  sellValue: 320 },
  { name: 'Plastron de mercenaire',    tier: 2, defense: 24, hpBonus: 0,  effect: 'none',         effectValue: 0,  description: 'Portée par des centaines avant toi.',           sellValue: 240 },

  // Tier 3
  { name: 'Armure balistique Mk3',     tier: 3, defense: 30, hpBonus: 15, effect: 'none',         effectValue: 0,  description: 'Arrête les balles de petit calibre.',          sellValue: 600 },
  { name: 'Exo-squelette de combat',   tier: 3, defense: 28, hpBonus: 20, effect: 'staminaBoost', effectValue: 20, description: 'Amplifie la force et absorbe les chocs.',       sellValue: 700 },
  { name: 'Armure de flux plasma',     tier: 3, defense: 25, hpBonus: 10, effect: 'thorns',       effectValue: 35, description: 'Le plasma renvoyé brûle qui te frappe.',        sellValue: 750 },
  { name: 'Combinaison de survie X',   tier: 3, defense: 26, hpBonus: 25, effect: 'regen',        effectValue: 8,  description: '+8 PV/tour en milieu hostile.',                 sellValue: 680 },
  { name: 'Armure de Faucon Noir',     tier: 3, defense: 32, hpBonus: 12, effect: 'none',         effectValue: 0,  description: 'Arrachée à un officier ennemi.',                sellValue: 650 },

  // Tier 4
  { name: 'Armure des Abysses',        tier: 4, defense: 38, hpBonus: 20, effect: 'none',         effectValue: 0,  description: 'Forgée dans les profondeurs de Velkor.',        sellValue: 1400 },
  { name: 'Exo-combat Noctis',         tier: 4, defense: 35, hpBonus: 30, effect: 'staminaBoost', effectValue: 30, description: 'Équipement militaire de faction Noctis.',       sellValue: 1600 },
  { name: 'Carapace épineuse avancée', tier: 4, defense: 32, hpBonus: 15, effect: 'thorns',       effectValue: 45, description: 'Renvoie presque la moitié des dégâts.',         sellValue: 1800 },
  { name: 'Nanite régén avancé',       tier: 4, defense: 30, hpBonus: 35, effect: 'regen',        effectValue: 12, description: '+12 PV/tour. Les blessures se referment seules.',sellValue: 1700 },
  { name: 'Armure du Vide',            tier: 4, defense: 40, hpBonus: 20, effect: 'immunity',     effectValue: 1,  description: 'Absorbe un coup fatal. Une seule fois.',        sellValue: 2000 },

  // Tier 5
  { name: 'Armure de la Singularité',  tier: 5, defense: 48, hpBonus: 30, effect: 'none',         effectValue: 0,  description: 'Prototype. N\'est pas censé exister.',          sellValue: 4000 },
  { name: 'Exo-dieu de guerre',        tier: 5, defense: 45, hpBonus: 40, effect: 'staminaBoost', effectValue: 40, description: 'Tu n\'es plus tout à fait humain avec ça.',      sellValue: 4500 },
  { name: 'Tégument réflexif absolu',  tier: 5, defense: 40, hpBonus: 25, effect: 'thorns',       effectValue: 60, description: 'Renvoie 60% des dégâts. Toucher = suicide.',     sellValue: 5000 },
  { name: 'Armure de Résurrection',    tier: 5, defense: 42, hpBonus: 50, effect: 'regen',        effectValue: 18, description: '+18 PV/tour. Tu ne peux presque pas mourir.',    sellValue: 4800 },
]

export function rollArmorForTier(tier: number): ArmorData {
  const pool = ARMORS.filter(a => a.tier === Math.min(5, Math.max(1, tier)))
  return pool[Math.floor(Math.random() * pool.length)]
}

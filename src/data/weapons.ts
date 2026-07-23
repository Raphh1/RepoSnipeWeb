import type { WeaponData } from '../types'

const w = (
  name: string, tier: number,
  dMin: number, dMax: number, crit: number,
  effect: WeaponData['effect'], effectChance: number, effectDesc: string,
  selfChance = 0, selfMax = 0,
  affinities: WeaponData['affinities'] = {}
): WeaponData => ({ name, tier, damageMin: dMin, damageMax: dMax, critChance: crit, effect, effectChance, effectDesc, selfDmgChance: selfChance, selfDmgMax: selfMax, affinities })

export const WEAPONS: WeaponData[] = [
  // Tier 1
  w('Couteau de rue',             1,  6, 14,  8, 'none',       0,  '',                                     0,  0, { Vagabond: 1.15, Contrebandier: 1.1 }),
  w('Matraque de garde',          1,  8, 16,  6, 'stun',      20,  'Étourdit l\'ennemi 1 tour',             0,  0, { 'Seigneur de guerre': 1.15 }),
  w('Pistolet rouillé',           1,  7, 15, 10, 'none',       0,  '',                                     0,  0),
  w('Taser de poche',             1,  5, 12, 12, 'stun',      30,  'Étourdit l\'ennemi 1 tour',             0,  0, { Hackeur: 1.2 }),
  w('Couteau à cran d\'arrêt',    1,  6, 13,  9, 'none',       0,  '',                                     0,  0, { Vagabond: 1.2, Contrebandier: 1.15 }),
  w('Pique artisanale',           1,  7, 14,  7, 'none',       0,  '',                                     0,  0),
  w('Bâton de pacification',      1,  9, 17,  5, 'stun',      15,  'Étourdit l\'ennemi 1 tour',             0,  0, { 'Seigneur de guerre': 1.1 }),
  w('Arbalète de fortune',        1,  8, 18, 11, 'none',       0,  '',                                     0,  0, { Vétéran: 1.1 }),

  // Tier 2
  w('Pistolet semi-auto',         2, 12, 24, 12, 'none',       0,  '',                                     0,  0),
  w('Fusil à impulsion',          2, 14, 28, 14, 'blind',     25,  'Aveugle l\'ennemi (-40% précision)',    0,  0, { Hackeur: 1.2 }),
  w('Lame vibrante',              2, 15, 30, 16, 'none',       0,  '',                                     0,  0, { 'Seigneur de guerre': 1.2, Vétéran: 1.15 }),
  w('Gantelet plasma',            2, 13, 26, 13, 'burn',      20,  'Brûle 8-15 dégâts/tour pendant 3 tours',0, 0, { 'Seigneur de guerre': 1.15 }),
  w('Électrogrenade (une)',        2, 16, 32, 10, 'stun',      35,  'Étourdit 1 tour',                       5, 12, { Hackeur: 1.2 }),
  w('Revolver Scav modifié',      2, 13, 27, 18, 'none',       0,  '',                                     0,  0, { Contrebandier: 1.15, Vagabond: 1.1 }),
  w('Nerf-pistolet augmenté',     2, 11, 22, 12, 'paralyze',  15,  'Paralyse 2 tours',                      0,  0, { Médecin: 1.2 }),
  w('Fouet énergétique',          2, 10, 20, 10, 'disarm',     0,  'Désarme l\'ennemi',                     0,  0, { Contrebandier: 1.15 }),

  // Tier 3
  w('Fusil à pompe galactique',   3, 22, 45, 18, 'none',       0,  '',                                    15, 18, { 'Seigneur de guerre': 1.2, Vétéran: 1.2 }),
  w('Lance-flammes compact',      3, 20, 40, 12, 'burn',      60,  'Brûle 12-20 dégâts/tour pendant 3 tours',20,20, { 'Seigneur de guerre': 1.15 }),
  w('Pistolet à plasma Mk2',      3, 18, 38, 20, 'blind',     30,  'Aveugle l\'ennemi 1 tour',              0,  0, { Hackeur: 1.2 }),
  w('Épée monomoléculaire',       3, 24, 46, 22, 'armorPierce',0,  '+30% dégâts (ignore armure)',           0,  0, { 'Seigneur de guerre': 1.25, Vétéran: 1.2 }),
  w('Fusil de sniper portatif',   3, 26, 52, 25, 'none',       0,  '',                                     0,  0, { Vétéran: 1.15 }),
  w('Grenade sonique',            3, 18, 36, 14, 'distraction',50,  'Distrait l\'ennemi, perd son tour',    10, 15),
  w('Lame empoisonnée',           3, 16, 32, 16, 'poison',    45,  'Empoisonne 5-15 dégâts/tour pendant 4 tours', 0, 0, { Vagabond: 1.25, Contrebandier: 1.2 }),
  w('Désintégrateur compact',     3, 20, 42, 18, 'armorPierce',0,  '+30% dégâts (ignore armure)',           0,  0),

  // Tier 4
  w('Gatling à plasma Bonne Nuit',4, 30, 60, 20, 'none',       0,  '',                                    25, 25, { 'Seigneur de guerre': 1.2 }),
  w('Foudroyeur de Noctis',       4, 28, 56, 24, 'paralyze',  40,  'Paralyse 2 tours',                     0,  0, { Vétéran: 1.2 }),
  w('Lame du Conclave',           4, 32, 62, 28, 'armorPierce',0,  '+30% dégâts (ignore armure)',           0,  0, { 'Seigneur de guerre': 1.3, Vétéran: 1.25 }),
  w('Canon ionique de campagne',  4, 26, 52, 20, 'blind',     50,  'Aveugle 1 tour',                        5, 20, { Hackeur: 1.25 }),
  w('Fusil de précision Céleste', 4, 34, 68, 32, 'none',       0,  '',                                     0,  0, { Vétéran: 1.25 }),
  w('Injecto-poison Mortalis',    4, 20, 42, 18, 'poison',    75,  'Empoisonne 10-20 dégâts/tour pendant 5 tours', 0, 0, { Médecin: 1.3, Vagabond: 1.2 }),
  w('L\'Insistance',              4, 24, 48, 22, 'random',    60,  'Effet aléatoire à chaque usage',        8, 15),

  // Tier 5
  w('Canon à trou noir miniaturisé',5, 40, 80, 25, 'flee',    30,  'L\'ennemi fuit de panique',            30, 35, { 'Seigneur de guerre': 1.2 }),
  w('Canon à singularité',        5, 45, 85, 28, 'armorPierce',0,  '+30% dégâts (ignore armure)',          25, 30),
  w('Dernière Parole',            5, 50, 90, 35, 'stun',      50,  'Étourdit 1 tour',                      20, 25),
  w('Le Sceptre de Raphazarus',   5, 35, 75, 30, 'random',    80,  'Effet totalement aléatoire',           15, 20),
  w('Bombe à paradoxe',           5, 42, 82, 30, 'confusion', 40,  'L\'ennemi confus se frappe lui-même',  20, 30),
  w('Lame de la Fin des Temps',   5, 48, 92, 38, 'armorPierce',0,  '+30% dégâts (ignore armure)',           0,  0, { 'Seigneur de guerre': 1.35 }),
  w('Archon Mk-VII',              5, 40, 78, 32, 'paralyze',  60,  'Paralyse 2 tours',                      5, 15, { Vétéran: 1.3 }),
]

export function rollWeaponForTier(tier: number): WeaponData {
  const pool = WEAPONS.filter(w => w.tier === Math.min(5, Math.max(1, tier)))
  return pool[Math.floor(Math.random() * pool.length)]
}

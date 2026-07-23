import type { WeaponData } from '../types'

const w = (
  name: string, tier: number,
  dMin: number, dMax: number, crit: number,
  effect: WeaponData['effect'], effectChance: number, effectDesc: string,
  selfChance = 0, selfMax = 0,
  affinities: WeaponData['affinities'] = {}
): WeaponData => ({ name, tier, damageMin: dMin, damageMax: dMax, critChance: crit, effect, effectChance, effectDesc, selfDmgChance: selfChance, selfDmgMax: selfMax, affinities })

export const WEAPONS: WeaponData[] = [

  // ── TIER 1 ── Armes de rue, peu fiables mais accessibles ────────────────────
  w('Couteau de rue',             1,  6, 14,  8, 'none',        0, '',                                           0,  0, { Vagabond: 1.15, Contrebandier: 1.1 }),
  w('Matraque de garde',          1,  8, 16,  6, 'stun',       20, 'Étourdit l\'ennemi 1 tour',                  0,  0, { 'Seigneur de guerre': 1.15 }),
  w('Pistolet rouillé',           1,  7, 15, 10, 'none',        0, '',                                           8, 10),
  w('Taser de poche',             1,  5, 12, 12, 'stun',       30, 'Étourdit l\'ennemi 1 tour',                  0,  0, { Hackeur: 1.2 }),
  w('Couteau à cran d\'arrêt',    1,  6, 13,  9, 'poison',     18, 'Empoisonne 5-10 dégâts/tour ×4',             0,  0, { Vagabond: 1.2, Contrebandier: 1.15 }),
  w('Pique artisanale',           1,  7, 14,  7, 'none',        0, '',                                           0,  0),
  w('Bâton de pacification',      1,  9, 17,  5, 'stun',       25, 'Étourdit l\'ennemi 1 tour',                  0,  0, { 'Seigneur de guerre': 1.1 }),
  w('Arbalète de fortune',        1,  8, 18, 11, 'blind',      20, 'Aveugle l\'ennemi (-40% précision)',          0,  0, { Vétéran: 1.1 }),
  w('Shiv empoisonné',            1,  5, 11,  8, 'poison',     35, 'Empoisonne 5-10 dégâts/tour ×4',             0,  0, { Vagabond: 1.25, Contrebandier: 1.1 }),
  w('Poing américain électrique', 1,  8, 15,  7, 'stun',       22, 'Étourdit l\'ennemi 1 tour',                  5,  8, { 'Seigneur de guerre': 1.1, Vétéran: 1.05 }),

  // ── TIER 2 ── Armes de milieu de gamme, premiers effets sérieux ─────────────
  w('Pistolet semi-auto',         2, 12, 24, 12, 'none',        0, '',                                           0,  0),
  w('Fusil à impulsion',          2, 14, 28, 14, 'blind',      25, 'Aveugle l\'ennemi (-40% précision)',          0,  0, { Hackeur: 1.2 }),
  w('Lame vibrante',              2, 15, 30, 16, 'none',        0, '',                                           0,  0, { 'Seigneur de guerre': 1.2, Vétéran: 1.15 }),
  w('Gantelet plasma',            2, 13, 26, 13, 'burn',       20, 'Brûle 8-15 dégâts/tour ×3',                  0,  0, { 'Seigneur de guerre': 1.15 }),
  w('Électrogrenade (une)',        2, 16, 32, 10, 'shock',      35, 'Étourdit + brûle 10-18/tour ×3',             5, 12, { Hackeur: 1.2 }),
  w('Revolver Scav modifié',      2, 13, 27, 18, 'none',        0, '',                                           0,  0, { Contrebandier: 1.15, Vagabond: 1.1 }),
  w('Nerf-pistolet augmenté',     2, 11, 22, 12, 'paralyze',   15, 'Paralyse l\'ennemi 2 tours',                 0,  0, { Médecin: 1.2 }),
  w('Fouet désorganisant',        2, 10, 20, 10, 'disarm',     35, 'Désarme l\'ennemi (-40% dégâts ×2 tours)',   0,  0, { Contrebandier: 1.15 }),
  w('Vampirelle',                 2, 11, 22, 11, 'lifesteal',   0, 'Vole 35% des dégâts infligés en PV',         0,  0, { Médecin: 1.2, Vagabond: 1.1 }),
  w('Bâton de choc',              2, 10, 20,  9, 'shock',      28, 'Étourdit + brûle 10-18/tour ×3',             0,  0, { 'Seigneur de guerre': 1.1 }),

  // ── TIER 3 ── Armes puissantes, premiers risques réels ──────────────────────
  w('Fusil à pompe galactique',   3, 22, 45, 18, 'none',        0, '',                                          15, 18, { 'Seigneur de guerre': 1.2, Vétéran: 1.2 }),
  w('Lance-flammes compact',      3, 20, 40, 12, 'burn',       60, 'Brûle 12-20 dégâts/tour ×3',               20, 20, { 'Seigneur de guerre': 1.15 }),
  w('Pistolet à plasma Mk2',      3, 18, 38, 20, 'blind',      30, 'Aveugle l\'ennemi 1 tour',                   0,  0, { Hackeur: 1.2 }),
  w('Épée monomoléculaire',       3, 24, 46, 22, 'armorPierce', 0, '+30% dégâts (perce l\'armure)',              0,  0, { 'Seigneur de guerre': 1.25, Vétéran: 1.2 }),
  w('Fusil de sniper portatif',   3, 26, 52, 25, 'none',        0, '',                                           0,  0, { Vétéran: 1.15 }),
  w('Grenade sonique',            3, 18, 36, 14, 'distraction',50, 'Distrait l\'ennemi, perd son tour',         10, 15),
  w('Lame empoisonnée',           3, 16, 32, 16, 'poison',     45, 'Empoisonne 5-15 dégâts/tour ×4',             0,  0, { Vagabond: 1.25, Contrebandier: 1.2 }),
  w('Désintégrateur compact',     3, 20, 42, 18, 'armorPierce', 0, '+30% dégâts (perce l\'armure)',              0,  0),
  w('Double-lame des bas-fonds',  3, 18, 35, 15, 'double_strike',0,'Frappe deux fois (×0.85 chacune)',          12, 16, { Vagabond: 1.2, 'Seigneur de guerre': 1.1 }),
  w('Sceptre maudit de Neva',     3, 14, 28, 13, 'curse',      55, 'Ennemi affaibli -40% dégâts ×3 tours',       0,  0, { Médecin: 1.2, Hackeur: 1.1 }),
  w('Grenade à confusion',        3, 20, 38, 12, 'confusion',  45, 'L\'ennemi se frappe lui-même ×2 tours',      8, 14),

  // ── TIER 4 ── Armes d'élite, risques sérieux, effets puissants ──────────────
  w('Gatling à plasma Bonne Nuit',4, 30, 60, 20, 'none',        0, '',                                          25, 25, { 'Seigneur de guerre': 1.2 }),
  w('Foudroyeur de Noctis',       4, 28, 56, 24, 'paralyze',   40, 'Paralyse 2 tours',                           0,  0, { Vétéran: 1.2 }),
  w('Lame du Conclave',           4, 32, 62, 28, 'armorPierce', 0, '+30% dégâts (perce l\'armure)',               0,  0, { 'Seigneur de guerre': 1.2, Vétéran: 1.2 }),
  w('Canon ionique de campagne',  4, 26, 52, 20, 'blind',      50, 'Aveugle 1 tour',                             5, 20, { Hackeur: 1.2 }),
  w('Fusil de précision Céleste', 4, 34, 68, 32, 'none',        0, '',                                           0,  0, { Vétéran: 1.2 }),
  w('Injecto-poison Mortalis',    4, 20, 42, 18, 'poison',     75, 'Empoisonne 10-20 dégâts/tour ×5',             0,  0, { Médecin: 1.2, Vagabond: 1.2 }),
  w('L\'Insistance',              4, 24, 48, 22, 'random',     60, 'Effet totalement aléatoire à chaque usage',   8, 15),
  w('Lame sacrificielle',         4, 28, 55, 20, 'sacrifice',   0, 'Coûte 25% PV max — frappe ×2.5 en échange',  0,  0, { 'Seigneur de guerre': 1.2, Vétéran: 1.1 }),
  w('Fusil Berserk',              4, 25, 50, 18, 'berserker',   0, 'Dégâts × (1 + 1.5×%PV manquants), jusqu\'à ×2.5', 0, 0, { 'Seigneur de guerre': 1.15, Vétéran: 1.1 }),
  w('L\'Éveilleur',               4, 22, 44, 19, 'momentum_surge',0,'Frappe + momentum max instantané',          0,  0, { Vétéran: 1.2, 'Seigneur de guerre': 1.1 }),

  // ── TIER 5 ── Armes légendaires — certaines peuvent tuer leur porteur ────────
  w('Canon à trou noir miniaturisé', 5, 40, 80, 25, 'flee',     30, 'L\'ennemi fuit de panique',                30, 35, { 'Seigneur de guerre': 1.2 }),
  w('Canon à singularité',           5, 45, 85, 28, 'armorPierce',0,'+30% dégâts (perce l\'armure)',            25, 30),
  w('Dernière Parole',               5, 50, 90, 35, 'stun',     50, 'Étourdit 1 tour',                          20, 25),
  // redesigns
  w('Le Sceptre de Raphazarus',      5, 38, 78, 30, 'berserker', 0, 'Comme son créateur : plus tu souffres, plus tu es fort. Dégâts jusqu\'à ×2.5.', 0, 0, { Vétéran: 1.25, 'Seigneur de guerre': 1.15 }),
  w('Bombe à paradoxe',              5, 42, 82, 28, 'confusion',55, 'L\'ennemi perd toute orientation — se frappe lui-même 2 tours', 20, 30),
  w('Lame de la Fin des Temps',      5, 50, 95, 35, 'nuclear',   0, '×4.5 dégâts. 65% de chance de t\'irradier (80-200 dégâts retour + affaibli).', 0, 0, { 'Seigneur de guerre': 1.2 }),
  w('Archon Mk-VII',                 5, 40, 78, 32, 'paralyze', 60, 'Paralyse 2 tours',                          5, 15, { Vétéran: 1.2 }),
  // nouvelle arme dangereuse
  w('Réacteur à fission',            5, 35, 70, 25, 'unstable',  0, '50% : frappe ×3.5 | 50% : auto-destruction (100-300 dégâts + étourdi).', 30, 40),
]

export function rollWeaponForTier(tier: number): WeaponData {
  const pool = WEAPONS.filter(w => w.tier === Math.min(5, Math.max(1, tier)))
  return pool[Math.floor(Math.random() * pool.length)]
}

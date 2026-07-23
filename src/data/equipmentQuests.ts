import type { WeaponData, ArmorData, GameState } from '../types'

export type EquipmentQuestDifficulty = 'common' | 'rare' | 'epic' | 'legendary'

export interface EquipmentQuest {
  id: string
  title: string
  description: string
  difficulty: EquipmentQuestDifficulty
  station: string
  requirements: EquipmentQuestRequirement[]
  reward: { weapon?: WeaponData; armor?: ArmorData }
}

export type EquipmentQuestRequirement =
  | { type: 'credits'; amount: number }
  | { type: 'reputation'; min: number }
  | { type: 'item'; name: string; qty: number }
  | { type: 'combatsWon'; min: number }
  | { type: 'visitStation'; station: string }
  | { type: 'bossKill'; bossName: string }
  | { type: 'day'; min: number }
  | { type: 'subBoss'; subBossId: string }

function w(name: string, tier: number, dMin: number, dMax: number, crit: number,
  effect: WeaponData['effect'], eChance: number, eDesc: string,
  selfChance = 0, selfMax = 0): WeaponData {
  return { name, tier, damageMin: dMin, damageMax: dMax, critChance: crit, effect, effectChance: eChance, effectDesc: eDesc, selfDmgChance: selfChance, selfDmgMax: selfMax, affinities: {} }
}

function a(name: string, tier: number, def: number, hp: number,
  effect: ArmorData['effect'], eVal: number, desc: string, sell: number): ArmorData {
  return { name, tier, defense: def, hpBonus: hp, effect, effectValue: eVal, description: desc, sellValue: sell }
}

export const EQUIPMENT_QUESTS: EquipmentQuest[] = [
  // ── COMMON (Tier 2) ──────────────────────────────────────────────────────
  {
    id: 'eq-lame-recup',
    title: 'La Lame Récupérée',
    description: 'Un forgeron de la Carcasse parle d\'une lame ancienne enfouie dans la ferraille. Il a besoin de matériaux pour la restaurer.',
    difficulty: 'common',
    station: 'La Carcasse',
    requirements: [
      { type: 'item', name: 'Métaux bruts', qty: 3 },
      { type: 'credits', amount: 500 },
    ],
    reward: { weapon: w('Lame de la Carcasse', 2, 14, 28, 15, 'armorPierce', 0, '+30% dégâts (perce l\'armure)') },
  },
  {
    id: 'eq-gilet-garde',
    title: 'Le Gilet du Garde Déchu',
    description: 'Un ancien garde de Fort Kharos vend son équipement. Il veut quitter le secteur. Il a besoin de carburant et de crédits.',
    difficulty: 'common',
    station: 'Fort Kharos',
    requirements: [
      { type: 'credits', amount: 800 },
      { type: 'reputation', min: 15 },
    ],
    reward: { armor: a('Gilet du Garde Déchu', 2, 22, 10, 'none', 0, 'L\'ancien propriétaire est parti. Le gilet est resté.', 300) },
  },

  // ── RARE (Tier 3) ────────────────────────────────────────────────────────
  {
    id: 'eq-fusil-fantome',
    title: 'Le Fusil du Fantôme',
    description: 'Une rumeur circule sur Station Fantôme : une arme légendaire est cachée dans les conduits d\'aération. Pour la trouver, il faut y avoir survécu.',
    difficulty: 'rare',
    station: 'Station Fantôme',
    requirements: [
      { type: 'combatsWon', min: 10 },
      { type: 'credits', amount: 2000 },
      { type: 'item', name: 'Données volées', qty: 2 },
    ],
    reward: { weapon: w('Fusil du Fantôme', 3, 22, 44, 22, 'blind', 40, 'Aveugle l\'ennemi 1 tour. Trouvé dans les conduits d\'une station qui n\'existe pas.') },
  },
  {
    id: 'eq-armure-mira',
    title: 'L\'Armure des Profondeurs',
    description: 'Les mineurs de Mira parlent d\'une armure cristalline trouvée dans les galeries les plus profondes. Elle a des propriétés étranges.',
    difficulty: 'rare',
    station: 'Les Cavernes de Mira',
    requirements: [
      { type: 'item', name: 'Cristaux énergétiques', qty: 3 },
      { type: 'credits', amount: 2500 },
      { type: 'day', min: 8 },
    ],
    reward: { armor: a('Armure Cristalline de Mira', 3, 28, 20, 'thorns', 30, 'Les cristaux de Mira renvoient l\'énergie.', 800) },
  },
  {
    id: 'eq-lame-noctis',
    title: 'La Commande de Noctis',
    description: 'Un artisan de la Forge Noire peut forger une lame de qualité Noctis — mais il a besoin de composants spécifiques et d\'une preuve de valeur.',
    difficulty: 'rare',
    station: 'La Forge Noire',
    requirements: [
      { type: 'item', name: "Composants d'armure", qty: 2 },
      { type: 'item', name: 'Armes artisanales', qty: 1 },
      { type: 'credits', amount: 3000 },
      { type: 'combatsWon', min: 15 },
    ],
    reward: { weapon: w('Lame Noctis Forgée', 3, 24, 48, 20, 'double_strike', 0, 'Frappe deux fois (×0.85 chacune). Forgée dans les profondeurs de la Forge Noire.') },
  },

  // ── EPIC (Tier 4) ────────────────────────────────────────────────────────
  {
    id: 'eq-canon-velkor',
    title: 'Le Canon des Abysses',
    description: 'Dans les Abysses de Velkor, un prototype d\'arme pré-Fracture attend d\'être restauré. Il faut des données classifiées pour débloquer sa chambre forte.',
    difficulty: 'epic',
    station: 'Les Abysses de Velkor',
    requirements: [
      { type: 'item', name: 'Données classifiées', qty: 3 },
      { type: 'item', name: 'Composants expérimentaux', qty: 2 },
      { type: 'credits', amount: 6000 },
      { type: 'reputation', min: 40 },
    ],
    reward: { weapon: w('Canon Abyssal', 4, 32, 62, 26, 'shock', 45, 'Étourdit + brûle 15-25/tour ×3. Prototype pré-Fracture.', 8, 20) },
  },
  {
    id: 'eq-armure-ecarlate',
    title: 'L\'Armure de l\'Écarlate',
    description: 'Les Gardiens Écarlates conservent une armure légendaire dans leur Arsenal. La mériter exige loyauté et sang.',
    difficulty: 'epic',
    station: "L'Arsenal Écarlate",
    requirements: [
      { type: 'reputation', min: 50 },
      { type: 'combatsWon', min: 25 },
      { type: 'credits', amount: 5000 },
      { type: 'visitStation', station: 'Bastion Mineur' },
    ],
    reward: { armor: a('Armure Légendaire Écarlate', 4, 38, 25, 'regen', 10, 'Portée par les champions des Gardiens. +10 PV/tour.', 2200) },
  },
  {
    id: 'eq-vampirelle-mk2',
    title: 'Vampirelle Mk.II',
    description: 'Le Docteur Flinch à la Bulle a perfectionné la technologie vampirique. Il a besoin de composants biologiques et de cobayes... ou juste de crédits.',
    difficulty: 'epic',
    station: 'La Bulle',
    requirements: [
      { type: 'item', name: 'Composants biologiques', qty: 3 },
      { type: 'credits', amount: 7000 },
      { type: 'day', min: 15 },
    ],
    reward: { weapon: w('Vampirelle Mk.II', 4, 26, 52, 22, 'lifesteal', 0, 'Vole 35% des dégâts en PV. Version améliorée par Flinch.') },
  },

  // ── LEGENDARY (Tier 5) ───────────────────────────────────────────────────
  {
    id: 'eq-lame-nexus',
    title: 'La Lame du Nexus',
    description: 'Les ruines du Berceau cachent l\'arme la plus ancienne du secteur. Forgée avant la Fracture, elle nécessite des artefacts de chaque coin du secteur pour être réactivée.',
    difficulty: 'legendary',
    station: 'Le Berceau',
    requirements: [
      { type: 'item', name: 'Artefacts', qty: 5 },
      { type: 'item', name: 'Données pré-Fracture', qty: 2 },
      { type: 'credits', amount: 15000 },
      { type: 'combatsWon', min: 40 },
      { type: 'reputation', min: 60 },
    ],
    reward: { weapon: w('Lame du Nexus Originel', 5, 45, 88, 32, 'momentum_surge', 0, 'Frappe + momentum max instantané. L\'arme qui existait avant tout.') },
  },
  {
    id: 'eq-armure-singularite',
    title: 'Le Projet Singularité',
    description: 'ARIA-9 à Sanctum Machina possède les plans d\'une armure qui n\'est pas censée exister. La construire nécessite la coopération d\'un esprit humain et d\'une IA.',
    difficulty: 'legendary',
    station: 'Sanctum Machina',
    requirements: [
      { type: 'item', name: 'Composants expérimentaux', qty: 4 },
      { type: 'item', name: 'Implants cybernétiques', qty: 2 },
      { type: 'credits', amount: 12000 },
      { type: 'day', min: 25 },
      { type: 'combatsWon', min: 35 },
    ],
    reward: { armor: a('Armure de la Singularité Mk.II', 5, 50, 35, 'immunity', 1, 'Absorbe un coup fatal. Projet interdit. Parfait.', 5000) },
  },
  {
    id: 'eq-sceptre-roi',
    title: 'Le Sceptre du Roi Perdu',
    description: 'L\'Arc Perdu contient l\'arme d\'un roi oublié. Raphazarus sait où elle se trouve — mais il ne la donnera qu\'à quelqu\'un qui a prouvé sa valeur sur les champs de bataille.',
    difficulty: 'legendary',
    station: "L'Arc Perdu",
    requirements: [
      { type: 'item', name: 'Reliques de la Grande Guerre', qty: 3 },
      { type: 'combatsWon', min: 50 },
      { type: 'credits', amount: 10000 },
      { type: 'reputation', min: 70 },
      { type: 'subBoss', subBossId: 'ala-4' },
    ],
    reward: { weapon: w('Sceptre du Roi Perdu', 5, 48, 92, 30, 'berserker', 0, 'Dégâts × (1 + 1.5×%PV manquants), max ×2.5. L\'arme d\'un roi qui a tout perdu — sauf sa fureur.') },
  },
]

export function getQuestsAtStation(station: string): EquipmentQuest[] {
  return EQUIPMENT_QUESTS.filter(q => q.station === station)
}

export function canStartQuest(gs: GameState, quest: EquipmentQuest): { ok: boolean; missing: string[] } {
  if ((gs.completedEquipmentQuests ?? []).includes(quest.id)) return { ok: false, missing: ['Déjà complétée'] }
  const missing: string[] = []
  for (const req of quest.requirements) {
    switch (req.type) {
      case 'credits':
        if (gs.credits < req.amount) missing.push(`${req.amount - gs.credits} crédits manquants`)
        break
      case 'reputation':
        if (gs.reputation < req.min) missing.push(`Réputation ${gs.reputation}/${req.min}`)
        break
      case 'item': {
        const qty = gs.cargo[req.name] ?? 0
        if (qty < req.qty) missing.push(`${req.name} ${qty}/${req.qty}`)
        break
      }
      case 'combatsWon':
        if ((gs.combatsWon ?? 0) < req.min) missing.push(`Combats gagnés ${gs.combatsWon ?? 0}/${req.min}`)
        break
      case 'visitStation':
        if (!gs.visitedStations.includes(req.station)) missing.push(`Visite ${req.station} d'abord`)
        break
      case 'bossKill':
        if (!gs.stationBossesBeaten.includes(req.bossName)) missing.push(`Vaincre ${req.bossName}`)
        break
      case 'day':
        if (gs.day < req.min) missing.push(`Jour ${gs.day}/${req.min}`)
        break
      case 'subBoss': {
        const defeated = gs.subBossesDefeated ?? {}
        const allDefeated = Object.values(defeated).flat()
        if (!allDefeated.includes(req.subBossId)) missing.push(`Sous-boss requis non vaincu`)
        break
      }
    }
  }
  return { ok: missing.length === 0, missing }
}

export function completeQuest(gs: GameState, quest: EquipmentQuest): Partial<GameState> {
  const patch: Partial<GameState> = {
    completedEquipmentQuests: [...(gs.completedEquipmentQuests ?? []), quest.id],
  }
  let newCargo = { ...gs.cargo }
  let newCredits = gs.credits
  for (const req of quest.requirements) {
    if (req.type === 'credits') newCredits -= req.amount
    if (req.type === 'item') {
      newCargo[req.name] = (newCargo[req.name] ?? 0) - req.qty
      if (newCargo[req.name] <= 0) delete newCargo[req.name]
    }
  }
  patch.credits = newCredits
  patch.cargo = newCargo
  if (quest.reward.weapon) {
    patch.weapons = [...gs.weapons, quest.reward.weapon]
  }
  if (quest.reward.armor) {
    patch.armors = [...gs.armors, quest.reward.armor]
  }
  return patch
}

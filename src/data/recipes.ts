import i18n from '../i18n/config'

const re = (key: string) => i18n.t(key, { ns: 'recipes' })

export type RecipeOutput =
  | { type: 'weapon_roll'; tier: 1 | 2 | 3 | 4 }
  | { type: 'armor_roll';  tier: 1 | 2 | 3 | 4 }
  | { type: 'cargo';  item: string; quantity: number }

export interface Recipe {
  id: string
  name: string
  description: string
  category: 'arme' | 'armure' | 'consommable' | 'ressource'
  ingredients: Record<string, number>
  output: RecipeOutput
}

export function getRecipes(): Recipe[] {
  return [
  // ── ARMES ────────────────────────────────────────────────────────────────
  {
    id: 'blade_scrap',
    name: 'Lame de récupération',
    description: re('bladeScrap'),
    category: 'arme',
    ingredients: { 'Ferraille': 3, 'Outils': 1 },
    output: { type: 'weapon_roll', tier: 1 },
  },
  {
    id: 'pistol_crude',
    name: 'Pistolet artisanal',
    description: re('pistolCrude'),
    category: 'arme',
    ingredients: { 'Métaux bruts': 2, 'Pièces techniques': 2 },
    output: { type: 'weapon_roll', tier: 1 },
  },
  {
    id: 'rifle_makeshift',
    name: 'Fusil de fortune',
    description: re('rifleMakeshift'),
    category: 'arme',
    ingredients: { 'Métaux rares': 1, 'Munitions': 2, 'Composants divers': 2 },
    output: { type: 'weapon_roll', tier: 2 },
  },
  {
    id: 'plasma_lance',
    name: 'Lance plasma',
    description: re('plasmaLance'),
    category: 'arme',
    ingredients: { 'Cristaux énergétiques': 1, 'Composants électroniques': 2 },
    output: { type: 'weapon_roll', tier: 2 },
  },
  {
    id: 'tactical_weapon',
    name: 'Arme tactique',
    description: re('tacticalWeapon'),
    category: 'arme',
    ingredients: { 'Composants expérimentaux': 1, 'Outils lourds': 1, 'Métaux rares': 2 },
    output: { type: 'weapon_roll', tier: 3 },
  },
  {
    id: 'impulse_cannon',
    name: 'Canon à impulsion',
    description: re('impulseCannon'),
    category: 'arme',
    ingredients: { 'Technologies avancées': 1, 'Cristaux énergétiques': 2, 'Munitions spéciales': 2 },
    output: { type: 'weapon_roll', tier: 3 },
  },
  {
    id: 'exotic_weapon',
    name: 'Arme exotique artisanale',
    description: re('exoticWeapon'),
    category: 'arme',
    ingredients: { 'Technologies avancées': 2, 'Composants expérimentaux': 2, 'Cristaux énergétiques': 1 },
    output: { type: 'weapon_roll', tier: 4 },
  },

  {
    id: 'tactical_rifle',
    name: 'Carabine tactique',
    description: re('tacticalRifle'),
    category: 'arme',
    ingredients: { 'Équipement tactique': 2, 'Munitions': 3 },
    output: { type: 'weapon_roll', tier: 2 },
  },

  // ── ARMURES ───────────────────────────────────────────────────────────────
  {
    id: 'tactical_armor',
    name: 'Armure tactique',
    description: re('tacticalArmor'),
    category: 'armure',
    ingredients: { 'Composants tactiques': 3, 'Métaux bruts': 2 },
    output: { type: 'armor_roll', tier: 2 },
  },
  {
    id: 'jacket_plated',
    name: 'Veste blindée',
    description: re('jacketPlated'),
    category: 'armure',
    ingredients: { 'Métaux bruts': 3, 'Composants divers': 1 },
    output: { type: 'armor_roll', tier: 1 },
  },
  {
    id: 'combat_armor',
    name: 'Armure de combat',
    description: re('combatArmor'),
    category: 'armure',
    ingredients: { "Composants d'armure": 2, 'Métaux rares': 1 },
    output: { type: 'armor_roll', tier: 2 },
  },
  {
    id: 'reinforced_armor',
    name: 'Armure renforcée',
    description: re('reinforcedArmor'),
    category: 'armure',
    ingredients: { 'Technologies avancées': 1, 'Métaux rares': 3, 'Composants électroniques': 1 },
    output: { type: 'armor_roll', tier: 3 },
  },
  {
    id: 'elite_suit',
    name: 'Combinaison d\'élite',
    description: re('eliteSuit'),
    category: 'armure',
    ingredients: { 'Technologies avancées': 2, 'Composants expérimentaux': 2, 'Cristaux énergétiques': 1 },
    output: { type: 'armor_roll', tier: 4 },
  },

  // ── CONSOMMABLES ──────────────────────────────────────────────────────────
  {
    id: 'medkit',
    name: 'Kit médical',
    description: re('medkit'),
    category: 'consommable',
    ingredients: { 'Médicaments': 2, 'Eau purifiée': 1 },
    output: { type: 'cargo', item: 'Kit médical', quantity: 1 },
  },
  {
    id: 'medkit_adv',
    name: 'Kit médical premium',
    description: re('medkitAdv'),
    category: 'consommable',
    ingredients: { 'Médicaments premium': 1, 'Plantes médicinales': 2 },
    output: { type: 'cargo', item: 'Kit médical premium', quantity: 1 },
  },
  {
    id: 'emp_grenade',
    name: 'Grenade EMP',
    description: re('empGrenade'),
    category: 'consommable',
    ingredients: { 'Composants électroniques': 2, 'Ferraille': 1 },
    output: { type: 'cargo', item: 'Grenade EMP', quantity: 1 },
  },
  {
    id: 'stimulant',
    name: 'Stimulant de combat',
    description: re('stimulant'),
    category: 'consommable',
    ingredients: { 'Nourriture fraîche': 1, 'Plantes médicinales': 1 },
    output: { type: 'cargo', item: 'Stimulant', quantity: 2 },
  },
  {
    id: 'synth_fuel',
    name: 'Carburant de synthèse',
    description: re('synthFuel'),
    category: 'consommable',
    ingredients: { 'Eau purifiée': 3, 'Composants divers': 2 },
    output: { type: 'cargo', item: 'Carburant de synthèse', quantity: 1 },
  },
  {
    id: 'smoke_bomb',
    name: 'Bombe fumigène',
    description: re('smokeBomb'),
    category: 'consommable',
    ingredients: { 'Ferraille': 2, 'Composants divers': 2 },
    output: { type: 'cargo', item: 'Bombe fumigène', quantity: 1 },
  },

  // ── RESSOURCES ────────────────────────────────────────────────────────────
  {
    id: 'data_classified',
    name: 'Données classifiées',
    description: re('dataClassified'),
    category: 'ressource',
    ingredients: { 'Données': 2, 'Logiciels': 1 },
    output: { type: 'cargo', item: 'Données classifiées', quantity: 1 },
  },
  {
    id: 'rare_metal',
    name: 'Métaux rares purifiés',
    description: re('rareMetal'),
    category: 'ressource',
    ingredients: { 'Métaux bruts': 4, 'Composants électroniques': 1 },
    output: { type: 'cargo', item: 'Métaux rares', quantity: 2 },
  },

  // ── PIÈCES EXCLUSIVES À L'ATELIER ────────────────────────────────────────
  // N'existent nulle part ailleurs — aucune station ne les vend, aucun ennemi
  // ne les largue. Seul moyen de les obtenir : les fabriquer ici.
  {
    id: 'void_regulator',
    name: 'Régulateur de Vide',
    description: re('voidRegulator'),
    category: 'ressource',
    ingredients: { 'Cristaux énergétiques': 2, 'Composants électroniques': 2, 'Métaux rares': 1 },
    output: { type: 'cargo', item: 'Régulateur de Vide', quantity: 1 },
  },
  {
    id: 'ghost_nav_chip',
    name: 'Puce de Navigation Fantôme',
    description: re('ghostNavChip'),
    category: 'ressource',
    ingredients: { 'Données classifiées': 1, 'Composants électroniques': 1, 'Technologies avancées': 1 },
    output: { type: 'cargo', item: 'Puce de Navigation Fantôme', quantity: 1 },
  },
  {
    id: 'annealed_alloy',
    name: 'Alliage Recuit',
    description: re('annealedAlloy'),
    category: 'ressource',
    ingredients: { 'Métaux rares': 2, 'Métaux bruts': 3, 'Outils': 1 },
    output: { type: 'cargo', item: 'Alliage Recuit', quantity: 2 },
  },
  ]
}

export function getRecipeForItem(item: string): Recipe | undefined {
  return getRecipes().find(r => r.output.type === 'cargo' && r.output.item === item)
}

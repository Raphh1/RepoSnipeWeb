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

export const RECIPES: Recipe[] = [
  // ── ARMES ────────────────────────────────────────────────────────────────
  {
    id: 'blade_scrap',
    name: 'Lame de récupération',
    description: 'Ferraille soudée et taillée en pointe. Rudimentaire mais efficace.',
    category: 'arme',
    ingredients: { 'Ferraille': 3, 'Outils': 1 },
    output: { type: 'weapon_roll', tier: 1 },
  },
  {
    id: 'pistol_crude',
    name: 'Pistolet artisanal',
    description: 'Assemblage de pièces techniques et de métal. Ça tire, la plupart du temps.',
    category: 'arme',
    ingredients: { 'Métaux bruts': 2, 'Pièces techniques': 2 },
    output: { type: 'weapon_roll', tier: 1 },
  },
  {
    id: 'rifle_makeshift',
    name: 'Fusil de fortune',
    description: 'Portée améliorée, précision approximative. Mieux que rien en zone hostile.',
    category: 'arme',
    ingredients: { 'Métaux rares': 1, 'Munitions': 2, 'Composants divers': 2 },
    output: { type: 'weapon_roll', tier: 2 },
  },
  {
    id: 'plasma_lance',
    name: 'Lance plasma',
    description: 'Un cristal énergétique focalisé dans un tube de conducteurs. Brûle tout ce qu\'il touche.',
    category: 'arme',
    ingredients: { 'Cristaux énergétiques': 1, 'Composants électroniques': 2 },
    output: { type: 'weapon_roll', tier: 2 },
  },
  {
    id: 'tactical_weapon',
    name: 'Arme tactique',
    description: 'Construction solide à partir de matériaux lourds et de composants avancés.',
    category: 'arme',
    ingredients: { 'Composants expérimentaux': 1, 'Outils lourds': 1, 'Métaux rares': 2 },
    output: { type: 'weapon_roll', tier: 3 },
  },
  {
    id: 'impulse_cannon',
    name: 'Canon à impulsion',
    description: 'Combine munitions spéciales et technologie avancée pour des dégâts ravageurs.',
    category: 'arme',
    ingredients: { 'Technologies avancées': 1, 'Cristaux énergétiques': 2, 'Munitions spéciales': 2 },
    output: { type: 'weapon_roll', tier: 3 },
  },
  {
    id: 'exotic_weapon',
    name: 'Arme exotique artisanale',
    description: 'Le summum du craft. Nécessite des matériaux rares et une maîtrise totale.',
    category: 'arme',
    ingredients: { 'Technologies avancées': 2, 'Composants expérimentaux': 2, 'Cristaux énergétiques': 1 },
    output: { type: 'weapon_roll', tier: 4 },
  },

  // ── ARMURES ───────────────────────────────────────────────────────────────
  {
    id: 'jacket_plated',
    name: 'Veste blindée',
    description: 'Plaques métalliques cousues dans du textile épais. Simple mais solide.',
    category: 'armure',
    ingredients: { 'Métaux bruts': 3, 'Composants divers': 1 },
    output: { type: 'armor_roll', tier: 1 },
  },
  {
    id: 'combat_armor',
    name: 'Armure de combat',
    description: 'Construction renforcée avec des matériaux de récupération premium.',
    category: 'armure',
    ingredients: { "Composants d'armure": 2, 'Métaux rares': 1 },
    output: { type: 'armor_roll', tier: 2 },
  },
  {
    id: 'reinforced_armor',
    name: 'Armure renforcée',
    description: 'Alliage de métaux rares et de technologie avancée. Résiste à presque tout.',
    category: 'armure',
    ingredients: { 'Technologies avancées': 1, 'Métaux rares': 3, 'Composants électroniques': 1 },
    output: { type: 'armor_roll', tier: 3 },
  },
  {
    id: 'elite_suit',
    name: 'Combinaison d\'élite',
    description: 'Le meilleur qu\'un artisan puisse produire. Exige des matériaux rarissimes.',
    category: 'armure',
    ingredients: { 'Technologies avancées': 2, 'Composants expérimentaux': 2, 'Cristaux énergétiques': 1 },
    output: { type: 'armor_roll', tier: 4 },
  },

  // ── CONSOMMABLES ──────────────────────────────────────────────────────────
  {
    id: 'medkit',
    name: 'Kit médical',
    description: 'Soigne 30 PV depuis le hub de station. Utilise-le entre deux combats.',
    category: 'consommable',
    ingredients: { 'Médicaments': 2, 'Eau purifiée': 1 },
    output: { type: 'cargo', item: 'Kit médical', quantity: 1 },
  },
  {
    id: 'medkit_adv',
    name: 'Kit médical premium',
    description: 'Soigne 60 PV et restaure 2 stamina depuis le hub de station.',
    category: 'consommable',
    ingredients: { 'Médicaments premium': 1, 'Plantes médicinales': 2 },
    output: { type: 'cargo', item: 'Kit médical premium', quantity: 1 },
  },
  {
    id: 'emp_grenade',
    name: 'Grenade EMP',
    description: 'Étourdit l\'ennemi pendant 2 tours. À utiliser depuis l\'inventaire en combat.',
    category: 'consommable',
    ingredients: { 'Composants électroniques': 2, 'Ferraille': 1 },
    output: { type: 'cargo', item: 'Grenade EMP', quantity: 1 },
  },
  {
    id: 'stimulant',
    name: 'Stimulant de combat',
    description: 'Restaure 3 stamina depuis le hub. Composé de plantes et de nutriments.',
    category: 'consommable',
    ingredients: { 'Nourriture fraîche': 1, 'Plantes médicinales': 1 },
    output: { type: 'cargo', item: 'Stimulant', quantity: 2 },
  },
  {
    id: 'synth_fuel',
    name: 'Carburant de synthèse',
    description: 'Donne +2 carburant immédiatement à la fabrication. Instable mais fonctionnel.',
    category: 'consommable',
    ingredients: { 'Eau purifiée': 3, 'Composants divers': 2 },
    output: { type: 'cargo', item: 'Carburant de synthèse', quantity: 1 },
  },
  {
    id: 'smoke_bomb',
    name: 'Bombe fumigène',
    description: 'Garantit la fuite en combat. À utiliser depuis l\'inventaire en combat.',
    category: 'consommable',
    ingredients: { 'Ferraille': 2, 'Composants divers': 2 },
    output: { type: 'cargo', item: 'Bombe fumigène', quantity: 1 },
  },

  // ── RESSOURCES ────────────────────────────────────────────────────────────
  {
    id: 'data_classified',
    name: 'Données classifiées',
    description: 'Recompile deux lots de données ordinaires en informations à haute valeur marchande.',
    category: 'ressource',
    ingredients: { 'Données': 2, 'Logiciels': 1 },
    output: { type: 'cargo', item: 'Données classifiées', quantity: 1 },
  },
  {
    id: 'rare_metal',
    name: 'Métaux rares purifiés',
    description: 'Raffine des métaux bruts en alliage rare utilisable dans des crafts avancés.',
    category: 'ressource',
    ingredients: { 'Métaux bruts': 4, 'Composants électroniques': 1 },
    output: { type: 'cargo', item: 'Métaux rares', quantity: 2 },
  },
]

import type { StationData } from '../types'

export const STATIONS: StationData[] = [
  {
    name: 'La Carcasse',
    description: "Une épave orbitale reconvertie en station de fortune. Ça pue la sueur et le métal fondu. C'est ici que tout commence.",
    danger: 0, type: 'dangerous',
    goods: ['Médicaments', 'Métaux bruts', 'Nourriture synthétique', 'Carburant de récup'],
    fuelCostFrom: { 'Port Méridien': 2, 'Les Bas-Fonds de Vega': 3, 'Fort Kharos': 4, 'Station Rocaille': 3 },
  },
  {
    name: 'Port Méridien',
    description: "Hub commercial légal. Des agents de sécurité partout. Des marchands souriants qui te détestent.",
    danger: 0, type: 'peaceful',
    goods: ['Médicaments', 'Composants électroniques', 'Vêtements', 'Nourriture synthétique', 'Outils'],
    fuelCostFrom: { 'La Carcasse': 2, 'Nexus Aldara': 2, 'Fort Kharos': 3, 'Les Bas-Fonds de Vega': 4, 'Colonie Perséphone': 3 },
  },
  {
    name: 'Les Bas-Fonds de Vega',
    description: "Marché noir. Tout se vend, tout s'achète. Ton âme incluse si le prix est bon.",
    danger: 2, type: 'dangerous',
    goods: ['Armes illégales', 'Drogues de synthèse', 'Données volées', 'Pièces de contrebande'],
    fuelCostFrom: { 'La Carcasse': 3, 'Port Méridien': 4, 'Arc Ouest Apocalypse': 2 },
  },
  {
    name: 'Fort Kharos',
    description: "Station militaire. Entrée réglementée. Les gardes ne plaisantent pas, et les canons sont toujours chargés.",
    danger: 1, type: 'military',
    goods: ['Armures légères', 'Rations militaires', 'Munitions', 'Composants tactiques'],
    fuelCostFrom: { 'La Carcasse': 4, 'Port Méridien': 3, 'Nexus Aldara': 3, 'Fort Ossian': 3 },
  },
  {
    name: 'Nexus Aldara',
    description: "Carrefour technologique. Les meilleurs hackers et ingénieurs y vivent — ou y meurent.",
    danger: 1, type: 'scientific',
    goods: ['Composants électroniques', 'Implants', 'Logiciels', 'Données'],
    fuelCostFrom: { 'Port Méridien': 2, 'Fort Kharos': 3, 'Le Purgatoire': 3 },
  },
  {
    name: 'Arc Ouest Apocalypse',
    description: "Territoire d'Alanossa. Personne n'entre sans permission. Personne ne sort sans cicatrices.",
    danger: 3, type: 'dangerous',
    goods: ['Armes lourdes', 'Matériel de pillage', 'Butin de guerre'],
    fuelCostFrom: { 'Les Bas-Fonds de Vega': 2, 'Le Nid des Faucons': 3 },
  },
  {
    name: 'Le Purgatoire',
    description: "Ancienne prison reconvertie. Les geôliers sont partis. Les habitants sont restés. C'est tout ce qu'il faut savoir.",
    danger: 2, type: 'ruins',
    goods: ['Nourriture synthétique', 'Médicaments bas de gamme', 'Objets de contrebande'],
    fuelCostFrom: { 'Nexus Aldara': 3, 'Fort Ossian': 2 },
  },
  {
    name: 'Le Nid des Faucons',
    description: "Quartier général des Faucons Noirs. Propre, militarisé, mortel.",
    danger: 3, type: 'military',
    goods: ['Équipement tactique', 'Armures Faucon', 'Intel faction'],
    fuelCostFrom: { 'Arc Ouest Apocalypse': 3, 'La Citadelle Écarlate': 2 },
  },
  {
    name: 'Fort Ossian',
    description: "Forteresse des confins. Soldats en rotation, ambiance de front. Rien n'entre facilement.",
    danger: 1, type: 'military',
    goods: ['Rations', 'Armures', 'Munitions lourdes'],
    fuelCostFrom: { 'Le Purgatoire': 2, 'Nexus Aldara': 4, 'Colonie Perséphone': 3 },
  },
  {
    name: 'Colonie Perséphone',
    description: "Colonie agricole. Calme en surface. Des tensions profondes sous la terre.",
    danger: 0, type: 'peaceful',
    goods: ['Nourriture fraîche', 'Eau purifiée', 'Minerais', 'Équipement agricole'],
    fuelCostFrom: { 'Fort Ossian': 3, 'Station Rocaille': 2, 'Port Méridien': 3 },
  },
  {
    name: 'Station Rocaille',
    description: "Station minière sur un astéroïde. Les mineurs sont durs. Les tarifs sont durs. Tout est dur.",
    danger: 1, type: 'industrial',
    goods: ['Métaux rares', 'Cristaux énergétiques', 'Outils lourds'],
    fuelCostFrom: { 'Colonie Perséphone': 2, 'La Forge Noire': 2, 'La Carcasse': 3 },
  },
  {
    name: 'La Forge Noire',
    description: "Usine flottante illégale. Ils fabriquent des armes sans licence. Excellentes armes.",
    danger: 2, type: 'industrial',
    goods: ['Armes artisanales', "Composants d'armure", 'Matériaux interdits'],
    fuelCostFrom: { 'Station Rocaille': 2, "L'Entrepôt Zéro": 3 },
  },
  {
    name: "L'Entrepôt Zéro",
    description: "Entrepôt spatial géant dont personne ne revendique la propriété. Parfait pour cacher des choses.",
    danger: 2, type: 'ruins',
    goods: ['Marchandises volées', 'Composants divers', 'Informations monnayables'],
    fuelCostFrom: { 'La Forge Noire': 3, 'Emporium Requiem': 3 },
  },
  {
    name: 'Emporium Requiem',
    description: "Le plus grand marché de la région. Légal en façade. Tout le reste derrière.",
    danger: 2, type: 'luxury',
    goods: ['Tout type de marchandise', 'Armes Tier 3', 'Armures premium'],
    fuelCostFrom: { "L'Entrepôt Zéro": 3, 'Star Quest': 2, 'Les Abysses de Velkor': 4 },
  },
  {
    name: 'Star Quest',
    description: "Station de loisirs pour riches. Casino, arènes de combat, cliniques privées. Tout à prix d'or.",
    danger: 1, type: 'luxury',
    goods: ['Luxe', 'Médicaments premium', 'Informations VIP'],
    fuelCostFrom: { 'Emporium Requiem': 2, "La Couronne d'Eos": 3 },
  },
  {
    name: 'La Citadelle Écarlate',
    description: "Bastion des Faucons Rouges. Une faction rivale des Faucons Noirs. Aussi violents.",
    danger: 3, type: 'military',
    goods: ["Armures d'élite", 'Armes lourdes', 'Munitions spéciales'],
    fuelCostFrom: { 'Le Nid des Faucons': 2, 'Scotty Golden North': 4 },
  },
  {
    name: 'Les Abysses de Velkor',
    description: "Station de recherche abandonnée, reconvertie par des exilés. Sombre. Dangereuse. Fascinante.",
    danger: 3, type: 'ruins',
    goods: ['Artefacts', 'Composants expérimentaux', 'Données classifiées'],
    fuelCostFrom: { 'Emporium Requiem': 4, 'Scotty Golden North': 3 },
  },
  {
    name: 'Scotty Golden North',
    description: "Station de commerce du bout du monde. Loin de tout. Proche de rien. Les prix reflètent.",
    danger: 2, type: 'peaceful',
    goods: ['Métaux rares', 'Carburant premium', 'Armes exotiques'],
    fuelCostFrom: { 'La Citadelle Écarlate': 4, 'Les Abysses de Velkor': 3, "La Couronne d'Eos": 4 },
  },
  {
    name: "La Couronne d'Eos",
    description: "Station orbitale de prestige. Les élites se réunissent ici pour décider du sort des autres.",
    danger: 2, type: 'luxury',
    goods: ['Technologies avancées', 'Armes Tier 4', 'Armures Tier 4', 'Renseignements'],
    fuelCostFrom: { 'Star Quest': 3, 'Scotty Golden North': 4 },
  },

  // ── SOUS-STATIONS FAUCONS NOIRS ─────────────────────────────────────────────
  { name: 'Le Perchoir',
    description: "Avant-poste Faucon sur un astéroïde. Petit, sombre, toujours surveillé.",
    danger: 2, type: 'military',
    goods: ['Intel faction', 'Munitions', 'Rations militaires'],
    fuelCostFrom: { 'Arc Ouest Apocalypse': 1, 'Le Nid des Faucons': 3, 'Station Ombre': 2, 'Relais Noir': 2 } },

  { name: 'Station Ombre',
    description: "Base d'opérations clandestines des Faucons. Officiellement inexistante.",
    danger: 3, type: 'dangerous',
    goods: ['Armes lourdes', 'Données volées', 'Équipement tactique'],
    fuelCostFrom: { 'Le Nid des Faucons': 1, 'Le Perchoir': 2, 'La Tanière': 3 } },

  { name: 'Relais Noir',
    description: "Point de ravitaillement Faucon. Ouvert à ceux qui savent comment demander.",
    danger: 1, type: 'industrial',
    goods: ['Carburant de récup', 'Munitions', 'Pièces techniques'],
    fuelCostFrom: { 'Arc Ouest Apocalypse': 2, 'Les Bas-Fonds de Vega': 3, 'Le Perchoir': 2 } },

  { name: 'La Tanière',
    description: "Ancien repaire pirate repris par Alanossa. Loyauté absolue requise pour entrer.",
    danger: 3, type: 'ruins',
    goods: ['Butin de guerre', 'Armes artisanales', 'Matériel de pillage'],
    fuelCostFrom: { 'Arc Ouest Apocalypse': 2, 'Le Perchoir': 1, 'Station Ombre': 3 } },

  { name: 'Fort de Cendres',
    description: "Fortin Faucon sur les ruines d'un avant-poste militaire. Murs noirs. Soldats efficaces.",
    danger: 2, type: 'military',
    goods: ['Armures Faucon', 'Équipement tactique', 'Rations militaires'],
    fuelCostFrom: { 'Le Nid des Faucons': 2, 'Station Ombre': 2, 'La Citadelle Écarlate': 4 } },

  { name: "L'Œil du Faucon",
    description: "Station d'observation et d'écoute. Les Faucons voient tout depuis ici — ou presque.",
    danger: 2, type: 'scientific',
    goods: ['Données classifiées', 'Logiciels', 'Renseignements'],
    fuelCostFrom: { 'Arc Ouest Apocalypse': 2, 'Nexus Aldara': 4, 'Relais Noir': 3 } },

  { name: 'Repaire Vega-Sud',
    description: "Satellite criminel des Bas-Fonds. Ce qui est trop risqué là-haut finit ici.",
    danger: 3, type: 'dangerous',
    goods: ['Armes illégales', 'Drogues de synthèse', 'Matériaux interdits'],
    fuelCostFrom: { 'Les Bas-Fonds de Vega': 2, 'Arc Ouest Apocalypse': 3, 'Port de Nuit': 2 } },

  // ── GARDIENS ÉCARLATES ───────────────────────────────────────────────────────
  { name: 'Bastion Mineur',
    description: "Garnison secondaire des Gardiens. Moins imposant que la Citadelle. Tout aussi sérieux.",
    danger: 1, type: 'military',
    goods: ['Armures légères', 'Munitions', 'Rations'],
    fuelCostFrom: { 'La Citadelle Écarlate': 1, 'Le Nid des Faucons': 3, "L'Arsenal Écarlate": 1 } },

  { name: 'Poste Vigie',
    description: "Poste d'observation des Gardiens aux confins de leur territoire. Une vigie, deux soldats, une longue-vue.",
    danger: 1, type: 'military',
    goods: ['Munitions', 'Renseignements', 'Rations militaires'],
    fuelCostFrom: { 'Fort Ossian': 1, 'Fort Kharos': 4, 'Bastion Mineur': 3 } },

  { name: "L'Arsenal Écarlate",
    description: "Dépôt d'armes des Gardiens. Mieux gardé que certaines banques.",
    danger: 2, type: 'military',
    goods: ["Armures d'élite", 'Armes lourdes', 'Munitions spéciales'],
    fuelCostFrom: { 'La Citadelle Écarlate': 2, 'Bastion Mineur': 1 } },

  { name: 'La Forteresse Exilée',
    description: "Ancien fort des Gardiens dont les occupants ont été bannis. Quelqu'un d'autre s'en est emparé.",
    danger: 3, type: 'military',
    goods: ['Armes lourdes', 'Munitions spéciales', 'Équipement tactique'],
    fuelCostFrom: { 'La Citadelle Écarlate': 4, "L'Arsenal Écarlate": 3, 'La Forge Noire': 4 } },

  // ── EMPORIUM ─────────────────────────────────────────────────────────────────
  { name: 'Comptoir Sud',
    description: "Antenne commerciale de l'Emporium. Plus accessible. Moins bien achalandé.",
    danger: 1, type: 'luxury',
    goods: ['Médicaments premium', 'Luxe', 'Composants électroniques'],
    fuelCostFrom: { 'Emporium Requiem': 1, 'Star Quest': 3, "L'Entrepôt Zéro": 2, 'Relais de Transit': 2 } },

  { name: 'Annexe Commerciale',
    description: "Bureau de représentation de l'Emporium. Présentable. Discret. Utile.",
    danger: 0, type: 'peaceful',
    goods: ['Vêtements', 'Nourriture synthétique', 'Composants électroniques'],
    fuelCostFrom: { 'Emporium Requiem': 2, 'Comptoir Sud': 1, "La Couronne d'Eos": 3 } },

  { name: 'Relais de Transit',
    description: "Hub logistique de l'Emporium. Les marchandises transitent. Les secrets aussi.",
    danger: 1, type: 'industrial',
    goods: ['Pièces techniques', 'Composants divers', 'Carburant de récup'],
    fuelCostFrom: { 'Emporium Requiem': 2, "L'Entrepôt Zéro": 2, 'Comptoir Sud': 2 } },

  // ── HAUTE SOCIÉTÉ ─────────────────────────────────────────────────────────────
  { name: 'Résidence Orbitale',
    description: "Logements privés pour l'élite orbitale. Sécurité discrète mais totale.",
    danger: 0, type: 'luxury',
    goods: ['Luxe', 'Technologies avancées', 'Médicaments premium'],
    fuelCostFrom: { "La Couronne d'Eos": 1, 'Star Quest': 2, 'Annexe Commerciale': 3 } },

  { name: "Club Privé Éos",
    description: "Salon de rencontres pour décideurs. Accès sur invitation. Ce qui s'y dit ne sort pas.",
    danger: 1, type: 'luxury',
    goods: ['Informations VIP', 'Renseignements', 'Luxe'],
    fuelCostFrom: { "La Couronne d'Eos": 2, 'Résidence Orbitale': 1, 'Star Quest': 3 } },

  // ── STATIONS ABANDONNÉES / MYSTÉRIEUSES ──────────────────────────────────────
  { name: 'Les Cendres',
    description: "Ce qui reste d'une station détruite. Quelqu'un l'a brûlée. Quelqu'un y vit quand même.",
    danger: 2, type: 'ruins',
    goods: ['Artefacts', 'Composants divers', 'Ferraille'],
    fuelCostFrom: { 'Le Purgatoire': 2, 'Les Abysses de Velkor': 3, 'Station Quarantaine': 3 } },

  { name: 'Station Quarantaine',
    description: "Mise sous quarantaine il y a vingt ans. Levée officiellement. Les gens qui sont restés, non.",
    danger: 3, type: 'ruins',
    goods: ['Données classifiées', 'Composants expérimentaux', 'Artefacts'],
    fuelCostFrom: { 'Les Abysses de Velkor': 4, 'Les Cendres': 3, "L'Épave Vivante": 4 } },

  { name: 'Le Berceau',
    description: "Station ancienne — antérieure à tous les conflits actuels. Quelque chose a commencé ici.",
    danger: 2, type: 'ruins',
    goods: ['Artefacts', 'Données', 'Données classifiées'],
    fuelCostFrom: { 'Nexus Aldara': 2, 'Le Purgatoire': 4, 'Station Zéphyr': 3 } },

  { name: "L'Épave Vivante",
    description: "Un cargo-géant en orbite devenu station par accumulation humaine. Ça tient parce que ça a toujours tenu.",
    danger: 2, type: 'ruins',
    goods: ['Ferraille', 'Marchandises volées', 'Composants divers'],
    fuelCostFrom: { "L'Entrepôt Zéro": 3, 'Station Quarantaine': 4, 'Les Cendres': 4 } },

  { name: 'Station Fantôme',
    description: "Officiellement vide depuis dix ans. Les signaux venant d'ici sont officiellement des interférences.",
    danger: 3, type: 'ruins',
    goods: ['Données volées', 'Matériaux interdits', 'Artefacts'],
    fuelCostFrom: { 'Station Rocaille': 2, 'La Forge Noire': 3, 'Les Cavernes de Mira': 2 } },

  // ── STATIONS NEUTRES ──────────────────────────────────────────────────────────
  { name: "L'Oasis de Fer",
    description: "Zone neutre garantie par accord entre factions rivales. Personne ne tire ici — trop d'intérêts en jeu.",
    danger: 1, type: 'peaceful',
    goods: ['Médicaments', 'Carburant de récup', 'Nourriture fraîche'],
    fuelCostFrom: { 'Le Purgatoire': 3, 'La Citadelle Écarlate': 3, 'Fort Ossian': 4 } },

  { name: 'La Balise',
    description: "Station de navigation. Signal d'orientation pour tous les pilotes du secteur.",
    danger: 0, type: 'peaceful',
    goods: ['Eau purifiée', 'Nourriture synthétique', 'Carburant de récup'],
    fuelCostFrom: { 'Colonie Perséphone': 2, 'Fort Ossian': 3, 'Confluent': 3 } },

  { name: 'Confluent',
    description: "Carrefour de routes commerciales. Ni riche ni pauvre. Juste au milieu de tout.",
    danger: 1, type: 'peaceful',
    goods: ['Médicaments', 'Vivres', 'Outils', 'Carburant de récup'],
    fuelCostFrom: { 'Port Méridien': 3, 'Fort Kharos': 2, 'Colonie Perséphone': 4, 'La Balise': 3 } },

  { name: 'Port de Nuit',
    description: "Marché nocturne flottant. Tout ce que les Bas-Fonds vendent officiellement, Port de Nuit le vend discrètement.",
    danger: 2, type: 'dangerous',
    goods: ['Drogues de synthèse', 'Armes illégales', 'Informations monnayables'],
    fuelCostFrom: { 'Les Bas-Fonds de Vega': 2, 'Repaire Vega-Sud': 2, "L'Entrepôt Zéro": 3 } },

  // ── SCIENTIFIQUES / EXPLORATION ───────────────────────────────────────────────
  { name: 'Station Zéphyr',
    description: "Recherche atmosphérique sur les géantes gazeuses proches. Scientifiques brillants. Sécurité minimale.",
    danger: 1, type: 'scientific',
    goods: ['Composants expérimentaux', 'Données', 'Implants'],
    fuelCostFrom: { 'Nexus Aldara': 2, 'Le Berceau': 3, 'Fort Kharos': 4 } },

  { name: "L'Observatoire",
    description: "Station d'observation du vide profond. Trop loin de tout pour que quoi que ce soit s'y produise.",
    danger: 0, type: 'scientific',
    goods: ['Données', 'Logiciels', 'Composants électroniques'],
    fuelCostFrom: { 'Colonie Perséphone': 4, 'La Balise': 3, 'Station Zéphyr': 4 } },

  { name: 'Station Limite',
    description: "Dernier avant-poste cartographié. Les pilotes qui vont plus loin ne reviennent pas toujours.",
    danger: 2, type: 'scientific',
    goods: ['Données classifiées', 'Carburant premium', 'Composants expérimentaux'],
    fuelCostFrom: { 'Scotty Golden North': 3, 'Les Abysses de Velkor': 4, "L'Observatoire": 4 } },

  // ── INDUSTRIELS ────────────────────────────────────────────────────────────────
  { name: 'Les Cavernes de Mira',
    description: "Galeries creusées dans un astéroïde massif. Les mineurs ont trouvé autre chose que du minerai. Ils n'en parlent pas.",
    danger: 1, type: 'industrial',
    goods: ['Métaux rares', 'Cristaux énergétiques', 'Artefacts'],
    fuelCostFrom: { 'Station Rocaille': 2, 'Station Fantôme': 2, 'La Forge Noire': 3 } },

  { name: 'La Raffinerie',
    description: "Plateforme de raffinage orbital. Chaleur, bruit, rendement. Les ouvriers repartent différents.",
    danger: 2, type: 'industrial',
    goods: ['Carburant premium', 'Métaux rares', 'Cristaux énergétiques'],
    fuelCostFrom: { 'La Forge Noire': 1, 'Les Cavernes de Mira': 2, 'Station Rocaille': 4 } },
]

export function getStation(name: string): StationData {
  return STATIONS.find(s => s.name === name) ?? STATIONS[0]
}

export function getAccessibleStations(currentName: string): StationData[] {
  return STATIONS.filter(s => {
    if (s.name === currentName) return false
    const cost = s.fuelCostFrom[currentName]
    return cost !== undefined
  })
}

export function getFuelCost(from: string, to: string): number {
  const dest = getStation(to)
  return dest.fuelCostFrom[from] ?? 99
}

export const PEACEFUL_STATIONS = new Set([
  'Port Méridien', 'Colonie Perséphone', 'Star Quest', 'Scotty Golden North'
])

export const BOSS_STATIONS: Record<string, string> = {
  'Arc Ouest Apocalypse':   'Alanossa',
  'Le Nid des Faucons':     'La Faucon',
  'Les Abysses de Velkor':  'Directeur Pale',
  'Star Quest':             "Garde du Corps d'Eliotis",
  'Emporium Requiem':       'Directeur Pale',
  'La Citadelle Écarlate':  'La Faucon',
  'Scotty Golden North':    "Garde du Corps d'Eliotis",
  "La Couronne d'Eos":      'Alanossa',
  'Station Ombre':          'Le Fantôme des Ombres',
  'La Tanière':             'La Bête Noire',
  'Repaire Vega-Sud':       'La Veuve de Vega',
  'La Forteresse Exilée':   "L'Exilé Écarlate",
  'Station Quarantaine':    'Patient Zéro',
  'Station Fantôme':        "L'Ombre du Vide",
  'Port de Nuit':           'Le Roi de Nuit',
}

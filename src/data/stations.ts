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
    fuelCostFrom: { 'La Carcasse': 2, 'Nexus Aldara': 2, 'Fort Kharos': 3, 'Les Bas-Fonds de Vega': 4, 'Colonie Perséphone': 3, 'Paradoxa Eterna': 4, 'Le Sanctuaire des Dérives': 3, 'Le Grand Bazar': 3 },
  },
  {
    name: 'Les Bas-Fonds de Vega',
    description: "Marché noir. Tout se vend, tout s'achète. Ton âme incluse si le prix est bon.",
    danger: 2, type: 'dangerous',
    goods: ['Armes illégales', 'Drogues de synthèse', 'Données volées', 'Pièces de contrebande'],
    fuelCostFrom: { 'La Carcasse': 3, 'Port Méridien': 4, 'Arc Ouest Apocalypse': 2, 'Port des Brumes': 2 },
    exclusiveGoods: ['Armes illégales', 'Drogues de synthèse'],
  },
  {
    name: 'Fort Kharos',
    description: "Station militaire. Entrée réglementée. Les gardes ne plaisantent pas, et les canons sont toujours chargés.",
    danger: 1, type: 'military',
    goods: ['Équipements blindés', 'Rations militaires', 'Munitions', 'Composants tactiques'],
    fuelCostFrom: { 'La Carcasse': 4, 'Port Méridien': 3, 'Nexus Aldara': 3, 'Fort Ossian': 3 },
  },
  {
    name: 'Nexus Aldara',
    description: "Carrefour technologique. Les meilleurs hackers et ingénieurs y vivent — ou y meurent.",
    danger: 1, type: 'scientific',
    goods: ['Composants électroniques', 'Implants', 'Logiciels', 'Données'],
    fuelCostFrom: { 'Port Méridien': 2, 'Fort Kharos': 3, 'Le Purgatoire': 3, 'Sanctum Machina': 2, "L'Œil du Faucon": 4, 'Le Grand Bazar': 3 },
    exclusiveGoods: ['Implants', 'Logiciels'],
  },
  {
    name: 'Arc Ouest Apocalypse',
    description: "Territoire d'Alanossa. Personne n'entre sans permission. Personne ne sort sans cicatrices.",
    danger: 3, type: 'dangerous',
    goods: ['Armes lourdes', 'Matériel de pillage', 'Butin de guerre'],
    fuelCostFrom: { 'Les Bas-Fonds de Vega': 2, 'Le Nid des Faucons': 3, "L'Œil du Faucon": 2 },
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
    fuelCostFrom: { 'Arc Ouest Apocalypse': 3, 'La Citadelle Écarlate': 2, 'Fort de Cendres': 2 },
  },
  {
    name: 'Fort Ossian',
    description: "Forteresse des confins. Soldats en rotation, ambiance de front. Rien n'entre facilement.",
    danger: 1, type: 'military',
    goods: ['Rations', 'Armures', 'Munitions lourdes'],
    fuelCostFrom: { 'Le Purgatoire': 2, 'Nexus Aldara': 4, 'Colonie Perséphone': 3, 'Poste Vigie': 1, "L'Oasis de Fer": 3 },
  },
  {
    name: 'Colonie Perséphone',
    description: "Colonie agricole. Calme en surface. Des tensions profondes sous la terre.",
    danger: 0, type: 'peaceful',
    goods: ['Nourriture fraîche', 'Eau purifiée', 'Minerais', 'Équipement agricole'],
    fuelCostFrom: { 'Fort Ossian': 3, 'Station Rocaille': 2, 'Port Méridien': 3, 'Paradoxa Eterna': 3 },
    specialService: 'rest_bonus',
    exclusiveGoods: ['Nourriture fraîche', 'Équipement agricole'],
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
    fuelCostFrom: { 'Station Rocaille': 2, "L'Entrepôt Zéro": 3, 'La Forge des Damnés': 2, 'Forge Alpha': 2 },
    specialService: 'weapon_forge',
    exclusiveGoods: ['Armes artisanales', "Composants d'armure"],
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
    description: "Planète artificielle de Cesarion. Douane stricte, armée omniprésente — mais les meilleurs marchands d'armes du secteur s'y trouvent. L'accès se mérite.",
    danger: 2, type: 'luxury',
    goods: ['Armes Tier 4', 'Armures premium', 'Équipement militaire d\'élite', 'Composants tactiques'],
    fuelCostFrom: { "L'Entrepôt Zéro": 3, 'Star Quest': 2, 'Les Abysses de Velkor': 4, 'Annexe Commerciale': 2 },
    exclusiveGoods: ['Armes Tier 4', 'Équipement militaire d\'élite'],
  },
  {
    name: 'Star Quest',
    description: "Station de loisirs pour riches. Arènes de combat, cliniques privées, divertissements exclusifs. Le casino, c'est à Scotty — ici on joue autrement.",
    danger: 1, type: 'luxury',
    goods: ['Luxe', 'Médicaments premium', 'Informations VIP', 'Or'],
    fuelCostFrom: { 'Emporium Requiem': 2, "La Couronne d'Eos": 3, 'La Tribosphère': 3, "L'Arène de Korsun": 2 },
  },
  {
    name: 'La Citadelle Écarlate',
    description: "Bastion des Faucons Rouges. Une faction rivale des Faucons Noirs. Aussi violents.",
    danger: 3, type: 'military',
    goods: ["Armures d'élite", 'Armes lourdes', 'Munitions spéciales'],
    fuelCostFrom: { 'Le Nid des Faucons': 2, 'Scotty Golden North': 4, 'La Forteresse Exilée': 4, 'Fort de Cendres': 4 },
  },
  {
    name: 'Les Abysses de Velkor',
    description: "Station de recherche abandonnée, reconvertie par des exilés. Sombre. Dangereuse. Fascinante.",
    danger: 3, type: 'ruins',
    goods: ['Artefacts', 'Composants expérimentaux', 'Données classifiées'],
    fuelCostFrom: { 'Emporium Requiem': 4, 'Scotty Golden North': 3, "L'Arc Perdu": 5 },
  },
  {
    name: 'Scotty Golden North',
    description: "Le royaume de Samy Scotty. Casino, jeux d'argent, paris sur tout et n'importe quoi — c'est ici que les crédits du secteur finissent leur vie. Loin de tout, mais bien réel.",
    danger: 2, type: 'peaceful',
    goods: ['Jetons de casino', 'Armes exotiques', 'Informations VIP', 'Luxe'],
    fuelCostFrom: { 'La Citadelle Écarlate': 4, 'Les Abysses de Velkor': 3, "La Couronne d'Eos": 4, 'La Tribosphère': 3, 'Station Limite': 3 },
    specialService: 'gambling',
    exclusiveGoods: ['Jetons de casino', 'Armes exotiques'],
  },
  {
    name: "La Couronne d'Eos",
    description: "Station orbitale de prestige. Les élites se réunissent ici pour décider du sort des autres.",
    danger: 2, type: 'luxury',
    goods: ['Technologies avancées', 'Armes Tier 4', 'Armures Tier 4', 'Renseignements', 'Or'],
    fuelCostFrom: { 'Star Quest': 3, 'Scotty Golden North': 4, 'La Tribosphère': 4, "Club Privé Éos": 2, 'Résidence Orbitale': 1 },
    exclusiveGoods: ['Technologies avancées', 'Armures Tier 4', 'Renseignements'],
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
    goods: ['Armes lourdes', 'Données volées', 'Équipement tactique', 'Matériel de guerre', 'Implants militaires'],
    fuelCostFrom: { 'Le Nid des Faucons': 1, 'Le Perchoir': 2, 'La Tanière': 3, 'Fort de Cendres': 2 } },

  { name: 'Relais Noir',
    description: "Point de ravitaillement Faucon. Ouvert à ceux qui savent comment demander.",
    danger: 1, type: 'industrial',
    goods: ['Carburant de récup', 'Munitions', 'Pièces techniques', 'Composants électroniques', 'Outils lourds'],
    fuelCostFrom: { 'Arc Ouest Apocalypse': 2, 'Les Bas-Fonds de Vega': 3, 'Le Perchoir': 2, "L'Œil du Faucon": 3 } },

  { name: 'La Tanière',
    description: "Ancien repaire pirate repris par Alanossa. Loyauté absolue requise pour entrer.",
    danger: 3, type: 'ruins',
    goods: ['Butin de guerre', 'Armes artisanales', 'Matériel de pillage'],
    fuelCostFrom: { 'Arc Ouest Apocalypse': 2, 'Le Perchoir': 1, 'Station Ombre': 3 } },

  { name: 'Fort de Cendres',
    description: "Fortin Faucon sur les ruines d'un avant-poste militaire. Murs noirs. Soldats efficaces.",
    danger: 2, type: 'military',
    goods: ['Armures Faucon', 'Équipement tactique', 'Rations militaires'],
    fuelCostFrom: { 'Le Nid des Faucons': 2, 'Station Ombre': 2, 'La Citadelle Écarlate': 4, 'Le Perchoir': 3 } },

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
    goods: ['Équipements blindés', 'Munitions', 'Rations'],
    fuelCostFrom: { 'La Citadelle Écarlate': 1, 'Le Nid des Faucons': 3, "L'Arsenal Écarlate": 1 } },

  { name: 'Poste Vigie',
    description: "Poste d'observation des Gardiens aux confins de leur territoire. Une vigie, deux soldats, une longue-vue.",
    danger: 1, type: 'military',
    goods: ['Munitions', 'Renseignements', 'Rations militaires', 'Équipements blindés', 'Composants tactiques'],
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
    fuelCostFrom: { 'La Citadelle Écarlate': 4, "L'Arsenal Écarlate": 3, 'La Forge Noire': 4, 'Station Limite': 4 } },

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
    fuelCostFrom: { 'Emporium Requiem': 2, "L'Entrepôt Zéro": 2, 'Comptoir Sud': 2, 'Le Grand Bazar': 3 } },

  // ── HAUTE SOCIÉTÉ ─────────────────────────────────────────────────────────────
  { name: 'Résidence Orbitale',
    description: "Logements privés pour l'élite orbitale. Sécurité discrète mais totale.",
    danger: 0, type: 'luxury',
    goods: ['Luxe', 'Technologies avancées', 'Médicaments premium', 'Or'],
    fuelCostFrom: { "La Couronne d'Eos": 1, 'Star Quest': 2, 'Annexe Commerciale': 3 } },

  { name: "Club Privé Éos",
    description: "Salon de rencontres pour décideurs. Accès sur invitation. Ce qui s'y dit ne sort pas.",
    danger: 1, type: 'luxury',
    goods: ['Informations VIP', 'Renseignements', 'Luxe', 'Or'],
    fuelCostFrom: { "La Couronne d'Eos": 2, 'Résidence Orbitale': 1, 'Star Quest': 3 } },

  // ── STATIONS ABANDONNÉES / MYSTÉRIEUSES ──────────────────────────────────────
  { name: 'Les Cendres',
    description: "Ce qui reste d'une station détruite. Quelqu'un l'a brûlée. Quelqu'un y vit quand même.",
    danger: 2, type: 'ruins',
    goods: ['Artefacts', 'Composants divers', 'Ferraille', 'Eau purifiée', 'Médicaments bas de gamme'],
    fuelCostFrom: { 'Le Purgatoire': 2, 'Les Abysses de Velkor': 3, 'Station Quarantaine': 3 } },

  { name: 'Station Quarantaine',
    description: "Mise sous quarantaine il y a vingt ans. Levée officiellement. Les gens qui sont restés, non.",
    danger: 3, type: 'ruins',
    goods: ['Données classifiées', 'Composants expérimentaux', 'Artefacts'],
    fuelCostFrom: { 'Les Abysses de Velkor': 4, 'Les Cendres': 3, "L'Épave Vivante": 4, "L'Arc Perdu": 6 },
    exclusiveGoods: ['Composants expérimentaux'] },

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
    fuelCostFrom: { 'Colonie Perséphone': 2, 'Fort Ossian': 3, 'Confluent': 3, 'Paradoxa Eterna': 4 } },

  { name: 'Confluent',
    description: "Carrefour de routes commerciales. Ni riche ni pauvre. Juste au milieu de tout.",
    danger: 1, type: 'peaceful',
    goods: ['Médicaments', 'Vivres', 'Outils', 'Carburant de récup'],
    fuelCostFrom: { 'Port Méridien': 3, 'Fort Kharos': 2, 'Colonie Perséphone': 4, 'La Balise': 3, 'Le Grand Bazar': 2 } },

  { name: 'Port de Nuit',
    description: "Marché nocturne flottant. Tout ce que les Bas-Fonds vendent officiellement, Port de Nuit le vend discrètement.",
    danger: 2, type: 'dangerous',
    goods: ['Drogues de synthèse', 'Armes illégales', 'Informations monnayables'],
    fuelCostFrom: { 'Les Bas-Fonds de Vega': 2, 'Repaire Vega-Sud': 2, "L'Entrepôt Zéro": 3 } },

  // ── GRAND MARCHÉ DE CRAFT ─────────────────────────────────────────────────────
  { name: 'Le Grand Bazar',
    description: "Un marché-monde gigantesque, neutre, où tout ce qui sert à fabriquer se vend. Des allées sans fin de matériaux, composants et ressources. Une règle : ici on vend de quoi CONSTRUIRE, jamais d'armes toutes faites.",
    danger: 0, type: 'industrial',
    goods: [
      'Ferraille', 'Outils', 'Outils lourds', 'Métaux bruts', 'Métaux rares',
      'Pièces techniques', 'Composants divers', 'Composants électroniques',
      'Composants tactiques', "Composants d'armure", 'Composants expérimentaux',
      'Cristaux énergétiques', 'Technologies avancées', 'Munitions', 'Munitions spéciales',
      'Équipement tactique', 'Médicaments', 'Médicaments premium', 'Plantes médicinales',
      'Eau purifiée', 'Nourriture fraîche', 'Données', 'Logiciels', 'Carburant de récup',
    ],
    fuelCostFrom: { 'Port Méridien': 3, 'Confluent': 2, 'Nexus Aldara': 3, 'Relais de Transit': 3 } },

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
    fuelCostFrom: { 'Scotty Golden North': 3, 'Les Abysses de Velkor': 4, "L'Observatoire": 4, 'La Bulle': 3 } },

  // ── INDUSTRIELS ────────────────────────────────────────────────────────────────
  { name: 'Les Cavernes de Mira',
    description: "Galeries creusées dans un astéroïde massif. Les mineurs ont trouvé autre chose que du minerai. Ils n'en parlent pas.",
    danger: 1, type: 'industrial',
    goods: ['Métaux rares', 'Cristaux énergétiques', 'Artefacts'],
    fuelCostFrom: { 'Station Rocaille': 2, 'Station Fantôme': 2, 'La Forge Noire': 3 },
    exclusiveGoods: ['Cristaux énergétiques'] },

  { name: 'La Raffinerie',
    description: "Plateforme de raffinage orbital. Chaleur, bruit, rendement. Les ouvriers repartent différents.",
    danger: 2, type: 'industrial',
    goods: ['Carburant premium', 'Métaux rares', 'Cristaux énergétiques'],
    fuelCostFrom: { 'La Forge Noire': 1, 'Les Cavernes de Mira': 2, 'Station Rocaille': 4, 'Forge Alpha': 1, 'Station Fantôme': 3 },
    specialService: 'fuel_cheap',
    fuelDiscount: 0.35,
    exclusiveGoods: ['Carburant premium'] },

  // ── PERSONNAGES PILIERS — ZONES SPÉCIALES ─────────────────────────────────────
  {
    name: "L'Arc Perdu",
    description: "Fragment dérivant de l'ancienne grande station, abandonné depuis la Grande Guerre. Concentrait les soldats les plus dangereux — et un général qui n'en est jamais revenu. Ou si.",
    danger: 3, type: 'ruins',
    goods: ['Reliques de la Grande Guerre', 'Artefacts de Nexus', 'Données pré-Fracture', 'Équipement militaire ancien'],
    fuelCostFrom: { 'Les Abysses de Velkor': 5, 'Station Quarantaine': 6 },
    exclusiveGoods: ['Reliques de la Grande Guerre', 'Artefacts de Nexus', 'Données pré-Fracture'],
  },
  {
    name: 'La Tribosphère',
    description: "La planète festive d'Eliotis. Tout le monde est le bienvenu — sauf ceux qui viennent troubler la fête. Ce dernier point est appliqué avec une précision militaire.",
    danger: 1, type: 'peaceful',
    goods: ['Alcools exotiques', 'Spécialités festives', 'Médicaments', 'Divertissement'],
    fuelCostFrom: { 'Star Quest': 3, 'Scotty Golden North': 3, "La Couronne d'Eos": 4 },
    exclusiveGoods: ['Alcools exotiques', 'Spécialités festives', 'Divertissement'],
  },
  {
    name: 'Paradoxa Eterna',
    description: "Planète du Roi Maxance, couverte d'une faune et d'une flore extraordinaires. Pacifiste — mais fermée aux criminels notoires. Les fruits rares qui y poussent sont légendaires pour leurs effets.",
    danger: 0, type: 'peaceful',
    goods: ['Fruits rares', 'Plantes médicinales', 'Composants organiques', 'Épices exotiques'],
    fuelCostFrom: { 'Colonie Perséphone': 3, 'Port Méridien': 4, 'La Balise': 4 },
    specialService: 'rest_bonus',
    exclusiveGoods: ['Fruits rares', 'Composants organiques', 'Épices exotiques'],
  },

  // ── ARÈNE ─────────────────────────────────────────────────────────────────
  { name: "L'Arène de Korsun",
    description: "Station de combat légalisé. Des tribunes criantes, des couloirs qui sentent le sang et la résine. Le seul endroit où mourir en public est considéré comme du divertissement.",
    danger: 2, type: 'dangerous',
    goods: ['Médicaments premium', 'Stimulants de combat', 'Équipement tactique'],
    fuelCostFrom: { 'Star Quest': 2, 'Emporium Requiem': 3, 'Les Bas-Fonds de Vega': 4 },
    specialService: 'arena',
    exclusiveGoods: ['Stimulants de combat'] },

  // ── NOUVELLES STATIONS ────────────────────────────────────────────────────────
  { name: 'Port des Brumes',
    description: "Le port doit son nom aux émanations constantes de ses recycleurs défaillants. Personne n'a jamais réparé les recycleurs. La brume cache les mains et brouille les caméras — c'est fonctionnel.",
    danger: 2, type: 'dangerous',
    goods: ['Fausses identités', 'Données volées', 'Équipement de camouflage', 'Pièces de contrebande'],
    fuelCostFrom: { 'Les Bas-Fonds de Vega': 2, "L'Entrepôt Zéro": 2, 'Port de Nuit': 2 } },

  { name: 'Forge Alpha',
    description: "Complexe industriel qui ne s'arrête jamais. Trois équipes en rotation, chaque seconde d'inactivité une perte. Les ouvriers parlent en gestes entre les machines.",
    danger: 1, type: 'industrial',
    goods: ['Composants de précision', 'Matériaux industriels', 'Outils lourds', 'Pièces techniques'],
    fuelCostFrom: { 'La Raffinerie': 1, 'Station Rocaille': 3, 'Les Cavernes de Mira': 3, 'La Forge Noire': 2 },
    specialService: 'fuel_cheap',
    fuelDiscount: 0.35,
    exclusiveGoods: ['Composants de précision', 'Matériaux industriels'] },

  { name: 'Le Sanctuaire des Dérives',
    description: "Le seul endroit du secteur où personne ne porte d'arme visible. Sœur Valkara l'a voulu ainsi. La règle tient non par force mais par consensus — ici on ne vient pas pour combattre.",
    danger: 0, type: 'peaceful',
    goods: ['Médicaments premium', 'Implants', 'Plantes médicinales', 'Équipement médical'],
    fuelCostFrom: { 'Port Méridien': 3, 'Nexus Aldara': 3, 'Fort Ossian': 4 },
    specialService: 'implants',
    exclusiveGoods: ['Plantes médicinales', 'Équipement médical'] },

  { name: 'Sanctum Machina',
    description: "Les robots sont partout. ARIA-9, l'IA centrale, les coordonne en temps réel. À l'entrée, ton profil est créé en huit secondes. Elle t'a déjà évalué.",
    danger: 2, type: 'scientific',
    goods: ['Logiciels', 'Composants expérimentaux', 'Données', 'Implants cybernétiques'],
    fuelCostFrom: { 'Nexus Aldara': 2, 'Station Zéphyr': 3, 'Le Berceau': 3, 'La Bulle': 2 } },

  { name: 'La Bulle',
    description: "Station de recherche biomédicale aux activités créativement diversifiées. Le Docteur Flinch a compris que légal et illégal représentaient le même marché. Ses cliniques propres côtoient des arrière-salles dont les équipements sont trop précis pour être honnêtes.",
    danger: 1, type: 'scientific',
    goods: ['Implants', 'Médicaments expérimentaux', 'Composants biologiques', 'Drogues de synthèse'],
    fuelCostFrom: { 'Nexus Aldara': 3, 'Station Limite': 3, "L'Observatoire": 4 },
    specialService: 'implants',
    exclusiveGoods: ['Médicaments expérimentaux', 'Composants biologiques'] },

  { name: 'La Forge des Damnés',
    description: "Produit des armes que les catalogues officiels ne listent pas. L'Armurière Skade travaille à la commande, sans questions. Ses armes ne portent pas de numéros de série. Ce n'est pas un défaut.",
    danger: 3, type: 'industrial',
    goods: ['Armes artisanales', 'Armes illégales', "Composants d'armure", 'Matériaux interdits'],
    fuelCostFrom: { 'La Forge Noire': 2, 'Repaire Vega-Sud': 3, 'Port des Brumes': 3 },
    specialService: 'weapon_forge',
    exclusiveGoods: ['Armes illégales', 'Matériaux interdits'] },
]

export function getStationsSellingItem(itemName: string): string[] {
  return STATIONS.filter(s => s.goods.includes(itemName)).map(s => s.name)
}

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
  'Port Méridien', 'Colonie Perséphone', 'Star Quest', 'Scotty Golden North', 'La Tribosphère', 'Paradoxa Eterna'
])

// Stations où le carburant est en vente et où les upgrades vaisseau sont disponibles
export const FUEL_STATIONS = new Set([
  'La Carcasse',
  'Port Méridien',
  'La Balise',
  'Confluent',
  'La Raffinerie',
  'Forge Alpha',
  'Relais Noir',
  'Relais de Transit',
  'Fort Kharos',
  'Le Grand Bazar',
])

export const BOSS_STATIONS: Record<string, string> = {
  // Faucons Noirs
  'Arc Ouest Apocalypse':   'Alanossa',
  'Le Nid des Faucons':     'La Faucon',
  'Station Ombre':          'Le Fantôme des Ombres',
  'La Tanière':             'La Bête Noire',
  'Le Perchoir':            'Le Vigie Immortel',
  'Relais Noir':            "Le Ravitailleur de l'Ombre",
  'Fort de Cendres':        'Le Boucher de Velkor',
  "L'Œil du Faucon":       "L'Architecte du Chaos",
  // Gardiens Écarlates
  'La Citadelle Écarlate':  'Commandante Zara Sable',
  'La Forteresse Exilée':   "L'Exilé Écarlate",
  'Bastion Mineur':         'Commandant Garant',
  'Poste Vigie':            'Amiral Voss-Kheran',
  "L'Arsenal Écarlate":    'Le Colosse de Ferraille',
  // Emporium
  'Emporium Requiem':       'Cesarion',
  'Comptoir Sud':           'La Marchande de Mort',
  'Annexe Commerciale':     'Le Directeur Fantôme',
  'Relais de Transit':      'Le Passeur Sanguinaire',
  // Criminel / bas-fonds
  'Les Bas-Fonds de Vega':  'Le Baron de Vega',
  'Repaire Vega-Sud':       'La Veuve de Vega',
  'Port de Nuit':           'Le Roi de Nuit',
  'La Forge Noire':         'Le Maître-Forgeron Maudit',
  "L'Entrepôt Zéro":       "L'Archiviste sans Visage",
  // Militaire neutre
  'Fort Kharos':            'Le Général de Fer',
  'Fort Ossian':            'Frère Ossian le Dernier',
  'Star Quest':             "Garde du Corps d'Eliotis",
  // Ruines / abandonnées
  'Les Abysses de Velkor':  'Directeur Pale',
  'Station Quarantaine':    'Patient Zéro',
  'Station Fantôme':        "L'Ombre du Vide",
  'Les Cendres':            'Le Survivant des Cendres',
  'Le Berceau':             'Le Gardien Originel',
  "L'Épave Vivante":       'Le Capitaine Amalgame',
  'Le Purgatoire':          'Le Geôlier des Morts',
  // Luxe / haute société
  "La Couronne d'Eos":     'Oracle de la Singularité',
  'Scotty Golden North':    'Samy Scotty',
  'Résidence Orbitale':     'Lord Daekar',
  "Club Privé Éos":        'Le Maître des Ombres',
  // Industriel / minier
  'Station Rocaille':       'Le Titan Mineur',
  'Les Cavernes de Mira':   'La Créature de Mira',
  'La Raffinerie':          'Le Contremaître Infernal',
  // Scientifique
  'Nexus Aldara':           'Protocole ΔX-7',
  'Station Limite':         'La Mère Mecanique',
  'Station Zéphyr':         'Le Chercheur Fracturé',
  "L'Observatoire":        "L'Astronome des Abysses",
  // Paisible / neutre
  'La Carcasse':            'Le Ferrailleur des Épaves',
  'Port Méridien':          "L'Inspecteur Véreux",
  'Colonie Perséphone':     'La Matriarche de Perséphone',
  "L'Oasis de Fer":        'Le Médiateur de Fer',
  'La Balise':              'Le Gardien du Signal',
  'Confluent':              'Le Seigneur des Routes',
  // Personnages piliers — zones spéciales
  "L'Arc Perdu":           'Raphazarus',
  'La Tribosphère':         'Eliotis',
  'Paradoxa Eterna':        'Le Roi Maxance',
  // Arène
  "L'Arène de Korsun":     'Le Champion des Arènes',
  // Nouvelles stations
  'Port des Brumes':          'Le Fantôme des Brumes',
  'Forge Alpha':              'Le Contremaître de Forge',
  'Le Sanctuaire des Dérives': 'Sœur Valkara',
  'Sanctum Machina':          'ARIA-9 Protocole Noir',
  'La Bulle':                 'Docteur Flinch',
  'La Forge des Damnés':      "L'Armurière Skade",
}

// BFS — chemin le plus court (en nombre de sauts) entre deux stations
export function findPath(from: string, to: string): string[] {
  if (from === to) return [from]
  const adj: Record<string, string[]> = {}
  for (const s of STATIONS) {
    for (const src of Object.keys(s.fuelCostFrom)) {
      if (!adj[src]) adj[src] = []
      adj[src].push(s.name)
    }
  }
  const visited = new Set<string>([from])
  const queue: string[][] = [[from]]
  while (queue.length > 0) {
    const path = queue.shift()!
    for (const next of adj[path[path.length - 1]] ?? []) {
      if (next === to) return [...path, next]
      if (!visited.has(next)) {
        visited.add(next)
        queue.push([...path, next])
      }
    }
  }
  return []
}

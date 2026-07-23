import type { SubBossData, Enemy } from '../types'

function makeEnemy(name: string, hp: number, dMin: number, dMax: number, lootMin: number, lootMax: number, desc: string, role: Enemy['role'] = 'normal'): Enemy {
  return { name, maxHp: hp, damageMin: dMin, damageMax: dMax, lootMin, lootMax, description: desc, captureChance: 5, killChance: 15, isBoss: true, role, isSubBoss: true }
}

// ── ALANOSSA — Faucons Noirs ────────────────────────────────────────────────
const ALANOSSA_SUBS: SubBossData[] = [
  {
    id: 'ala-1',
    name: 'Le Vigie Immortel',
    pillar: 'alanossa',
    station: 'Le Perchoir',
    order: 1,
    personality: 'Paranoïaque, obsessionnel, méthodique. Il voit des menaces partout — parce qu\'il en a vu de vraies.',
    motivation: 'Protéger le réseau de surveillance des Faucons. Quiconque approche est un espion potentiel.',
    backstory: 'Ancien tireur d\'élite recruté par Alanossa après qu\'il a abattu trois infiltrateurs en une nuit. Il n\'a jamais quitté son poste depuis — littéralement. Il dort sur sa chaise de vigie. Les recrues disent qu\'il ne cligne jamais des yeux.',
    combatMechanic: 'Prévoit tes attaques : esquive automatique tous les 3 tours. Doit être frappé quand il recharge.',
    specialAbility: 'Tir préventif — attaque en premier chaque tour, ignore la défensive.',
    reward: { type: 'weapon', value: 'Lunette du Vigie' },
    resolutions: ['kill', 'negotiate', 'manipulate', 'sabotage'],
    enemy: makeEnemy('Le Vigie Immortel', 160, 18, 35, 2000, 4500, 'Il surveille depuis si longtemps qu\'il ne sait plus rien faire d\'autre.', 'ranged'),
  },
  {
    id: 'ala-2',
    name: "Le Ravitailleur de l'Ombre",
    pillar: 'alanossa',
    station: 'Relais Noir',
    order: 2,
    personality: 'Calculateur, froid, indispensable. Il sait que sans lui, les Faucons s\'effondrent.',
    motivation: 'Contrôler les chaînes d\'approvisionnement. Le pouvoir, ce n\'est pas les armes — c\'est la logistique.',
    backstory: 'Ancien contrebandier recruté par Alanossa pour organiser sa logistique. Il a rendu les Faucons autosuffisants en un an. Il connaît chaque route, chaque cache, chaque dette. Le tuer serait facile. Le remplacer, impossible.',
    combatMechanic: 'Utilise des drones de soutien qui réparent son armure. Il faut détruire les drones d\'abord (3 drones, 40 PV chacun).',
    specialAbility: 'Appel de renforts — invoque un drone qui absorbe le prochain coup.',
    reward: { type: 'item', value: 'Carte des routes Faucon' },
    resolutions: ['kill', 'negotiate', 'ally', 'betray'],
    enemy: makeEnemy("Le Ravitailleur de l'Ombre", 200, 20, 38, 2500, 5500, 'Sans lui la faction s\'effondre. Il le sait.', 'normal'),
  },
  {
    id: 'ala-3',
    name: 'Le Fantôme des Ombres',
    pillar: 'alanossa',
    station: 'Station Ombre',
    order: 3,
    personality: 'Silencieux, létal, loyal jusqu\'à la mort. Il est le bras armé qu\'Alanossa utilise quand les mots ne suffisent plus.',
    motivation: 'Exécuter les ordres d\'Alanossa sans question. Son dévouement est absolu.',
    backstory: 'Personne ne connaît son vrai nom. Alanossa l\'a trouvé dans les ruines de Station Quarantaine — seul survivant d\'une épidémie qui a tué trois cents personnes. Elle l\'a recueilli, entraîné, forgé. Il est devenu son ombre.',
    combatMechanic: 'Invisible les tours impairs — ne peut pas être touché. Contre-attaque automatiquement quand tu rates.',
    specialAbility: 'Frappe fantôme — coup critique garanti depuis l\'invisibilité.',
    reward: { type: 'armor', value: 'Cape des Ombres' },
    resolutions: ['kill', 'manipulate', 'sabotage'],
    enemy: makeEnemy('Le Fantôme des Ombres', 180, 28, 52, 3000, 6500, 'Tu ne le vois qu\'une fois. En général c\'est trop tard.', 'ranged'),
  },
  {
    id: 'ala-4',
    name: 'La Faucon',
    pillar: 'alanossa',
    station: 'Le Nid des Faucons',
    order: 4,
    personality: 'Charismatique, impitoyable, pragmatique. Elle inspire la loyauté par la peur ET le respect.',
    motivation: 'Devenir le bras droit d\'Alanossa. Elle est la seule à pouvoir la remplacer — et elles le savent toutes les deux.',
    backstory: 'Ancienne officière militaire qui a déserté après avoir vu son commandant sacrifier un régiment entier pour sauver sa carrière. Alanossa lui a offert quelque chose que l\'armée n\'avait jamais offert : la justice. Maintenant elle dirige le Nid avec une discipline de fer.',
    combatMechanic: 'Change de stance tous les 2 tours : offensive (×1.5 dégâts) ou défensive (÷2 dégâts reçus). Il faut s\'adapter.',
    specialAbility: 'Commandement — chaque tour elle gagne +5% de dégâts cumulatifs.',
    reward: { type: 'weapon', value: 'Lame de la Faucon' },
    resolutions: ['kill', 'negotiate', 'ally', 'betray'],
    enemy: makeEnemy('La Faucon', 250, 28, 52, 3500, 7000, 'Cheffe des Faucons Noirs. Calculée. Implacable.', 'normal'),
  },
]

// ── CESARION — Emporium ────────────────────────────────────────────────────
const CESARION_SUBS: SubBossData[] = [
  {
    id: 'ces-1',
    name: 'La Marchande de Mort',
    pillar: 'cesarion',
    station: 'Comptoir Sud',
    order: 1,
    personality: 'Souriante, empoisonnée, dangereuse. Elle vend avec un sourire. Ce qu\'elle vend tue toujours.',
    motivation: 'Le profit. Pur et simple. Cesarion lui laisse le Comptoir Sud en échange d\'un pourcentage. Et d\'informations.',
    backstory: 'Fille de marchands assassinés par des pirates. Elle a reconstruit l\'empire familial en vendant les mêmes armes qui avaient tué ses parents — aux mêmes personnes. "Le business n\'a pas de morale", dit-elle. Elle y croit vraiment.',
    combatMechanic: 'Empoisonne ses armes — chaque coup inflige du poison cumulatif. Plus le combat dure, plus c\'est dangereux.',
    specialAbility: 'Poison commercial — chaque tour, le joueur perd 5 PV supplémentaires (cumulatif).',
    reward: { type: 'weapon', value: 'Dague empoisonnée de Morte' },
    resolutions: ['kill', 'negotiate', 'manipulate', 'ally'],
    enemy: makeEnemy('La Marchande de Mort', 155, 18, 36, 2200, 5000, 'Ce qu\'elle vend tue toujours, même les contrats d\'assurance.', 'ranged'),
  },
  {
    id: 'ces-2',
    name: 'Le Passeur Sanguinaire',
    pillar: 'cesarion',
    station: 'Relais de Transit',
    order: 2,
    personality: 'Brutal, territorial, possessif. Tout ce qui passe par son relais lui appartient.',
    motivation: 'Contrôler les flux de marchandises pour Cesarion. Il prend une taxe sur tout — officielle ou non.',
    backstory: 'Ancien officier de douane devenu seigneur de guerre logistique. Cesarion l\'a recruté parce qu\'il était le seul à comprendre comment taxer sans tuer le commerce. Son efficacité a un prix : des disparitions régulières de marchands "non conformes".',
    combatMechanic: 'Vole tes crédits à chaque coup réussi (5% de tes crédits par frappe). Combat contre la montre.',
    specialAbility: 'Taxe de sang — chaque attaque réussie te coûte des crédits.',
    reward: { type: 'credits', value: 5000 },
    resolutions: ['kill', 'negotiate', 'manipulate', 'betray'],
    enemy: makeEnemy('Le Passeur Sanguinaire', 190, 22, 42, 3000, 6000, 'Il contrôle le Relais de Transit. Tout ce qui passe, il le taxe.', 'normal'),
  },
  {
    id: 'ces-3',
    name: "L'Archiviste sans Visage",
    pillar: 'cesarion',
    station: "L'Entrepôt Zéro",
    order: 3,
    personality: 'Méthodique, invisible, omniscient dans son domaine. Il sait tout ce qui entre et sort.',
    motivation: 'Détenir l\'information. Pour Cesarion, il est plus précieux que cent soldats.',
    backstory: 'Personne ne connaît son visage — il porte un masque depuis qu\'il est arrivé à l\'Entrepôt. Certains disent qu\'il est un ancien espion, d\'autres un ex-prisonnier. Ce qui est sûr : il connaît tous les secrets de l\'Emporium. Cesarion le garde en vie parce qu\'il ne peut pas le remplacer.',
    combatMechanic: 'Connaît ton équipement — réduit l\'efficacité de ton arme de 30%. Changer d\'arme en combat le déstabilise.',
    specialAbility: 'Analyse tactique — esquive le premier coup de chaque séquence et contre-attaque.',
    reward: { type: 'item', value: 'Dossier Cesarion' },
    resolutions: ['kill', 'negotiate', 'manipulate', 'sabotage'],
    enemy: makeEnemy("L'Archiviste sans Visage", 175, 26, 48, 3500, 7000, 'Il connaît tous les secrets. Il enterre le reste.', 'ranged'),
  },
  {
    id: 'ces-4',
    name: 'Le Directeur Fantôme',
    pillar: 'cesarion',
    station: 'Annexe Commerciale',
    order: 4,
    personality: 'Insaisissable, diplomatique en façade, impitoyable dans l\'ombre. L\'homme derrière l\'homme.',
    motivation: 'Être le conseiller le plus proche de Cesarion. Il manipule les fils depuis l\'Annexe, loin des regards.',
    backstory: 'Ancien diplomate d\'une nation disparue. Il a vu son monde s\'effondrer et a juré de ne plus jamais être du côté des perdants. Cesarion l\'utilise comme interface avec le monde extérieur — un visage amical pour des décisions brutales.',
    combatMechanic: 'A des gardes personnels (2 gardes, 60 PV chacun) qui doivent être éliminés en premier. Lui-même se soigne tant que les gardes sont en vie.',
    specialAbility: 'Directive fantôme — se soigne de 15 PV/tour tant qu\'un garde est en vie.',
    reward: { type: 'armor', value: 'Uniforme Diplomatique' },
    resolutions: ['kill', 'negotiate', 'ally', 'betray', 'manipulate'],
    enemy: makeEnemy('Le Directeur Fantôme', 220, 24, 46, 4000, 8000, 'Officiellement un bureaucrate. Officieusement, un fantôme.', 'support'),
  },
]

// ── RAPHAZARUS — Vétérans de la Grande Guerre / L'Arc Perdu ─────────────────
const RAPHAZARUS_SUBS: SubBossData[] = [
  {
    id: 'raph-1',
    name: 'Le Sergent Cendré',
    pillar: 'raphazarus',
    station: 'Les Cendres',
    order: 1,
    personality: 'Brisé, méthodique, hanté. Il obéit encore à des ordres donnés il y a quarante ans.',
    motivation: 'Exécuter la dernière directive de Raphazarus : surveiller les Cendres et éliminer quiconque pose des questions sur l\'Arc Perdu.',
    backstory: 'Dernier survivant du 3e Bataillon de Raphazarus. Il a vu ses camarades mourir un par un pendant le Siège des Cendres — 47 jours sans ravitaillement. Quand les secours sont arrivés, il était le seul debout. Raphazarus lui a serré la main et lui a dit : "Tu restes ici. Tu attends." Il attend encore.',
    combatMechanic: 'Se bat avec une discipline militaire implacable : attaque toujours deux fois de suite, mais pause un tour tous les 4 tours pour "recharger".',
    specialAbility: 'Cadence de tir — double attaque chaque tour, pause tous les 4 tours.',
    reward: { type: 'item', value: 'Plaque d\'identification 3e Bataillon' },
    resolutions: ['kill', 'negotiate', 'manipulate', 'sabotage'],
    enemy: makeEnemy('Le Sergent Cendré', 170, 20, 38, 2200, 5000, 'Il attend depuis quarante ans. Il a tout son temps.', 'normal'),
  },
  {
    id: 'raph-2',
    name: 'La Veuve de Fer',
    pillar: 'raphazarus',
    station: 'La Forteresse Exilée',
    order: 2,
    personality: 'Froide, chirurgicale, dévouée au-delà de la raison. Son mari est mort sous les ordres de Raphazarus — et elle lui en est reconnaissante.',
    motivation: 'Protéger la Forteresse Exilée, dernier avant-poste connu de Raphazarus avant sa disparition. Elle détient des informations sur la localisation de l\'Arc Perdu.',
    backstory: 'Son mari commandait la flotte d\'élite de Raphazarus. Il est mort en couvrant la retraite du Général vers l\'Arc Perdu. Au lieu de le haïr, elle a juré allégeance éternelle. "Mon mari a choisi de mourir pour lui. Ce choix mérite d\'être honoré." Elle est devenue la gardienne la plus implacable de tous les vétérans — la seule que Raphazarus contacte encore parfois.',
    combatMechanic: 'Porte une armure de deuil qui absorbe 40% des dégâts physiques. Les armes à énergie (burn, shock) ignorent cette réduction.',
    specialAbility: 'Armure de deuil — réduit 40% des dégâts physiques, vulnérable aux armes énergétiques.',
    reward: { type: 'armor', value: 'Armure de la Veuve' },
    resolutions: ['kill', 'negotiate', 'manipulate', 'betray'],
    enemy: makeEnemy('La Veuve de Fer', 210, 24, 45, 3000, 6500, 'Son mari est mort pour Raphazarus. Elle vivra pour lui.', 'tank'),
  },
  {
    id: 'raph-3',
    name: 'Le Spectre du 7e',
    pillar: 'raphazarus',
    station: 'Station Fantôme',
    order: 3,
    personality: 'Invisible, silencieux, terrifiant. Il n\'est peut-être même pas humain — plus personne n\'est sûr.',
    motivation: 'Éliminer quiconque approche de la vérité sur l\'Arc Perdu. Raphazarus lui a confié une mission : que personne ne puisse le retrouver. Jamais.',
    backstory: 'Ancien chef du renseignement militaire du 7e Corps de Raphazarus. Après la Grande Guerre, il a fait disparaître toute trace de l\'Arc Perdu des archives officielles — coordonnées, manifestes, logs de navigation. Puis il s\'est fait disparaître lui-même. Station Fantôme porte son nom : personne ne sait s\'il y habite vraiment ou s\'il est partout à la fois.',
    combatMechanic: 'Alterne entre deux phases : visible (attaque normalement) et spectral (immunisé aux attaques physiques, ne peut être touché que par effets/armes spéciales). Change de phase tous les 2 tours.',
    specialAbility: 'Phase spectrale — immunisé aux attaques directes tous les 2 tours.',
    reward: { type: 'weapon', value: 'Lame Fantôme du 7e' },
    resolutions: ['kill', 'manipulate', 'sabotage'],
    enemy: makeEnemy('Le Spectre du 7e', 230, 30, 55, 4000, 8000, 'Chef du renseignement. Il a effacé l\'Arc Perdu des cartes.', 'ranged'),
  },
  {
    id: 'raph-4',
    name: 'Le Maréchal Osseux',
    pillar: 'raphazarus',
    station: 'La Forge des Damnés',
    order: 4,
    personality: 'Stoïque, impitoyable, respecté même par les ennemis de Raphazarus. Le dernier officier encore en activité.',
    motivation: 'Garder la Forge des Damnés opérationnelle — c\'est ici que Raphazarus forge ses armes et entraîne ses derniers soldats fidèles. Le Maréchal est le dernier rempart avant le Général.',
    backstory: 'Bras droit de Raphazarus depuis avant la Grande Guerre. Il a survécu à trois tentatives d\'assassinat, deux trahisons et un bombardement orbital. Son surnom vient de ses blessures : il a tellement de fractures recollées que ses os forment une armure naturelle. Raphazarus l\'a nommé gardien de la Forge parce qu\'il est le seul homme en qui il a une confiance absolue.',
    combatMechanic: 'Ses os renforcés réduisent les dégâts critiques de 60%. Plus tu le frappes, plus sa rage augmente — +15% dégâts par tranche de 25% PV perdus.',
    specialAbility: 'Ossature blindée — réduit les critiques de 60%, rage croissante (+15% dégâts/25% PV perdus).',
    reward: { type: 'weapon', value: 'Le Poing du Maréchal' },
    resolutions: ['kill', 'negotiate', 'ally'],
    enemy: makeEnemy('Le Maréchal Osseux', 280, 30, 58, 5000, 10000, 'Dernier officier de Raphazarus. Trois assassinats ratés. Deux trahisons survécues. Un bombardement orbital.', 'tank'),
  },
]

// ── SAMY SCOTTY — Luxe / Criminel / Casino ─────────────────────────────────
const SCOTTY_SUBS: SubBossData[] = [
  {
    id: 'sco-1',
    name: 'Le Roi de Nuit',
    pillar: 'scotty',
    station: 'Port de Nuit',
    order: 1,
    personality: 'Discret, patient, mortel. Il dirige Port de Nuit depuis les ombres — personne ne le voit jamais.',
    motivation: 'Contrôler le marché noir pour Scotty. Port de Nuit est son royaume.',
    backstory: 'Ancien orphelin des Bas-Fonds. Scotty l\'a repéré quand il avait douze ans — il avait déjà son propre réseau de voleurs. Scotty lui a donné Port de Nuit comme terrain de jeu. Il en a fait un empire.',
    combatMechanic: 'Combat dans l\'obscurité — tes attaques font 30% moins de dégâts sauf si tu utilises une arme avec effet "burn" ou "blind".',
    specialAbility: 'Ombre de nuit — tes attaques sont réduites de 30% sauf armes incendiaires.',
    reward: { type: 'weapon', value: 'Dague de la Nuit' },
    resolutions: ['kill', 'negotiate', 'manipulate', 'betray'],
    enemy: makeEnemy('Le Roi de Nuit', 175, 20, 40, 2500, 5500, 'Il dirige Port de Nuit depuis l\'ombre.', 'normal'),
  },
  {
    id: 'sco-2',
    name: 'Le Maître des Ombres',
    pillar: 'scotty',
    station: "Club Privé Éos",
    order: 2,
    personality: 'Séducteur, manipulateur, mortellement charmant. Il connaît les secrets de tout le monde.',
    motivation: 'L\'information est son pouvoir. Scotty l\'utilise comme réseau d\'espionnage haute société.',
    backstory: 'Ancien gigolo des stations luxueuses devenu maître-espion. Scotty a vu son potentiel quand il a appris que le Maître des Ombres avait fait tomber trois mariages politiques en une semaine — juste pour le sport. Maintenant il écoute, il enregistre, et il vend. À Scotty en priorité.',
    combatMechanic: 'Retourne tes armes contre toi : 25% de chance que ton attaque te frappe à la place. Immunité aux effets de confusion.',
    specialAbility: 'Miroir — 25% de chance que tes attaques soient retournées.',
    reward: { type: 'item', value: 'Carnet de Chantage' },
    resolutions: ['kill', 'negotiate', 'manipulate', 'ally', 'betray'],
    enemy: makeEnemy('Le Maître des Ombres', 195, 24, 45, 3000, 6500, 'Les secrets qu\'il détient valent des armées.', 'ranged'),
  },
  {
    id: 'sco-3',
    name: 'Oracle de la Singularité',
    pillar: 'scotty',
    station: "La Couronne d'Eos",
    order: 3,
    personality: 'Prophétique, condescendant, terrifiant. Il prétend voir l\'avenir — et il a souvent raison.',
    motivation: 'Maintenir son influence sur les élites. Scotty le protège parce que ses prédictions rapportent au casino.',
    backstory: 'Ancien chercheur en intelligence artificielle devenu oracle auto-proclamé. Sa capacité prédictive n\'est pas mystique — c\'est un réseau de capteurs et d\'algorithmes qu\'il a dissimulé dans toute La Couronne. Il sait ce que tu vas faire avant toi.',
    combatMechanic: 'Prédit tes attaques : esquive automatiquement le même type d\'attaque utilisé au tour précédent. Oblige à varier.',
    specialAbility: 'Prédiction — immunisé au même type d\'attaque deux tours de suite.',
    reward: { type: 'armor', value: 'Armure Prédictive' },
    resolutions: ['kill', 'manipulate', 'sabotage'],
    enemy: makeEnemy('Oracle de la Singularité', 210, 30, 55, 4000, 8000, 'Il prédit tes mouvements. Il les a déjà vus.', 'ranged'),
  },
  {
    id: 'sco-4',
    name: 'Directeur Pale',
    pillar: 'scotty',
    station: 'Les Abysses de Velkor',
    order: 4,
    personality: 'Calme. Terrifiant justement parce qu\'il est calme. Rien ne le surprend, rien ne le fait réagir.',
    motivation: 'Exécuter la dernière volonté d\'un mort. Les Abysses contiennent quelque chose que Scotty veut — et Pale le garde.',
    backstory: 'Ancien directeur d\'une station de recherche qui a mal tourné. La station est tombée dans les Abysses, mais Pale est resté. Ce qu\'il a vu en bas l\'a changé. Il ne cligne plus des yeux. Il ne dort plus. Il ne mange plus. Et pourtant il est toujours là.',
    combatMechanic: 'Plus tu le frappes, plus il devient dangereux : +10% dégâts par tranche de 20% PV perdus.',
    specialAbility: 'Rage silencieuse — ses dégâts augmentent à mesure qu\'il perd des PV.',
    reward: { type: 'weapon', value: 'Scalpel de Velkor' },
    resolutions: ['kill', 'negotiate', 'manipulate'],
    enemy: makeEnemy('Directeur Pale', 260, 25, 50, 5000, 10000, 'Il est calme. C\'est pire.', 'normal'),
  },
]

export const SUB_BOSSES: SubBossData[] = [
  ...ALANOSSA_SUBS,
  ...CESARION_SUBS,
  ...RAPHAZARUS_SUBS,
  ...SCOTTY_SUBS,
]

export function getSubBossesForPillar(pillar: string): SubBossData[] {
  return SUB_BOSSES.filter(sb => sb.pillar === pillar).sort((a, b) => a.order - b.order)
}

export function getSubBossAtStation(station: string): SubBossData | undefined {
  return SUB_BOSSES.find(sb => sb.station === station)
}

export function isSubBossDefeated(defeated: Record<string, string[]>, subBossId: string): boolean {
  return Object.values(defeated).some(ids => ids.includes(subBossId))
}

export function arePillarSubBossesCleared(defeated: Record<string, string[]>, pillar: string): boolean {
  const subs = getSubBossesForPillar(pillar)
  const pillarDefeated = defeated[pillar] ?? []
  return subs.every(sb => pillarDefeated.includes(sb.id))
}

export function getNextSubBoss(defeated: Record<string, string[]>, pillar: string): SubBossData | undefined {
  const subs = getSubBossesForPillar(pillar)
  const pillarDefeated = defeated[pillar] ?? []
  return subs.find(sb => !pillarDefeated.includes(sb.id))
}

export function getSubBossProgress(defeated: Record<string, string[]>, pillar: string): { done: number; total: number } {
  const subs = getSubBossesForPillar(pillar)
  const pillarDefeated = defeated[pillar] ?? []
  return { done: subs.filter(sb => pillarDefeated.includes(sb.id)).length, total: subs.length }
}

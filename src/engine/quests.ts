import type { GameState, Quest, QuestType } from '../types'
import { getAccessibleStations, getStation } from '../data/stations'
import { getRunQuestRewardMult } from '../data/runModifiers'

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

// Économie volontairement dure : les quêtes rapportent nettement moins de crédits.
const ECONOMY_MULT = 0.6

const GIVER_NAMES = [
  'Marek','Sela','Donn','Yara','Pistis','Boro','Cael','Neva','Torvak','Lira',
  'Besh','Rook','Ysla','Ganz','Myrra','Sten','Orva','Kael','Fen','Drela',
  'Vance','Wyll','Soru','Thas','Nori','Brixa','Cador','Eska','Ulmo','Pheth',
  'Juno','Varek','Sinn','Drex','Orvyn','Cassa','Thael','Wyrn','Pell','Idos',
]

const DELIVERY_ITEMS = [
  'Médicaments','Pièces techniques','Vivres','Or',
  'Artefacts','Ferraille','Plantes médicinales',
  'Données classifiées','Composants électroniques','Munitions',
  'Implants','Eau purifiée','Rations militaires','Cristaux énergétiques',
]

// Objets qui n'existent nulle part dans le commerce — uniquement issus de
// l'Atelier de fabrication (recipes.ts : void_regulator, ghost_nav_chip,
// annealed_alloy). Une quête ciblant l'un d'eux ne peut pas se résoudre en
// achetant : il faut réunir les matériaux et les fabriquer soi-même.
export const CRAFTED_DELIVERY_ITEMS = ['Régulateur de Vide', 'Puce de Navigation Fantôme', 'Alliage Recuit']

// ── QUÊTE TUTORIELLE (5.1) ────────────────────────────────────────────────────
// Auto-assignée au jour 1. Un PNJ de la station de départ demande une livraison
// vers la station proche la moins chère. Guide le joueur : acheter → voyager →
// livrer → revenir. Récompense : crédits + révélation du tracker Nexus.
export const TUTORIAL_QUEST_ID = 'tutorial-delivery'

export function buildTutorialQuest(startStation: string): Quest {
  const accessible = getAccessibleStations(startStation)
  // Cible : la station accessible la moins chère en carburant (la plus proche)
  const target = accessible.length > 0
    ? accessible.reduce((best, s) =>
        (s.fuelCostFrom[startStation] ?? 99) < (best.fuelCostFrom[startStation] ?? 99) ? s : best
      )
    : null
  const targetName = target?.name ?? startStation
  // Item vendu sur place mais PAS dans la cargaison de départ (Médicaments) :
  // force le joueur à passer par le marché pour apprendre l'achat.
  const startGoods = getStation(startStation).goods
  const item = startGoods.find(g => g !== 'Médicaments') ?? startGoods[0] ?? 'Médicaments'

  return {
    id: TUTORIAL_QUEST_ID,
    title: `Première course : ${item}`,
    giver: 'Vieux Doss',
    giverStation: startStation,
    type: 'delivery',
    description:
      `Vieux Doss, un mécano usé qui traîne sur ${startStation}, t'arrête. "Première fois dans le secteur, hein ? `
      + `Écoute : mon contact à ${targetName} crève sans ses ${item}. Passe au marché ici, achète-en une caisse, `
      + `prends ton vaisseau jusqu'à ${targetName} et livre-les en main propre. Il te paiera bien — et il a un vieux `
      + `datapad pour toi. Crois-moi, ce qu'il y a dessus vaut plus que les crédits."`,
    targetStation: targetName,
    targetItem: item,
    creditReward: 800,
    repReward: 15,
  }
}

const HEIST_ITEMS = [
  'Données classifiées','Implants','Cristaux énergétiques',
  'Or','Armes illégales','Technologies avancées','Composants expérimentaux',
]

const EXTRACTION_ITEMS = [
  'Pièces techniques','Composants électroniques','Données','Artefacts',
  'Médicaments premium','Logiciels','Renseignements',
]

const BOSS_NAMES: Record<string, string> = {
  'Arc Ouest Apocalypse':   'Alanossa',
  'Le Nid des Faucons':     'La Faucon',
  'Les Abysses de Velkor':  'Directeur Pale',
  'Star Quest':             "Garde du Corps d'Eliotis",
  'Emporium Requiem':       'Le Directeur Pale',
  'La Citadelle Écarlate':  'La Commandante Sable',
  'Fort Kharos':            'Le Général Ossian',
  'Fort Ossian':            'Frère Ossian le Dernier',
}

// ── POOLS DE DESCRIPTIONS ────────────────────────────────────────────────────

const DELIVERY_DESCS = [
  (item: string, giver: string, target: string) =>
    `${giver} a besoin que ${item} arrive sur ${target} avant demain. Pas de détours, pas de questions.`,
  (item: string, giver: string, target: string) =>
    `Colis scellé contenant ${item}. Destination : ${target}. ${giver} insiste sur la discrétion.`,
  (item: string, _: string, target: string) =>
    `${item} à faire parvenir à ${target}. Légal en apparence. Ce qui est dedans, c'est une autre histoire.`,
  (item: string, giver: string, target: string) =>
    `Livraison urgente. ${giver} a un contact sur ${target} qui attend ${item}. Paiement à l'arrivée.`,
  (item: string, giver: string, target: string) =>
    `${giver} a oublié ${item} sur ${target} lors de son dernier passage. Tu t'en occupes.`,
]

const KILL_DESCS = [
  (boss: string, giver: string, target: string) =>
    `${boss} sur ${target}. ${giver} paie bien — et ne demande pas de preuve propre.`,
  (boss: string, giver: string, _: string) =>
    `${giver} a un problème avec ${boss}. La solution coûte cher. Ne pas la résoudre coûte plus.`,
  (boss: string, _: string, target: string) =>
    `${boss} à ${target}. Élimination discrète. Le commanditaire préfère ne pas être cité.`,
  (boss: string, giver: string, _: string) =>
    `Prime officieuse sur ${boss}. ${giver} a ses raisons. Toi t'as besoin de crédits. Transaction simple.`,
  (boss: string, _: string, target: string) =>
    `${boss} a rendu la vie impossible à trop de gens sur ${target}. Quelqu'un a décidé que ça devait s'arrêter.`,
]

const REVENGE_DESCS = [
  (_: string, giver: string, target: string) =>
    `Des gens de ${target} ont ruiné ${giver}. Aller là-bas et gagner un combat. Leur faire comprendre.`,
  (_: string, giver: string, target: string) =>
    `${giver} a une vieille dette à régler avec ${target}. Il/elle ne peut pas y aller. Toi oui.`,
  (_: string, _2: string, target: string) =>
    `Un affront est resté impuni. Une démonstration de force à ${target} suffira à rétablir l'équilibre.`,
  (_: string, giver: string, target: string) =>
    `La réputation de ${giver} est en jeu. Il faut que quelqu'un aille montrer qui commande sur ${target}.`,
  (_: string, giver: string, target: string) =>
    `${giver} a perdu quelque chose d'important à cause des gens de ${target}. Ça ne restera pas sans réponse.`,
]

const INFO_DESCS = [
  (_: string, giver: string, target: string) =>
    `${giver} a besoin d'informations fraîches sur ${target}. Ta présence là-bas suffit. Paiement au retour.`,
  (_: string, _2: string, target: string) =>
    `Surveillance discrète de ${target}. Pas d'armes nécessaires. Juste des yeux ouverts et une mémoire fiable.`,
  (_: string, giver: string, target: string) =>
    `${giver} prépare quelque chose et veut savoir ce qui se passe à ${target}. Rapport à la livraison.`,
  (_: string, _2: string, target: string) =>
    `Évaluation de situation à ${target}. Qui est là, quel est le niveau de tension, quels mouvements inhabituels.`,
  (_: string, giver: string, target: string) =>
    `Reconnaissance de ${target}. ${giver} paye pour des informations concrètes, pas des rumeurs.`,
]

const ESCORT_DESCS = [
  (giver: string, target: string) =>
    `${giver} a besoin que tu escortes quelqu'un jusqu'à ${target}. La personne est coopérative. L'espace, moins.`,
  (_: string, target: string) =>
    `Transport VIP. Destination ${target}. Le passager monte à bord maintenant. Pas de détours.`,
  (giver: string, target: string) =>
    `Un passager délicat à conduire jusqu'à ${target}. ${giver} insiste : tu ne poses pas de questions sur qui c'est.`,
  (giver: string, target: string) =>
    `${giver} a quelqu'un qui doit absolument arriver vivant à ${target}. Toi, tu t'assures que ça se passe.`,
  (_: string, target: string) =>
    `Extraction sécurisée vers ${target}. Le passager a des ennemis. Quelques-uns pourraient être en route.`,
]

const SABOTAGE_DESCS = [
  (giver: string, target: string) =>
    `${giver} veut déstabiliser ${target}. Un combat gagné là-bas envoie le bon message. Pas besoin d'en faire plus.`,
  (_: string, target: string) =>
    `Opération de pression sur ${target}. Neutraliser un adversaire sur place. Le reste, la station s'en souviendra.`,
  (giver: string, target: string) =>
    `${giver} veut que ${target} sache qu'ils ne sont pas intouchables. Résultat attendu : un ennemi vaincu sur place.`,
  (_: string, target: string) =>
    `Sabotage indirect. Gagner un combat à ${target} suffira à perturber leurs opérations pendant quelques jours.`,
]

const HEIST_DESCS = [
  (item: string, giver: string, target: string) =>
    `${item} se trouve à ${target}. ${giver} en a besoin. La méthode d'acquisition n'est pas son problème.`,
  (item: string, _: string, target: string) =>
    `Récupérer ${item} à ${target}. Achat, vol, échange — peu importe. Ce qui compte c'est le résultat.`,
  (item: string, giver: string, target: string) =>
    `${giver} veut ${item} provenant spécifiquement de ${target}. Le prix sera remboursé. Plus une prime.`,
  (item: string, _: string, target: string) =>
    `${item} sur ${target}. Tu trouves comment te le procurer là-bas. Retour avec la marchandise, paiement direct.`,
]

const EXTRACTION_DESCS = [
  (item: string, giver: string, target: string) =>
    `${item} laissé sur ${target} dans des circonstances précipitées. ${giver} te paye pour le récupérer et le ramener.`,
  (item: string, _: string, target: string) =>
    `Extraction de ${item} depuis ${target}. Ramène-le intact. Quelqu'un d'autre avait besoin de partir vite.`,
  (item: string, giver: string, target: string) =>
    `${giver} a du matériel bloqué sur ${target}. Récupérer ${item} et le rapatrier ici. Paiement à la livraison.`,
  (item: string, _: string, target: string) =>
    `${item} sur ${target} appartient à quelqu'un d'autre que ceux qui le détiennent. Va le chercher.`,
]

const BOUNTY_DESCS = [
  (boss: string, giver: string, target: string) =>
    `Prime sur ${boss} à ${target}. ${giver} vérifiera par ses propres sources. Mort ou hors de combat.`,
  (boss: string, _: string, target: string) =>
    `${boss} a des ennemis influents. L'un d'eux paye pour une résolution définitive sur ${target}.`,
  (boss: string, _: string, target: string) =>
    `Contrat de chasse. Cible : ${boss}. Lieu : ${target}. Pas de délai. Pas de pitié. Paiement à résultats.`,
  (boss: string, giver: string, target: string) =>
    `${giver} traque ${boss} depuis longtemps. Il/elle ne peut pas finir ça lui/elle-même. Toi si. ${target}.`,
]

const PATROL_DESCS = [
  (_: string, giver: string, target: string) =>
    `${giver} tient à ce que ${target} reste sous contrôle. Trois passages actifs — explorer, se montrer, décourager les problèmes. Paiement à la sécurisation.`,
  (_: string, _2: string, target: string) =>
    `Zone instable sur ${target}. Il faut une présence physique : circuler, explorer les accès, traîner dans les points chauds. Trois actions sur place.`,
  (_: string, giver: string, target: string) =>
    `${giver} a des actifs sur ${target} qui doivent rester intacts. Sécuriser la zone en trois passages — pas de rapport, juste de la présence.`,
  (_: string, _2: string, target: string) =>
    `Maintien de l'ordre sur ${target}. Pas de bureau, pas de formulaire — juste se montrer partout où ça craint, trois fois. Ça suffit généralement.`,
]

// ── GÉNÉRATEUR PRINCIPAL ─────────────────────────────────────────────────────

const ALL_TYPES: QuestType[] = [
  'delivery','kill','revenge',
  'escort','sabotage','heist','extraction','bounty','patrol',
]

// Types dont la complétion exige de vaincre le chef de la station cible —
// ce combat ne peut se déclencher (via exploration) que si danger >= 2.
// Une station trop calme rendrait la quête littéralement impossible.
export const BOSS_TRIGGER_TYPES: QuestType[] = ['kill', 'revenge', 'sabotage', 'bounty']

// Poids par type pour le tirage (rare = plus intéressant)
const TYPE_WEIGHTS: Record<QuestType, number> = {
  delivery:   20, revenge:   15, kill:      12,
  escort:     10, sabotage:  8,  extraction: 8,  heist:     5,
  bounty:     5,  patrol:    3,
}

function pickWeightedType(available: QuestType[]): QuestType {
  const total = available.reduce((s, t) => s + TYPE_WEIGHTS[t], 0)
  let r = Math.random() * total
  for (const t of available) {
    r -= TYPE_WEIGHTS[t]
    if (r <= 0) return t
  }
  return available[available.length - 1]
}

export function generateQuest(gs: GameState): Quest | null {
  const accessible = getAccessibleStations(gs.currentStation)
    .filter(s => s.name !== gs.currentStation)
  if (accessible.length === 0) return null

  const usedCombos = new Set(gs.activeQuests.map(q => `${q.type}:${q.targetStation}`))

  const candidates = accessible.filter(s =>
    ALL_TYPES.some(t => !usedCombos.has(`${t}:${s.name}`))
  )
  const pool = candidates.length > 0 ? candidates : accessible
  const target = pick(pool)

  const giver = pick(GIVER_NAMES)
  const id    = Math.random().toString(36).slice(2, 8)

  const typesForTarget = target.danger < 2 ? ALL_TYPES.filter(t => !BOSS_TRIGGER_TYPES.includes(t)) : ALL_TYPES
  const availableTypes = typesForTarget.filter(t => !usedCombos.has(`${t}:${target.name}`))
  const types = availableTypes.length > 0 ? availableTypes : typesForTarget
  const type  = pickWeightedType(types)

  const dayMult = +Math.min(2.5, 1 + (gs.day - 1) * 0.05).toFixed(2)
  const scale   = (base: number) => Math.round(base * dayMult * ECONOMY_MULT)

  switch (type) {
    case 'delivery': {
      // 20% de chance de cibler une pièce exclusive à l'Atelier — introuvable
      // en achat, doit être fabriquée. Récompense majorée en conséquence.
      const isCrafted = Math.random() < 0.20
      const item   = isCrafted ? pick(CRAFTED_DELIVERY_ITEMS) : pick(DELIVERY_ITEMS)
      const reward = isCrafted ? scale(rng(1400, 3200)) : scale(rng(600, 2200))
      const desc   = isCrafted
        ? `${giver} a besoin de ${item} — une pièce qui ne s'achète nulle part. Il faut la fabriquer à l'Atelier avant de pouvoir la livrer à ${target.name}.`
        : pick(DELIVERY_DESCS)(item, giver, target.name)
      return { id, title: `Livraison : ${item}`, giver, giverStation: gs.currentStation, type,
        description: desc, targetStation: target.name, targetItem: item, creditReward: reward, repReward: isCrafted ? 15 : 10, dayMult }
    }
    case 'kill': {
      const boss   = BOSS_NAMES[target.name] ?? `le chef de ${target.name}`
      const reward = scale(rng(1500, 5000))
      const desc   = pick(KILL_DESCS)(boss, giver, target.name)
      return { id, title: `Contrat : ${boss}`, giver, giverStation: gs.currentStation, type,
        description: desc, targetStation: target.name, creditReward: reward, repReward: 25, dayMult }
    }
    case 'revenge': {
      const reward = scale(rng(900, 2800))
      const desc   = pick(REVENGE_DESCS)('', giver, target.name)
      return { id, title: `Règlement de comptes — ${target.name}`, giver, giverStation: gs.currentStation, type,
        description: desc, targetStation: target.name, creditReward: reward, repReward: 18, dayMult }
    }
    case 'escort': {
      const reward = scale(rng(1400, 3500))
      const desc   = pick(ESCORT_DESCS)(giver, target.name)
      return { id, title: `Escorte vers ${target.name}`, giver, giverStation: gs.currentStation, type,
        description: desc, targetStation: target.name, targetItem: 'Passager', creditReward: reward, repReward: 15, dayMult }
    }
    case 'sabotage': {
      const reward = scale(rng(1800, 4500))
      const desc   = pick(SABOTAGE_DESCS)(giver, target.name)
      return { id, title: `Sabotage — ${target.name}`, giver, giverStation: gs.currentStation, type,
        description: desc, targetStation: target.name, creditReward: reward, repReward: -5, dayMult }
    }
    case 'heist': {
      const item   = pick(HEIST_ITEMS)
      const reward = scale(rng(2200, 5500))
      const desc   = pick(HEIST_DESCS)(item, giver, target.name)
      return { id, title: `Acquisition : ${item}`, giver, giverStation: gs.currentStation, type,
        description: desc, targetStation: target.name, targetItem: item, creditReward: reward, repReward: 5, dayMult }
    }
    case 'extraction': {
      const item   = pick(EXTRACTION_ITEMS)
      const reward = scale(rng(1100, 3200))
      const desc   = pick(EXTRACTION_DESCS)(item, giver, target.name)
      return { id, title: `Extraction depuis ${target.name}`, giver, giverStation: gs.currentStation, type,
        description: desc, targetStation: target.name, targetItem: item, creditReward: reward, repReward: 12, dayMult }
    }
    case 'bounty': {
      const boss   = BOSS_NAMES[target.name] ?? `un chef de guerre à ${target.name}`
      const reward = scale(rng(3000, 7000))
      const desc   = pick(BOUNTY_DESCS)(boss, giver, target.name)
      return { id, title: `Prime — ${boss}`, giver, giverStation: gs.currentStation, type,
        description: desc, targetStation: target.name, creditReward: reward, repReward: 35, dayMult }
    }
    case 'patrol': {
      const reward = scale(rng(500, 1800))
      const desc   = pick(PATROL_DESCS)('', giver, target.name)
      return { id, title: `Patrouille : ${target.name}`, giver, giverStation: gs.currentStation, type,
        description: desc, targetStation: target.name, creditReward: reward, repReward: 6, dayMult }
    }
  }
}

// ── QUÊTES ENCHAÎNÉES ────────────────────────────────────────────────────────

const CHAIN_CHANCE: Partial<Record<QuestType, number>> = {
  delivery: 0.45, escort: 0.40, extraction: 0.40, patrol: 0.35,
  kill: 0.30, revenge: 0.25, bounty: 0.25, sabotage: 0.20, heist: 0.20,
}

const CHAIN_FOLLOW: Partial<Record<QuestType, QuestType[]>> = {
  delivery:   ['delivery', 'extraction', 'escort'],
  escort:     ['delivery', 'extraction'],
  extraction: ['delivery', 'heist'],
  patrol:     ['patrol', 'bounty'],
  kill:       ['bounty', 'kill'],
  revenge:    ['kill', 'bounty'],
  bounty:     ['bounty', 'kill'],
  sabotage:   ['kill', 'sabotage'],
  heist:      ['delivery', 'heist'],
}

const CHAIN_DESCS: Record<QuestType, (prev: Quest) => string> = {
  delivery:   q => `Suite directe du contrat avec ${q.giver}. 'Il y a plus à transporter que prévu — même route, même tarif, plus de marchandise.' Fiable.`,
  escort:     q => `${q.giver} a un second passager délicat à escorter. 'Même discrétion que la première fois. Tu sais comment ça marche.' Paiement majoré.`,
  extraction: q => `${q.giver} a laissé autre chose là-bas. 'Je savais que j'aurais besoin de toi une deuxième fois. C'est prêt.' Bonus sur la précédente mission.`,
  patrol:     q => `Zone toujours instable selon ${q.giver}. 'Repasse là-bas — la situation a bougé. Trois passages, comme avant.' Récompense augmentée.`,
  kill:       q => `La cible avait des associés. ${q.giver} les a tracés. 'Le travail n'était qu'à moitié fait. Tu veux finir ce qu'on a commencé ?' Prime élevée.`,
  revenge:    q => `${q.giver} a identifié d'autres responsables. 'Il en reste. Même station, même méthode. Tu veux la suite ?' Plus difficile. Plus payant.`,
  bounty:     q => `Contrat en cascade. La cible précédente avait un commanditaire. ${q.giver} a remonté la piste. 'La vraie tête est là-bas.' Prime plus haute.`,
  sabotage:   q => `${q.giver} veut aller plus loin. 'Ce qu'on a fait a déstabilisé les choses. Maintenant c'est le moment d'enfoncer le clou.' Même cible, autre mission.`,
  heist:      q => `${q.giver} a repéré autre chose sur place. 'En y allant, t'as vu ce que j'avais pas vu. Y'a plus à prendre là-bas.' Acquisition supplémentaire.`,
}

export function generateChainQuest(completed: Quest, gs: GameState): Quest | null {
  const chance = CHAIN_CHANCE[completed.type] ?? 0
  if (Math.random() > chance) return null

  const followTypes = CHAIN_FOLLOW[completed.type] ?? [completed.type]
  const newType = followTypes[Math.floor(Math.random() * followTypes.length)]

  const accessible = getAccessibleStations(gs.currentStation).filter(s => s.name !== gs.currentStation)
  if (accessible.length === 0) return null
  const targetPool = BOSS_TRIGGER_TYPES.includes(newType) ? accessible.filter(s => s.danger >= 2) : accessible
  if (targetPool.length === 0) return null
  const target = targetPool[Math.floor(Math.random() * targetPool.length)]

  const id = Math.random().toString(36).slice(2, 8)
  const dayMult = +Math.min(2.5, 1 + (gs.day - 1) * 0.05).toFixed(2)
  const scale = (base: number) => Math.round(base * dayMult * 1.25 * ECONOMY_MULT)

  const targetItem = ['delivery','extraction','heist'].includes(newType)
    ? pick(newType === 'delivery' ? DELIVERY_ITEMS : newType === 'extraction' ? EXTRACTION_ITEMS : HEIST_ITEMS)
    : undefined

  const REWARDS: Record<QuestType, [number, number]> = {
    delivery: [700, 2500], escort: [1500, 4000], extraction: [1200, 3500],
    patrol: [900, 2500], kill: [1700, 5500], revenge: [1000, 3200],
    bounty: [3200, 7500], sabotage: [2000, 5000], heist: [2500, 6000],
  }
  const [rMin, rMax] = REWARDS[newType]
  const creditReward = scale(rng(rMin, rMax))
  const repReward = Math.round((completed.repReward ?? 10) * 1.3)

  return {
    id, title: `[SUITE] ${completed.title}`,
    giver: completed.giver, giverStation: completed.giverStation,
    type: newType, targetStation: target.name, targetItem,
    description: CHAIN_DESCS[newType](completed),
    creditReward, repReward, dayMult,
  }
}

// ── COMPLICATIONS ────────────────────────────────────────────────────────────

export type QuestComplication =
  | { type: 'normal' }
  | { type: 'bad_faith';   quest: Quest }
  | { type: 'intercepted'; quest: Quest }
  | { type: 'customs';     quest: Quest }
  | { type: 'client_dead'; quest: Quest }
  | { type: 'ambush';      quest: Quest }

export function checkDeliveryComplication(quest: Quest): QuestComplication {
  if (Math.random() >= 0.28) return { type: 'normal' }
  const roll = Math.floor(Math.random() * 5)
  switch (roll) {
    case 0: return { type: 'bad_faith',   quest }
    case 1: return { type: 'intercepted', quest }
    case 2: return { type: 'customs',     quest }
    case 3: return { type: 'client_dead', quest }
    default: return { type: 'ambush',     quest }
  }
}

// ── COMPLÉTION ────────────────────────────────────────────────────────────────

export function checkQuestsOnArrival(gs: GameState): { completed: Quest[]; complications: QuestComplication[] } {
  const completed: Quest[] = []
  const complications: QuestComplication[] = []

  for (const q of gs.activeQuests) {
    // Quêtes qui se complètent à la station CIBLE
    if (q.targetStation === gs.currentStation) {
      if (q.type === 'escort' && (gs.cargo['Passager'] ?? 0) > 0) {
        completed.push(q)
        // delivery et heist nécessitent une livraison manuelle depuis le hub (voir StationHub)
      } else if ((q.type === 'revenge' || q.type === 'sabotage') && gs.stationBossesBeaten.includes(q.targetStation)) {
        completed.push(q)
      } else if ((q.type === 'kill' || q.type === 'bounty') && gs.stationBossesBeaten.includes(q.targetStation)) {
        completed.push(q)
      }
    }

    // Extraction : se complète en retournant à la station du DONNEUR avec l'item
    if (q.type === 'extraction' && q.giverStation === gs.currentStation
        && q.targetItem && (gs.cargo[q.targetItem] ?? 0) > 0) {
      completed.push(q)
    }
  }

  return { completed, complications }
}

export function completeQuest(gs: GameState, quest: Quest): Partial<GameState> {
  const newCargo = { ...gs.cargo }

  if ((quest.type === 'delivery' || quest.type === 'heist' || quest.type === 'extraction') && quest.targetItem) {
    const cur = newCargo[quest.targetItem] ?? 0
    if (cur <= 1) delete newCargo[quest.targetItem]
    else newCargo[quest.targetItem] = cur - 1
  }
  if (quest.type === 'escort') {
    const cur = newCargo['Passager'] ?? 0
    if (cur <= 1) delete newCargo['Passager']
    else newCargo['Passager'] = cur - 1
  }

  const rewardMult = getRunQuestRewardMult(gs)
  const baseReward = Math.floor(quest.creditReward * rewardMult)

  const result: Partial<GameState> = {
    credits: gs.credits + baseReward,
    reputation: gs.reputation + quest.repReward,
    activeQuests: gs.activeQuests.filter(q => q.id !== quest.id),
    completedQuestIds: [...gs.completedQuestIds, quest.id],
    cargo: newCargo,
    // Rayane — libre de rejouer cette récompense à pile ou face, ou de la garder.
    ...(gs.class.name === 'Rayane' ? { rayaneGambleOffer: baseReward } : {}),
  }

  // Quête tutorielle : révèle le tracker Nexus + bonus de bienvenue
  if (quest.id === TUTORIAL_QUEST_ID) {
    result.nexusTrackerUnlocked = true
  }

  if (quest.factionId && quest.factionId === gs.faction) {
    result.factionMissions = (gs.factionMissions ?? 0) + 1
  }

  if (quest.factionId && gs.factionReputation) {
    const rivals: Record<string, string> = { faucons: 'gardiens', gardiens: 'faucons', emporium: 'culte', culte: 'emporium' }
    const fkey = quest.factionId
    const rival = rivals[fkey]
    const newRep = Math.min(100, (gs.factionReputation[fkey as keyof typeof gs.factionReputation] ?? 0) + 20)
    const newRivalRep = rival ? Math.max(-100, (gs.factionReputation[rival as keyof typeof gs.factionReputation] ?? 0) - 10) : undefined
    result.factionReputation = {
      ...gs.factionReputation,
      [fkey]: newRep,
      ...(rival && newRivalRep !== undefined ? { [rival]: newRivalRep } : {}),
    }
  }

  return result
}

// ── RUMEURS ───────────────────────────────────────────────────────────────────

// ── MISSIONS DE FACTION ──────────────────────────────────────────────────────

const FACTION_ENEMY_STATIONS: Record<string, string[]> = {
  faucons:  ['La Citadelle Écarlate', 'Fort Ossian', "L'Arsenal Écarlate", 'Fort de Cendres'],
  gardiens: ['Arc Ouest Apocalypse', 'Le Nid des Faucons', 'Station Ombre', 'La Tanière'],
  emporium: ['Port Méridien', 'Nexus Aldara', "L'Entrepôt Zéro", 'La Forge Noire'],
  culte:    ['Le Purgatoire', 'Les Abysses de Velkor', 'Station Zéphyr', 'Nexus Aldara'],
}

const FACTION_MISSION_TYPES: Record<string, QuestType[]> = {
  faucons:  ['kill', 'sabotage'],
  gardiens: ['kill', 'sabotage'],
  emporium: ['delivery', 'heist'],
  culte:    ['delivery', 'escort'],
}

const FACTION_GIVERS: Record<string, string> = {
  faucons:  'Officier Faucon',
  gardiens: 'Commandante Garde',
  emporium: 'Agent Emporium',
  culte:    'Disciple du Vide',
}

export function generateFactionMission(gs: GameState, factionId: string): Quest | null {
  const stations = FACTION_ENEMY_STATIONS[factionId]
  const types    = FACTION_MISSION_TYPES[factionId]
  if (!stations || !types) return null

  const usedTargets = new Set(
    gs.activeQuests.filter(q => q.factionId === factionId).map(q => q.targetStation)
  )
  const pool = stations.filter(s => s !== gs.currentStation && !usedTargets.has(s))
  const target = pick(pool.length > 0 ? pool : stations.filter(s => s !== gs.currentStation))
  if (!target) return null

  const type    = pick(types)
  const giver   = FACTION_GIVERS[factionId] ?? 'Officier'
  const id      = Math.random().toString(36).slice(2, 8)
  const dayMult = +Math.min(2.5, 1 + (gs.day - 1) * 0.05).toFixed(2)
  const scale   = (base: number) => Math.round(base * dayMult * ECONOMY_MULT)

  switch (type) {
    case 'kill': {
      const boss   = BOSS_NAMES[target] ?? `le chef de ${target}`
      const reward = scale(rng(2500, 6000))
      return { id, factionId, title: `[FACTION] Éliminer ${boss}`, giver, giverStation: gs.currentStation, type,
        description: `Mission officielle. ${boss} sur ${target} représente une menace directe. L'élimination doit avoir lieu sur place — gagne un combat contre le boss là-bas pour compléter.`,
        targetStation: target, creditReward: reward, repReward: 15, dayMult }
    }
    case 'sabotage': {
      const reward = scale(rng(2000, 5000))
      return { id, factionId, title: `[FACTION] Opération sur ${target}`, giver, giverStation: gs.currentStation, type,
        description: `Rends-toi sur ${target} et gagne un combat là-bas. Ça envoie le message — l'ennemi doit comprendre que vos territoires ont des limites.`,
        targetStation: target, creditReward: reward, repReward: 10, dayMult }
    }
    case 'delivery': {
      const item   = pick(DELIVERY_ITEMS)
      const reward = scale(rng(1500, 4000))
      return { id, factionId, title: `[FACTION] Livraison : ${item} vers ${target}`, giver, giverStation: gs.currentStation, type,
        description: `L'Emporium a besoin que ${item} arrive sur ${target}. Prends la marchandise et livre-la en main propre — paiement à l'arrivée avec le bonus faction.`,
        targetStation: target, targetItem: item, creditReward: reward, repReward: 10, dayMult }
    }
    case 'heist': {
      const item   = pick(HEIST_ITEMS)
      const reward = scale(rng(3000, 7000))
      return { id, factionId, title: `[FACTION] Acquisition : ${item} depuis ${target}`, giver, giverStation: gs.currentStation, type,
        description: `L'Emporium veut ${item} provenant de ${target}. Vas-y, procure-le comme tu l'entends, reviens avec — paiement garanti plus bonus faction.`,
        targetStation: target, targetItem: item, creditReward: reward, repReward: 10, dayMult }
    }
    case 'escort': {
      const reward = scale(rng(2000, 5000))
      return { id, factionId, title: `[FACTION] Escorte vers ${target}`, giver, giverStation: gs.currentStation, type,
        description: `Un émissaire du Culte doit rejoindre ${target}. Embarque le passager et escorte-le à destination.`,
        targetStation: target, targetItem: 'Passager', creditReward: reward, repReward: 12, dayMult }
    }
    default: return null
  }
}

export const GOSSIP: Record<string, string[]> = {
  'La Carcasse': [
    "Une cache de crédits du vieux régime serait quelque part dans les soutes nord.",
    "Un vaisseau Faucon Noir rôdait autour de la station la nuit dernière. Personne ne sait pourquoi.",
    "Le prix du carburant monte encore. Quelqu'un contrôle les flux — et c'est pas nous.",
    "Un mécano a disparu hier. Il travaillait sur quelque chose qu'il n'aurait pas dû toucher.",
    "On parle d'une nouvelle route commerciale qui court-circuite Port Méridien. Les marchands sont nerveux.",
  ],
  'Arc Ouest Apocalypse': [
    "Alanossa cherche quelqu'un pour une mission. Pas de détails. Rémunération extrême.",
    "Trois vaisseaux ne sont pas rentrés la semaine dernière. Zone d'Alanossa.",
    "On murmure qu'Alanossa a une prime sur quelqu'un de nouveau. Peut-être toi.",
    "Les Faucons Noirs recrutent. Critères flous. Survie à l'entretien non garantie.",
    "Un transfuge de l'Emporium s'est réfugié ici. Il a des informations. Et des ennemis.",
  ],
  'Port Méridien': [
    "Les prix vont monter la semaine prochaine. Source sûre. Achète maintenant.",
    "Une livraison mystérieuse est arrivée hier soir sans destinataire. Elle attend toujours.",
    "La sécurité est renforcée. Quelqu'un d'important est attendu — ou quelqu'un de dangereux.",
    "Un pilote a proposé une route directe vers les zones profondes. Personne n'a accepté.",
    "L'Emporium ouvre un bureau ici. Les marchands indépendants commencent à s'inquiéter.",
  ],
  'Les Bas-Fonds de Vega': [
    "Boro a reçu un colis scellé hier. Il n'a pas dormi depuis.",
    "Une faction cherche un transporteur discret. Très discret. Paiement en liquide non traçable.",
    "La douane a été corrompue. Pour combien de temps, personne ne sait.",
    "Quelqu'un vend des plans militaires volés. Le vendeur change d'adresse toutes les heures.",
    "Un chasseur de primes est arrivé ce matin. Il cherche quelqu'un. Peut-être toi.",
  ],
  'Fort Kharos': [
    "L'armée prépare une opération dans les zones profondes. Recrutement en cours.",
    "Un officier a disparu avec l'équipement de sa section. Enquête interne.",
    "Des munitions expérimentales ont été testées la semaine dernière. Résultats classifiés.",
    "Un convoi militaire a été attaqué sur la route de La Carcasse. Aucun survivant.",
    "Les Gardiens cherchent un informateur dans leurs rangs. L'ambiance est tendue.",
  ],
  'La Citadelle Écarlate': [
    "Myrra a convoqué tous ses lieutenants ce matin. Réunion à huis clos.",
    "Une délégation de l'Emporium est arrivée hier. On ne sait pas de quoi ils ont parlé.",
    "Un tournoi clandestin est organisé dans les niveaux inférieurs. Mise d'entrée : 500cr.",
    "Les Gardiens ont perdu un poste avancé dans les ruines. Ils n'ont pas communiqué sur les pertes.",
    "Quelqu'un a graffité 'LE VIDE ARRIVE' dans sept couloirs différents. L'ambiance est étrange.",
  ],
  'Le Purgatoire': [
    "Neva dit qu'elle a vu quelque chose dans les couloirs du niveau 7. Elle refuse de préciser.",
    "Un ancien prisonnier est revenu. Il cherche quelque chose qu'il a laissé ici.",
    "Le Culte du Vide tient des réunions dans les sous-niveaux. Participants inconnus.",
    "Une vieille dette de jeu refait surface. Ça va finir en sang, comme d'habitude.",
    "Un puits d'extraction abandonné a été rouvert. On ne sait pas par qui ni pourquoi.",
  ],
  'Nexus Aldara': [
    "Lira a cracké un système qui ne devait pas être crackable. Elle est introuvable depuis.",
    "Un prototype d'IA militaire a été volé. L'armée cherche — discrètement.",
    "Des anomalies dans le réseau local depuis trois jours. Origine non identifiée.",
    "Un ingénieur propose de vendre les plans d'un système de propulsion interdit. Preneurs nombreux.",
    "Une équipe de recherche n'est pas rentrée de sa dernière expédition. Leur matériel, si.",
  ],
  default: [
    "Les routes commerciales changent. Certaines deviennent dangereuses du jour au lendemain.",
    "Une guerre de factions couve quelque part dans le secteur. Ça va déborder.",
    "On parle d'un trésor oublié dans une zone que personne ne visite plus. Pour une bonne raison.",
    "Le marché noir est actif. Quelqu'un vend quelque chose qui ne devrait pas exister.",
    "Un pilote a disparu sur la route de la semaine dernière. Son vaisseau a été retrouvé vide.",
    "Les prix du carburant fluctuent bizarrement. Quelqu'un manipule les marchés.",
    "Une rumeur court sur un fragment Nexus caché dans une station abandonnée.",
    "Des survivants d'une bataille évoquent une arme inconnue. Personne ne les croit vraiment.",
  ]
}

// ── QUÊTES PNJ ───────────────────────────────────────────────────────────────

const NPC_QUEST_PROFILES: Record<string, { types: QuestType[]; items?: string[]; creditMult?: number; repMult?: number; flavor: string }> = {
  'Ferrailleur': { types: ['delivery','extraction'], items: ['Pièces techniques','Composants électroniques','Métaux bruts'], creditMult: 1.0, flavor: "a des pièces à récupérer ou livrer" },
  'Marchande':   { types: ['delivery','escort'], items: ['Médicaments','Vivres','Composants électroniques'], creditMult: 1.0, flavor: "a une route commerciale à couvrir" },
  'Vétéran':     { types: ['revenge','bounty'], creditMult: 1.3, repMult: 1.5, flavor: "a des comptes à régler" },
  'Hackeuse':    { types: ['heist','sabotage'], items: ['Données classifiées','Logiciels'], creditMult: 1.4, flavor: "a besoin d'accès à des systèmes" },
  'Dealer':      { types: ['delivery','escort'], items: ['Pièces de contrebande','Drogues de synthèse'], creditMult: 1.2, flavor: "a des livraisons délicates" },
  'Lieutenant':  { types: ['sabotage','bounty'], creditMult: 1.5, repMult: 0.8, flavor: "a une mission pour les Faucons" },
  'Survivante':  { types: ['patrol','extraction'], items: ['Artefacts','Données'], creditMult: 0.9, repMult: 1.4, flavor: "a besoin de savoir ce qui se passe ailleurs" },
  'Courtier':    { types: ['delivery','heist'], items: ['Renseignements','Artefacts','Or'], creditMult: 1.3, flavor: "a des affaires à faire circuler" },
  'Organisateur':{ types: ['delivery','patrol'], creditMult: 1.1, flavor: "a des intérêts à surveiller" },
  'Commandante': { types: ['bounty','sabotage'], creditMult: 1.4, repMult: 1.3, flavor: "a une cible à neutraliser" },
  'Chercheuse':  { types: ['heist','extraction'], items: ['Artefacts','Composants expérimentaux','Données classifiées'], creditMult: 1.2, repMult: 1.2, flavor: "cherche des artefacts" },
  'Pilote retraité': { types: ['patrol','escort'], creditMult: 0.9, repMult: 1.1, flavor: "connaît des routes que personne d'autre ne connaît" },
  'Forgeron':    { types: ['extraction','delivery'], items: ['Métaux rares','Cristaux énergétiques',"Composants d'armure"], creditMult: 1.0, flavor: "a besoin de matériaux pour forger" },
  'Fermier':     { types: ['delivery','patrol'], items: ['Nourriture fraîche','Eau purifiée','Équipement agricole'], creditMult: 0.8, repMult: 1.3, flavor: "a une livraison à faire" },
  'Recruteur':   { types: ['sabotage','bounty'], creditMult: 1.4, repMult: 0.7, flavor: "recrute pour les Faucons Noirs" },
  'Officière':   { types: ['revenge','bounty'], creditMult: 1.2, repMult: 1.1, flavor: "a un dossier non résolu" },
  'Gardien':     { types: ['extraction','heist'], items: ['Marchandises volées','Données','Artefacts'], creditMult: 1.3, flavor: "gère des choses qui appartiennent à personne" },
  'Conseiller':  { types: ['bounty','kill'], creditMult: 1.6, repMult: 1.0, flavor: "a besoin d'informations sur des cibles importantes" },
}

export function generateNpcQuest(gs: GameState, npcName: string, npcRole: string, npcStation: string): Quest | null {
  const accessible = getAccessibleStations(npcStation).filter(s => s.name !== npcStation)
  if (accessible.length === 0) return null
  const target = accessible[Math.floor(Math.random() * accessible.length)]
  const profile = NPC_QUEST_PROFILES[npcRole]
  if (!profile) return null

  const type = profile.types[Math.floor(Math.random() * profile.types.length)]
  const item  = profile.items ? profile.items[Math.floor(Math.random() * profile.items.length)] : undefined
  const creditBase = Math.round(rng(1200, 3500) * ECONOMY_MULT)
  const creditReward = Math.floor(creditBase * (profile.creditMult ?? 1.0))
  const repReward = Math.floor(rng(8, 20) * (profile.repMult ?? 1.0))
  const id = Math.random().toString(36).slice(2, 8)

  const descriptions: Record<QuestType, string> = {
    delivery:   `${npcName} ${profile.flavor}. Porter ${item ?? 'un colis'} jusqu'à ${target.name}. Paiement à l'arrivée.`,
    revenge:    `${npcName} ${profile.flavor}. Des gens sur ${target.name} ont fait quelque chose qu'ils n'auraient pas dû. Y aller et le faire comprendre.`,
    kill:       `${npcName} ${profile.flavor}. Neutraliser une cible sur ${target.name}. Pas de questions sur les méthodes.`,
    patrol:     `${npcName} ${profile.flavor}. Passer sur ${target.name} et s'assurer que tout est en ordre. Rapport au retour.`,
    escort:     `${npcName} ${profile.flavor}. Conduire un passager jusqu'à ${target.name}. Sécurité garantie, paiement à l'arrivée.`,
    sabotage:   `${npcName} ${profile.flavor}. Opération sur ${target.name} — gagner un combat là-bas. Le message passera.`,
    extraction: `${npcName} ${profile.flavor}. ${item ?? 'Quelque chose'} est bloqué sur ${target.name}. Aller le récupérer et le ramener.`,
    heist:      `${npcName} ${profile.flavor}. Acquérir ${item ?? 'un objet spécifique'} sur ${target.name}. La méthode est laissée à ton appréciation.`,
    bounty:     `${npcName} ${profile.flavor}. Prime sur une cible sur ${target.name}. Mort ou hors de combat — peu importe.`,
  }

  return {
    id, giver: npcName, giverStation: npcStation, type,
    title: `${npcName} — ${type.toUpperCase()}`,
    description: descriptions[type],
    targetStation: target.name,
    targetItem: (type === 'delivery' || type === 'extraction' || type === 'heist') ? item : undefined,
    creditReward, repReward,
  }
}

export function getGossip(station: string): string {
  const lines = GOSSIP[station] ?? GOSSIP['default']
  return lines[Math.floor(Math.random() * lines.length)]
}

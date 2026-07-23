import type { GameState, PersistentNpc, NpcReaction } from '../types'

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

export function getNpc(gs: GameState, id: string, name: string, station: string): PersistentNpc {
  if (gs.knownNpcs[id]) return gs.knownNpcs[id]
  return { id, name, station, firstMetDay: gs.day, timesMet: 0, repDelta: 0, isAlly: false, isEnemy: false, tags: [] }
}

export function recordMeeting(npc: PersistentNpc, repDelta = 0, tag?: string): PersistentNpc {
  return {
    ...npc,
    timesMet: npc.timesMet + 1,
    repDelta: npc.repDelta + repDelta,
    tags: tag ? [...npc.tags, tag] : npc.tags,
  }
}

export function getNpcReaction(npc: PersistentNpc, gs: GameState): NpcReaction {
  if (npc.isAlly)  return 'ally'
  if (npc.isEnemy) return 'hostile'
  if (npc.repDelta >= 50)  return 'friendly'
  if (npc.repDelta >= 20)  return 'warm'
  if (npc.repDelta <= -30) return 'cold'
  if (gs.reputation <= -100) return 'cold'
  return 'neutral'
}

const ALLY_GREETINGS = [
  "Toujours en vie. Bonne nouvelle.",
  "Je savais que tu reviendrais.",
  "Tu m'as manqué, d'une certaine façon.",
]
const FRIENDLY_GREETINGS = [
  "Tiens, te revoilà.",
  "Bon retour. Tu veux quelque chose à boire ?",
  "Encore toi. C'est pas une plainte.",
]
const HOSTILE_GREETINGS = [
  "On a un problème non réglé.",
  "T'aurais pas dû revenir.",
  "Je t'attendais.",
]
const COLD_GREETINGS = [
  "...",
  "Tu veux quoi.",
  "Je t'ai pas invité.",
]

export function getNpcGreeting(npc: PersistentNpc, reaction: NpcReaction): string {
  switch (reaction) {
    case 'ally':     return pick(ALLY_GREETINGS)
    case 'friendly': case 'warm': return pick(FRIENDLY_GREETINGS)
    case 'hostile':  return pick(HOSTILE_GREETINGS)
    case 'cold':     return pick(COLD_GREETINGS)
    default:         return `${npc.name} te regarde. Il se souvient de toi.`
  }
}

// ── PNJs nommés du jeu ────────────────────────────────────────────────────────

export interface NamedNpcDef {
  id: string
  name: string
  station: string
  role: string
  description: string
}

export const NAMED_NPCS: NamedNpcDef[] = [
  { id: 'marek',    name: 'Marek',     station: 'La Carcasse',         role: 'Ferrailleur', description: "Il répare des vaisseaux depuis trente ans. Il sait des choses." },
  { id: 'sela',     name: 'Sela',      station: 'Port Méridien',       role: 'Marchande',   description: "Souriante. Efficace. Jamais vraiment honnête." },
  { id: 'torvak',   name: 'Torvak',    station: 'Fort Kharos',         role: 'Vétéran',     description: "Soixante ans de service. Il a vu des choses qu'il ne raconte plus." },
  { id: 'lira',     name: 'Lira',      station: 'Nexus Aldara',        role: 'Hackeuse',    description: "Elle connaît tes mots de passe. Elle ne les utilise pas — encore." },
  { id: 'boro',     name: 'Boro',      station: 'Les Bas-Fonds de Vega', role: 'Dealer',    description: "Il vend des choses dont tu n'as pas besoin mais que tu voudras quand même." },
  { id: 'cael',     name: 'Cael',      station: 'Arc Ouest Apocalypse', role: 'Lieutenant', description: "Bras droit d'Alanossa. Efficace. Discret. Mortel." },
  { id: 'neva',     name: 'Neva',      station: 'Le Purgatoire',       role: 'Survivante',  description: "Elle est là depuis l'époque où c'était encore une vraie prison." },
  { id: 'pistis',   name: 'Pistis',    station: 'Emporium Requiem',    role: 'Courtier',    description: "Il fait le lien entre ceux qui veulent vendre et ceux qui veulent pas savoir d'où ça vient." },
  { id: 'ganz',     name: 'Ganz',      station: 'Star Quest',          role: 'Organisateur',description: "Il gère les paris, les arènes, et les secrets des riches." },
  { id: 'myrra',    name: 'Myrra',     station: 'La Citadelle Écarlate', role: 'Commandante', description: "Elle commande les Gardiens Écarlates sur cette station. Elle juge vite." },
  { id: 'ysla',     name: 'Ysla',      station: 'Les Abysses de Velkor', role: 'Chercheuse', description: "Elle cherche quelque chose dans les ruines. Elle pense l'avoir trouvé." },
  { id: 'drela',    name: 'Drela',     station: 'Scotty Golden North', role: 'Pilote retraité', description: "Il a volé partout. Maintenant il boit et regarde les étoiles." },
  { id: 'rook',     name: 'Rook',      station: 'La Forge Noire',      role: 'Forgeron',    description: "Il fabrique des armes. Il pose pas de questions. Il fait des prix." },
  { id: 'vance',    name: 'Vance',     station: 'Colonie Perséphone',  role: 'Fermier',     description: "Calme. Mais ses yeux ont vu quelque chose que le calme cache mal." },
  { id: 'vosh',     name: 'Vosh',      station: 'Le Nid des Faucons',  role: 'Recruteur',   description: "Il évalue les candidats pour Alanossa. Un regard. Une seconde. Il a déjà décidé." },
  { id: 'orva',     name: 'Orva',      station: 'Fort Ossian',         role: 'Officière',   description: "Elle tient le fort quand Ossian dort. Soit elle te respecte, soit tu pars." },
  { id: 'besh',     name: 'Besh',      station: "L'Entrepôt Zéro",    role: 'Gardien',     description: "Il garde des choses qui n'appartiennent à personne — et il en tire profit." },
  { id: 'ulmo',     name: 'Ulmo',      station: "La Couronne d'Eos",   role: 'Conseiller',  description: "Il conseille ceux qui décident. Ce qu'il pense lui-même, personne ne le sait." },
  // Nouvelles stations
  { id: 'vael',     name: 'Vael',      station: 'Le Perchoir',         role: 'Sentinelle',  description: "Il compte les vaisseaux qui passent. Il n'en laisse pas passer beaucoup." },
  { id: 'kross',    name: 'Kross',     station: 'Station Ombre',       role: 'Opérateur',   description: "Il sait des choses sur tout le monde ici. Il choisit soigneusement ce qu'il garde." },
  { id: 'setta',    name: 'Setta',     station: 'Relais Noir',         role: 'Ravitailleuse', description: "Elle gère le stock, les prix, et les personnes non désirables. Dans cet ordre." },
  { id: 'fenn',     name: 'Fenn',      station: 'La Tanière',          role: 'Vieux pirate', description: "Il a connu Alanossa avant qu'elle soit Alanossa. Il s'en souvient différemment." },
  { id: 'torq',     name: 'Torq',      station: 'Fort de Cendres',     role: 'Sergent Faucon', description: "Discipline et loyauté. Dans cet ordre. Il ne sourit pas souvent." },
  { id: 'lyss',     name: 'Lyss',      station: "L'Œil du Faucon",    role: 'Analyste',    description: "Elle voit des patterns dans des données que personne d'autre ne lit." },
  { id: 'mako',     name: 'Mako',      station: 'Repaire Vega-Sud',    role: 'Tenancier',   description: "Il tient le bar le plus risqué du secteur avec une sérénité déconcertante." },
  { id: 'harek',    name: 'Harek',     station: 'Bastion Mineur',      role: 'Capitaine',   description: "Il tient son poste depuis huit ans. Il n'a pas demandé à en partir." },
  { id: 'sera',     name: 'Sera',      station: 'Poste Vigie',         role: 'Guetteur',    description: "Elle a vu tout ce qui passe dans ce couloir spatial depuis cinq ans. Tout." },
  { id: 'drav',     name: 'Drav',      station: "L'Arsenal Écarlate",  role: "Maître d'armes", description: "Ce qu'il ne peut pas réparer, il ne l'a pas encore rencontré." },
  { id: 'keln',     name: 'Keln',      station: 'La Forteresse Exilée', role: 'Exilé',      description: "Il dirigeait une garnison des Gardiens. Il n'en parle pas." },
  { id: 'mira-c',   name: 'Mira',      station: 'Comptoir Sud',        role: 'Commerçante', description: "Elle sourit à tout le monde et se souvient de chaque prix." },
  { id: 'rexx',     name: 'Rexx',      station: 'Annexe Commerciale',  role: 'Représentant', description: "Costume propre, mots choisis. Ce qu'il pense, il le garde pour lui." },
  { id: 'olin',     name: 'Olin',      station: 'Relais de Transit',   role: 'Logisticien', description: "Il sait où chaque caisse est. Il sait aussi où certaines ne devraient pas être." },
  { id: 'sonn',     name: 'Lady Sonn', station: 'Résidence Orbitale',  role: 'Résidente',   description: "Elle vit ici depuis trente ans. Elle a vu assez de gens pour ne plus s'étonner de rien." },
  { id: 'sael',     name: 'Sael',      station: 'Club Privé Éos',      role: "Maître d'hôtel", description: "Il sait tout ce qui se dit dans ce club. Il ne le répètera jamais. Sauf une fois." },
  { id: 'murn',     name: 'Murn',      station: 'Les Cendres',         role: 'Survivant',   description: "Il était là quand ça a brûlé. Il est encore là. Il y a une raison." },
  { id: 'docta',    name: 'Docta',     station: 'Station Quarantaine', role: 'Médecin',     description: "Il soigne les résidents depuis la fin de la quarantaine officielle. Personne ne lui a dit de partir." },
  { id: 'zal',      name: 'Archiviste Zal', station: 'Le Berceau',    role: 'Archiviste',  description: "Il protège des archives qui précèdent la mémoire collective du secteur." },
  { id: 'oss',      name: 'Capitaine Oss', station: "L'Épave Vivante", role: 'Ancien capitaine', description: "Son vaisseau est devenu une ville. Il s'y est adapté lentement." },
  { id: 'shel',     name: 'Shel',      station: 'Station Fantôme',     role: 'Fantôme officieux', description: "Si tu la vois, c'est qu'elle a décidé que tu pouvais la voir." },
  { id: 'tonn',     name: 'Tonn',      station: "L'Oasis de Fer",     role: 'Garant de la paix', description: "Il a un accord avec toutes les factions. Il ne dit jamais comment il l'a obtenu." },
  { id: 'rinn',     name: 'Rinn',      station: 'La Balise',           role: 'Technicienne', description: "Elle entretient le signal. Elle écoute tout ce qui passe. Elle note beaucoup de choses." },
  { id: 'broxx',    name: 'Broxx',     station: 'Confluent',           role: 'Marchand carrefour', description: "Il connaît les prix de quarante stations. Il sait exactement ce que tu paies en trop." },
  { id: 'reine',    name: 'La Reine de Nuit', station: 'Port de Nuit', role: 'Patronne',   description: "Son nom réel n'est pas connu. Son autorité sur ce port, si." },
  { id: 'vael-s',   name: 'Drs. Vael', station: 'Station Zéphyr',      role: 'Chercheur',   description: "Il étudie les gaz des géantes depuis douze ans. Il n'a pas trouvé ce qu'il cherchait. Il continue." },
  { id: 'elenne',   name: 'Elenne',    station: "L'Observatoire",      role: 'Astronome',   description: "Elle regarde les étoiles. Elle a arrêté de regarder les gens il y a longtemps." },
  { id: 'kaed',     name: 'Kaed',      station: 'Station Limite',      role: 'Explorateur', description: "Il est allé plus loin que cette station. Deux fois. Il n'en parle qu'avec parcimonie." },
  { id: 'grelm',    name: 'Grelm',     station: 'Les Cavernes de Mira', role: 'Mineur chef', description: "Il dirige les mineurs depuis que l'ancien chef est parti. On ne demande pas pourquoi." },
  { id: 'brenn',    name: 'Brenn',     station: 'La Raffinerie',       role: 'Contremaître', description: "Il gère les hommes, les machines, et la chaleur. Pas nécessairement dans cet ordre." },
]

// ── Rencontres de rivaux ─────────────────────────────────────────────────────

export function maybeRivalEncounter(gs: GameState): { triggered: boolean; rival?: PersistentNpc } {
  const enemies = Object.values(gs.knownNpcs).filter(n => n.isEnemy)
  if (enemies.length === 0) return { triggered: false }
  const chance = Math.min(0.35, 0.12 * enemies.length)
  if (Math.random() >= chance) return { triggered: false }
  return { triggered: true, rival: pick(enemies) }
}

export interface RivalOutcome {
  newGs: Partial<GameState>
  message: string
  triggerCombat?: boolean
}

export function resolveRivalAction(
  gs: GameState,
  rival: PersistentNpc,
  action: 'fight' | 'apologize' | 'pay' | 'flee'
): RivalOutcome {
  const debtAmount = 800 + Math.abs(rival.repDelta) * 20

  switch (action) {
    case 'fight': {
      return {
        newGs: {},
        message: `${rival.name} sort son arme. Combat.`,
        triggerCombat: true,
      }
    }
    case 'apologize': {
      const chance = 0.25 + Math.max(0, gs.reputation / 200)
      if (Math.random() < chance) {
        const newNpcs = { ...gs.knownNpcs, [rival.id]: { ...rival, isEnemy: false, repDelta: 0 } }
        return {
          newGs: { reputation: gs.reputation + 20, knownNpcs: newNpcs },
          message: `Il écoute. Ses épaules se relâchent. 'Ça n'efface rien. Mais...' Il repart. +20 rép.`,
        }
      }
      return {
        newGs: {},
        message: `${rival.name} n'est pas prêt à écouter. Combat inévitable.`,
        triggerCombat: true,
      }
    }
    case 'pay': {
      if (gs.credits < debtAmount) {
        return { newGs: {}, message: `Pas assez de crédits (${debtAmount} cr requis). Il n'attend plus.`, triggerCombat: true }
      }
      const newNpcs = { ...gs.knownNpcs, [rival.id]: { ...rival, isEnemy: false, repDelta: 0 } }
      return {
        newGs: { credits: gs.credits - debtAmount, knownNpcs: newNpcs },
        message: `-${debtAmount} cr. Il prend l'argent et repart. La rancœur a un prix.`,
      }
    }
    case 'flee': {
      if (Math.random() < 0.5) {
        return {
          newGs: { fuel: Math.max(0, gs.fuel - 1) },
          message: `Tu te tires. -1 carburant. Il sera là la prochaine fois.`,
        }
      }
      return { newGs: {}, message: `Il est plus rapide que prévu. Combat.`, triggerCombat: true }
    }
  }
}

// Créer un ennemi à partir d'un rival
export function rivalToEnemy(rival: PersistentNpc) {
  return {
    name: rival.name,
    maxHp: 55 + Math.min(80, Math.abs(rival.repDelta) * 2),
    damageMin: 10 + Math.abs(rival.repDelta) / 5,
    damageMax: 22 + Math.abs(rival.repDelta) / 3,
    lootMin: 200,
    lootMax: 800,
    description: `Il se bat avec la rage de quelqu'un qui attendait depuis longtemps.`,
    captureChance: 15,
    killChance: 20,
    isBoss: false,
    role: 'normal' as const,
  }
}

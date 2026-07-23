import type { GameState, PersistentNpc, NpcReaction } from '../types'

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

// ── Services par rôle ────────────────────────────────────────────────────────

export interface NpcService {
  label: string
  costText: string
  canUse: (gs: GameState) => boolean
  whyNot: (gs: GameState) => string
  execute: (gs: GameState) => { patch: Partial<GameState>; message: string }
}

const SERVICES: Record<string, NpcService> = {
  Ferrailleur: {
    label: '🔧 Réparer le vaisseau',
    costText: '500 cr',
    canUse: gs => gs.shipHp < gs.shipMaxHp && gs.credits >= 500,
    whyNot: gs => gs.shipHp >= gs.shipMaxHp ? 'Vaisseau intact' : `Manque ${500 - gs.credits} cr`,
    execute: gs => ({
      patch: { credits: gs.credits - 500, shipHp: gs.shipMaxHp },
      message: `Il jette un œil à la coque et sort ses outils. -500 cr · Vaisseau réparé (${gs.shipMaxHp}/${gs.shipMaxHp} PV).`,
    }),
  },
  Médecin: {
    label: '💊 Soins complets',
    costText: '300 cr',
    canUse: gs => gs.playerHp < gs.playerMaxHp && gs.credits >= 300,
    whyNot: gs => gs.playerHp >= gs.playerMaxHp ? 'Tu es en pleine forme' : `Manque ${300 - gs.credits} cr`,
    execute: gs => ({
      patch: { credits: gs.credits - 300, playerHp: gs.playerMaxHp },
      message: `-300 cr · Soins complets. PV restaurés à ${gs.playerMaxHp}.`,
    }),
  },
  Hackeuse: {
    label: '⚡ Effacer le casier',
    costText: '800 cr',
    canUse: gs => gs.credits >= 800 && gs.reputation < 80,
    whyNot: gs => gs.credits < 800 ? `Manque ${800 - gs.credits} cr` : 'Casier déjà propre',
    execute: gs => ({
      patch: { credits: gs.credits - 800, reputation: Math.min(100, gs.reputation + 40) },
      message: `-800 cr · Elle tape quelques lignes sans te regarder. "C'est fait." +40 réputation.`,
    }),
  },
  Dealer: {
    label: '📦 Ravitaillement clandestin',
    costText: '400 cr',
    canUse: gs => gs.credits >= 400,
    whyNot: gs => `Manque ${400 - gs.credits} cr`,
    execute: gs => ({
      patch: {
        credits: gs.credits - 400,
        cargo: { ...gs.cargo, 'Médicaments': (gs.cargo['Médicaments'] ?? 0) + 2, 'Stimulant': (gs.cargo['Stimulant'] ?? 0) + 1 },
      },
      message: `-400 cr · Il sort une caisse de sous le comptoir. +2 Médicaments · +1 Stimulant.`,
    }),
  },
  Forgeron: {
    label: "⚔ Améliorer l'arme équipée",
    costText: 'Outils ×2 + 400 cr',
    canUse: gs => !!gs.equippedWeapon && (gs.cargo['Outils'] ?? 0) >= 2 && gs.credits >= 400,
    whyNot: gs => !gs.equippedWeapon ? 'Aucune arme équipée' : (gs.cargo['Outils'] ?? 0) < 2 ? 'Il faut Outils ×2' : `Manque ${400 - gs.credits} cr`,
    execute: gs => {
      if (!gs.equippedWeapon) return { patch: {}, message: 'Aucune arme.' }
      const newOutils = (gs.cargo['Outils'] ?? 0) - 2
      const nc = { ...gs.cargo, Outils: newOutils }
      if (newOutils <= 0) delete (nc as Record<string, number>).Outils
      const upgraded = { ...gs.equippedWeapon, damageMin: gs.equippedWeapon.damageMin + 2, damageMax: gs.equippedWeapon.damageMax + 2 }
      const newWeapons = gs.weapons.map(w => w.name === gs.equippedWeapon!.name ? upgraded : w)
      return {
        patch: { credits: gs.credits - 400, cargo: nc, equippedWeapon: upgraded, weapons: newWeapons },
        message: `Il retravaille la lame en silence. -400 cr · -Outils ×2 · ${upgraded.name} : +2 dégâts min/max.`,
      }
    },
  },
  'Pilote retraité': {
    label: '🛸 Route secrète',
    costText: '200 cr',
    canUse: gs => gs.credits >= 200 && gs.fuel < gs.maxFuel,
    whyNot: gs => gs.credits < 200 ? `Manque ${200 - gs.credits} cr` : 'Réservoir plein',
    execute: gs => ({
      patch: { credits: gs.credits - 200, fuel: Math.min(gs.maxFuel, gs.fuel + 2) },
      message: `-200 cr · "Prends ce raccourci — personne d'autre le connaît encore." +2 carburant.`,
    }),
  },
  Vétéran: {
    label: '🏋 Entraînement intensif',
    costText: '1 action',
    canUse: gs => gs.stamina < gs.maxStamina || gs.reputation < 100,
    whyNot: _ => 'Rien à améliorer',
    execute: gs => ({
      patch: { stamina: gs.maxStamina, reputation: Math.min(100, gs.reputation + 8) },
      message: `Une heure avec lui. Pas de mots, juste de la sueur. Stamina max · +8 réputation.`,
    }),
  },
  Courtier: {
    label: '💼 Transaction secrète',
    costText: '500 cr',
    canUse: gs => gs.credits >= 500,
    whyNot: gs => `Manque ${500 - gs.credits} cr`,
    execute: gs => {
      const items = ['Composants électroniques', 'Équipements blindés', 'Données classifiées', 'Métaux rares', 'Cristaux énergétiques']
      const item = pick(items)
      return {
        patch: { credits: gs.credits - 500, cargo: { ...gs.cargo, [item]: (gs.cargo[item] ?? 0) + 1 } },
        message: `-500 cr · Il fait glisser une caisse par-dessus le comptoir. +1 ${item}.`,
      }
    },
  },
  Marchande: {
    label: '💼 Stock exclusif',
    costText: '400 cr',
    canUse: gs => gs.credits >= 400,
    whyNot: gs => `Manque ${400 - gs.credits} cr`,
    execute: gs => {
      const items = ['Médicaments premium', 'Munitions spéciales', 'Outils lourds', 'Composants tactiques', 'Pièces techniques']
      const item = pick(items)
      return {
        patch: { credits: gs.credits - 400, cargo: { ...gs.cargo, [item]: (gs.cargo[item] ?? 0) + 1 } },
        message: `-400 cr · "Ça vient d'arriver, pas encore au catalogue." +1 ${item}.`,
      }
    },
  },
  Chercheuse: {
    label: '🔬 Expertise d\'artefacts / données',
    costText: 'Données ou Artefact requis',
    canUse: gs =>
      (gs.cargo['Données'] ?? 0) > 0 ||
      (gs.cargo['Données volées'] ?? 0) > 0 ||
      (gs.cargo['Données classifiées'] ?? 0) > 0 ||
      (gs.cargo['Artefacts'] ?? 0) > 0 ||
      (gs.cargo['Composants expérimentaux'] ?? 0) > 0,
    whyNot: _ => 'Aucune donnée ni artefact en soute (Données, Données volées, Artefacts…)',
    execute: gs => {
      const priority = ['Artefacts', 'Composants expérimentaux', 'Données classifiées', 'Données volées', 'Données']
      const key = priority.find(k => (gs.cargo[k] ?? 0) > 0)!
      const isArtifact = key === 'Artefacts' || key === 'Composants expérimentaux'
      const isClassified = key === 'Données classifiées' || key === 'Données volées'
      const reward = isArtifact ? rng(1400, 2800) : isClassified ? rng(700, 1400) : rng(450, 900)
      const repGain = isArtifact ? 12 : 8
      const nc = { ...gs.cargo, [key]: (gs.cargo[key] ?? 1) - 1 }
      if ((nc[key] ?? 0) <= 0) delete (nc as Record<string, number>)[key]
      return {
        patch: { credits: gs.credits + reward, cargo: nc, reputation: gs.reputation + repGain },
        message: `Elle examine longuement le spécimen. Longue pause. "C'est rare — vraiment rare." Elle te paie sans marchander. -1 ${key} · +${reward} cr · +${repGain} rép.`,
      }
    },
  },
  Survivante: {
    label: '🤝 Troc de survie',
    costText: '1 Nourriture',
    canUse: gs => (gs.cargo['Nourriture synthétique'] ?? 0) >= 1 || (gs.cargo['Nourriture fraîche'] ?? 0) >= 1,
    whyNot: _ => 'Aucune nourriture disponible',
    execute: gs => {
      const hasFraiche = (gs.cargo['Nourriture fraîche'] ?? 0) >= 1
      const key = hasFraiche ? 'Nourriture fraîche' : 'Nourriture synthétique'
      const nc = { ...gs.cargo, [key]: (gs.cargo[key] ?? 1) - 1 }
      if ((nc[key] ?? 0) <= 0) delete (nc as Record<string, number>)[key]
      return {
        patch: { cargo: { ...nc, 'Médicaments': (gs.cargo['Médicaments'] ?? 0) + 2 }, playerHp: Math.min(gs.playerMaxHp, gs.playerHp + 15) },
        message: `Elle échange sans un mot. -1 ${key} · +2 Médicaments · +15 PV.`,
      }
    },
  },
}

const ROLE_ALIASES: Record<string, string> = {
  "Maître d'armes": 'Forgeron',
  Contremaître:     'Ferrailleur',
  Explorateur:      'Pilote retraité',
  Commerçante:      'Marchande',
  Représentant:     'Marchande',
  'Marchand carrefour': 'Courtier',
  Tenancier:        'Courtier',
  Lieutenant:       'Vétéran',
  Capitaine:        'Vétéran',
  Commandante:      'Vétéran',
  Officière:        'Vétéran',
  'Sergent Faucon': 'Vétéran',
  Archiviste:       'Chercheuse',
  Chercheur:        'Chercheuse',
  Astronome:        'Chercheuse',
}

export function getNpcService(role: string): NpcService | null {
  const resolved = ROLE_ALIASES[role] ?? role
  return SERVICES[resolved] ?? null
}

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

// ── CALLBACKS PILIERS (5.3) ────────────────────────────────────────────────
// Les PNJ réagissent aux décisions piliers du joueur : un détenteur rendu
// ennemi inspire la peur, un allié puissant le respect, une trahison la méfiance.
const PILLAR_DISPLAY: Record<string, string> = {
  cesarion: 'Cesarion', raphazarus: 'Raphazarus', eliotis: 'Eliotis',
  maxance: 'Maxance', alanossa: 'Alanossa', scotty: 'Scotty',
}

function getPillarCallback(npc: PersistentNpc, gs: GameState): string | null {
  const standing = (gs.pillarStanding ?? {}) as Record<string, number>
  const angered = gs.nexusAngered ?? []

  // 1. Le joueur a fait d'un détenteur son ennemi → les PNJ le craignent
  if (angered.length > 0) {
    const name = PILLAR_DISPLAY[angered[0]] ?? angered[0]
    const fearLines = [
      `${npc.name} se fige une seconde. "On dit que ${name} a juré ta perte. Les gens comme moi évitent les gens comme toi."`,
      `"Tu es celui qui a défié ${name}," souffle ${npc.name}, sans te regarder en face. "Fais vite ce que tu as à faire et pars."`,
      `${npc.name} recule d'un pas. "Je veux pas d'ennui avec ${name}. Et toi, t'en es un ambulant."`,
    ]
    return pick(fearLines)
  }

  // 2. Trahison d'Alanossa (standing très bas) → méfiance ouverte
  if ((standing.alanossa ?? 0) <= -25) {
    const betrayLines = [
      `${npc.name} te dévisage froidement. "Alanossa raconte partout que tu l'as trahie. Ici, sa parole pèse lourd."`,
      `"On m'a dit de pas te faire confiance," lâche ${npc.name}. "Quelqu'un proche d'Alanossa. Tu vois le genre."`,
    ]
    return pick(betrayLines)
  }

  // 3. Allié puissant d'un détenteur → respect
  const topPillar = Object.entries(standing).sort((a, b) => b[1] - a[1])[0]
  if (topPillar && topPillar[1] >= 60) {
    const name = PILLAR_DISPLAY[topPillar[0]] ?? topPillar[0]
    const respectLines = [
      `${npc.name} hoche la tête avec déférence. "On murmure que ${name} te tient en haute estime. Ça ouvre des portes, par ici."`,
      `"T'es proche de ${name}, pas vrai ?" ${npc.name} baisse d'un ton, presque respectueux. "Ça change tout."`,
    ]
    return pick(respectLines)
  }

  return null
}

export function getNpcGreeting(npc: PersistentNpc, reaction: NpcReaction, gs?: GameState): string {
  // Lignes contextuelles — priorité sur la réaction générique
  if (gs && reaction !== 'hostile') {
    if (gs.stalker) {
      const stalkerLines = [
        `${npc.name} baisse la voix. "Y'a quelqu'un qui posait des questions sur toi tout à l'heure. Méfie-toi."`,
        `${npc.name} jette un coup d'œil derrière toi avant de parler. "Tu as quelqu'un aux trousses ?"`,
        `"T'as l'air de quelqu'un qu'on cherche," dit ${npc.name} sans sourire.`,
      ]
      return pick(stalkerLines)
    }
    if (gs.playerHp < gs.playerMaxHp * 0.35) {
      const hurtLines = [
        `${npc.name} te regarde arriver. "T'as pris des coups. Ça se voit de loin."`,
        `"T'es encore en vie ? À peine." ${npc.name} plisse les yeux.`,
        `"Assieds-toi," dit ${npc.name}. "T'as l'air d'un mort qui marche encore."`,
      ]
      return pick(hurtLines)
    }
    if (gs.reputation >= 60) {
      const famousLines = [
        `${npc.name} te reconnaît immédiatement. "Tout le monde parle de toi dans le secteur."`,
        `"Ah. Toi." ${npc.name} a l'air impressionné malgré lui.`,
        `"J'avais entendu que tu passerais par ici," dit ${npc.name}. "Le secteur a une mémoire."`,
      ]
      return pick(famousLines)
    }
    if (gs.reputation <= -40) {
      const badRepLines = [
        `${npc.name} regarde ailleurs. "Je suis pas sûr de vouloir être vu en ta compagnie ici."`,
        `"T'as une sale réputation," dit ${npc.name} à voix basse. "Quelques personnes aimeraient te parler. Le genre de personnes qu'on préfère éviter."`,
      ]
      return pick(badRepLines)
    }
    if ((gs.runModifiers ?? []).includes('traque')) {
      return `${npc.name} remarque quelque chose. "Tu regardes derrière toi depuis que t'es entré. C'est quoi ton problème ?"`
    }
    // ── CALLBACKS DÉCISIONS PILIERS (5.3) ──────────────────────────────────
    const pillarLine = getPillarCallback(npc, gs)
    if (pillarLine) return pillarLine
    if (npc.timesMet >= 6) {
      const regularLines = [
        `${npc.name} lève les yeux sans surprise. "T'es encore là. Tu fais partie des meubles maintenant."`,
        `"Toi encore." ${npc.name} dit ça sans malice. C'est presque chaleureux.`,
        `"Je t'attendais presque," dit ${npc.name}. "T'es prévisible. C'est pas un reproche."`,
      ]
      return pick(regularLines)
    }
    if (gs.day >= 20) {
      return `"T'es toujours en vie," dit ${npc.name}. "C'est pas rien, par ici."`
    }
    if (gs.credits < 300) {
      return `${npc.name} te jette un coup d'œil. "T'as l'air à court. Ça se voit."`
    }
    if ((gs.discoveredLore ?? []).length >= 8) {
      return `${npc.name} te regarde différemment. "T'as l'air de quelqu'un qui cherche quelque chose de précis. Ou de quelqu'un qui a déjà trop trouvé."`
    }
  }

  switch (reaction) {
    case 'ally':     return pick(ALLY_GREETINGS)
    case 'friendly': case 'warm': return pick(FRIENDLY_GREETINGS)
    case 'hostile':  return pick(HOSTILE_GREETINGS)
    case 'cold':     return pick(COLD_GREETINGS)
    default: {
      const neutralLines = [
        `${npc.name} lève les yeux. Pas d'enthousiasme, pas d'hostilité. Il t'attend.`,
        `${npc.name} te jauge une seconde, puis reprend ce qu'il faisait. Il t'a vu.`,
        `${npc.name} te fait un signe de tête bref. Le genre qui dit : "t'es là, j'ai vu, c'est bon."`,
        `${npc.name} s'arrête une seconde. Te regarde. Continue. Le silence est neutre.`,
        `"Tiens." ${npc.name} ne dit rien d'autre. Mais il t'a reconnu.`,
      ]
      return neutralLines[npc.timesMet % neutralLines.length]
    }
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
  { id: 'kaur',     name: 'Kaur',      station: 'Station Rocaille',    role: 'Ferrailleur',  description: "Quarante ans dans les mines. Ses mains sont plus dures que la roche qu'il a taillée." },
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

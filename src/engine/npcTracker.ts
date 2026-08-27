import type { GameState, PersistentNpc, NpcReaction } from '../types'
import i18n from '../i18n/config'
import { translateWeaponName } from './goodsI18n'

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const nt = (key: string, params?: Record<string, unknown>) => i18n.t(key, { ns: 'npcTracker', ...params })

// ── Services par rôle ────────────────────────────────────────────────────────

export interface NpcService {
  label: string
  costText: string
  canUse: (gs: GameState) => boolean
  whyNot: (gs: GameState) => string
  execute: (gs: GameState) => { patch: Partial<GameState>; message: string }
}

function getServices(): Record<string, NpcService> {
  return {
  Ferrailleur: {
    label: nt('services.ferrailleur.label'),
    costText: nt('services.ferrailleur.costText'),
    canUse: gs => gs.shipHp < gs.shipMaxHp && gs.credits >= 500,
    whyNot: gs => gs.shipHp >= gs.shipMaxHp ? nt('services.ferrailleur.whyNotIntact') : nt('services.ferrailleur.whyNotCredits', { amount: 500 - gs.credits }),
    execute: gs => ({
      patch: { credits: gs.credits - 500, shipHp: gs.shipMaxHp },
      message: nt('services.ferrailleur.message', { max: gs.shipMaxHp }),
    }),
  },
  Médecin: {
    label: nt('services.medecin.label'),
    costText: nt('services.medecin.costText'),
    canUse: gs => gs.playerHp < gs.playerMaxHp && gs.credits >= 300,
    whyNot: gs => gs.playerHp >= gs.playerMaxHp ? nt('services.medecin.whyNotFull') : nt('services.medecin.whyNotCredits', { amount: 300 - gs.credits }),
    execute: gs => ({
      patch: { credits: gs.credits - 300, playerHp: gs.playerMaxHp },
      message: nt('services.medecin.message', { max: gs.playerMaxHp }),
    }),
  },
  Hackeuse: {
    label: nt('services.hackeuse.label'),
    costText: nt('services.hackeuse.costText'),
    canUse: gs => gs.credits >= 800 && gs.reputation < 80,
    whyNot: gs => gs.credits < 800 ? nt('services.hackeuse.whyNotCredits', { amount: 800 - gs.credits }) : nt('services.hackeuse.whyNotClean'),
    execute: gs => ({
      patch: { credits: gs.credits - 800, reputation: Math.min(100, gs.reputation + 40) },
      message: nt('services.hackeuse.message'),
    }),
  },
  Dealer: {
    label: nt('services.dealer.label'),
    costText: nt('services.dealer.costText'),
    canUse: gs => gs.credits >= 400,
    whyNot: gs => nt('services.dealer.whyNotCredits', { amount: 400 - gs.credits }),
    execute: gs => ({
      patch: {
        credits: gs.credits - 400,
        cargo: { ...gs.cargo, 'Médicaments': (gs.cargo['Médicaments'] ?? 0) + 2, 'Stimulant': (gs.cargo['Stimulant'] ?? 0) + 1 },
      },
      message: nt('services.dealer.message'),
    }),
  },
  Forgeron: {
    label: nt('services.forgeron.label'),
    costText: nt('services.forgeron.costText'),
    canUse: gs => !!gs.equippedWeapon && (gs.cargo['Outils'] ?? 0) >= 2 && gs.credits >= 400,
    whyNot: gs => !gs.equippedWeapon ? nt('services.forgeron.whyNotNoWeapon') : (gs.cargo['Outils'] ?? 0) < 2 ? nt('services.forgeron.whyNotTools') : nt('services.forgeron.whyNotCredits', { amount: 400 - gs.credits }),
    execute: gs => {
      if (!gs.equippedWeapon) return { patch: {}, message: nt('services.forgeron.noWeaponMsg') }
      const newOutils = (gs.cargo['Outils'] ?? 0) - 2
      const nc = { ...gs.cargo, Outils: newOutils }
      if (newOutils <= 0) delete (nc as Record<string, number>).Outils
      const upgraded = { ...gs.equippedWeapon, damageMin: gs.equippedWeapon.damageMin + 2, damageMax: gs.equippedWeapon.damageMax + 2 }
      const newWeapons = gs.weapons.map(w => w.name === gs.equippedWeapon!.name ? upgraded : w)
      return {
        patch: { credits: gs.credits - 400, cargo: nc, equippedWeapon: upgraded, weapons: newWeapons },
        message: nt('services.forgeron.message', { weapon: translateWeaponName(upgraded.name) }),
      }
    },
  },
  'Pilote retraité': {
    label: nt('services.piloteRetraite.label'),
    costText: nt('services.piloteRetraite.costText'),
    canUse: gs => gs.credits >= 200 && gs.fuel < gs.maxFuel,
    whyNot: gs => gs.credits < 200 ? nt('services.piloteRetraite.whyNotCredits', { amount: 200 - gs.credits }) : nt('services.piloteRetraite.whyNotFull'),
    execute: gs => ({
      patch: { credits: gs.credits - 200, fuel: Math.min(gs.maxFuel, gs.fuel + 2) },
      message: nt('services.piloteRetraite.message'),
    }),
  },
  Vétéran: {
    label: nt('services.veteran.label'),
    costText: nt('services.veteran.costText'),
    canUse: gs => gs.stamina < gs.maxStamina || gs.reputation < 100,
    whyNot: _ => nt('services.veteran.whyNotNothing'),
    execute: gs => ({
      patch: { stamina: gs.maxStamina, reputation: Math.min(100, gs.reputation + 8) },
      message: nt('services.veteran.message'),
    }),
  },
  Courtier: {
    label: nt('services.courtier.label'),
    costText: nt('services.courtier.costText'),
    canUse: gs => gs.credits >= 500,
    whyNot: gs => nt('services.courtier.whyNotCredits', { amount: 500 - gs.credits }),
    execute: gs => {
      const items = ['Composants électroniques', 'Équipements blindés', 'Données classifiées', 'Métaux rares', 'Cristaux énergétiques']
      const item = pick(items)
      return {
        patch: { credits: gs.credits - 500, cargo: { ...gs.cargo, [item]: (gs.cargo[item] ?? 0) + 1 } },
        message: nt('services.courtier.message', { item }),
      }
    },
  },
  Marchande: {
    label: nt('services.marchande.label'),
    costText: nt('services.marchande.costText'),
    canUse: gs => gs.credits >= 400,
    whyNot: gs => nt('services.marchande.whyNotCredits', { amount: 400 - gs.credits }),
    execute: gs => {
      const items = ['Médicaments premium', 'Munitions spéciales', 'Outils lourds', 'Composants tactiques', 'Pièces techniques']
      const item = pick(items)
      return {
        patch: { credits: gs.credits - 400, cargo: { ...gs.cargo, [item]: (gs.cargo[item] ?? 0) + 1 } },
        message: nt('services.marchande.message', { item }),
      }
    },
  },
  Chercheuse: {
    label: nt('services.chercheuse.label'),
    costText: nt('services.chercheuse.costText'),
    canUse: gs =>
      (gs.cargo['Données'] ?? 0) > 0 ||
      (gs.cargo['Données volées'] ?? 0) > 0 ||
      (gs.cargo['Données classifiées'] ?? 0) > 0 ||
      (gs.cargo['Artefacts'] ?? 0) > 0 ||
      (gs.cargo['Composants expérimentaux'] ?? 0) > 0,
    whyNot: _ => nt('services.chercheuse.whyNotNone'),
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
        message: nt('services.chercheuse.message', { key, reward, rep: repGain }),
      }
    },
  },
  Survivante: {
    label: nt('services.survivante.label'),
    costText: nt('services.survivante.costText'),
    canUse: gs => (gs.cargo['Nourriture synthétique'] ?? 0) >= 1 || (gs.cargo['Nourriture fraîche'] ?? 0) >= 1,
    whyNot: _ => nt('services.survivante.whyNotNone'),
    execute: gs => {
      const hasFraiche = (gs.cargo['Nourriture fraîche'] ?? 0) >= 1
      const key = hasFraiche ? 'Nourriture fraîche' : 'Nourriture synthétique'
      const nc = { ...gs.cargo, [key]: (gs.cargo[key] ?? 1) - 1 }
      if ((nc[key] ?? 0) <= 0) delete (nc as Record<string, number>)[key]
      return {
        patch: { cargo: { ...nc, 'Médicaments': (gs.cargo['Médicaments'] ?? 0) + 2 }, playerHp: Math.min(gs.playerMaxHp, gs.playerHp + 15) },
        message: nt('services.survivante.message', { key }),
      }
    },
  },
  }
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
  return getServices()[resolved] ?? null
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

function getAllyGreetings(): string[] { return i18n.t('greetings.ally', { ns: 'npcTracker', returnObjects: true }) as string[] }
function getFriendlyGreetings(): string[] { return i18n.t('greetings.friendly', { ns: 'npcTracker', returnObjects: true }) as string[] }
function getHostileGreetings(): string[] { return i18n.t('greetings.hostile', { ns: 'npcTracker', returnObjects: true }) as string[] }
function getColdGreetings(): string[] { return i18n.t('greetings.cold', { ns: 'npcTracker', returnObjects: true }) as string[] }

// ── CALLBACKS PILIERS (5.3) ────────────────────────────────────────────────
// Les PNJ réagissent aux décisions piliers du joueur : un détenteur rendu
// ennemi inspire la peur, un allié puissant le respect, une trahison la méfiance.
const PILLAR_DISPLAY: Record<string, string> = {
  cesarion: 'Cesarion', raphazarus: 'Raphazarus', eliotis: 'Eliotis',
  maxance: 'Maxance', alanossa: 'Alanossa', scotty: 'Scotty',
}

// ── CALLBACK FOLIE — le cannibalisme laisse des traces que les PNJ remarquent
function getFolieCallback(npc: PersistentNpc, gs: GameState): string | null {
  if (!gs.moralTags.includes('cannibal')) return null
  const folie = gs.folieLevel ?? 0
  if (folie < 70) return null
  const lines = i18n.t('folieCallback', { ns: 'npcTracker', name: npc.name, returnObjects: true }) as string[]
  return pick(lines)
}

function getPillarCallback(npc: PersistentNpc, gs: GameState): string | null {
  const standing = (gs.pillarStanding ?? {}) as Record<string, number>
  const angered = gs.nexusAngered ?? []

  // 1. Le joueur a fait d'un détenteur son ennemi → les PNJ le craignent
  if (angered.length > 0) {
    const name = PILLAR_DISPLAY[angered[0]] ?? angered[0]
    const fearLines = i18n.t('pillarCallback.fear', { ns: 'npcTracker', npc: npc.name, name, returnObjects: true }) as string[]
    return pick(fearLines)
  }

  // 2. Trahison d'Alanossa (standing très bas) → méfiance ouverte
  if ((standing.alanossa ?? 0) <= -25) {
    const betrayLines = i18n.t('pillarCallback.betray', { ns: 'npcTracker', npc: npc.name, returnObjects: true }) as string[]
    return pick(betrayLines)
  }

  // 3. Allié puissant d'un détenteur → respect
  const topPillar = Object.entries(standing).sort((a, b) => b[1] - a[1])[0]
  if (topPillar && topPillar[1] >= 60) {
    const name = PILLAR_DISPLAY[topPillar[0]] ?? topPillar[0]
    const respectLines = i18n.t('pillarCallback.respect', { ns: 'npcTracker', npc: npc.name, name, returnObjects: true }) as string[]
    return pick(respectLines)
  }

  return null
}

export function getNpcGreeting(npc: PersistentNpc, reaction: NpcReaction, gs?: GameState): string {
  // Lignes contextuelles — priorité sur la réaction générique
  if (gs && reaction !== 'hostile') {
    if (gs.stalker) {
      const stalkerLines = i18n.t('greeting.stalker', { ns: 'npcTracker', name: npc.name, returnObjects: true }) as string[]
      return pick(stalkerLines)
    }
    if (gs.playerHp < gs.playerMaxHp * 0.35) {
      const hurtLines = i18n.t('greeting.hurt', { ns: 'npcTracker', name: npc.name, returnObjects: true }) as string[]
      return pick(hurtLines)
    }
    if (gs.reputation >= 60) {
      const famousLines = i18n.t('greeting.famous', { ns: 'npcTracker', name: npc.name, returnObjects: true }) as string[]
      return pick(famousLines)
    }
    if (gs.reputation <= -40) {
      const badRepLines = i18n.t('greeting.badRep', { ns: 'npcTracker', name: npc.name, returnObjects: true }) as string[]
      return pick(badRepLines)
    }
    if ((gs.runModifiers ?? []).includes('traque')) {
      return nt('greeting.traque', { name: npc.name })
    }
    // ── CALLBACK FOLIE — priorité sur les piliers : plus immédiat, plus visible
    const folieLine = getFolieCallback(npc, gs)
    if (folieLine) return folieLine
    // ── CALLBACKS DÉCISIONS PILIERS (5.3) ──────────────────────────────────
    const pillarLine = getPillarCallback(npc, gs)
    if (pillarLine) return pillarLine
    if (npc.timesMet >= 6) {
      const regularLines = i18n.t('greeting.regular', { ns: 'npcTracker', name: npc.name, returnObjects: true }) as string[]
      return pick(regularLines)
    }
    if (gs.day >= 20) {
      return nt('greeting.day20', { name: npc.name })
    }
    if (gs.credits < 300) {
      return nt('greeting.poor', { name: npc.name })
    }
    if ((gs.discoveredLore ?? []).length >= 8) {
      return nt('greeting.lore', { name: npc.name })
    }
  }

  switch (reaction) {
    case 'ally':     return pick(getAllyGreetings())
    case 'friendly': case 'warm': return pick(getFriendlyGreetings())
    case 'hostile':  return pick(getHostileGreetings())
    case 'cold':     return pick(getColdGreetings())
    default: {
      const neutralLines = i18n.t('greeting.neutral', { ns: 'npcTracker', name: npc.name, returnObjects: true }) as string[]
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

export function getNamedNpcs(): NamedNpcDef[] {
  return NAMED_NPCS_BASE.map(n => ({ ...n, description: nt(`namedNpcs.${n.id}`) }))
}

const NAMED_NPCS_BASE: Omit<NamedNpcDef, 'description'>[] = [
  { id: 'marek',    name: 'Marek',     station: 'La Carcasse',         role: 'Ferrailleur' },
  { id: 'sela',     name: 'Sela',      station: 'Port Méridien',       role: 'Marchande' },
  { id: 'torvak',   name: 'Torvak',    station: 'Fort Kharos',         role: 'Vétéran' },
  { id: 'lira',     name: 'Lira',      station: 'Nexus Aldara',        role: 'Hackeuse' },
  { id: 'boro',     name: 'Boro',      station: 'Les Bas-Fonds de Vega', role: 'Dealer' },
  { id: 'cael',     name: 'Cael',      station: 'Arc Ouest Apocalypse', role: 'Lieutenant' },
  { id: 'neva',     name: 'Neva',      station: 'Le Purgatoire',       role: 'Survivante' },
  { id: 'pistis',   name: 'Pistis',    station: 'Emporium Requiem',    role: 'Courtier' },
  { id: 'ganz',     name: 'Ganz',      station: 'Star Quest',          role: 'Organisateur' },
  { id: 'myrra',    name: 'Myrra',     station: 'La Citadelle Écarlate', role: 'Commandante' },
  { id: 'ysla',     name: 'Ysla',      station: 'Les Abysses de Velkor', role: 'Chercheuse' },
  { id: 'drela',    name: 'Drela',     station: 'Scotty Golden North', role: 'Pilote retraité' },
  { id: 'rook',     name: 'Rook',      station: 'La Forge Noire',      role: 'Forgeron' },
  { id: 'vance',    name: 'Vance',     station: 'Colonie Perséphone',  role: 'Fermier' },
  { id: 'vosh',     name: 'Vosh',      station: 'Le Nid des Faucons',  role: 'Recruteur' },
  { id: 'orva',     name: 'Orva',      station: 'Fort Ossian',         role: 'Officière' },
  { id: 'besh',     name: 'Besh',      station: "L'Entrepôt Zéro",    role: 'Gardien' },
  { id: 'ulmo',     name: 'Ulmo',      station: "La Couronne d'Eos",   role: 'Conseiller' },
  // Nouvelles stations
  { id: 'vael',     name: 'Vael',      station: 'Le Perchoir',         role: 'Sentinelle' },
  { id: 'kross',    name: 'Kross',     station: 'Station Ombre',       role: 'Opérateur' },
  { id: 'setta',    name: 'Setta',     station: 'Relais Noir',         role: 'Ravitailleuse' },
  { id: 'fenn',     name: 'Fenn',      station: 'La Tanière',          role: 'Vieux pirate' },
  { id: 'torq',     name: 'Torq',      station: 'Fort de Cendres',     role: 'Sergent Faucon' },
  { id: 'lyss',     name: 'Lyss',      station: "L'Œil du Faucon",    role: 'Analyste' },
  { id: 'mako',     name: 'Mako',      station: 'Repaire Vega-Sud',    role: 'Tenancier' },
  { id: 'harek',    name: 'Harek',     station: 'Bastion Mineur',      role: 'Capitaine' },
  { id: 'sera',     name: 'Sera',      station: 'Poste Vigie',         role: 'Guetteur' },
  { id: 'drav',     name: 'Drav',      station: "L'Arsenal Écarlate",  role: "Maître d'armes" },
  { id: 'keln',     name: 'Keln',      station: 'La Forteresse Exilée', role: 'Exilé' },
  { id: 'mira-c',   name: 'Mira',      station: 'Comptoir Sud',        role: 'Commerçante' },
  { id: 'rexx',     name: 'Rexx',      station: 'Annexe Commerciale',  role: 'Représentant' },
  { id: 'olin',     name: 'Olin',      station: 'Relais de Transit',   role: 'Logisticien' },
  { id: 'sonn',     name: 'Lady Sonn', station: 'Résidence Orbitale',  role: 'Résidente' },
  { id: 'sael',     name: 'Sael',      station: 'Club Privé Éos',      role: "Maître d'hôtel" },
  { id: 'murn',     name: 'Murn',      station: 'Les Cendres',         role: 'Survivant' },
  { id: 'docta',    name: 'Docta',     station: 'Station Quarantaine', role: 'Médecin' },
  { id: 'zal',      name: 'Archiviste Zal', station: 'Le Berceau',    role: 'Archiviste' },
  { id: 'oss',      name: 'Capitaine Oss', station: "L'Épave Vivante", role: 'Ancien capitaine' },
  { id: 'shel',     name: 'Shel',      station: 'Station Fantôme',     role: 'Fantôme officieux' },
  { id: 'tonn',     name: 'Tonn',      station: "L'Oasis de Fer",     role: 'Garant de la paix' },
  { id: 'rinn',     name: 'Rinn',      station: 'La Balise',           role: 'Technicienne' },
  { id: 'broxx',    name: 'Broxx',     station: 'Confluent',           role: 'Marchand carrefour' },
  { id: 'reine',    name: 'La Reine de Nuit', station: 'Port de Nuit', role: 'Patronne' },
  { id: 'vael-s',   name: 'Drs. Vael', station: 'Station Zéphyr',      role: 'Chercheur' },
  { id: 'elenne',   name: 'Elenne',    station: "L'Observatoire",      role: 'Astronome' },
  { id: 'kaed',     name: 'Kaed',      station: 'Station Limite',      role: 'Explorateur' },
  { id: 'grelm',    name: 'Grelm',     station: 'Les Cavernes de Mira', role: 'Mineur chef' },
  { id: 'brenn',    name: 'Brenn',     station: 'La Raffinerie',       role: 'Contremaître' },
  { id: 'kaur',     name: 'Kaur',      station: 'Station Rocaille',    role: 'Ferrailleur' },
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
        message: nt('rival.fightMsg', { name: rival.name }),
        triggerCombat: true,
      }
    }
    case 'apologize': {
      const chance = 0.25 + Math.max(0, gs.reputation / 200)
      if (Math.random() < chance) {
        const newNpcs = { ...gs.knownNpcs, [rival.id]: { ...rival, isEnemy: false, repDelta: 0 } }
        return {
          newGs: { reputation: gs.reputation + 20, knownNpcs: newNpcs },
          message: nt('rival.apologizeSuccess'),
        }
      }
      return {
        newGs: {},
        message: nt('rival.apologizeFail', { name: rival.name }),
        triggerCombat: true,
      }
    }
    case 'pay': {
      if (gs.credits < debtAmount) {
        return { newGs: {}, message: nt('rival.payInsufficient', { amount: debtAmount }), triggerCombat: true }
      }
      const newNpcs = { ...gs.knownNpcs, [rival.id]: { ...rival, isEnemy: false, repDelta: 0 } }
      return {
        newGs: { credits: gs.credits - debtAmount, knownNpcs: newNpcs },
        message: nt('rival.paySuccess', { amount: debtAmount }),
      }
    }
    case 'flee': {
      if (Math.random() < 0.5) {
        return {
          newGs: { fuel: Math.max(0, gs.fuel - 1) },
          message: nt('rival.fleeSuccess'),
        }
      }
      return { newGs: {}, message: nt('rival.fleeFail'), triggerCombat: true }
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
    description: nt('rivalEnemyDesc'),
    captureChance: 15,
    killChance: 20,
    isBoss: false,
    role: 'normal' as const,
  }
}

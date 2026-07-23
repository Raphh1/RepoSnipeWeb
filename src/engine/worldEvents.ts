import type { GameState, WorldEvent, StationAlertType } from '../types'

type EventTemplate = Omit<WorldEvent, 'startDay'>

const EVENT_POOL: EventTemplate[] = [
  {
    id: 'faucon_war',
    title: 'Guerre des Faucons',
    description: 'Les Faucons Noirs ont lancé une offensive totale contre les Gardiens Écarlates. Les routes militaires sont coupées.',
    shortDesc: 'Armes & armures +50% · Fort Kharos et Citadelle bloqués · +15% combat',
    duration: 7,
    color: 'var(--red)',
    effects: {
      priceItems: ['Armes lourdes', 'Armes illégales', 'Armes artisanales', 'Équipements blindés', "Armures d'élite", 'Armures Faucon', 'Munitions', 'Munitions spéciales'],
      priceMultiplier: 1.5,
      closedStations: ['Fort Kharos', 'La Citadelle Écarlate'],
      combatChanceBonus: 0.15,
    },
  },
  {
    id: 'emporium_blockade',
    title: 'Blocus de l\'Emporium',
    description: "L'Emporium Requiem a fermé ses routes commerciales en représailles d'un incident non confirmé. Les vivres se raréfient.",
    shortDesc: 'Nourriture & médicaments +70% · +1 carburant par trajet',
    duration: 5,
    color: 'var(--orange)',
    effects: {
      priceItems: ['Nourriture synthétique', 'Nourriture fraîche', 'Eau purifiée', 'Médicaments', 'Médicaments premium', 'Rations', 'Rations militaires', 'Vivres'],
      priceMultiplier: 1.7,
      fuelCostBonus: 1,
    },
  },
  {
    id: 'epidemic',
    title: 'Épidémie en expansion',
    description: 'Un pathogène inconnu se propage depuis Station Quarantaine. Les autorités tentent de contenir la situation.',
    shortDesc: 'Médicaments ×4 · Station Quarantaine bloquée',
    duration: 6,
    color: 'var(--green)',
    effects: {
      priceItems: ['Médicaments', 'Médicaments premium', 'Implants'],
      priceMultiplier: 4.0,
      closedStations: ['Station Quarantaine'],
    },
  },
  {
    id: 'cosmic_storm',
    title: 'Tempête cosmique',
    description: 'Une tempête de particules ionisées balaye le secteur. Les systèmes de navigation sont perturbés, les voyages plus dangereux.',
    shortDesc: '+2 carburant par trajet · +10% risque combat en voyage',
    duration: 4,
    color: 'var(--cyan)',
    effects: {
      fuelCostBonus: 2,
      combatChanceBonus: 0.10,
    },
  },
  {
    id: 'bounty_hunt',
    title: 'Chasse à la prime',
    description: "Une organisation inconnue a placé des primes sur des voyageurs indépendants dans ce secteur. Des chasseurs de primes opèrent partout.",
    shortDesc: '+25% risque combat partout · Chasseurs de primes actifs',
    duration: 5,
    color: 'var(--red)',
    effects: {
      combatChanceBonus: 0.25,
    },
  },
  {
    id: 'colonial_famine',
    title: 'Famine coloniale',
    description: 'Les colonies agricoles ont subi de mauvaises récoltes. Les vivres et l\'eau sont devenus une denrée précieuse dans tout le secteur.',
    shortDesc: 'Nourriture & eau ×3 en vente · Opportunité commerciale',
    duration: 6,
    color: 'var(--yellow)',
    effects: {
      priceItems: ['Nourriture synthétique', 'Nourriture fraîche', 'Eau purifiée', 'Vivres', 'Rations', 'Rations militaires'],
      priceMultiplier: 3.0,
    },
  },
  {
    id: 'market_crash',
    title: 'Effondrement du marché',
    description: "Une manipulation financière massive a fait s'effondrer les cours. Tout se vend et s'achète pour une bouchée de pain.",
    shortDesc: 'Tous les prix −35% · Bonne période pour acheter',
    duration: 4,
    color: 'var(--text-dim)',
    effects: {
      globalPriceMult: 0.65,
    },
  },
  {
    id: 'artifact_rush',
    title: 'Ruée vers les artefacts',
    description: 'Des découvertes dans les zones de ruines ont déclenché une ruée. Collectionneurs et factions se battent pour les artefacts anciens.',
    shortDesc: 'Artefacts & données classifiées ×3 · Explorations plus rentables',
    duration: 5,
    color: 'var(--gold)',
    effects: {
      priceItems: ['Artefacts', 'Données classifiées', 'Composants expérimentaux', 'Technologies avancées'],
      priceMultiplier: 3.0,
    },
  },
  {
    id: 'military_coup',
    title: 'Coup d\'état militaire',
    description: 'Un putsch interne secoue les forces militaires du secteur. Les bases sont en état de siège, les civils interdits d\'accès.',
    shortDesc: 'Forts militaires bloqués · Armures & munitions +60%',
    duration: 7,
    color: 'var(--orange)',
    effects: {
      priceItems: ["Armures d'élite", 'Équipements blindés', 'Armures', 'Munitions', 'Munitions spéciales', 'Composants tactiques', 'Équipement tactique'],
      priceMultiplier: 1.6,
      closedStations: ['Fort Ossian', 'Bastion Mineur', 'Poste Vigie'],
    },
  },
  {
    id: 'guild_truce',
    title: 'Trêve des guildes',
    description: 'Un accord de paix temporaire entre les grandes factions a été signé. Le commerce reprend librement, les tensions s\'apaisent.',
    shortDesc: 'Tous les prix −20% · −15% risque combat · Bonne période pour voyager',
    duration: 4,
    color: 'var(--green)',
    effects: {
      globalPriceMult: 0.80,
      combatChanceBonus: -0.15,
    },
  },
  {
    id: 'grand_festival',
    title: 'Grand Festival Orbital',
    description: 'La Tribosphère et Scotty Golden North organisent un festival inter-sectoriel. Les foules affluent, les crédits coulent.',
    shortDesc: 'Luxe & divertissements ×2 · Tribosphère et Scotty en fête · -10% combat',
    duration: 5,
    color: 'var(--gold)',
    effects: {
      priceItems: ['Luxe', 'Alcools exotiques', 'Spécialités festives', 'Jetons de casino', 'Divertissement'],
      priceMultiplier: 2.0,
      combatChanceBonus: -0.10,
      festivalStations: ['La Tribosphère', 'Scotty Golden North'],
    },
  },
]

// Mapping event → alertes de stations
const EVENT_STATION_ALERTS: Record<string, { stations: string[]; alert: StationAlertType }> = {
  faucon_war:    { stations: ['Fort Kharos', 'La Citadelle Écarlate', 'Le Nid des Faucons', 'Arc Ouest Apocalypse'], alert: 'siege' },
  epidemic:      { stations: ['Station Quarantaine', 'Les Cendres'], alert: 'epidemic' },
  military_coup: { stations: ['Fort Ossian', 'Bastion Mineur', 'Poste Vigie'], alert: 'lockdown' },
  grand_festival:{ stations: ['La Tribosphère', 'Scotty Golden North'], alert: 'festival' },
}

const EVENT_CHANCE_PER_DAY = 0.22
const MAX_ACTIVE_EVENTS    = 2
const GRACE_PERIOD_DAYS    = 3

export function tickWorldEvents(gs: GameState): { gs: GameState; newWorldEvent: WorldEvent | null } {
  // Expirer les événements terminés
  const active = (gs.activeWorldEvents ?? []).filter(
    e => e.startDay + e.duration > gs.day
  )

  // Tenter de déclencher un nouvel événement
  let newWorldEvent: WorldEvent | null = null
  let newActive = active

  if (
    active.length < MAX_ACTIVE_EVENTS &&
    gs.day > GRACE_PERIOD_DAYS &&
    Math.random() < EVENT_CHANCE_PER_DAY
  ) {
    const activeIds = active.map(e => e.id)
    const pool = EVENT_POOL.filter(e => !activeIds.includes(e.id))
    if (pool.length > 0) {
      const template = pool[Math.floor(Math.random() * pool.length)]
      newWorldEvent = { ...template, startDay: gs.day }
      newActive = [...active, newWorldEvent]
    }
  }

  // Dériver stationAlerts des événements actifs
  const stationAlerts: Record<string, StationAlertType> = {}
  for (const evt of newActive) {
    const mapping = EVENT_STATION_ALERTS[evt.id]
    if (mapping) {
      for (const s of mapping.stations) stationAlerts[s] = mapping.alert
    }
  }

  return { gs: { ...gs, activeWorldEvents: newActive, stationAlerts }, newWorldEvent }
}

export function getWorldEventPriceMultiplier(item: string, events: WorldEvent[]): number {
  let mult = 1
  for (const evt of events) {
    if (evt.effects.globalPriceMult) mult *= evt.effects.globalPriceMult
    if (evt.effects.priceItems?.includes(item) && evt.effects.priceMultiplier) {
      mult *= evt.effects.priceMultiplier
    }
  }
  return mult
}

export function getWorldEventFuelBonus(events: WorldEvent[]): number {
  return events.reduce((sum, e) => sum + (e.effects.fuelCostBonus ?? 0), 0)
}

export function getWorldEventCombatBonus(events: WorldEvent[]): number {
  return events.reduce((sum, e) => sum + (e.effects.combatChanceBonus ?? 0), 0)
}

export function getClosedStations(events: WorldEvent[]): Set<string> {
  return new Set(events.flatMap(e => e.effects.closedStations ?? []))
}

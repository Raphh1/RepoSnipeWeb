import type { GameState } from '../types'

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const roll = (chance: number) => Math.random() * 100 < chance

export interface TravelEvent {
  title: string
  description: string
  effect: (gs: GameState) => Partial<GameState> & { message?: string }
}

const POSITIVE_EVENTS: TravelEvent[] = [
  { title: "Épave abandonnée",       description: "Tu croises une épave à la dérive. Quelques crédits récupérables.",
    effect: gs => ({ credits: gs.credits + rng(150, 500), message: `Épave pillée. +${rng(150,500)} cr.` }) },
  { title: "Passager clandestin",    description: "Quelqu'un s'est glissé dans tes soutes. Il paie son passage sans broncher.",
    effect: gs => ({ credits: gs.credits + rng(200, 600), message: `Passager clandestin — il paie. +${rng(200,600)} cr.` }) },
  { title: "Signal d'urgence",       description: "Tu réponds à un signal. Le vaisseau en détresse t'est reconnaissant.",
    effect: gs => ({ credits: gs.credits + rng(300, 800), reputation: gs.reputation + 10, message: "+crédits, +10 rép." }) },
  { title: "Route secrète",          description: "Tu connais un raccourci. -1 carburant sur ce voyage.",
    effect: gs => ({ fuel: Math.min(gs.maxFuel, gs.fuel + 1), message: "Raccourci trouvé. +1 carburant récupéré." }) },
  { title: "Contrebandier ami",      description: "Un ami contrebandier croise ta route et te laisse du matériel.",
    effect: gs => ({ cargo: { ...gs.cargo, 'Médicaments': (gs.cargo['Médicaments'] ?? 0) + 2 }, message: "+2 Médicaments offerts." }) },
  { title: "Données commerciales",   description: "Tu interceptes des données sur les prix du marché. Utile.",
    effect: gs => ({ credits: gs.credits + rng(100, 300), message: "Données monnayées. +crédits." }) },
]

const NEGATIVE_EVENTS: TravelEvent[] = [
  { title: "Panne moteur",           description: "Ton moteur tousse. Réparation d'urgence. -carburant et -PV vaisseau.",
    effect: gs => ({ fuel: Math.max(0, gs.fuel - 1), shipHp: Math.max(1, gs.shipHp - rng(8, 20)), message: "Panne. -1 carburant, -PV vaisseau." }) },
  { title: "Tempête ionique",        description: "Une tempête ionique endomage les systèmes.",
    effect: gs => ({ shipHp: Math.max(1, gs.shipHp - rng(10, 25)), message: "Tempête ionique. -PV vaisseau." }) },
  { title: "Vol de carburant",       description: "Des drones voleurs ont sifonné ta réserve.",
    effect: gs => ({ fuel: Math.max(0, gs.fuel - 1), message: "Drones voleurs. -1 carburant." }) },
  { title: "Fausse route",           description: "Tu t'es perdu dans un champ d'astéroïdes. Du temps perdu.",
    effect: gs => ({ day: gs.day + 1, message: "+1 jour perdu dans le champ d'astéroïdes." }) },
  { title: "Cargo endommagé",        description: "Un impact de météorite endomage la soute.",
    effect: gs => {
      const keys = Object.keys(gs.cargo)
      if (keys.length === 0) return { message: "Impact inoffensif — soute vide." }
      const lost = keys[Math.floor(Math.random() * keys.length)]
      const newCargo = { ...gs.cargo }
      newCargo[lost] = Math.max(0, (newCargo[lost] ?? 0) - 1)
      if (newCargo[lost] === 0) delete newCargo[lost]
      return { cargo: newCargo, message: `Impact — 1x ${lost} détruit.` }
    }
  },
]

const PIRATE_EVENT: TravelEvent = {
  title: "Attaque de pirates",
  description: "Un vaisseau pirate sort du champ d'astéroïdes. Il vise tes réacteurs.",
  effect: gs => ({ message: "COMBAT_TRIGGER" })
}

const BOUNTY_EVENT: TravelEvent = {
  title: "Chasseur de primes",
  description: "Ta réputation négative attire un chasseur de primes.",
  effect: gs => ({ message: "BOUNTY_TRIGGER" })
}

export function rollTravelEvent(gs: GameState): TravelEvent | null {
  // Seigneur de guerre : pirates auto-résolus
  if (gs.class.autoKillsPirates && Math.random() < 0.3) {
    return {
      title: "Pirates intimidés",
      description: "Des pirates s'approchent... et reconnaissent ton vaisseau. Ils font demi-tour.",
      effect: (gs) => ({ reputation: gs.reputation + 5, message: "Pirates en fuite. +5 rép." })
    }
  }

  // Chasseur de primes si réputation très négative
  if (gs.reputation <= -100 && Math.random() < 0.15) {
    return BOUNTY_EVENT
  }

  // Pirates
  const pirateMult = gs.class.piratesDoubled ? 2 : 1
  if (Math.random() < 0.15 * pirateMult) {
    return PIRATE_EVENT
  }

  // Événement positif
  if (Math.random() < 0.25) {
    const ev = POSITIVE_EVENTS[Math.floor(Math.random() * POSITIVE_EVENTS.length)]
    // Classe Maudit : 50% chance que l'événement positif fizzle
    if (gs.class.cursedEvents && Math.random() < 0.5) {
      return { title: ev.title, description: ev.description + " Mais la malchance frappe.", effect: gs => ({ message: "Maudit — l'événement positif tourne mal." }) }
    }
    return ev
  }

  // Événement négatif
  if (Math.random() < 0.20) {
    return NEGATIVE_EVENTS[Math.floor(Math.random() * NEGATIVE_EVENTS.length)]
  }

  return null
}

// Appliquer les effets de classe au voyage
export function applyClassTravelEffects(gs: GameState): Partial<GameState> {
  const changes: Partial<GameState> = {}

  // Accro : -100cr par voyage
  if (gs.class.travelCreditCost && gs.class.travelCreditCost > 0) {
    changes.credits = Math.max(0, gs.credits - gs.class.travelCreditCost)
  }

  // Ferrailleur : 30% chance de perdre un cargo
  if (gs.class.cargoDegrades && Math.random() < 0.30) {
    const keys = Object.keys(gs.cargo)
    if (keys.length > 0) {
      const lost = keys[Math.floor(Math.random() * keys.length)]
      const newCargo = { ...gs.cargo }
      newCargo[lost] = Math.max(0, (newCargo[lost] ?? 0) - 1)
      if (newCargo[lost] === 0) delete newCargo[lost]
      changes.cargo = newCargo
    }
  }

  // Héritier : revenu périodique toutes les 5 jours
  if (gs.class.periodicIncome && gs.class.periodicIncome > 0) {
    if (gs.day % 5 === 0 && gs.day !== gs.lastIncomeDay) {
      changes.credits = (changes.credits ?? gs.credits) + gs.class.periodicIncome
      changes.lastIncomeDay = gs.day
    }
  }

  return changes
}

// Clock : 3 actions terrain = 1 jour
export function spendAction(gs: GameState): Partial<GameState> {
  const newActions = gs.actionsToday + 1
  if (newActions >= 3) {
    const dayChanges: Partial<GameState> = {
      actionsToday: 0,
      day: gs.day + 1,
    }
    // Endetté : -dette par jour
    if (gs.class.dailyDebt && gs.class.dailyDebt > 0) {
      dayChanges.credits = Math.max(0, gs.credits - gs.class.dailyDebt)
    }
    return dayChanges
  }
  return { actionsToday: newActions }
}

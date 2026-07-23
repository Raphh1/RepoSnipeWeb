import type { GameState } from '../types'

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

export interface StationEvent {
  id: string
  label: string
  available: (gs: GameState) => boolean
  description: string
  choices: StationEventChoice[]
}

export interface StationEventChoice {
  label: string
  available?: (gs: GameState) => boolean
  result: (gs: GameState) => { gs: Partial<GameState>; message: string }
}

export const STATION_EVENTS: Record<string, StationEvent[]> = {
  'Star Quest': [
    {
      id: 'casino',
      label: 'Aller au casino',
      available: gs => gs.credits >= 100,
      description: 'L\'arène des paris. Lumières, fumée, et la promesse de doubler ou de tout perdre.',
      choices: [
        {
          label: 'Miser 500 cr (50% chance)',
          available: gs => gs.credits >= 500,
          result: gs => Math.random() < 0.5
            ? { gs: { credits: gs.credits + 500 }, message: '+500 cr. La chance sourit.' }
            : { gs: { credits: gs.credits - 500 }, message: '-500 cr. La maison gagne toujours.' },
        },
        {
          label: 'Miser 200 cr (55% chance)',
          available: gs => gs.credits >= 200,
          result: gs => Math.random() < 0.55
            ? { gs: { credits: gs.credits + 200 }, message: '+200 cr.' }
            : { gs: { credits: gs.credits - 200 }, message: '-200 cr.' },
        },
        {
          label: 'Tricher (Hackeur — 80% succès)',
          available: gs => gs.class.name === 'Hackeur' && gs.credits >= 500,
          result: gs => Math.random() < 0.80
            ? { gs: { credits: gs.credits + 800 }, message: '[HACK] Algorithme biaisé. +800 cr.' }
            : { gs: { credits: gs.credits - 200, reputation: gs.reputation - 15 }, message: 'Détecté. -200 cr, -15 rép.' },
        },
        { label: 'Observer seulement', result: gs => ({ gs: {}, message: 'Spectacle gratuit.' }) },
      ],
    },
    {
      id: 'arena',
      label: 'Arène de combat',
      available: gs => true,
      description: 'Des combats légaux (à peu près). La foule réclame du sang.',
      choices: [
        {
          label: 'Participer (combat)',
          result: gs => ({ gs: {}, message: 'ARENA_COMBAT' }),
        },
        {
          label: 'Parier sur un combattant (300 cr)',
          available: gs => gs.credits >= 300,
          result: gs => Math.random() < 0.5
            ? { gs: { credits: gs.credits + 600 }, message: 'Ton poulain gagne. +600 cr.' }
            : { gs: { credits: gs.credits - 300 }, message: 'Il s\'effondre au troisième round. -300 cr.' },
        },
        { label: 'Partir', result: gs => ({ gs: {}, message: '' }) },
      ],
    },
  ],

  'Les Bas-Fonds de Vega': [
    {
      id: 'dealer',
      label: 'Chercher un dealer',
      available: gs => gs.credits >= 200,
      description: 'Dans les ruelles basses, quelqu\'un vend des choses qui n\'existent pas officiellement.',
      choices: [
        {
          label: 'Acheter un stimulant de combat (300 cr)',
          available: gs => gs.credits >= 300,
          result: gs => ({
            gs: { credits: gs.credits - 300, maxStamina: gs.maxStamina + 20, stamina: Math.min(gs.stamina + 20, gs.maxStamina + 20) },
            message: '-300 cr. Stamina max +20 temporairement.',
          }),
        },
        {
          label: 'Acheter une info sur un convoi (400 cr)',
          available: gs => gs.credits >= 400,
          result: gs => ({
            gs: { credits: gs.credits - 400 + rng(600, 1200) },
            message: `-400 cr. L'info mène à un convoi. +${rng(600, 1200)} cr.`,
          }),
        },
        {
          label: 'Acheter des médicaments non tracés (150 cr)',
          available: gs => gs.credits >= 150,
          result: gs => ({
            gs: { credits: gs.credits - 150, cargo: { ...gs.cargo, 'Médicaments': (gs.cargo['Médicaments'] ?? 0) + 3 } },
            message: '-150 cr. +3 Médicaments.',
          }),
        },
        { label: 'Rien, trop risqué', result: gs => ({ gs: {}, message: '' }) },
      ],
    },
    {
      id: 'fence',
      label: 'Receleur local',
      available: gs => Object.keys(gs.cargo).length > 0,
      description: 'Il reprend n\'importe quoi sans poser de questions. Prix en dessous du marché.',
      choices: [
        {
          label: 'Vendre tout le cargo (+25% prix noir)',
          result: gs => {
            const total = Object.entries(gs.cargo).reduce((sum, [, qty]) => sum + qty * 120, 0)
            return { gs: { credits: gs.credits + total, cargo: {} }, message: `+${total} cr. Cargo vendu au noir.` }
          },
        },
        { label: 'Partir', result: gs => ({ gs: {}, message: '' }) },
      ],
    },
  ],

  'Fort Kharos': [
    {
      id: 'military_mission',
      label: 'Mission militaire',
      available: gs => gs.reputation >= 0,
      description: 'L\'armée a un travail. Pas très légal côté faction, mais payé rubis sur ongle.',
      choices: [
        {
          label: 'Accepter la mission d\'escorte',
          result: gs => ({
            gs: { credits: gs.credits + rng(800, 2000), reputation: gs.reputation + 15 },
            message: `Mission d'escorte accomplie. +${rng(800, 2000)} cr, +15 rép.`,
          }),
        },
        {
          label: 'Refuser',
          result: gs => ({ gs: {}, message: 'L\'officier hoche la tête froidement.' }),
        },
      ],
    },
  ],

  'Nexus Aldara': [
    {
      id: 'data_market',
      label: 'Marché de données',
      available: gs => true,
      description: 'Des brokers vendent des informations classifiées. Certaines valent une fortune.',
      choices: [
        {
          label: 'Acheter des données commerciales (300 cr)',
          available: gs => gs.credits >= 300,
          result: gs => ({
            gs: { credits: gs.credits - 300 + rng(400, 900) },
            message: `-300 cr. Données revendues. +${rng(400, 900)} cr.`,
          }),
        },
        {
          label: 'Vendre tes propres infos',
          available: gs => gs.completedQuestIds.length >= 2,
          result: gs => ({
            gs: { credits: gs.credits + rng(200, 600) },
            message: `Tes infos ont de la valeur ici. +${rng(200, 600)} cr.`,
          }),
        },
        {
          label: 'Pirater le système (Hackeur)',
          available: gs => gs.class.name === 'Hackeur',
          result: gs => Math.random() < 0.75
            ? { gs: { credits: gs.credits + rng(800, 2000), reputation: gs.reputation + 20 }, message: '[HACK] Accès obtenu. +crédits, +20 rép.' }
            : { gs: { reputation: gs.reputation - 20 }, message: 'Détecté. -20 rép.' },
        },
        { label: 'Passer', result: gs => ({ gs: {}, message: '' }) },
      ],
    },
  ],

  'Le Purgatoire': [
    {
      id: 'rumor_network',
      label: 'Réseau des anciens prisonniers',
      available: gs => true,
      description: 'Les anciens détenus ont des contacts partout. Leur réseau vaut de l\'or.',
      choices: [
        {
          label: 'Acheter une info sur un convoi (200 cr)',
          available: gs => gs.credits >= 200,
          result: gs => ({
            gs: { credits: gs.credits - 200 + rng(300, 700) },
            message: `-200 cr. Info profitable. +${rng(300, 700)} cr.`,
          }),
        },
        {
          label: 'Proposer tes services comme passeur',
          result: gs => ({
            gs: { credits: gs.credits + rng(400, 1000), reputation: gs.reputation - 5 },
            message: `Contrat de passage accepté. +${rng(400, 1000)} cr. -5 rép (morale).`,
          }),
        },
        { label: 'Ignorer', result: gs => ({ gs: {}, message: '' }) },
      ],
    },
  ],

  'Arc Ouest Apocalypse': [
    {
      id: 'alanossa_contact',
      label: 'Contact avec les lieutenants d\'Alanossa',
      available: gs => gs.reputation >= 20 || gs.bossesDefeated >= 1,
      description: 'Des lieutenants t\'observent depuis ton arrivée. Un signe de tête — une invitation.',
      choices: [
        {
          label: 'Rencontrer le lieutenant',
          result: gs => ({
            gs: { credits: gs.credits + rng(500, 1500), reputation: gs.reputation + 20 },
            message: `Accord tacite. +${rng(500, 1500)} cr, +20 rép.`,
          }),
        },
        {
          label: 'Décliner',
          result: gs => ({ gs: {}, message: 'Il note ton refus. Ça compte.' }),
        },
      ],
    },
  ],
}

export function getStationEvents(gs: GameState): StationEvent[] {
  const events = STATION_EVENTS[gs.currentStation] ?? []
  return events.filter(e => e.available(gs))
}

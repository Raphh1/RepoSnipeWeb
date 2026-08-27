import type { GameState } from '../types'
import i18n from '../i18n/config'

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const se = (key: string, params?: Record<string, unknown>) => i18n.t(key, { ns: 'stationEvents', ...params })

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

function getStationEventsMap(): Record<string, StationEvent[]> {
  return {
  'Star Quest': [
    {
      id: 'salon_vip',
      label: se('starQuest.salonVip.label'),
      available: gs => gs.credits >= 400,
      description: se('starQuest.salonVip.description'),
      choices: [
        {
          label: se('starQuest.salonVip.c0.label'),
          available: gs => gs.credits >= 400,
          result: gs => {
            const amount = rng(500, 1500)
            return {
              gs: { credits: gs.credits - 400 + amount, reputation: gs.reputation + 30 },
              message: se('starQuest.salonVip.c0.msg', { amount }),
            }
          },
        },
        {
          label: se('starQuest.salonVip.c1.label'),
          available: gs => gs.class.name === 'Hackeur',
          result: gs => {
            if (Math.random() < 0.70) {
              const amount = rng(1200, 2800)
              return { gs: { credits: gs.credits + amount, reputation: gs.reputation + 15 }, message: se('starQuest.salonVip.c1.win', { amount }) }
            }
            return { gs: { reputation: gs.reputation - 25 }, message: se('starQuest.salonVip.c1.lose') }
          },
        },
        {
          label: se('starQuest.salonVip.c2.label'),
          available: gs => gs.reputation >= 80,
          result: gs => {
            const amount = rng(800, 2000)
            return {
              gs: { credits: gs.credits + amount, reputation: gs.reputation + 40 },
              message: se('starQuest.salonVip.c2.msg', { amount }),
            }
          },
        },
        { label: se('starQuest.salonVip.c3'), result: gs => ({ gs: {}, message: '' }) },
      ],
    },
    {
      id: 'arena',
      label: se('starQuest.arena.label'),
      available: gs => true,
      description: se('starQuest.arena.description'),
      choices: [
        {
          label: se('starQuest.arena.c0'),
          result: gs => ({ gs: {}, message: 'ARENA_COMBAT' }),
        },
        {
          label: se('starQuest.arena.c1.label'),
          available: gs => gs.credits >= 300,
          result: gs => Math.random() < 0.5
            ? { gs: { credits: gs.credits + 600 }, message: se('starQuest.arena.c1.win') }
            : { gs: { credits: gs.credits - 300 }, message: se('starQuest.arena.c1.lose') },
        },
        { label: se('starQuest.arena.c2'), result: gs => ({ gs: {}, message: '' }) },
      ],
    },
  ],

  'Scotty Golden North': [
    {
      id: 'grand_casino',
      label: se('scottyGoldenNorth.grandCasino.label'),
      available: gs => gs.credits >= 150,
      description: se('scottyGoldenNorth.grandCasino.description'),
      choices: [
        {
          label: se('scottyGoldenNorth.grandCasino.c0.label'),
          available: gs => gs.credits >= 150,
          result: gs => Math.random() < 0.55
            ? { gs: { credits: gs.credits + 200 }, message: se('scottyGoldenNorth.grandCasino.c0.win') }
            : { gs: { credits: gs.credits - 150 }, message: se('scottyGoldenNorth.grandCasino.c0.lose') },
        },
        {
          label: se('scottyGoldenNorth.grandCasino.c1.label'),
          available: gs => gs.credits >= 500,
          result: gs => Math.random() < 0.50
            ? { gs: { credits: gs.credits + 650 }, message: se('scottyGoldenNorth.grandCasino.c1.win') }
            : { gs: { credits: gs.credits - 500 }, message: se('scottyGoldenNorth.grandCasino.c1.lose') },
        },
        {
          label: se('scottyGoldenNorth.grandCasino.c2.label'),
          available: gs => gs.credits >= 1500,
          result: gs => Math.random() < 0.45
            ? { gs: { credits: gs.credits + 2400 }, message: se('scottyGoldenNorth.grandCasino.c2.win') }
            : { gs: { credits: gs.credits - 1500 }, message: se('scottyGoldenNorth.grandCasino.c2.lose') },
        },
        {
          label: se('scottyGoldenNorth.grandCasino.c3.label'),
          available: gs => gs.credits >= 3000 && gs.reputation >= 60,
          result: gs => Math.random() < 0.40
            ? { gs: { credits: gs.credits + 6000, reputation: gs.reputation + 10 }, message: se('scottyGoldenNorth.grandCasino.c3.win') }
            : { gs: { credits: gs.credits - 3000 }, message: se('scottyGoldenNorth.grandCasino.c3.lose') },
        },
        {
          label: se('scottyGoldenNorth.grandCasino.c4.label'),
          available: gs => gs.class.name === 'Hackeur' && gs.credits >= 500,
          result: gs => Math.random() < 0.75
            ? { gs: { credits: gs.credits + 1800 }, message: se('scottyGoldenNorth.grandCasino.c4.win') }
            : { gs: { credits: gs.credits - 500, reputation: gs.reputation - 20 }, message: se('scottyGoldenNorth.grandCasino.c4.lose') },
        },
        { label: se('scottyGoldenNorth.grandCasino.c5.label'), result: gs => ({ gs: {}, message: se('scottyGoldenNorth.grandCasino.c5.msg') }) },
      ],
    },
    {
      id: 'machines_samy',
      label: se('scottyGoldenNorth.machinesSamy.label'),
      available: gs => gs.credits >= 200,
      description: se('scottyGoldenNorth.machinesSamy.description'),
      choices: [
        {
          label: se('scottyGoldenNorth.machinesSamy.c0.label'),
          available: gs => gs.credits >= 200,
          result: gs => {
            const w = [rng(1, 6), rng(1, 6), rng(1, 6)]
            if (w[0] === w[1] && w[1] === w[2]) return { gs: { credits: gs.credits + 200 * 6 - 200 }, message: se('scottyGoldenNorth.machinesSamy.c0.jackpot', { a: w[0], b: w[1], c: w[2], amount: 200 * 6 - 200 }) }
            if (w[0] === w[1] || w[1] === w[2] || w[0] === w[2]) return { gs: { credits: gs.credits + Math.floor(200 * 1.5) - 200 }, message: se('scottyGoldenNorth.machinesSamy.c0.pair', { a: w[0], b: w[1], c: w[2], amount: Math.floor(200 * 1.5) - 200 }) }
            return { gs: { credits: gs.credits - 200 }, message: se('scottyGoldenNorth.machinesSamy.c0.lose', { a: w[0], b: w[1], c: w[2], amount: 200 }) }
          },
        },
        {
          label: se('scottyGoldenNorth.machinesSamy.c1.label'),
          available: gs => gs.credits >= 1000,
          result: gs => {
            const w = [rng(1, 6), rng(1, 6), rng(1, 6)]
            if (w[0] === w[1] && w[1] === w[2]) return { gs: { credits: gs.credits + 1000 * 6 - 1000 }, message: se('scottyGoldenNorth.machinesSamy.c1.jackpot', { a: w[0], b: w[1], c: w[2], amount: 1000 * 6 - 1000 }) }
            if (w[0] === w[1] || w[1] === w[2] || w[0] === w[2]) return { gs: { credits: gs.credits + Math.floor(1000 * 1.5) - 1000 }, message: se('scottyGoldenNorth.machinesSamy.c1.pair', { a: w[0], b: w[1], c: w[2], amount: Math.floor(1000 * 1.5) - 1000 }) }
            return { gs: { credits: gs.credits - 1000 }, message: se('scottyGoldenNorth.machinesSamy.c1.lose', { a: w[0], b: w[1], c: w[2], amount: 1000 }) }
          },
        },
        {
          label: se('scottyGoldenNorth.machinesSamy.c2.label'),
          available: gs => gs.credits >= 600,
          result: gs => Math.random() < 0.35
            ? { gs: { credits: gs.credits + 600 * 3 - 600 }, message: se('scottyGoldenNorth.machinesSamy.c2.win', { amount: 600 * 3 - 600 }) }
            : { gs: { credits: gs.credits - 600 }, message: se('scottyGoldenNorth.machinesSamy.c2.lose') },
        },
        { label: se('scottyGoldenNorth.machinesSamy.c3'), result: gs => ({ gs: {}, message: '' }) },
      ],
    },
  ],

  'Les Bas-Fonds de Vega': [
    {
      id: 'dealer',
      label: se('lesBasFondsDeVega.dealer.label'),
      available: gs => gs.credits >= 200,
      description: se('lesBasFondsDeVega.dealer.description'),
      choices: [
        {
          label: se('lesBasFondsDeVega.dealer.c0.label'),
          available: gs => gs.credits >= 300,
          result: gs => ({
            gs: { credits: gs.credits - 300, maxStamina: gs.maxStamina + 20, stamina: Math.min(gs.stamina + 20, gs.maxStamina + 20) },
            message: se('lesBasFondsDeVega.dealer.c0.msg'),
          }),
        },
        {
          label: se('lesBasFondsDeVega.dealer.c1.label'),
          available: gs => gs.credits >= 400,
          result: gs => {
            const amount = rng(600, 1200)
            return {
              gs: { credits: gs.credits - 400 + amount },
              message: se('lesBasFondsDeVega.dealer.c1.msg', { amount }),
            }
          },
        },
        {
          label: se('lesBasFondsDeVega.dealer.c2.label'),
          available: gs => gs.credits >= 150,
          result: gs => ({
            gs: { credits: gs.credits - 150, cargo: { ...gs.cargo, 'Médicaments': (gs.cargo['Médicaments'] ?? 0) + 3 } },
            message: se('lesBasFondsDeVega.dealer.c2.msg'),
          }),
        },
        { label: se('lesBasFondsDeVega.dealer.c3'), result: gs => ({ gs: {}, message: '' }) },
      ],
    },
    {
      id: 'fence',
      label: se('lesBasFondsDeVega.fence.label'),
      available: gs => Object.keys(gs.cargo).length > 0,
      description: se('lesBasFondsDeVega.fence.description'),
      choices: [
        {
          label: se('lesBasFondsDeVega.fence.c0.label'),
          result: gs => {
            const total = Object.entries(gs.cargo).reduce((sum, [, qty]) => sum + qty * 120, 0)
            return { gs: { credits: gs.credits + total, cargo: {} }, message: se('lesBasFondsDeVega.fence.c0.msg', { amount: total }) }
          },
        },
        { label: se('lesBasFondsDeVega.fence.c1'), result: gs => ({ gs: {}, message: '' }) },
      ],
    },
  ],

  'Fort Kharos': [
    {
      id: 'armoury_access',
      label: se('fortKharos.armouryAccess.label'),
      available: gs => gs.credits >= 400,
      description: se('fortKharos.armouryAccess.description'),
      choices: [
        {
          label: se('fortKharos.armouryAccess.c0.label'),
          available: gs => gs.credits >= 400,
          result: gs => ({
            gs: { credits: gs.credits - 400, cargo: { ...gs.cargo, 'Munitions spéciales': (gs.cargo['Munitions spéciales'] ?? 0) + 2 } },
            message: se('fortKharos.armouryAccess.c0.msg'),
          }),
        },
        {
          label: se('fortKharos.armouryAccess.c1.label'),
          available: gs => gs.credits >= 200,
          result: gs => ({
            gs: { credits: gs.credits - 200, cargo: { ...gs.cargo, 'Rations militaires': (gs.cargo['Rations militaires'] ?? 0) + 3 } },
            message: se('fortKharos.armouryAccess.c1.msg'),
          }),
        },
        {
          label: se('fortKharos.armouryAccess.c2.label'),
          result: _ => ({ gs: {}, message: se('fortKharos.armouryAccess.c2.msg') }),
        },
      ],
    },
  ],

  'Nexus Aldara': [
    {
      id: 'data_market',
      label: se('nexusAldara.dataMarket.label'),
      available: gs => true,
      description: se('nexusAldara.dataMarket.description'),
      choices: [
        {
          label: se('nexusAldara.dataMarket.c0.label'),
          available: gs => gs.credits >= 300,
          result: gs => {
            const amount = rng(400, 900)
            return {
              gs: { credits: gs.credits - 300 + amount },
              message: se('nexusAldara.dataMarket.c0.msg', { amount }),
            }
          },
        },
        {
          label: se('nexusAldara.dataMarket.c1.label'),
          available: gs => gs.completedQuestIds.length >= 2,
          result: gs => {
            const amount = rng(200, 600)
            return {
              gs: { credits: gs.credits + amount },
              message: se('nexusAldara.dataMarket.c1.msg', { amount }),
            }
          },
        },
        {
          label: se('nexusAldara.dataMarket.c2.label'),
          available: gs => gs.class.name === 'Hackeur',
          result: gs => Math.random() < 0.75
            ? { gs: { credits: gs.credits + rng(800, 2000), reputation: gs.reputation + 20 }, message: se('nexusAldara.dataMarket.c2.win') }
            : { gs: { reputation: gs.reputation - 20 }, message: se('nexusAldara.dataMarket.c2.lose') },
        },
        { label: se('nexusAldara.dataMarket.c3'), result: gs => ({ gs: {}, message: '' }) },
      ],
    },
  ],

  'Le Purgatoire': [
    {
      id: 'rumor_network',
      label: se('lePurgatoire.rumorNetwork.label'),
      available: gs => true,
      description: se('lePurgatoire.rumorNetwork.description'),
      choices: [
        {
          label: se('lePurgatoire.rumorNetwork.c0.label'),
          available: gs => gs.credits >= 200,
          result: gs => {
            const amount = rng(300, 700)
            return {
              gs: { credits: gs.credits - 200 + amount },
              message: se('lePurgatoire.rumorNetwork.c0.msg', { amount }),
            }
          },
        },
        {
          label: se('lePurgatoire.rumorNetwork.c1.label'),
          result: gs => {
            const amount = rng(400, 1000)
            return {
              gs: { credits: gs.credits + amount, reputation: gs.reputation - 5 },
              message: se('lePurgatoire.rumorNetwork.c1.msg', { amount }),
            }
          },
        },
        { label: se('lePurgatoire.rumorNetwork.c2'), result: gs => ({ gs: {}, message: '' }) },
      ],
    },
  ],

  'Arc Ouest Apocalypse': [
    {
      id: 'alanossa_contact',
      label: se('arcOuestApocalypse.alanossaContact.label'),
      available: gs => gs.reputation >= 20 || gs.bossesDefeated >= 1,
      description: se('arcOuestApocalypse.alanossaContact.description'),
      choices: [
        {
          label: se('arcOuestApocalypse.alanossaContact.c0.label'),
          result: gs => {
            const amount = rng(500, 1500)
            return {
              gs: { credits: gs.credits + amount, reputation: gs.reputation + 20 },
              message: se('arcOuestApocalypse.alanossaContact.c0.msg', { amount }),
            }
          },
        },
        {
          label: se('arcOuestApocalypse.alanossaContact.c1.label'),
          result: gs => ({ gs: {}, message: se('arcOuestApocalypse.alanossaContact.c1.msg') }),
        },
      ],
    },
  ],
  }
}

function getKorsunEvents(): StationEvent[] {
  return [
  {
    id: 'tournament_register',
    label: se('areneDeKorsun.tournamentRegister.label'),
    available: gs => gs.tournamentRound === 0,
    description: se('areneDeKorsun.tournamentRegister.description'),
    choices: [
      {
        label: se('areneDeKorsun.tournamentRegister.c0'),
        result: () => ({ gs: {}, message: 'TOURNAMENT_START' }),
      },
      {
        label: se('areneDeKorsun.tournamentRegister.c1.label'),
        result: () => ({ gs: {}, message: se('areneDeKorsun.tournamentRegister.c1.msg') }),
      },
      {
        label: se('areneDeKorsun.tournamentRegister.c2'),
        result: () => ({ gs: {}, message: '' }),
      },
    ],
  },
  {
    id: 'tournament_ongoing',
    label: se('areneDeKorsun.tournamentOngoing.label'),
    available: gs => gs.tournamentRound > 0,
    description: se('areneDeKorsun.tournamentOngoing.description'),
    choices: [
      {
        label: se('areneDeKorsun.tournamentOngoing.c0'),
        result: () => ({ gs: {}, message: 'TOURNAMENT_CONTINUE' }),
      },
      {
        label: se('areneDeKorsun.tournamentOngoing.c1.label'),
        result: gs => ({ gs: { tournamentRound: 0 }, message: se('areneDeKorsun.tournamentOngoing.c1.msg') }),
      },
    ],
  },
  ]
}

export function getStationEvents(gs: GameState): StationEvent[] {
  const map = getStationEventsMap()
  map["L'Arène de Korsun"] = getKorsunEvents()
  const events = map[gs.currentStation] ?? []
  return events.filter(e => e.available(gs))
}

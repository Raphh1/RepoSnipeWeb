import type { GameState } from '../types'
import i18n from '../i18n/config'

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const as = (key: string, params?: Record<string, unknown>) => i18n.t(key, { ns: 'arrivalSituations', ...params })

export interface ArrivalSituation {
  title: string
  description: string
  choices: ArrivalChoice[]
}

export interface ArrivalChoice {
  label: string
  available?: (gs: GameState) => boolean
  result: (gs: GameState) => { gs: Partial<GameState>; message: string; triggerCombat?: boolean; triggerPrison?: boolean }
}

// Situations d'arrivée génériques selon réputation
function getReputationArrival(gs: GameState): ArrivalSituation | null {
  if (gs.reputation >= 200) {
    return {
      title: as('repHigh.title'),
      description: as('repHigh.description'),
      choices: [
        {
          label: as('repHigh.c0.label'),
          result: gs => ({ gs: { credits: gs.credits + rng(200, 500), reputation: gs.reputation + 5 }, message: as('repHigh.c0.msg') })
        },
        { label: as('repHigh.c1.label'), result: gs => ({ gs: {}, message: as('repHigh.c1.msg') }) }
      ]
    }
  }
  if (gs.reputation <= -100) {
    return {
      title: as('repLow.title'),
      description: as('repLow.description'),
      choices: [
        {
          label: as('repLow.c0.label'),
          result: gs => {
            const fine = rng(200, 500)
            return gs.credits >= fine
              ? { gs: { credits: gs.credits - fine }, message: as('repLow.c0.pay', { fine }) }
              : { gs: { isImprisoned: true, prisonDaysLeft: 2 }, message: as('repLow.c0.fail'), triggerPrison: true }
          }
        },
        {
          label: as('repLow.c1.label'),
          result: gs => ({ gs: {}, message: as('repLow.c1.msg'), triggerCombat: true })
        },
        {
          label: as('repLow.c2.label'),
          result: gs => ({ gs: { fuel: Math.max(0, gs.fuel - 1) }, message: as('repLow.c2.msg') })
        }
      ]
    }
  }
  return null
}

// Situations d'arrivée spécifiques par station
function getStationArrivals(): Record<string, ArrivalSituation> {
  return {
  'La Carcasse': {
    title: as('laCarcasse.title'),
    description: as('laCarcasse.description'),
    choices: [
      {
        label: as('laCarcasse.c0.label'),
        result: gs => ({ gs: { reputation: gs.reputation + 3, credits: gs.credits + rng(50, 200) }, message: as('laCarcasse.c0.msg') })
      },
      { label: as('laCarcasse.c1.label'), result: gs => ({ gs: {}, message: as('laCarcasse.c1.msg') }) }
    ]
  },
  'Port Méridien': {
    title: as('portMeridien.title'),
    description: as('portMeridien.description'),
    choices: [
      {
        label: as('portMeridien.c0.label'),
        result: gs => ({ gs: { reputation: gs.reputation + 5 }, message: as('portMeridien.c0.msg') })
      },
      {
        label: as('portMeridien.c1.label'),
        result: gs => Math.random() < 0.3
          ? { gs: { reputation: gs.reputation - 15, isImprisoned: true, prisonDaysLeft: 1 }, message: as('portMeridien.c1.caught'), triggerPrison: true }
          : { gs: {}, message: as('portMeridien.c1.safe') }
      }
    ]
  },
  'Les Bas-Fonds de Vega': {
    title: as('lesBasFondsDeVega.title'),
    description: as('lesBasFondsDeVega.description'),
    choices: [
      {
        label: as('lesBasFondsDeVega.c0.label'),
        result: gs => ({ gs: {}, message: as('lesBasFondsDeVega.c0.msg') })
      },
      {
        label: as('lesBasFondsDeVega.c1.label'),
        result: gs => ({ gs: { credits: gs.credits + rng(100, 400) }, message: as('lesBasFondsDeVega.c1.msg') })
      }
    ]
  },
  'Arc Ouest Apocalypse': {
    title: as('arcOuestApocalypse.title'),
    description: as('arcOuestApocalypse.description'),
    choices: [
      {
        label: as('arcOuestApocalypse.c0.label'),
        result: gs => gs.reputation >= 30
          ? { gs: { reputation: gs.reputation + 5 }, message: as('arcOuestApocalypse.c0.recognized') }
          : { gs: {}, message: as('arcOuestApocalypse.c0.unknown') }
      },
      {
        label: as('arcOuestApocalypse.c1.label'),
        result: gs => Math.random() < 0.4
          ? { gs: {}, message: as('arcOuestApocalypse.c1.safe') }
          : { gs: {}, message: as('arcOuestApocalypse.c1.combat'), triggerCombat: true }
      }
    ]
  },
  'Fort Kharos': {
    title: as('fortKharos.title'),
    description: as('fortKharos.description'),
    choices: [
      {
        label: as('fortKharos.c0.label'),
        result: gs => ({ gs: {}, message: as('fortKharos.c0.msg') })
      },
      {
        label: as('fortKharos.c1.label'),
        available: gs => gs.class.name === 'Vétéran' || gs.class.name === 'Seigneur de guerre',
        result: gs => ({ gs: { reputation: gs.reputation + 15, credits: gs.credits + rng(200, 500) }, message: as('fortKharos.c1.msg') })
      }
    ]
  },
  'Le Purgatoire': {
    title: as('lePurgatoire.title'),
    description: as('lePurgatoire.description'),
    choices: [
      {
        label: as('lePurgatoire.c0.label'),
        result: gs => ({ gs: {}, message: as('lePurgatoire.c0.msg') })
      },
      {
        label: as('lePurgatoire.c1.label'),
        available: gs => gs.prisonEscapes > 0 || (gs.isImprisoned === false && gs.interrogationsSurvived > 0),
        result: gs => ({ gs: { reputation: gs.reputation + 10, credits: gs.credits + rng(100, 300) }, message: as('lePurgatoire.c1.msg') })
      }
    ]
  },
  'Emporium Requiem': {
    title: as('emporiumRequiem.title'),
    description: as('emporiumRequiem.description'),
    choices: [
      {
        label: as('emporiumRequiem.c0.label'),
        available: gs => gs.credits >= 500,
        result: gs => ({ gs: { credits: gs.credits - 500 + rng(300, 1200), reputation: gs.reputation + 10 }, message: as('emporiumRequiem.c0.msg') })
      },
      {
        label: as('emporiumRequiem.c1.label'),
        result: gs => ({ gs: {}, message: as('emporiumRequiem.c1.msg') })
      }
    ]
  },
  }
}

// Interrogatoire
function buildInterrogation(): ArrivalSituation {
  return {
  title: as('interrogation.title'),
  description: as('interrogation.description'),
  choices: [
    {
      label: as('interrogation.c0.label'),
      result: gs => Math.random() < 0.5
        ? { gs: { interrogationsSurvived: gs.interrogationsSurvived + 1, reputation: gs.reputation + 10 }, message: as('interrogation.c0.success') }
        : { gs: { playerHp: Math.max(1, gs.playerHp - rng(10, 25)), interrogationsSurvived: gs.interrogationsSurvived + 1 }, message: as('interrogation.c0.fail') }
    },
    {
      label: as('interrogation.c1.label'),
      result: gs => ({ gs: { reputation: gs.reputation - 20, credits: Math.max(0, gs.credits - rng(200, 600)), interrogationsSurvived: gs.interrogationsSurvived + 1 }, message: as('interrogation.c1.msg') })
    },
    {
      label: as('interrogation.c2.label'),
      result: gs => gs.reputation > 30
        ? { gs: { credits: Math.max(0, gs.credits - rng(100, 300)), interrogationsSurvived: gs.interrogationsSurvived + 1 }, message: as('interrogation.c2.success') }
        : { gs: { isImprisoned: true, prisonDaysLeft: 2, interrogationsSurvived: gs.interrogationsSurvived + 1 }, message: as('interrogation.c2.fail'), triggerPrison: true }
    },
    {
      label: as('interrogation.c3.label'),
      result: gs => Math.random() < 0.40
        ? { gs: { playerHp: Math.max(1, gs.playerHp - rng(10, 20)), interrogationsSurvived: gs.interrogationsSurvived + 1, prisonEscapes: gs.prisonEscapes + 1, reputation: gs.reputation + 15 }, message: as('interrogation.c3.success') }
        : { gs: { playerHp: Math.max(1, gs.playerHp - rng(20, 40)), isImprisoned: true, prisonDaysLeft: 3 }, message: as('interrogation.c3.fail'), triggerPrison: true }
    }
  ]
  }
}

// Trafic d'êtres humains — on ne peut PAS vendre son passager au marché, mais
// en cours de route un trafiquant peut proposer un très bon prix. Choix moral noir.
function getTraffickingArrival(gs: GameState): ArrivalSituation | null {
  if ((gs.cargo['Passager'] ?? 0) <= 0) return null
  if (Math.random() > 0.5) return null   // pas à chaque escale
  const offer = rng(3500, 6500) + gs.day * 120
  const offerStr = offer.toLocaleString()
  return {
    title: as('trafficking.title'),
    description: as('trafficking.description', { offer: offerStr }),
    choices: [
      {
        label: as('trafficking.c0.label', { offer: offerStr }),
        result: gs => {
          const cargo = { ...gs.cargo }
          const cur = cargo['Passager'] ?? 0
          if (cur <= 1) delete cargo['Passager']; else cargo['Passager'] = cur - 1
          const firstEscort = gs.activeQuests.find(q => q.type === 'escort')
          const remaining = firstEscort ? gs.activeQuests.filter(q => q.id !== firstEscort.id) : gs.activeQuests
          return {
            gs: {
              cargo,
              credits: gs.credits + offer,
              reputation: gs.reputation - 30,
              activeQuests: remaining,
              moralTags: [...(gs.moralTags ?? []).filter(t => t !== 'trafiquant'), 'trafiquant'],
              pastDecisions: [...(gs.pastDecisions ?? []), 'sold-passenger'],
            },
            message: as('trafficking.c0.msg', { offer: offerStr }),
          }
        },
      },
      {
        label: as('trafficking.c1.label'),
        result: gs => ({ gs: { reputation: gs.reputation + 8 }, message: as('trafficking.c1.msg') }),
      },
    ],
  }
}

export function getArrivalSituation(gs: GameState, forced = false): ArrivalSituation | null {
  // Le trafiquant est prioritaire : c'est une offre qui surgit, passager à bord.
  const traffic = getTraffickingArrival(gs)
  if (traffic) return traffic

  if (!forced && Math.random() > 0.40) return null

  const repSituation = getReputationArrival(gs)
  if (repSituation && (forced || Math.random() < 0.5)) return repSituation

  return getStationArrivals()[gs.currentStation] ?? null
}

// Situation après une défaite en combat (interrogatoire ou capture)
export function getCaptureConsequence(gs: GameState): ArrivalSituation {
  return buildInterrogation()
}

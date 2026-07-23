import type { GameState } from '../types'

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

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
      title: "Accueil de légende",
      description: "Ton nom précède ton vaisseau. La foule aux sas d'arrivée te regarde avec quelque chose entre la crainte et l'admiration.",
      choices: [
        {
          label: "Accepter les hommages",
          result: gs => ({ gs: { credits: gs.credits + rng(200, 500), reputation: gs.reputation + 5 }, message: "+crédits offerts. +5 rép." })
        },
        { label: "Passer discrètement", result: gs => ({ gs: {}, message: "Tu passes. Ils murmurent derrière toi." }) }
      ]
    }
  }
  if (gs.reputation <= -100) {
    return {
      title: "Accueil hostile",
      description: "Des agents de sécurité t'attendent. Ils ont une liste. Ton nom est dessus.",
      choices: [
        {
          label: "Coopérer — payer l'amende",
          result: gs => {
            const fine = rng(200, 500)
            return gs.credits >= fine
              ? { gs: { credits: gs.credits - fine }, message: `-${fine} cr. Ils te laissent passer à contrecœur.` }
              : { gs: { isImprisoned: true, prisonDaysLeft: 2 }, message: "Pas assez de crédits. Prison.", triggerPrison: true }
          }
        },
        {
          label: "Forcer le passage (combat)",
          result: gs => ({ gs: {}, message: "Combat.", triggerCombat: true })
        },
        {
          label: "Fuir immédiatement",
          result: gs => ({ gs: { fuel: Math.max(0, gs.fuel - 1) }, message: "Tu ressors par où tu es entré. -1 carburant." })
        }
      ]
    }
  }
  return null
}

// Situations d'arrivée spécifiques par station
const STATION_ARRIVALS: Record<string, ArrivalSituation> = {
  'La Carcasse': {
    title: "Arrivée à La Carcasse",
    description: "L'odeur de métal rouillé et de carburant frelaté. Un gamin court vers toi. 'Tu cherches du boulot ? J'connais quelqu'un.'",
    choices: [
      {
        label: "Écouter le gamin",
        result: gs => ({ gs: { reputation: gs.reputation + 3, credits: gs.credits + rng(50, 200) }, message: "Une info utile. +crédits." })
      },
      { label: "Ignorer", result: gs => ({ gs: {}, message: "Tu passes. Il disparaît dans la ferraille." }) }
    ]
  },
  'Port Méridien': {
    title: "Arrivée à Port Méridien",
    description: "Propre, organisé, sous surveillance. Un agent de contrôle tampon ton laissez-passer sans te regarder.",
    choices: [
      {
        label: "Déclarer tes marchandises honnêtement",
        result: gs => ({ gs: { reputation: gs.reputation + 5 }, message: "+5 rép. Aucun problème." })
      },
      {
        label: "Passer sans déclarer",
        result: gs => Math.random() < 0.3
          ? { gs: { reputation: gs.reputation - 15, isImprisoned: true, prisonDaysLeft: 1 }, message: "Contrôle aléatoire. Prison.", triggerPrison: true }
          : { gs: {}, message: "Ça passe. Cette fois." }
      }
    ]
  },
  'Les Bas-Fonds de Vega': {
    title: "Arrivée aux Bas-Fonds",
    description: "Pas de contrôle. Pas de questions. Juste des regards qui évaluent ta valeur marchande.",
    choices: [
      {
        label: "Se fondre dans la masse",
        result: gs => ({ gs: {}, message: "Tu rentres. Personne te touche." })
      },
      {
        label: "Chercher un contact immédiatement",
        result: gs => ({ gs: { credits: gs.credits + rng(100, 400) }, message: "Premier contact rentable. +crédits." })
      }
    ]
  },
  'Arc Ouest Apocalypse': {
    title: "Territoire d'Alanossa",
    description: "Un canon de vaisseau te suit depuis l'espace. Radio : 'Identifie-toi. Maintenant.'",
    choices: [
      {
        label: "S'identifier normalement",
        result: gs => gs.reputation >= 30
          ? { gs: { reputation: gs.reputation + 5 }, message: "Ils reconnaissent ton nom. +5 rép." }
          : { gs: {}, message: "Tu passes sous contrôle. Ils ne t'aiment pas mais ils te laissent." }
      },
      {
        label: "Ignorer — continuer droit",
        result: gs => Math.random() < 0.4
          ? { gs: {}, message: "Ils laissent passer. Méfiance totale." }
          : { gs: {}, message: "Combat avec sentinelles.", triggerCombat: true }
      }
    ]
  },
  'Fort Kharos': {
    title: "Arrivée à Fort Kharos",
    description: "Code de sécurité requis. Le garde t'inspecte de la tête aux pieds.",
    choices: [
      {
        label: "Code visiteur standard",
        result: gs => ({ gs: {}, message: "Accès autorisé. Sous surveillance." })
      },
      {
        label: "Présenter tes titres militaires (Vétéran/Seigneur de guerre)",
        available: gs => gs.class.name === 'Vétéran' || gs.class.name === 'Seigneur de guerre',
        result: gs => ({ gs: { reputation: gs.reputation + 15, credits: gs.credits + rng(200, 500) }, message: "Accueil de professionnel. +15 rép, quelques crédits." })
      }
    ]
  },
  'Le Purgatoire': {
    title: "Arrivée au Purgatoire",
    description: "Les portes s'ouvrent sur une atmosphère pesante. Un ancien détenu t'observe depuis le fond.",
    choices: [
      {
        label: "Entrer et observer",
        result: gs => ({ gs: {}, message: "Tu entres. L'ambiance est lourde mais gérable." })
      },
      {
        label: "Saluer les anciens (si tu as été en prison)",
        available: gs => gs.prisonEscapes > 0 || (gs.isImprisoned === false && gs.interrogationsSurvived > 0),
        result: gs => ({ gs: { reputation: gs.reputation + 10, credits: gs.credits + rng(100, 300) }, message: "+10 rép. La solidarité des condamnés." })
      }
    ]
  },
  'Emporium Requiem': {
    title: "Arrivée à l'Emporium",
    description: "Fastueux. Artificiel. Un agent commercial te tend une carte de bienvenue dorée.",
    choices: [
      {
        label: "Accepter le programme VIP (500 cr)",
        available: gs => gs.credits >= 500,
        result: gs => ({ gs: { credits: gs.credits - 500 + rng(300, 1200), reputation: gs.reputation + 10 }, message: "-500 cr mais accès premium. Net positif probable." })
      },
      {
        label: "Décliner — accès standard",
        result: gs => ({ gs: {}, message: "Accès standard. Pas de dorure." })
      }
    ]
  },
}

// Interrogatoire
export const INTERROGATION: ArrivalSituation = {
  title: "INTERROGATOIRE",
  description: "Une salle blanche. Une lampe dans les yeux. Des questions. Beaucoup de questions.",
  choices: [
    {
      label: "Garder le silence",
      result: gs => Math.random() < 0.5
        ? { gs: { interrogationsSurvived: gs.interrogationsSurvived + 1, reputation: gs.reputation + 10 }, message: "Ils lâchent. Tu ressors avec ta réputation intacte. +10 rép." }
        : { gs: { playerHp: Math.max(1, gs.playerHp - rng(10, 25)), interrogationsSurvived: gs.interrogationsSurvived + 1 }, message: "Ils n'apprécient pas le silence. -PV. Mais rien de révélé." }
    },
    {
      label: "Tout avouer",
      result: gs => ({ gs: { reputation: gs.reputation - 20, credits: Math.max(0, gs.credits - rng(200, 600)), interrogationsSurvived: gs.interrogationsSurvived + 1 }, message: "-20 rép, -crédits. Ils te libèrent. Un peu humilié." })
    },
    {
      label: "Négocier une sortie",
      result: gs => gs.reputation > 30
        ? { gs: { credits: Math.max(0, gs.credits - rng(100, 300)), interrogationsSurvived: gs.interrogationsSurvived + 1 }, message: "Ta réputation et des crédits changent de mains. Tu sors proprement." }
        : { gs: { isImprisoned: true, prisonDaysLeft: 2, interrogationsSurvived: gs.interrogationsSurvived + 1 }, message: "Pas assez d'influence. Cellule.", triggerPrison: true }
    },
    {
      label: "Tenter une évasion",
      result: gs => Math.random() < 0.40
        ? { gs: { playerHp: Math.max(1, gs.playerHp - rng(10, 20)), interrogationsSurvived: gs.interrogationsSurvived + 1, prisonEscapes: gs.prisonEscapes + 1, reputation: gs.reputation + 15 }, message: "Tu t'en sors. -PV. +15 rép (audace)." }
        : { gs: { playerHp: Math.max(1, gs.playerHp - rng(20, 40)), isImprisoned: true, prisonDaysLeft: 3 }, message: "Raté. -PV, prison + 3 jours.", triggerPrison: true }
    }
  ]
}

export function getArrivalSituation(gs: GameState, forced = false): ArrivalSituation | null {
  if (!forced && Math.random() > 0.40) return null

  const repSituation = getReputationArrival(gs)
  if (repSituation && (forced || Math.random() < 0.5)) return repSituation

  return STATION_ARRIVALS[gs.currentStation] ?? null
}

// Situation après une défaite en combat (interrogatoire ou capture)
export function getCaptureConsequence(gs: GameState): ArrivalSituation {
  return INTERROGATION
}

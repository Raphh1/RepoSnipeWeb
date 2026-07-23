import type { GameState } from '../types'
import type { WanderEvent } from './exploration'
import { getAccessibleStations } from '../data/stations'

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

function addDecision(gs: GameState, d: string): string[] {
  const arr = gs.pastDecisions ?? []
  return arr.includes(d) ? arr : [...arr, d]
}
function shiftPillar(gs: GameState, pillar: keyof GameState['pillarStanding'], delta: number) {
  const cur = gs.pillarStanding ?? { cesarion: 0, raphazarus: 0, eliotis: 0, maxance: 0, alanossa: 0, scotty: 0 }
  return { ...cur, [pillar]: Math.max(-100, Math.min(100, (cur[pillar] ?? 0) + delta)) }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function pickTarget(gs: GameState) {
  const list = getAccessibleStations(gs.currentStation).filter(s => s.name !== gs.currentStation)
  return list.length > 0 ? pick(list) : null
}

// ── ÉVÉNEMENTS DE MÉMOIRE ─────────────────────────────────────────────────────
// Chaque entrée définit les conditions de déclenchement et l'événement produit.

export interface MemoryEventDef {
  id: string
  requires: {
    decisions?: string[]   // au moins une de ces décisions dans pastDecisions
    tags?: string[]        // au moins un de ces moralTags
    pillarThreshold?: { pillar: keyof GameState['pillarStanding']; min?: number; max?: number }
    minDay?: number
  }
  weight: number           // probabilité relative si plusieurs événements éligibles
  build: (gs: GameState) => WanderEvent
}

export const MEMORY_EVENT_DEFS: MemoryEventDef[] = [

  // ── MERCENAIRE CADOR ─────────────────────────────────────────────────────
  {
    id: 'cador-returns',
    requires: { decisions: ['saved-mercenary'] },
    weight: 3,
    build: (gs) => ({
      title: "Cador — dette tenue",
      description: "Tu le reconnais avant qu'il te voie. Cador. Plus en forme qu'à la dernière fois. Il te fait un signe discret depuis une alcôve. 'Je pensais pas te recroiser aussi vite. J'ai pas oublié.'",
      choices: [
        { label: "Voir ce qu'il peut t'offrir", result: (gs) => {
          const t = pickTarget(gs)
          const q = t ? {
            id: Math.random().toString(36).slice(2,8),
            title: `Faveur de Cador — ${t.name}`,
            giver: 'Cador',
            giverStation: gs.currentStation,
            type: 'bounty' as const,
            description: `Cador a une cible sur ${t.name}. 'Avec mon aide tactique, tu as 30% de chances en plus. Je t'en dois une.' Il te donne toutes les infos nécessaires.`,
            targetStation: t.name,
            creditReward: 4500,
            repReward: 30,
          } : undefined
          return { gs: { reputation: gs.reputation + 10 }, message: `Il te donne une piste sérieuse. +10 rép, nouvelle quête${t ? ` sur ${t.name}` : ''}.`, quest: q }
        }},
        { label: "Lui demander des informations sur la zone", result: (gs) => ({
          gs: { credits: gs.credits + rng(300, 700) },
          message: "Il te brief sur la situation locale. Des infos qui valent de l'or. +crédits."
        })},
        { label: "Juste le saluer et continuer", result: () => ({
          gs: {},
          message: "Il hoche la tête. 'T'as sauvé ma peau une fois. C'est suffisant pour un respect mutuel.' Il repart."
        })}
      ]
    })
  },

  // ── TRANSFUGE TRAHIE ─────────────────────────────────────────────────────
  {
    id: 'transfuge-vengeance',
    requires: { decisions: ['betrayed-transfuge'] },
    weight: 4,
    build: (gs) => ({
      title: "Quelqu'un cherche le délateur",
      description: "Une affiche. Ton signalement approximatif. 'Recherché pour trahison — récompense'. Elle a survécu. Et elle sait que c'est toi. Ces gens ont des réseaux.",
      choices: [
        { label: "Ignorer et espérer qu'elle ne te trouve pas", result: () => ({
          gs: {},
          message: "Tu passes. Pour l'instant, elle ne te voit pas. Mais l'affiche est neuve."
        })},
        { label: "Chercher à lui parler — tenter une explication", result: (gs) => {
          if (Math.random() < 0.25 + gs.reputation / 400) {
            return { gs: { reputation: gs.reputation + 8, pastDecisions: addDecision(gs, 'reconciled-transfuge') }, message: "Elle écoute. Elle n'oublie pas — mais elle comprend le contexte. Tension baissée. +8 rép." }
          }
          return { gs: { playerHp: Math.max(1, gs.playerHp - rng(20, 40)), reputation: gs.reputation - 10 }, message: "La discussion tourne mal. Elle n'était pas seule. -PV, -10 rép." }
        }},
        { label: "La payer pour qu'elle efface l'affiche (500 cr)", result: (gs) => {
          if (gs.credits < 500) return { gs: {}, message: "Pas assez de crédits. L'affiche reste." }
          return { gs: { credits: gs.credits - 500, pastDecisions: addDecision(gs, 'bought-silence-transfuge') }, message: "-500 cr. Elle prend l'argent. L'affiche disparaît. La rancœur, moins sûr." }
        }}
      ]
    })
  },

  // ── SCIENTIFIQUE SAUVÉ ───────────────────────────────────────────────────
  {
    id: 'scientist-gift',
    requires: { decisions: ['aided-scientist'] },
    weight: 2,
    build: (gs) => ({
      title: "Un colis sans expéditeur",
      description: "Un gamin te tend un paquet. Pas de nom. Pas d'adresse. Juste une note griffonnée : 'Pour celui qui m'a laissé une chance. Je n'oublie pas.' À l'intérieur, quelque chose d'utile.",
      choices: [
        { label: "Ouvrir", result: (gs) => {
          const roll = Math.random()
          if (roll < 0.40) return { gs: { cargo: { ...gs.cargo, 'Implants': (gs.cargo['Implants'] ?? 0) + 1 } }, message: "Un implant de qualité. Travail de laboratoire. Valeur réelle. +1 Implant." }
          if (roll < 0.75) return { gs: { credits: gs.credits + rng(800, 1800) }, message: `${rng(800, 1800)} crédits en numéraire. Il a bien réussi, depuis.` }
          return { gs: { cargo: { ...gs.cargo, 'Données classifiées': (gs.cargo['Données classifiées'] ?? 0) + 1 }, reputation: gs.reputation + 15 }, message: "Des données de recherche confidentielles. +15 rép et quelque chose d'exploitable." }
        }}
      ]
    })
  },

  // ── RÉPUTATION DE DÉLATEUR ───────────────────────────────────────────────
  {
    id: 'delateur-reputation',
    requires: { tags: ['délateur'] },
    weight: 3,
    build: (gs) => ({
      title: "Le bruit court",
      description: "Un contact que tu connaissais de vue te regarde différemment. Il détourne les yeux quand tu t'approches. La réputation d'un délateur voyage vite dans ce milieu.",
      choices: [
        { label: "L'aborder directement", result: (gs) => {
          if (Math.random() < 0.3 + gs.reputation / 400) {
            return { gs: { reputation: gs.reputation + 5 }, message: "Il t'écoute. Il est pas convaincu, mais il te laisse parler. +5 rép (effort reconnu)." }
          }
          return { gs: { reputation: gs.reputation - 12 }, message: "Il n'a pas envie d'entendre. Il repart. -12 rép. Ces gens se parlent entre eux." }
        }},
        { label: "Assumer et en jouer", result: (gs) => ({
          gs: { reputation: gs.reputation - 8, credits: gs.credits + rng(200, 500) },
          message: "Une faction te contacte — ils cherchent précisément quelqu'un sans scrupules. Moralement bancal, financièrement intéressant. -8 rép, +crédits."
        })},
        { label: "Ignorer — ce n'est pas ton problème", result: () => ({
          gs: {},
          message: "Tu passes. Les réputations mettent du temps à se bâtir et du temps à s'effacer."
        })}
      ]
    })
  },

  // ── ÉVASION LÉGENDAIRE ───────────────────────────────────────────────────
  {
    id: 'escape-legend',
    requires: { decisions: ['escaped-interrogation'] },
    weight: 2,
    build: (gs) => ({
      title: "La rumeur de l'évasion",
      description: "Quelqu'un dans un bar raconte une histoire — une évasion d'un poste d'interrogatoire. Les détails correspondent à ce que tu as vécu. Ta légende te précède.",
      choices: [
        { label: "Laisser courir la rumeur", result: (gs) => ({
          gs: { reputation: gs.reputation + 12 },
          message: "+12 rép. La réputation d'évasion est un actif dans certains milieux."
        })},
        { label: "Démentir — trop dangereux d'être connu", result: (gs) => ({
          gs: { reputation: gs.reputation - 5 },
          message: "Tu contestes la rumeur. Certains te croient. D'autres moins. -5 rép (tu sembles nerveux)."
        })},
        { label: "Capitaliser — te présenter comme consultant en évasion", result: (gs) => {
          const t = pickTarget(gs)
          if (!t) return { gs: { credits: gs.credits + rng(200, 500) }, message: "Quelqu'un paie pour tes conseils. +crédits." }
          const q = {
            id: Math.random().toString(36).slice(2,8),
            title: `Extraction — ${t.name}`,
            giver: 'Client discret',
            giverStation: gs.currentStation,
            type: 'extraction' as const,
            description: `Ta réputation d'évasion t'a valu un contrat. Quelqu'un veut sortir de ${t.name} discrètement. Paiement élevé, risque réel.`,
            targetStation: t.name,
            creditReward: 5000,
            repReward: 20,
          }
          return { gs: { credits: gs.credits + rng(300, 600) }, message: `Un client sérieux. Extraction sur ${t.name}. +crédits d'avance.`, quest: q }
        }}
      ]
    })
  },

  // ── PISTIS / EMPORIUM ────────────────────────────────────────────────────
  {
    id: 'pistis-recommends',
    requires: { decisions: ['pistis-ally'] },
    weight: 2,
    build: (gs) => ({
      title: "Recommandation de Pistis",
      description: "Un homme en costume sobre s'approche. 'Pistis m'a donné ton nom. Il dit que tu es quelqu'un sur qui on peut compter.' Il a quelque chose à proposer.",
      choices: [
        { label: "Écouter", result: (gs) => {
          const t = pickTarget(gs)
          const q = t ? {
            id: Math.random().toString(36).slice(2,8),
            title: `Mission Emporium — ${t.name}`,
            giver: 'Contact de Pistis',
            giverStation: gs.currentStation,
            type: 'delivery' as const,
            description: `Via Pistis, un contact de l'Emporium te confie une livraison sur ${t.name}. Discrétion absolue. Paiement au-dessus du marché.`,
            targetStation: t.name,
            creditReward: 3800,
            repReward: 15,
          } : undefined
          return {
            gs: { pillarStanding: shiftPillar(gs, 'cesarion', +10), factionReputation: { ...gs.factionReputation, emporium: gs.factionReputation.emporium + 8 } },
            message: `Une mission via les canaux de Pistis. +10 standing Cesarion, +8 rép Emporium.`,
            quest: q
          }
        }},
        { label: "Décliner poliment", result: () => ({ gs: {}, message: "Il hoche la tête. 'Une autre fois, peut-être.'" })}
      ]
    })
  },

  // ── CAEL / FAUCONS ───────────────────────────────────────────────────────
  {
    id: 'cael-message',
    requires: { decisions: ['cael-contact'] },
    weight: 2,
    build: (gs) => ({
      title: "Message de Cael",
      description: "Un message chiffré sur ton terminal de bord. Signature des Faucons Noirs. Cael. Court : 'J'ai besoin d'un extérieur. Intéressé ?'",
      choices: [
        { label: "Répondre oui", result: (gs) => {
          const t = pickTarget(gs)
          const q = t ? {
            id: Math.random().toString(36).slice(2,8),
            title: `Opération Faucon — ${t.name}`,
            giver: 'Cael',
            giverStation: gs.currentStation,
            type: 'sabotage' as const,
            description: `Cael a besoin d'un indépendant pour une opération que les Faucons ne peuvent pas officiellement conduire sur ${t.name}. Risque réel. Paiement exceptionnel.`,
            targetStation: t.name,
            creditReward: 6000,
            repReward: -5,
          } : undefined
          return {
            gs: { factionReputation: { ...gs.factionReputation, faucons: gs.factionReputation.faucons + 12 } },
            message: `Mission reçue depuis les Faucons. +12 rép Faucons.`,
            quest: q
          }
        }},
        { label: "Ignorer le message", result: () => ({ gs: {}, message: "Tu n'y réponds pas. Il enverra peut-être une autre fois." })}
      ]
    })
  },

  // ── OPPORTUNISTE CONNU ───────────────────────────────────────────────────
  {
    id: 'opportunist-rep',
    requires: { tags: ['opportuniste'] },
    weight: 2,
    build: () => ({
      title: "La réputation d'opportuniste",
      description: "On t'aborde avec un sourire calculateur. 'J'ai entendu parler de toi. Quelqu'un qui sait profiter d'une situation. Exactement le profil qu'il me faut.'",
      choices: [
        { label: "Écouter la proposition", result: (gs) => {
          const t = pickTarget(gs)
          const q = t ? {
            id: Math.random().toString(36).slice(2,8),
            title: `Opération grise — ${t.name}`,
            giver: 'Recruteur anonyme',
            giverStation: gs.currentStation,
            type: 'heist' as const,
            description: `Un travail qui ne porte pas de nom sur ${t.name}. Légal dans les détails. Moralement flou dans l'ensemble. Paiement bien au-dessus du marché.`,
            targetStation: t.name,
            creditReward: 3500,
            repReward: -8,
          } : undefined
          return { gs: {}, message: `Une mission qui correspond à ta réputation. Paiement élevé.`, quest: q }
        }},
        { label: "Rejeter — tu veux changer d'image", result: (gs) => ({
          gs: { reputation: gs.reputation + 5 },
          message: "Il hausse les épaules. Toi tu te sens légèrement mieux. +5 rép (effort)."
        })}
      ]
    })
  },

  // ── DÉSERTEUR EMMENÉ ─────────────────────────────────────────────────────
  {
    id: 'defector-gratitude',
    requires: { decisions: ['helped-defector'] },
    weight: 2,
    build: (gs) => ({
      title: "Un message de l'autre côté",
      description: "La désertrice que tu avais embarquée t'a retrouvé. Un message vocal court : 'Je suis arrivée. Je suis en sécurité. Si tu passes par là-bas un jour, tu as une amie.'",
      choices: [
        { label: "Répondre", result: (gs) => ({
          gs: { reputation: gs.reputation + 15, pastDecisions: addDecision(gs, 'defector-network') },
          message: "+15 rép. Tu as maintenant un contact dans un réseau de déserteurs. Ça peut servir."
        })},
        { label: "Ne pas répondre — garder ses distances", result: () => ({
          gs: {},
          message: "Tu lis le message. Tu ne réponds pas. Elle comprendra."
        })}
      ]
    })
  },

  // ── TENSIONS PILIERS — CHASSEUR DE CESARION ──────────────────────────────
  {
    id: 'cesarion-bounty-hunter',
    requires: { pillarThreshold: { pillar: 'cesarion', max: -25 } },
    weight: 4,
    build: (gs) => ({
      title: "Chasseur mandaté par l'Emporium",
      description: "Il porte une plaque d'accréditation impériale. Ton nom est sur sa liste. L'Emporium de Cesarion n'oublie pas ceux qui leur ont causé du tort.",
      choices: [
        { label: "Fuir avant qu'il te voie (40%)", result: (gs) => Math.random() < 0.40
          ? { gs: {}, message: "Tu disparais dans la foule. Il continue de chercher." }
          : { gs: { isImprisoned: true, prisonDaysLeft: rng(2, 4), screen: 'prison' as const }, message: "Il t'a vu. Des renforts arrivent vite. Cellule." }
        },
        { label: "L'affronter", result: () => ({ type: 'combat' as const, message: "Il dégaine. Combat." }) },
        { label: "Payer pour faire effacer ton nom (800 cr)", result: (gs) => {
          if (gs.credits < 800) return { gs: {}, message: "Pas assez de crédits. Il te regarde. Il attend." }
          return {
            gs: { credits: gs.credits - 800, pillarStanding: shiftPillar(gs, 'cesarion', +15) },
            message: "-800 cr. Il fait passer le message. Le standing Emporium remonte légèrement."
          }
        }}
      ]
    })
  },

  // ── TENSIONS PILIERS — FAVEUR DE RAPHAZARUS ──────────────────────────────
  {
    id: 'raphazarus-favor',
    requires: { pillarThreshold: { pillar: 'raphazarus', min: 30 } },
    weight: 2,
    build: (gs) => ({
      title: "Courrier de L'Arc Perdu",
      description: "Un messager en armure discrète. Il ne dit pas son nom. Il te tend un cylindre scellé. 'De la part de celui qui tient L'Arc Perdu. Tu t'es comporté correctement là-bas.'",
      choices: [
        { label: "Ouvrir le cylindre", result: (gs) => {
          const roll = Math.random()
          if (roll < 0.5) return {
            gs: { cargo: { ...gs.cargo, 'Reliques': (gs.cargo['Reliques'] ?? 0) + 1, 'Artefacts': (gs.cargo['Artefacts'] ?? 0) + 1 } },
            message: "Des artefacts de la Grande Guerre. Authentiques. Inestimables. +Reliques, +Artefacts."
          }
          return {
            gs: { credits: gs.credits + rng(2000, 5000), reputation: gs.reputation + 20 },
            message: `${rng(2000, 5000)} crédits et une lettre de recommandation. +20 rép. Raphazarus a de la mémoire.`
          }
        }},
        { label: "Refuser — pas d'obligations envers qui que ce soit", result: (gs) => ({
          gs: { pillarStanding: shiftPillar(gs, 'raphazarus', -10) },
          message: "Le messager repart sans un mot. Refuser un geste de Raphazarus se paie autrement. -10 standing."
        })}
      ]
    })
  },

  // ── TENSIONS PILIERS — SCOTTY RECONNAISSANT ──────────────────────────────
  {
    id: 'scotty-network',
    requires: { pillarThreshold: { pillar: 'scotty', min: 20 } },
    weight: 2,
    build: (gs) => ({
      title: "Le réseau de Scotty",
      description: "Un visage que tu reconnais vaguement. Employé de Scotty Golden North. Il te glisse quelque chose discrètement. 'M. Scotty dit que les amis de la maison sont bien traités.'",
      choices: [
        { label: "Accepter", result: (gs) => {
          const roll = Math.random()
          if (roll < 0.4) return { gs: { credits: gs.credits + rng(1000, 2500) }, message: "Une enveloppe de crédits. Le réseau de Scotty fonctionne bien. +crédits." }
          if (roll < 0.7) return { gs: { cargo: { ...gs.cargo, 'Spécialités festives': (gs.cargo['Spécialités festives'] ?? 0) + 2 } }, message: "Des spécialités de Scotty Golden North. +2 Spécialités festives." }
          return { gs: { playerHp: Math.min(gs.playerMaxHp, gs.playerHp + rng(20, 40)), stamina: Math.min(gs.maxStamina, gs.stamina + 2) }, message: "Du matériel médical de qualité casino. +PV, +stamina." }
        }},
        { label: "Décliner", result: () => ({ gs: {}, message: "Il repart. Scotty ne force jamais." })}
      ]
    })
  },

]

// ── SÉLECTION D'UN ÉVÉNEMENT DE MÉMOIRE ──────────────────────────────────────

export function rollMemoryEvent(gs: GameState): WanderEvent | null {
  const decisions = gs.pastDecisions ?? []
  const tags = gs.moralTags ?? []
  const standing = gs.pillarStanding ?? { cesarion: 0, raphazarus: 0, eliotis: 0, maxance: 0, alanossa: 0, scotty: 0 }

  const eligible = MEMORY_EVENT_DEFS.filter(def => {
    const r = def.requires
    if (r.decisions && !r.decisions.some(d => decisions.includes(d))) return false
    if (r.tags && !r.tags.some(t => tags.includes(t))) return false
    if (r.pillarThreshold) {
      const val = standing[r.pillarThreshold.pillar] ?? 0
      if (r.pillarThreshold.min !== undefined && val < r.pillarThreshold.min) return false
      if (r.pillarThreshold.max !== undefined && val > r.pillarThreshold.max) return false
    }
    if (r.minDay && gs.day < r.minDay) return false
    return true
  })

  if (eligible.length === 0) return null

  // Tirage pondéré
  const total = eligible.reduce((s, e) => s + e.weight, 0)
  let rand = Math.random() * total
  for (const e of eligible) {
    rand -= e.weight
    if (rand <= 0) return e.build(gs)
  }
  return eligible[eligible.length - 1].build(gs)
}

// ── UTILITAIRES EXPORT ────────────────────────────────────────────────────────

export { addDecision, shiftPillar }

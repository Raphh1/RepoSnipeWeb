import type { GameState, NarrativeArc, ArcId } from '../types'

export interface ArcStep {
  title: string
  description: string
  condition?: (gs: GameState) => boolean
  conditionHint?: string
  choices: ArcChoice[]
}

export interface ArcChoice {
  label: string
  available?: (gs: GameState) => boolean
  effect: (gs: GameState) => Partial<GameState> & { message: string; advancesArc?: boolean; failsArc?: boolean }
}

export interface ArcDefinition {
  id: ArcId
  title: string
  intro: string
  triggerCondition: (gs: GameState) => boolean
  steps: ArcStep[]
  completionReward: (gs: GameState) => Partial<GameState>
  completionMessage: string
}

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

// ── ARC 1 : ALANOSSA ─────────────────────────────────────────────────────────
const ARC_ALANOSSA: ArcDefinition = {
  id: 'alanossa',
  title: 'Dette de Sang',
  intro: "Une rumeur circule : Alanossa cherche quelqu'un. Pas pour une offre d'emploi.",
  triggerCondition: gs => gs.day >= 5 && gs.visitedStations.includes('Arc Ouest Apocalypse'),
  completionMessage: "Alanossa est vaincu. Une ère s'achève. Le vide retient ce nom.",
  completionReward: gs => ({
    credits: gs.credits + 8000,
    reputation: gs.reputation + 150,
    bossesDefeated: gs.bossesDefeated + 1,
    stationBossesBeaten: [...gs.stationBossesBeaten, 'Arc Ouest Apocalypse'],
  }),
  steps: [
    {
      title: "La Rumeur",
      description: "Dans un bar de La Carcasse, quelqu'un te glisse un message. 'Alanossa a entendu ton nom. Il veut te parler. Pas de façon amicale.'",
      choices: [
        {
          label: "Ignorer et continuer",
          effect: gs => ({ message: "Tu ranges le message. Ignorer Alanossa, c'est un choix.", advancesArc: true }),
        },
        {
          label: "Enquêter sur les intentions d'Alanossa",
          effect: gs => ({
            reputation: gs.reputation + 10,
            message: "Tu poses des questions. Les réponses confirment : Alanossa veut régler quelque chose. +10 rép (audace).",
            advancesArc: true,
          }),
        },
      ]
    },
    {
      title: "Le Messager",
      description: "Un lieutenant d'Alanossa te trouve à quai. 'Le patron t'invite à Arc Ouest Apocalypse. Seul. Sans armes. Ces conditions ne sont pas négociables.'",
      choices: [
        {
          label: "Accepter les conditions",
          effect: gs => ({
            message: "Tu acceptes. Le messager repart. Tu pars pour Arc Ouest Apocalypse.",
            advancesArc: true,
          }),
        },
        {
          label: "Refuser et proposer un terrain neutre",
          available: gs => gs.reputation >= 50,
          effect: gs => ({
            reputation: gs.reputation + 15,
            message: "Alanossa accepte à contrecœur. Il respecte ça. +15 rép.",
            advancesArc: true,
          }),
        },
        {
          label: "Disparaître — changer de secteur",
          effect: gs => ({
            message: "Tu files. Alanossa ne l'oublie pas. L'arc est en pause.",
            failsArc: true,
          }),
        },
      ]
    },
    {
      title: "La Confrontation",
      description: "Tu es face à Alanossa. Ses yeux t'évaluent comme une marchandise. 'Tu as quelque chose qui m'appartient. Ou quelqu'un qui te protège. L'un ou l'autre explique pourquoi tu es encore en vie.'",
      choices: [
        {
          label: "Négocier — proposer un arrangement",
          available: gs => gs.credits >= 3000,
          effect: gs => ({
            credits: gs.credits - 3000,
            reputation: gs.reputation + 30,
            message: "-3000 cr. Alanossa accepte. Accord tacite. +30 rép.",
            advancesArc: true,
          }),
        },
        {
          label: "Défier Alanossa en combat",
          effect: gs => ({
            message: "Combat avec Alanossa.",
            advancesArc: true,
          }),
        },
        {
          label: "Révéler une information précieuse",
          available: gs => gs.completedQuestIds.length >= 3,
          effect: gs => ({
            reputation: gs.reputation + 50,
            message: "L'info l'intéresse. Il te laisse partir avec quelque chose en plus. +50 rép.",
            advancesArc: true,
          }),
        },
      ]
    },
  ]
}

// ── ARC 2 : RAPHAZARUS ────────────────────────────────────────────────────────
const ARC_RAPHAZARUS: ArcDefinition = {
  id: 'raphazarus',
  title: 'Le Prophète du Vide',
  intro: "Des graffitis apparaissent sur toutes les stations. Le même symbole. Le même nom : Raphazarus.",
  triggerCondition: gs => gs.day >= 10 && gs.visitedStations.length >= 4,
  completionMessage: "Tu as rencontré Raphazarus à L'Arc Perdu. Le Culte du Vide t'attend — ou te craint. Raphazarus peut être affronté là-bas si tu veux régler ça définitivement.",
  completionReward: gs => ({
    credits: gs.credits + (gs.pastDecisions?.includes('raphazarus_joined') ? 4000 : 1500),
    reputation: gs.reputation + (gs.pastDecisions?.includes('raphazarus_joined') ? 80 : 20),
  }),
  steps: [
    {
      title: "Le Symbole",
      description: "Partout où tu vas, le même symbole gravé sur les murs : un cercle avec une ligne brisée. Les habitants baissent la voix. 'Raphazarus annonce la fin des routes commerciales. Il dit que le vide a faim.'",
      choices: [
        {
          label: "Chercher à comprendre ce symbole",
          effect: gs => ({
            reputation: gs.reputation + 8,
            message: "Tu poses des questions. Les gens t'évitent après. Mais tu sais maintenant que Raphazarus opère depuis L'Arc Perdu — un vieux fragment militaire dérivant. +8 rép.",
            advancesArc: true,
          }),
        },
        {
          label: "Ignorer — c'est une secte de plus",
          effect: gs => ({
            message: "Tu continues. Le symbole aussi. Il semble te suivre.",
            advancesArc: true,
          }),
        },
      ]
    },
    {
      title: "Le Premier Disciple",
      description: "Une femme t'aborde dans un couloir. Robe sombre, regard absent. 'Raphazarus a vu ton nom dans les étoiles. Il demande à te rencontrer à L'Arc Perdu. C'est une invitation — pas une convocation.'",
      choices: [
        {
          label: "Accepter l'invitation — se rendre à L'Arc Perdu",
          effect: gs => ({
            message: "Tu suis la disciple. Direction L'Arc Perdu.",
            advancesArc: true,
          }),
        },
        {
          label: "Interroger la disciple — qui est vraiment Raphazarus ?",
          effect: gs => ({
            reputation: gs.reputation + 5,
            message: "Elle parle pendant des heures. Tu gardes ce qui est utile : Raphazarus s'est installé à L'Arc Perdu, ancien fragment militaire de la Grande Guerre. +5 rép.",
            advancesArc: true,
          }),
        },
        {
          label: "Décliner — ce n'est pas ton problème",
          effect: gs => ({
            message: "Elle sourit. 'Raphazarus pensait que tu dirais ça. Il attend à L'Arc Perdu quand même.' Elle disparaît.",
            advancesArc: true,
          }),
        },
      ]
    },
    {
      title: "Face à Raphazarus",
      condition: gs => gs.currentStation === "L'Arc Perdu",
      conditionHint: "Rends-toi à L'Arc Perdu pour rencontrer Raphazarus.",
      description: "Il est plus vieux que tu ne pensais. Ses yeux fixent quelque chose derrière toi. 'Le vide te connaît. Je t'ai observé depuis longtemps. Je ne t'offre pas un emploi — je t'offre un sens.' Il attend ta réponse.",
      choices: [
        {
          label: "Rejoindre le Culte du Vide",
          available: gs => gs.faction === 'none',
          effect: gs => ({
            reputation: gs.reputation + 60,
            faction: 'culte' as const,
            pastDecisions: [...(gs.pastDecisions ?? []), 'raphazarus_joined'],
            message: "Tu rejoins le Culte. Il pose une main sur ton épaule. 'Le vide t'a choisi.' +60 rép. Tu es maintenant membre du Culte du Vide.",
            advancesArc: true,
          }),
        },
        {
          label: "Rejoindre le Culte (déjà engagé ailleurs — allégeance double)",
          available: gs => gs.faction !== 'none' && gs.faction !== 'culte',
          effect: gs => ({
            reputation: gs.reputation + 30,
            isDoubleAgent: true,
            pastDecisions: [...(gs.pastDecisions ?? []), 'raphazarus_joined'],
            message: "Tu joues un jeu dangereux. Raphazarus accepte — il sait que tu as d'autres allégeances. Double agent. +30 rép.",
            advancesArc: true,
          }),
        },
        {
          label: "Refuser — ce n'est pas ta voie",
          effect: gs => ({
            pastDecisions: [...(gs.pastDecisions ?? []), 'raphazarus_refused'],
            message: "Tu déclines. Il n'insiste pas. 'Le vide n'oublie pas les refus. Mais il pardonne les honnêtes.' Il te laisse partir. Tu sais maintenant où le trouver.",
            advancesArc: true,
          }),
        },
        {
          label: "Négocier — protection contre informations",
          available: gs => gs.completedQuestIds.length >= 5,
          effect: gs => ({
            reputation: gs.reputation + 40,
            credits: gs.credits + 2000,
            pastDecisions: [...(gs.pastDecisions ?? []), 'raphazarus_deal'],
            message: "Arrangement trouvé. +40 rép, +2000 cr. Il te doit quelque chose. Et toi à lui.",
            advancesArc: true,
          }),
        },
      ]
    },
  ]
}

// ── ARC 3 : ENQUÊTE VAEL ─────────────────────────────────────────────────────
const ARC_VAEL: ArcDefinition = {
  id: 'vael',
  title: "L'Enquête des Abysses",
  intro: "Une station a été détruite. Les Abysses de Velkor. Mais les survivants parlent d'autre chose — une disparition avant la catastrophe.",
  triggerCondition: gs => gs.visitedStations.includes('Les Abysses de Velkor'),
  completionMessage: "La vérité sur Velkor est connue. Ce qui en sortira, c'est ton choix.",
  completionReward: gs => ({
    credits: gs.credits + 5000,
    reputation: gs.reputation + 80,
  }),
  steps: [
    {
      title: "Les Survivants",
      description: "Aux Abysses de Velkor, une vieille chercheuse t'aborde. 'Avant l'incident, quelqu'un a volé nos recherches. Quelqu'un du dedans. J'ai un nom. J'ai besoin d'un messager.'",
      choices: [
        {
          label: "Accepter l'enquête",
          effect: gs => ({
            message: "Tu acceptes. Elle te donne un nom et une adresse.",
            advancesArc: true,
          }),
        },
        {
          label: "Demander une avance (500 cr)",
          effect: gs => ({
            credits: gs.credits + 500,
            message: "+500 cr avance. L'enquête commence.",
            advancesArc: true,
          }),
        },
      ]
    },
    {
      title: "La Piste",
      description: "Le nom mène à Nexus Aldara. Là-bas, les traces s'arrêtent net. Quelqu'un a effacé les données. Mais pas assez bien.",
      choices: [
        {
          label: "Pirater le terminal pour récupérer les données",
          available: gs => gs.class.name === 'Hackeur',
          effect: gs => ({
            reputation: gs.reputation + 20,
            message: "[HACKEUR] Données récupérées. +20 rép. Tu sais qui.",
            advancesArc: true,
          }),
        },
        {
          label: "Payer un informateur (400 cr)",
          effect: gs => ({
            credits: gs.credits - 400,
            message: gs.credits >= 400 ? "-400 cr. L'info est bonne. La piste continue." : "Pas assez de crédits.",
            advancesArc: gs.credits >= 400,
          }),
        },
        {
          label: "Chercher des témoins dans la station",
          effect: gs => ({
            reputation: gs.reputation + 10,
            message: "Plusieurs témoignages. La vérité émerge. +10 rép.",
            advancesArc: true,
          }),
        },
      ]
    },
    {
      title: "La Vérité",
      description: "Le responsable : un directeur de recherche. Il est vivant, caché dans les confins. Il t'attend — il savait que tu viendrais. 'J'ai fait ce que j'avais à faire. Les recherches auraient été détruites autrement. Je les ai sauvées.'",
      choices: [
        {
          label: "Le livrer aux autorités",
          effect: gs => ({
            reputation: gs.reputation + 50,
            message: "Justice rendue. +50 rép. La chercheuse te paie.",
            advancesArc: true,
          }),
        },
        {
          label: "Le laisser partir — il dit peut-être la vérité",
          effect: gs => ({
            reputation: gs.reputation + 20,
            credits: gs.credits + 1500,
            message: "Il disparaît avec ses recherches. +20 rép, +1500 cr (sa reconnaissance).",
            advancesArc: true,
          }),
        },
        {
          label: "Récupérer les recherches et les vendre",
          effect: gs => ({
            credits: gs.credits + 4000,
            reputation: gs.reputation - 20,
            message: "+4000 cr. -20 rép. Les données sont vendues au plus offrant.",
            advancesArc: true,
          }),
        },
      ]
    },
  ]
}

// ── ARC 4 : GUERRE DE FACTIONS ────────────────────────────────────────────────
const ARC_FACTIONWAR: ArcDefinition = {
  id: 'factionwar',
  title: 'La Guerre des Factions',
  intro: "Les Faucons Noirs et les Gardiens Écarlates se sont déclaré la guerre. Tout le secteur va en subir les conséquences.",
  triggerCondition: gs => gs.day >= 20 || gs.bossesDefeated >= 1,
  completionMessage: "La guerre de factions est terminée. Ton rôle dedans restera dans les archives.",
  completionReward: gs => ({
    credits: gs.credits + 10000,
    reputation: gs.reputation + 200,
    isFactionLeader: true,
  }),
  steps: [
    {
      title: "L'Étincelle",
      description: "Un incident à Fort Kharos : un Gardien Écarlate a été assassiné. Les Faucons Noirs sont accusés. Les deux factions se mobilisent. Les routes commerciales sont coupées.",
      choices: [
        {
          label: "S'aligner avec les Faucons Noirs",
          effect: gs => ({
            faction: 'faucons',
            message: "Tu rejoins les Faucons. L'arc progresse de leur côté.",
            advancesArc: true,
          }),
        },
        {
          label: "S'aligner avec les Gardiens Écarlates",
          effect: gs => ({
            faction: 'gardiens',
            message: "Tu rejoins les Gardiens. L'arc progresse de leur côté.",
            advancesArc: true,
          }),
        },
        {
          label: "Rester neutre et en profiter",
          effect: gs => ({
            credits: gs.credits + rng(500, 1500),
            message: "Tu vends des informations aux deux camps. +crédits. Dangereux à long terme.",
            advancesArc: true,
          }),
        },
      ]
    },
    {
      title: "La Bataille",
      description: "Les deux factions s'affrontent dans le secteur. Des vaisseaux brûlent. Des stations sont sous blocus. On te demande de choisir un camp pour une mission décisive.",
      choices: [
        {
          label: "Mener la mission (combattre l'ennemi de ta faction)",
          effect: gs => ({
            reputation: gs.reputation + 60,
            factionMissions: gs.factionMissions + 1,
            message: "Mission accomplie. +60 rép. La bataille tourne.",
            advancesArc: true,
          }),
        },
        {
          label: "Trahir et vendre le plan à l'adversaire",
          effect: gs => ({
            credits: gs.credits + 5000,
            reputation: gs.reputation - 40,
            isDoubleAgent: true,
            message: "+5000 cr. -40 rép. Tu es agent double maintenant.",
            advancesArc: true,
          }),
        },
        {
          label: "Proposer une médiation entre les deux factions",
          available: gs => gs.reputation >= 100,
          effect: gs => ({
            reputation: gs.reputation + 100,
            message: "Les deux factions t'écoutent. +100 rép. La guerre ralentit.",
            advancesArc: true,
          }),
        },
      ]
    },
    {
      title: "La Résolution",
      description: "La guerre touche à sa fin. Un accord est possible — ou une victoire totale d'un camp. Tu as le pouvoir de décider.",
      choices: [
        {
          label: "Écraser la faction ennemie (victoire totale)",
          effect: gs => ({
            reputation: gs.reputation + 100,
            credits: gs.credits + 5000,
            message: "Victoire totale. +100 rép, +5000 cr. Un camp domine maintenant.",
            advancesArc: true,
          }),
        },
        {
          label: "Forcer un traité de paix",
          available: gs => gs.reputation >= 150,
          effect: gs => ({
            reputation: gs.reputation + 150,
            isFactionLeader: true,
            message: "Traité signé. +150 rép. Tu es reconnu comme artisan de la paix. Chef de faction.",
            advancesArc: true,
          }),
        },
        {
          label: "Prendre le contrôle d'une faction dans la confusion",
          available: gs => gs.bossesDefeated >= 2,
          effect: gs => ({
            reputation: gs.reputation + 80,
            isFactionLeader: true,
            credits: gs.credits + 8000,
            message: "Tu prends les rênes. +80 rép, +8000 cr. Tu diriges maintenant.",
            advancesArc: true,
          }),
        },
      ]
    },
  ]
}

export const ARC_DEFINITIONS: ArcDefinition[] = [
  ARC_ALANOSSA,
  ARC_RAPHAZARUS,
  ARC_VAEL,
  ARC_FACTIONWAR,
]

export function checkArcTriggers(gs: GameState): NarrativeArc[] {
  const newArcs: NarrativeArc[] = []
  const activeIds = new Set(gs.activeArcs.map(a => a.id))
  const completedIds = new Set(gs.completedArcs)

  for (const def of ARC_DEFINITIONS) {
    if (activeIds.has(def.id) || completedIds.has(def.id)) continue
    if (def.triggerCondition(gs)) {
      newArcs.push({
        id: def.id,
        title: def.title,
        step: 0,
        maxSteps: def.steps.length,
        completed: false,
        failed: false,
      })
    }
  }
  return newArcs
}

export function getCurrentStep(arc: NarrativeArc, gs?: GameState): ArcStep | null {
  const def = ARC_DEFINITIONS.find(d => d.id === arc.id)
  if (!def || arc.step >= def.steps.length) return null
  const step = def.steps[arc.step]
  if (step.condition && gs && !step.condition(gs)) return null
  return step
}

export function getCurrentStepBlocked(arc: NarrativeArc, gs: GameState): string | null {
  const def = ARC_DEFINITIONS.find(d => d.id === arc.id)
  if (!def || arc.step >= def.steps.length) return null
  const step = def.steps[arc.step]
  if (step.condition && !step.condition(gs)) return step.conditionHint ?? 'Prérequis non remplis.'
  return null
}

export function advanceArc(arc: NarrativeArc, gs: GameState): { arc: NarrativeArc; rewardGs?: Partial<GameState>; completed: boolean } {
  const def = ARC_DEFINITIONS.find(d => d.id === arc.id)!
  const nextStep = arc.step + 1

  if (nextStep >= def.steps.length) {
    const reward = def.completionReward(gs)
    return {
      arc: { ...arc, step: nextStep, completed: true },
      rewardGs: reward,
      completed: true,
    }
  }
  return { arc: { ...arc, step: nextStep }, completed: false }
}

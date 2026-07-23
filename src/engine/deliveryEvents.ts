import type { Quest } from '../types'

export type DeliveryOutcome = 'smooth' | 'tense' | 'detour' | 'ambush' | 'negotiation'

export interface DeliveryScene {
  desc: string
  outcome: DeliveryOutcome
}

function buildDeliveryScenes(q: Quest): DeliveryScene[] {
  return [
    {
      desc: `Le contact de ${q.giver} t'attend dans une arrière-salle. Il vérifie la marchandise en silence, puis hoche la tête. Transaction propre.`,
      outcome: 'smooth',
    },
    {
      desc: `Tu trouves le destinataire après vingt minutes à chercher dans les couloirs. Il regarde l'item, puis toi. "T'es en retard." Il paie quand même.`,
      outcome: 'smooth',
    },
    {
      desc: `Le destinataire est là, mais il n'est pas seul. Deux types dans l'ombre. Il te demande si tu es suivi.`,
      outcome: 'tense',
    },
    {
      desc: `Tu arrives à l'adresse indiquée — le local est fermé. Un message épinglé sur la porte dit de te rendre au niveau inférieur.`,
      outcome: 'detour',
    },
    {
      desc: `En chemin pour la livraison, quelqu'un te double dans le couloir et renverse délibérément ta caisse. Les regards se tournent vers toi.`,
      outcome: 'ambush',
    },
    {
      desc: `Le destinataire est là mais refuse d'abord la marchandise. "Les termes ont changé." Il cherche à renégocier à la baisse.`,
      outcome: 'negotiation',
    },
  ]
}

function buildHeistScenes(q: Quest): DeliveryScene[] {
  return [
    {
      desc: `Tu remets l'objet à ${q.giver}. Il ne le regarde même pas — il savait déjà ce que c'était. Le paiement arrive sans un mot.`,
      outcome: 'smooth',
    },
    {
      desc: `Quelqu'un d'autre cherchait cet item. Il est là, dans le couloir, et il t'a vu.`,
      outcome: 'ambush',
    },
    {
      desc: `La remise se passe. ${q.giver} examine l'objet longuement. "C'est le bon." Il paie. Mais tu te demandes depuis combien de temps il attendait exactement ça.`,
      outcome: 'smooth',
    },
  ]
}

export function pickDeliveryScene(quest: Quest): DeliveryScene {
  const scenes = quest.type === 'heist' ? buildHeistScenes(quest) : buildDeliveryScenes(quest)
  return scenes[Math.floor(Math.random() * scenes.length)]
}

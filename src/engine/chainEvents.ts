import type { GameState } from '../types'

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

export type ChainEventType = 'reward' | 'threat' | 'info' | 'consequence' | 'mystery'
export type ChainTrigger = 'boss_killed' | 'stalker_killed' | 'faction_loyal' | 'low_rep' | 'rich' | 'prison_escaped'

export interface ChainEvent {
  id: string
  trigger: ChainTrigger
  title: string
  description: string
  type: ChainEventType
  color: string
  effect?: {
    credits?: number
    reputation?: number
    fuel?: number
    cargo?: Record<string, number>
  }
  triggerDay: number
}

export function createChainEvent(trigger: ChainTrigger, gs: GameState): ChainEvent | null {
  const triggerDay = gs.day + rng(2, 4)
  const id = `${trigger}_${Date.now()}`
  const roll = Math.random()

  switch (trigger) {
    case 'boss_killed': {
      if (roll < 0.45) return {
        id, trigger, triggerDay, type: 'reward', color: 'var(--gold)',
        title: 'Prime de faction',
        description: `Des représentants d'une faction locale t'ont retracé. Le boss que tu as éliminé avait une mise à prix non réclamée. Ils règlent la dette. +${rng(600, 1200)} cr · +5 réputation.`,
        effect: { credits: rng(600, 1200), reputation: 5 },
      }
      if (roll < 0.75) return {
        id, trigger, triggerDay, type: 'threat', color: 'var(--red)',
        title: 'Représailles attendues',
        description: `Les associés du boss ont retrouvé ta trace. Un message laissé au barman local : "Tu as tué quelqu'un qui avait des amis. On se souvient." Quelqu'un te surveille maintenant. -8 réputation.`,
        effect: { reputation: -8 },
      }
      return {
        id, trigger, triggerDay, type: 'mystery', color: 'var(--purple)',
        title: 'Ce que le boss cachait',
        description: `Dans les effets personnels du boss, un datapad crypté. Les données portent ton nom — et une date qui précède de trois semaines ton arrivée dans le secteur. Quelqu'un te suivait avant même l'affrontement.`,
      }
    }

    case 'stalker_killed': {
      if (roll < 0.40) return {
        id, trigger, triggerDay, type: 'reward', color: 'var(--gold)',
        title: 'Le stalker avait des ennemis',
        description: `Un intermédiaire sans visage t'aborde. Bref. Discret. "Il avait beaucoup d'ennemis. Tu nous as rendu service." Une bourse change de mains. +${rng(500, 900)} cr.`,
        effect: { credits: rng(500, 900) },
      }
      if (roll < 0.70) return {
        id, trigger, triggerDay, type: 'mystery', color: 'var(--purple)',
        title: 'Il ne travaillait pas seul',
        description: `Un message anonyme, sans source traçable : "Tu as bien géré le problème. Mais tu dois savoir — il ne travaillait pas seul. Ce qu'il cherchait sur toi, d'autres continuent à chercher. Sois prudent."`,
      }
      return {
        id, trigger, triggerDay, type: 'info', color: 'var(--cyan)',
        title: 'Qui l\'avait envoyé ?',
        description: `Dans les registres de voyage du stalker, une piste. Une transaction financière depuis une station que tu connais. Quelqu'un a payé pour qu'on te retrouve. Tu ne sais pas encore pourquoi.`,
        effect: { reputation: -5 },
      }
    }

    case 'faction_loyal': {
      const faction = gs.faction
      if (faction === 'faucons') return {
        id, trigger, triggerDay, type: 'reward', color: 'var(--red)',
        title: 'Message de Cael — Les Faucons',
        description: `"Les Faucons ne font pas dans les compliments. Mais le travail accompli mérite reconnaissance. Voilà ta part." Un paiement direct, propre. +1 200 cr.`,
        effect: { credits: 1200 },
      }
      if (faction === 'emporium') return {
        id, trigger, triggerDay, type: 'reward', color: 'var(--gold)',
        title: 'Commission de Pistis — L\'Emporium',
        description: `Un virement automatique. Froid, précis, sans commentaire. Puis un message de Pistis : "Efficacité notée. Continuez." +900 cr · +3 réputation.`,
        effect: { credits: 900, reputation: 3 },
      }
      if (faction === 'gardiens') return {
        id, trigger, triggerDay, type: 'reward', color: 'var(--cyan)',
        title: 'Ravitaillement de Myrra — Les Gardiens',
        description: `Un colis livré en ton nom. Médicaments, une unité de carburant, et un mot de Myrra : "Les Gardiens n'oublient pas les leurs. Reste en vie." +2 Médicaments · +1 carburant · +5 rép.`,
        effect: { cargo: { 'Médicaments': 2 }, fuel: 1, reputation: 5 },
      }
      // culte
      return {
        id, trigger, triggerDay, type: 'info', color: 'var(--purple)',
        title: 'Paroles de Neva — Le Culte',
        description: `Un extrait du Livre du Vide, chapitre non publié, envoyé personnellement par Neva. Les mots sont troublants. Tu ne sais pas encore si c'est une récompense ou un avertissement. +8 réputation.`,
        effect: { reputation: 8 },
      }
    }

    case 'low_rep': {
      if (roll < 0.40) return {
        id, trigger, triggerDay, type: 'consequence', color: 'var(--orange)',
        title: 'Taxe informelle',
        description: `L'Emporium a mis ton profil en alerte. Une commission "administrative" est prélevée automatiquement sur tes prochaines transactions. -200 cr.`,
        effect: { credits: -200 },
      }
      if (roll < 0.70) return {
        id, trigger, triggerDay, type: 'threat', color: 'var(--red)',
        title: 'Mandat des Gardiens',
        description: `Ton comportement a été suffisamment documenté pour justifier un mandat préventif. Les Gardiens ont officiellement enregistré ton dossier. Les stations affiliées ne t'accueilleront pas chaleureusement. -12 réputation.`,
        effect: { reputation: -12 },
      }
      return {
        id, trigger, triggerDay, type: 'info', color: 'var(--text-dim)',
        title: 'Réputation qui précède',
        description: `Un informateur a vendu ton profil de comportement sur le réseau noir. Les acheteurs sont multiples. Certains sont curieux. D'autres ont des raisons plus concrètes. -5 réputation.`,
        effect: { reputation: -5 },
      }
    }

    case 'rich': {
      if (roll < 0.45) return {
        id, trigger, triggerDay, type: 'consequence', color: 'var(--orange)',
        title: 'Commission Emporium',
        description: `L'Emporium surveille les flux financiers importants du secteur. Tes actifs ont déclenché une alerte. Une "frais de supervision" est prélevée. C'est légal selon l'Accord de Requiem. -500 cr.`,
        effect: { credits: -500 },
      }
      if (roll < 0.70) return {
        id, trigger, triggerDay, type: 'reward', color: 'var(--gold)',
        title: 'Client fidèle',
        description: `Un commerçant avec qui tu as régulièrement traité t'envoie une commission surprise. "Pour la fidélité. Le secteur manque de gens fiables." +350 cr.`,
        effect: { credits: 350 },
      }
      return {
        id, trigger, triggerDay, type: 'threat', color: 'var(--red)',
        title: 'Profil financier compromis',
        description: `Quelqu'un a mis ton profil financier en circulation sur le réseau noir. Montant estimé, dernières transactions, station actuelle. Des gens s'y intéressent. Des gens avec des projets. Reste vigilant. -5 réputation.`,
        effect: { reputation: -5 },
      }
    }

    case 'prison_escaped': {
      if (roll < 0.45) return {
        id, trigger, triggerDay, type: 'consequence', color: 'var(--red)',
        title: 'Mandat d\'arrestation',
        description: `Les Gardiens ont émis un mandat officiel suite à ton évasion. Distribué aux stations affiliées. Ta réputation dans le secteur prend un coup immédiat. -15 réputation.`,
        effect: { reputation: -15 },
      }
      if (roll < 0.75) return {
        id, trigger, triggerDay, type: 'reward', color: 'var(--cyan)',
        title: 'Souvenir de cellule',
        description: `Ton ancien codétenu t'a envoyé quelque chose. Un message : "Tu m'as appris à tenir. Voilà ce que je peux faire pour toi." Des provisions cachées à l'entrée de la station. +2 Médicaments · +1 carburant.`,
        effect: { cargo: { 'Médicaments': 2 }, fuel: 1 },
      }
      return {
        id, trigger, triggerDay, type: 'mystery', color: 'var(--purple)',
        title: 'Ce que le gardien savait',
        description: `Un gardien de prison te contact de façon anonyme. "J'ai vu ton dossier. Il y a des choses là-dedans que tu ignores sur toi-même. Des connexions que tu n'as pas faites. Si tu veux savoir — retrouve-moi." Pas de station. Pas de nom.`,
      }
    }
  }
}

export function shouldCreateChainEvent(trigger: ChainTrigger, gs: GameState): boolean {
  const existing = (gs.pendingChainEvents ?? [])
  // Pas plus d'un événement du même trigger en attente
  return !existing.some(e => e.trigger === trigger)
}

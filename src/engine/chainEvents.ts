import type { GameState } from '../types'
import i18n from '../i18n/config'

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const ce = (key: string) => i18n.t(key, { ns: 'chainEvents' })

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
      if (roll < 0.45) {
        const amount = rng(600, 1200)
        return {
          id, trigger, triggerDay, type: 'reward', color: 'var(--gold)',
          title: ce('bossKilled.reward.title'),
          description: i18n.t('bossKilled.reward.description', { ns: 'chainEvents', amount }),
          effect: { credits: amount, reputation: 5 },
        }
      }
      if (roll < 0.75) return {
        id, trigger, triggerDay, type: 'threat', color: 'var(--red)',
        title: ce('bossKilled.threat.title'),
        description: ce('bossKilled.threat.description'),
        effect: { reputation: -8 },
      }
      return {
        id, trigger, triggerDay, type: 'mystery', color: 'var(--purple)',
        title: ce('bossKilled.mystery.title'),
        description: ce('bossKilled.mystery.description'),
      }
    }

    case 'stalker_killed': {
      if (roll < 0.40) {
        const amount = rng(500, 900)
        return {
          id, trigger, triggerDay, type: 'reward', color: 'var(--gold)',
          title: ce('stalkerKilled.reward.title'),
          description: i18n.t('stalkerKilled.reward.description', { ns: 'chainEvents', amount }),
          effect: { credits: amount },
        }
      }
      if (roll < 0.70) return {
        id, trigger, triggerDay, type: 'mystery', color: 'var(--purple)',
        title: ce('stalkerKilled.mystery.title'),
        description: ce('stalkerKilled.mystery.description'),
      }
      return {
        id, trigger, triggerDay, type: 'info', color: 'var(--cyan)',
        title: ce('stalkerKilled.info.title'),
        description: ce('stalkerKilled.info.description'),
        effect: { reputation: -5 },
      }
    }

    case 'faction_loyal': {
      const faction = gs.faction
      if (faction === 'faucons') return {
        id, trigger, triggerDay, type: 'reward', color: 'var(--red)',
        title: ce('factionLoyal.faucons.title'),
        description: ce('factionLoyal.faucons.description'),
        effect: { credits: 1200 },
      }
      if (faction === 'emporium') return {
        id, trigger, triggerDay, type: 'reward', color: 'var(--gold)',
        title: ce('factionLoyal.emporium.title'),
        description: ce('factionLoyal.emporium.description'),
        effect: { credits: 900, reputation: 3 },
      }
      if (faction === 'gardiens') return {
        id, trigger, triggerDay, type: 'reward', color: 'var(--cyan)',
        title: ce('factionLoyal.gardiens.title'),
        description: ce('factionLoyal.gardiens.description'),
        effect: { cargo: { 'Médicaments': 2 }, fuel: 1, reputation: 5 },
      }
      // culte
      return {
        id, trigger, triggerDay, type: 'info', color: 'var(--purple)',
        title: ce('factionLoyal.culte.title'),
        description: ce('factionLoyal.culte.description'),
        effect: { reputation: 8 },
      }
    }

    case 'low_rep': {
      if (roll < 0.40) return {
        id, trigger, triggerDay, type: 'consequence', color: 'var(--orange)',
        title: ce('lowRep.consequence.title'),
        description: ce('lowRep.consequence.description'),
        effect: { credits: -200 },
      }
      if (roll < 0.70) return {
        id, trigger, triggerDay, type: 'threat', color: 'var(--red)',
        title: ce('lowRep.threat.title'),
        description: ce('lowRep.threat.description'),
        effect: { reputation: -12 },
      }
      return {
        id, trigger, triggerDay, type: 'info', color: 'var(--text-dim)',
        title: ce('lowRep.info.title'),
        description: ce('lowRep.info.description'),
        effect: { reputation: -5 },
      }
    }

    case 'rich': {
      if (roll < 0.45) return {
        id, trigger, triggerDay, type: 'consequence', color: 'var(--orange)',
        title: ce('rich.consequence.title'),
        description: ce('rich.consequence.description'),
        effect: { credits: -500 },
      }
      if (roll < 0.70) return {
        id, trigger, triggerDay, type: 'reward', color: 'var(--gold)',
        title: ce('rich.reward.title'),
        description: ce('rich.reward.description'),
        effect: { credits: 350 },
      }
      return {
        id, trigger, triggerDay, type: 'threat', color: 'var(--red)',
        title: ce('rich.threat.title'),
        description: ce('rich.threat.description'),
        effect: { reputation: -5 },
      }
    }

    case 'prison_escaped': {
      if (roll < 0.45) return {
        id, trigger, triggerDay, type: 'consequence', color: 'var(--red)',
        title: ce('prisonEscaped.consequence.title'),
        description: ce('prisonEscaped.consequence.description'),
        effect: { reputation: -15 },
      }
      if (roll < 0.75) return {
        id, trigger, triggerDay, type: 'reward', color: 'var(--cyan)',
        title: ce('prisonEscaped.reward.title'),
        description: ce('prisonEscaped.reward.description'),
        effect: { cargo: { 'Médicaments': 2 }, fuel: 1 },
      }
      return {
        id, trigger, triggerDay, type: 'mystery', color: 'var(--purple)',
        title: ce('prisonEscaped.mystery.title'),
        description: ce('prisonEscaped.mystery.description'),
      }
    }
  }
}

export function shouldCreateChainEvent(trigger: ChainTrigger, gs: GameState): boolean {
  const existing = (gs.pendingChainEvents ?? [])
  // Pas plus d'un événement du même trigger en attente
  return !existing.some(e => e.trigger === trigger)
}

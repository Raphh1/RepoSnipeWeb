import type { Quest } from '../types'
import i18n from '../i18n/config'

const de = (key: string, params?: Record<string, unknown>) => i18n.t(key, { ns: 'deliveryEvents', ...params })

export type DeliveryOutcome = 'smooth' | 'tense' | 'detour' | 'ambush' | 'negotiation'

export interface DeliveryScene {
  desc: string
  outcome: DeliveryOutcome
}

function buildDeliveryScenes(q: Quest): DeliveryScene[] {
  return [
    { desc: de('delivery.smooth1', { giver: q.giver }), outcome: 'smooth' },
    { desc: de('delivery.smooth2'), outcome: 'smooth' },
    { desc: de('delivery.tense1'), outcome: 'tense' },
    { desc: de('delivery.detour1'), outcome: 'detour' },
    { desc: de('delivery.ambush1'), outcome: 'ambush' },
    { desc: de('delivery.negotiation1'), outcome: 'negotiation' },
  ]
}

function buildHeistScenes(q: Quest): DeliveryScene[] {
  return [
    { desc: de('heist.smooth1', { giver: q.giver }), outcome: 'smooth' },
    { desc: de('heist.ambush1'), outcome: 'ambush' },
    { desc: de('heist.smooth2', { giver: q.giver }), outcome: 'smooth' },
  ]
}

export function pickDeliveryScene(quest: Quest): DeliveryScene {
  const scenes = quest.type === 'heist' ? buildHeistScenes(quest) : buildDeliveryScenes(quest)
  return scenes[Math.floor(Math.random() * scenes.length)]
}

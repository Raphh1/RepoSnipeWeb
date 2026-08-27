import type { GameState } from '../types'
import i18n from '../i18n/config'

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const ct = (key: string, params?: Record<string, unknown>) => i18n.t(key, { ns: 'consumables', ...params })

export interface ConsumableEffect {
  message: string
  gs: Partial<GameState>
  isRisky?: boolean
}

export function useConsumable(gs: GameState, item: string): ConsumableEffect {
  switch (item) {
    case 'Médicaments':
      return {
        gs: { playerHp: Math.min(gs.playerMaxHp, gs.playerHp + 30) },
        message: ct('medHp', { current: Math.min(gs.playerMaxHp, gs.playerHp + 30), max: gs.playerMaxHp })
      }

    case 'Médicaments premium':
      return {
        gs: { playerHp: gs.playerMaxHp },
        message: ct('medPremium')
      }

    case 'Plantes médicinales':
      return {
        gs: { playerHp: Math.min(gs.playerMaxHp, gs.playerHp + 15), stamina: Math.min(gs.maxStamina, gs.stamina + 30) },
        message: ct('plants')
      }

    case 'Rations':
    case 'Vivres':
    case 'Nourriture synthétique':
    case 'Nourriture fraîche': {
      const hpGain = item === 'Nourriture fraîche' ? 20 : 10
      return {
        gs: { playerHp: Math.min(gs.playerMaxHp, gs.playerHp + hpGain), stamina: Math.min(gs.maxStamina, gs.stamina + 20) },
        message: ct('food', { hp: hpGain })
      }
    }

    case 'Eau purifiée':
      return {
        gs: { stamina: gs.maxStamina },
        message: ct('water')
      }

    case 'Drogues de synthèse': {
      const roll = Math.random()
      if (roll < 0.40) {
        return {
          gs: { stamina: gs.maxStamina, playerHp: Math.min(gs.playerMaxHp, gs.playerHp + 40) },
          message: ct('drugsGood'),
          isRisky: true,
        }
      } else if (roll < 0.70) {
        const dmg = rng(10, 30)
        return {
          gs: { playerHp: Math.max(1, gs.playerHp - dmg) },
          message: ct('drugsBadDose', { amount: dmg }),
          isRisky: true,
        }
      } else if (roll < 0.85) {
        return {
          gs: { credits: Math.max(0, gs.credits - rng(100, 400)) },
          message: ct('drugsHallucinations'),
          isRisky: true,
        }
      } else {
        return {
          gs: { addictionLevel: (gs.addictionLevel ?? 0) + 1 },
          message: ct('drugsNothing'),
          isRisky: true,
        }
      }
    }

    case 'Objets expérimentaux': {
      const roll = Math.random()
      if (roll < 0.25) {
        return {
          gs: { playerMaxHp: gs.playerMaxHp + 15, playerHp: gs.playerHp + 15 },
          message: ct('expPermanentHp'),
          isRisky: true,
        }
      } else if (roll < 0.50) {
        return {
          gs: { maxStamina: gs.maxStamina + 20 },
          message: ct('expPermanentStamina'),
          isRisky: true,
        }
      } else if (roll < 0.75) {
        const dmg = rng(20, 50)
        return {
          gs: { playerHp: Math.max(1, gs.playerHp - dmg) },
          message: ct('expRejection', { amount: dmg }),
          isRisky: true,
        }
      } else {
        return {
          gs: { reputation: gs.reputation + rng(10, 40) },
          message: ct('expTransformation'),
          isRisky: true,
        }
      }
    }

    case 'Artefacts': {
      const cr = rng(500, 2000)
      return {
        gs: { credits: gs.credits + cr, reputation: gs.reputation + 5 },
        message: ct('artifact', { cr })
      }
    }

    case 'Stimulant de combat':
      return {
        gs: { maxStamina: gs.maxStamina + 20, stamina: Math.min(gs.maxStamina + 20, gs.stamina + 20) },
        message: ct('combatStim')
      }

    default:
      return { gs: {}, message: ct('genericUse', { item }) }
  }
}

// Liste des items consommables
export const CONSUMABLE_ITEMS = new Set([
  'Médicaments', 'Médicaments premium', 'Plantes médicinales',
  'Rations', 'Vivres', 'Nourriture synthétique', 'Nourriture fraîche',
  'Eau purifiée', 'Drogues de synthèse', 'Objets expérimentaux',
  'Artefacts', 'Stimulant de combat',
])

export function isConsumable(item: string): boolean {
  return CONSUMABLE_ITEMS.has(item)
}

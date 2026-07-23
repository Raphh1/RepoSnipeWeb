import type { GameState } from '../types'

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

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
        message: `+30 PV. ${Math.min(gs.playerMaxHp, gs.playerHp + 30)}/${gs.playerMaxHp}`
      }

    case 'Médicaments premium':
      return {
        gs: { playerHp: gs.playerMaxHp },
        message: 'PV complètement restaurés.'
      }

    case 'Plantes médicinales':
      return {
        gs: { playerHp: Math.min(gs.playerMaxHp, gs.playerHp + 15), stamina: Math.min(gs.maxStamina, gs.stamina + 30) },
        message: '+15 PV, +30 Stamina. Goût horrible, effet réel.'
      }

    case 'Rations':
    case 'Vivres':
    case 'Nourriture synthétique':
    case 'Nourriture fraîche': {
      const hpGain = item === 'Nourriture fraîche' ? 20 : 10
      return {
        gs: { playerHp: Math.min(gs.playerMaxHp, gs.playerHp + hpGain), stamina: Math.min(gs.maxStamina, gs.stamina + 20) },
        message: `+${hpGain} PV, +20 Stamina.`
      }
    }

    case 'Eau purifiée':
      return {
        gs: { stamina: gs.maxStamina },
        message: 'Stamina complètement restaurée.'
      }

    case 'Drogues de synthèse': {
      const roll = Math.random()
      if (roll < 0.40) {
        return {
          gs: { stamina: gs.maxStamina, playerHp: Math.min(gs.playerMaxHp, gs.playerHp + 40) },
          message: 'Effet puissant. +40 PV, stamina max. Ça dure pas.',
          isRisky: true,
        }
      } else if (roll < 0.70) {
        const dmg = rng(10, 30)
        return {
          gs: { playerHp: Math.max(1, gs.playerHp - dmg) },
          message: `Mauvaise dose. -${dmg} PV. Tu te remets lentement.`,
          isRisky: true,
        }
      } else if (roll < 0.85) {
        return {
          gs: { credits: Math.max(0, gs.credits - rng(100, 400)) },
          message: 'Hallucinations. Tu te réveilles avec moins de crédits.',
          isRisky: true,
        }
      } else {
        return {
          gs: { addictionLevel: (gs.addictionLevel ?? 0) + 1 },
          message: 'Rien. Ou peut-être quelque chose. Difficile à dire.',
          isRisky: true,
        }
      }
    }

    case 'Objets expérimentaux': {
      const roll = Math.random()
      if (roll < 0.25) {
        return {
          gs: { playerMaxHp: gs.playerMaxHp + 15, playerHp: gs.playerHp + 15 },
          message: 'Implant réussi. +15 PV max permanent.',
          isRisky: true,
        }
      } else if (roll < 0.50) {
        return {
          gs: { maxStamina: gs.maxStamina + 20 },
          message: 'Stimulant permanent. +20 Stamina max.',
          isRisky: true,
        }
      } else if (roll < 0.75) {
        const dmg = rng(20, 50)
        return {
          gs: { playerHp: Math.max(1, gs.playerHp - dmg) },
          message: `Rejet. -${dmg} PV. Ton corps n'a pas aimé.`,
          isRisky: true,
        }
      } else {
        return {
          gs: { reputation: gs.reputation + rng(10, 40) },
          message: 'Étrange transformation. Ta présence inspire quelque chose. +rép.',
          isRisky: true,
        }
      }
    }

    case 'Artefacts': {
      const cr = rng(500, 2000)
      return {
        gs: { credits: gs.credits + cr, reputation: gs.reputation + 5 },
        message: `L'artefact révèle sa valeur. +${cr} cr, +5 rép.`
      }
    }

    case 'Stimulant de combat':
      return {
        gs: { maxStamina: gs.maxStamina + 20, stamina: Math.min(gs.maxStamina + 20, gs.stamina + 20) },
        message: '+20 Stamina max (temporaire).'
      }

    default:
      return { gs: {}, message: `${item} utilisé. Aucun effet notable.` }
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

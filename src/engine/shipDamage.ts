import type { GameState } from '../types'
import i18n from '../i18n/config'

// Le vaisseau ne doit plus pouvoir rester bloqué indéfiniment à 1 PV sans
// aucune conséquence. À 0 PV, il est remorqué de force — un vrai coût
// (crédits, réputation), mais jamais un blocage définitif de la partie
// (même logique que le scavenge à carburant 0, cf. Sprint 1.1).
export function resolveShipDown(gs: GameState): Partial<GameState> & { towMessage: string } {
  const towFee = Math.min(gs.credits, 300 + gs.day * 15)
  return {
    shipHp: Math.max(1, Math.floor(gs.shipMaxHp * 0.15)),
    credits: gs.credits - towFee,
    reputation: gs.reputation - 8,
    towMessage: i18n.t('shipTowed', { ns: 'gameStore', fee: towFee.toLocaleString() }),
  }
}

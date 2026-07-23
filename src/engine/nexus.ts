import type { GameState } from '../types'

export interface NexusFragment {
  station: string
  name: string
  hint: string
  acquired: boolean
}

export const NEXUS_FRAGMENTS: NexusFragment[] = [
  {
    station: 'Arc Ouest Apocalypse',
    name: 'Fragment d\'Alanossa',
    hint: "Alanossa le garde. Tu peux le prendre — par la force, par l'or, ou par la ruse.",
    acquired: false,
  },
  {
    station: 'Nexus Aldara',
    name: 'Fragment de Ramaster',
    hint: "Le technologue Ramaster possède la clé. Il exige de la réputation ou un accord commercial exclusif.",
    acquired: false,
  },
  {
    station: 'Les Abysses de Velkor',
    name: 'Fragment de Raphazarus',
    hint: "Le prophète Raphazarus le garde dans les ruines. Un combat ou une arme légendaire peut le convaincre.",
    acquired: false,
  },
  {
    station: 'Nexus Aldara',
    name: 'Fragment d\'Aldara',
    hint: "Caché dans Nexus Aldara. Nécessite d'avoir rallié les autres fragments d'abord.",
    acquired: false,
  },
]

export type NexusAction = 'force' | 'pay' | 'reputation' | 'legendary'

export interface NexusResult {
  success: boolean
  message: string
  newGs?: Partial<GameState>
  triggerCombat?: boolean
}

export function attemptNexusFragment(
  gs: GameState,
  fragmentIdx: number,
  action: NexusAction
): NexusResult {
  const fragment = NEXUS_FRAGMENTS[fragmentIdx]

  // Fragment 3 nécessite les 2 premiers
  if (fragmentIdx === 3 && gs.stationPiecesRallied < 2) {
    return { success: false, message: "Ce fragment ne se révèle qu'une fois deux autres rassemblés." }
  }

  switch (fragmentIdx) {
    case 0: // Alanossa
      if (action === 'force') return { success: true, message: "Tu affrontes le garde. Combat.", triggerCombat: true }
      if (action === 'pay' && gs.credits >= 8000) {
        return { success: true, message: "-8 000 cr. Alanossa t'a vendu ce qu'il considérait ne valoir rien.",
          newGs: { credits: gs.credits - 8000 } }
      }
      if (action === 'reputation' && gs.reputation >= 50) {
        return { success: true, message: "+30 rép. Ta réputation parle à la place de ton arme.",
          newGs: { reputation: gs.reputation + 30 } }
      }
      return { success: false, message: "Tu n'as pas les moyens ou la réputation nécessaire." }

    case 1: // Ramaster / Nexus Aldara
      if (action === 'reputation' && gs.reputation >= 100) {
        return { success: true, message: "Ta légende précède l'accord. Ramaster t'accorde sa confiance.",
          newGs: { reputation: gs.reputation + 20 } }
      }
      if (action === 'pay' && gs.credits >= 5000) {
        return { success: true, message: "-5 000 cr. Transaction commerciale. Ramaster est satisfait.",
          newGs: { credits: gs.credits - 5000 } }
      }
      return { success: false, message: "Réputation ≥ 100 ou 5 000 cr requis." }

    case 2: // Raphazarus
      if (action === 'force') return { success: true, message: "Raphazarus accepte le défi. Combat.", triggerCombat: true }
      if (action === 'legendary' && gs.weapons.some(w => w.tier >= 5)) {
        return { success: true, message: "Tu lui offres une arme légendaire. Il acquiesce. Une transaction spirituelle.",
          newGs: { weapons: gs.weapons.filter(w => w.tier < 5) } }
      }
      return { success: false, message: "Combat ou arme Tier 5 requis." }

    case 3: // Aldara
      if (gs.stationPiecesRallied >= 2) {
        return { success: true, message: "Le fragment se révèle à celui qui a prouvé sa valeur. Il est à toi.",
          newGs: { reputation: gs.reputation + 50 } }
      }
      return { success: false, message: "Il te faut d'abord rallier 2 autres fragments." }

    default:
      return { success: false, message: "Fragment inconnu." }
  }
}

export function isFragmentAvailable(gs: GameState, fragmentIdx: number): boolean {
  const f = NEXUS_FRAGMENTS[fragmentIdx]
  return gs.currentStation === f.station && !gs.nexusFragments?.includes(fragmentIdx)
}

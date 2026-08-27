import type { GameState } from '../types'
import i18n from '../i18n/config'

// ── SEEDING EARLY PILIERS (5.2) ───────────────────────────────────────────────
// Rumeurs entendues à l'arrivée, jours 3-8, mentionnant les détenteurs de
// fragments par leur nom. Prépare le joueur au système Nexus sans rien forcer.

interface PillarRumor {
  id: string
  pillar: string
  text: string
}

function getPillarRumors(): PillarRumor[] {
  const t = (key: string) => i18n.t(key, { ns: 'pillarRumors' })
  return [
    { id: 'rum-cesarion-1', pillar: 'cesarion', text: t('rumCesarion1') },
    { id: 'rum-raphazarus-1', pillar: 'raphazarus', text: t('rumRaphazarus1') },
    { id: 'rum-eliotis-1', pillar: 'eliotis', text: t('rumEliotis1') },
    { id: 'rum-maxance-1', pillar: 'maxance', text: t('rumMaxance1') },
    { id: 'rum-alanossa-1', pillar: 'alanossa', text: t('rumAlanossa1') },
    { id: 'rum-scotty-1', pillar: 'scotty', text: t('rumScotty1') },
    { id: 'rum-cesarion-2', pillar: 'cesarion', text: t('rumCesarion2') },
    { id: 'rum-alanossa-2', pillar: 'alanossa', text: t('rumAlanossa2') },
  ]
}

// Renvoie une rumeur non encore entendue, uniquement jours 3-8, ~50% de chance.
export function rollPillarRumor(gs: GameState): { text: string; rumorId: string } | null {
  if (gs.day < 3 || gs.day > 8) return null
  if (Math.random() > 0.5) return null
  const seen = new Set(gs.pillarRumorsSeen ?? [])
  const available = getPillarRumors().filter(r => !seen.has(r.id))
  if (available.length === 0) return null
  const chosen = available[Math.floor(Math.random() * available.length)]
  return { text: `👁 ${chosen.text}`, rumorId: chosen.id }
}

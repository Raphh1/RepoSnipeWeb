import type { GameState } from '../types'
import { shiftPillar } from './memoryEvents'
import { arePillarSubBossesCleared } from '../data/subBosses'
import { getHolderBountyHunters } from './nexus'
import i18n from '../i18n/config'

const bh = (key: string, params?: Record<string, unknown>) => i18n.t(key, { ns: 'bossHomeVisits', ...params })

// ── VISITE PRIVÉE — le vol par la réputation ─────────────────────────────────
// Le vol n'est plus une tentative instantanée déclenchable à volonté : il faut
// avoir gagné assez de confiance auprès d'un détenteur pour qu'il t'invite chez
// lui. S'il te fait alors assez confiance, il te montre où se trouve le
// fragment — et tu repars avec. Chaque détenteur réagit différemment, en
// cohérence avec sa personnalité.

export interface BossHomeVisitDef {
  pillar: keyof GameState['pillarStanding']
  idx: number
  station: string
  // Réputation nécessaire pour être invité du tout.
  inviteThreshold: number
  // Réputation nécessaire pour que la confiance suffise à révéler le fragment.
  trustThreshold: number
  bossName: string
  inviteLine: string
  tourLine: string
  notYetLine: (gs: GameState) => string
  revealLine: string
}

function getBossHomeVisits(): BossHomeVisitDef[] {
  return [
  {
    pillar: 'alanossa',
    idx: 0,
    station: 'Arc Ouest Apocalypse',
    inviteThreshold: 25,
    trustThreshold: 45,
    bossName: 'Alanossa',
    inviteLine: bh('alanossa.inviteLine'),
    tourLine: bh('alanossa.tourLine'),
    notYetLine: gs => bh('alanossa.notYetLine', { standing: ((gs.pillarStanding ?? {}) as Record<string, number>).alanossa ?? 0, threshold: 45 }),
    revealLine: bh('alanossa.revealLine'),
  },
  {
    pillar: 'cesarion',
    idx: 1,
    station: 'Emporium Requiem',
    inviteThreshold: 35,
    trustThreshold: 60,
    bossName: 'Cesarion',
    inviteLine: bh('cesarion.inviteLine'),
    tourLine: bh('cesarion.tourLine'),
    notYetLine: gs => bh('cesarion.notYetLine', { standing: ((gs.pillarStanding ?? {}) as Record<string, number>).cesarion ?? 0, threshold: 60 }),
    revealLine: bh('cesarion.revealLine'),
  },
  {
    pillar: 'raphazarus',
    idx: 2,
    station: "L'Arc Perdu",
    inviteThreshold: 30,
    trustThreshold: 55,
    bossName: 'Raphazarus',
    inviteLine: bh('raphazarus.inviteLine'),
    tourLine: bh('raphazarus.tourLine'),
    notYetLine: gs => bh('raphazarus.notYetLine', { standing: ((gs.pillarStanding ?? {}) as Record<string, number>).raphazarus ?? 0, threshold: 55 }),
    revealLine: bh('raphazarus.revealLine'),
  },
  {
    pillar: 'scotty',
    idx: 3,
    station: 'Scotty Golden North',
    inviteThreshold: 20,
    trustThreshold: 40,
    bossName: 'Samy Scotty',
    inviteLine: bh('scotty.inviteLine'),
    tourLine: bh('scotty.tourLine'),
    notYetLine: gs => bh('scotty.notYetLine', { standing: ((gs.pillarStanding ?? {}) as Record<string, number>).scotty ?? 0, threshold: 40 }),
    revealLine: bh('scotty.revealLine'),
  },
  ]
}

export function getBossHomeVisit(pillar: string): BossHomeVisitDef | undefined {
  return getBossHomeVisits().find(v => v.pillar === pillar)
}

// Vérifie si une visite privée doit se déclencher à l'arrivée sur la station.
export function checkBossHomeVisit(gs: GameState): BossHomeVisitDef | null {
  const collected = gs.nexusFragments ?? []
  const angered = gs.nexusAngered ?? []

  for (const def of getBossHomeVisits()) {
    if (gs.currentStation !== def.station) continue
    if (collected.includes(def.idx)) continue
    if (angered.includes(def.pillar)) continue
    const defeated = gs.subBossesDefeated ?? {}
    if (!arePillarSubBossesCleared(defeated, def.pillar)) continue
    const standing = ((gs.pillarStanding ?? {}) as Record<string, number>)[def.pillar] ?? 0
    if (standing < def.inviteThreshold) continue
    return def
  }
  return null
}

export interface BossHomeVisitResult {
  revealed: boolean
  message: string
  patch: Partial<GameState>
}

// Résout la visite : révèle le fragment si la confiance est suffisante.
export function resolveBossHomeVisit(gs: GameState, def: BossHomeVisitDef): BossHomeVisitResult {
  const standing = ((gs.pillarStanding ?? {}) as Record<string, number>)[def.pillar] ?? 0
  const trusted = standing >= def.trustThreshold

  if (!trusted) {
    return {
      revealed: false,
      message: def.notYetLine(gs),
      patch: { pillarStanding: shiftPillar(gs, def.pillar, +2) },
    }
  }

  // Voler dans le dos d'un détenteur, c'est une trahison — il ne le prend pas
  // bien. Colère permanente, standing durement sanctionné, et un chasseur de
  // primes se lance immédiatement à tes trousses, partout, sans relâche,
  // jusqu'à ce qu'il te rattrape (et récupère le fragment) ou que tu le battes.
  const hunter = getHolderBountyHunters()[def.pillar]
  const angered = [...(gs.nexusAngered ?? []).filter(p => p !== def.pillar), def.pillar]

  return {
    revealed: true,
    message: def.revealLine + bh('revealSuffix', { bossName: def.bossName, hunterName: hunter?.name ?? bh('unknownHunter') }),
    patch: {
      pillarStanding: shiftPillar(gs, def.pillar, -70),
      nexusAngered: angered,
      ...(hunter ? {
        stalker: {
          name: hunter.name,
          station: gs.currentStation,
          closingIn: true,
          daysSinceLastSeen: gs.day,
          threatLevel: hunter.threatLevel,
          daysActive: 0,
          avengingPillar: def.pillar,
        },
      } : {}),
    },
  }
}

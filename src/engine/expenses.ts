import type { GameState } from '../types'
import { getStation } from '../data/stations'
import i18n from '../i18n/config'

const st = (key: string, params?: Record<string, unknown>) => i18n.t(key, { ns: 'stationHub', ...params })

export function getDailyExpenses(gs: GameState): number {
  let cost = 0

  // Base maintenance — scales with day progression
  const baseMaint = gs.day <= 5 ? 20 : gs.day <= 15 ? 50 : gs.day <= 30 ? 80 : 120
  cost += baseMaint

  // Ship upkeep — more modules = higher cost
  const moduleCost = Object.values(gs.shipModules ?? {}).reduce((sum, lvl) => sum + (lvl ?? 0) * 15, 0)
  cost += moduleCost

  // Station danger surcharge
  const station = getStation(gs.currentStation)
  if (station) {
    const dangerCost = [0, 30, 60, 100][station.danger] ?? 0
    cost += dangerCost
  }

  // Crew / faction dues
  if (gs.faction && gs.faction !== 'none') cost += 25

  // Addiction upkeep
  if ((gs.addictionLevel ?? 0) > 0) cost += (gs.addictionLevel ?? 0) * 40

  return cost
}

export function getDailyExpenseBreakdown(gs: GameState): { label: string; amount: number }[] {
  const lines: { label: string; amount: number }[] = []

  const baseMaint = gs.day <= 5 ? 20 : gs.day <= 15 ? 50 : gs.day <= 30 ? 80 : 120
  lines.push({ label: st('expenses.baseMaintenance'), amount: baseMaint })

  const moduleCost = Object.values(gs.shipModules ?? {}).reduce((sum, lvl) => sum + (lvl ?? 0) * 15, 0)
  if (moduleCost > 0) lines.push({ label: st('expenses.shipModules'), amount: moduleCost })

  const station = getStation(gs.currentStation)
  if (station) {
    const dangerCost = [0, 30, 60, 100][station.danger] ?? 0
    const zoneKeys = ['', 'expenses.zoneRisky', 'expenses.zoneDangerous', 'expenses.zoneWar']
    if (dangerCost > 0) lines.push({ label: st('expenses.zoneSurcharge', { zone: st(zoneKeys[station.danger]) }), amount: dangerCost })
  }

  if (gs.faction && gs.faction !== 'none') lines.push({ label: st('expenses.factionDues'), amount: 25 })

  if ((gs.addictionLevel ?? 0) > 0) lines.push({ label: st('expenses.addiction'), amount: (gs.addictionLevel ?? 0) * 40 })

  return lines
}

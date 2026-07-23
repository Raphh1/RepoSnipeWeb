import type { GameState } from '../types'
import { interpretOutcome } from './outcomeInterpreter'
import type { WanderEvent, ExploreChoice, ExploreResult } from './exploration'

import wanderRaw    from '../Content/wander.json'
import explorationRaw from '../Content/exploration.json'
import ambianceRaw  from '../Content/ambiance.json'

// ── Types JSON ───────────────────────────────────────────────────────────────

interface JsonChoice { label: string; flavor: string; outcome: string }
interface JsonEvent  { setup: string; choices: JsonChoice[] }

const wander     = wanderRaw     as Record<string, JsonEvent[]>
const exploration = explorationRaw as Record<string, JsonEvent[]>
const ambiance    = ambianceRaw   as Record<string, string[]>

// ── Ambiance ─────────────────────────────────────────────────────────────────

export function getAmbiance(stationName: string): string | null {
  const lines = ambiance[stationName]
  if (!lines || lines.length === 0) return null
  return lines[Math.floor(Math.random() * lines.length)]
}

// ── Convertisseur ─────────────────────────────────────────────────────────────

function titleFromSetup(setup: string): string {
  const first = setup.split(/[.!?]/)[0].trim()
  return first.length > 55 ? first.slice(0, 55) + '…' : first
}

function convertJsonChoices(choices: JsonChoice[]): WanderEvent['choices'] {
  return choices.map(c => ({
    label: c.label,
    result: (gs?: GameState) => {
      if (!gs) return { gs: {}, message: c.flavor }
      const r = interpretOutcome(c.outcome, gs)
      const suffix = r.message ? ` [${r.message}]` : ''
      return { gs: r.gs, message: c.flavor + suffix, type: r.type }
    },
  }))
}

function convertToWander(events: JsonEvent[]): Array<(gs: GameState) => WanderEvent> {
  return events.map(ev => (_gs: GameState) => ({
    title:       titleFromSetup(ev.setup),
    description: ev.setup,
    choices:     convertJsonChoices(ev.choices),
  }))
}

// ── Wander pools par danger ────────────────────────────────────────────────────
// danger 0 → low + generic
// danger 1 → low + mid + generic
// danger 2 → mid + high + generic
// danger 3 → high + generic

export const JSON_WANDER_LOW:     Array<(gs: GameState) => WanderEvent> = convertToWander([...(wander.low ?? []),  ...(wander.generic ?? [])])
export const JSON_WANDER_MID:     Array<(gs: GameState) => WanderEvent> = convertToWander([...(wander.low ?? []),  ...(wander.mid ?? []), ...(wander.generic ?? [])])
export const JSON_WANDER_HIGH:    Array<(gs: GameState) => WanderEvent> = convertToWander([...(wander.mid ?? []),  ...(wander.high ?? []), ...(wander.generic ?? [])])
export const JSON_WANDER_EXTREME: Array<(gs: GameState) => WanderEvent> = convertToWander([...(wander.high ?? []), ...(wander.generic ?? [])])

// ── Exploration events → ExploreResult type 'event' ──────────────────────────

function convertToExploreChoices(jsonChoices: JsonChoice[]): ExploreChoice[] {
  return jsonChoices.map(c => ({
    label: c.label,
    result: (gs: GameState) => {
      const r = interpretOutcome(c.outcome, gs)
      const suffix = r.message ? ` [${r.message}]` : ''
      return { gs: r.gs, message: c.flavor + suffix, type: r.type as 'combat' | undefined }
    },
  }))
}

function convertToExploreScene(events: JsonEvent[]): Array<() => ExploreResult> {
  return events.map(ev => (): ExploreResult => ({
    type:        'event',
    description: ev.setup,
    choices:     convertToExploreChoices(ev.choices),
  }))
}

// Pools par type de station — utilisables dans les SCENES_* de exploration.ts
export const JSON_EXPLORE_DANGEROUS:  Array<() => ExploreResult> = convertToExploreScene(exploration.dangerous  ?? [])
export const JSON_EXPLORE_PEACEFUL:   Array<() => ExploreResult> = convertToExploreScene(exploration.peaceful   ?? [])
export const JSON_EXPLORE_INDUSTRIAL: Array<() => ExploreResult> = convertToExploreScene(exploration.industrial ?? [])
export const JSON_EXPLORE_SCIENTIFIC: Array<() => ExploreResult> = convertToExploreScene(exploration.scientific ?? [])
export const JSON_EXPLORE_RUINS:      Array<() => ExploreResult> = convertToExploreScene(exploration.ruins      ?? [])
export const JSON_EXPLORE_MILITARY:   Array<() => ExploreResult> = convertToExploreScene(exploration.military   ?? [])
export const JSON_EXPLORE_LUXURY:     Array<() => ExploreResult> = convertToExploreScene(exploration.luxury     ?? [])
export const JSON_EXPLORE_GENERIC:    Array<() => ExploreResult> = convertToExploreScene(exploration.generic    ?? [])

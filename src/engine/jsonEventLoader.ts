import type { GameState } from '../types'
import { interpretOutcome } from './outcomeInterpreter'
import type { WanderEvent, ExploreChoice, ExploreResult } from './exploration'

import wanderFrRaw   from '../Content/wander.fr.json'
import wanderEnRaw   from '../Content/wander.en.json'
import explorationFrRaw from '../Content/exploration.fr.json'
import explorationEnRaw from '../Content/exploration.en.json'
import ambianceFrRaw from '../Content/ambiance.fr.json'
import ambianceEnRaw from '../Content/ambiance.en.json'
import i18n from '../i18n/config'

// ── Types JSON ───────────────────────────────────────────────────────────────

interface JsonChoice { label: string; flavor: string; outcome: string }
interface JsonEvent  { setup: string; choices: JsonChoice[] }

const wanderFr    = wanderFrRaw    as Record<string, JsonEvent[]>
const wanderEn     = wanderEnRaw    as Record<string, JsonEvent[]>
const explorationFr = explorationFrRaw as Record<string, JsonEvent[]>
const explorationEn = explorationEnRaw as Record<string, JsonEvent[]>
const ambianceFr  = ambianceFrRaw as Record<string, string[]>
const ambianceEn  = ambianceEnRaw as Record<string, string[]>

function getWander(): Record<string, JsonEvent[]> {
  return i18n.language === 'en' ? wanderEn : wanderFr
}

function getExploration(): Record<string, JsonEvent[]> {
  return i18n.language === 'en' ? explorationEn : explorationFr
}

// ── Ambiance ─────────────────────────────────────────────────────────────────

export function getAmbiance(stationName: string): string | null {
  const ambiance = i18n.language === 'en' ? ambianceEn : ambianceFr
  const lines = ambiance[stationName] ?? ambianceFr[stationName]
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

export function getJsonWanderLow(): Array<(gs: GameState) => WanderEvent> {
  const wander = getWander()
  return convertToWander([...(wander.low ?? []), ...(wander.generic ?? [])])
}
export function getJsonWanderMid(): Array<(gs: GameState) => WanderEvent> {
  const wander = getWander()
  return convertToWander([...(wander.low ?? []), ...(wander.mid ?? []), ...(wander.generic ?? [])])
}
export function getJsonWanderHigh(): Array<(gs: GameState) => WanderEvent> {
  const wander = getWander()
  return convertToWander([...(wander.mid ?? []), ...(wander.high ?? []), ...(wander.generic ?? [])])
}
export function getJsonWanderExtreme(): Array<(gs: GameState) => WanderEvent> {
  const wander = getWander()
  return convertToWander([...(wander.high ?? []), ...(wander.generic ?? [])])
}

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
export function getJsonExploreDangerous():  Array<() => ExploreResult> { return convertToExploreScene(getExploration().dangerous  ?? []) }
export function getJsonExplorePeaceful():   Array<() => ExploreResult> { return convertToExploreScene(getExploration().peaceful   ?? []) }
export function getJsonExploreIndustrial(): Array<() => ExploreResult> { return convertToExploreScene(getExploration().industrial ?? []) }
export function getJsonExploreScientific(): Array<() => ExploreResult> { return convertToExploreScene(getExploration().scientific ?? []) }
export function getJsonExploreRuins():      Array<() => ExploreResult> { return convertToExploreScene(getExploration().ruins      ?? []) }
export function getJsonExploreMilitary():   Array<() => ExploreResult> { return convertToExploreScene(getExploration().military   ?? []) }
export function getJsonExploreLuxury():     Array<() => ExploreResult> { return convertToExploreScene(getExploration().luxury     ?? []) }
export function getJsonExploreGeneric():    Array<() => ExploreResult> { return convertToExploreScene(getExploration().generic    ?? []) }

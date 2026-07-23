import type { GameState, JournalEntry } from '../types'

let _idCounter = 0

export function addJournal(
  gs: GameState,
  text: string,
  category: JournalEntry['category'] = 'event'
): JournalEntry[] {
  const entry: JournalEntry = {
    id: ++_idCounter + Date.now(),
    day: gs.day,
    station: gs.currentStation,
    text,
    category,
  }
  return [...(gs.journal ?? []), entry]
}

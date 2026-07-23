import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MetaProgress, RunSummary } from '../types/meta'

const INITIAL: MetaProgress = {
  totalPointsEarned: 0,
  totalPointsSpent: 0,
  unlockedIds: [],
  runHistory: [],
}

interface MetaStore {
  meta: MetaProgress
  addRunSummary: (summary: RunSummary) => void
  unlockMeta: (id: string, cost: number) => void
  availablePoints: () => number
}

export const useMetaStore = create<MetaStore>()(persist(
  (set, get) => ({
    meta: INITIAL,

    addRunSummary: (summary) => set(s => ({
      meta: {
        ...s.meta,
        totalPointsEarned: s.meta.totalPointsEarned + summary.pointsEarned,
        runHistory: [summary, ...s.meta.runHistory].slice(0, 10),
      }
    })),

    unlockMeta: (id, cost) => set(s => ({
      meta: {
        ...s.meta,
        unlockedIds: s.meta.unlockedIds.includes(id)
          ? s.meta.unlockedIds
          : [...s.meta.unlockedIds, id],
        totalPointsSpent: s.meta.totalPointsSpent + cost,
      }
    })),

    availablePoints: () => {
      const { meta } = get()
      return meta.totalPointsEarned - meta.totalPointsSpent
    },
  }),
  { name: 'snipe-meta' }
))

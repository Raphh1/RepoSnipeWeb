import { useState, useEffect } from 'react'
import { TypewriterText } from '../../ui/TypewriterText'
import type { GameState, Quest, Enemy } from '../../../types'
import type { WanderEvent } from '../../../engine/exploration'
import { rollWanderEvent } from '../../../engine/exploration'
import { getEnemyByTier } from '../../../data/enemies'

interface Props {
  gs: GameState
  wanderEvent: WanderEvent
  dangerLevel: number
  onReturn: () => void
  startCombat: (e: Enemy) => void
  patch: (p: Partial<GameState>) => void
  addQuest: (q: Quest) => void
  spendAction: () => void
  onWanderAgain: (next: WanderEvent) => void
  onNegotiation?: () => void
  onNavigation?: () => void
}

export function WanderResultPanel({ gs, wanderEvent, dangerLevel, onReturn, startCombat, patch, addQuest, spendAction, onWanderAgain, onNegotiation, onNavigation }: Props) {
  const [resultMsg, setResultMsg] = useState<string | null>(null)

  useEffect(() => { setResultMsg(null) }, [wanderEvent])

  function computeDeltas(update: Partial<GameState>): string {
    const parts: string[] = []
    if (update.credits !== undefined) {
      const d = update.credits - gs.credits
      if (d !== 0) parts.push(`${d > 0 ? '+' : ''}${d} cr`)
    }
    if (update.reputation !== undefined) {
      const d = update.reputation - gs.reputation
      if (d !== 0) parts.push(`${d > 0 ? '+' : ''}${d} rép`)
    }
    if (update.playerHp !== undefined) {
      const d = update.playerHp - gs.playerHp
      if (d !== 0) parts.push(`${d > 0 ? '+' : ''}${d} PV`)
    }
    if (update.fuel !== undefined) {
      const d = update.fuel - gs.fuel
      if (d !== 0) parts.push(`${d > 0 ? '+' : ''}${d} carburant`)
    }
    return parts.length > 0 ? ` · [${parts.join(', ')}]` : ''
  }

  function handleChoice(c: WanderEvent['choices'][number]) {
    const res = c.result(gs)
    if (res.type === 'combat') {
      const tier = dangerLevel >= 3 ? 3 : dangerLevel >= 2 ? 2 : 1
      startCombat(getEnemyByTier(tier as 1 | 2 | 3))
      return
    }
    if (res.type === 'negotiation') {
      onNegotiation?.()
      return
    }
    if (res.type === 'navigation') {
      onNavigation?.()
      return
    }
    const update = res.gs as Partial<GameState> | undefined
    if (update) patch(update)
    if (res.quest && gs.activeQuests.length < 5) addQuest(res.quest)
    const deltas = update ? computeDeltas(update) : ''
    setResultMsg(res.message + deltas + (res.quest ? `\n[QUÊTE AJOUTÉE : ${res.quest.title}]` : ''))
  }

  function handleWanderAgain() {
    spendAction()
    onWanderAgain(rollWanderEvent(gs))
    setResultMsg(null)
  }

  return (
    <div className="layout">
      <div className="t-xs t-dim t-center">— EN STATION —</div>
      <div className="px-box">
        <div className="t-sm t-gold mb4">{wanderEvent.title}</div>
        <div className="t-xs mb8" style={{ lineHeight: '2.2' }}>
          <TypewriterText text={wanderEvent.description} speed={16} />
        </div>
        {resultMsg
          ? <div className="t-xs mt4" style={{ color: 'var(--green)', lineHeight: '2' }}>{resultMsg}</div>
          : <div className="col gap4">
              {wanderEvent.choices
                .filter(c => !c.available || c.available(gs))
                .map((c, i) => (
                  <button key={i} className="px-btn" onClick={() => handleChoice(c)}>{c.label}</button>
                ))}
            </div>
        }
      </div>
      <div className="row gap4">
        {resultMsg && (
          <button className="px-btn px-btn--primary" style={{ flex: 1 }} onClick={handleWanderAgain}>
            Traîner encore
          </button>
        )}
        <button className="px-btn" style={{ flex: 1 }} onClick={onReturn}>
          ← Retour au hub
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { TypewriterText } from '../../ui/TypewriterText'
import type { GameState, Enemy } from '../../../types'
import type { StationEvent } from '../../../engine/stationEvents'
import { TIER_MID, getArenaEnemyForRound } from '../../../data/enemies'

interface Props {
  gs: GameState
  stationEvent: StationEvent
  stationName: string
  onReturn: () => void
  startCombat: (e: Enemy) => void
  patch: (p: Partial<GameState>) => void
}

export function StationEventPanel({ gs, stationEvent, stationName, onReturn, startCombat, patch }: Props) {
  const [resultMsg, setResultMsg] = useState<string | null>(null)

  function handleChoice(c: StationEvent['choices'][number]) {
    if (c.label === 'Participer (combat)') {
      startCombat(TIER_MID[Math.floor(Math.random() * TIER_MID.length)])
      return
    }
    const res = c.result(gs)
    if (res.message === 'TOURNAMENT_START') {
      patch({ tournamentRound: 1 })
      startCombat(getArenaEnemyForRound(1))
      return
    }
    if (res.message === 'TOURNAMENT_CONTINUE') {
      const round = Math.max(1, gs.tournamentRound)
      startCombat(getArenaEnemyForRound(round))
      return
    }
    if (Object.keys(res.gs).length > 0) patch(res.gs as Partial<GameState>)
    if (res.message) setResultMsg(res.message)
    else onReturn()
  }

  return (
    <div className="layout">
      <div className="t-xs t-dim t-center">— {stationName.toUpperCase()} —</div>
      <div className="px-box px-box--hi">
        <div className="t-sm t-bright mb8">
          <TypewriterText text={stationEvent.description} speed={16} />
        </div>
        {resultMsg
          ? <div className={`t-sm ${resultMsg.includes('-') ? 't-red' : 't-green'}`}>{resultMsg}</div>
          : <div className="col gap4">
              {stationEvent.choices
                .filter(c => !c.available || c.available(gs))
                .map((c, i) => (
                  <button key={i} className="px-btn" onClick={() => handleChoice(c)}>{c.label}</button>
                ))}
            </div>
        }
      </div>
      <button className="px-btn" onClick={onReturn}>← Retour</button>
    </div>
  )
}

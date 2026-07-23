import type { GameState, Quest } from '../../../types'
import { getGossip } from '../../../engine/quests'

interface Props {
  gs: GameState
  questOffer: Quest | null
  addQuest: (q: Quest) => void
  rerollsLeft: number
  onReroll: () => void
  onReturn: () => void
}

export function QuestOfferPanel({ gs, questOffer, addQuest, rerollsLeft, onReroll, onReturn }: Props) {
  const gossip = getGossip(gs.currentStation)
  const forced = rerollsLeft <= 0

  return (
    <div className="layout">
      <div className="t-xs t-dim t-center">— CHERCHER DU TRAVAIL —</div>

      <div className="px-box">
        <div className="t-xs t-dim mb4">RUMEUR DU COIN</div>
        <div className="t-xs" style={{ lineHeight: '2', fontStyle: 'italic' }}>{gossip}</div>
      </div>

      {questOffer ? (
        <div className="px-box px-box--hi">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
            <div className="t-sm t-bright">{questOffer.title}</div>
            <div className={`tag t-xs ${questOffer.type === 'kill' ? 'tag--red' : questOffer.type === 'delivery' ? 'tag--cyan' : 'tag--dim'}`}>
              {questOffer.type.toUpperCase()}
            </div>
          </div>
          <div className="t-xs" style={{ lineHeight: '2' }}>{questOffer.description}</div>
          <div className="t-xs t-gold mt8">
            Récompense : {questOffer.creditReward.toLocaleString()} cr · +{questOffer.repReward} rép
          </div>
          {forced && (
            <div className="t-xs t-dim mt4" style={{ fontStyle: 'italic' }}>
              Tu as refusé trop de fois. Prends ce contrat ou pars.
            </div>
          )}
          <div className="row gap4 mt8">
            <button
              className="px-btn px-btn--primary"
              style={{ flex: 1 }}
              onClick={() => { addQuest(questOffer); onReturn() }}
              disabled={gs.activeQuests.length >= 5}
            >
              Accepter
            </button>
            {!forced && (
              <button className="px-btn" style={{ flex: 1 }} onClick={onReroll}>
                Changer ({rerollsLeft} restant{rerollsLeft > 1 ? 's' : ''})
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="px-box t-dim t-xs">Aucun travail disponible ici pour l'instant.</div>
      )}

      {!forced && <button className="px-btn" onClick={onReturn}>← Retour</button>}
    </div>
  )
}

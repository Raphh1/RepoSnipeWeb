import { useGameStore } from '../../store/gameStore'
import { NAMED_NPCS } from '../../engine/npcTracker'
import { getStationsSellingItem, getStation } from '../../data/stations'
import { BOSS_TRIGGER_TYPES, CRAFTED_DELIVERY_ITEMS } from '../../engine/quests'
import type { MajorQuestCondition, QuestType, GameState } from '../../types'

function stageDestination(cond: MajorQuestCondition): string | null {
  switch (cond.type) {
    case 'visitStation': return cond.station
    case 'winCombatAt':  return cond.station
    case 'meetNpc':      return NAMED_NPCS.find(n => n.name === cond.npcName)?.station ?? null
    case 'hasFaction':   return `Rejoindre faction : ${cond.faction}`
    case 'bossKill':     return `Vaincre ${cond.bossName}`
    default:             return null
  }
}

const TYPE_LABEL: Record<string, string> = {
  delivery:   'LIVRAISON',
  kill:       'CONTRAT',
  revenge:    'VENGEANCE',
  escort:     'ESCORTE',
  sabotage:   'SABOTAGE',
  heist:      'BRAQUAGE',
  extraction: 'EXTRACTION',
  bounty:     'PRIME',
  patrol:     'PATROUILLE',
}

const TYPE_CLASS: Record<string, string> = {
  delivery:   'tag--cyan',
  kill:       'tag--red',
  revenge:    'tag--orange',
  escort:     'tag--green',
  sabotage:   'tag--red',
  heist:      'tag--purple',
  extraction: 'tag--cyan',
  bounty:     'tag--gold',
  patrol:     'tag--dim',
}

const TYPE_COMPLETE_HINT: Record<string, string> = {
  delivery:   'Arriver à destination avec l\'item en cargo',
  kill:       'Vaincre le chef de la station cible (voir le guide ci-dessous)',
  revenge:    'Vaincre le chef de la station cible (voir le guide ci-dessous)',
  escort:     'Arriver à destination avec le passager',
  sabotage:   'Vaincre le chef de la station cible (voir le guide ci-dessous)',
  heist:      'Arriver à destination avec l\'item acquis sur place',
  extraction: 'Ramener l\'item ici depuis la destination',
  bounty:     'Vaincre le chef de la station cible (voir le guide ci-dessous)',
  patrol:     'Arriver à destination',
}

function bossGuidance(q: { type: QuestType; targetStation: string }, gs: GameState, isAtTarget: boolean) {
  if (!BOSS_TRIGGER_TYPES.includes(q.type)) return null
  const station = getStation(q.targetStation)
  const tooSafe = station.danger < 2

  if (!isAtTarget) {
    return (
      <div className="t-xs" style={{ color: 'var(--cyan)', lineHeight: 1.8 }}>
        ◆ Guide : une fois sur place, reste sur cette station et clique plusieurs fois sur <span className="t-bright">EXPLORER</span> (pas "Errer") sans voyager ailleurs. Le combat contre le chef se déclenche seul après un certain nombre d'explorations.
      </div>
    )
  }

  if (tooSafe) {
    return (
      <div className="t-xs t-red" style={{ lineHeight: 1.8 }}>
        ⚠ Cette station est trop calme (danger {station.danger}/3) — aucun combat de chef ne peut s'y déclencher. Cette quête est impossible à compléter ici ; abandonne-la ou laisse-la expirer.
      </div>
    )
  }

  const depth = gs.zoneDepth ?? 0
  const fights = gs.explorationFightsDone ?? 0
  const depthReady = depth >= 7
  const fightsReady = fights >= 3
  return (
    <div className="t-xs" style={{ lineHeight: 1.8 }}>
      <div style={{ color: 'var(--cyan)' }}>
        ◆ Guide : clique sur <span className="t-bright">EXPLORER</span> (pas "Errer") plusieurs fois d'affilée, sans voyager ailleurs — le chef finit par apparaître.
      </div>
      <div style={{ color: depthReady ? 'var(--green)' : 'var(--orange)' }}>
        Profondeur d'exploration : {depth}/7{depthReady ? ' ✓' : ' — continue d\'explorer'}
      </div>
      <div style={{ color: fightsReady ? 'var(--green)' : 'var(--orange)' }}>
        Combats déclenchés ici : {fights}/3{fightsReady ? ' ✓' : ' — il en faut plus'}
      </div>
      {depthReady && fightsReady && (
        <div className="t-green">Conditions réunies — chaque exploration a maintenant une chance de faire apparaître le chef.</div>
      )}
    </div>
  )
}

export function QuestsScreen() {
  const gs   = useGameStore(s => s.gs!)
  const goTo = useGameStore(s => s.goTo)

  return (
    <div className="layout">
      <div className="row" style={{ alignItems: 'center', gap: '16px' }}>
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => goTo('station-hub')}>← RETOUR</button>
        <div className="t-sm t-bright">QUÊTES ACTIVES ({gs.activeQuests.length}/5)</div>
        {gs.majorQuests.filter(q => !q.completed && !q.failed).length > 0 && (
          <div className="tag tag--purple t-xs">{gs.majorQuests.filter(q => !q.completed && !q.failed).length} mission{gs.majorQuests.filter(q => !q.completed && !q.failed).length > 1 ? 's' : ''} majeure{gs.majorQuests.filter(q => !q.completed && !q.failed).length > 1 ? 's' : ''}</div>
        )}
        <div className="t-xs t-dim">{gs.completedQuestIds.length} complétées</div>
      </div>

      {gs.activeQuests.length === 0 && (
        <div className="px-box t-dim t-xs">
          Aucune quête active. Cherche du travail dans la station.
        </div>
      )}

      {/* ── QUÊTES MAJEURES ─────────────────────────────────────── */}
      {gs.majorQuests.length > 0 && (
        <div className="col gap4">
          <div className="t-xs t-dim" style={{ letterSpacing: '0.1em' }}>◆◆ MISSIONS MAJEURES ({gs.majorQuests.filter(q => !q.completed && !q.failed).length} actives)</div>
          {gs.majorQuests.map(mq => {
            const stage = mq.stages[mq.currentStage]
            const pct = Math.round((mq.currentStage / mq.stages.length) * 100)
            return (
              <div key={mq.id} className="px-box" style={{
                borderColor: mq.completed ? 'var(--green)' : mq.failed ? 'var(--red)' : 'var(--purple)',
                background: mq.completed ? '#0a1a0a' : mq.failed ? '#1a0808' : '#0d0a18',
              }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div className="t-sm" style={{ color: mq.completed ? 'var(--green)' : mq.failed ? 'var(--red)' : 'var(--purple)', flex: 1, marginRight: '8px' }}>
                    {mq.completed ? '★★ ' : mq.failed ? '✗ ' : '◆◆ '}{mq.title}
                  </div>
                  <div className="tag t-xs" style={{ borderColor: 'var(--purple)', color: 'var(--purple)' }}>
                    {mq.completed ? 'ACCOMPLIE' : mq.failed ? 'ÉCHOUÉE' : `${mq.currentStage}/${mq.stages.length}`}
                  </div>
                </div>

                <div className="t-xs t-dim mb8" style={{ lineHeight: '1.8', fontStyle: 'italic' }}>
                  {mq.lore.slice(0, 120)}{mq.lore.length > 120 ? '…' : ''}
                </div>

                {!mq.completed && !mq.failed && stage && (
                  <>
                    <div className="t-xs t-bright mb4" style={{ borderLeft: '2px solid var(--purple)', paddingLeft: '8px' }}>
                      Étape {mq.currentStage + 1} — {stage.title}
                    </div>
                    <div className="t-xs mb4" style={{ lineHeight: '1.8' }}>{stage.description}</div>
                    <div className="t-xs t-cyan mb4">
                      ▶ {stage.objective}
                    </div>
                    {(() => {
                      const dest = stageDestination(stage.condition)
                      if (!dest) return null
                      const isHere = gs.currentStation === dest
                      return (
                        <div className="t-xs mb8" style={{ color: isHere ? 'var(--green)' : 'var(--gold)', fontWeight: 'bold' }}>
                          {isHere ? '★ TU ES SUR PLACE' : `→ Destination : ${dest}`}
                        </div>
                      )
                    })()}
                  </>
                )}

                {/* Barre de progression */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ flex: 1, height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: mq.completed ? 'var(--green)' : 'var(--purple)', transition: 'width 0.3s' }} />
                  </div>
                  <div className="t-xs t-dim">{pct}%</div>
                </div>

                {/* Étapes résumé */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {mq.stages.map((s, i) => (
                    <div key={s.id} className="t-xs" style={{
                      padding: '1px 5px',
                      borderRadius: '2px',
                      background: i < mq.currentStage ? 'var(--purple)' : i === mq.currentStage ? 'rgba(140,80,220,0.3)' : 'var(--surface)',
                      color: i < mq.currentStage ? '#fff' : i === mq.currentStage ? 'var(--purple)' : 'var(--text-dim)',
                      border: `1px solid ${i === mq.currentStage ? 'var(--purple)' : 'transparent'}`,
                    }}>
                      {i + 1}
                    </div>
                  ))}
                </div>

                <div className="t-xs t-dim mt8">
                  Donné par <span className="t-bright">{mq.giver}</span> à <span style={{ color: 'var(--cyan)' }}>{mq.giverStation}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── QUÊTES SIMPLES ──────────────────────────────────────── */}
      {gs.activeQuests.length > 0 && <div className="t-xs t-dim" style={{ letterSpacing: '0.1em' }}>◆ CONTRATS ({gs.activeQuests.length}/5)</div>}
      <div className="col gap4">
        {gs.activeQuests.map(q => {
          const isAtTarget = gs.currentStation === q.targetStation
          const isAtGiver  = gs.currentStation === q.giverStation
          const hasItem    = q.targetItem ? (gs.cargo[q.targetItem] ?? 0) > 0 : false
          const hasPassenger = (gs.cargo['Passager'] ?? 0) > 0

          let statusColor = 'var(--text-dim)'
          let statusText  = `→ ${q.targetStation}`
          if (q.type === 'extraction') {
            if (!isAtTarget && !hasItem) statusText = `→ Aller chercher à ${q.targetStation}`
            else if (hasItem && !isAtGiver) statusText = `→ Ramener à ${q.giverStation}`
            else if (hasItem && isAtGiver) { statusText = 'PRÊTE À COMPLÉTER ici'; statusColor = 'var(--green)' }
          } else if (isAtTarget) {
            statusText = 'À COMPLÉTER — tu es sur place'
            statusColor = 'var(--gold)'
          }

          return (
            <div key={q.id} className="px-box">
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div className="t-sm t-bright" style={{ flex: 1, marginRight: '8px' }}>{q.title}</div>
                <div className={`tag t-xs ${TYPE_CLASS[q.type]}`}>{TYPE_LABEL[q.type]}</div>
              </div>

              <div className="t-xs" style={{ lineHeight: '2', marginBottom: '8px' }}>{q.description}</div>

              <div className="t-xs t-dim" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>
                  Donné par <span className="t-bright">{q.giver}</span> à <span className="t-cyan">{q.giverStation}</span>
                </div>
                <div style={{ color: statusColor }}>{statusText}</div>
                <div className="t-dim" style={{ fontStyle: 'italic', fontSize: '7px' }}>
                  {TYPE_COMPLETE_HINT[q.type]}
                </div>
                {bossGuidance(q, gs, isAtTarget)}
                {q.targetItem && q.type !== 'extraction' && (() => {
                  const sellers = !hasItem && q.type !== 'escort' ? getStationsSellingItem(q.targetItem!) : []
                  return (
                    <div>
                      Item requis : <span className="t-orange">{q.targetItem}</span>
                      {' '}
                      {hasItem
                        ? <span className="t-green">(en cargo)</span>
                        : q.type === 'escort'
                          ? hasPassenger ? <span className="t-green">(passager à bord)</span> : <span className="t-red">(passager non embarqué)</span>
                          : <span className="t-red">(à acquérir)</span>
                      }
                      {sellers.length > 0 && (
                        <div style={{ marginTop: '3px', color: 'var(--cyan)', fontSize: '8px' }}>
                          ◆ Achetable à : {sellers.slice(0, 4).join(', ')}{sellers.length > 4 ? '…' : ''}
                        </div>
                      )}
                      {!hasItem && sellers.length === 0 && CRAFTED_DELIVERY_ITEMS.includes(q.targetItem!) && (
                        <div style={{ marginTop: '3px', color: 'var(--purple)', fontSize: '8px' }}>
                          🔧 Introuvable en achat — doit être fabriqué à l'Atelier.
                        </div>
                      )}
                    </div>
                  )
                })()}
                {q.type === 'extraction' && q.targetItem && (() => {
                  const sellers = !hasItem ? getStationsSellingItem(q.targetItem!) : []
                  return (
                    <div>
                      À récupérer : <span className="t-orange">{q.targetItem}</span>
                      {' '}
                      {hasItem ? <span className="t-green">(en cargo)</span> : <span className="t-dim">(pas encore récupéré)</span>}
                      {sellers.length > 0 && !hasItem && (
                        <div style={{ marginTop: '3px', color: 'var(--cyan)', fontSize: '8px' }}>
                          ◆ Achetable à : {sellers.slice(0, 4).join(', ')}{sellers.length > 4 ? '…' : ''}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              <div className="t-xs t-gold mt8">
                Récompense : {q.creditReward.toLocaleString()} cr
                {q.repReward > 0 ? ` · +${q.repReward} rép` : q.repReward < 0 ? ` · ${q.repReward} rép` : ''}
                {(q.dayMult ?? 1) >= 1.1 && (
                  <span style={{ color: 'var(--orange)', marginLeft: '8px', fontStyle: 'normal' }}>
                    ×{(q.dayMult ?? 1).toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

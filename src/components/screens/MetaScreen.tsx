import { useMetaStore } from '../../store/metaStore'
import { useGameStore } from '../../store/gameStore'
import { META_UNLOCKS } from '../../data/metaUnlocks'
import type { MetaCategory } from '../../types/meta'

const CAT_LABELS: Record<MetaCategory, string> = {
  survie:   '❤ SURVIE',
  combat:   '⚔ COMBAT',
  commerce: '◆ COMMERCE',
  voyage:   '⛽ VOYAGE',
  special:  '★ SPÉCIAL',
}
const CAT_COLORS: Record<MetaCategory, string> = {
  survie:   'var(--red)',
  combat:   'var(--orange)',
  commerce: 'var(--gold)',
  voyage:   'var(--cyan)',
  special:  'var(--purple)',
}
const CATEGORIES: MetaCategory[] = ['survie', 'combat', 'commerce', 'voyage', 'special']

interface Props {
  onBack: () => void
  selectedForRun?: string[]
  onToggleRun?: (id: string) => void
}

export function MetaScreen({ onBack, selectedForRun, onToggleRun }: Props) {
  const meta        = useMetaStore(s => s.meta)
  const unlockMeta  = useMetaStore(s => s.unlockMeta)
  const available   = useMetaStore(s => s.availablePoints())
  const newGame     = useGameStore(s => s.newGame)

  const isPreRun = selectedForRun !== undefined && onToggleRun !== undefined

  return (
    <div className="layout scanlines" style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div className="px-box px-box--hi" style={{ borderColor: 'var(--purple)' }}>
        <div className="row" style={{ alignItems: 'center', gap: '12px' }}>
          <div className="t-lg t-bright" style={{ color: 'var(--purple)' }}>HÉRITAGE</div>
          <div className="t-xs t-dim" style={{ flex: 1 }}>
            {isPreRun ? 'Achète et sélectionne les améliorations pour cette run' : 'Améliorations permanentes entre les runs'}
          </div>
          <div className="px-box" style={{ padding: '4px 10px', borderColor: 'var(--gold)' }}>
            <span className="t-xs t-dim">Points dispo : </span>
            <span className="t-sm t-gold">{available}</span>
            <span className="t-xs t-dim"> / {meta.totalPointsEarned} gagnés</span>
          </div>
        </div>
        {isPreRun && meta.unlockedIds.length > 0 && (
          <div className="t-xs t-dim mt8" style={{ fontStyle: 'italic' }}>
            Active ou désactive chaque amélioration pour cette run uniquement — elles restent acquises pour les prochaines.
          </div>
        )}
        {available === 0 && meta.totalPointsEarned === 0 && (
          <div className="t-xs t-dim mt8" style={{ fontStyle: 'italic' }}>
            Termine ta première run pour gagner des points d'héritage.
          </div>
        )}
      </div>

      {/* Unlocks par catégorie */}
      {CATEGORIES.map(cat => {
        const catUnlocks = META_UNLOCKS.filter(u => u.category === cat)
        const color = CAT_COLORS[cat]
        return (
          <div key={cat}>
            <div className="section-header" style={{ borderColor: color, color }}>{CAT_LABELS[cat]}</div>
            <div className="col gap4">
              {catUnlocks.map(unlock => {
                const owned    = meta.unlockedIds.includes(unlock.id)
                const reqMet   = !unlock.requires || meta.unlockedIds.includes(unlock.requires)
                const canBuy   = !owned && reqMet && available >= unlock.cost
                const reqName  = unlock.requires
                  ? META_UNLOCKS.find(u => u.id === unlock.requires)?.name
                  : null
                const activeThisRun = isPreRun && (selectedForRun?.includes(unlock.id) ?? false)

                return (
                  <div key={unlock.id} className="px-box" style={{
                    borderColor: owned ? (activeThisRun || !isPreRun ? color : 'var(--border-dim)') : reqMet ? 'var(--border)' : 'var(--border-dim)',
                    opacity: owned || reqMet ? 1 : 0.5,
                    background: owned && (activeThisRun || !isPreRun) ? 'rgba(80,80,120,0.15)' : undefined,
                  }}>
                    <div className="row" style={{ alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
                          <span className="t-sm" style={{ color: owned && (activeThisRun || !isPreRun) ? color : !reqMet ? 'var(--dim)' : 'var(--text-bright)' }}>
                            {owned ? '✓ ' : !reqMet ? '🔒 ' : canBuy ? '○ ' : ''}{unlock.name}
                          </span>
                          <span className="tag t-xs" style={{ borderColor: owned ? color : !reqMet ? 'var(--border-dim)' : 'var(--border)', color: owned ? color : 'var(--dim)' }}>
                            {owned ? 'DÉBLOQUÉ' : !reqMet ? 'VERROUILLÉ' : canBuy ? 'DISPONIBLE' : `${unlock.cost} pts`}
                          </span>
                          {reqName && !owned && (
                            <span className="t-xs t-dim">
                              (requiert : {reqName})
                            </span>
                          )}
                        </div>
                        <div className="t-xs t-dim mt4" style={{ lineHeight: '1.8' }}>{unlock.description}</div>
                      </div>
                      <div style={{ minWidth: '90px', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {owned ? (
                          isPreRun ? (
                            <button
                              className="px-btn px-btn--sm"
                              style={{
                                borderColor: activeThisRun ? color : 'var(--border-dim)',
                                color: activeThisRun ? color : 'var(--text-dim)',
                              }}
                              onClick={() => onToggleRun(unlock.id)}
                            >
                              {activeThisRun ? '✓ ACTIF' : '○ INACTIF'}
                            </button>
                          ) : (
                            <span className="tag t-xs" style={{ color, borderColor: color }}>ACQUIS</span>
                          )
                        ) : (
                          <button
                            className="px-btn px-btn--sm"
                            disabled={!canBuy}
                            style={canBuy ? { borderColor: color, color } : undefined}
                            onClick={() => {
                              unlockMeta(unlock.id, unlock.cost)
                              if (isPreRun) onToggleRun(unlock.id)
                            }}
                          >
                            {unlock.cost} pts
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Historique des runs */}
      {meta.runHistory.length > 0 && (
        <div>
          <div className="section-header">HISTORIQUE DES RUNS ({meta.runHistory.length})</div>
          <div className="col gap4">
            {meta.runHistory.map((run, i) => (
              <div key={i} className="px-box" style={{ borderColor: run.victory ? 'var(--gold)' : 'var(--border)', padding: '6px 12px' }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="t-xs" style={{ color: run.victory ? 'var(--gold)' : 'var(--text)' }}>
                    {run.victory ? '★ VICTOIRE' : '✕ MORT'} — {run.className}
                  </span>
                  <span className="t-xs t-dim">{run.date}</span>
                </div>
                <div className="t-xs t-dim mt4">
                  J{run.day} · {run.bossesKilled} boss · {run.questsDone} quêtes · {run.stationsVisited} stations
                  <span className="t-gold"> · +{run.pointsEarned} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="row gap4">
        <button className="px-btn" style={{ flex: 1 }} onClick={onBack}>
          ← RETOUR
        </button>
        {!isPreRun && (
          <button className="px-btn px-btn--primary" style={{ flex: 2 }} onClick={newGame}>
            NOUVELLE RUN
          </button>
        )}
      </div>
    </div>
  )
}

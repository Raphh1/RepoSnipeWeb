import { useGameStore } from '../../store/gameStore'
import { OBJECTIVES } from '../../engine/objectives'

const CATEGORIES = ['Progression', 'Build', 'Criminel', 'Narratif', 'Légendaire']

export function ObjectivesScreen() {
  const gs   = useGameStore(s => s.gs!)
  const goTo = useGameStore(s => s.goTo)

  return (
    <div className="layout">
      <div className="row" style={{ alignItems: 'center', gap: '16px' }}>
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => goTo('station-hub')}>← RETOUR</button>
        <div className="t-sm t-bright">OBJECTIFS</div>
        <div className="t-xs t-dim">{gs.completedObjectives.length}/{OBJECTIVES.length} complétés</div>
      </div>

      {CATEGORIES.map(cat => {
        const objs = OBJECTIVES.filter(o => o.category === cat)
        return (
          <div key={cat}>
            <div className="t-xs t-dim mb4" style={{ letterSpacing: '2px' }}>── {cat.toUpperCase()} ──</div>
            <div className="col gap4">
              {objs.map(obj => {
                const done = gs.completedObjectives.includes(obj.id)
                return (
                  <div key={obj.id} className={`px-box ${done ? '' : 'px-box--dark'}`} style={{ opacity: done ? 0.7 : 1 }}>
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="t-xs" style={{ color: done ? 'var(--text-dim)' : 'var(--text-bright)' }}>
                        {done ? '✓ ' : '○ '}{obj.name}
                      </div>
                      {done && <div className="tag tag--green t-xs">ACCOMPLI</div>}
                    </div>
                    {!done && (
                      <>
                        <div className="t-xs t-dim mt4">{obj.description}</div>
                        <div className="t-xs mt4" style={{ color: 'var(--text-dim)' }}>
                          Progression : <span className="t-bright">{obj.progress(gs)}</span>
                        </div>
                        <div className="t-xs t-gold mt4">Récompense : {obj.reward}</div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

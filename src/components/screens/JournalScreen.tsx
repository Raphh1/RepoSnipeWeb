import { useGameStore } from '../../store/gameStore'
import type { JournalEntry } from '../../types'

const CATEGORY_COLORS: Record<JournalEntry['category'], string> = {
  combat:   'var(--red)',
  decision: 'var(--orange)',
  travel:   'var(--cyan)',
  nexus:    'var(--purple)',
  prison:   'var(--dim)',
  event:    'var(--green)',
}

const CATEGORY_LABELS: Record<JournalEntry['category'], string> = {
  combat:   'COMBAT',
  decision: 'DÉCISION',
  travel:   'VOYAGE',
  nexus:    'NEXUS',
  prison:   'PRISON',
  event:    'ÉVÉNEMENT',
}

export function JournalScreen() {
  const gs   = useGameStore(s => s.gs!)
  const goTo = useGameStore(s => s.goTo)

  const entries = [...(gs.journal ?? [])].reverse()

  return (
    <div className="layout">
      <div className="row" style={{ alignItems: 'center', gap: '12px' }}>
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => goTo('station-hub')}>
          ← RETOUR
        </button>
        <div className="t-sm t-bright" style={{ flex: 1 }}>JOURNAL DE BORD</div>
        <div className="t-xs t-dim">{entries.length} entrée{entries.length !== 1 ? 's' : ''}</div>
      </div>

      {entries.length === 0 && (
        <div className="px-box" style={{ borderColor: 'var(--border)' }}>
          <div className="t-xs t-dim t-center" style={{ padding: '16px 0', lineHeight: '2.2' }}>
            Aucune entrée pour l'instant.<br />
            Les décisions importantes s'inscriront ici au fil de la run.
          </div>
        </div>
      )}

      <div className="col" style={{ gap: '6px' }}>
        {entries.map(entry => {
          const color = CATEGORY_COLORS[entry.category]
          return (
            <div key={entry.id} className="px-box" style={{ borderColor: color, padding: '10px 14px' }}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="tag" style={{ borderColor: color, color, fontSize: '8px', letterSpacing: '1px' }}>
                    {CATEGORY_LABELS[entry.category]}
                  </span>
                  <span className="t-xs t-dim">{entry.station}</span>
                </div>
                <span className="t-xs t-dim">Jour {entry.day}</span>
              </div>
              <div className="t-xs" style={{ lineHeight: '2', color: 'var(--text)', fontStyle: 'italic' }}>
                {entry.text}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

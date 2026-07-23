import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { LORE_FRAGMENTS, getFragment, FRAGMENT_TYPE_LABELS, FRAGMENT_TYPE_COLORS, type LoreFragmentType } from '../../data/loreFragments'

const TYPE_ORDER: LoreFragmentType[] = ['transmission', 'journal', 'datapad', 'inscription', 'rumeur']

const THEME_LABELS: Record<string, string> = {
  fracture: 'LA FRACTURE',
  faucons:  'LES FAUCONS',
  emporium: "L'EMPORIUM",
  gardiens: 'LES GARDIENS',
  culte:    'LE CULTE',
  void:     'LA DÉRIVE & LE VIDE',
  zero:     'STATION ZÉRO',
  rho:      "L'INGÉNIEUR RHO",
  life:     'FRAGMENTS DE VIE',
  outside:  'LE SECTEUR',
}

function getTheme(id: string): string {
  const prefix = id.split('_')[0]
  return THEME_LABELS[prefix] ?? 'DIVERS'
}

export function LoreScreen() {
  const gs   = useGameStore(s => s.gs!)
  const goTo = useGameStore(s => s.goTo)
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const discovered = new Set(gs.discoveredLore ?? [])
  const total = LORE_FRAGMENTS.length
  const found = discovered.size

  const themes = Array.from(new Set(
    (gs.discoveredLore ?? []).map(id => getTheme(id))
  )).sort()

  const fragments = (gs.discoveredLore ?? [])
    .map(id => getFragment(id))
    .filter(Boolean)
    .filter(f => filter === 'all' || getTheme(f!.id) === filter || f!.type === filter)
    .sort((a, b) => a!.title.localeCompare(b!.title))

  const active = selected ? getFragment(selected) : null

  if (active) {
    return (
      <div className="layout">
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => setSelected(null)}>
          ← Retour aux archives
        </button>

        <div className="px-box px-box--hi" style={{ borderColor: FRAGMENT_TYPE_COLORS[active.type] }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div className="tag t-xs" style={{ borderColor: FRAGMENT_TYPE_COLORS[active.type], color: FRAGMENT_TYPE_COLORS[active.type] }}>
              {FRAGMENT_TYPE_LABELS[active.type]}
            </div>
            <div className="t-xs t-dim">{getTheme(active.id)}</div>
          </div>
          <div className="t-sm t-bright mb4">{active.title}</div>
          <div className="t-xs t-dim mb12" style={{ fontStyle: 'italic' }}>{active.source}</div>
          <div className="t-xs" style={{ lineHeight: '2.2', whiteSpace: 'pre-wrap', color: 'var(--text)' }}>
            {active.content}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="layout">
      <div className="row" style={{ alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => goTo('station-hub')}>
          ← RETOUR
        </button>
        <div className="t-sm t-bright" style={{ flex: 1 }}>MÉMOIRE DU VIDE</div>
        <div className="t-xs" style={{ color: found > 0 ? 'var(--gold)' : 'var(--text-dim)' }}>
          {found}/{total} fragments
        </div>
      </div>

      {/* Barre de progression */}
      <div style={{ position: 'relative', height: '4px', background: 'var(--border)', borderRadius: '2px' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${(found / total) * 100}%`,
          background: found >= total * 0.8 ? 'var(--gold)' : found >= total * 0.5 ? 'var(--cyan)' : 'var(--text-dim)',
          borderRadius: '2px', transition: 'width 0.4s ease',
        }} />
      </div>

      {found === 0 ? (
        <div className="px-box" style={{ borderColor: 'var(--border)' }}>
          <div className="t-xs t-dim t-center" style={{ lineHeight: '2.5', padding: '16px 0' }}>
            Aucun fragment trouvé.<br />
            <span style={{ fontSize: '9px', letterSpacing: '1px' }}>Explore les stations. Le vide a une mémoire.</span>
          </div>
        </div>
      ) : (
        <>
          {/* Filtres */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button
              className="px-btn px-btn--sm"
              style={{ width: 'auto', borderColor: filter === 'all' ? 'var(--cyan)' : undefined, color: filter === 'all' ? 'var(--cyan)' : undefined }}
              onClick={() => setFilter('all')}
            >
              Tous ({found})
            </button>
            {themes.map(theme => (
              <button key={theme} className="px-btn px-btn--sm"
                style={{
                  width: 'auto', fontSize: '9px',
                  borderColor: filter === theme ? 'var(--gold)' : undefined,
                  color: filter === theme ? 'var(--gold)' : undefined,
                }}
                onClick={() => setFilter(filter === theme ? 'all' : theme)}
              >
                {theme}
              </button>
            ))}
          </div>

          {/* Par type */}
          {TYPE_ORDER.map(type => {
            const group = fragments.filter(f => f!.type === type)
            if (group.length === 0) return null
            return (
              <div key={type}>
                <div className="t-xs t-dim" style={{ letterSpacing: '2px', marginBottom: '6px', color: FRAGMENT_TYPE_COLORS[type] }}>
                  {FRAGMENT_TYPE_LABELS[type]} ({group.length})
                </div>
                <div className="col gap4">
                  {group.map(f => f && (
                    <button key={f.id} className="px-btn" style={{ textAlign: 'left' }}
                      onClick={() => setSelected(f.id)}>
                      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="t-xs t-bright">{f.title}</span>
                        <span className="t-xs t-dim" style={{ fontSize: '9px', marginLeft: '8px', flexShrink: 0 }}>
                          {getTheme(f.id)}
                        </span>
                      </div>
                      <div className="t-xs t-dim mt2" style={{ lineHeight: '1.6', fontSize: '9px' }}>
                        {f.source}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* Fragments non découverts — liste fantôme */}
      {found < total && (
        <div className="px-box" style={{ borderColor: 'var(--border)', background: 'rgba(0,0,0,0.3)', marginTop: '8px' }}>
          <div className="t-xs t-dim mb6" style={{ letterSpacing: '1px' }}>FRAGMENTS NON DÉCOUVERTS ({total - found})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {LORE_FRAGMENTS.filter(f => !discovered.has(f.id)).map(f => (
              <div key={f.id} className="tag t-xs" style={{ borderColor: 'var(--border)', color: 'var(--border-hi)', fontStyle: 'italic' }}>
                ??? {FRAGMENT_TYPE_LABELS[f.type]}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

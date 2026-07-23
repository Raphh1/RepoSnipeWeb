import type { GameState } from '../../types'

interface Props { gs: GameState }

export function StatusBar({ gs }: Props) {
  const hpPct   = (gs.playerHp / gs.playerMaxHp) * 100
  const staPct  = (gs.stamina  / gs.maxStamina)  * 100
  const shipPct = (gs.shipHp   / gs.shipMaxHp)   * 100
  const low     = hpPct < 30

  const showFolie = gs.class.name === 'Accro' || gs.moralTags.includes('cannibal')
  const folie     = gs.folieLevel ?? 0
  const folieColor = folie >= 80 ? 'var(--red)' : folie >= 50 ? 'var(--orange)' : 'var(--purple)'
  const folieLabel = gs.moralTags.includes('cannibal') && gs.class.name === 'Accro'
    ? 'FOLIE (×2)'
    : gs.moralTags.includes('cannibal') ? 'FOLIE 🩸' : 'FOLIE'

  return (
    <div className="px-box" style={{ display: 'grid', gridTemplateColumns: showFolie ? '1fr 1fr 1fr 1fr 1fr' : '1fr 1fr 1fr 1fr', gap: '12px', alignItems: 'center' }}>
      <div>
        <div className="t-dim t-xs mb4">PV</div>
        <div className={`bar bar--hp ${low ? 'low' : ''}`}>
          <div className="bar__fill" style={{ width: `${hpPct}%` }} />
        </div>
        <div className="t-sm mt4" style={{ color: low ? 'var(--red)' : 'var(--green)' }}>
          {gs.playerHp}/{gs.playerMaxHp}
        </div>
      </div>
      <div>
        <div className="t-dim t-xs mb4">STAMINA</div>
        <div className="bar bar--sta">
          <div className="bar__fill" style={{ width: `${staPct}%` }} />
        </div>
        <div className="t-sm mt4 t-cyan">{gs.stamina}/{gs.maxStamina}</div>
      </div>
      <div>
        <div className="t-dim t-xs mb4">VAISSEAU</div>
        <div className="bar bar--ship">
          <div className="bar__fill" style={{ width: `${shipPct}%` }} />
        </div>
        <div className="t-sm mt4" style={{ color: 'var(--blue)' }}>{gs.shipHp}/{gs.shipMaxHp}</div>
      </div>

      {showFolie && (
        <div>
          <div className="t-xs mb4" style={{ color: folieColor }}>{folieLabel}</div>
          <div className="bar" style={{ borderColor: folieColor }}>
            <div style={{ height: '100%', width: `${folie}%`, background: folieColor, transition: 'width 0.4s, background 0.4s' }} />
          </div>
          <div className="t-sm mt4" style={{ color: folieColor }}>
            {folie}/100{folie >= 80 ? ' ⚠' : ''}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div><span className="t-dim t-xs">CR </span><span className="t-gold t-sm">{gs.credits.toLocaleString()}</span></div>
        <div><span className="t-dim t-xs">FUEL </span><span className="t-cyan t-sm">{gs.fuel}/{gs.maxFuel}</span></div>
        <div><span className="t-dim t-xs">REP </span><span className="t-sm">{gs.reputation}</span></div>
        <div><span className="t-dim t-xs">JOUR </span><span className="t-sm">{gs.day}</span></div>
      </div>
    </div>
  )
}

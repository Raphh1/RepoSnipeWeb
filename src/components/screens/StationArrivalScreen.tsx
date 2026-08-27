import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../../store/gameStore'
import { getStation } from '../../data/stations'
import { getAmbiance } from '../../engine/jsonEventLoader'
import { TypewriterText } from '../ui/TypewriterText'

const DANGER_COLOR = ['var(--green)', 'var(--yellow)', 'var(--orange)', 'var(--red)']

export function StationArrivalScreen() {
  const { t } = useTranslation('stationArrivalScreen')
  const DANGER_LABEL = t('dangerLabels', { returnObjects: true }) as unknown as string[]
  const gs   = useGameStore(s => s.gs!)
  const goTo = useGameStore(s => s.goTo)

  const station = getStation(gs.currentStation)
  const [text]  = useState(() => getAmbiance(gs.currentStation) ?? station.description)
  const [done, setDone]     = useState(false)
  const [skipped, setSkipped] = useState(false)
  const showFull = done || skipped

  const dangerColor = DANGER_COLOR[station.danger]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '32px 20px',
      position: 'relative',
    }}>
      {/* Scanlines */}
      <div className="scanlines" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }} />

      <div style={{ maxWidth: '680px', width: '100%' }}>

        {/* En-tête station */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="t-xs t-dim" style={{ letterSpacing: '4px', marginBottom: '12px' }}>
            {t('arrivalHeader')}
          </div>
          <div style={{ fontSize: '18px', color: 'var(--text-bright)', letterSpacing: '3px', marginBottom: '10px' }}>
            {station.name}
          </div>
          <div className="t-xs" style={{ color: dangerColor, letterSpacing: '2px' }}>
            {DANGER_LABEL[station.danger]}
          </div>
        </div>

        {/* Séparateur */}
        <div style={{ borderTop: `1px solid var(--border)`, marginBottom: '28px' }} />

        {/* Texte narratif */}
        <div style={{
          fontFamily: 'inherit',
          fontSize: '10px',
          lineHeight: '2.4',
          color: 'var(--text-dim)',
          minHeight: '120px',
          marginBottom: '32px',
          padding: '0 8px',
        }}>
          {showFull
            ? text
            : <TypewriterText text={text} speed={18} onDone={() => setDone(true)} />
          }
        </div>

        {/* Séparateur */}
        <div style={{ borderTop: `1px solid var(--border)`, marginBottom: '20px' }} />

        {/* Jour + classe */}
        <div className="t-xs t-dim" style={{ textAlign: 'center', marginBottom: '24px' }}>
          {t('dayLabel', { day: gs.day })} <span style={{ color: gs.class.color }}>{gs.class.name}</span>
          {gs.fuel <= 1 && <span className="t-red"> {t('fuelCritical')}</span>}
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {!showFull && (
            <button className="px-btn" style={{ flex: 1, color: 'var(--text-dim)', textAlign: 'center' }}
              onClick={() => setSkipped(true)}>
              {t('skip')}
            </button>
          )}
          {showFull && (
            <button className="px-btn px-btn--primary" style={{ flex: 1, textAlign: 'center' }}
              onClick={() => goTo('station-hub')}>
              {t('enterStation', { name: station.name })}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

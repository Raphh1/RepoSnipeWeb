import { useTranslation } from 'react-i18next'
import { useGameStore } from '../../store/gameStore'
import { TypewriterText } from '../ui/TypewriterText'
import { translateClassName, translateStationName } from '../../engine/goodsI18n'

const CLASS_INTRO_KEYS: Record<string, string> = {
  Vagabond: 'vagabond',
  Ferrailleur: 'ferrailleur',
  Endetté: 'endette',
  Accro: 'accro',
  Maudit: 'maudit',
  Marchand: 'marchand',
  Mécanicien: 'mecanicien',
  Explorateur: 'explorateur',
  Médecin: 'medecin',
  Contrebandier: 'contrebandier',
  Vétéran: 'veteran',
  Héritier: 'heritier',
  Hackeur: 'hackeur',
  'Seigneur de guerre': 'seigneurDeGuerre',
}

const TONE_BY_CLASS: Record<string, 'bad' | 'neutral' | 'good'> = {
  Vagabond: 'bad', Ferrailleur: 'bad', Endetté: 'bad', Accro: 'bad', Maudit: 'bad',
  Marchand: 'neutral', Mécanicien: 'neutral', Explorateur: 'neutral', Médecin: 'neutral',
  Contrebandier: 'good', Vétéran: 'good', Héritier: 'good', Hackeur: 'good', 'Seigneur de guerre': 'good',
}

const TONE_COLOR: Record<string, string> = {
  bad: 'var(--red)',
  neutral: 'var(--cyan)',
  good: 'var(--gold)',
}

export function IntroScreen() {
  const { t } = useTranslation('introScreen')
  const gs   = useGameStore(s => s.gs!)
  const goTo = useGameStore(s => s.goTo)

  const introKey = CLASS_INTRO_KEYS[gs.class.name]
  const tone = TONE_BY_CLASS[gs.class.name] ?? 'neutral'
  const lines: string[] = introKey
    ? (t(`classIntros.${introKey}.lines`, { returnObjects: true }) as unknown as string[])
    : (t('defaultIntro.lines', { returnObjects: true }) as unknown as string[])
  const objective = introKey ? t(`classIntros.${introKey}.objective`) : t('defaultIntro.objective')

  const accentColor = TONE_COLOR[tone]

  return (
    <div className="layout" style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div className="t-xs t-dim t-center" style={{ letterSpacing: '3px' }}>{t('briefingLabel')}</div>

      <div className="px-box" style={{ borderColor: accentColor, background: 'rgba(0,0,0,0.5)' }}>
        <div className="row" style={{ alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '20px' }}>{gs.class.icon}</span>
          <div>
            <div className="t-sm t-bright">{translateClassName(gs.class.name)}</div>
            <div className="t-xs" style={{ color: accentColor }}>{gs.class.tier === 'bad' ? t('difficultTag') : gs.class.tier === 'good' ? t('advancedTag') : t('balancedTag')}</div>
          </div>
        </div>

        <div className="col" style={{ gap: '10px', marginBottom: '20px' }}>
          {lines.map((line, i) => (
            <div key={i} className="t-xs" style={{ lineHeight: '2', color: i === lines.length - 1 ? 'var(--text-bright)' : 'var(--text)' }}>
              <TypewriterText text={line} speed={10} />
            </div>
          ))}
        </div>

        <div className="px-box" style={{ borderColor: accentColor, background: 'rgba(0,0,0,0.3)', marginBottom: '0' }}>
          <div className="t-xs" style={{ color: accentColor, lineHeight: '2' }}>
            {objective}
          </div>
        </div>
      </div>

      <div className="px-box" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="t-xs t-dim" style={{ lineHeight: '2' }}>
          {t('startInfo', { station: translateStationName(gs.currentStation), credits: gs.credits.toLocaleString(), fuel: gs.fuel, maxFuel: gs.maxFuel })}
        </div>
      </div>

      <div className="px-box" style={{ borderColor: 'var(--purple)', background: 'rgba(80,0,120,0.15)' }}>
        <div className="t-xs mb6" style={{ color: 'var(--purple)', letterSpacing: '2px' }}>{t('mainMissionLabel')}</div>
        <div className="t-xs t-bright mb6">{t('mainMissionTitle')}</div>
        <div className="t-xs t-dim" style={{ lineHeight: '2' }}>
          {t('mainMissionDesc')}
        </div>
        <div className="t-xs mt6" style={{ color: 'var(--purple)' }}>{t('fragmentsCollected', { count: gs.stationPiecesRallied })}</div>
      </div>

      <button className="px-btn px-btn--primary" onClick={() => goTo('station-hub')}>
        {t('startRun')}
      </button>
    </div>
  )
}

import { useTranslation } from 'react-i18next'
import { setLanguage, type SupportedLanguage } from '../../i18n/config'

export function LanguageToggle() {
  const { t, i18n } = useTranslation()
  const current = i18n.language as SupportedLanguage

  return (
    <div className="row gap4" style={{ alignItems: 'center' }}>
      {(['fr', 'en'] as const).map(lang => (
        <button
          key={lang}
          className={`px-btn px-btn--sm ${current === lang ? 'px-btn--primary' : ''}`}
          style={{ width: 'auto', padding: '2px 8px' }}
          onClick={() => setLanguage(lang)}
          title={t('language.label')}
        >
          {t(`language.${lang}`)}
        </button>
      ))}
    </div>
  )
}

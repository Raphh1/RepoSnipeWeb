import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Phase = 'lore' | 'title-big' | 'title-small' | 'done'

export function CinematicIntro({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation('cinematicIntro')
  const loreLines = t('loreLines', { returnObjects: true }) as unknown as string[]
  const [phase, setPhase]         = useState<Phase>('lore')
  const [lineIndex, setLineIndex] = useState(0)
  const [visible, setVisible]     = useState(true)
  const [skipped, setSkipped]     = useState(false)

  // Avance les lignes de lore
  useEffect(() => {
    if (phase !== 'lore' || skipped) return
    if (lineIndex >= loreLines.length) {
      const t = setTimeout(() => setPhase('title-big'), 1400)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setLineIndex(i => i + 1), 1800)
    return () => clearTimeout(t)
  }, [phase, lineIndex, skipped])

  // Transition titre grand → titre petit
  useEffect(() => {
    if (phase !== 'title-big') return
    const t = setTimeout(() => setPhase('title-small'), 2800)
    return () => clearTimeout(t)
  }, [phase])

  // Fin de la cinématique
  useEffect(() => {
    if (phase !== 'title-small') return
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 600)
    }, 1400)
    return () => clearTimeout(t)
  }, [phase, onDone])

  function skip() {
    setSkipped(true)
    setVisible(false)
    setTimeout(onDone, 300)
  }

  const showTitle   = phase === 'title-big' || phase === 'title-small'
  const titleSmall  = phase === 'title-small'

  return (
    <div
      onClick={skip}
      style={{
        position: 'fixed', inset: 0,
        background: '#06060f',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '0',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
        cursor: 'pointer',
        zIndex: 9999,
        padding: '40px',
      }}
    >
      {/* LORE */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '18px', marginBottom: showTitle ? '0' : '0',
        opacity: phase === 'lore' ? 1 : 0,
        transition: 'opacity 0.6s ease',
        position: 'absolute',
      }}>
        {loreLines.slice(0, lineIndex).map((line, i) => (
          <div key={i} style={{
            color: i < lineIndex - 1 ? 'rgba(160,160,220,0.5)' : '#d0d0f0',
            fontFamily: 'monospace',
            fontSize: '13px',
            letterSpacing: '1.5px',
            textAlign: 'center',
            animation: 'fadeIn 0.5s ease',
            transition: 'color 0.4s ease',
          }}>
            {line}
          </div>
        ))}
      </div>

      {/* TITRE */}
      <div style={{
        opacity: showTitle ? 1 : 0,
        transition: 'opacity 0.8s ease, font-size 0.8s ease, margin-bottom 0.8s ease, letter-spacing 0.8s ease',
        fontSize: titleSmall ? '22px' : '52px',
        letterSpacing: titleSmall ? '8px' : '16px',
        color: 'var(--gold)',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: titleSmall ? '32px' : '0',
        textShadow: '0 0 40px rgba(255,200,0,0.3)',
        position: titleSmall ? 'relative' : 'absolute',
      }}>
        {t('title')}
      </div>

      {/* SOUS-TITRE apparaît quand le titre rétrécit */}
      <div style={{
        opacity: titleSmall ? 1 : 0,
        transition: 'opacity 0.6s ease 0.4s',
        color: 'rgba(160,160,220,0.6)',
        fontFamily: 'monospace',
        fontSize: '10px',
        letterSpacing: '4px',
        textAlign: 'center',
        position: titleSmall ? 'relative' : 'absolute',
      }}>
        {t('subtitle')}
      </div>

      {/* Hint skip */}
      <div style={{
        position: 'absolute', bottom: '24px',
        color: 'rgba(100,100,150,0.5)',
        fontSize: '9px', letterSpacing: '2px',
        fontFamily: 'monospace',
      }}>
        {t('skipHint')}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
// Valeur : A=1, 2..10, J=11, Q=12, K=13
const VALUES = [1,2,3,4,5,6,7,8,9,10,11,12,13]
const POT_PER_ROUND = [100, 160, 240, 360, 500]  // gains par manche réussie

interface CardGameProps {
  onResult: (creditsWon: number) => void
}

function drawCard() { return Math.floor(Math.random() * 13) }

export function CardGame({ onResult }: CardGameProps) {
  const { t } = useTranslation('minigames')
  const [current, setCurrent]   = useState(drawCard)
  const [next, setNext]         = useState<number | null>(null)
  const [round, setRound]       = useState(0)        // 0-4
  const [pot, setPot]           = useState(0)
  const [phase, setPhase]       = useState<'choose' | 'reveal' | 'end'>('choose')
  const [win, setWin]           = useState<boolean | null>(null)
  const [streak, setStreak]     = useState(0)
  const MAX_ROUNDS = 5

  function guess(higher: boolean) {
    if (phase !== 'choose') return
    const drawn = drawCard()
    setNext(drawn)
    setPhase('reveal')

    const correct = higher ? VALUES[drawn] > VALUES[current] : VALUES[drawn] < VALUES[current]
    const tie = VALUES[drawn] === VALUES[current]

    setTimeout(() => {
      if (tie) {
        // Égalité : on redonne au joueur, on ne perd pas
        setCurrent(drawn)
        setNext(null)
        setPhase('choose')
        return
      }
      if (correct) {
        const earned = POT_PER_ROUND[round]
        setPot(p => p + earned)
        setWin(true)
        setStreak(s => s + 1)
        setTimeout(() => {
          setWin(null)
          if (round + 1 >= MAX_ROUNDS) {
            setPhase('end')
          } else {
            setCurrent(drawn)
            setNext(null)
            setRound(r => r + 1)
            setPhase('choose')
          }
        }, 900)
      } else {
        setWin(false)
        setTimeout(() => setPhase('end'), 900)
      }
    }, 700)
  }

  if (phase === 'end') {
    return (
      <div className="layout">
        <div className="t-xs t-dim t-center">{t('cardGame.header')}</div>
        <div className="px-box t-center" style={{ borderColor: pot > 0 ? 'var(--gold)' : 'var(--red)' }}>
          <div className="t-lg" style={{ color: pot > 0 ? 'var(--gold)' : 'var(--red)', marginBottom: '12px' }}>
            {pot > 0 ? t('cardGame.win') : t('cardGame.lose')}
          </div>
          <div className="t-sm" style={{ color: 'var(--gold)' }}>+{pot.toLocaleString()} cr</div>
          {streak >= MAX_ROUNDS && <div className="t-xs t-green mt8">{t('cardGame.perfectStreak')}</div>}
        </div>
        <button className="px-btn px-btn--primary" onClick={() => onResult(pot)}>
          {t('cardGame.collectAndLeave')}
        </button>
      </div>
    )
  }

  const cardBorderColor = win === true ? 'var(--green)' : win === false ? 'var(--red)' : 'var(--border-act)'

  return (
    <div className="layout">
      <div className="t-xs t-dim t-center">{t('cardGame.header')}</div>

      {/* Infos */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span className="t-xs t-dim">{t('cardGame.round', { round: round + 1, max: MAX_ROUNDS })}</span>
        <span className="t-xs t-gold">{t('cardGame.pot', { pot: pot.toLocaleString() })}</span>
      </div>

      {/* Cartes */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
        {/* Carte courante */}
        <div style={{
          width: '80px', height: '110px', background: 'var(--bg-panel)',
          border: `3px solid ${cardBorderColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `4px 4px 0 ${cardBorderColor}`,
        }}>
          <span style={{ fontSize: '20px', color: 'var(--text-bright)' }}>{RANKS[current]}</span>
        </div>

        <span className="t-xs t-dim">→</span>

        {/* Carte suivante (cachée ou révélée) */}
        <div style={{
          width: '80px', height: '110px', background: next !== null ? 'var(--bg-panel)' : 'var(--bg-panel2)',
          border: `3px solid ${next !== null ? cardBorderColor : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `4px 4px 0 ${next !== null ? cardBorderColor : 'var(--border)'}`,
        }}>
          {next !== null
            ? <span style={{ fontSize: '20px', color: win === true ? 'var(--green)' : win === false ? 'var(--red)' : 'var(--text-bright)' }}>{RANKS[next]}</span>
            : <span className="t-xl t-dim">?</span>
          }
        </div>
      </div>

      {/* Enjeu de la prochaine manche */}
      <div className="t-xs t-center" style={{ color: 'var(--gold)' }}>
        {t('cardGame.nextRound', { amount: POT_PER_ROUND[round].toLocaleString() })}
      </div>

      {/* Choix */}
      {phase === 'choose' && (
        <div className="grid2">
          <button className="px-btn px-btn--green" onClick={() => guess(true)}>{t('cardGame.higher')}</button>
          <button className="px-btn px-btn--danger" onClick={() => guess(false)}>{t('cardGame.lower')}</button>
        </div>
      )}
      {phase === 'reveal' && (
        <div className="px-box t-center">
          <div className="t-xs t-dim">...</div>
        </div>
      )}

      {/* Encaisser */}
      {pot > 0 && phase === 'choose' && (
        <button className="px-btn" onClick={() => setPhase('end')} style={{ color: 'var(--gold)', opacity: 0.7 }}>
          {t('cardGame.collectAmountAndLeave', { amount: pot.toLocaleString() })}
        </button>
      )}
    </div>
  )
}

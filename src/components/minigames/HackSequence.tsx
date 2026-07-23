import { useState, useEffect } from 'react'

const HEX_POOL = ['0F','1A','2B','3C','4D','5E','6F','7A','8B','9C','A0','B1','C2','D3','E4','F5','1C','2D','3E','4F']

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface HackSequenceProps {
  difficulty: 1 | 2 | 3
  onResult: (success: boolean) => void
}

export function HackSequence({ difficulty, onResult }: HackSequenceProps) {
  const codeCount = 3 + difficulty           // 4, 5 ou 6 codes
  const timeLimit = 14 - difficulty * 2      // 12, 10, 8 secondes

  const [sequence] = useState(() => shuffle(HEX_POOL).slice(0, codeCount))
  const [tiles]    = useState(() =>
    shuffle(sequence).map((code, i) => ({ code, id: i }))
  )
  const [step, setStep]       = useState(0)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [done, setDone]       = useState<'success' | 'fail' | null>(null)
  const [redId, setRedId]     = useState<number | null>(null)
  const [greenIds, setGreenIds] = useState<number[]>([])

  useEffect(() => {
    if (done) return
    if (timeLeft <= 0) {
      setDone('fail')
      setTimeout(() => onResult(false), 900)
      return
    }
    const t = setInterval(() => setTimeLeft(v => v - 1), 1000)
    return () => clearInterval(t)
  }, [timeLeft, done])

  function clickTile(tile: { code: string; id: number }) {
    if (done || greenIds.includes(tile.id)) return
    if (tile.code === sequence[step]) {
      const newGreen = [...greenIds, tile.id]
      setGreenIds(newGreen)
      const next = step + 1
      setStep(next)
      if (next >= sequence.length) {
        setDone('success')
        setTimeout(() => onResult(true), 700)
      }
    } else {
      setRedId(tile.id)
      setTimeLeft(v => Math.max(0, v - 3))
      setTimeout(() => setRedId(null), 350)
    }
  }

  const timerPct = (timeLeft / timeLimit) * 100

  return (
    <div className="layout">
      <div className="t-xs t-dim t-center">— INTRUSION SYSTÈME —</div>

      <div className="px-box">
        <div className="t-xs t-dim mb8">SÉQUENCE CIBLE</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {sequence.map((code, i) => (
            <span key={i} className="t-xs" style={{
              color: i < step ? 'var(--green)' : i === step ? 'var(--gold)' : 'var(--text)',
              opacity: i < step ? 0.4 : 1,
              textDecoration: i < step ? 'line-through' : 'none',
            }}>
              {i === step && '▶ '}[{code}]{i < sequence.length - 1 ? ' →' : ''}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span className="t-xs t-dim">TEMPS</span>
          <span className="t-xs" style={{ color: timeLeft <= 4 ? 'var(--red)' : 'var(--cyan)' }}>{timeLeft}s</span>
        </div>
        <div className="bar">
          <div className="bar__fill" style={{
            width: `${timerPct}%`,
            background: timerPct > 50 ? 'var(--cyan)' : timerPct > 25 ? 'var(--orange)' : 'var(--red)',
            transition: 'width 1s linear, background 0.3s',
          }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
        {tiles.map(tile => {
          const isGreen = greenIds.includes(tile.id)
          const isRed   = redId === tile.id
          return (
            <button key={tile.id} onClick={() => clickTile(tile)} style={{
              fontFamily: 'inherit', fontSize: '10px', padding: '14px 0', cursor: isGreen ? 'default' : 'pointer',
              background: isGreen ? '#0a2010' : isRed ? '#200a0a' : 'var(--bg-panel2)',
              border: `2px solid ${isGreen ? 'var(--green)' : isRed ? 'var(--red)' : 'var(--border-hi)'}`,
              color: isGreen ? 'var(--green)' : isRed ? 'var(--red)' : 'var(--text)',
              textAlign: 'center', opacity: isGreen ? 0.45 : 1,
              boxShadow: `2px 2px 0 ${isGreen ? 'var(--green)' : isRed ? 'var(--red)' : 'var(--border)'}`,
            }}>
              {tile.code}
            </button>
          )
        })}
      </div>

      {done && (
        <div className="px-box t-center" style={{ borderColor: done === 'success' ? 'var(--green)' : 'var(--red)' }}>
          <div className="t-sm" style={{ color: done === 'success' ? 'var(--green)' : 'var(--red)' }}>
            {done === 'success' ? '✓ ACCÈS OBTENU' : '✗ CONNEXION PERDUE'}
          </div>
        </div>
      )}
    </div>
  )
}

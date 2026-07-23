import { useState, useEffect, useRef } from 'react'
import type { Cargo } from '../../types'

const CONTRABAND = [
  'Armes illégales', 'Drogues de synthèse', 'Données volées', 'Pièces de contrebande',
  'Armes lourdes', 'Matériel de pillage', 'Matériaux interdits', 'Marchandises volées',
  'Objets de contrebande', 'Munitions spéciales', 'Butin de guerre', 'Intel faction',
  'Munitions lourdes',
]

function isContraband(name: string) {
  return CONTRABAND.some(c => name.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(name.toLowerCase()))
}

interface Props {
  cargo: Cargo
  maxHide: number
  onResult: (confiscated: string[], repChange: number) => void
}

export function CustomsGame({ cargo, maxHide, onResult }: Props) {
  const items = Object.entries(cargo)
  const [hidden, setHidden]     = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState(5)
  const [scanned, setScanned]   = useState(false)

  const doneRef     = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function doScan() {
    if (doneRef.current) return
    doneRef.current = true
    setScanned(true)
    if (intervalRef.current) clearInterval(intervalRef.current)
    const visible     = items.filter(([name]) => !hidden.has(name)).map(([name]) => name)
    const confiscated = visible.filter(isContraband)
    const repChange   = confiscated.length > 0 ? -15 * confiscated.length : 5
    onResult(confiscated, repChange)
  }

  useEffect(() => {
    if (items.length === 0) {
      onResult([], 5)
      return
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current!)
          doScan()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [])

  if (scanned || items.length === 0) return null

  function toggleHide(name: string) {
    setHidden(prev => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else if (next.size < maxHide) {
        next.add(name)
      }
      return next
    })
  }

  const hiddenCount = hidden.size
  const canHideMore = hiddenCount < maxHide

  return (
    <div className="layout">
      <div className="t-xs t-red t-center" style={{ letterSpacing: '3px' }}>⚠ CONTRÔLE DOUANIER ⚠</div>

      <div className="px-box" style={{ borderColor: 'var(--red)', background: 'rgba(180,0,0,0.05)' }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
          <div className="t-sm t-red">SCANNER EN APPROCHE</div>
          <div className="t-xs" style={{ color: timeLeft <= 3 ? 'var(--red)' : 'var(--orange)', fontWeight: 'bold' }}>⏱ {timeLeft}s</div>
        </div>
        <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
          <div style={{
            width: `${(timeLeft / 10) * 100}%`, height: '100%',
            background: timeLeft <= 3 ? 'var(--red)' : 'var(--orange)',
            transition: 'width 1s linear, background 0.3s',
          }} />
        </div>

        <div className="t-xs t-dim mb8" style={{ lineHeight: '2' }}>
          Un garde s'approche avec un scanner. Tu peux cacher{' '}
          <span style={{ color: canHideMore ? 'var(--cyan)' : 'var(--text-dim)' }}>
            {maxHide - hiddenCount}
          </span>{' '}
          item(s) supplémentaire(s). Clique sur les items suspects pour les dissimuler.
        </div>

        <div className="col gap4">
          {items.map(([name, qty]) => {
            const isHid     = hidden.has(name)
            const isSuspect = isContraband(name)
            const blocked   = !isHid && !canHideMore
            return (
              <button key={name} className="px-btn"
                style={{
                  borderColor: isHid ? 'var(--green)' : isSuspect ? 'var(--red)' : undefined,
                  color:       isHid ? 'var(--green)' : isSuspect ? 'var(--orange)' : undefined,
                  opacity:     blocked ? 0.4 : 1,
                  textAlign:   'left',
                  cursor:      blocked ? 'not-allowed' : 'pointer',
                }}
                onClick={() => !blocked && toggleHide(name)}>
                <span style={{ marginRight: '8px', minWidth: '70px', display: 'inline-block' }}>
                  {isHid ? '▼ CACHÉ' : isSuspect ? '⚠ SUSPECT' : '○ LÉGAL'}
                </span>
                {name} ×{qty}
              </button>
            )
          })}
        </div>

        <div className="t-xs t-dim mt8" style={{ fontStyle: 'italic' }}>
          Items avec ⚠ seront confisqués si visibles. Items cachés passent sans contrôle.
        </div>
      </div>

      <button className="px-btn px-btn--danger" onClick={doScan}>
        Lancer le scan maintenant
      </button>
    </div>
  )
}

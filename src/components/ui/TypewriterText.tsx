import { useState, useEffect } from 'react'

interface Props {
  text: string
  speed?: number   // ms par caractère
  onDone?: () => void
  className?: string
  style?: React.CSSProperties
}

export function TypewriterText({ text, speed = 22, onDone, className, style }: Props) {
  const [pos, setPos] = useState(0)

  useEffect(() => {
    setPos(0)
  }, [text])

  useEffect(() => {
    if (pos >= text.length) {
      onDone?.()
      return
    }
    const t = setTimeout(() => setPos(p => p + 1), speed)
    return () => clearTimeout(t)
  }, [pos, text, speed, onDone])

  function skip() {
    if (pos < text.length) setPos(text.length)
  }

  return (
    <span
      className={className}
      style={{ ...style, cursor: pos < text.length ? 'pointer' : undefined }}
      onClick={skip}
      title={pos < text.length ? 'Clic pour passer' : undefined}
    >
      {text.slice(0, pos)}
      {pos < text.length && <span className="blink" style={{ opacity: 0.7 }}>▌</span>}
    </span>
  )
}

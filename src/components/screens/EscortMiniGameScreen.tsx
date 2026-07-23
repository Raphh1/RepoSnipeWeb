import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../store/gameStore'

const GAME_DURATION = 25
const PLAYER_W = 20
const PLAYER_H = 12

interface Asteroid {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  hue: number
}

export function EscortMiniGameScreen() {
  const gs                  = useGameStore(s => s.gs!)
  const completeEscortQuest = useGameStore(s => s.completeEscortQuest)

  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const stateRef   = useRef({
    playerX: 80, playerY: 150,
    lives: 3,
    asteroids: [] as Asteroid[],
    keys: new Set<string>(),
    startTime: 0,
    invincibleUntil: 0,
    lastSpawn: 0,
    done: false,
  })

  const [lives, setLives]     = useState(3)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [result, setResult]   = useState<'won' | 'lost' | null>(null)

  const quest = gs.activeQuests.find(q => q.id === gs.pendingEscortQuestId)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || result) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width
    const H = canvas.height
    const s = stateRef.current
    s.startTime    = Date.now()
    s.done         = false
    s.lives        = 3
    s.playerX      = 80
    s.playerY      = H / 2
    s.asteroids    = []
    s.lastSpawn    = Date.now()
    s.invincibleUntil = 0

    const onMove = (e: MouseEvent) => {
      const r  = canvas.getBoundingClientRect()
      s.playerX = Math.max(PLAYER_W, Math.min(W - PLAYER_W, (e.clientX - r.left) * (W / r.width)))
      s.playerY = Math.max(PLAYER_H, Math.min(H - PLAYER_H, (e.clientY - r.top)  * (H / r.height)))
    }
    const onTouch = (e: TouchEvent) => {
      e.preventDefault()
      const r  = canvas.getBoundingClientRect()
      const t  = e.touches[0]
      s.playerX = Math.max(PLAYER_W, Math.min(W - PLAYER_W, (t.clientX - r.left) * (W / r.width)))
      s.playerY = Math.max(PLAYER_H, Math.min(H - PLAYER_H, (t.clientY - r.top)  * (H / r.height)))
    }
    const onKeyDown = (e: KeyboardEvent) => s.keys.add(e.key)
    const onKeyUp   = (e: KeyboardEvent) => s.keys.delete(e.key)

    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('touchmove', onTouch, { passive: false })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    let animId: number

    function loop() {
      if (s.done) return
      const now     = Date.now()
      const elapsed = (now - s.startTime) / 1000
      const remaining = Math.max(0, GAME_DURATION - elapsed)

      // Keyboard movement
      const spd = 4
      if (s.keys.has('ArrowUp')    || s.keys.has('z') || s.keys.has('Z') || s.keys.has('w') || s.keys.has('W')) s.playerY = Math.max(PLAYER_H, s.playerY - spd)
      if (s.keys.has('ArrowDown')  || s.keys.has('s') || s.keys.has('S')) s.playerY = Math.min(H - PLAYER_H, s.playerY + spd)
      if (s.keys.has('ArrowLeft')  || s.keys.has('q') || s.keys.has('Q') || s.keys.has('a') || s.keys.has('A')) s.playerX = Math.max(PLAYER_W, s.playerX - spd)
      if (s.keys.has('ArrowRight') || s.keys.has('d') || s.keys.has('D')) s.playerX = Math.min(W - PLAYER_W, s.playerX + spd)

      // Spawn asteroids — densité croissante
      const spawnInterval = Math.max(400, 1600 - elapsed * 45)
      if (now - s.lastSpawn > spawnInterval) {
        const r   = Math.random() * 16 + 8
        const vy0 = (Math.random() - 0.5) * 1.4
        s.asteroids.push({ x: W + r, y: Math.random() * (H - r * 2) + r, r, vx: -(Math.random() * 2.5 + 1.5), vy: vy0, hue: Math.random() * 30 + 10 })
        s.lastSpawn = now
      }

      // Move & cull asteroids
      s.asteroids = s.asteroids.filter(a => a.x + a.r > 0)
      for (const a of s.asteroids) {
        a.x += a.vx
        a.y += a.vy
        if (a.y - a.r < 0 || a.y + a.r > H) a.vy *= -1
      }

      // Hit detection (small ellipse hitbox)
      if (now > s.invincibleUntil) {
        for (const a of s.asteroids) {
          const dx = a.x - s.playerX
          const dy = a.y - s.playerY
          if (dx * dx / ((a.r + 10) * (a.r + 10)) + dy * dy / ((a.r + 8) * (a.r + 8)) < 1) {
            s.lives--
            s.invincibleUntil = now + 1600
            setLives(s.lives)
            if (s.lives <= 0) { s.done = true; setResult('lost'); return }
            break
          }
        }
      }

      // Win
      if (remaining <= 0) { s.done = true; setResult('won'); return }
      setTimeLeft(Math.ceil(remaining))

      // ── DRAW ──
      ctx.fillStyle = '#01030a'
      ctx.fillRect(0, 0, W, H)

      // Stars
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      for (let i = 0; i < 55; i++) {
        const sx = ((i * 173 + now * 0.025) % W + W) % W
        const sy = (i * 83) % H
        ctx.fillRect(sx, sy, 1, 1)
      }

      // Asteroids
      for (const a of s.asteroids) {
        ctx.beginPath()
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsl(${a.hue},55%,35%)`
        ctx.fill()
        ctx.strokeStyle = `hsl(${a.hue},40%,55%)`
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // Player ship (flicker when invincible)
      const flicker = now < s.invincibleUntil && Math.floor(now / 90) % 2 === 0
      if (!flicker) {
        ctx.save()
        ctx.translate(s.playerX, s.playerY)
        // Engine flame
        ctx.fillStyle = '#ff7700'
        ctx.beginPath(); ctx.ellipse(-PLAYER_W + 2, 0, 8, 4, 0, 0, Math.PI * 2); ctx.fill()
        // Hull
        ctx.fillStyle = '#00ccff'
        ctx.beginPath()
        ctx.moveTo(PLAYER_W, 0)
        ctx.lineTo(-PLAYER_W + 4, -PLAYER_H)
        ctx.lineTo(-PLAYER_W + 10, 0)
        ctx.lineTo(-PLAYER_W + 4, PLAYER_H)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = '#006688'
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.restore()
      }

      // HUD timer bar
      const timerPct = remaining / GAME_DURATION
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(8, 8, W - 16, 6)
      ctx.fillStyle = timerPct > 0.4 ? '#00ff88' : timerPct > 0.2 ? '#ffaa00' : '#ff3333'
      ctx.fillRect(8, 8, (W - 16) * timerPct, 6)

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('touchmove', onTouch)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [result])

  return (
    <div className="layout" style={{ alignItems: 'center' }}>
      <div className="t-center t-dim t-xs" style={{ letterSpacing: '2px' }}>— TRANSIT MÉTÉORITIQUE —</div>

      {quest && (
        <div className="t-xs t-dim t-center">
          Escorte : <span className="t-cyan">{quest.title}</span>
          <span className="t-dim" style={{ marginLeft: '8px' }}>→ {quest.targetStation}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '520px' }}>
        <div className="t-xs">
          {[0, 1, 2].map(i => (
            <span key={i} style={{ color: i < lives ? 'var(--red)' : 'var(--border-dim)', marginRight: '4px', fontSize: '16px' }}>♥</span>
          ))}
        </div>
        <div className="t-xs" style={{ color: timeLeft <= 5 ? 'var(--red)' : 'var(--text)' }}>
          <span className={timeLeft <= 5 ? 'blink' : ''}>{timeLeft}s</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={520}
        height={300}
        style={{ border: '2px solid var(--cyan)', display: 'block', maxWidth: '100%', cursor: 'none', touchAction: 'none' }}
      />

      <div className="t-xs t-dim t-center">
        Souris · ZQSD · Flèches — Survie {GAME_DURATION}s pour livrer le passager
      </div>

      {result && (
        <div className="px-box" style={{ borderColor: result === 'won' ? 'var(--gold)' : 'var(--red)', textAlign: 'center', maxWidth: '520px', width: '100%' }}>
          {result === 'won' ? (
            <>
              <div className="t-lg t-gold mb4">★ PASSAGER LIVRÉ</div>
              <div className="t-xs t-dim">Le transit s'est passé sans pertes majeures.</div>
              {quest && <div className="t-xs t-cyan mt4">+{quest.creditReward.toLocaleString()} cr · +{quest.repReward} rép</div>}
            </>
          ) : (
            <>
              <div className="t-lg t-red mb4">✕ PASSAGER PERDU</div>
              <div className="t-xs t-dim">Le vaisseau a encaissé trop de météorites. Le passager n'a pas survécu.</div>
              <div className="t-xs t-red mt4">Quête échouée · −20 PV de vaisseau</div>
            </>
          )}
          <button
            className="px-btn mt8"
            style={{ borderColor: result === 'won' ? 'var(--gold)' : 'var(--red)', color: result === 'won' ? 'var(--gold)' : 'var(--red)' }}
            onClick={() => completeEscortQuest(result === 'won')}
          >
            CONTINUER →
          </button>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { buildRunSummary } from '../../engine/meta'
import { useMetaStore } from '../../store/metaStore'
import {
  NEXUS_FRAGMENTS, attemptNexusFragment, canAttempt,
  isFragmentAvailable, getPillarStandingLabel,
  type NexusAction
} from '../../engine/nexus'
import { BOSS_STATIONS } from '../../data/stations'
import { TIER_BOSS } from '../../data/enemies'

type ViewState = 'list' | 'detail'

const PILLAR_COLORS: Record<string, string> = {
  alanossa: 'var(--red)',
  cesarion: 'var(--cyan)',
  eliotis:  'var(--purple)',
  scotty:   'var(--gold)',
}

const ACTION_LABELS: Record<NexusAction, string> = {
  force:    '⚔ Forcer — affronter le gardien',
  pay:      '💰 Payer — transaction directe',
  alliance: '🤝 Alliance — standing & réputation',
  legendary:'⚡ Offrir une arme légendaire (Tier 5)',
  gamble:   '🎲 Parier — mise au casino (50/50)',
  steal:    '🌑 Voler — classe voleur requise',
  lore:     '◆ Mémoire — par la connaissance du Nexus',
}

const ACTIONS_BY_FRAGMENT: Record<number, NexusAction[]> = {
  0: ['force', 'pay', 'alliance', 'steal'],
  1: ['force', 'pay', 'alliance', 'legendary'],
  2: ['force', 'alliance', 'legendary', 'lore'],
  3: ['force', 'pay', 'alliance', 'gamble'],
}

const PATH_LABELS: Record<NexusAction, string> = {
  force:    'Par la force',
  pay:      'Par l\'argent',
  alliance: 'Par l\'alliance',
  legendary:'Par le sacrifice',
  gamble:   'Par le hasard',
  steal:    'Par la ruse',
  lore:     'Par la mémoire',
}

export function NexusScreen() {
  const gs              = useGameStore(s => s.gs!)
  const goTo            = useGameStore(s => s.goTo)
  const patch           = useGameStore(s => s.patch)
  const startCombat     = useGameStore(s => s.startCombat)
  const collectFragment = useGameStore(s => s.collectNexusFragment)

  const [view, setView]       = useState<ViewState>('list')
  const [selected, setSelected] = useState<number>(0)
  const [msg, setMsg]         = useState<string | null>(null)
  const [msgOk, setMsgOk]     = useState(false)

  const collected = gs.nexusFragments ?? []
  const nexusPath = gs.nexusPath ?? {}

  function attempt(idx: number, action: NexusAction) {
    const result = attemptNexusFragment(gs, idx, action)

    if (!result.success) {
      if (result.newGs) patch(result.newGs)
      setMsg(result.message)
      setMsgOk(false)
      return
    }

    if (result.triggerCombat) {
      if (result.newGs) patch(result.newGs)
      const bossName = result.pillarBossName ?? 'Gardien du Fragment'
      // Trouver le boss correspondant dans TIER_BOSS
      const boss = TIER_BOSS.find(b => b.name === bossName) ?? { ...TIER_BOSS[0], name: bossName }
      startCombat({ ...boss, isBoss: true, captureChance: 0, killChance: 30 })
      // On marquera le fragment après le combat via la victoire
      patch({ nexusPath: { ...nexusPath, [idx]: action } })
      return
    }

    if (result.newGs) patch(result.newGs)
    collectFragment(idx)
    patch({ nexusPath: { ...nexusPath, [idx]: action } })
    setMsg(result.message)
    setMsgOk(true)
  }

  // ── VUE DÉTAIL ───────────────────────────────────────────────────────────
  if (view === 'detail') {
    const f = NEXUS_FRAGMENTS[selected]
    const isOwned = collected.includes(selected)
    const isHere = isFragmentAvailable(gs, selected)
    const color = PILLAR_COLORS[f.pillar] ?? 'var(--text)'
    const standing = (gs.pillarStanding ?? {} as any)[f.pillar] ?? 0
    const actions = ACTIONS_BY_FRAGMENT[selected] ?? []

    return (
      <div className="layout">
        <div className="row" style={{ gap: '12px', alignItems: 'center' }}>
          <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => { setView('list'); setMsg(null) }}>
            ← RETOUR
          </button>
          <div className="t-sm" style={{ color, flex: 1 }}>{f.name}</div>
          {isOwned && <div className="tag" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>COLLECTÉ · {PATH_LABELS[nexusPath[selected]!] ?? '?'}</div>}
        </div>

        <div className="px-box" style={{ borderColor: color }}>
          <div className="t-xs t-dim" style={{ fontStyle: 'italic', lineHeight: '2.2' }}>{f.lore}</div>
        </div>

        <div className="px-box" style={{ padding: '8px 14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="t-xs t-dim">Gardien</span>
              <span className="t-xs" style={{ color }}>{f.pillar.charAt(0).toUpperCase() + f.pillar.slice(1)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="t-xs t-dim">Station</span>
              <span className="t-xs">{f.station}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="t-xs t-dim">Ton standing</span>
              <span className="t-xs" style={{ color: standing >= 20 ? 'var(--green)' : standing <= -20 ? 'var(--red)' : 'var(--text)' }}>
                {standing > 0 ? '+' : ''}{standing} — {getPillarStandingLabel(gs, f.pillar as any)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="t-xs t-dim">Position actuelle</span>
              <span className="t-xs" style={{ color: isHere ? 'var(--green)' : 'var(--dim)' }}>
                {isHere ? '✓ Sur place' : gs.currentStation}
              </span>
            </div>
          </div>
        </div>

        {msg && (
          <div className="px-box" style={{ borderColor: msgOk ? 'var(--gold)' : 'var(--red)' }}>
            <div className="t-xs" style={{ color: msgOk ? 'var(--gold)' : 'var(--red)', lineHeight: '2' }}>{msg}</div>
            <button className="px-btn px-btn--sm mt8" style={{ width: 'auto' }} onClick={() => setMsg(null)}>OK</button>
          </div>
        )}

        {isOwned && (
          <div className="px-box" style={{ borderColor: 'var(--gold)', textAlign: 'center' }}>
            <div className="t-gold">★ Fragment en ta possession</div>
            <div className="t-xs t-dim mt4">Obtenu {PATH_LABELS[nexusPath[selected]!] ?? ''}</div>
          </div>
        )}

        {!isOwned && !isHere && (
          <div className="px-box" style={{ borderColor: 'var(--dim)' }}>
            <div className="t-xs t-dim">Tu dois être à <span className="t-bright">{f.station}</span> pour tenter d'obtenir ce fragment.</div>
          </div>
        )}

        {!isOwned && isHere && (
          <div className="col gap4">
            <div className="t-xs t-dim" style={{ padding: '0 4px' }}>Méthodes disponibles :</div>
            {actions.map(action => {
              const check = canAttempt(gs, selected, action)
              return (
                <div key={action}>
                  <button
                    className={`px-btn ${action === 'force' ? 'px-btn--danger' : ''}`}
                    disabled={!check.ok}
                    style={{ opacity: check.ok ? 1 : 0.5 }}
                    onClick={() => attempt(selected, action)}
                  >
                    {ACTION_LABELS[action]}
                  </button>
                  {!check.ok && check.reason && (
                    <div className="t-xs t-dim" style={{ padding: '2px 8px' }}>↳ {check.reason}</div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── VUE LISTE ────────────────────────────────────────────────────────────
  const isComplete = collected.length >= 4

  return (
    <div className="layout">
      <div className="row" style={{ alignItems: 'center', gap: '12px' }}>
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => goTo('station-hub')}>← RETOUR</button>
        <div className="t-sm t-bright" style={{ flex: 1 }}>STATION NEXUS</div>
        <div className="t-xs t-dim">{collected.length}/4</div>
      </div>

      <div className="px-box" style={{ borderColor: 'var(--purple)' }}>
        <div className="t-xs t-purple mb4">ARC PRINCIPAL</div>
        <div className="t-xs t-dim" style={{ lineHeight: '2' }}>
          Quatre gardiens. Quatre fragments. Quatre façons de les obtenir — ou pas.
          Le Nexus ne s'active qu'une fois tous les fragments réunis. La manière dont tu les as obtenus définira ce que tu es.
        </div>
      </div>

      {isComplete && (
        <div className="px-box" style={{ borderColor: 'var(--gold)', textAlign: 'center' }}>
          <div className="t-lg t-gold mb8">★ TOUS LES FRAGMENTS RASSEMBLÉS ★</div>
          <div className="t-xs t-dim mb8">
            {Object.values(nexusPath).map((p, i) => (
              <span key={i} style={{ marginRight: '12px', color: 'var(--gold)' }}>{PATH_LABELS[p as NexusAction]}</span>
            ))}
          </div>
          <button className="px-btn px-btn--primary" onClick={() => {
            const summary = buildRunSummary(gs, true)
            useMetaStore.getState().addRunSummary(summary)
            goTo('victory')
          }}>
            ACTIVER LA STATION NEXUS →
          </button>
        </div>
      )}

      <div className="col gap4">
        {NEXUS_FRAGMENTS.map((f) => {
          const owned = collected.includes(f.idx)
          const here  = isFragmentAvailable(gs, f.idx)
          const color = PILLAR_COLORS[f.pillar] ?? 'var(--text)'
          const standing = (gs.pillarStanding ?? {} as any)[f.pillar] ?? 0

          return (
            <button
              key={f.idx}
              className="px-box"
              style={{
                borderColor: owned ? 'var(--gold)' : here ? color : 'var(--border)',
                textAlign: 'left', cursor: 'pointer',
                background: owned ? 'rgba(180,140,0,0.06)' : 'transparent',
                width: '100%',
              }}
              onClick={() => { setSelected(f.idx); setView('detail'); setMsg(null) }}
            >
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: '6px' }}>
                <div className="t-sm" style={{ color: owned ? 'var(--gold)' : here ? color : 'var(--text-dim)' }}>
                  {owned ? '★ ' : `${f.idx + 1}. `}{f.name}
                </div>
                <div className="tag" style={{
                  borderColor: owned ? 'var(--gold)' : here ? color : 'var(--dim)',
                  color: owned ? 'var(--gold)' : here ? color : 'var(--dim)',
                  fontSize: '9px'
                }}>
                  {owned ? PATH_LABELS[nexusPath[f.idx]!] ?? 'COLLECTÉ' : here ? 'DISPONIBLE' : f.station}
                </div>
              </div>
              <div className="t-xs t-dim" style={{ lineHeight: '1.8' }}>{f.lore.slice(0, 90)}…</div>
              {!owned && (
                <div className="t-xs" style={{ marginTop: '4px', color: standing >= 20 ? 'var(--green)' : 'var(--dim)' }}>
                  Standing {f.pillar}: {standing > 0 ? '+' : ''}{standing} — {getPillarStandingLabel(gs, f.pillar as any)}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

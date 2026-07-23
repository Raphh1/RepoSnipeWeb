import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { buildRunSummary } from '../../engine/meta'
import { useMetaStore } from '../../store/metaStore'
import {
  NEXUS_FRAGMENTS, attemptNexusFragment, canAttempt,
  isFragmentAvailable, getPillarStandingLabel, getWarAvailableFragments,
  HOLDER_BOUNTY_HUNTERS, ARC_PERDU_CLUES,
  getActionSuccessChance, getChanceLabel,
  type NexusAction
} from '../../engine/nexus'
import { BOSS_STATIONS, STATIONS } from '../../data/stations'
import { TIER_BOSS } from '../../data/enemies'
import { getSubBossProgress, arePillarSubBossesCleared, getSubBossesForPillar, getLieutenantClueText } from '../../data/subBosses'
import type { SubBossData } from '../../types'

type ViewState = 'list' | 'detail'

const PILLAR_COLORS: Record<string, string> = {
  alanossa: 'var(--red)',
  cesarion: 'var(--cyan)',
  raphazarus: 'var(--purple)',
  scotty:   'var(--gold)',
}

const ACTION_LABELS: Record<NexusAction, string> = {
  force:      '⚔ Forcer — affronter le gardien en combat',
  pay:        '💰 Payer 200 000 cr — 50/50, quoi qu\'il arrive',
  alliance:   '🤝 Alliance — standing & réputation',
  gamble:     '🎲 Parier — mise au casino (50/50)',
  steal:      '🌑 Voler — via une visite privée (réputation)',
  lore:       '◆ Mémoire — par la connaissance du Nexus',
  war:        '⚔💥 Déclencher une guerre entre détenteurs',
  manipulate: '🎭 Entourloupe — convaincre sans combat',
}

// "steal" n'est plus un bouton d'action instantané : il se déclenche tout seul
// en visitant la station du détenteur avec une réputation suffisante (visite
// privée — voir bossHomeVisits.ts). Il n'apparaît donc dans aucune liste ici.
const ACTIONS_BY_FRAGMENT: Record<number, NexusAction[]> = {
  0: ['force', 'pay', 'alliance', 'war', 'manipulate'],
  1: ['force', 'alliance', 'war', 'manipulate'],
  2: ['force', 'alliance', 'war', 'manipulate'],
  3: ['force', 'alliance', 'gamble', 'war', 'manipulate'],
}

const ACTION_DANGER: Partial<Record<NexusAction, string>> = {
  force:    'var(--red)',
  war:      'var(--orange)',
  manipulate: 'var(--purple)',
}

const PATH_LABELS: Record<NexusAction, string> = {
  force:      'Par la force',
  pay:        "Par l'argent",
  alliance:   'Par l\'alliance',
  gamble:     'Par le hasard',
  steal:      'Par la ruse',
  lore:       'Par la mémoire',
  war:        'Par la guerre',
  manipulate: 'Par la manipulation',
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
  const [goldFlash, setGoldFlash] = useState(false)
  const [guessInput, setGuessInput] = useState<Record<string, string>>({})
  const [wrongGuessId, setWrongGuessId] = useState<string | null>(null)

  const collected = gs.nexusFragments ?? []
  const nexusPath = gs.nexusPath ?? {}

  function submitLieutenantGuess(sb: SubBossData) {
    const guess = guessInput[sb.id]
    if (!guess) return
    setGuessInput(prev => ({ ...prev, [sb.id]: '' }))
    if (guess === sb.station) {
      patch({ lieutenantLocationsKnown: [...(gs.lieutenantLocationsKnown ?? []), sb.id] })
      setWrongGuessId(null)
    } else {
      setWrongGuessId(sb.id)
    }
  }

  function attempt(idx: number, action: NexusAction) {
    const result = attemptNexusFragment(gs, idx, action)

    // Guerre déclenchée — succès = false mais on enregistre la guerre
    if (result.triggersWar) {
      const war = {
        holderA: result.triggersWar.holderA,
        holderB: result.triggersWar.holderB,
        startDay: gs.day,
        resolved: false,
      }
      patch({ ...(result.newGs ?? {}), nexusWars: [...(gs.nexusWars ?? []), war] })
      setMsg(`⚔ GUERRE DÉCLENCHÉE — ${war.holderA} vs ${war.holderB}. Reviens dans 4 jours après ton prochain voyage. ${result.message}`)
      setMsgOk(true)
      return
    }

    if (!result.success) {
      if (result.newGs) patch(result.newGs)
      // Combat forcé après échec de manipulation
      if (result.triggerCombat) {
        const bossName = result.pillarBossName ?? 'Gardien du Fragment'
        const boss = TIER_BOSS.find(b => b.name === bossName) ?? { ...TIER_BOSS[0], name: bossName }
        startCombat({ ...boss, isBoss: true, captureChance: 0, killChance: 30 })
        patch({ nexusPath: { ...nexusPath, [idx]: 'force' } })
      }
      setMsg(result.message)
      setMsgOk(false)
      return
    }

    if (result.triggerCombat) {
      if (result.newGs) patch(result.newGs)
      const bossName = result.pillarBossName ?? 'Gardien du Fragment'
      const boss = TIER_BOSS.find(b => b.name === bossName) ?? { ...TIER_BOSS[0], name: bossName }
      startCombat({ ...boss, isBoss: true, captureChance: 0, killChance: 30 })
      patch({ nexusPath: { ...nexusPath, [idx]: action } })
      return
    }

    if (result.newGs) patch(result.newGs)

    // Trahison — spawn bounty hunter immédiat
    if (result.spawnsBounty && !gs.stalker) {
      const pillarMap: Record<number, string> = { 0: 'alanossa', 1: 'cesarion', 2: 'raphazarus', 3: 'scotty' }
      const pillar = pillarMap[idx]
      const bounty = HOLDER_BOUNTY_HUNTERS[pillar]
      if (bounty) {
        patch({
          stalker: {
            name: bounty.name,
            station: gs.currentStation,
            closingIn: true,
            daysSinceLastSeen: gs.day,
            threatLevel: bounty.threatLevel,
            daysActive: 0,
          },
        })
      }
    }

    collectFragment(idx)
    patch({ nexusPath: { ...nexusPath, [idx]: action } })
    setMsg(result.message)
    setMsgOk(true)
    setGoldFlash(true)
    setTimeout(() => setGoldFlash(false), 800)
  }

  // ── VUE DÉTAIL ───────────────────────────────────────────────────────────
  if (view === 'detail') {
    const f = NEXUS_FRAGMENTS[selected]
    const isOwned = collected.includes(selected)
    const isHere = isFragmentAvailable(gs, selected)
    const isWarAvailable = getWarAvailableFragments(gs).includes(selected)
    const color = PILLAR_COLORS[f.pillar] ?? 'var(--text)'
    const standing = ((gs.pillarStanding ?? {}) as Record<string, number>)[f.pillar] ?? 0
    const isAngered = (gs.nexusAngered ?? []).includes(f.pillar)
    const activeWar = (gs.nexusWars ?? []).find(w => !w.resolved && (w.holderA === f.pillar || w.holderB === f.pillar))
    const actions = ACTIONS_BY_FRAGMENT[selected] ?? []

    return (
      <div className={`layout ${goldFlash ? 'gold-flash' : ''}`}>
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

        {/* Sub-boss progress */}
        {(() => {
          const sbProg = getSubBossProgress(gs.subBossesDefeated ?? {}, f.pillar)
          const sbCleared = arePillarSubBossesCleared(gs.subBossesDefeated ?? {}, f.pillar)
          const subs = getSubBossesForPillar(f.pillar, gs)
          const pillarDefeated = gs.subBossesDefeated?.[f.pillar] ?? []
          const locationsKnown = gs.lieutenantLocationsKnown ?? []
          const clueLevels = gs.lieutenantClueLevels ?? {}
          const nextSb = subs.find(sb => !pillarDefeated.includes(sb.id))
          return (
            <div className="px-box" style={{ borderColor: sbCleared ? 'var(--green)' : 'var(--orange)' }}>
              <div className="t-xs mb4" style={{ color: sbCleared ? 'var(--green)' : 'var(--orange)', letterSpacing: '1px' }}>
                ⚔ LIEUTENANTS ({sbProg.done}/{sbProg.total})
              </div>
              {subs.map(sb => {
                const done = pillarDefeated.includes(sb.id)
                const known = done || locationsKnown.includes(sb.id)
                return (
                  <div key={sb.id} className="col gap4" style={{ marginBottom: '4px' }}>
                    <div className="t-xs" style={{ color: done ? 'var(--green)' : 'var(--dim)', lineHeight: 2 }}>
                      {done ? '✓' : '○'} {sb.order}. {known ? sb.name : '???'} — {known ? sb.station : 'Lieu inconnu'}
                    </div>
                    {!done && sb.id === nextSb?.id && !known && (clueLevels[sb.id] ?? 0) > 0 && (
                      <div className="t-xs" style={{ color: 'var(--cyan)', lineHeight: 1.6, marginLeft: '14px' }}>
                        Indice : {getLieutenantClueText(gs, sb, clueLevels[sb.id] ?? 0)}
                      </div>
                    )}
                    {!done && sb.id === nextSb?.id && !known && (
                      <div className="row gap4" style={{ marginLeft: '14px', alignItems: 'center' }}>
                        <select
                          className="t-xs"
                          style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', padding: '2px 4px' }}
                          value={guessInput[sb.id] ?? ''}
                          onChange={e => setGuessInput(prev => ({ ...prev, [sb.id]: e.target.value }))}
                        >
                          <option value="">Deviner la station…</option>
                          {STATIONS.map(st => <option key={st.name} value={st.name}>{st.name}</option>)}
                        </select>
                        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => submitLieutenantGuess(sb)}>
                          🔍 Deviner
                        </button>
                        {wrongGuessId === sb.id && <span className="t-xs t-red">Pas là.</span>}
                      </div>
                    )}
                  </div>
                )
              })}
              {!sbCleared && (
                <div className="t-xs t-red mt4">⛔ Ordre obligatoire — vaincre le lieutenant 1, puis le 2, etc. Impossible d'accéder à un lieutenant tant que le précédent n'est pas battu.</div>
              )}
            </div>
          )
        })()}

        {/* Statuts spéciaux */}
        {isAngered && (
          <div className="px-box" style={{ borderColor: 'var(--red)' }}>
            <div className="t-xs t-red">⚠ ENNEMI PERMANENT — {f.pillar.charAt(0).toUpperCase() + f.pillar.slice(1)} te cherche. Seul le combat est possible. Un chasseur est probablement déjà sur ta trace.</div>
          </div>
        )}
        {activeWar && (
          <div className="px-box" style={{ borderColor: 'var(--orange)' }}>
            <div className="t-xs" style={{ color: 'var(--orange)' }}>
              ⚔ GUERRE EN COURS — {activeWar.holderA} vs {activeWar.holderB} · Jour {activeWar.startDay} → résolution dans {Math.max(0, 4 - (gs.day - activeWar.startDay))} voyage(s)
            </div>
          </div>
        )}
        {isWarAvailable && !isOwned && (
          <div className="px-box" style={{ borderColor: 'var(--orange)' }}>
            <div className="t-xs" style={{ color: 'var(--orange)' }}>⚔ Fragment récupérable — le gardien a perdu la guerre que tu as déclenchée. Il est affaibli.</div>
          </div>
        )}

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

        {/* Raphazarus — progression Arc Perdu */}
        {f.pillar === 'raphazarus' && !isOwned && (
          <div className="px-box" style={{ borderColor: gs.arcPerduUnlocked ? 'var(--green)' : 'var(--purple)' }}>
            <div className="t-xs mb4" style={{ color: gs.arcPerduUnlocked ? 'var(--green)' : 'var(--purple)', letterSpacing: '1px' }}>
              {gs.arcPerduUnlocked ? '✓ L\'ARC PERDU LOCALISÉ' : '◆ RECHERCHE DE L\'ARC PERDU'}
            </div>
            {!gs.arcPerduUnlocked && (
              <>
                <div className="t-xs t-dim" style={{ lineHeight: 2 }}>
                  L'Arc Perdu est introuvable. Parle aux PNJs dans les stations pour collecter des indices.
                </div>
                <div className="t-xs mt4" style={{ color: 'var(--purple)' }}>
                  Indices : {(gs.arcPerduClues ?? []).length}/4
                </div>
                {ARC_PERDU_CLUES.filter(c => (gs.arcPerduClues ?? []).includes(c.id)).map(c => (
                  <div key={c.id} className="t-xs" style={{ color: 'var(--dim)', lineHeight: 2 }}>
                    ✓ {c.clueText}
                  </div>
                ))}
              </>
            )}
            {gs.arcPerduUnlocked && !gs.raphazarusActivated && (
              <div className="t-xs t-dim" style={{ lineHeight: 2 }}>
                La station est sur ta carte. Raphazarus ne s'est pas encore manifesté.
              </div>
            )}
            {gs.raphazarusActivated && (
              <div className="t-xs t-red" style={{ lineHeight: 2 }}>
                ⚠ Raphazarus est en alerte — ses guerriers te traquent sur les routes.
              </div>
            )}
          </div>
        )}

        {/* Scotty — progression gambling */}
        {f.pillar === 'scotty' && !isOwned && (gs.scottyGambleWins ?? 0) > 0 && (
          <div className="px-box" style={{ borderColor: 'var(--gold)' }}>
            <div className="t-xs" style={{ color: 'var(--gold)' }}>
              🎲 Progression gambling : {gs.scottyGambleWins}/3 manches gagnées
            </div>
          </div>
        )}

        {!isOwned && !isHere && !isWarAvailable && (
          <div className="px-box" style={{ borderColor: 'var(--dim)' }}>
            <div className="t-xs t-dim">Tu dois être à <span className="t-bright">{f.station}</span> pour tenter d'obtenir ce fragment.</div>
          </div>
        )}

        {!isOwned && isHere && (
          <div className="col gap4">
            <div className="t-xs t-dim" style={{ padding: '0 4px' }}>Méthodes disponibles :</div>
            {actions.map(action => {
              const check = canAttempt(gs, selected, action)
              const dangerColor = ACTION_DANGER[action]
              const isDanger = action === 'force' || !!dangerColor
              const chance = getActionSuccessChance(selected, action)
              const chanceInfo = chance !== null ? getChanceLabel(chance) : null
              return (
                <div key={action}>
                  <button
                    className={`px-btn ${action === 'force' ? 'px-btn--danger' : ''}`}
                    disabled={!check.ok}
                    style={{
                      opacity: check.ok ? 1 : 0.5,
                      ...(dangerColor && action !== 'force' ? { borderColor: dangerColor, color: dangerColor } : {}),
                    }}
                    onClick={() => attempt(selected, action)}
                  >
                    <span>{ACTION_LABELS[action]}</span>
                    {chanceInfo && chance !== null && chance < 100 && (
                      <span className="t-xs" style={{ marginLeft: '8px', color: chanceInfo.color }}>{chance}% — {chanceInfo.label}</span>
                    )}
                    {isDanger && action !== 'force' && <span className="t-xs t-dim" style={{ marginLeft: '8px' }}>⚠ conséquences permanentes</span>}
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

      {/* Guerres actives */}
      {(gs.nexusWars ?? []).filter(w => !w.resolved).length > 0 && (
        <div className="px-box" style={{ borderColor: 'var(--orange)' }}>
          <div className="t-xs" style={{ color: 'var(--orange)', marginBottom: '4px' }}>⚔ GUERRES EN COURS</div>
          {(gs.nexusWars ?? []).filter(w => !w.resolved).map((w, i) => (
            <div key={i} className="t-xs t-dim">
              {w.holderA.charAt(0).toUpperCase() + w.holderA.slice(1)} vs {w.holderB.charAt(0).toUpperCase() + w.holderB.slice(1)} — résolution dans {Math.max(0, 4 - (gs.day - w.startDay))} voyage(s)
            </div>
          ))}
        </div>
      )}

      {/* Fragments récupérables après guerre */}
      {getWarAvailableFragments(gs).length > 0 && (
        <div className="px-box" style={{ borderColor: 'var(--orange)', background: 'rgba(255,140,0,0.06)' }}>
          <div className="t-xs" style={{ color: 'var(--orange)' }}>⚔ FRAGMENTS RÉCUPÉRABLES — Va sur place pour les prendre au vainqueur affaibli</div>
        </div>
      )}

      <div className="col gap4">
        {NEXUS_FRAGMENTS.map((f) => {
          const owned = collected.includes(f.idx)
          const here  = isFragmentAvailable(gs, f.idx)
          const warAvail = getWarAvailableFragments(gs).includes(f.idx)
          const angered = (gs.nexusAngered ?? []).includes(f.pillar)
          const color = PILLAR_COLORS[f.pillar] ?? 'var(--text)'
          const standing = ((gs.pillarStanding ?? {}) as Record<string, number>)[f.pillar] ?? 0
          const borderCol = owned ? 'var(--gold)' : angered ? 'var(--red)' : warAvail ? 'var(--orange)' : here ? color : 'var(--border)'

          return (
            <button
              key={f.idx}
              className="px-box"
              style={{
                borderColor: borderCol,
                textAlign: 'left', cursor: 'pointer',
                background: owned ? 'rgba(180,140,0,0.06)' : angered ? 'rgba(255,60,60,0.04)' : 'transparent',
                width: '100%',
              }}
              onClick={() => { setSelected(f.idx); setView('detail'); setMsg(null) }}
            >
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: '6px' }}>
                <div className="t-sm" style={{ color: owned ? 'var(--gold)' : angered ? 'var(--red)' : here ? color : 'var(--text-dim)' }}>
                  {owned ? '★ ' : angered ? '⚠ ' : `${f.idx + 1}. `}{f.name}
                </div>
                <div className="tag" style={{
                  borderColor: owned ? 'var(--gold)' : angered ? 'var(--red)' : warAvail ? 'var(--orange)' : here ? color : 'var(--dim)',
                  color:       owned ? 'var(--gold)' : angered ? 'var(--red)' : warAvail ? 'var(--orange)' : here ? color : 'var(--dim)',
                  fontSize: '9px'
                }}>
                  {owned ? PATH_LABELS[nexusPath[f.idx]!] ?? 'COLLECTÉ' : angered ? 'ENNEMI' : warAvail ? '⚔ RÉCUPÉRABLE' : here ? 'DISPONIBLE' : f.station}
                </div>
              </div>
              <div className="t-xs t-dim" style={{ lineHeight: '1.8' }}>{f.lore.slice(0, 90)}…</div>
              {!owned && (() => {
                const sbProg = getSubBossProgress(gs.subBossesDefeated ?? {}, f.pillar)
                const sbCleared = arePillarSubBossesCleared(gs.subBossesDefeated ?? {}, f.pillar)
                return (
                  <>
                    <div className="t-xs" style={{ marginTop: '4px', color: angered ? 'var(--red)' : standing >= 20 ? 'var(--green)' : 'var(--dim)' }}>
                      {angered
                        ? '🗡 Te cherche — combat uniquement'
                        : `Standing ${f.pillar}: ${standing > 0 ? '+' : ''}${standing} — ${getPillarStandingLabel(gs, f.pillar as any)}`
                      }
                    </div>
                    <div className="t-xs" style={{ marginTop: '2px', color: sbCleared ? 'var(--green)' : 'var(--orange)' }}>
                      {sbCleared
                        ? `✓ Lieutenants éliminés (${sbProg.done}/${sbProg.total})`
                        : `⚔ Lieutenants : ${sbProg.done}/${sbProg.total} vaincus`
                      }
                    </div>
                    {f.pillar === 'raphazarus' && !gs.arcPerduUnlocked && (
                      <div className="t-xs" style={{ marginTop: '2px', color: 'var(--purple)' }}>
                        ◆ Arc Perdu : {(gs.arcPerduClues ?? []).length}/4 indices
                      </div>
                    )}
                    {f.pillar === 'scotty' && (gs.scottyGambleWins ?? 0) > 0 && (
                      <div className="t-xs" style={{ marginTop: '2px', color: 'var(--gold)' }}>
                        🎲 Gambling : {gs.scottyGambleWins}/3 manches
                      </div>
                    )}
                  </>
                )
              })()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

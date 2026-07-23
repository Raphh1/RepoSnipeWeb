import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { ARC_DEFINITIONS, getCurrentStep, advanceArc } from '../../engine/narrativeArcs'
import type { NarrativeArc } from '../../types'
import { TIER_MID } from '../../data/enemies'

const ARC_COLORS: Record<string, string> = {
  alanossa:   'var(--red)',
  raphazarus: 'var(--purple)',
  vael:       'var(--cyan)',
  factionwar: 'var(--orange)',
}

export function NarrativeArcsScreen() {
  const gs          = useGameStore(s => s.gs!)
  const goTo        = useGameStore(s => s.goTo)
  const patch       = useGameStore(s => s.patch)
  const startCombat = useGameStore(s => s.startCombat)
  const [activeArc, setActiveArc] = useState<NarrativeArc | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const allArcs = [...gs.activeArcs, ...ARC_DEFINITIONS
    .filter(d => !gs.activeArcs.find(a => a.id === d.id) && !gs.completedArcs.includes(d.id) && d.triggerCondition(gs))
    .map(d => ({ id: d.id, title: d.title, step: 0, maxSteps: d.steps.length, completed: false, failed: false }))
  ]

  function handleChoice(arc: NarrativeArc, choiceIdx: number) {
    const def = ARC_DEFINITIONS.find(d => d.id === arc.id)
    if (!def) return
    const step = def.steps[arc.step]
    if (!step) return
    const choice = step.choices[choiceIdx]
    if (!choice) return

    const result = choice.effect(gs)
    const { message, advancesArc, failsArc, ...gsChanges } = result

    setMsg(message)

    // Si combat requis
    if (message.toLowerCase().includes('combat')) {
      const enemy = TIER_MID[Math.floor(Math.random() * TIER_MID.length)]
      const updatedArcs = gs.activeArcs.filter(a => a.id !== arc.id)
      patch({ ...gsChanges, activeArcs: updatedArcs })
      startCombat(enemy)
      return
    }

    if (failsArc) {
      const updatedArcs = gs.activeArcs.filter(a => a.id !== arc.id)
      patch({ ...gsChanges, activeArcs: updatedArcs, completedArcs: [...gs.completedArcs, arc.id] })
      return
    }

    if (advancesArc) {
      const { arc: newArc, rewardGs, completed } = advanceArc(arc, gs)
      const existingArcs = gs.activeArcs.filter(a => a.id !== arc.id)

      if (completed) {
        patch({
          ...gsChanges,
          ...(rewardGs ?? {}),
          activeArcs: existingArcs,
          completedArcs: [...gs.completedArcs, arc.id],
        })
        setActiveArc(null)
      } else {
        const updatedArcs = [...existingArcs, newArc]
        patch({ ...gsChanges, activeArcs: updatedArcs })
        setActiveArc(newArc)
      }
    } else {
      patch(gsChanges)
    }
  }

  if (activeArc) {
    const def = ARC_DEFINITIONS.find(d => d.id === activeArc.id)
    const step = getCurrentStep(activeArc)

    return (
      <div className="layout">
        <div className="t-xs t-dim t-center">— ARC NARRATIF —</div>
        <div className="px-box" style={{ borderColor: ARC_COLORS[activeArc.id] }}>
          <div className="t-sm t-bright mb4" style={{ color: ARC_COLORS[activeArc.id] }}>
            {def?.title}
          </div>
          <div className="t-xs t-dim mb8">Étape {activeArc.step + 1}/{activeArc.maxSteps}</div>
        </div>

        {msg && (
          <div className="px-box">
            <div className="t-xs t-green">{msg}</div>
            <button className="px-btn px-btn--sm mt8" style={{ width: 'auto' }} onClick={() => setMsg(null)}>Continuer</button>
          </div>
        )}

        {!msg && step && (
          <div className="px-box px-box--hi">
            <div className="t-sm t-bright mb8">{step.title}</div>
            <div className="t-xs" style={{ lineHeight: '2', marginBottom: '16px' }}>{step.description}</div>
            <div className="col gap4">
              {step.choices
                .filter(c => !c.available || c.available(gs))
                .map((c, i) => (
                  <button key={i} className="px-btn" onClick={() => handleChoice(activeArc, i)}>
                    {c.label}
                  </button>
                ))
              }
            </div>
          </div>
        )}

        {!msg && !step && activeArc.completed && (
          <div className="px-box t-gold t-sm">★ Arc complété !</div>
        )}

        <button className="px-btn" onClick={() => { setActiveArc(null); setMsg(null) }}>← Retour</button>
      </div>
    )
  }

  return (
    <div className="layout">
      <div className="row" style={{ alignItems: 'center', gap: '16px' }}>
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => goTo('station-hub')}>← RETOUR</button>
        <div className="t-sm t-bright">ARCS NARRATIFS</div>
      </div>

      {allArcs.length === 0 && gs.completedArcs.length === 0 && (
        <div className="px-box t-dim t-xs">
          Aucun arc narratif disponible pour l'instant. Explore davantage le secteur.
        </div>
      )}

      {/* Arcs actifs / disponibles */}
      {allArcs.length > 0 && (
        <>
          <div className="t-xs t-dim">DISPONIBLES</div>
          <div className="col gap4">
            {allArcs.filter(a => !a.completed && !a.failed).map(arc => {
              const def = ARC_DEFINITIONS.find(d => d.id === arc.id)
              const step = getCurrentStep(arc)
              return (
                <div key={arc.id} className="px-box px-box--hi" style={{ cursor: 'pointer' }}
                  onClick={() => setActiveArc(arc)}>
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div className="t-sm" style={{ color: ARC_COLORS[arc.id] }}>{def?.title}</div>
                    <div className="tag tag--dim t-xs">{arc.step}/{arc.maxSteps}</div>
                  </div>
                  <div className="t-xs t-dim mb4">{def?.intro}</div>
                  {step && <div className="t-xs t-bright">Étape actuelle : {step.title}</div>}
                  <div className="t-xs t-cyan mt8">→ Cliquer pour continuer</div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Arcs complétés */}
      {gs.completedArcs.length > 0 && (
        <>
          <div className="t-xs t-dim mt8">COMPLÉTÉS</div>
          <div className="col gap4">
            {gs.completedArcs.map(id => {
              const def = ARC_DEFINITIONS.find(d => d.id === id)
              return (
                <div key={id} className="px-box" style={{ opacity: 0.6 }}>
                  <div className="t-xs t-dim">✓ {def?.title ?? id}</div>
                  <div className="t-xs t-dim" style={{ fontSize: '7px', marginTop: '4px' }}>{def?.completionMessage}</div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

import { useState } from 'react'
import { CLASSES } from '../../data/classes'
import { useGameStore } from '../../store/gameStore'
import { useMetaStore } from '../../store/metaStore'
import { drawRunModifiers, RUN_MODIFIERS, type RunModifier } from '../../data/runModifiers'
import { drawRunObjective, type RunObjective } from '../../data/runObjectives'
import { MetaScreen } from './MetaScreen'

function drawHardModifiers(): RunModifier[] {
  const debuffs = RUN_MODIFIERS.filter(m => m.tag === 'debuff')
  const shuffled = [...debuffs].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

const TIER_COLOR: Record<string, string> = {
  bad:      'var(--red)',
  balanced: 'var(--text)',
  good:     'var(--gold)',
}
const TIER_LABEL: Record<string, string> = {
  bad:      '☠ DIFFICILE',
  balanced: '◆ ÉQUILIBRÉ',
  good:     '★ AVANTAGEUX',
}
const TAG_COLOR: Record<string, string> = {
  buff:   'var(--green)',
  debuff: 'var(--red)',
  mixed:  'var(--gold)',
}

function pickRandom() {
  return CLASSES[Math.floor(Math.random() * CLASSES.length)]
}

function drawConditions(): { mods: RunModifier[]; obj: RunObjective } {
  return { mods: drawRunModifiers(2), obj: drawRunObjective() }
}

export function ClassSelect() {
  const selectClass   = useGameStore(s => s.selectClass)
  const unlockedIds   = useMetaStore(s => s.meta.unlockedIds)
  const metaPts       = useMetaStore(s => s.availablePoints())

  const [drawn, setDrawn]               = useState(pickRandom)
  const [rerolls, setRerolls]           = useState(2)
  const [conditions, setConditions]     = useState(drawConditions)
  const [condRerolls, setCondRerolls]   = useState(1)
  const [difficulty, setDifficulty]     = useState<'easy' | 'normal' | 'hard'>('normal')
  const [hardMods]                      = useState<RunModifier[]>(drawHardModifiers)
  const [showMeta, setShowMeta]         = useState(false)
  const [selectedMeta, setSelectedMeta] = useState<string[]>(() => unlockedIds)

  const activeMods: RunModifier[] =
    difficulty === 'easy' ? [] :
    difficulty === 'hard' ? hardMods :
    conditions.mods

  function reroll() {
    if (rerolls <= 0) return
    setDrawn(pickRandom())
    setRerolls(r => r - 1)
  }

  function rerollConditions() {
    if (condRerolls <= 0) return
    setConditions(drawConditions())
    setCondRerolls(r => r - 1)
  }

  function toggleMeta(id: string) {
    setSelectedMeta(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  if (showMeta) {
    return (
      <MetaScreen
        onBack={() => setShowMeta(false)}
        selectedForRun={selectedMeta}
        onToggleRun={toggleMeta}
      />
    )
  }

  return (
    <div className="layout scanlines" style={{ justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>

        <div className="t-center" style={{ padding: '16px 0 8px' }}>
          <div className="t-xl t-gold" style={{ letterSpacing: '4px' }}>VOID TRADER</div>
          <div className="t-dim t-xs mt4">LE VIDE A CHOISI POUR TOI</div>
        </div>

        {/* Carte de classe */}
        <div className="px-box px-box--hi" style={{ borderColor: drawn.color, marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '28px' }}>{drawn.icon}</span>
            <span className="t-xs" style={{ color: TIER_COLOR[drawn.tier] }}>{TIER_LABEL[drawn.tier]}</span>
          </div>
          <div className="t-lg t-bright mb4" style={{ color: drawn.color }}>{drawn.name}</div>
          <div className="t-xs" style={{ lineHeight: '2', color: 'var(--text)' }}>{drawn.description}</div>
          <div className="t-xs t-dim mt8">{drawn.bonusDesc}</div>
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {drawn.dailyDebt        && <div className="t-xs t-red">⚠ -{drawn.dailyDebt} cr par jour</div>}
            {drawn.travelCreditCost && <div className="t-xs t-red">⚠ -{drawn.travelCreditCost} cr par voyage</div>}
            {drawn.cargoDegrades    && <div className="t-xs t-red">⚠ 30% chance de perdre un cargo en voyage</div>}
            {drawn.cursedEvents     && <div className="t-xs t-red">⚠ Événements positifs 50% de chance de fizzle</div>}
            {drawn.piratesDoubled   && <div className="t-xs t-red">⚠ Pirates deux fois plus fréquents</div>}
            {drawn.cannotBuyWeapons && <div className="t-xs t-red">⚠ Ne peut pas acheter d'armes</div>}
            {drawn.peacefulBan      && <div className="t-xs t-red">⚠ Banné des stations paisibles</div>}
          </div>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <StatRow label="Crédits"   value={`${drawn.startCredits.toLocaleString()} cr`} color="var(--gold)" />
            <StatRow label="Carburant" value={`${drawn.startFuel}/${drawn.maxFuel}`}        color="var(--cyan)" />
            <StatRow label="PV"        value={`${drawn.startHp}`}                           color="var(--green)" />
            <StatRow label="Stamina"   value={`${drawn.startStamina}`}                      color="var(--cyan)" />
            <StatRow label="Station"   value={drawn.startStation}                            color="var(--text-dim)" />
          </div>
        </div>

        {/* Conditions de run */}
        <div className="px-box" style={{ borderColor: 'var(--border-hi)', marginTop: '12px' }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div className="t-xs" style={{ letterSpacing: '2px', color: 'var(--text-dim)' }}>◆ CONDITIONS DE RUN</div>
            {difficulty === 'normal' && (
              <button className="px-btn px-btn--sm" style={{ width: 'auto', fontSize: '9px', opacity: condRerolls > 0 ? 1 : 0.4 }}
                disabled={condRerolls <= 0} onClick={rerollConditions}>
                Relancer ({condRerolls})
              </button>
            )}
          </div>

          {/* Sélecteur de difficulté */}
          <div className="row gap4 mb10">
            {([
              { id: 'easy',   label: 'Facile',    desc: 'Sans modificateurs',   color: 'var(--green)' },
              { id: 'normal', label: 'Normal',     desc: '2 modificateurs',      color: 'var(--text)' },
              { id: 'hard',   label: 'Difficile',  desc: '3 malus uniquement',   color: 'var(--red)' },
            ] as const).map(d => (
              <button key={d.id} className="px-btn px-btn--sm" style={{
                flex: 1, textAlign: 'center',
                borderColor: difficulty === d.id ? d.color : 'var(--border)',
                color: difficulty === d.id ? d.color : 'var(--text-dim)',
              }} onClick={() => setDifficulty(d.id)}>
                {d.label}
                <div className="t-xs" style={{ fontSize: '8px', opacity: 0.7, marginTop: '2px' }}>{d.desc}</div>
              </button>
            ))}
          </div>

          {/* Modificateurs */}
          {difficulty === 'easy'
            ? <div className="t-xs t-dim t-center" style={{ padding: '8px 0' }}>Aucun modificateur — partie sans contraintes supplémentaires.</div>
            : <div className="col gap4 mb10">
                {activeMods.map(mod => (
                  <div key={mod.id} className="px-box" style={{ borderColor: TAG_COLOR[mod.tag], padding: '8px 12px', background: 'rgba(0,0,0,0.3)' }}>
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div className="t-xs t-bright" style={{ color: mod.color }}>{mod.name}</div>
                      <div className="tag t-xs" style={{ borderColor: TAG_COLOR[mod.tag], color: TAG_COLOR[mod.tag], fontSize: '8px' }}>
                        {mod.tag === 'buff' ? '▲ BUFF' : mod.tag === 'debuff' ? '▼ MALUS' : '◆ MIXTE'}
                      </div>
                    </div>
                    <div className="t-xs t-dim" style={{ lineHeight: '1.8' }}>{mod.desc}</div>
                  </div>
                ))}
              </div>
          }

          {/* Objectif secret */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <div className="t-xs t-dim mb6" style={{ letterSpacing: '1px' }}>★ OBJECTIF SECRET</div>
            <div className="px-box" style={{ borderColor: 'var(--purple)', padding: '8px 12px', background: 'rgba(160,64,255,0.05)' }}>
              <div className="t-xs t-bright mb4" style={{ color: 'var(--purple)' }}>{conditions.obj.name}</div>
              <div className="t-xs t-dim" style={{ lineHeight: '1.8' }}>{conditions.obj.desc}</div>
              <div className="t-xs mt4" style={{ color: 'var(--gold)' }}>Récompense : +{conditions.obj.metaPointReward} pts héritage</div>
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="col gap4 mt12">
          <button className="px-btn px-btn--primary" onClick={() => selectClass(drawn, activeMods, selectedMeta)}>
            COMMENCER → {drawn.name.toUpperCase()}
          </button>
          <button className="px-btn" onClick={reroll} disabled={rerolls <= 0}
            style={{ color: rerolls > 0 ? 'var(--text-dim)' : undefined }}>
            {rerolls > 0 ? `Relancer la classe (${rerolls} restant${rerolls > 1 ? 's' : ''})` : 'Plus de relancements'}
          </button>
          <button className="px-btn" style={{ borderColor: 'var(--purple)', color: 'var(--purple)' }} onClick={() => setShowMeta(true)}>
            ★ HÉRITAGE — sélectionner les améliorations pour cette run
            {metaPts > 0 && <span className="t-xs" style={{ marginLeft: '8px', color: 'var(--gold)' }}>· {metaPts} pts à dépenser</span>}
            {selectedMeta.length > 0 && <span className="t-xs t-dim" style={{ marginLeft: '8px' }}>({selectedMeta.length} actif{selectedMeta.length > 1 ? 's' : ''})</span>}
          </button>
        </div>

        <div className="t-center t-xs t-dim mt12">
          <span className="blink">_</span> LE VIDE VOUS ATTEND
        </div>
      </div>
    </div>
  )
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
      <span className="t-xs t-dim">{label}</span>
      <span className="t-xs" style={{ color }}>{value}</span>
    </div>
  )
}

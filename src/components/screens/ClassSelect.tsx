import { useState } from 'react'
import { CLASSES } from '../../data/classes'
import { useGameStore } from '../../store/gameStore'

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

function pickRandom() {
  return CLASSES[Math.floor(Math.random() * CLASSES.length)]
}

export function ClassSelect() {
  const selectClass = useGameStore(s => s.selectClass)
  const [drawn, setDrawn]     = useState(pickRandom)
  const [rerolls, setRerolls] = useState(2)

  function reroll() {
    if (rerolls <= 0) return
    setDrawn(pickRandom())
    setRerolls(r => r - 1)
  }

  return (
    <div className="layout scanlines" style={{ justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>

        <div className="t-center" style={{ padding: '16px 0 8px' }}>
          <div className="t-xl t-gold" style={{ letterSpacing: '4px' }}>VOID TRADER</div>
          <div className="t-dim t-xs mt4">LE VIDE A CHOISI POUR TOI</div>
        </div>

        {/* Carte de classe tirée */}
        <div className="px-box px-box--hi" style={{ borderColor: drawn.color, marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '28px' }}>{drawn.icon}</span>
            <span className="t-xs" style={{ color: TIER_COLOR[drawn.tier] }}>
              {TIER_LABEL[drawn.tier]}
            </span>
          </div>

          <div className="t-lg t-bright mb4" style={{ color: drawn.color }}>{drawn.name}</div>
          <div className="t-xs" style={{ lineHeight: '2', color: 'var(--text)' }}>{drawn.description}</div>
          <div className="t-xs t-dim mt8">{drawn.bonusDesc}</div>

          {/* Malus en rouge */}
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {drawn.dailyDebt        && <div className="t-xs t-red">⚠ -{drawn.dailyDebt} cr par jour</div>}
            {drawn.travelCreditCost && <div className="t-xs t-red">⚠ -{drawn.travelCreditCost} cr par voyage</div>}
            {drawn.cargoDegrades    && <div className="t-xs t-red">⚠ 30% chance de perdre un cargo en voyage</div>}
            {drawn.cursedEvents     && <div className="t-xs t-red">⚠ Événements positifs 50% de chance de fizzle</div>}
            {drawn.piratesDoubled   && <div className="t-xs t-red">⚠ Pirates deux fois plus fréquents</div>}
            {drawn.cannotBuyWeapons && <div className="t-xs t-red">⚠ Ne peut pas acheter d'armes</div>}
            {drawn.peacefulBan      && <div className="t-xs t-red">⚠ Banné des stations paisibles</div>}
          </div>

          {/* Stats */}
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <StatRow label="Crédits"   value={`${drawn.startCredits.toLocaleString()} cr`} color="var(--gold)" />
            <StatRow label="Carburant" value={`${drawn.startFuel}/${drawn.maxFuel}`}        color="var(--cyan)" />
            <StatRow label="PV"        value={`${drawn.startHp}`}                           color="var(--green)" />
            <StatRow label="Stamina"   value={`${drawn.startStamina}`}                      color="var(--cyan)" />
            <StatRow label="Station"   value={drawn.startStation}                            color="var(--text-dim)" />
          </div>
        </div>

        {/* Boutons */}
        <div className="col gap4 mt12">
          <button className="px-btn px-btn--primary" onClick={() => selectClass(drawn)}>
            COMMENCER → {drawn.name.toUpperCase()}
          </button>
          <button className="px-btn" onClick={reroll} disabled={rerolls <= 0}
            style={{ color: rerolls > 0 ? 'var(--text-dim)' : undefined }}>
            {rerolls > 0 ? `Relancer le tirage (${rerolls} restant${rerolls > 1 ? 's' : ''})` : 'Plus de relancements'}
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

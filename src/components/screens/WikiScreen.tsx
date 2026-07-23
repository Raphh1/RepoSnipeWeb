import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { STATIONS } from '../../data/stations'
import { WEAPONS } from '../../data/weapons'
import { ARMORS } from '../../data/armors'
import { FACTIONS } from '../../engine/factions'
import { CLASSES } from '../../data/classes'

type WikiTab = 'classes' | 'stations' | 'armes' | 'armures' | 'factions' | 'marchandises'

const GOODS_PRICES: Record<string, { buy: number; desc: string }> = {
  'Médicaments':            { buy: 150, desc: 'Soigne 30 PV. Classe Médecin : vendus 50% plus cher.' },
  'Médicaments premium':    { buy: 350, desc: 'Soigne tous les PV.' },
  'Métaux bruts':           { buy: 80,  desc: 'Matière première industrielle.' },
  'Nourriture synthétique': { buy: 60,  desc: '+10 PV, +20 stamina si consommé.' },
  'Nourriture fraîche':     { buy: 85,  desc: '+20 PV, +20 stamina si consommé.' },
  'Composants électroniques':{ buy: 200, desc: 'Base de nombreux marchés technologiques.' },
  'Armes illégales':        { buy: 500, desc: 'Hauts profits, hauts risques.' },
  'Drogues de synthèse':    { buy: 300, desc: 'Effets aléatoires si consommé. Profits élevés.' },
  'Données volées':         { buy: 400, desc: 'Très demandées à Nexus Aldara.' },
  'Métaux rares':           { buy: 350, desc: 'Nécessaires aux armures Tier 4+.' },
  'Cristaux énergétiques':  { buy: 500, desc: 'Carburant de haute qualité.' },
  'Artefacts':              { buy: 800, desc: 'Peuvent être consommés pour un effet aléatoire.' },
  'Implants':               { buy: 600, desc: 'Demandés partout. Ne pas avaler.' },
  'Or':                     { buy: 600, desc: 'Valeur universelle. Toujours rentable.' },
}

export function WikiScreen() {
  const goTo = useGameStore(s => s.goTo)
  const gs   = useGameStore(s => s.gs!)
  const [tab, setTab] = useState<WikiTab>('classes')

  return (
    <div className="layout">
      <div className="row" style={{ alignItems: 'center', gap: '12px' }}>
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => goTo('station-hub')}>← RETOUR</button>
        <div className="t-sm t-bright">WIKI</div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {(['classes','stations','armes','armures','factions','marchandises'] as WikiTab[]).map(t => (
          <button key={t} className={`px-btn px-btn--sm ${tab === t ? 'px-btn--primary' : ''}`}
            style={{ width: 'auto' }} onClick={() => setTab(t)}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="col gap4">
        {tab === 'classes' && CLASSES.map(c => (
          <div key={c.name} className="px-box">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: '6px' }}>
              <div className="t-sm" style={{ color: c.color }}>{c.icon} {c.name}</div>
              <div className="tag t-xs" style={{ color: c.tier === 'bad' ? 'var(--red)' : c.tier === 'good' ? 'var(--gold)' : 'var(--text-dim)', borderColor: 'currentColor' }}>
                {c.tier === 'bad' ? 'DIFFICILE' : c.tier === 'good' ? 'AVANTAGEUX' : 'ÉQUILIBRÉ'}
              </div>
            </div>
            <div className="t-xs t-dim mb4">{c.description}</div>
            <div className="t-xs" style={{ color: 'var(--cyan)' }}>{c.bonusDesc}</div>
            <div className="t-xs t-dim mt4">
              Départ : {c.startStation} · {c.startCredits} cr · Fuel {c.startFuel}/{c.maxFuel} · {c.startHp} PV
            </div>
          </div>
        ))}

        {tab === 'stations' && STATIONS.map(s => {
          const visited = gs.visitedStations.includes(s.name)
          return (
            <div key={s.name} className={`px-box ${!visited ? '' : 'px-box--hi'}`} style={{ opacity: visited ? 1 : 0.5 }}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: '4px' }}>
                <div className="t-sm t-bright">{s.name}</div>
                <div className={`tag t-xs danger-${s.danger}`}>{['SÛR','RISQUÉ','DANGEREUX','GUERRE'][s.danger]}</div>
              </div>
              <div className="t-xs t-dim mb4">{s.description}</div>
              <div className="t-xs t-dim">Type : {s.type} · {visited ? '✓ Visitée' : 'Non visitée'}</div>
              <div className="t-xs t-dim mt4">Goods : {s.goods.slice(0,4).join(' · ')}</div>
            </div>
          )
        })}

        {tab === 'armes' && WEAPONS.map((w, i) => (
          <div key={i} className="px-box">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: '4px' }}>
              <div className="t-sm t-orange">{w.name}</div>
              <div className="tag tag--dim t-xs">Tier {w.tier}</div>
            </div>
            <div className="t-xs">Dégâts : <span className="t-bright">{w.damageMin}–{w.damageMax}</span> · Crit : {w.critChance}%</div>
            {w.effect !== 'none' && <div className="t-xs t-purple mt4" style={{ color: 'var(--purple)' }}>{w.effectDesc} ({w.effectChance}%)</div>}
            {w.selfDmgChance > 0 && <div className="t-xs t-red mt4">⚠ Self-dmg {w.selfDmgChance}%</div>}
          </div>
        ))}

        {tab === 'armures' && ARMORS.map((a, i) => (
          <div key={i} className="px-box">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: '4px' }}>
              <div className="t-sm" style={{ color: 'var(--blue)' }}>{a.name}</div>
              <div className="tag tag--dim t-xs">Tier {a.tier}</div>
            </div>
            <div className="t-xs">Défense : <span className="t-bright">{a.defense}%</span>{a.hpBonus > 0 && <> · +{a.hpBonus} PV</>}</div>
            {a.effect !== 'none' && <div className="t-xs t-cyan mt4">
              {a.effect === 'regen' && `Régén +${a.effectValue} PV/tour`}
              {a.effect === 'thorns' && `Épines ${a.effectValue}% renvoyés`}
              {a.effect === 'immunity' && 'Absorbe 1 coup fatal'}
              {a.effect === 'staminaBoost' && `+${a.effectValue} stamina/tour`}
            </div>}
            <div className="t-xs t-dim mt4">{a.description}</div>
          </div>
        ))}

        {tab === 'factions' && FACTIONS.map(f => (
          <div key={f.id} className="px-box" style={{ borderColor: gs.faction === f.id ? 'var(--gold)' : undefined }}>
            <div className="t-sm mb4" style={{ color: f.color }}>{f.name}</div>
            <div className="t-xs t-dim mb4">{f.description}</div>
            <div className="t-xs t-cyan">{f.bonus}</div>
            {gs.faction === f.id && <div className="tag tag--gold t-xs mt8">MEMBRE</div>}
          </div>
        ))}

        {tab === 'marchandises' && Object.entries(GOODS_PRICES).map(([item, data]) => (
          <div key={item} className="px-box">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: '4px' }}>
              <div className="t-xs t-bright">{item}</div>
              <div className="t-xs t-gold">~{data.buy} cr</div>
            </div>
            <div className="t-xs t-dim">{data.desc}</div>
            {Object.keys(gs.cargo).includes(item) && <div className="tag tag--green t-xs mt4">EN CARGO ×{gs.cargo[item]}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

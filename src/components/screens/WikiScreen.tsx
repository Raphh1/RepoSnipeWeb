import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../../store/gameStore'
import { getStations } from '../../data/stations'
import { getWeapons } from '../../data/weapons'
import { getArmors } from '../../data/armors'
import { getFactions } from '../../engine/factions'
import { getClasses } from '../../data/classes'
import { translateGood, translateWeaponName, translateArmorName } from '../../engine/goodsI18n'

type WikiTab = 'classes' | 'stations' | 'armes' | 'armures' | 'factions' | 'marchandises'

const GOODS_KEYS: Record<string, { buy: number; key: string }> = {
  'Médicaments':            { buy: 250, key: 'goods_medicaments' },
  'Médicaments premium':    { buy: 580, key: 'goods_medicamentsPremium' },
  'Métaux bruts':           { buy: 130, key: 'goods_metauxBruts' },
  'Nourriture synthétique': { buy: 100, key: 'goods_nourritureSynthetique' },
  'Nourriture fraîche':     { buy: 140, key: 'goods_nourritureFraiche' },
  'Composants électroniques':{ buy: 320, key: 'goods_composantsElectroniques' },
  'Armes illégales':        { buy: 800, key: 'goods_armesIllegales' },
  'Drogues de synthèse':    { buy: 480, key: 'goods_droguesDeSynthese' },
  'Données volées':         { buy: 650, key: 'goods_donneesVolees' },
  'Métaux rares':           { buy: 560, key: 'goods_metauxRares' },
  'Cristaux énergétiques':  { buy: 800, key: 'goods_cristauxEnergetiques' },
  'Artefacts':              { buy: 1300, key: 'goods_artefacts' },
  'Implants':               { buy: 960, key: 'goods_implants' },
  'Or':                     { buy: 950, key: 'goods_or' },
}

const DANGER_KEYS = ['safe', 'risky', 'dangerous', 'war'] as const

export function WikiScreen() {
  const { t } = useTranslation('wikiScreen')
  const goTo = useGameStore(s => s.goTo)
  const gs   = useGameStore(s => s.gs!)
  const [tab, setTab] = useState<WikiTab>('classes')

  return (
    <div className="layout">
      <div className="row" style={{ alignItems: 'center', gap: '12px' }}>
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => goTo('station-hub')}>{t('back')}</button>
        <div className="t-sm t-bright">{t('title')}</div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {(['classes','stations','armes','armures','factions','marchandises'] as WikiTab[]).map(tb => (
          <button key={tb} className={`px-btn px-btn--sm ${tab === tb ? 'px-btn--primary' : ''}`}
            style={{ width: 'auto' }} onClick={() => setTab(tb)}>
            {t(`tabs.${tb}`)}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="col gap4">
        {tab === 'classes' && getClasses().map(c => (
          <div key={c.name} className="px-box">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: '6px' }}>
              <div className="t-sm" style={{ color: c.color }}>{c.icon} {c.name}</div>
              <div className="tag t-xs" style={{ color: c.tier === 'bad' ? 'var(--red)' : c.tier === 'good' ? 'var(--gold)' : 'var(--text-dim)', borderColor: 'currentColor' }}>
                {t(`tier.${c.tier === 'bad' ? 'bad' : c.tier === 'good' ? 'good' : 'balanced'}`)}
              </div>
            </div>
            <div className="t-xs t-dim mb4">{c.description}</div>
            <div className="t-xs" style={{ color: 'var(--cyan)' }}>{c.bonusDesc}</div>
            <div className="t-xs t-dim mt4">
              {t('classStart', { station: c.startStation, credits: c.startCredits, fuel: c.startFuel, maxFuel: c.maxFuel, hp: c.startHp })}
            </div>
          </div>
        ))}

        {tab === 'stations' && getStations().map(s => {
          const visited = gs.visitedStations.includes(s.name)
          return (
            <div key={s.name} className={`px-box ${!visited ? '' : 'px-box--hi'}`} style={{ opacity: visited ? 1 : 0.5 }}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: '4px' }}>
                <div className="t-sm t-bright">{s.name}</div>
                <div className={`tag t-xs danger-${s.danger}`}>{t(`danger.${DANGER_KEYS[s.danger]}`)}</div>
              </div>
              <div className="t-xs t-dim mb4">{s.description}</div>
              <div className="t-xs t-dim">{t('type', { type: s.type, visited: visited ? t('visited') : t('notVisited') })}</div>
              <div className="t-xs t-dim mt4">{t('goods', { list: s.goods.slice(0,4).map(translateGood).join(' · ') })}</div>
            </div>
          )
        })}

        {tab === 'armes' && getWeapons().map((w, i) => (
          <div key={i} className="px-box">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: '4px' }}>
              <div className="t-sm t-orange">{translateWeaponName(w.name)}</div>
              <div className="tag tag--dim t-xs">{t('weaponTier', { tier: w.tier })}</div>
            </div>
            <div className="t-xs">{t('damage', { min: w.damageMin, max: w.damageMax, crit: w.critChance })}</div>
            {w.effect !== 'none' && <div className="t-xs t-purple mt4" style={{ color: 'var(--purple)' }}>{w.effectDesc} ({w.effectChance}%)</div>}
            {w.selfDmgChance > 0 && <div className="t-xs t-red mt4">{t('selfDamage', { value: w.selfDmgChance })}</div>}
          </div>
        ))}

        {tab === 'armures' && getArmors().map((a, i) => (
          <div key={i} className="px-box">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: '4px' }}>
              <div className="t-sm" style={{ color: 'var(--blue)' }}>{translateArmorName(a.name)}</div>
              <div className="tag tag--dim t-xs">{t('weaponTier', { tier: a.tier })}</div>
            </div>
            <div className="t-xs">{t('defense', { value: a.defense })}{a.hpBonus > 0 && t('hpBonus', { value: a.hpBonus })}</div>
            {a.effect !== 'none' && <div className="t-xs t-cyan mt4">
              {a.effect === 'regen' && t('armorEffect.regen', { value: a.effectValue })}
              {a.effect === 'thorns' && t('armorEffect.thorns', { value: a.effectValue })}
              {a.effect === 'immunity' && t('armorEffect.immunity')}
              {a.effect === 'staminaBoost' && t('armorEffect.staminaBoost', { value: a.effectValue })}
            </div>}
            <div className="t-xs t-dim mt4">{a.description}</div>
          </div>
        ))}

        {tab === 'factions' && getFactions().map(f => (
          <div key={f.id} className="px-box" style={{ borderColor: gs.faction === f.id ? 'var(--gold)' : undefined }}>
            <div className="t-sm mb4" style={{ color: f.color }}>{f.name}</div>
            <div className="t-xs t-dim mb4">{f.description}</div>
            <div className="t-xs t-cyan">{f.bonus}</div>
            {gs.faction === f.id && <div className="tag tag--gold t-xs mt8">{t('memberTag')}</div>}
          </div>
        ))}

        {tab === 'marchandises' && Object.entries(GOODS_KEYS).map(([item, data]) => (
          <div key={item} className="px-box">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: '4px' }}>
              <div className="t-xs t-bright">{translateGood(item)}</div>
              <div className="t-xs t-gold">~{data.buy} cr</div>
            </div>
            <div className="t-xs t-dim">{t(data.key)}</div>
            {Object.keys(gs.cargo).includes(item) && <div className="tag tag--green t-xs mt4">{t('cargoTag', { count: gs.cargo[item] })}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

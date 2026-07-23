import { useMemo } from 'react'
import { useGameStore } from '../../store/gameStore'
import { playBuy, playSell } from '../../engine/sfx'
import { getStation, FUEL_STATIONS } from '../../data/stations'
import { getBuyDiscount } from '../../engine/factions'
import { getWorldEventPriceMultiplier } from '../../engine/worldEvents'
import { getCulteArtefactMult, getFactionSurchargeAtStation, getStationFactionName, getRepLevel, getFactionRep, STATION_FACTION_CONTROL } from '../../engine/factionRep'
import { getRunBuyMult } from '../../data/runModifiers'
import { getFullBuyMult, getFullSellMult, getMarketContext, getPillarDiscount } from '../../engine/marketPricing'

const BASE_PRICES: Record<string, number> = {
  'Médicaments': 150, 'Médicaments premium': 350, 'Métaux bruts': 80,
  'Nourriture synthétique': 60, 'Nourriture fraîche': 85, 'Carburant de récup': 240,
  'Composants électroniques': 200, 'Vêtements': 90, 'Outils': 120, 'Outils lourds': 200,
  'Armes illégales': 500, 'Drogues de synthèse': 300, 'Données volées': 400,
  'Pièces de contrebande': 250, 'Équipements blindés': 450, 'Rations militaires': 70,
  'Munitions': 180, 'Munitions spéciales': 350, 'Composants tactiques': 350,
  'Implants': 600, 'Logiciels': 280, 'Données': 220, 'Données classifiées': 700,
  'Matériel de pillage': 320, 'Butin de guerre': 450, 'Eau purifiée': 50,
  'Minerais': 110, 'Équipement agricole': 140, 'Métaux rares': 350,
  'Cristaux énergétiques': 500, 'Armes artisanales': 400, "Composants d'armure": 300,
  'Matériaux interdits': 600, 'Marchandises volées': 250, 'Composants divers': 150,
  'Informations monnayables': 350, 'Armes Tier 3': 900, 'Armures premium': 800,
  'Luxe': 700, 'Informations VIP': 600, "Armures d'élite": 1200,
  'Armes lourdes': 1000, 'Artefacts': 800, 'Composants expérimentaux': 900,
  'Carburant premium': 120, 'Armes exotiques': 1500, 'Technologies avancées': 1100,
  'Armes Tier 4': 2000, 'Armures Tier 4': 1800, 'Renseignements': 500,
  'Intel faction': 400, 'Équipement tactique': 600, 'Armures Faucon': 1000,
  'Rations': 70, 'Armures': 400, 'Ferraille': 50, 'Plantes médicinales': 180,
  'Or': 600, 'Pièces techniques': 200, 'Vivres': 90,
}

// Prix déterministes — la variation inter-station vient de stationPriceSeeds (persisté en GameState)
function getBasePrice(item: string): number {
  return BASE_PRICES[item] ?? 200
}

// Armes et armures-cargo retirées du marché — loot only (ennemis, exploration, wander)
const LOOT_ONLY_ITEMS = new Set([
  'Armes lourdes', 'Armes artisanales', 'Armes Tier 3', 'Armes Tier 4', 'Armes exotiques',
  'Armures Faucon', "Armures d'élite", 'Armures premium', 'Armures Tier 4',
])

// Limites de soute par item (protection anti-abus)
export const ITEM_CARGO_MAX: Record<string, number> = {
  'Implants': 2,
  'Implants militaires': 2,
  'Médicaments premium': 4,
  'Or': 5,
  'Cristaux énergétiques': 6,
  'Métaux rares': 8,
  'Technologies avancées': 4,
  'Composants expérimentaux': 4,
  'Données classifiées': 5,
}

export function MarketScreen() {
  const gs        = useGameStore(s => s.gs!)
  const goTo      = useGameStore(s => s.goTo)
  const buyCargo          = useGameStore(s => s.buyCargo)
  const sellCargo         = useGameStore(s => s.sellCargo)

  const station    = getStation(gs.currentStation)
  const discount   = getBuyDiscount(gs)
  const events     = gs.activeWorldEvents ?? []
  const runBuyMult = getRunBuyMult(gs)
  const soutePct       = (gs.shipModules?.soute ?? 0) * 10
  const maxCargo       = 15 + (gs.shipModules?.soute ?? 0) * 5
  const totalCargo     = Object.values(gs.cargo).reduce((a, b) => a + b, 0)
  const soutePleine    = totalCargo >= maxCargo
  const culteArtefact  = getCulteArtefactMult(gs)
  const ARTEFACT_ITEMS = new Set(['Artefacts', 'Données classifiées', 'Composants expérimentaux', 'Technologies avancées'])

  const marketCtx    = getMarketContext(gs, station.type)
  const pillarDisc   = getPillarDiscount(gs)
  const stationSeed  = gs.stationPriceSeeds?.[gs.currentStation] ?? 1.0
  const factionSurcharge = getFactionSurchargeAtStation(gs, gs.currentStation)

  // Prix de base figés par station — évite le re-roll à chaque render
  const frozenBasePrices = useMemo(() => {
    const all = [...station.goods, 'Carburant de récup']
    const out: Record<string, number> = {}
    for (const item of all) out[item] = getBasePrice(item)
    return out
  }, [gs.currentStation]) // eslint-disable-line react-hooks/exhaustive-deps
  const controllingFaction = STATION_FACTION_CONTROL[gs.currentStation]
  const controllingFactionName = getStationFactionName(gs.currentStation)
  const factionRepLevel = controllingFaction ? getRepLevel(getFactionRep(gs, controllingFaction)) : null

  const priceTag = stationSeed <= 0.88
    ? { label: '▼ STATION BON MARCHÉ', color: 'var(--green)' }
    : stationSeed >= 1.12
    ? { label: '▲ STATION CHÈRE', color: 'var(--red)' }
    : null

  return (
    <div className="layout">
      {/* Header */}
      <div className="row" style={{ alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => goTo('station-hub')}>← RETOUR</button>
        <div className="t-sm t-bright" style={{ flex: 1 }}>MARCHÉ — {station.name}</div>
        <div className="t-xs t-gold">{gs.credits.toLocaleString()} cr</div>
        <div className="t-xs" style={{ color: totalCargo >= maxCargo ? 'var(--red)' : 'var(--dim)' }}>
          Soute {totalCargo}/{maxCargo}
        </div>
        {priceTag && <div className="t-xs" style={{ color: priceTag.color, fontWeight: 'bold', fontSize: '9px', letterSpacing: '1px' }}>{priceTag.label}</div>}
        {factionSurcharge > 0 && <div className="t-xs" style={{ color: 'var(--red)', fontWeight: 'bold', fontSize: '9px', letterSpacing: '1px' }}>⚠ +{factionSurcharge}% {controllingFactionName?.toUpperCase()}</div>}
        {discount > 0 && <div className="tag tag--green t-xs">-{discount}% FACTION</div>}
        <button className="px-btn px-btn--sm" style={{ width: 'auto', color: 'var(--cyan)', borderColor: 'var(--cyan)' }}
          onClick={() => goTo('inventory')}>
          ⚔ Inventaire
        </button>
      </div>

      {/* Contexte marché — profil de la station */}
      {marketCtx.length > 0 && (
        <div className="col gap4">
          {marketCtx.map((line, i) => {
            const isHostile = line.startsWith('⚠')
            const isAlliance = line.includes('Alliance')
            return (
              <div key={i} className="px-box" style={{
                borderColor: isHostile ? 'var(--red)' : isAlliance ? 'var(--green)' : 'var(--border)',
                padding: '5px 12px', background: 'rgba(0,0,0,0.4)'
              }}>
                <span className="t-xs" style={{ color: isHostile ? 'var(--red)' : isAlliance ? 'var(--green)' : 'var(--dim)' }}>
                  {line}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Événements mondiaux affectant les prix */}
      {events.length > 0 && (
        <div className="col gap4">
          {events.map(evt => (
            <div key={evt.id} className="px-box" style={{ borderColor: evt.color, padding: '6px 12px', background: 'rgba(0,0,0,0.4)' }}>
              <span style={{ color: evt.color, fontSize: '9px', letterSpacing: '1px' }}>⚠ {evt.title}</span>
              <span className="t-xs t-dim" style={{ marginLeft: '8px' }}>{evt.shortDesc}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid2" style={{ alignItems: 'start' }}>
        {/* ACHETER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <div style={{
            background: soutePleine ? 'rgba(80,0,0,0.3)' : '#0d1a0d',
            border: `2px solid ${soutePleine ? 'var(--red)' : 'var(--gold)'}`,
            borderBottom: 'none',
            padding: '8px 14px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '9px', color: soutePleine ? 'var(--red)' : 'var(--gold)', letterSpacing: '2px' }}>▼ ACHETER</span>
            {soutePleine
              ? <span style={{ fontSize: '9px', color: 'var(--red)', letterSpacing: '1px', fontWeight: 'bold' }}>⚠ SOUTE PLEINE — VENDEZ D'ABORD</span>
              : <span className="t-xs t-dim" style={{ marginLeft: 'auto' }}>disponible : {gs.credits.toLocaleString()} cr</span>
            }
          </div>
          {soutePleine && (
            <div style={{
              border: '2px solid var(--red)', borderTop: 'none', borderBottom: 'none',
              background: 'rgba(60,0,0,0.25)', padding: '10px 14px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '11px', color: 'var(--red)', letterSpacing: '2px', fontWeight: 'bold', marginBottom: '4px' }}>
                SOUTE PLEINE ({totalCargo}/{maxCargo})
              </div>
              <div style={{ fontSize: '9px', color: 'var(--dim)' }}>
                Tu ne peux pas acheter tant que la soute n'est pas libérée. Vends des marchandises d'abord.
              </div>
            </div>
          )}
          <div className="col list-zebra" style={{
            border: `2px solid ${soutePleine ? 'var(--red)' : 'var(--gold)'}`,
            padding: '6px', gap: '4px',
            opacity: soutePleine ? 0.45 : 1,
            pointerEvents: soutePleine ? 'none' : 'auto',
          }}>
            {station.goods
              .filter(item => !LOOT_ONLY_ITEMS.has(item))
              .map(item => {
              const rawPrice = Math.floor((frozenBasePrices[item] ?? 200) * stationSeed * getWorldEventPriceMultiplier(item, events) * runBuyMult * getFullBuyMult(gs, station.type, item))
              const price = Math.floor(rawPrice * (1 - discount / 100) * (1 + factionSurcharge / 100))
              const canBuy = gs.credits >= price
              const banned = gs.class.cannotBuyWeapons && (item.toLowerCase().includes('arme') || item.toLowerCase().includes('munitions'))
              const itemMax = ITEM_CARGO_MAX[item]
              const atMax = itemMax !== undefined && (gs.cargo[item] ?? 0) >= itemMax
              const blocked = banned || atMax
              return (
                <button key={item} className="px-btn" disabled={!canBuy || blocked}
                  style={{ borderColor: station.exclusiveGoods?.includes(item) ? 'var(--gold)' : canBuy && !blocked ? 'var(--border)' : undefined }}
                  onClick={() => { playBuy(); buyCargo(item, price) }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="t-xs">
                      {station.exclusiveGoods?.includes(item) && <span style={{ color: 'var(--gold)', marginRight: '5px', fontSize: '9px' }}>★</span>}
                      {item}
                      {itemMax !== undefined && <span className="t-dim" style={{ marginLeft: '6px', fontSize: '9px' }}>({gs.cargo[item] ?? 0}/{itemMax})</span>}
                    </span>
                    <span className="t-gold t-xs">
                      {banned ? <span className="t-red">INTERDIT</span>
                        : atMax ? <span style={{ color: 'var(--dim)' }}>MAX</span>
                        : `${price} cr`}
                    </span>
                  </div>
                </button>
              )
            })}
            {FUEL_STATIONS.has(gs.currentStation) && gs.fuel < gs.maxFuel && (() => {
              const price = Math.floor((frozenBasePrices['Carburant de récup'] ?? 240) * getFullBuyMult(gs, station.type, 'Carburant de récup') * (1 - discount / 100))
              return (
                <button className="px-btn px-btn--green" disabled={gs.credits < price}
                  onClick={() => { playBuy(); useGameStore.getState().buyFuel(1, price) }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="t-xs">⛽ Carburant +1 ({gs.fuel}/{gs.maxFuel})</span>
                    <span className="t-cyan t-xs">{price} cr</span>
                  </div>
                </button>
              )
            })()}
          </div>
        </div>

        {/* VENDRE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <div style={{
            background: '#001a0d',
            border: '2px solid var(--green)',
            borderBottom: 'none',
            padding: '8px 14px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '9px', color: 'var(--green)', letterSpacing: '2px' }}>▲ VENDRE</span>
            {soutePct > 0 && <span className="tag tag--green t-xs">Soute +{soutePct}%</span>}
            <span className="t-xs t-dim" style={{ marginLeft: 'auto' }}>
              {Object.keys(gs.cargo).length === 0 ? 'soute vide' : `${Object.keys(gs.cargo).length} type(s)`}
            </span>
          </div>
          <div className="col list-zebra" style={{ border: '2px solid var(--green)', padding: '6px', gap: '4px' }}>
            {Object.keys(gs.cargo).length === 0 && (
              <div className="px-box t-dim t-xs" style={{ border: 'none', background: 'transparent' }}>
                Aucune marchandise dans la soute.
              </div>
            )}
            {Object.entries(gs.cargo).map(([item, qty]) => {
              const culteMult = ARTEFACT_ITEMS.has(item) ? culteArtefact : 1
              const sellPrice = Math.floor(getBasePrice(item) * stationSeed * getFullSellMult(gs, station.type, item) * getWorldEventPriceMultiplier(item, events) * (1 + soutePct / 100) * culteMult * (factionSurcharge > 0 ? 0.75 : 1))
              const medBonus  = gs.class.medicBonus && item === 'Médicaments'
                ? Math.floor(sellPrice * 0.5) : 0
              const total = sellPrice + medBonus
              return (
                <button key={item} className="px-btn" style={{ borderColor: '#206040', color: 'var(--green)' }}
                  onClick={() => { playSell(); sellCargo(item, sellPrice) }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="t-xs">{item} ×{qty}</span>
                    <span className="t-green t-xs">
                      +{total} cr{medBonus > 0 ? ` (+${medBonus} Médecin)` : ''}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

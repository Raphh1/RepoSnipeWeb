import { useGameStore } from '../../store/gameStore'
import { getStation } from '../../data/stations'
import { getBuyDiscount } from '../../engine/factions'

const BASE_PRICES: Record<string, number> = {
  'Médicaments': 150, 'Médicaments premium': 350, 'Métaux bruts': 80,
  'Nourriture synthétique': 60, 'Nourriture fraîche': 85, 'Carburant de récup': 240,
  'Composants électroniques': 200, 'Vêtements': 90, 'Outils': 120, 'Outils lourds': 200,
  'Armes illégales': 500, 'Drogues de synthèse': 300, 'Données volées': 400,
  'Pièces de contrebande': 250, 'Armures légères': 450, 'Rations militaires': 70,
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

function getPrice(item: string): number {
  const base = BASE_PRICES[item] ?? 200
  const jitter = 0.85 + Math.random() * 0.30
  return Math.floor(base * jitter)
}

export function MarketScreen() {
  const gs        = useGameStore(s => s.gs!)
  const goTo      = useGameStore(s => s.goTo)
  const buyCargo  = useGameStore(s => s.buyCargo)
  const sellCargo = useGameStore(s => s.sellCargo)

  const station   = getStation(gs.currentStation)
  const discount  = getBuyDiscount(gs)

  return (
    <div className="layout">
      <div className="row" style={{ alignItems: 'center', gap: '16px' }}>
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => goTo('station-hub')}>← RETOUR</button>
        <div className="t-sm t-bright">MARCHÉ — {station.name}</div>
        <div className="t-xs t-gold">{gs.credits.toLocaleString()} cr</div>
        {discount > 0 && <div className="tag tag--green t-xs">-{discount}% RÉDUCTION</div>}
      </div>

      <div className="grid2">
        {/* ACHETER */}
        <div className="col">
          <div className="t-xs t-dim">ACHETER</div>
          {station.goods.map(item => {
            const rawPrice = getPrice(item)
            const price = Math.floor(rawPrice * (1 - discount / 100))
            const canBuy = gs.credits >= price
            const banned = gs.class.cannotBuyWeapons && (item.toLowerCase().includes('arme') || item.toLowerCase().includes('munitions'))
            return (
              <button key={item} className="px-btn" disabled={!canBuy || banned}
                onClick={() => buyCargo(item, price)}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="t-xs">{item}</span>
                  <span className="t-gold t-xs">
                    {banned ? <span className="t-red">INTERDIT</span> : `${price} cr`}
                  </span>
                </div>
              </button>
            )
          })}
          {/* Carburant */}
          {gs.fuel < gs.maxFuel && (() => {
            const price = Math.floor(getPrice('Carburant de récup') * (1 - discount / 100))
            return (
              <button className="px-btn px-btn--green" disabled={gs.credits < price}
                onClick={() => useGameStore.getState().buyFuel(1, price)}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="t-xs">Carburant +1 ({gs.fuel}/{gs.maxFuel})</span>
                  <span className="t-cyan t-xs">{price} cr</span>
                </div>
              </button>
            )
          })()}
        </div>

        {/* VENDRE */}
        <div className="col">
          <div className="t-xs t-dim">VENDRE</div>
          {Object.keys(gs.cargo).length === 0 && (
            <div className="px-box t-dim t-xs">Cargaison vide.</div>
          )}
          {Object.entries(gs.cargo).map(([item, qty]) => {
            const sellPrice = Math.floor(getPrice(item) * 0.70)
            const medBonus  = gs.class.medicBonus && item === 'Médicaments'
              ? Math.floor(sellPrice * 0.5) : 0
            const total = sellPrice + medBonus
            return (
              <button key={item} className="px-btn px-btn--green"
                onClick={() => sellCargo(item, sellPrice)}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="t-xs">{item} ×{qty}</span>
                  <span className="t-green t-xs">
                    +{total} cr{medBonus > 0 ? ` (dont +${medBonus} Médecin)` : ''}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

import { useGameStore } from '../../store/gameStore'

const REPAIR_PRICE = 80  // par PV

export function ShipWorkshopScreen() {
  const gs         = useGameStore(s => s.gs!)
  const goTo       = useGameStore(s => s.goTo)
  const repairShip = useGameStore(s => s.repairShip)
  const buyFuel    = useGameStore(s => s.buyFuel)
  const patch      = useGameStore(s => s.patch)

  const missingHp   = gs.shipMaxHp - gs.shipHp
  const missingFuel = gs.maxFuel - gs.fuel
  const fuelPrice   = 210
  const upgradePrice = 2000

  const shipPct = (gs.shipHp / gs.shipMaxHp) * 100

  return (
    <div className="layout">
      <div className="row" style={{ alignItems: 'center', gap: '16px' }}>
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => goTo('station-hub')}>← RETOUR</button>
        <div className="t-sm t-bright">ATELIER VAISSEAU</div>
        <div className="t-xs t-gold">{gs.credits.toLocaleString()} cr</div>
      </div>

      {/* État du vaisseau */}
      <div className="px-box">
        <div className="t-xs t-dim mb4">STRUCTURE</div>
        <div className="bar bar--ship mb4">
          <div className="bar__fill" style={{ width: `${shipPct}%` }} />
        </div>
        <div className="t-sm" style={{ color: shipPct < 30 ? 'var(--red)' : 'var(--blue)' }}>
          {gs.shipHp} / {gs.shipMaxHp} PV
        </div>
        <div className="t-xs t-dim mt4">
          Carburant : <span className="t-cyan">{gs.fuel}/{gs.maxFuel}</span>
        </div>
      </div>

      {/* Réparations */}
      <div className="px-box">
        <div className="t-xs t-dim mb8">RÉPARATIONS</div>
        {missingHp <= 0
          ? <div className="t-xs t-green">Vaisseau en parfait état.</div>
          : (
            <div className="col gap4">
              {[10, 25, 50, missingHp].filter((v, i, a) => a.indexOf(v) === i && v <= missingHp && v > 0).map(amount => {
                const cost = amount * REPAIR_PRICE
                return (
                  <button key={amount} className="px-btn" disabled={gs.credits < cost}
                    onClick={() => repairShip(amount, REPAIR_PRICE)}>
                    +{amount} PV — {cost.toLocaleString()} cr
                    {gs.credits < cost ? ' (insuffisant)' : ''}
                  </button>
                )
              })}
            </div>
          )
        }
      </div>

      {/* Carburant */}
      {missingFuel > 0 && (
        <div className="px-box">
          <div className="t-xs t-dim mb8">RAVITAILLEMENT</div>
          <div className="col gap4">
            {[1, Math.min(3, missingFuel), missingFuel].filter((v, i, a) => a.indexOf(v) === i && v > 0).map(amount => {
              const cost = amount * fuelPrice
              return (
                <button key={amount} className="px-btn" disabled={gs.credits < cost}
                  onClick={() => buyFuel(amount, fuelPrice)}>
                  +{amount} carburant — {cost} cr
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Amélioration vaisseau */}
      <div className="px-box">
        <div className="t-xs t-dim mb8">AMÉLIORATIONS</div>
        <button className="px-btn" disabled={gs.credits < upgradePrice || gs.shipMaxHp >= 200}
          onClick={() => patch({ credits: gs.credits - upgradePrice, shipMaxHp: gs.shipMaxHp + 20, shipHp: gs.shipHp + 20 })}>
          Renforcer la coque +20 PV max — {upgradePrice.toLocaleString()} cr
          {gs.shipMaxHp >= 200 ? ' (maximum atteint)' : ''}
        </button>
        <button className="px-btn mt4" disabled={gs.credits < upgradePrice || gs.maxFuel >= 15}
          onClick={() => patch({ credits: gs.credits - upgradePrice, maxFuel: gs.maxFuel + 2 })}>
          Réservoir étendu +2 carburant max — {upgradePrice.toLocaleString()} cr
          {gs.maxFuel >= 15 ? ' (maximum atteint)' : ''}
        </button>
        <button className="px-btn mt4" disabled={gs.credits < upgradePrice || gs.playerMaxHp >= 200}
          onClick={() => patch({ credits: gs.credits - upgradePrice, playerMaxHp: gs.playerMaxHp + 20, playerHp: Math.min(gs.playerHp + 20, gs.playerMaxHp + 20) })}>
          Implant médical +20 PV joueur max — {upgradePrice.toLocaleString()} cr
          {gs.playerMaxHp >= 200 ? ' (maximum atteint)' : ''}
        </button>
      </div>
    </div>
  )
}

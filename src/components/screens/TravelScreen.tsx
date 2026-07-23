import { useGameStore } from '../../store/gameStore'
import { getAccessibleStations, getFuelCost } from '../../data/stations'

const DANGER_LABEL = ['◆ SÛR', '◆ RISQUÉ', '◆ DANGEREUX', '◆ ZONE DE GUERRE']
const DANGER_CLS   = ['danger-0', 'danger-1', 'danger-2', 'danger-3']

export function TravelScreen() {
  const gs     = useGameStore(s => s.gs!)
  const travel = useGameStore(s => s.travel)
  const goTo   = useGameStore(s => s.goTo)
  const accessible = getAccessibleStations(gs.currentStation)

  // Seigneur de guerre banni des stations paisibles
  const PEACEFUL = new Set(['Port Méridien', 'Colonie Perséphone', 'Star Quest', 'Scotty Golden North'])

  return (
    <div className="layout">
      <div className="row" style={{ alignItems: 'center', gap: '16px' }}>
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => goTo('station-hub')}>← RETOUR</button>
        <div className="t-sm t-bright">DESTINATION</div>
        <div className="t-xs t-dim">Carburant : <span className="t-cyan">{gs.fuel}/{gs.maxFuel}</span></div>
      </div>

      <div className="col gap4">
        {accessible.length === 0 && (
          <div className="px-box t-dim t-sm">Aucune destination accessible depuis ici.</div>
        )}
        {accessible.map(station => {
          const cost  = getFuelCost(gs.currentStation, station.name)
          const banned = gs.class.peacefulBan && PEACEFUL.has(station.name)
          const canGo = cost <= gs.fuel && !banned

          // Hackeur voit les prix
          const priceHint = gs.class.seesPrices
            ? ` · Prix : ${station.goods.slice(0, 2).join(', ')}...`
            : ''

          return (
            <button key={station.name} className="px-btn" disabled={!canGo} onClick={() => travel(station.name, cost)}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="t-sm t-bright mb4">{station.name}</div>
                  <div className="t-xs t-dim" style={{ lineHeight: '1.8', maxWidth: '500px' }}>
                    {station.description}
                  </div>
                  {priceHint && <div className="t-xs t-cyan mt4">{priceHint}</div>}
                </div>
                <div style={{ textAlign: 'right', minWidth: '110px' }}>
                  <div className={`t-xs ${DANGER_CLS[station.danger]}`}>{DANGER_LABEL[station.danger]}</div>
                  <div className="t-xs mt4" style={{ color: canGo ? 'var(--cyan)' : 'var(--red)' }}>
                    {cost} CARBURANT
                  </div>
                  {banned && <div className="t-xs t-red mt4">BANNI</div>}
                </div>
              </div>
              <div className="t-xs t-dim mt8">
                {station.goods.slice(0, 4).join(' · ')}
              </div>
              {/* Quêtes actives vers cette station */}
              {gs.activeQuests.filter(q => q.targetStation === station.name).map(q => (
                <div key={q.id} className="t-xs t-gold mt4">★ Quête active : {q.title}</div>
              ))}
            </button>
          )
        })}
      </div>
    </div>
  )
}

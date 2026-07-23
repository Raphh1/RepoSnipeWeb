import { useState, useMemo } from 'react'
import { useGameStore } from '../../store/gameStore'
import { getAccessibleStations, getFuelCost, getStation, findPath } from '../../data/stations'
import { getWorldEventFuelBonus, getClosedStations } from '../../engine/worldEvents'
import { AsteroidDodge } from '../minigames/AsteroidDodge'

function NextHops({ stationName, currentName }: { stationName: string; currentName: string }) {
  const hops = getAccessibleStations(stationName).filter(s => s.name !== currentName)
  if (hops.length === 0) return null
  return (
    <div className="t-xs t-dim mt6" style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '6px' }}>
      <span style={{ color: 'var(--border-hi)', marginRight: '4px' }}>Connexions →</span>
      {hops.map((h, i) => (
        <span key={h.name}>
          {i > 0 && <span style={{ opacity: 0.4, margin: '0 4px' }}>·</span>}
          <span style={{ color: 'var(--text-dim)' }}>{h.name}</span>
          <span style={{ color: 'var(--cyan)', opacity: 0.7, marginLeft: '3px', fontSize: '9px' }}>({getFuelCost(stationName, h.name)}⛽)</span>
        </span>
      ))}
    </div>
  )
}

const DANGER_LABEL = ['◆ SÛR', '◆ RISQUÉ', '◆ DANGEREUX', '◆ ZONE DE GUERRE']
const DANGER_CLS   = ['danger-0', 'danger-1', 'danger-2', 'danger-3']

interface Pending { station: string; fuelCost: number; danger: number }

export function TravelScreen() {
  const gs          = useGameStore(s => s.gs!)
  const travel      = useGameStore(s => s.travel)
  const patch       = useGameStore(s => s.patch)
  const goTo        = useGameStore(s => s.goTo)
  const setWaypoint = useGameStore(s => s.setWaypoint)

  const [pending, setPending] = useState<Pending | null>(null)
  const accessible = getAccessibleStations(gs.currentStation)

  const waypoint     = gs.waypoint ?? null
  const waypointPath = useMemo(
    () => waypoint ? findPath(gs.currentStation, waypoint) : [],
    [gs.currentStation, waypoint]
  )
  // Prochaine étape sur le chemin (index 1 = juste après la station courante)
  const nextOnPath = waypointPath.length >= 2 ? waypointPath[1] : null

  // Seigneur de guerre banni des stations paisibles
  const PEACEFUL = new Set(['Port Méridien', 'Colonie Perséphone', 'Star Quest', 'Scotty Golden North'])

  const events = gs.activeWorldEvents ?? []
  const fuelBonus = getWorldEventFuelBonus(events)
  const closedByEvent = getClosedStations(events)

  // Mini-jeu astéroïdes — déclenché à 30%
  if (pending) {
    return (
      <AsteroidDodge
        dangerLevel={pending.danger}
        onResult={(shipDamage, creditBonus) => {
          // Appliquer les dégâts vaisseau avant de voyager
          if (shipDamage > 0) patch({ shipHp: Math.max(1, gs.shipHp - shipDamage) })
          if (creditBonus > 0) patch({ credits: gs.credits + creditBonus })
          setPending(null)
          travel(pending.station, pending.fuelCost)
        }}
      />
    )
  }

  return (
    <div className="layout">
      <div className="row" style={{ alignItems: 'center', gap: '16px' }}>
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => goTo('station-hub')}>← RETOUR</button>
        <div className="t-sm t-bright">DESTINATION</div>
        <div className="t-xs t-dim">Carburant : <span className="t-cyan">{gs.fuel}/{gs.maxFuel}</span></div>
      </div>

      {/* Bandeau de route planifiée */}
      {waypoint && waypointPath.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.4)', padding: '8px 12px' }}>
          <span style={{ fontSize: '9px', color: '#ffd700', letterSpacing: '1px', flexShrink: 0 }}>◎ ROUTE</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
            {waypointPath.map((name, i) => (
              <span key={name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{
                  fontSize: '9px',
                  color: name === gs.currentStation ? 'var(--cyan)' : name === waypoint ? '#ffd700' : name === nextOnPath ? '#ffd700' : 'var(--dim)',
                  fontWeight: name === nextOnPath || name === waypoint ? 'bold' : 'normal',
                }}>
                  {name}
                </span>
                {i < waypointPath.length - 1 && <span style={{ color: 'var(--border)', fontSize: '9px' }}>→</span>}
              </span>
            ))}
          </div>
          {waypointPath.length === 1 && waypoint === gs.currentStation && (
            <span style={{ fontSize: '8px', color: 'var(--green)' }}>Destination atteinte !</span>
          )}
          <button
            style={{ background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', fontSize: '11px', padding: '0 4px', flexShrink: 0 }}
            onClick={() => setWaypoint(null)}
            title="Effacer la route"
          >✕</button>
        </div>
      )}

      {/* Événements mondiaux actifs */}
      {events.length > 0 && (
        <div className="col gap4" style={{ marginBottom: '4px' }}>
          {events.map(evt => (
            <div key={evt.id} className="px-box" style={{ borderColor: evt.color, background: 'rgba(0,0,0,0.4)', padding: '8px 12px' }}>
              <div className="row" style={{ alignItems: 'center', gap: '8px' }}>
                <span style={{ color: evt.color, fontSize: '9px', letterSpacing: '1px' }}>⚠ {evt.title}</span>
                <span className="t-xs t-dim" style={{ marginLeft: 'auto' }}>J{evt.startDay} → J{evt.startDay + evt.duration}</span>
              </div>
              <div className="t-xs t-dim" style={{ marginTop: '2px' }}>{evt.shortDesc}</div>
            </div>
          ))}
          {fuelBonus > 0 && (
            <div className="t-xs t-red" style={{ paddingLeft: '4px' }}>
              ⚠ Surcoût carburant actif : +{fuelBonus} par trajet
            </div>
          )}
        </div>
      )}

      <div className="col gap4">
        {accessible.length === 0 && (
          <div className="px-box t-dim t-sm">Aucune destination accessible depuis ici.</div>
        )}
        {accessible.map(station => {
          const baseCost = getFuelCost(gs.currentStation, station.name)
          const cost = baseCost + fuelBonus
          const banned = gs.class.peacefulBan && PEACEFUL.has(station.name)
          const isClosed = closedByEvent.has(station.name)
          const canGo = cost <= gs.fuel && !banned && !isClosed

          // Hackeur voit les prix
          const priceHint = gs.class.seesPrices
            ? ` · Prix : ${station.goods.slice(0, 2).join(', ')}...`
            : ''

          function handleTravel() {
            // 30% de chance de déclencher le mini-jeu astéroïdes
            if (Math.random() < 0.30) {
              setPending({ station: station.name, fuelCost: cost, danger: station.danger })
            } else {
              travel(station.name, cost)
            }
          }

          const isNextOnPath = station.name === nextOnPath
          const isWaypoint   = station.name === waypoint

          return (
            <button key={station.name} className="px-btn" disabled={!canGo} onClick={handleTravel}
              style={isNextOnPath || isWaypoint ? { borderColor: '#ffd700', boxShadow: '0 0 8px rgba(255,215,0,0.25)' } : undefined}>
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
                    {cost} CARBURANT{fuelBonus > 0 ? <span className="t-red"> (+{fuelBonus})</span> : ''}
                  </div>
                  {banned && <div className="t-xs t-red mt4">BANNI</div>}
                  {isClosed && <div className="t-xs t-red mt4">⚠ BLOQUÉ</div>}
                </div>
              </div>
              <div className="t-xs t-dim mt8">
                {station.goods.slice(0, 4).join(' · ')}
              </div>
              {/* Badge route */}
              {isNextOnPath && <div style={{ fontSize: '8px', color: '#ffd700', marginTop: '4px', letterSpacing: '1px' }}>◎ PROCHAINE ÉTAPE DE LA ROUTE</div>}
              {isWaypoint && !isNextOnPath && <div style={{ fontSize: '8px', color: '#ffd700', marginTop: '4px', letterSpacing: '1px' }}>◎ DESTINATION FINALE</div>}
              {/* Quêtes actives vers cette station */}
              {gs.activeQuests.filter(q => q.targetStation === station.name).map(q => (
                <div key={q.id} className="t-xs t-gold mt4">★ Quête active : {q.title}</div>
              ))}
              <NextHops stationName={station.name} currentName={gs.currentStation} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

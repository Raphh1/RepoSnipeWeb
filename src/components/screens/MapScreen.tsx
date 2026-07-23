import { useState, useRef, useCallback, useMemo } from 'react'
import { useGameStore } from '../../store/gameStore'
import { STATIONS, getAccessibleStations, PEACEFUL_STATIONS, findPath } from '../../data/stations'
import { STATION_POSITIONS } from '../../data/stationPositions'
import { STATION_FACTION_CONTROL } from '../../engine/factionRep'
import { getClosedStations, getWorldEventFuelBonus, getActiveEvents } from '../../engine/worldEvents'

const TYPE_COLORS: Record<string, string> = {
  peaceful:    '#40ff80',
  military:    '#4488ff',
  dangerous:   '#ff4444',
  ruins:       '#a040ff',
  scientific:  '#40d0ff',
  luxury:      '#ffd700',
  industrial:  '#ff8040',
}

const FACTION_COLORS: Record<string, string> = {
  cesarion:   '#ffd700',
  raphazarus: '#a040ff',
  alanossa:   '#ff4444',
  scotty:     '#40ff80',
  eliotis:    '#40d0ff',
}

const DANGER_LABEL = ['Sûre', 'Risquée', 'Dangereuse', 'Zone de guerre']

// Paires d'arêtes déduplicées à partir de fuelCostFrom
function buildEdges() {
  const seen = new Set<string>()
  const result: Array<{ from: string; to: string; cost: number }> = []
  for (const station of STATIONS) {
    for (const [from, cost] of Object.entries(station.fuelCostFrom)) {
      const key = [from, station.name].sort().join('||')
      if (!seen.has(key) && STATION_POSITIONS[from] && STATION_POSITIONS[station.name]) {
        seen.add(key)
        result.push({ from, to: station.name, cost })
      }
    }
  }
  return result
}

const EDGES = buildEdges()

export function MapScreen() {
  const gs          = useGameStore(s => s.gs!)
  const goTo        = useGameStore(s => s.goTo)
  const setWaypoint = useGameStore(s => s.setWaypoint)

  const [hovered, setHovered]   = useState<string | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [pan, setPan]           = useState({ x: 0, y: 0 })
  const [zoom, setZoom]         = useState(0.9)
  const draggingRef             = useRef(false)
  const dragStartRef            = useRef({ x: 0, y: 0 })
  const panStartRef             = useRef({ x: 0, y: 0 })
  const svgRef                  = useRef<SVGSVGElement>(null)
  const didDragRef              = useRef(false)

  const events         = getActiveEvents(gs)
  const closedStations = new Set(getClosedStations(events))
  const fuelBonus      = getWorldEventFuelBonus(events)
  const questStations  = new Set(gs.activeQuests.map(q => q.targetStation))
  const accessibleNow  = new Set(getAccessibleStations(gs.currentStation).map(s => s.name))
  const bannedNow      = gs.class?.peacefulBan
    ? PEACEFUL_STATIONS
    : new Set<string>()

  const excludedStations = useMemo(() => {
    const ex = new Set(closedStations)
    if (!gs.arcPerduUnlocked) ex.add("L'Arc Perdu")
    for (const s of bannedNow) ex.add(s)
    return ex
  }, [closedStations, gs.arcPerduUnlocked, bannedNow])

  const waypoint    = gs.waypoint ?? null
  const waypointPath = useMemo(
    () => waypoint ? findPath(gs.currentStation, waypoint, excludedStations) : [],
    [gs.currentStation, waypoint, excludedStations]
  )
  const pathSet = new Set(waypointPath)

  // ── PAN / ZOOM ──────────────────────────────────────────────────────────

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setZoom(z => Math.min(3, Math.max(0.4, z - e.deltaY * 0.001)))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    draggingRef.current  = true
    didDragRef.current   = false
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    panStartRef.current  = { x: pan.x, y: pan.y }
  }, [pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY })
    if (!draggingRef.current) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDragRef.current = true
    setPan({ x: panStartRef.current.x + dx, y: panStartRef.current.y + dy })
  }, [])

  const handleMouseUp = useCallback(() => { draggingRef.current = false }, [])

  // ── TOOLTIP ─────────────────────────────────────────────────────────────

  const hovStation = hovered ? STATIONS.find(s => s.name === hovered) ?? null : null

  // ── RENDER ──────────────────────────────────────────────────────────────

  return (
    <div style={{ width: '100%', height: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 20px', borderBottom: '2px solid var(--border)', flexShrink: 0 }}>
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => goTo('station-hub')}>← RETOUR</button>
        <span style={{ fontSize: '10px', letterSpacing: '3px', color: 'var(--dim)' }}>CARTE DU SECTEUR</span>
        <span style={{ fontSize: '9px', color: 'var(--cyan)', marginLeft: '8px' }}>Molette pour zoomer · Glisser pour naviguer · Clic pour poser un waypoint</span>
        {events.length > 0 && (
          <span style={{ fontSize: '8px', color: 'var(--orange)', marginLeft: 'auto', letterSpacing: '1px' }}>
            ⚠ {events.length} ÉVÉNEMENT{events.length > 1 ? 'S' : ''} ACTIF{events.length > 1 ? 'S' : ''}
            {fuelBonus > 0 ? ` · +${fuelBonus}⛽ par trajet` : ''}
          </span>
        )}
        {/* Waypoint actif */}
        {waypoint && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,215,0,0.08)', border: '1px solid #ffd700', padding: '4px 10px', marginLeft: '8px' }}>
            <span style={{ fontSize: '9px', color: '#ffd700', letterSpacing: '1px' }}>
              ◎ ROUTE → {waypoint}
              {waypointPath.length > 2 && (
                <span style={{ color: 'var(--dim)', marginLeft: '6px' }}>
                  ({waypointPath.length - 1} saut{waypointPath.length - 1 > 1 ? 's' : ''})
                </span>
              )}
            </span>
            <button
              style={{ background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', fontSize: '11px', padding: '0 2px', lineHeight: 1 }}
              onClick={() => setWaypoint(null)}
              title="Effacer la route"
            >✕</button>
          </div>
        )}
        {/* Légende compacte */}
        <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          {Object.entries(TYPE_COLORS).map(([t, c]) => (
            <span key={t} style={{ fontSize: '8px', color: c, letterSpacing: '1px' }}>● {t}</span>
          ))}
        </div>
      </div>

      {/* SVG Map */}
      <svg
        ref={svgRef}
        style={{ flex: 1, cursor: draggingRef.current ? 'grabbing' : 'grab', userSelect: 'none' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>

          {/* Grille de fond très subtile */}
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1a1a2a" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect x="-500" y="-500" width="2000" height="2000" fill="url(#grid)" />

          {/* ── ARÊTES ─────────────────────────────────────────────────────── */}
          {EDGES.map(({ from, to, cost }) => {
            const fp = STATION_POSITIONS[from]
            const tp = STATION_POSITIONS[to]
            if (!fp || !tp) return null
            if ((from === "L'Arc Perdu" || to === "L'Arc Perdu") && !gs.arcPerduUnlocked) return null

            const isCurrentEdge = from === gs.currentStation || to === gs.currentStation
            const otherStation  = from === gs.currentStation ? to : to === gs.currentStation ? from : null
            const isAccessible  = otherStation ? accessibleNow.has(otherStation) : false
            const isClosed      = closedStations.has(from) || closedStations.has(to)

            // Arête sur le chemin waypoint : les deux extrémités doivent être dans pathSet
            // et être consécutives dans waypointPath
            const fromIdx = waypointPath.indexOf(from)
            const toIdx   = waypointPath.indexOf(to)
            const isOnPath = fromIdx !== -1 && toIdx !== -1 && Math.abs(fromIdx - toIdx) === 1

            return (
              <g key={`${from}||${to}`}>
                <line
                  x1={fp.x} y1={fp.y} x2={tp.x} y2={tp.y}
                  stroke={
                    isOnPath           ? '#ffd700'
                    : isClosed         ? '#440000'
                    : isCurrentEdge && isAccessible ? 'rgba(64,208,255,0.55)'
                    : isCurrentEdge    ? 'rgba(64,208,255,0.25)'
                    : 'rgba(58,58,106,0.55)'
                  }
                  strokeWidth={isOnPath ? 2.5 : isCurrentEdge && isAccessible ? 2 : 1}
                  strokeDasharray={isClosed ? '4 3' : undefined}
                  strokeOpacity={isOnPath ? 0.85 : 1}
                />
                {/* Coût carburant sur les arêtes accessibles depuis la station actuelle */}
                {isCurrentEdge && isAccessible && (
                  <text
                    x={(fp.x + tp.x) / 2} y={(fp.y + tp.y) / 2 - 4}
                    fontSize="8" fill="rgba(64,208,255,0.8)" textAnchor="middle"
                    style={{ fontFamily: 'monospace', pointerEvents: 'none' }}
                  >
                    {cost + fuelBonus}⛽
                  </text>
                )}
              </g>
            )
          })}

          {/* ── NŒUDS ──────────────────────────────────────────────────────── */}
          {STATIONS.map(station => {
            const pos     = STATION_POSITIONS[station.name]
            if (!pos) return null
            if (station.name === "L'Arc Perdu" && !gs.arcPerduUnlocked) return null

            const isCurrent   = station.name === gs.currentStation
            const isAccessible= accessibleNow.has(station.name)
            const isClosed    = closedStations.has(station.name)
            const isBanned    = bannedNow.has(station.name)
            const hasQuest    = questStations.has(station.name)
            const isHov       = hovered === station.name
            const factionKey  = STATION_FACTION_CONTROL[station.name]
            const factionCol  = factionKey ? FACTION_COLORS[factionKey] ?? null : null
            const typeCol     = TYPE_COLORS[station.type] ?? '#888'
            const r           = isCurrent ? 10 : isHov ? 9 : 7

            const isWaypoint  = station.name === waypoint
            const isOnPath    = pathSet.has(station.name) && !isCurrent

            return (
              <g
                key={station.name}
                style={{ cursor: isCurrent ? 'default' : 'pointer' }}
                onMouseEnter={() => setHovered(station.name)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => {
                  if (didDragRef.current || isCurrent) return
                  setWaypoint(isWaypoint ? null : station.name)
                }}
              >
                {/* Glow current */}
                {isCurrent && (
                  <circle cx={pos.x} cy={pos.y} r={18} fill="none" stroke={typeCol} strokeWidth="1" opacity="0.3" />
                )}
                {/* Halo waypoint */}
                {isWaypoint && (
                  <circle cx={pos.x} cy={pos.y} r={r + 7} fill="none" stroke="#ffd700" strokeWidth="2" opacity="0.9" />
                )}
                {/* Halo stations sur le chemin */}
                {isOnPath && !isWaypoint && (
                  <circle cx={pos.x} cy={pos.y} r={r + 5} fill="rgba(255,215,0,0.08)" stroke="#ffd700" strokeWidth="1" opacity="0.6" />
                )}
                {/* Ring quête */}
                {hasQuest && !isCurrent && !isWaypoint && (
                  <circle cx={pos.x} cy={pos.y} r={r + 4} fill="none" stroke="#ffd700" strokeWidth="1.5" strokeDasharray="3 2" />
                )}
                {/* Ring faction */}
                {factionCol && (
                  <circle cx={pos.x} cy={pos.y} r={r + 2} fill="none" stroke={factionCol} strokeWidth="1" opacity="0.7" />
                )}
                {/* Nœud principal */}
                <circle
                  cx={pos.x} cy={pos.y} r={r}
                  fill={isClosed || isBanned ? '#1a1a2a' : typeCol}
                  fillOpacity={isClosed ? 0.3 : isBanned ? 0.25 : isAccessible ? 1 : 0.65}
                  stroke={isCurrent ? '#ffffff' : isHov ? typeCol : 'rgba(0,0,0,0.5)'}
                  strokeWidth={isCurrent ? 2.5 : isHov ? 1.5 : 1}
                />
                {/* Croix si fermé par événement */}
                {isClosed && (
                  <>
                    <line x1={pos.x - 5} y1={pos.y - 5} x2={pos.x + 5} y2={pos.y + 5} stroke="#ff4444" strokeWidth="1.5" />
                    <line x1={pos.x + 5} y1={pos.y - 5} x2={pos.x - 5} y2={pos.y + 5} stroke="#ff4444" strokeWidth="1.5" />
                  </>
                )}
                {/* Marqueur waypoint */}
                {isWaypoint && (
                  <text x={pos.x} y={pos.y - r - 4} fontSize="10" fill="#ffd700" textAnchor="middle" style={{ pointerEvents: 'none' }}>◎</text>
                )}
                {/* Numéro d'étape sur le chemin */}
                {isOnPath && !isWaypoint && (() => {
                  const step = waypointPath.indexOf(station.name)
                  return step > 0 ? (
                    <text x={pos.x + r + 1} y={pos.y - r + 1} fontSize="7" fill="#ffd700" textAnchor="middle" style={{ pointerEvents: 'none' }}>{step}</text>
                  ) : null
                })()}
                {/* Étoile quête */}
                {hasQuest && (
                  <text x={pos.x + r - 2} y={pos.y - r + 2} fontSize="8" fill="#ffd700" textAnchor="middle" style={{ pointerEvents: 'none' }}>★</text>
                )}
                {/* Label station */}
                <text
                  x={pos.x} y={pos.y + r + 11}
                  fontSize={isCurrent ? 8 : 7}
                  fill={isCurrent ? '#ffffff' : isClosed || isBanned ? '#444' : isAccessible ? 'rgba(200,200,240,0.9)' : 'rgba(120,120,170,0.7)'}
                  textAnchor="middle"
                  style={{ fontFamily: 'monospace', pointerEvents: 'none', fontWeight: isCurrent ? 'bold' : 'normal' }}
                >
                  {station.name.length > 18 ? station.name.slice(0, 16) + '…' : station.name}
                </text>
              </g>
            )
          })}

        </g>
      </svg>

      {/* ── TOOLTIP ─────────────────────────────────────────────────────────── */}
      {hovStation && (
        <div style={{
          position: 'fixed',
          left: mousePos.x + 14,
          top: mousePos.y - 10,
          background: 'var(--bg-panel2)',
          border: `2px solid ${TYPE_COLORS[hovStation.type] ?? 'var(--border)'}`,
          padding: '10px 14px',
          zIndex: 200,
          maxWidth: '260px',
          pointerEvents: 'none',
          boxShadow: `0 0 12px ${TYPE_COLORS[hovStation.type] ?? 'transparent'}44`,
        }}>
          <div style={{ fontSize: '10px', color: TYPE_COLORS[hovStation.type], letterSpacing: '1px', marginBottom: '6px' }}>
            {hovStation.name}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '8px', color: 'var(--dim)', border: '1px solid var(--border)', padding: '1px 5px' }}>
              {hovStation.type}
            </span>
            <span style={{ fontSize: '8px', color: ['#40ff80','#ffee40','#ff8040','#ff4444'][hovStation.danger] }}>
              {DANGER_LABEL[hovStation.danger]}
            </span>
            {STATION_FACTION_CONTROL[hovStation.name] && (
              <span style={{ fontSize: '8px', color: FACTION_COLORS[STATION_FACTION_CONTROL[hovStation.name]] ?? 'var(--dim)', border: '1px solid currentColor', padding: '1px 5px' }}>
                {STATION_FACTION_CONTROL[hovStation.name]}
              </span>
            )}
          </div>
          {closedStations.has(hovStation.name) && (
            <div style={{ fontSize: '8px', color: 'var(--red)', marginBottom: '4px' }}>⚠ FERMÉE PAR ÉVÉNEMENT MONDIAL</div>
          )}
          {bannedNow.has(hovStation.name) && (
            <div style={{ fontSize: '8px', color: 'var(--red)', marginBottom: '4px' }}>⛔ ACCÈS BANNI</div>
          )}
          {questStations.has(hovStation.name) && (
            <div style={{ fontSize: '8px', color: 'var(--gold)', marginBottom: '4px' }}>★ QUÊTE ACTIVE</div>
          )}
          {accessibleNow.has(hovStation.name) && (
            <div style={{ fontSize: '8px', color: 'var(--cyan)', marginBottom: '4px' }}>
              ⛽ {(hovStation.fuelCostFrom[gs.currentStation] ?? 0) + fuelBonus} carburant depuis ici
            </div>
          )}
          {hovStation.goods.length > 0 && (
            <div style={{ fontSize: '8px', color: 'var(--dim)', borderTop: '1px solid var(--border)', paddingTop: '6px', marginTop: '4px' }}>
              {hovStation.goods.slice(0, 4).join(' · ')}
            </div>
          )}
          {gs.activeQuests.filter(q => q.targetStation === hovStation.name).map(q => (
            <div key={q.id} style={{ fontSize: '8px', color: 'var(--gold)', marginTop: '4px' }}>★ {q.title}</div>
          ))}
        </div>
      )}

    </div>
  )
}

import { useGameStore } from './store/gameStore'
import { ClassSelect }          from './components/screens/ClassSelect'
import { StationHub }           from './components/screens/StationHub'
import { CombatScreen }         from './components/screens/CombatScreen'
import { TravelScreen }         from './components/screens/TravelScreen'
import { MarketScreen }         from './components/screens/MarketScreen'
import { InventoryScreen }      from './components/screens/InventoryScreen'
import { PrisonScreen }         from './components/screens/PrisonScreen'
import { FactionsScreen }       from './components/screens/FactionsScreen'
import { QuestsScreen }         from './components/screens/QuestsScreen'
import { ObjectivesScreen }     from './components/screens/ObjectivesScreen'
import { ShipWorkshopScreen }   from './components/screens/ShipWorkshopScreen'
import { NarrativeArcsScreen }  from './components/screens/NarrativeArcsScreen'
import { CombatResultScreen }   from './components/screens/CombatResultScreen'
import { CombatOutcomeScreen }  from './components/screens/CombatOutcomeScreen'
import { StationArrivalScreen } from './components/screens/StationArrivalScreen'
import { OBJECTIVES }           from './engine/objectives'

export default function App() {
  const gs = useGameStore(s => s.gs)
  if (!gs) return <ClassSelect />
  if (gs.isDead || gs.screen === 'game-over') return <GameOver />

  switch (gs.screen) {
    case 'station-hub':   return <StationHub />
    case 'combat':        return <CombatScreen />
    case 'travel':        return <TravelScreen />
    case 'market':        return <MarketScreen />
    case 'inventory':     return <InventoryScreen />
    case 'prison':        return <PrisonScreen />
    case 'factions':      return <FactionsScreen />
    case 'quests':        return <QuestsScreen />
    case 'objectives':    return <ObjectivesScreen />
    case 'ship-workshop': return <ShipWorkshopScreen />
    case 'narrative-arcs':return <NarrativeArcsScreen />
    case 'station-arrival':return <StationArrivalScreen />
    case 'combat-result':  return <CombatResultScreen />
    case 'combat-outcome': return <CombatOutcomeScreen />
    default:              return <StationHub />
  }
}

function GameOver() {
  const gs      = useGameStore(s => s.gs!)
  const newGame = useGameStore(s => s.newGame)
  const completed = OBJECTIVES.filter(o => gs.completedObjectives.includes(o.id))

  return (
    <div className="layout scanlines" style={{ justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <div className="px-box px-box--hi t-center mb8">
          <div className="t-xl t-red mb8">GAME OVER</div>
          <div className="t-sm t-dim mb4">{gs.deathCause || 'La run s\'arrête ici.'}</div>
          <div className="t-xs t-dim">
            Le vide ne retient pas les noms.
          </div>
        </div>

        {/* Stats */}
        <div className="px-box mb8">
          <div className="t-xs t-dim mb8">BILAN DE LA RUN</div>
          <div className="grid2" style={{ gap: '8px' }}>
            <StatLine label="Jours survécus"     value={`${gs.day}`}                    color="var(--text)" />
            <StatLine label="Crédits finaux"      value={`${gs.credits.toLocaleString()} cr`} color="var(--gold)" />
            <StatLine label="Réputation"          value={`${gs.reputation}`}             color={gs.reputation >= 0 ? 'var(--green)' : 'var(--red)'} />
            <StatLine label="Stations visitées"   value={`${gs.visitedStations.length}`} color="var(--cyan)" />
            <StatLine label="Combats gagnés"      value={`${gs.combatsWon}`}             color="var(--green)" />
            <StatLine label="Combats fuis"        value={`${gs.combatsFled}`}            color="var(--text-dim)" />
            <StatLine label="Quêtes complétées"   value={`${gs.completedQuestIds.length}`} color="var(--cyan)" />
            <StatLine label="Boss vaincus"        value={`${gs.bossesDefeated}`}         color="var(--gold)" />
            <StatLine label="Évasions de prison"  value={`${gs.prisonEscapes}`}          color="var(--orange)" />
            <StatLine label="Classe"              value={gs.class.name}                  color={gs.class.color} />
          </div>
        </div>

        {/* Objectifs */}
        {completed.length > 0 && (
          <div className="px-box mb8">
            <div className="t-xs t-dim mb8">OBJECTIFS ACCOMPLIS ({completed.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {completed.map(o => (
                <div key={o.id} className="tag tag--gold t-xs">{o.name}</div>
              ))}
            </div>
          </div>
        )}

        {/* Arcs complétés */}
        {gs.completedArcs.length > 0 && (
          <div className="px-box mb8">
            <div className="t-xs t-dim mb4">ARCS NARRATIFS COMPLÉTÉS</div>
            {gs.completedArcs.map(id => (
              <div key={id} className="t-xs t-cyan" style={{ lineHeight: '2' }}>★ {id}</div>
            ))}
          </div>
        )}

        <button className="px-btn px-btn--primary" onClick={newGame}>
          NOUVELLE RUN
        </button>
      </div>
    </div>
  )
}

function StatLine({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span className="t-xs t-dim">{label}</span>
      <span className="t-xs" style={{ color }}>{value}</span>
    </div>
  )
}

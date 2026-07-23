import { useEffect, useState } from 'react'
import { useGameStore } from './store/gameStore'
import { useMetaStore }  from './store/metaStore'
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
import { MetaScreen }           from './components/screens/MetaScreen'
import { CraftingScreen }       from './components/screens/CraftingScreen'
import { LoreScreen }           from './components/screens/LoreScreen'
import { InterrogationScreen }  from './components/screens/InterrogationScreen'
import { NexusScreen }          from './components/screens/NexusScreen'
import { JournalScreen }        from './components/screens/JournalScreen'
import { IntroScreen }          from './components/screens/IntroScreen'
import { CinematicIntro }       from './components/screens/CinematicIntro'
import { EscortMiniGameScreen } from './components/screens/EscortMiniGameScreen'
import { MapScreen }           from './components/screens/MapScreen'
import { OBJECTIVES }           from './engine/objectives'
import { META_UNLOCKS }         from './data/metaUnlocks'

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3200)
    return () => clearTimeout(t)
  }, [message])
  return <div className="toast" onClick={onDismiss}>{message}</div>
}

function renderScreen(screen: string) {
  switch (screen) {
    case 'intro':          return <IntroScreen />
    case 'station-hub':    return <StationHub />
    case 'combat':         return <CombatScreen />
    case 'travel':         return <TravelScreen />
    case 'market':         return <MarketScreen />
    case 'inventory':      return <InventoryScreen />
    case 'prison':         return <PrisonScreen />
    case 'factions':       return <FactionsScreen />
    case 'quests':         return <QuestsScreen />
    case 'objectives':     return <ObjectivesScreen />
    case 'ship-workshop':  return <ShipWorkshopScreen />
    case 'narrative-arcs': return <NarrativeArcsScreen />
    case 'station-arrival':return <StationArrivalScreen />
    case 'combat-result':  return <CombatResultScreen />
    case 'combat-outcome': return <CombatOutcomeScreen />
    case 'crafting':       return <CraftingScreen />
    case 'lore':           return <LoreScreen />
    case 'interrogation':  return <InterrogationScreen />
    case 'nexus':          return <NexusScreen />
    case 'journal':        return <JournalScreen />
    case 'escort-minigame': return <EscortMiniGameScreen />
    case 'map':            return <MapScreen />
    default:               return <StationHub />
  }
}

export default function App() {
  const gs    = useGameStore(s => s.gs)
  const patch = useGameStore(s => s.patch)
  const [showMeta, setShowMeta]       = useState(false)
  const [showCinematic, setShowCinematic] = useState(
    () => !localStorage.getItem('vt_launched')
  )

  function handleCinematicDone() {
    localStorage.setItem('vt_launched', '1')
    setShowCinematic(false)
  }

  if (showCinematic) return <CinematicIntro onDone={handleCinematicDone} />

  if (!gs) {
    return <ClassSelect />
  }
  if (gs.isDead || gs.screen === 'game-over') return <GameOver onMeta={() => setShowMeta(true)} showMeta={showMeta} onBackFromMeta={() => setShowMeta(false)} />
  if (gs.screen === 'victory') return <Victory onMeta={() => setShowMeta(true)} showMeta={showMeta} onBackFromMeta={() => setShowMeta(false)} />

  return (
    <>
      <div key={gs.screen} className="screen-enter">
        {renderScreen(gs.screen)}
      </div>
      {gs.pendingMessage && (
        <Toast message={gs.pendingMessage} onDismiss={() => patch({ pendingMessage: null })} />
      )}
    </>
  )
}

function RunStats({ gs }: { gs: ReturnType<typeof useGameStore.getState>['gs'] & object }) {
  const completed = OBJECTIVES.filter(o => gs.completedObjectives.includes(o.id))
  return (
    <>
      <div className="px-box mb8">
        <div className="t-xs t-dim mb8">BILAN DE LA RUN</div>
        <div className="grid2" style={{ gap: '8px' }}>
          <StatLine label="Jours survécus"     value={`${gs.day}`}                         color="var(--text)" />
          <StatLine label="Crédits finaux"      value={`${gs.credits.toLocaleString()} cr`} color="var(--gold)" />
          <StatLine label="Réputation"          value={`${gs.reputation}`}                  color={gs.reputation >= 0 ? 'var(--green)' : 'var(--red)'} />
          <StatLine label="Stations visitées"   value={`${gs.visitedStations.length}`}      color="var(--cyan)" />
          <StatLine label="Combats gagnés"      value={`${gs.combatsWon}`}                  color="var(--green)" />
          <StatLine label="Combats fuis"        value={`${gs.combatsFled}`}                 color="var(--text-dim)" />
          <StatLine label="Quêtes complétées"   value={`${gs.completedQuestIds.length}`}    color="var(--cyan)" />
          <StatLine label="Boss vaincus"        value={`${gs.bossesDefeated}`}              color="var(--gold)" />
          <StatLine label="Évasions de prison"  value={`${gs.prisonEscapes}`}               color="var(--orange)" />
          <StatLine label="Classe"              value={gs.class.name}                       color={gs.class.color} />
        </div>
      </div>
      {completed.length > 0 && (
        <div className="px-box mb8">
          <div className="t-xs t-dim mb8">OBJECTIFS ACCOMPLIS ({completed.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {completed.map(o => <div key={o.id} className="tag tag--gold t-xs">{o.name}</div>)}
          </div>
        </div>
      )}
      {gs.completedArcs.length > 0 && (
        <div className="px-box mb8">
          <div className="t-xs t-dim mb4">ARCS NARRATIFS COMPLÉTÉS</div>
          {gs.completedArcs.map(id => (
            <div key={id} className="t-xs t-cyan" style={{ lineHeight: '2' }}>★ {id}</div>
          ))}
        </div>
      )}
    </>
  )
}

function PointsBadge() {
  const pts = useMetaStore(s => s.availablePoints())
  if (pts === 0) return null
  return (
    <div className="t-xs" style={{ color: 'var(--purple)', marginBottom: '8px' }}>
      ★ +{pts} point{pts > 1 ? 's' : ''} d'héritage disponible{pts > 1 ? 's' : ''} — investis-les dans HÉRITAGE
    </div>
  )
}

function NextUnlockBar() {
  const meta = useMetaStore(s => s.meta)
  const earned = meta.totalPointsEarned
  const unlocked = meta.unlockedIds

  const next = META_UNLOCKS
    .filter(u => !unlocked.includes(u.id) && (!u.requires || unlocked.includes(u.requires)))
    .sort((a, b) => a.cost - b.cost)[0]

  if (!next) return (
    <div className="px-box mb8" style={{ borderColor: 'var(--gold)', textAlign: 'center' }}>
      <div className="t-xs t-gold">★ Tout est débloqué. Tu as tout vu.</div>
    </div>
  )

  const pct = Math.min(100, Math.round((earned / next.cost) * 100))
  const remaining = Math.max(0, next.cost - earned)

  return (
    <div className="px-box mb8" style={{ borderColor: 'var(--purple)' }}>
      <div className="t-xs t-dim mb4">PROCHAIN DÉBLOCAGE</div>
      <div className="t-xs t-bright mb2">{next.name}</div>
      <div className="t-xs t-dim mb6" style={{ lineHeight: '1.8' }}>{next.description}</div>
      <div style={{ background: 'var(--border)', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--purple)', transition: 'width 0.4s ease' }} />
      </div>
      <div className="t-xs t-dim">
        {earned}/{next.cost} points · {remaining > 0 ? `encore ${remaining} point${remaining > 1 ? 's' : ''}` : '★ Disponible !'}
      </div>
    </div>
  )
}

function GameOver({ onMeta, showMeta, onBackFromMeta }: { onMeta: () => void; showMeta: boolean; onBackFromMeta: () => void }) {
  const gs      = useGameStore(s => s.gs!)
  const newGame = useGameStore(s => s.newGame)
  if (showMeta) return <MetaScreen onBack={onBackFromMeta} />
  return (
    <div className="layout scanlines" style={{ justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <div className="px-box px-box--hi t-center mb8" style={{ borderColor: 'var(--red)' }}>
          <div className="t-xl t-red mb8">GAME OVER</div>
          <div className="t-sm t-dim mb4">{gs.deathCause || 'La run s\'arrête ici.'}</div>
          <div className="t-xs t-dim">Le vide ne retient pas les noms.</div>
        </div>
        <PointsBadge />
        <NextUnlockBar />
        <RunStats gs={gs} />
        <div className="row gap4">
          <button className="px-btn" style={{ flex: 1, borderColor: 'var(--purple)', color: 'var(--purple)' }} onClick={onMeta}>
            ★ HÉRITAGE
          </button>
          <button className="px-btn px-btn--primary" style={{ flex: 2 }} onClick={newGame}>
            NOUVELLE RUN
          </button>
        </div>
      </div>
    </div>
  )
}

function Victory({ onMeta, showMeta, onBackFromMeta }: { onMeta: () => void; showMeta: boolean; onBackFromMeta: () => void }) {
  const gs               = useGameStore(s => s.gs!)
  const newGame          = useGameStore(s => s.newGame)
  const continueConquest = useGameStore(s => s.continueConquest)
  if (showMeta) return <MetaScreen onBack={onBackFromMeta} />
  return (
    <div className="layout scanlines" style={{ justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <div className="px-box px-box--hi t-center mb8" style={{ borderColor: 'var(--gold)' }}>
          <div className="t-xl mb8" style={{ color: 'var(--gold)' }}>★ VICTOIRE ★</div>
          <div className="t-sm t-dim mb4">Le Nexus est restauré. Tu as survécu.</div>
          <div className="t-xs t-dim">Le vide se souviendra de ce nom.</div>
        </div>

        {/* Continuation — la conquête spatiale */}
        <div className="px-box mb8" style={{ borderColor: 'var(--cyan)' }}>
          <div className="t-sm mb4" style={{ color: 'var(--cyan)' }}>ET MAINTENANT ?</div>
          <div className="t-xs t-dim" style={{ lineHeight: '2' }}>
            Le Nexus est entre tes mains, mais le secteur ne s'est pas incliné pour autant.
            Tu peux <span className="t-cyan">continuer ta conquête spatiale</span> avec ce personnage :
            accomplis <span className="t-bright">tous les objectifs</span>, abats les derniers boss et
            grave ton nom dans le vide pour de bon. Ou repars de zéro.
          </div>
        </div>

        <PointsBadge />
        <NextUnlockBar />
        <RunStats gs={gs} />
        <button className="px-btn px-btn--primary mb8" onClick={continueConquest}
          style={{ width: '100%', borderColor: 'var(--cyan)', color: 'var(--cyan)' }}>
          ⚑ CONTINUER LA CONQUÊTE →
        </button>
        <div className="row gap4">
          <button className="px-btn" style={{ flex: 1, borderColor: 'var(--purple)', color: 'var(--purple)' }} onClick={onMeta}>
            ★ HÉRITAGE
          </button>
          <button className="px-btn" style={{ flex: 2 }} onClick={newGame}>
            NOUVELLE RUN
          </button>
        </div>
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

import { useState, useEffect, useMemo } from 'react'
import { TypewriterText } from '../ui/TypewriterText'
import type { GameState, WeaponData } from '../../types'
import { useGameStore } from '../../store/gameStore'
import { StatusBar } from '../ui/StatusBar'
import { getStation, BOSS_STATIONS, FUEL_STATIONS, getAccessibleStations, getFuelCost } from '../../data/stations'
import { getEnemyForStation, scaleEnemy, TIER_BOSS } from '../../data/enemies'
import { rollExplorationEvent, rollWanderEvent, type WanderEvent } from '../../engine/exploration'
import type { ExploreResult } from '../../engine/exploration'
import { generateQuest } from '../../engine/quests'
import { getStationEvents, type StationEvent } from '../../engine/stationEvents'
import { NAMED_NPCS, getNpcService } from '../../engine/npcTracker'
import { getAmbiance } from '../../engine/jsonEventLoader'
import { getEnemyByTier } from '../../data/enemies'
import { checkArcTriggers } from '../../engine/narrativeArcs'
import { OBJECTIVES } from '../../engine/objectives'
import { StopTheBar, type StopResult } from '../minigames/StopTheBar'
import { CardGame } from '../minigames/CardGame'
import { ScenarioGame } from '../minigames/ScenarioGame'
import { CustomsGame } from '../minigames/CustomsGame'
import { stalkerToEnemy, getStalkerAmbushChance, getStalkerPresenceText } from '../../engine/stalker'
import { isFactionBlockedAtStation, getStationFactionName, STATION_FACTION_CONTROL } from '../../engine/factionRep'
import { getArrivalSituation, type ArrivalSituation } from '../../engine/arrivalSituations'
import { RUN_MODIFIERS } from '../../data/runModifiers'
import { getRunObjective } from '../../data/runObjectives'
import { getSubBossAtStation, isSubBossDefeated, getSubBossProgress, arePillarSubBossesCleared, getSubBossesForPillar, rollLieutenantClueEvent, LIEUTENANT_CLUE_REVEAL_LEVEL, type LieutenantClueEvent } from '../../data/subBosses'
import { canResolveSubBoss, resolveSubBoss, RESOLUTION_META } from '../../engine/subBossResolutions'
import { getAvailableClues, canCollectClue, collectClue } from '../../engine/nexus'
import { getDailyExpenses, getDailyExpenseBreakdown } from '../../engine/expenses'
import { getActiveEvents } from '../../engine/worldEvents'
import { getQuestsAtStation, canStartQuest, completeQuest, type EquipmentQuest } from '../../data/equipmentQuests'
import { LORE_TOTAL } from '../../data/loreFragments'
import { ExploreResultPanel } from './hub/ExploreResultPanel'
import { WanderResultPanel } from './hub/WanderResultPanel'
import { QuestOfferPanel } from './hub/QuestOfferPanel'
import { StationEventPanel } from './hub/StationEventPanel'
import { NpcEncounterPanel } from './hub/NpcEncounterPanel'

const DANGER_LABEL = ['◆ SÉCURISÉE', '◆ RISQUÉE', '◆ DANGEREUSE', '◆ ZONE DE GUERRE']
const DANGER_CLS   = ['danger-0', 'danger-1', 'danger-2', 'danger-3']

type HubMode = 'menu' | 'explore-result' | 'wander-result' | 'quest-offer' | 'station-event' | 'npc-encounter' | 'lockpick-game' | 'card-game' | 'fuel-scavenge' | 'delivery-event' | 'negotiation' | 'navigation-minigame' | 'customs' | 'lieutenant-clue'

export function StationHub() {
  const gs           = useGameStore(s => s.gs!)
  const goTo         = useGameStore(s => s.goTo)
  const startCombat  = useGameStore(s => s.startCombat)
  const patch        = useGameStore(s => s.patch)
  const addQuest     = useGameStore(s => s.addQuest)
  const manualCompleteQuest = useGameStore(s => s.manualCompleteQuest)
  const resolveRayaneGamble = useGameStore(s => s.resolveRayaneGamble)

  function tickPatrolProgress() {
    const q = gs.activeQuests.find(aq => aq.type === 'patrol' && aq.targetStation === gs.currentStation)
    if (!q) return
    const newProgress = (q.progress ?? 0) + 1
    if (newProgress >= 3) {
      manualCompleteQuest(q.id)
    } else {
      patch({ activeQuests: gs.activeQuests.map(aq => aq.id === q.id ? { ...aq, progress: newProgress } : aq) })
    }
  }
  const spendAction  = useGameStore(s => s.spendAction)
  const travelMsg    = useGameStore(s => s.travelEventMessage)
  const objPopup     = useGameStore(s => s.objectivePopup)
  const questPopup   = useGameStore(s => s.questCompletionMsg)
  const dismissTravel    = useGameStore(s => s.dismissTravelEvent)
  const dismissObj       = useGameStore(s => s.dismissObjectivePopup)
  const dismissQuest     = useGameStore(s => s.dismissQuestCompletion)
  const chainEvent       = useGameStore(s => s.chainEventNotification)
  const dismissChain     = useGameStore(s => s.dismissChainEvent)
  const worldEventPopup  = useGameStore(s => s.worldEventPopup)
  const dismissWorldEvent = useGameStore(s => s.dismissWorldEventPopup)
  const advanceMajorQuests = useGameStore(s => s.advanceMajorQuests)

  const [mode, setMode]             = useState<HubMode>('menu')
  const [exploreResult, setExploreResult] = useState<ExploreResult | null>(null)
  const [wanderEvent, setWanderEvent]     = useState<WanderEvent | null>(null)
  const [questOffer, setQuestOffer]       = useState<ReturnType<typeof generateQuest>>(null)
  const [stationEvent, setStationEvent]   = useState<StationEvent | null>(null)
  const [npcDialogResult, setNpcDialogResult] = useState<string | null>(null)
  const [lockpickMsg, setLockpickMsg] = useState<string | null>(null)
  const [miniGameReward, setMiniGameReward] = useState<Partial<GameState>>({})
  const [fuelScavResult, setFuelScavResult] = useState<string | null>(null)
  const [specialResult, setSpecialResult]   = useState<string | null>(null)
  type DealCondition = { id: string; label: string; desc: string; fuelAmount: number; available: boolean; whyNot?: string; accept: () => void }
  const [dealConditions, setDealConditions] = useState<DealCondition[] | null>(null)
  const [confirmRestart, setConfirmRestart] = useState(false)
  const [clueMsg, setClueMsg] = useState<string | null>(null)
  const [subBossResult, setSubBossResult] = useState<{ message: string; success: boolean } | null>(null)
  const [lieutenantClueEvent, setLieutenantClueEvent] = useState<LieutenantClueEvent | null>(null)
  const [arrivalSit, setArrivalSit] = useState<ArrivalSituation | null>(null)
  const [arrivalResult, setArrivalResult] = useState<string | null>(null)
  const [pendingDeliveryQuest, setPendingDeliveryQuest] = useState<ReturnType<typeof generateQuest>>(null)
  const [deliveryResult, setDeliveryResult] = useState<string | null>(null)
  const [negotiationBase]   = useState(() => Math.floor(Math.random() * 1500 + 600))
  const [negoResult, setNegoResult]         = useState<{ earned: number; label: string } | null>(null)
  const [questRerollsLeft, setQuestRerollsLeft] = useState(3)
  const [navResult, setNavResult]           = useState<{ shipDamage: number; bonusCredits: number } | null>(null)
  const [customsResult, setCustomsResult]   = useState<{ confiscated: string[]; repChange: number } | null>(null)
  const [hoveredQuest, setHoveredQuest]     = useState<string | null>(null)

  const station      = getStation(gs.currentStation)
  const accessibleStations = getAccessibleStations(gs.currentStation)
  const reachableCount = accessibleStations.filter(s => getFuelCost(gs.currentStation, s.name) <= gs.fuel).length
  // Le carburant n'est le VRAI facteur limitant que si une destination deviendrait
  // atteignable avec plus de carburant (coût > fuel actuel mais <= réservoir max).
  // Sinon (ex : réservoir plein, station peu connectée), pas d'alerte carburant.
  const fuelWouldHelp = accessibleStations.some(s => {
    const c = getFuelCost(gs.currentStation, s.name)
    return c > gs.fuel && c <= gs.maxFuel
  })
  const fuelStranded = reachableCount === 0 && gs.fuel > 0 && fuelWouldHelp
  // Soupape de sécurité : chercher du carburant est proposé quand on est à sec, ou
  // en état critique ET que du carburant supplémentaire débloquerait une route.
  const fuelCritical = reachableCount <= 1 && fuelWouldHelp
  const canScavengeFuel = (gs.fuel <= 0 || fuelCritical) && !FUEL_STATIONS.has(gs.currentStation)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ambianceText = useMemo(() => getAmbiance(gs.currentStation), [gs.currentStation])
  const factionBlocked     = isFactionBlockedAtStation(gs, gs.currentStation)
  const blockedFactionName = getStationFactionName(gs.currentStation)
  const outcome      = gs.pendingCombatOutcome
  const stationEvts  = getStationEvents(gs).filter(
    ev => !(gs.usedLocalActivities ?? []).includes(`${gs.currentStation}-${ev.id}`)
  )
  const localNpc     = NAMED_NPCS.find(n => n.station === gs.currentStation)
  const availableArcs = checkArcTriggers(gs)
  const hasArcs      = gs.activeArcs.length > 0 || availableArcs.length > 0 || gs.completedArcs.length > 0
  const newArcsCount = availableArcs.filter(a => !gs.activeArcs.find(b => b.id === a.id)).length

  // Situation d'arrivée — calculée une fois au montage si pendingArrival est vrai
  useEffect(() => {
    if (gs.pendingArrival && !arrivalSit) {
      const sit = getArrivalSituation(gs, true)
      if (sit) setArrivalSit(sit)
      else patch({ pendingArrival: false })
    }
  }, [])

  // Réinitialise le résultat de résolution de lieutenant au changement de station.
  useEffect(() => { setSubBossResult(null) }, [gs.currentStation])

  // Arriver physiquement à la station d'un lieutenant le révèle automatiquement —
  // pas besoin d'indice si le joueur l'a trouvé tout seul.
  useEffect(() => {
    const sb = getSubBossAtStation(gs.currentStation)
    if (sb && !(gs.lieutenantLocationsKnown ?? []).includes(sb.id) && !isSubBossDefeated(gs.subBossesDefeated ?? {}, sb.id)) {
      patch({ lieutenantLocationsKnown: [...(gs.lieutenantLocationsKnown ?? []), sb.id] })
    }
  }, [gs.currentStation])

  // Contrôle douanier auto sur stations militaires (une fois par visite de station/jour)
  useEffect(() => {
    const key = `customs_${gs.currentStation}_${gs.day}`
    if (
      station.type === 'military' &&
      Object.keys(gs.cargo).length > 0 &&
      !sessionStorage.getItem(key) &&
      Math.random() < 0.38
    ) {
      sessionStorage.setItem(key, '1')
      setMode('customs')
    }
  }, [])

  // ── ACTIONS ──────────────────────────────────────────────────────────────

  function explore() {
    spendAction()
    tickPatrolProgress()
    if (gs.stalker && Math.random() < getStalkerAmbushChance(gs.stalker, 'explore')) {
      startCombat(stalkerToEnemy(gs.stalker))
      return
    }

    const clueRoll = rollLieutenantClueEvent(gs)
    if (clueRoll.event) {
      const sb = clueRoll.event.subBoss
      const levels = { ...(gs.lieutenantClueLevels ?? {}), [sb.id]: clueRoll.event.level }
      const known = clueRoll.event.level >= LIEUTENANT_CLUE_REVEAL_LEVEL
        ? [...(gs.lieutenantLocationsKnown ?? []), sb.id]
        : (gs.lieutenantLocationsKnown ?? [])
      patch({
        lieutenantClueLevels: levels,
        lieutenantLocationsKnown: known,
        ...(clueRoll.newMilestone !== null ? { lieutenantClueMilestone: clueRoll.newMilestone } : {}),
      })
      setLieutenantClueEvent(clueRoll.event)
      setMode('lieutenant-clue')
      return
    }
    if (clueRoll.newMilestone !== null) {
      patch({ lieutenantClueMilestone: clueRoll.newMilestone })
    }

    const depth = gs.zoneDepth + 1
    const result = rollExplorationEvent({ ...gs, zoneDepth: depth })
    if (result.type === 'combat') {
      patch({ zoneDepth: depth, lastExploreWasCombat: true, explorationFightsDone: (gs.explorationFightsDone ?? 0) + 1 })
      startCombat(scaleEnemy(getEnemyForStation(gs.currentStation, depth, gs.day), Math.max(0, depth - 2)))
      return
    }
    if (result.type === 'boss') {
      patch({ zoneDepth: depth, lastExploreWasCombat: true })
      const bossName = BOSS_STATIONS[gs.currentStation]
      const boss = bossName
        ? (TIER_BOSS.find(b => b.name === bossName) ?? TIER_BOSS[Math.floor(Math.random() * TIER_BOSS.length)])
        : TIER_BOSS[Math.floor(Math.random() * TIER_BOSS.length)]
      startCombat(boss)
      return
    }
    patch({ zoneDepth: depth, lastExploreWasCombat: false })
    setExploreResult(result); setLockpickMsg(null); setMode('explore-result')
  }

  function wander() {
    spendAction()
    tickPatrolProgress()
    if (gs.stalker && Math.random() < getStalkerAmbushChance(gs.stalker, 'wander')) {
      startCombat(stalkerToEnemy(gs.stalker))
      return
    }
    // Sur les stations risquées/dangereuses, risque de tomber sur des problèmes
    const wanderCombatChance = station.danger >= 3 ? 0.30 : station.danger >= 2 ? 0.22 : station.danger >= 1 ? 0.12 : 0
    if (wanderCombatChance > 0 && Math.random() < wanderCombatChance) {
      const tier = station.danger >= 3 ? 3 : station.danger >= 2 ? 2 : 1
      startCombat(scaleEnemy(getEnemyByTier(tier as 1|2|3), Math.floor(gs.day / 15)))
      return
    }
    setWanderEvent(rollWanderEvent(gs)); setMode('wander-result')
  }

  function lookForQuest() {
    spendAction()
    setQuestRerollsLeft(3)
    // Priorité aux quêtes enchaînées en attente
    const chainPending = (gs.pendingChainQuests ?? [])
    if (chainPending.length > 0) {
      const [next, ...rest] = chainPending
      patch({ pendingChainQuests: rest })
      setQuestOffer(next)
    } else {
      setQuestOffer(generateQuest(gs))
    }
    setMode('quest-offer')
  }

  function rerollQuest() {
    setQuestRerollsLeft(n => n - 1)
    setQuestOffer(generateQuest(gs))
  }

  function openStationEvent(ev: StationEvent) {
    spendAction()
    setStationEvent(ev); setMode('station-event')
  }

  // ── MODES ────────────────────────────────────────────────────────────────

  if (mode === 'lieutenant-clue' && lieutenantClueEvent) {
    const revealed = lieutenantClueEvent.level >= LIEUTENANT_CLUE_REVEAL_LEVEL
    return (
      <div className="layout">
        <div className="px-box" style={{ borderColor: 'var(--purple)' }}>
          <div className="t-xs mb8" style={{ color: 'var(--purple)', letterSpacing: '2px' }}>◆ INFORMATEUR</div>
          <div className="t-xs mb8" style={{ lineHeight: 1.8 }}>{lieutenantClueEvent.npcLine}</div>
          <div className="px-box" style={{ borderColor: 'var(--gold)', background: 'rgba(30,20,0,0.15)' }}>
            <div className="t-xs t-gold mb4" style={{ letterSpacing: '1px' }}>
              INDICE — {lieutenantClueEvent.subBoss.name} ({lieutenantClueEvent.subBoss.pillar.charAt(0).toUpperCase() + lieutenantClueEvent.subBoss.pillar.slice(1)})
            </div>
            <div className="t-xs" style={{ lineHeight: 1.8 }}>{lieutenantClueEvent.clueText}</div>
          </div>
          {revealed ? (
            <div className="t-xs t-green mt8">★ Localisation confirmée — visible dans le Nexus.</div>
          ) : (
            <div className="t-xs t-dim mt8">Un joueur attentif reconnaîtra peut-être déjà l'endroit. Sinon, un autre indice viendra plus tard — consultable dans le Nexus.</div>
          )}
          <button className="px-btn mt8" onClick={() => { setLieutenantClueEvent(null); setMode('menu') }}>Continuer</button>
        </div>
      </div>
    )
  }

  if (mode === 'explore-result' && exploreResult) {
    return (
      <ExploreResultPanel
        gs={gs}
        exploreResult={exploreResult}
        initialResultMsg={lockpickMsg}
        onContinue={explore}
        onReturn={() => { patch({ zoneDepth: 0 }); setLockpickMsg(null); setMode('menu') }}
        onStartLockpick={(reward) => { setMiniGameReward(reward); setMode('lockpick-game') }}
        patch={patch}
      />
    )
  }

  if (mode === 'wander-result' && wanderEvent) {
    return (
      <WanderResultPanel
        gs={gs}
        wanderEvent={wanderEvent}
        dangerLevel={station.danger}
        onReturn={() => setMode('menu')}
        startCombat={startCombat}
        patch={patch}
        addQuest={addQuest}
        spendAction={spendAction}
        onWanderAgain={(next) => setWanderEvent(next)}
        onNegotiation={() => { setNegoResult(null); setMode('negotiation') }}
        onNavigation={() => { setNavResult(null); setMode('navigation-minigame') }}
      />
    )
  }

  if (mode === 'station-event' && stationEvent) {
    return (
      <StationEventPanel
        gs={gs}
        stationEvent={stationEvent}
        stationName={station.name}
        onReturn={() => setMode('menu')}
        startCombat={startCombat}
        patch={patch}
      />
    )
  }

  if (mode === 'lockpick-game') {
    return (
      <StopTheBar difficulty={2} label="CROCHETAGE DU BOÎTIER" onResult={(result: StopResult) => {
        if (result === 'perfect') {
          const bonus = Math.floor((miniGameReward.credits ?? 0) * 0.2)
          patch({ ...miniGameReward, credits: (miniGameReward.credits ?? 0) + bonus })
          setLockpickMsg(`Crochetage parfait ! +${((miniGameReward.credits ?? 0) + bonus).toLocaleString()} cr (bonus précision)`)
        } else if (result === 'good') {
          patch(miniGameReward)
          setLockpickMsg(`Réussi. +${(miniGameReward.credits ?? 0).toLocaleString()} cr`)
        } else {
          setLockpickMsg('Raté. L\'alarme se déclenche. Tu pars vite.')
          patch({ reputation: gs.reputation - 5 })
        }
        setMode('explore-result')
      }} />
    )
  }

  if (mode === 'card-game') {
    return (
      <CardGame onResult={(creditsWon) => {
        if (creditsWon > 0) {
          patch({ credits: gs.credits + creditsWon })
        }
        setNpcDialogResult(creditsWon > 0 ? `Tu repars avec ${creditsWon.toLocaleString()} cr de gain.` : 'La chance n\'était pas de ton côté ce soir.')
        setMode('npc-encounter')
      }} />
    )
  }

  // ── LIVRAISON MANUELLE AVEC OBSTACLES ────────────────────────────────────

  if (mode === 'delivery-event' && pendingDeliveryQuest) {
    const q = pendingDeliveryQuest

    const DELIVERY_SCENES = [
      { desc: `Le contact de ${q.giver} t'attend dans une arrière-salle. Il vérifie la marchandise en silence, puis hoche la tête. Transaction propre.`, outcome: 'smooth' as const },
      { desc: `Tu trouves le destinataire après vingt minutes à chercher dans les couloirs. Il regarde l'item, puis toi. "T'es en retard." Il paie quand même.`, outcome: 'smooth' as const },
      { desc: `Le destinataire est là, mais il n'est pas seul. Deux types dans l'ombre. Il te demande si tu es suivi.`, outcome: 'tense' as const },
      { desc: `Tu arrives à l'adresse indiquée — le local est fermé. Un message épinglé sur la porte dit de te rendre au niveau inférieur.`, outcome: 'detour' as const },
      { desc: `En chemin pour la livraison, quelqu'un te double dans le couloir et renverse délibérément ta caisse. Les regards se tournent vers toi.`, outcome: 'ambush' as const },
      { desc: `Le destinataire est là mais refuse d'abord la marchandise. "Les termes ont changé." Il cherche à renégocier à la baisse.`, outcome: 'negotiation' as const },
    ]

    const HEIST_SCENES = [
      { desc: `Tu remettre l'objet à ${q.giver}. Il ne le regarde même pas — il savait déjà ce que c'était. Le paiement arrive sans un mot.`, outcome: 'smooth' as const },
      { desc: `Quelqu'un d'autre cherchait cet item. Il est là, dans le couloir, et il t'a vu.`, outcome: 'ambush' as const },
      { desc: `La remise se passe. ${q.giver} examine l'objet longuement. "C'est le bon." Il paie. Mais tu te demandes depuis combien de temps il attendait exactement ça.`, outcome: 'smooth' as const },
    ]

    const scenes = q.type === 'heist' ? HEIST_SCENES : DELIVERY_SCENES
    const scene = scenes[Math.floor(Math.random() * scenes.length)]

    function resolveDelivery(choice: 'proceed' | 'negotiate' | 'flee') {
      if (choice === 'flee') {
        setDeliveryResult('Tu repars sans livrer. La quête reste en attente.')
        setMode('menu')
        setPendingDeliveryQuest(null)
        return
      }
      if (choice === 'negotiate') {
        const success = Math.random() < 0.55 + gs.reputation / 300
        if (success) {
          manualCompleteQuest(q.id)
          setMode('menu')
          setPendingDeliveryQuest(null)
        } else {
          patch({ credits: gs.credits - Math.floor(q.creditReward * 0.15) })
          setDeliveryResult(`La négo tourne court. Tu cèdes 15% de la récompense pour clore l'affaire. Quête complétée quand même.`)
          manualCompleteQuest(q.id)
          setTimeout(() => { setMode('menu'); setPendingDeliveryQuest(null) }, 50)
        }
        return
      }
      // proceed — résoudre selon l'outcome de la scène
      if (scene.outcome === 'smooth' || scene.outcome === 'detour') {
        manualCompleteQuest(q.id)
        setMode('menu')
        setPendingDeliveryQuest(null)
      } else if (scene.outcome === 'ambush') {
        setPendingDeliveryQuest(null)
        patch({ pendingFuelReward: 0 })
        manualCompleteQuest(q.id)
        startCombat(scaleEnemy(getEnemyByTier(station.danger >= 2 ? 2 : 1), Math.floor(gs.day / 15)))
      } else {
        manualCompleteQuest(q.id)
        setMode('menu')
        setPendingDeliveryQuest(null)
      }
    }

    return (
      <div className="layout">
        <div className="t-xs t-dim t-center">— LIVRAISON — {q.targetStation} —</div>
        <div className="px-box px-box--hi">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
            <div className="t-sm t-bright">{q.title}</div>
            <div className="tag t-xs tag--cyan">{q.type.toUpperCase()}</div>
          </div>
          <div className="t-xs" style={{ lineHeight: '2.2', marginBottom: '10px' }}>
            <TypewriterText text={scene.desc} speed={16} />
          </div>
          {deliveryResult ? (
            <div className="t-xs t-green mt8">{deliveryResult}</div>
          ) : (
            <div className="col gap4">
              {scene.outcome === 'ambush' ? (
                <>
                  <button className="px-btn px-btn--danger" onClick={() => resolveDelivery('proceed')}>
                    ⚔ Livrer quand même — il faudra se battre
                  </button>
                  <button className="px-btn" onClick={() => resolveDelivery('flee')}>
                    ← Rebrousser chemin — livrer plus tard
                  </button>
                </>
              ) : scene.outcome === 'negotiation' ? (
                <>
                  <button className="px-btn px-btn--primary" onClick={() => resolveDelivery('negotiate')}>
                    Négocier (55% réussite, sinon -15% récompense)
                  </button>
                  <button className="px-btn px-btn--danger" onClick={() => {
                    patch({ reputation: gs.reputation - 5 })
                    resolveDelivery('proceed')
                  }}>
                    Imposer les termes originaux (-5 rép si ça passe mal)
                  </button>
                  <button className="px-btn" onClick={() => resolveDelivery('flee')}>
                    ← Partir — revenir plus tard
                  </button>
                </>
              ) : scene.outcome === 'tense' ? (
                <>
                  <button className="px-btn px-btn--primary" onClick={() => resolveDelivery('proceed')}>
                    Livrer malgré tout — t'as confiance
                  </button>
                  <button className="px-btn" onClick={() => resolveDelivery('flee')}>
                    ← Rebrousser chemin — c'est louche
                  </button>
                </>
              ) : (
                <button className="px-btn px-btn--primary" onClick={() => resolveDelivery('proceed')}>
                  Compléter la livraison (+{q.creditReward.toLocaleString()} cr · +{q.repReward} rép)
                </button>
              )}
            </div>
          )}
        </div>
        <button className="px-btn" onClick={() => { setMode('menu'); setPendingDeliveryQuest(null); setDeliveryResult(null) }}>← Retour au hub</button>
      </div>
    )
  }

  if (mode === 'quest-offer') {
    return (
      <QuestOfferPanel
        gs={gs}
        questOffer={questOffer}
        addQuest={addQuest}
        rerollsLeft={questRerollsLeft}
        onReroll={rerollQuest}
        onReturn={() => setMode('menu')}
      />
    )
  }

  // ── NPC ENCOUNTER ─────────────────────────────────────────────────────────

  if (mode === 'npc-encounter' && localNpc) {
    return (
      <NpcEncounterPanel
        gs={gs}
        localNpc={localNpc}
        npcDialogResult={npcDialogResult}
        onDialogResult={setNpcDialogResult}
        onCardGame={() => setMode('card-game')}
        onBack={() => { setMode('menu'); setNpcDialogResult(null) }}
        patch={patch}
        startCombat={startCombat}
        advanceMajorQuests={advanceMajorQuests}
        spendAction={spendAction}
      />
    )
  }

  // ── CHERCHER DU CARBURANT ─────────────────────────────────────────────────

  function generateDealConditions(): DealCondition[] {
    const pool: DealCondition[] = []
    const creditCost = (Math.floor(Math.random() * 8) + 4) * 100

    pool.push({
      id: 'credits',
      label: `Payer ${creditCost.toLocaleString()} cr`,
      desc: `"Du liquide. Pas de trace, pas de ticket. T'as ça ou t'as pas."`,
      fuelAmount: 2,
      available: gs.credits >= creditCost,
      whyNot: gs.credits < creditCost ? `Il te manque ${(creditCost - gs.credits).toLocaleString()} cr` : undefined,
      accept: () => {
        patch({ credits: gs.credits - creditCost, fuel: Math.min(gs.maxFuel, gs.fuel + 2) })
        setFuelScavResult(`Marché conclu. -${creditCost.toLocaleString()} cr · +2 carburant.`)
        setDealConditions(null)
      },
    })

    if (Object.keys(gs.cargo).length > 0) {
      const cargoLabel = Object.entries(gs.cargo).map(([k, v]) => `${k} ×${v}`).join(', ')
      pool.push({
        id: 'cargo',
        label: 'Vider ta soute entière',
        desc: `"Je prends tout ce que t'as là-dedans. Tout. ${cargoLabel}. Après on est quittes."`,
        fuelAmount: 3,
        available: true,
        accept: () => {
          patch({ cargo: {}, fuel: Math.min(gs.maxFuel, gs.fuel + 3) })
          setFuelScavResult(`Il vide ta soute sans un mot. Tu repars les mains vides mais +3 carburant.`)
          setDealConditions(null)
        },
      })
    }

    pool.push({
      id: 'favor_sexual',
      label: 'Faveur personnelle',
      desc: `Il te regarde lentement de la tête aux pieds, s'attarde. "Je veux une faveur. Du genre... personnel." Il attend ta réponse, le sourire aux lèvres.`,
      fuelAmount: 2,
      available: true,
      accept: () => {
        patch({ fuel: Math.min(gs.maxFuel, gs.fuel + 2), reputation: gs.reputation - 5 })
        setFuelScavResult(`Tu fermes les yeux sur la dignité. +2 carburant. (-5 rép)`)
        setDealConditions(null)
      },
    })

    const scavengeableWeapons = gs.weapons.filter(w => (w.tier ?? 0) < 5)
    if (scavengeableWeapons.length > 0) {
      const w = scavengeableWeapons[scavengeableWeapons.length - 1]
      pool.push({
        id: 'weapon',
        label: `Céder ${w.name}`,
        desc: `"Cette arme-là. Je la veux depuis que t'es entré. Donne-la et on règle ça proprement."`,
        fuelAmount: 2,
        available: true,
        accept: () => {
          const remaining = gs.weapons.filter(x => x !== w)
          patch({ weapons: remaining, equippedWeapon: gs.equippedWeapon === w ? null : gs.equippedWeapon, fuel: Math.min(gs.maxFuel, gs.fuel + 2) })
          setFuelScavResult(`Tu poses ${w.name} sur le comptoir. Il sourit. +2 carburant.`)
          setDealConditions(null)
        },
      })
    }

    if (gs.equippedArmor) {
      pool.push({
        id: 'armor',
        label: `Laisser ton armure`,
        desc: `"L'armure. Elle m'intéresse. Tu te bats très bien sans, j'en suis sûr." Il tend la main.`,
        fuelAmount: 2,
        available: true,
        accept: () => {
          patch({ equippedArmor: null, fuel: Math.min(gs.maxFuel, gs.fuel + 2) })
          setFuelScavResult(`L'armure change de mains. Tu repartiras plus vulnérable. +2 carburant.`)
          setDealConditions(null)
        },
      })
    }

    pool.push({
      id: 'humiliation',
      label: 'Faire le sale boulot',
      desc: `"J'ai un problème avec la tuyauterie du niveau trois. Ça fuit, ça pue, personne veut toucher ça. Toi si. Deux heures, une unité."`,
      fuelAmount: 1,
      available: true,
      accept: () => {
        patch({ fuel: Math.min(gs.maxFuel, gs.fuel + 1), reputation: gs.reputation - 8 })
        setFuelScavResult(`Deux heures plus tard, tu es couvert de trucs que tu préfères ne pas identifier. +1 carburant. (-8 rép)`)
        setDealConditions(null)
      },
    })

    pool.push({
      id: 'intel',
      label: 'Donner des informations',
      desc: `"T'as voyagé. T'as vu des choses. Dis-moi ce que tu sais sur les mouvements dans ce secteur."`,
      fuelAmount: 2,
      available: gs.reputation >= 10,
      whyNot: gs.reputation < 10 ? `Il te voit pas comme quelqu'un qui sait des choses utiles` : undefined,
      accept: () => {
        patch({ fuel: Math.min(gs.maxFuel, gs.fuel + 2), reputation: gs.reputation - 12 })
        setFuelScavResult(`Tu parles. Il prend des notes. Ces infos coûteront peut-être plus cher que tu ne le penses. +2 carburant. (-12 rép)`)
        setDealConditions(null)
      },
    })

    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(pool.length, Math.floor(Math.random() * 2) + 2))
  }

  if (mode === 'fuel-scavenge') {
    const dangerTier = station.danger >= 2 ? 2 : 1

    if (dealConditions) {
      return (
        <div className="layout">
          <div className="t-xs t-red t-center">⚠ NÉGOCIATION — MARCHÉ NOIR</div>
          <div className="px-box" style={{ borderColor: 'var(--cyan)' }}>
            <div className="t-sm t-bright mb8">SES CONDITIONS</div>
            <div className="t-xs t-dim mb8" style={{ lineHeight: '2', fontStyle: 'italic' }}>
              "J'ai ce qu'il te faut. Mais rien est gratuit ici. Voilà ce que j'accepte."
            </div>
            <div className="col gap4">
              {dealConditions.map(c => (
                <button key={c.id} className="px-btn" disabled={!c.available}
                  style={{ borderColor: c.available ? 'var(--cyan)' : undefined, textAlign: 'left' }}
                  onClick={() => c.accept()}>
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="t-xs t-bright">{c.label}</span>
                    <span className="t-xs t-cyan">+{c.fuelAmount} carburant</span>
                  </div>
                  <div className="t-xs t-dim" style={{ lineHeight: '1.8' }}>{c.desc}</div>
                  {!c.available && c.whyNot && <div className="t-xs t-red mt2">{c.whyNot}</div>}
                </button>
              ))}
            </div>
          </div>
          <button className="px-btn t-dim" onClick={() => setDealConditions(null)}>
            ← Refuser toutes les conditions
          </button>
        </div>
      )
    }

    return (
      <div className="layout">
        <div className="t-xs t-red t-center">⚠ RÉSERVOIR À SEC — STATION SANS CARBURANT</div>

        <div className="px-box" style={{ borderColor: 'var(--red)' }}>
          <div className="t-sm t-red mb8">SITUATION CRITIQUE</div>
          <div className="t-xs mb8" style={{ lineHeight: '2.2' }}>
            <TypewriterText
              text="Ton réservoir est vide. Tu ne peux pas partir d'ici. Cette station ne vend pas de carburant — mais ça ne veut pas dire qu'il n'y en a pas. Toutes les options sont risquées."
              speed={16}
            />
          </div>

          {fuelScavResult
            ? (
              <div className="t-xs mt8" style={{ lineHeight: '2.2', color: 'var(--green)' }}>
                {fuelScavResult}
              </div>
            )
            : (
              <div className="col gap4">
                <button className="px-btn" style={{ borderColor: 'var(--orange)', color: 'var(--orange)' }}
                  onClick={() => {
                    const roll = Math.random()
                    if (roll < 0.45) {
                      const amount = Math.random() < 0.5 ? 1 : 2
                      patch({ fuel: Math.min(gs.maxFuel, gs.fuel + amount), reputation: gs.reputation - 3 })
                      setFuelScavResult(`+${amount} carburant. Tu vides un conteneur non surveillé et tu disparais. Quelqu'un a peut-être remarqué. (-3 rép)`)
                    } else if (roll < 0.65) {
                      patch({ reputation: gs.reputation - 8, pendingFuelReward: 2 })
                      startCombat(scaleEnemy(getEnemyByTier(dangerTier as 1|2|3), Math.floor(gs.day / 15)))
                    } else if (roll < 0.82) {
                      patch({ reputation: gs.reputation - 5 })
                      setFuelScavResult("Alarme déclenchée. Tu recules sans rien. La prochaine fois ils t'attendront. (-5 rép)")
                    } else {
                      const fine = Math.floor(Math.random() * 400 + 300)
                      patch({
                        isImprisoned: true,
                        prisonDaysLeft: 2,
                        reputation: gs.reputation - 20,
                        credits: Math.max(0, gs.credits - fine),
                        screen: 'prison',
                      })
                    }
                  }}>
                  🔧 Voler discrètement — silencieux si ça passe
                </button>

                <button className="px-btn" style={{ borderColor: 'var(--cyan)', color: 'var(--cyan)' }}
                  onClick={() => setDealConditions(generateDealConditions())}>
                  🤝 Négocier — voir les conditions posées
                </button>

                <button className="px-btn px-btn--danger"
                  onClick={() => {
                    patch({ pendingFuelReward: 2 })
                    startCombat(scaleEnemy(getEnemyByTier(dangerTier as 1|2|3), Math.floor(gs.day / 15)))
                  }}>
                  ⚔ Prendre de force — combat, victoire = +2 carburant
                </button>
              </div>
            )
          }
        </div>

        <button className="px-btn" onClick={() => { setFuelScavResult(null); setDealConditions(null); setMode('menu') }}>← Retour</button>
      </div>
    )
  }

  // ── MINI-JEUX ─────────────────────────────────────────────────────────────

  if (mode === 'negotiation') {
    if (negoResult) {
      const failed = negoResult.label === 'ÉCHEC'
      return (
        <div className="layout">
          <div className="t-xs t-dim t-center">— NÉGOCIATION TERMINÉE —</div>
          <div className="px-box" style={{ borderColor: failed ? 'var(--red)' : 'var(--gold)' }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
              <div className={`t-sm ${failed ? 't-red' : 't-bright'}`}>Résultat : {negoResult.label}</div>
              <div className={`tag t-xs ${failed ? 'tag--red' : 'tag--gold'}`}>{negoResult.label}</div>
            </div>
            {failed
              ? <>
                  <div className="t-xs t-red">Négociation rompue. Aucun crédit obtenu.</div>
                  <div className="t-xs t-dim mt4">-10 réputation — le marchand ne veut plus entendre parler de toi.</div>
                </>
              : <div className="t-xs t-gold">+{negoResult.earned.toLocaleString()} cr — contrat conclu.</div>
            }
          </div>
          <button className="px-btn px-btn--primary" onClick={() => {
            if (failed) {
              patch({ reputation: gs.reputation - 10 })
            } else {
              patch({ credits: gs.credits + negoResult.earned })
            }
            setNegoResult(null)
            setMode('menu')
          }}>{failed ? 'Partir' : 'Encaisser et continuer'}</button>
        </div>
      )
    }
    return (
      <ScenarioGame
        mode="negotiation"
        baseCredits={negotiationBase}
        onResult={(earned, label) => setNegoResult({ earned, label })}
      />
    )
  }

  if (mode === 'navigation-minigame') {
    if (navResult) {
      const dmg = navResult.shipDamage
      const bonus = navResult.bonusCredits
      return (
        <div className="layout">
          <div className="t-xs t-dim t-center">— NAVIGATION TERMINÉE —</div>
          <div className="px-box" style={{ borderColor: dmg === 0 ? 'var(--green)' : dmg <= 10 ? 'var(--gold)' : 'var(--red)' }}>
            <div className="t-sm t-bright mb4">{dmg === 0 ? 'Navigation parfaite' : dmg <= 15 ? 'Navigation correcte' : 'Navigation difficile'}</div>
            {dmg > 0 && <div className="t-xs t-red">Vaisseau endommagé : -{dmg} PV</div>}
            {bonus > 0 && <div className="t-xs t-gold mt4">+{bonus.toLocaleString()} cr (bonus manœuvre)</div>}
            {dmg === 0 && bonus === 0 && <div className="t-xs t-green">Aucun dommage.</div>}
          </div>
          <button className="px-btn px-btn--primary" onClick={() => {
            patch({
              shipHp: Math.max(1, gs.shipHp - dmg),
              credits: gs.credits + bonus,
            })
            setNavResult(null)
            setMode('menu')
          }}>Continuer</button>
        </div>
      )
    }
    return <ScenarioGame mode="navigation" onResult={(shipDamage, bonusCredits) => setNavResult({ shipDamage, bonusCredits })} />
  }

  if (mode === 'customs') {
    if (customsResult) {
      const { confiscated, repChange } = customsResult
      return (
        <div className="layout">
          <div className="t-xs t-dim t-center">— CONTRÔLE DOUANIER TERMINÉ —</div>
          <div className="px-box" style={{ borderColor: confiscated.length > 0 ? 'var(--red)' : 'var(--green)' }}>
            <div className="t-sm t-bright mb4">
              {confiscated.length > 0 ? '⚠ Contrebande détectée' : '✓ Scan propre'}
            </div>
            {confiscated.length > 0 ? (
              <>
                <div className="t-xs t-red mb4">Items confisqués : {confiscated.join(', ')}</div>
                <div className="t-xs t-dim">{repChange} réputation · Les items ont été saisis.</div>
              </>
            ) : (
              <div className="t-xs t-green">Rien de suspect. +{repChange} réputation pour coopération.</div>
            )}
          </div>
          <button className="px-btn px-btn--primary" onClick={() => {
            const newCargo = { ...gs.cargo }
            confiscated.forEach(item => { delete newCargo[item] })
            patch({
              cargo: newCargo,
              reputation: gs.reputation + repChange,
            })
            setCustomsResult(null)
            setMode('menu')
          }}>Continuer</button>
        </div>
      )
    }
    return (
      <CustomsGame
        cargo={gs.cargo}
        maxHide={2 + (gs.shipModules?.soute ?? 0)}
        onResult={(confiscated, repChange) => setCustomsResult({ confiscated, repChange })}
      />
    )
  }

  // ── MENU PRINCIPAL ────────────────────────────────────────────────────────

  return (
    <div className="hub-layout" style={{ maxWidth: '1300px', margin: '0 auto', padding: '20px' }}>
    <div className="scanlines" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <StatusBar gs={gs} />

      {/* ── MODE CONQUÊTE (post-victoire) ──────────────────────────────────── */}
      {gs.conquestMode && (
        <div className="px-box" style={{ borderColor: 'var(--cyan)', background: 'rgba(0,20,30,0.5)' }}>
          <div className="t-xs" style={{ color: 'var(--cyan)', letterSpacing: '2px' }}>
            ⚑ CONQUÊTE EN COURS — Nexus restauré. Accomplis tous les objectifs pour parachever ta conquête.
          </div>
        </div>
      )}

      {/* ── SITUATION D'ARRIVÉE (interactive — reste séparée) ──────────────── */}
      {arrivalSit && !arrivalResult && (
        <div className="px-box" style={{ borderColor: 'var(--orange)', background: 'rgba(20,10,0,0.7)' }}>
          <div className="t-xs mb4" style={{ color: 'var(--orange)', letterSpacing: '2px' }}>◆ ARRIVÉE — {gs.currentStation.toUpperCase()}</div>
          <div className="t-sm t-bright mb8">{arrivalSit.title}</div>
          <div className="t-xs" style={{ lineHeight: '2.2', marginBottom: '14px' }}>{arrivalSit.description}</div>
          <div className="col gap4">
            {arrivalSit.choices.map((c, i) => {
              const avail = c.available ? c.available(gs) : true
              return (
                <button key={i} className="px-btn" disabled={!avail}
                  style={{ borderColor: avail ? 'var(--orange)' : undefined, textAlign: 'left' }}
                  onClick={() => {
                    const result = c.result(gs)
                    patch({ ...result.gs, pendingArrival: false })
                    setArrivalResult(result.message)
                    if (result.triggerCombat) {
                      setArrivalSit(null)
                      const enemy = scaleEnemy(getEnemyForStation(gs.currentStation, gs.zoneDepth, gs.day), 0)
                      startCombat(enemy)
                    }
                    if (result.triggerPrison) {
                      setArrivalSit(null)
                      goTo('prison')
                    }
                  }}>
                  <span className="t-xs">{c.label}</span>
                  {!avail && <div className="t-xs t-dim mt2">Condition non remplie</div>}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {arrivalResult && (
        <div className="px-box" style={{ borderColor: 'var(--dim)' }}>
          <div className="t-xs t-dim mb4">◆ RÉSULTAT D'ARRIVÉE</div>
          <div className="t-xs">{arrivalResult}</div>
          <button className="px-btn px-btn--sm mt8" style={{ width: 'auto' }} onClick={() => { setArrivalSit(null); setArrivalResult(null) }}>
            Continuer →
          </button>
        </div>
      )}

      {/* ── BRIEFING UNIFIÉ — toutes les notifications d'arrivée en un bloc ── */}
      {!arrivalSit && !arrivalResult && (gs.pendingDaySummary || worldEventPopup || chainEvent || travelMsg || questPopup || objPopup || gs.rayaneGambleOffer) ? (
        <div className="px-box" style={{ borderColor: 'var(--cyan)', background: 'rgba(0,0,0,0.5)' }}>
          <div className="t-xs mb8" style={{ color: 'var(--cyan)', letterSpacing: '2px' }}>◆ BRIEFING — JOUR {gs.day}</div>

          {gs.pendingDaySummary && (
            <div style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border-dim)' }}>
              <div className="t-xs t-dim" style={{ letterSpacing: '1px' }}>JOUR {gs.pendingDaySummary.prevDay} TERMINÉ</div>
              <div className="t-xs t-bright mt2">
                {gs.pendingDaySummary.actionsUsed >= 3
                  ? '★ Journée pleine — 3 actions effectuées.'
                  : gs.pendingDaySummary.actionsUsed > 0
                  ? `${gs.pendingDaySummary.actionsUsed}/3 actions effectuées sur ${gs.pendingDaySummary.station}.`
                  : `Aucune action à ${gs.pendingDaySummary.station}.`}
              </div>
            </div>
          )}

          {worldEventPopup && (
            <div style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border-dim)' }}>
              <div className="t-xs" style={{ color: worldEventPopup.color, letterSpacing: '1px' }}>⚠ {worldEventPopup.title}</div>
              <div className="t-xs mt2" style={{ lineHeight: '1.8' }}>{worldEventPopup.shortDesc}</div>
              <div className="t-xs t-dim mt2">Durée : {worldEventPopup.duration} jours (J{worldEventPopup.startDay}–J{worldEventPopup.startDay + worldEventPopup.duration})</div>
            </div>
          )}

          {chainEvent && (
            <div style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border-dim)' }}>
              <div className="t-xs" style={{ color: chainEvent.color, letterSpacing: '1px' }}>
                {chainEvent.type === 'reward' ? '★' : chainEvent.type === 'threat' ? '⚠' : '◆'} {chainEvent.title}
              </div>
              <div className="t-xs mt2" style={{ lineHeight: '1.8' }}>{chainEvent.description}</div>
            </div>
          )}

          {travelMsg && (
            <div style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border-dim)' }}>
              <div className="t-xs t-cyan" style={{ letterSpacing: '1px' }}>ÉVÉNEMENT DE VOYAGE</div>
              <div className="t-xs mt2">{travelMsg}</div>
            </div>
          )}

          {questPopup && (
            <div style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border-dim)' }}>
              <div className="t-xs t-green" style={{ letterSpacing: '1px' }}>QUÊTE ACCOMPLIE</div>
              {questPopup.split('\n\n').map((block, i) => {
                const lines = block.split('\n')
                return (
                  <div key={i} style={{ marginTop: '4px' }}>
                    <div className="t-xs t-bright">{lines[1]}</div>
                    <div className="t-xs t-green">{lines[2]}</div>
                  </div>
                )
              })}
            </div>
          )}

          {objPopup && (
            <div style={{ marginBottom: '10px' }}>
              <div className="t-xs t-gold">{objPopup}</div>
            </div>
          )}

          {!!gs.rayaneGambleOffer && (
            <div className="px-box" style={{ borderColor: 'var(--gold)', background: 'rgba(30,20,0,0.15)', marginBottom: '10px' }}>
              <div className="t-xs t-gold mb4" style={{ letterSpacing: '1px' }}>🪙 RAYANE — {gs.rayaneGambleOffer.toLocaleString()} cr en poche</div>
              <div className="t-xs t-dim mb8">Les garder, ou les rejouer à pile ou face — double ou rien ?</div>
              <div className="row gap8">
                <button className="px-btn px-btn--sm" style={{ width: 'auto', borderColor: 'var(--gold)', color: 'var(--gold)' }}
                  onClick={() => resolveRayaneGamble(true)}>
                  🪙 Jouer — doubler ou tout perdre
                </button>
                <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => resolveRayaneGamble(false)}>
                  Garder
                </button>
              </div>
            </div>
          )}

          <button className="px-btn px-btn--sm" style={{ width: 'auto', borderColor: 'var(--cyan)', color: 'var(--cyan)' }}
            onClick={() => {
              if (gs.pendingDaySummary) patch({ pendingDaySummary: null })
              if (worldEventPopup) dismissWorldEvent()
              if (chainEvent) dismissChain()
              if (travelMsg) dismissTravel()
              if (questPopup) dismissQuest()
              if (objPopup) dismissObj()
              if (gs.rayaneGambleOffer) resolveRayaneGamble(false)
            }}>
            Continuer →
          </button>
        </div>
      ) : !arrivalSit && !arrivalResult && newArcsCount > 0 ? (
        <div className="px-box" style={{ borderColor: 'var(--purple)' }}>
          <div className="t-xs t-purple mb4">NOUVEAU ARC NARRATIF — {availableArcs.slice(0, newArcsCount).map(a => a.title).join(', ')}</div>
          <button className="px-btn px-btn--sm" style={{ width: 'auto', color: 'var(--purple)' }}
            onClick={() => goTo('narrative-arcs')}>Voir les arcs →</button>
        </div>
      ) : null}

      {/* Outcomes combat */}
      {!arrivalSit && outcome === 'victory'  && <div className="px-box t-gold t-sm t-center">★ VICTOIRE — Butin collecté !</div>}
      {!arrivalSit && outcome === 'fled'     && <div className="px-box t-dim t-sm t-center">Tu t'es échappé.</div>}
      {!arrivalSit && outcome === 'stunned'  && <div className="px-box t-red t-sm t-center">Assommé et dévalisé. Tu te relèves.</div>}
      {!arrivalSit && outcome === 'captured' && <div className="px-box t-red t-sm t-center">Capturé. Direction la prison.</div>}

      {gs.isImprisoned && (
        <div className="px-box" style={{ borderColor: 'var(--red)' }}>
          <div className="t-xs t-red mb4">⚠ EMPRISONNÉ</div>
          <button className="px-btn px-btn--danger px-btn--sm" onClick={() => goTo('prison')}>Gérer l'emprisonnement</button>
        </div>
      )}

      {/* Événements mondiaux actifs */}
      {getActiveEvents(gs).length > 0 && (
        <div className="col gap4">
          {getActiveEvents(gs).map(evt => (
            <div key={evt.id} className="px-box" style={{ borderColor: evt.color, padding: '6px 12px', background: 'rgba(0,0,0,0.35)' }}>
              <div className="row" style={{ alignItems: 'center', gap: '8px' }}>
                <span style={{ color: evt.color, fontSize: '9px', letterSpacing: '1px' }}>⚠ ÉVÉNEMENT MONDIAL — {evt.title}</span>
                <span className="t-xs t-dim" style={{ marginLeft: 'auto' }}>J{evt.startDay}–J{evt.startDay + evt.duration}</span>
              </div>
              <div className="t-xs t-dim" style={{ marginTop: '2px' }}>{evt.shortDesc}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── PRÉSENCE DU STALKER ────────────────────────────────────────────── */}
      {gs.stalker && (
        <div className="px-box" style={{ borderColor: 'var(--red)', background: 'rgba(180,0,0,0.07)', boxShadow: '0 0 12px rgba(255,40,40,0.15)' }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div className="t-xs t-red blink" style={{ letterSpacing: '3px' }}>⚠ {gs.stalker.name.toUpperCase()}</div>
            <div className="t-xs t-red">{'★'.repeat(gs.stalker.threatLevel)}</div>
          </div>
          <div className="t-xs" style={{ lineHeight: '2', color: 'var(--text-dim)', fontStyle: 'italic' }}>
            {getStalkerPresenceText(gs.stalker)}
          </div>
          <button
            className="px-btn px-btn--danger px-btn--sm"
            style={{ width: 'auto', marginTop: '10px' }}
            onClick={() => { spendAction(); startCombat(stalkerToEnemy(gs.stalker!)) }}
            disabled={gs.actionsToday >= 3}
          >
            ⚔ L'affronter — coûte 1 action
          </button>
        </div>
      )}

      {/* ── MODIFICATEURS DE RUN ───────────────────────────────────────────── */}
      {(gs.runModifiers ?? []).length > 0 && (() => {
        const mods = (gs.runModifiers ?? []).map(id => RUN_MODIFIERS.find(m => m.id === id)).filter(Boolean)
        const runObj = gs.runObjectiveId ? getRunObjective(gs.runObjectiveId) : null
        const TAG_COLOR: Record<string, string> = { buff: 'var(--green)', debuff: 'var(--red)', mixed: 'var(--gold)' }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              {mods.map(mod => mod && (
                <div key={mod.id} className="tag t-xs" style={{ borderColor: TAG_COLOR[mod.tag], color: TAG_COLOR[mod.tag] }}
                  title={mod.desc}>
                  {mod.tag === 'buff' ? '▲' : mod.tag === 'debuff' ? '▼' : '◆'} {mod.name}
                </div>
              ))}
              {runObj && (
                <div className="tag t-xs" style={{
                  borderColor: gs.runObjectiveCompleted ? 'var(--gold)' : 'var(--purple)',
                  color: gs.runObjectiveCompleted ? 'var(--gold)' : 'var(--purple)',
                  marginLeft: 'auto',
                }} title={runObj.desc}>
                  {gs.runObjectiveCompleted ? '★' : '○'} {runObj.name} — {runObj.progress(gs)}
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Station info */}
      <div className="px-box">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div className="t-lg t-bright">{station.name}</div>
          <div className={`tag t-xs ${DANGER_CLS[station.danger]}`}>{DANGER_LABEL[station.danger]}</div>
        </div>
        <div className="t-xs t-dim" style={{ lineHeight: '2' }}>{station.description}</div>
        {(() => { const a = ambianceText; return a ? (
          <div className="t-xs t-dim mt8" style={{ lineHeight: '2.2', fontStyle: 'italic', borderLeft: '2px solid var(--border)', paddingLeft: '10px' }}>
            {a}
          </div>
        ) : null })()}
        <div className="t-xs t-dim mt4">
          Jour {gs.day} · {gs.actionsToday}/3 actions · <span style={{ color: gs.class.color }}>{gs.class.name}</span>
          {gs.equippedWeapon && <> · <span className="t-orange">{gs.equippedWeapon.name}</span></>}
          {gs.equippedArmor  && <> · <span style={{ color: 'var(--blue)' }}>{gs.equippedArmor.name}</span></>}
        </div>
        {/* Tracker Nexus permanent — révélé après la quête tutorielle */}
        {gs.nexusTrackerUnlocked === false ? (
          <div className="row mt4" style={{ gap: '6px', alignItems: 'center' }}>
            <span className="t-xs t-dim" style={{ fontStyle: 'italic' }}>
              ◈ Termine ta première mission pour révéler ce que cache le vide…
            </span>
          </div>
        ) : (
          <div className="row mt4" style={{ gap: '6px', alignItems: 'center' }}>
            {[0, 1, 2, 3].map(i => {
              const collected = (gs.nexusFragments ?? []).includes(i)
              return (
                <span key={i} style={{
                  fontSize: '16px',
                  color: collected ? 'var(--gold)' : 'var(--border)',
                  textShadow: collected ? '0 0 8px var(--gold)' : 'none',
                  transition: 'all 0.3s',
                }}>◈</span>
              )
            })}
            <span className="t-xs" style={{ color: (gs.nexusFragments?.length ?? 0) >= 4 ? 'var(--gold)' : 'var(--dim)' }}>
              {gs.nexusFragments?.length ?? 0}/4 Nexus
            </span>
            <span className="t-xs t-dim" style={{ marginLeft: '8px' }}>
              {(gs.discoveredLore ?? []).length}/{LORE_TOTAL} lore
            </span>
          </div>
        )}
      </div>

      {/* Alerte de station (world event) */}
      {(() => {
        const alert = gs.stationAlerts?.[gs.currentStation]
        if (!alert) return null
        const ALERT_CONFIG = {
          siege:    { label: '⚔ ZONE DE SIÈGE', color: 'var(--red)',    bg: 'rgba(180,0,0,0.12)',    desc: 'Des combats font rage ici. Les sorties sont risquées, les marchés en désordre.' },
          lockdown: { label: '🔒 VERROUILLAGE', color: 'var(--orange)', bg: 'rgba(180,90,0,0.12)',   desc: 'Autorités militaires en contrôle total. Certains services sont suspendus.' },
          epidemic: { label: '☣ ÉPIDÉMIE',      color: 'var(--green)',  bg: 'rgba(0,120,0,0.10)',    desc: 'Un pathogène circule. Les échanges sont restreints, la quarantaine active.' },
          festival: { label: '★ FESTIVAL',       color: 'var(--gold)',   bg: 'rgba(180,140,0,0.12)',  desc: 'La station est en fête. Marchandises de luxe en demande, ambiance détendue.' },
        }
        const cfg = ALERT_CONFIG[alert]
        return (
          <div className="px-box" style={{ borderColor: cfg.color, background: cfg.bg }}>
            <div className="t-xs" style={{ color: cfg.color, letterSpacing: '1px' }}>{cfg.label}</div>
            <div className="t-xs t-dim" style={{ marginTop: '4px' }}>{cfg.desc}</div>
          </div>
        )
      })()}

      {/* Avertissement faction hostile */}
      {factionBlocked && (
        <div className="px-box" style={{ borderColor: 'var(--red)', background: 'rgba(180,0,0,0.12)' }}>
          <div className="t-xs" style={{ color: 'var(--red)', letterSpacing: '1px' }}>
            ⚠ TERRITOIRE HOSTILE — {blockedFactionName?.toUpperCase()}
          </div>
          <div className="t-xs t-dim" style={{ marginTop: '4px' }}>
            Cette faction te considère comme un ennemi. Les prix sont majorés de 30%, les quêtes et réparations te sont refusées.
          </div>
        </div>
      )}

      {/* Tutoriel progressif jour 1 — T8 */}
      {(() => {
        // Phase 0 : premier jour, aucune action → 3 boutons max
        // Phase 1 : premier jour, 1 action → déverrouille traîner + voyager
        // Phase 2+ : tout déverrouillé
        const tutPhase = gs.day === 1
          ? gs.actionsToday === 0 ? 0 : gs.actionsToday === 1 ? 1 : 2
          : 3

        const HINTS = [
          { label: '① Commence ici', text: 'Cherche du travail pour une première quête, ou explore la zone pour trouver du butin. Les armes et armures ne s\'achètent PAS au marché — elles se lootent sur les ennemis (plus l\'ennemi est fort, meilleure est l\'arme) ou s\'obtiennent via des quêtes majeures.' },
          { label: '② Tu prends le rythme', text: 'Tu peux maintenant traîner dans le coin pour rencontrer des personnages — et voyager vers d\'autres stations pour tes quêtes.' },
        ]
        const hint = tutPhase < 2 ? HINTS[tutPhase] : null

        return (
          <>
            {hint && (
              <div className="px-box" style={{ borderColor: 'var(--cyan)', opacity: 0.9 }}>
                <div className="t-xs t-cyan mb4">{hint.label}</div>
                <div className="t-xs t-dim" style={{ lineHeight: '2.2' }}>{hint.text}</div>
              </div>
            )}

            {/* Grille de menus */}
            <div className="grid2">
              <div className="px-box col" style={{ gap: '8px' }}>
                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>◆ NAVIGATION</span>
                  <button className="px-btn px-btn--sm" style={{ width: 'auto', fontSize: '8px', padding: '3px 8px', color: 'var(--cyan)', borderColor: 'var(--cyan)' }}
                    onClick={() => goTo('map')}>
                    ◎ CARTE
                  </button>
                </div>
                {tutPhase >= 1 && (
                  <button className="px-btn" onClick={() => goTo('travel')} disabled={gs.fuel <= 0}>
                    Voyager{gs.fuel <= 0 ? ' (plus de carburant)' : ` — ${gs.fuel} carburant`}
                  </button>
                )}
                {fuelCritical && reachableCount > 0 && !FUEL_STATIONS.has(gs.currentStation) && (
                  <div className="t-xs t-red" style={{ padding: '4px 8px', background: 'rgba(255,0,0,0.08)', border: '1px solid var(--red)' }}>
                    ⚠ CARBURANT CRITIQUE — {reachableCount} destination{reachableCount > 1 ? 's' : ''} accessible{reachableCount > 1 ? 's' : ''}
                  </div>
                )}
                {canScavengeFuel && (
                  <button className="px-btn px-btn--danger" onClick={() => { setFuelScavResult(null); setMode('fuel-scavenge') }}>
                    {gs.fuel <= 0
                      ? '⚠ RÉSERVOIR À SEC — Chercher du carburant'
                      : fuelStranded
                        ? '⚠ BLOQUÉ — Aucune destination accessible — Chercher du carburant'
                        : '⚠ CARBURANT CRITIQUE — Chercher du carburant'}
                  </button>
                )}
                <button className="px-btn" onClick={() => goTo('market')}>
                  Marché
                </button>
                {tutPhase >= 2 && (
                  <button className="px-btn" onClick={() => goTo('crafting')} style={{ borderColor: 'var(--orange)', color: 'var(--orange)' }}>
                    ⚙ Atelier de fabrication
                  </button>
                )}
                {tutPhase >= 2 && (
                  <button className="px-btn" onClick={() => goTo('ship-workshop')}>
                    Atelier vaisseau — {gs.shipHp}/{gs.shipMaxHp} PV
                  </button>
                )}
              </div>

              <div className="px-box col" style={{ gap: '8px' }}>
                <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ◆ ACTIONS
                  <span style={{ display: 'flex', gap: '4px' }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{
                        display: 'inline-block', width: '10px', height: '10px',
                        transform: 'rotate(45deg)',
                        background: i < gs.actionsToday ? 'var(--red)' : 'var(--cyan)',
                        opacity: i < gs.actionsToday ? 0.4 : 1,
                        border: `1px solid ${i < gs.actionsToday ? 'var(--red)' : 'var(--cyan)'}`,
                      }} />
                    ))}
                  </span>
                  <span className="t-xs" style={{ color: gs.actionsToday >= 3 ? 'var(--red)' : 'var(--dim)' }}>
                    {3 - gs.actionsToday} restante{3 - gs.actionsToday > 1 ? 's' : ''}
                  </span>
                </div>
                {gs.actionsToday >= 3 && (
                  <div style={{ padding: '8px 12px', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.3)', marginBottom: '4px' }}>
                    <div className="t-xs" style={{ color: '#ffd700' }}>Fin de journée — bon moment pour voyager ou se reposer.</div>
                  </div>
                )}
                <button className="px-btn" onClick={explore}>
                  Explorer la zone (profondeur {gs.zoneDepth + 1})
                </button>
                {tutPhase >= 1 && (
                  <button className="px-btn" onClick={wander}>
                    Traîner dans le coin
                  </button>
                )}
                <button className="px-btn" onClick={lookForQuest}
                  disabled={factionBlocked}
                  style={factionBlocked ? { opacity: 0.4, cursor: 'not-allowed' } : (gs.pendingChainQuests ?? []).length > 0 ? { borderColor: 'var(--gold)', color: 'var(--gold)' } : undefined}>
                  Chercher du travail / Rumeurs
                  {factionBlocked && <span className="t-xs" style={{ marginLeft: '8px', color: 'var(--red)' }}>REFUSÉ</span>}
                  {!factionBlocked && (gs.pendingChainQuests ?? []).length > 0 && <span className="t-xs" style={{ marginLeft: '8px', color: 'var(--gold)' }}>📋 suite disponible</span>}
                </button>
                {tutPhase >= 1 && gs.activeQuests.length === 0 && gs.day <= 2 && (
                  <div className="t-xs t-dim" style={{ opacity: 0.6, lineHeight: 2, marginTop: '4px' }}>
                    ↑ Cherche d'abord du travail pour une quête, puis voyage vers ta destination.
                  </div>
                )}
              </div>
            </div>
          </>
        )
      })()}

      {/* Événements spéciaux de station */}
      {stationEvts.length > 0 && (
        <div className="px-box" style={{ borderColor: 'var(--gold)' }}>
          <div className="t-xs t-gold mb8">ACTIVITÉS LOCALES</div>
          <div className="col gap4">
            {stationEvts.map(ev => (
              <button key={ev.id} className="px-btn" onClick={() => openStationEvent(ev)}>
                {ev.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── SOUS-BOSS ───────────────────────────────────────────────────── */}
      {(() => {
        const subBoss = getSubBossAtStation(gs.currentStation)
        if (!subBoss) return null
        const defeated = gs.subBossesDefeated ?? {}
        const alreadyDone = isSubBossDefeated(defeated, subBoss.id)
        const progress = getSubBossProgress(defeated, subBoss.pillar)
        const pillarSubs = defeated[subBoss.pillar] ?? []
        const prevSubBoss = subBoss.order === 1 ? null : getSubBossesForPillar(subBoss.pillar).find(sb => sb.order === subBoss.order - 1)
        const prevDone = subBoss.order === 1 || (prevSubBoss ? pillarSubs.includes(prevSubBoss.id) : true)
        const pName = subBoss.pillar.charAt(0).toUpperCase() + subBoss.pillar.slice(1)
        return (
          <div className="px-box" style={{ borderColor: alreadyDone ? 'var(--green)' : 'var(--red)', background: 'rgba(40,0,0,0.2)' }}>
            <div className="t-xs mb4" style={{ color: alreadyDone ? 'var(--green)' : 'var(--gold)', letterSpacing: '2px' }}>
              ⚔ LIEUTENANT DE {pName.toUpperCase()} ({progress.done}/{progress.total})
            </div>
            <div className="t-sm t-bright mb4">{subBoss.name}</div>
            <div className="t-xs t-dim mb4" style={{ lineHeight: 1.6 }}>{subBoss.personality}</div>
            <div className="t-xs mb4" style={{ color: 'var(--cyan)', lineHeight: 1.6 }}>« {subBoss.backstory.slice(0, 150)}... »</div>
            <div className="t-xs t-dim mb8">Mécanique : {subBoss.combatMechanic}</div>
            {alreadyDone ? (
              <div className="t-xs t-green">✓ VAINCU</div>
            ) : !prevDone ? (
              <div className="t-xs t-red">⛔ Ordre obligatoire — vaincre d'abord le lieutenant {subBoss.order - 1} : {prevSubBoss?.name} à {prevSubBoss?.station}</div>
            ) : subBossResult ? (
              <div className="px-box" style={{ borderColor: subBossResult.success ? 'var(--green)' : 'var(--red)' }}>
                <div className="t-xs" style={{ color: subBossResult.success ? 'var(--green)' : 'var(--orange)', lineHeight: 2 }}>
                  {subBossResult.message}
                </div>
                <button className="px-btn px-btn--sm mt4" style={{ width: 'auto' }} onClick={() => setSubBossResult(null)}>Continuer</button>
              </div>
            ) : (
              <div className="col gap4">
                <button className="px-btn" style={{ borderColor: 'var(--red)', color: 'var(--red)' }}
                  onClick={() => startCombat(subBoss.enemy)}>
                  ⚔ Affronter {subBoss.name} — combat
                </button>
                {subBoss.resolutions.filter(a => a !== 'kill').map(action => {
                  const meta = RESOLUTION_META[action]
                  const check = canResolveSubBoss(gs, subBoss, action)
                  return (
                    <button key={action} className="px-btn" style={{ borderColor: 'var(--cyan)', textAlign: 'left' }}
                      disabled={!check.ok}
                      onClick={() => {
                        const res = resolveSubBoss(gs, subBoss, action)
                        patch(res.patch)
                        if (res.triggerCombat) {
                          startCombat(subBoss.enemy)
                        } else {
                          setSubBossResult({ message: res.message, success: res.success })
                        }
                      }}>
                      <div className="t-xs t-bright">{meta.icon} {meta.label}</div>
                      <div className="t-xs t-dim mt2">{check.ok ? check.hint : check.reason}</div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── INDICES ARC PERDU (PNJs) ──────────────────────────────────────── */}
      {(() => {
        const clues = getAvailableClues(gs)
        if (clues.length === 0) return null
        return (
          <div className="px-box" style={{ borderColor: 'var(--purple)', background: 'rgba(100,0,160,0.06)' }}>
            <div className="t-xs mb4" style={{ color: 'var(--purple)', letterSpacing: '2px' }}>◆ INFORMATEUR — L'ARC PERDU</div>
            <div className="t-xs t-dim mb8" style={{ lineHeight: 1.8 }}>
              Indices collectés : {(gs.arcPerduClues ?? []).length}/4
            </div>
            {clueMsg && (
              <div className="px-box mb8" style={{ borderColor: clueMsg.includes('LOCALISÉ') ? 'var(--gold)' : 'var(--purple)' }}>
                <div className="t-xs" style={{ color: clueMsg.includes('LOCALISÉ') ? 'var(--gold)' : 'var(--purple)', lineHeight: 2 }}>{clueMsg}</div>
                <button className="px-btn px-btn--sm mt4" style={{ width: 'auto' }} onClick={() => setClueMsg(null)}>OK</button>
              </div>
            )}
            {clues.map(clue => {
              const check = canCollectClue(gs, clue)
              return (
                <div key={clue.id} className="col gap4 mb8" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                  <div className="t-sm" style={{ color: 'var(--purple)' }}>{clue.npcName}</div>
                  <div className="t-xs t-dim" style={{ lineHeight: 2, fontStyle: 'italic' }}>{clue.dialogue}</div>
                  {!check.ok && <div className="t-xs t-red">{check.reason}</div>}
                  <button
                    className="px-btn px-btn--sm"
                    style={{ borderColor: 'var(--purple)', color: 'var(--purple)', width: 'auto' }}
                    disabled={!check.ok}
                    onClick={() => {
                      const result = collectClue(gs, clue.id)
                      patch(result.gs)
                      setClueMsg(result.message)
                    }}
                  >
                    {clue.requirement?.credits ? `Écouter (-${clue.requirement.credits} cr)` : 'Écouter'}
                  </button>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* ── QUÊTES D'ÉQUIPEMENT ──────────────────────────────────────────── */}
      {(() => {
        const eqQuests = getQuestsAtStation(gs.currentStation)
        if (eqQuests.length === 0) return null
        const available = eqQuests.filter(q => !(gs.completedEquipmentQuests ?? []).includes(q.id))
        if (available.length === 0) return null
        return (
          <div className="px-box" style={{ borderColor: 'var(--gold)', background: 'rgba(30,20,0,0.15)' }}>
            <div className="t-xs t-gold mb8" style={{ letterSpacing: '2px' }}>🗡 QUÊTES D'ÉQUIPEMENT</div>
            <div className="col gap8">
              {available.map(q => {
                const check = canStartQuest(gs, q)
                const diffColors: Record<string, string> = { common: 'var(--text-dim)', rare: 'var(--cyan)', epic: 'var(--purple, #a855f7)', legendary: 'var(--gold)' }
                return (
                  <div key={q.id} className="col gap4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <div className="t-sm" style={{ color: diffColors[q.difficulty] }}>{q.title}</div>
                      <div className="tag t-xs" style={{ color: diffColors[q.difficulty], borderColor: 'currentColor' }}>{q.difficulty.toUpperCase()}</div>
                    </div>
                    <div className="t-xs t-dim" style={{ lineHeight: 1.6 }}>{q.description}</div>
                    {!check.ok && (
                      <div className="t-xs t-red">{check.missing.join(' · ')}</div>
                    )}
                    <button className="px-btn px-btn--sm" style={{ width: 'auto', borderColor: diffColors[q.difficulty], color: diffColors[q.difficulty], opacity: check.ok ? 1 : 0.4 }}
                      disabled={!check.ok}
                      onClick={() => {
                        const result = completeQuest(gs, q)
                        patch(result)
                      }}>
                      {check.ok ? '✓ Compléter' : 'Conditions manquantes'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* ── SERVICE EXCLUSIF ──────────────────────────────────────────────── */}
      {station.specialService && (() => {
        const svc = station.specialService!
        const SERVICE_LABELS: Record<string, string> = {
          gambling:     'CASINO — SCOTTY GOLDEN NORTH',
          implants:     'CLINIQUE IMPLANTS',
          fuel_cheap:   `CARBURANT À PRIX RÉDUIT (-${Math.round((station.fuelDiscount ?? 0.35) * 100)}%)`,
          weapon_forge: 'FORGE — AMÉLIORATION D\'ARME',
          arena:        'ARÈNE — COMBAT VOLONTAIRE',
          rest_bonus:   'REPOS COMPLET',
        }
        return (
          <div className="px-box" style={{ borderColor: 'var(--gold)', background: 'rgba(30,20,0,0.3)' }}>
            <div className="t-xs t-gold mb8" style={{ letterSpacing: '2px' }}>★ {SERVICE_LABELS[svc]}</div>

            {/* GAMBLING */}
            {svc === 'gambling' && (
              specialResult
                ? <div className="col gap4">
                    <div className="t-xs" style={{ color: specialResult.includes('gagnes') ? 'var(--green)' : 'var(--red)', lineHeight: 2 }}>{specialResult}</div>
                    <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => setSpecialResult(null)}>Rejouer</button>
                  </div>
                : <div className="col gap4">
                    <div className="t-xs t-dim mb4" style={{ lineHeight: 2 }}>45% de chance de doubler la mise. La maison prend le reste.</div>
                    <div className="row gap4">
                      {([100, 500, 1000] as const).map(bet => (
                        <button key={bet} className="px-btn" style={{ flex: 1, opacity: gs.credits < bet ? 0.4 : 1 }}
                          disabled={gs.credits < bet}
                          onClick={() => {
                            const win = Math.random() < 0.45
                            patch({ credits: win ? gs.credits + bet : gs.credits - bet })
                            setSpecialResult(win
                              ? `★ Tu gagnes ${bet.toLocaleString()} cr. La table était de ton côté ce soir.`
                              : `Tu perds ${bet.toLocaleString()} cr. Le casino gagne toujours.`)
                          }}>
                          Miser {bet.toLocaleString()} cr
                        </button>
                      ))}
                    </div>
                  </div>
            )}

            {/* IMPLANTS */}
            {svc === 'implants' && (() => {
              const bought = gs.implantsBought ?? []
              const IMPLANTS = [
                { id: 'hp',      label: 'Implant Vital (+25 PV max)',       cost: 800,  apply: (g: GameState): Partial<GameState> => ({ implantsBought: [...(g.implantsBought ?? []), 'hp'],      playerMaxHp: g.playerMaxHp + 25, playerHp: g.playerMaxHp + 25 }) },
                { id: 'stamina', label: 'Implant Neural (+2 Stamina max)',  cost: 600,  apply: (g: GameState): Partial<GameState> => ({ implantsBought: [...(g.implantsBought ?? []), 'stamina'], maxStamina: g.maxStamina + 2,    stamina: g.maxStamina + 2 }) },
                { id: 'regen',   label: 'Implant Regen (5 kits médicaux)', cost: 500,  apply: (g: GameState): Partial<GameState> => ({ implantsBought: [...(g.implantsBought ?? []), 'regen'],   cargo: { ...g.cargo, 'Kit médical': (g.cargo['Kit médical'] ?? 0) + 5 } }) },
              ]
              return (
                <div className="col gap4">
                  {specialResult && <div className="t-xs t-green mb4">{specialResult}</div>}
                  {IMPLANTS.map(imp => {
                    const alreadyBought = bought.includes(imp.id)
                    const canAfford = gs.credits >= imp.cost
                    return (
                      <button key={imp.id} className="px-btn"
                        style={{ opacity: alreadyBought || !canAfford ? 0.4 : 1, color: alreadyBought ? undefined : 'var(--cyan)', borderColor: alreadyBought ? undefined : 'var(--cyan)' }}
                        disabled={alreadyBought || !canAfford}
                        onClick={() => {
                          patch({ ...imp.apply(gs), credits: gs.credits - imp.cost })
                          setSpecialResult(`Implant posé avec succès — ${imp.label}`)
                        }}>
                        {imp.label}
                        <span className="t-dim" style={{ marginLeft: '8px', fontSize: '9px' }}>
                          {alreadyBought ? '(déjà installé ce run)' : `${imp.cost.toLocaleString()} cr`}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })()}

            {/* FUEL CHEAP */}
            {svc === 'fuel_cheap' && (() => {
              const basePrice = 240
              const disc = station.fuelDiscount ?? 0.35
              const price = Math.floor(basePrice * (1 - disc))
              const missing = gs.maxFuel - gs.fuel
              return specialResult
                ? <div className="t-xs t-green">{specialResult}</div>
                : <div className="col gap4">
                    <div className="t-xs t-dim mb4" style={{ lineHeight: 2 }}>
                      Carburant directement de la source — <span style={{ color: 'var(--green)' }}>{price} cr/u</span>
                      <span className="t-dim" style={{ marginLeft: '6px', textDecoration: 'line-through', fontSize: '9px' }}>{basePrice} cr</span>
                    </div>
                    {missing === 0
                      ? <div className="t-xs t-dim">Réservoir déjà plein.</div>
                      : [1, 2, 3].filter(n => n <= missing).map(qty => (
                          <button key={qty} className="px-btn"
                            style={{ opacity: gs.credits < price * qty ? 0.4 : 1, color: 'var(--green)', borderColor: 'var(--green)' }}
                            disabled={gs.credits < price * qty}
                            onClick={() => {
                              patch({ credits: gs.credits - price * qty, fuel: gs.fuel + qty })
                              setSpecialResult(`+${qty} carburant — -${(price * qty).toLocaleString()} cr (prix réduit)`)
                            }}>
                            Acheter {qty}u — {(price * qty).toLocaleString()} cr
                          </button>
                        ))
                    }
                  </div>
            })()}

            {/* WEAPON FORGE */}
            {svc === 'weapon_forge' && (() => {
              const w = gs.equippedWeapon
              if (!w) return <div className="t-xs t-dim">Équipe une arme pour la faire améliorer ici.</div>
              const alreadyUpgraded = w.name.includes('[+]')
              const cost = w.tier <= 2 ? 500 : 1200
              const canAfford = gs.credits >= cost
              return specialResult
                ? <div className="t-xs t-green">{specialResult}</div>
                : <div className="col gap4">
                    <div className="t-xs t-dim mb4" style={{ lineHeight: 2 }}>
                      Arme équipée : <span className="t-bright">{w.name}</span> · {w.damageMin}–{w.damageMax} dmg · Tier {w.tier}
                    </div>
                    <button className="px-btn"
                      style={{ opacity: alreadyUpgraded || !canAfford ? 0.4 : 1, color: 'var(--orange)', borderColor: 'var(--orange)' }}
                      disabled={alreadyUpgraded || !canAfford}
                      onClick={() => {
                        const upgraded: WeaponData = { ...w, name: w.name + ' [+]', damageMin: w.damageMin + 4, damageMax: w.damageMax + 6 }
                        patch({ credits: gs.credits - cost, equippedWeapon: upgraded, weapons: gs.weapons.map(x => x === w ? upgraded : x) })
                        setSpecialResult(`${w.name} forgée — +4 min, +6 max dégâts. (-${cost.toLocaleString()} cr)`)
                      }}>
                      ⚒ Améliorer {w.name} — {cost.toLocaleString()} cr
                      {alreadyUpgraded && <span className="t-dim" style={{ marginLeft: '8px', fontSize: '9px' }}>(déjà améliorée)</span>}
                    </button>
                  </div>
            })()}

            {/* ARENA */}
            {svc === 'arena' && (
              specialResult
                ? <div className="col gap4">
                    <div className="t-xs t-green">{specialResult}</div>
                    <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => setSpecialResult(null)}>Combattre encore</button>
                  </div>
                : <div className="col gap4">
                    <div className="t-xs t-dim mb4" style={{ lineHeight: 2 }}>Combat volontaire. L'ennemi a un butin 2× la normale. La foule regarde.</div>
                    {([
                      { label: 'Qualification — Tier 1', tier: 1 as const, note: 'Adversaire débutant, butin de base doublé' },
                      { label: 'Prestige — Tier 2',      tier: 2 as const, note: 'Adversaire confirmé, butin moyen doublé' },
                      { label: 'Championnat — Tier 3',   tier: 3 as const, note: 'Champion, butin élevé doublé' },
                    ]).map(f => (
                      <button key={f.tier} className="px-btn"
                        style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                        onClick={() => {
                          spendAction()
                          const base = getEnemyByTier(f.tier)
                          startCombat({ ...base, lootMin: base.lootMin * 2, lootMax: base.lootMax * 2, description: `[ARÈNE] ${base.description}` })
                        }}>
                        ⚔ {f.label}
                        <span className="t-dim" style={{ marginLeft: '8px', fontSize: '9px' }}>{f.note}</span>
                      </button>
                    ))}
                  </div>
            )}

            {/* REST BONUS */}
            {svc === 'rest_bonus' && (() => {
              const usedFree  = (gs.usedFreeRestStations ?? []).includes(gs.currentStation)
              const cost      = usedFree ? 200 : 0
              const alreadyFull = gs.playerHp >= gs.playerMaxHp && gs.stamina >= gs.maxStamina
              return specialResult
                ? <div className="t-xs t-green">{specialResult}</div>
                : factionBlocked
                ? <div className="t-xs" style={{ color: 'var(--red)', opacity: 0.7 }}>★ Se reposer — <span style={{ color: 'var(--red)' }}>ACCÈS REFUSÉ</span></div>
                : <div className="col gap4">
                    <div className="t-xs t-dim mb4" style={{ lineHeight: 2 }}>
                      {usedFree
                        ? `Repos payant — HP et Stamina à fond pour ${cost} cr.`
                        : 'Premier repos gratuit ici. HP et Stamina à fond.'}
                    </div>
                    <button className="px-btn"
                      style={{ opacity: alreadyFull || (usedFree && gs.credits < cost) ? 0.4 : 1, color: 'var(--green)', borderColor: 'var(--green)' }}
                      disabled={alreadyFull || (usedFree && gs.credits < cost)}
                      onClick={() => {
                        patch({
                          playerHp: gs.playerMaxHp,
                          stamina: gs.maxStamina,
                          credits: usedFree ? gs.credits - cost : gs.credits,
                          usedFreeRestStations: usedFree
                            ? gs.usedFreeRestStations
                            : [...(gs.usedFreeRestStations ?? []), gs.currentStation],
                        })
                        setSpecialResult(`Repos complet. HP ${gs.playerMaxHp}/${gs.playerMaxHp} · Stamina ${gs.maxStamina}/${gs.maxStamina}.${usedFree ? ` (-${cost} cr)` : ' (gratuit)'}`)
                      }}>
                      ★ Se reposer{cost > 0 ? ` (${cost} cr)` : ' (gratuit)'}
                    </button>
                    {alreadyFull && <div className="t-xs t-dim">Tu es déjà au maximum.</div>}
                  </div>
            })()}
          </div>
        )
      })()}

      {/* PNJ local */}
      {localNpc && (() => {
        const svc = getNpcService(localNpc.role)
        const npcState = gs.knownNpcs[localNpc.id]
        const serviceUsed = (npcState?.lastServiceDay ?? -1) === gs.day
        return (
          <div className="px-box" style={{ borderColor: 'var(--cyan)' }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div>
                <span className="t-sm t-bright">{localNpc.name}</span>
                <span className="t-xs t-dim" style={{ marginLeft: '8px' }}>{localNpc.role}</span>
              </div>
              {svc && (
                <span className="t-xs" style={{ color: serviceUsed ? 'var(--text-dim)' : 'var(--cyan)', opacity: serviceUsed ? 0.5 : 1 }}>
                  {svc.label} — {svc.costText}
                </span>
              )}
            </div>
            <div className="t-xs t-dim mb8">{localNpc.description}</div>
            <button className="px-btn px-btn--sm" onClick={() => {
              setNpcDialogResult(null)
              setMode('npc-encounter')
            }}>
              › {svc ? `Voir ${localNpc.name}` : `Parler à ${localNpc.name}`}
            </button>
          </div>
        )
      })()}

      <div className="grid2">
        <div className="col">
          <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>◆ INVENTAIRE</span>
            {(() => {
              const maxCargo = 15 + (gs.shipModules?.soute ?? 0) * 5
              const totalCargo = Object.values(gs.cargo).reduce((a, b) => a + b, 0)
              return (
                <span style={{ fontSize: '9px', letterSpacing: '1px', color: totalCargo >= maxCargo ? 'var(--red)' : 'var(--dim)' }}>
                  SOUTE {totalCargo}/{maxCargo}{totalCargo >= maxCargo ? ' ▲ PLEINE' : ''}
                </span>
              )
            })()}
          </div>
          <button className="px-btn" onClick={() => goTo('inventory')} disabled={gs.weapons.length === 0 && gs.armors.length === 0}>
            Armes & Armures ({gs.weapons.length} / {gs.armors.length})
          </button>
          {(gs.cargo['Médicaments'] ?? 0) > 0 && gs.playerHp < gs.playerMaxHp && (
            <button className="px-btn px-btn--green" onClick={() => {
              const qty = (gs.cargo['Médicaments'] ?? 1) - 1
              const nc = { ...gs.cargo, 'Médicaments': qty }
              if (qty <= 0) delete (nc as Record<string,number>)['Médicaments']
              patch({ playerHp: Math.min(gs.playerMaxHp, gs.playerHp + 30), cargo: nc })
            }}>
              Se soigner +30 PV (Médicaments ×{gs.cargo['Médicaments']})
            </button>
          )}
          {(gs.cargo['Kit médical'] ?? 0) > 0 && gs.playerHp < gs.playerMaxHp && (
            <button className="px-btn" style={{ borderColor: 'var(--green)', color: 'var(--green)' }} onClick={() => {
              const qty = (gs.cargo['Kit médical'] ?? 1) - 1
              const nc = { ...gs.cargo, 'Kit médical': qty }
              if (qty <= 0) delete (nc as Record<string,number>)['Kit médical']
              patch({ playerHp: Math.min(gs.playerMaxHp, gs.playerHp + 30), cargo: nc })
            }}>
              ⚙ Kit médical +30 PV (×{gs.cargo['Kit médical']})
            </button>
          )}
          {(gs.cargo['Kit médical premium'] ?? 0) > 0 && (gs.playerHp < gs.playerMaxHp || gs.stamina < gs.maxStamina) && (
            <button className="px-btn" style={{ borderColor: 'var(--green)', color: 'var(--green)' }} onClick={() => {
              const qty = (gs.cargo['Kit médical premium'] ?? 1) - 1
              const nc = { ...gs.cargo, 'Kit médical premium': qty }
              if (qty <= 0) delete (nc as Record<string,number>)['Kit médical premium']
              patch({ playerHp: Math.min(gs.playerMaxHp, gs.playerHp + 60), stamina: Math.min(gs.maxStamina, gs.stamina + 2), cargo: nc })
            }}>
              ⚙ Kit premium +60 PV +2 Stamina (×{gs.cargo['Kit médical premium']})
            </button>
          )}
          {(gs.cargo['Stimulant'] ?? 0) > 0 && gs.stamina < gs.maxStamina && (
            <button className="px-btn" style={{ borderColor: 'var(--cyan)', color: 'var(--cyan)' }} onClick={() => {
              const qty = (gs.cargo['Stimulant'] ?? 1) - 1
              const nc = { ...gs.cargo, 'Stimulant': qty }
              if (qty <= 0) delete (nc as Record<string,number>)['Stimulant']
              patch({ stamina: Math.min(gs.maxStamina, gs.stamina + 3), cargo: nc })
            }}>
              ⚙ Stimulant +3 Stamina (×{gs.cargo['Stimulant']})
            </button>
          )}
          {/* Pièces techniques / Pièces de rechange → réparation vaisseau */}
          {(() => {
            const REPAIR = ['Pièces techniques', 'Pièces de rechange']
            const key = REPAIR.find(k => (gs.cargo[k] ?? 0) > 0)
            if (!key || gs.shipHp >= gs.shipMaxHp) return null
            return (
              <button className="px-btn" style={{ borderColor: 'var(--cyan)', color: 'var(--cyan)' }} onClick={() => {
                const qty = (gs.cargo[key] ?? 1) - 1
                const nc = { ...gs.cargo, [key]: qty }
                if (qty <= 0) delete (nc as Record<string,number>)[key]
                patch({ shipHp: Math.min(gs.shipMaxHp, gs.shipHp + 5), cargo: nc })
              }}>
                🔧 {key} → réparer vaisseau +5 PV ({gs.shipHp}/{gs.shipMaxHp}) · ×{gs.cargo[key]}
              </button>
            )
          })()}
          {/* Implants (cargo) → bonus HP max permanent */}
          {(gs.cargo['Implants'] ?? 0) > 0 && (
            <button className="px-btn" style={{ borderColor: 'var(--purple)', color: 'var(--purple)' }} onClick={() => {
              const qty = (gs.cargo['Implants'] ?? 1) - 1
              const nc = { ...gs.cargo, 'Implants': qty }
              if (qty <= 0) delete (nc as Record<string,number>)['Implants']
              patch({ playerMaxHp: gs.playerMaxHp + 15, playerHp: Math.min(gs.playerMaxHp + 15, gs.playerHp + 10), cargo: nc })
            }}>
              ⬆ Implant posé → +15 PV max permanent (+10 PV actuels) · ×{gs.cargo['Implants']}
            </button>
          )}
          {/* Logiciels → effacer le contrôle douanier du jour */}
          {(gs.cargo['Logiciels'] ?? 0) > 0 && station.type === 'military' && (
            <button className="px-btn" style={{ borderColor: 'var(--cyan)', color: 'var(--cyan)' }} onClick={() => {
              const qty = (gs.cargo['Logiciels'] ?? 1) - 1
              const nc = { ...gs.cargo, 'Logiciels': qty }
              if (qty <= 0) delete (nc as Record<string,number>)['Logiciels']
              sessionStorage.setItem(`customs_${gs.currentStation}_${gs.day}`, '1')
              patch({ cargo: nc, pendingMessage: '◆ Logiciels : scan douanier effacé pour aujourd\'hui.' })
            }}>
              💾 Logiciels → effacer scan douanier · ×{gs.cargo['Logiciels']}
            </button>
          )}
          {/* Or → pot-de-vin reputation */}
          {(gs.cargo['Or'] ?? 0) > 0 && (
            <button className="px-btn" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }} onClick={() => {
              const qty = (gs.cargo['Or'] ?? 1) - 1
              const nc = { ...gs.cargo, 'Or': qty }
              if (qty <= 0) delete (nc as Record<string,number>)['Or']
              patch({ cargo: nc, reputation: gs.reputation + 15, pendingMessage: '◆ Or distribué. +15 réputation.' })
            }}>
              ★ Distribuer de l'Or → +15 réputation · ×{gs.cargo['Or']}
            </button>
          )}
          {/* Rations / Vivres → soin léger */}
          {(['Rations', 'Vivres'] as const).map(key => (gs.cargo[key] ?? 0) > 0 && gs.playerHp < gs.playerMaxHp && (
            <button key={key} className="px-btn px-btn--green" onClick={() => {
              const qty = (gs.cargo[key] ?? 1) - 1
              const nc = { ...gs.cargo, [key]: qty }
              if (qty <= 0) delete (nc as Record<string,number>)[key]
              patch({ playerHp: Math.min(gs.playerMaxHp, gs.playerHp + 10), cargo: nc })
            }}>
              {key} +10 PV · ×{gs.cargo[key]}
            </button>
          ))}
          {/* Rations militaires → soin + stamina */}
          {(gs.cargo['Rations militaires'] ?? 0) > 0 && (gs.playerHp < gs.playerMaxHp || gs.stamina < gs.maxStamina) && (
            <button className="px-btn px-btn--green" onClick={() => {
              const qty = (gs.cargo['Rations militaires'] ?? 1) - 1
              const nc = { ...gs.cargo, 'Rations militaires': qty }
              if (qty <= 0) delete (nc as Record<string,number>)['Rations militaires']
              patch({ playerHp: Math.min(gs.playerMaxHp, gs.playerHp + 15), stamina: Math.min(gs.maxStamina, gs.stamina + 1), cargo: nc })
            }}>
              Rations militaires +15 PV +1 Stamina · ×{gs.cargo['Rations militaires']}
            </button>
          )}
          {/* Luxe → réputation */}
          {(gs.cargo['Luxe'] ?? 0) > 0 && (
            <button className="px-btn" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }} onClick={() => {
              const qty = (gs.cargo['Luxe'] ?? 1) - 1
              const nc = { ...gs.cargo, 'Luxe': qty }
              if (qty <= 0) delete (nc as Record<string,number>)['Luxe']
              patch({ cargo: nc, reputation: gs.reputation + 10, pendingMessage: '◆ Luxe distribué. +10 réputation.' })
            }}>
              ★ Distribuer du Luxe → +10 réputation · ×{gs.cargo['Luxe']}
            </button>
          )}
          {/* Renseignements → réputation */}
          {(gs.cargo['Renseignements'] ?? 0) > 0 && (
            <button className="px-btn" style={{ borderColor: 'var(--cyan)', color: 'var(--cyan)' }} onClick={() => {
              const qty = (gs.cargo['Renseignements'] ?? 1) - 1
              const nc = { ...gs.cargo, 'Renseignements': qty }
              if (qty <= 0) delete (nc as Record<string,number>)['Renseignements']
              patch({ cargo: nc, reputation: gs.reputation + 12, pendingMessage: '◆ Renseignements revendus. +12 réputation.' })
            }}>
              ◈ Renseignements → +12 réputation · ×{gs.cargo['Renseignements']}
            </button>
          )}
          {/* Intel faction → réputation faction locale */}
          {(gs.cargo['Intel faction'] ?? 0) > 0 && (() => {
            const localFaction = STATION_FACTION_CONTROL[gs.currentStation]
            if (!localFaction) return null
            return (
              <button className="px-btn" style={{ borderColor: 'var(--cyan)', color: 'var(--cyan)' }} onClick={() => {
                const qty = (gs.cargo['Intel faction'] ?? 1) - 1
                const nc = { ...gs.cargo, 'Intel faction': qty }
                if (qty <= 0) delete (nc as Record<string,number>)['Intel faction']
                patch({
                  cargo: nc,
                  factionReputation: { ...gs.factionReputation, [localFaction]: (gs.factionReputation?.[localFaction] ?? 0) + 20 },
                  pendingMessage: `◈ Intel faction revendue. +20 réputation ${localFaction}.`,
                })
              }}>
                ◈ Intel faction → +20 rép {localFaction} · ×{gs.cargo['Intel faction']}
              </button>
            )
          })()}
          {/* Informations monnayables / VIP → crédits */}
          {(['Informations monnayables', 'Informations VIP'] as const).map(key => {
            const qty = gs.cargo[key] ?? 0
            if (qty === 0) return null
            const gain = key === 'Informations VIP' ? 350 : 200
            return (
              <button key={key} className="px-btn" style={{ borderColor: 'var(--green)', color: 'var(--green)' }} onClick={() => {
                const newQty = qty - 1
                const nc = { ...gs.cargo, [key]: newQty }
                if (newQty <= 0) delete (nc as Record<string,number>)[key]
                patch({ cargo: nc, credits: gs.credits + gain, pendingMessage: `◆ ${key} converties. +${gain} cr.` })
              }}>
                {key} → +{gain} cr · ×{qty}
              </button>
            )
          })}
          {/* Matériel de pillage → bonus +50% loot prochaine exploration */}
          {(gs.cargo['Matériel de pillage'] ?? 0) > 0 && !gs.pillageBonusActive && (
            <button className="px-btn" style={{ borderColor: 'var(--orange)', color: 'var(--orange)' }} onClick={() => {
              const qty = (gs.cargo['Matériel de pillage'] ?? 1) - 1
              const nc = { ...gs.cargo, 'Matériel de pillage': qty }
              if (qty <= 0) delete (nc as Record<string,number>)['Matériel de pillage']
              patch({ cargo: nc, pillageBonusActive: true, pendingMessage: '◆ Matériel déployé. Prochain loot +50%.' })
            }}>
              ⚠ Matériel de pillage → prochain loot +50% · ×{gs.cargo['Matériel de pillage']}
            </button>
          )}
          {gs.pillageBonusActive && (
            <div className="px-box" style={{ borderColor: 'var(--orange)', padding: '5px 10px' }}>
              <span className="t-xs" style={{ color: 'var(--orange)' }}>⚠ PILLAGE ACTIF — prochain loot +50%</span>
            </div>
          )}
        </div>

        <div className="col">
          <div className="section-header">◆ PROGRESSION</div>
          <button className="px-btn" onClick={() => goTo('quests')} disabled={gs.activeQuests.length === 0}>
            Quêtes ({gs.activeQuests.length})
          </button>
          <button className="px-btn" onClick={() => goTo('objectives')}>
            Objectifs ({gs.completedObjectives.length}/{OBJECTIVES.length})
          </button>
          <div className="px-box" style={{ borderColor: 'var(--purple)', padding: '8px 12px', background: 'rgba(80,0,120,0.1)' }}>
            <div className="t-xs" style={{ color: 'var(--purple)' }}>
              ★★ Fragments Nexus : <span className="t-bright">{gs.stationPiecesRallied} / 4</span>
            </div>
          </div>
          <button className="px-btn" style={{ borderColor: 'var(--text-dim)', color: (gs.discoveredLore ?? []).length > 0 ? 'var(--cyan)' : 'var(--text-dim)' }}
            onClick={() => goTo('lore')}>
            Mémoire du Vide {(gs.discoveredLore ?? []).length > 0 ? `(${gs.discoveredLore.length} fragments)` : '— aucun fragment'}
          </button>
          <button className="px-btn" style={{ borderColor: 'var(--text-dim)', color: (gs.journal ?? []).length > 0 ? 'var(--orange)' : 'var(--text-dim)' }}
            onClick={() => goTo('journal')}>
            Journal de bord {(gs.journal ?? []).length > 0 ? `(${gs.journal.length} entrée${gs.journal.length > 1 ? 's' : ''})` : '— vide'}
          </button>
          <button className="px-btn" onClick={() => goTo('factions')}>
            Factions {gs.faction !== 'none' ? `[${gs.faction.toUpperCase()}]` : ''}
          </button>
          {hasArcs && (
            <button className="px-btn" style={{ color: 'var(--purple)' }} onClick={() => goTo('narrative-arcs')}>
              Arcs narratifs ({gs.activeArcs.length} actifs{newArcsCount > 0 ? `, +${newArcsCount} nouveau` : ''})
            </button>
          )}
        </div>
      </div>

      {/* Résumé cargo */}
      {Object.keys(gs.cargo).length > 0 && (
        <div className="px-box">
          <div className="t-xs t-dim mb4">CARGAISON</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {Object.entries(gs.cargo).map(([item, qty]) => (
              <div key={item} className="tag tag--dim">{item} ×{qty}</div>
            ))}
          </div>
        </div>
      )}

      {/* Recommencer */}
      {confirmRestart ? (
        <div className="px-box" style={{ borderColor: 'var(--red)', background: 'rgba(40,0,0,0.3)' }}>
          <div className="t-xs t-red mb8">Abandonner cette run ? Toute progression sera perdue.</div>
          <div className="row gap4">
            <button className="px-btn px-btn--danger" style={{ flex: 1 }}
              onClick={() => useGameStore.getState().newGame()}>
              Confirmer — Nouvelle run
            </button>
            <button className="px-btn" style={{ flex: 1 }} onClick={() => setConfirmRestart(false)}>
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button className="px-btn" style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
          onClick={() => setConfirmRestart(true)}>
          Abandonner la run
        </button>
      )}
    </div>

    {/* ── SIDEBAR QUÊTES ────────────────────────────────────────────────────── */}
    <div className="hub-sidebar">
      <div style={{ fontSize: '9px', letterSpacing: '2px', color: 'var(--dim)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>◆ QUÊTES</span>
        <span style={{ color: 'var(--cyan)' }}>{gs.activeQuests.length}</span>
      </div>
      {gs.activeQuests.length === 0 && (
        <div style={{ fontSize: '9px', color: 'var(--dim)', fontStyle: 'italic', padding: '8px 0' }}>Aucune quête active.</div>
      )}
      {gs.activeQuests.map(q => {
        const isHere = q.targetStation === gs.currentStation
        const isDeliveryReady = isHere && (q.type === 'delivery' || q.type === 'heist') && !!q.targetItem && (gs.cargo[q.targetItem!] ?? 0) > 0
        const isPatrolHere = q.type === 'patrol' && isHere
        const patrolProg = q.progress ?? 0
        const isHov = hoveredQuest === q.id
        const borderCol = isDeliveryReady ? 'var(--green)' : isHere ? 'var(--gold)' : 'var(--border)'
        const typeCol = q.type === 'kill' || q.type === 'bounty' ? 'var(--red)' : q.type === 'patrol' ? 'var(--dim)' : isDeliveryReady ? 'var(--green)' : 'var(--cyan)'
        return (
          <div
            key={q.id}
            style={{ background: 'var(--bg-panel)', border: `2px solid ${borderCol}`, padding: '8px 10px', position: 'relative', cursor: 'pointer' }}
            onMouseEnter={() => setHoveredQuest(q.id)}
            onMouseLeave={() => setHoveredQuest(null)}
            onClick={() => goTo('quests')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
              <span style={{ fontSize: '8px', letterSpacing: '1px', color: typeCol }}>{q.type.toUpperCase()}</span>
              {isHere && !isDeliveryReady && !isPatrolHere && <span style={{ color: 'var(--gold)', fontSize: '8px' }}>← ICI</span>}
              {isDeliveryReady && <span style={{ color: 'var(--green)', fontSize: '8px' }}>▶ LIVRER</span>}
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text)', lineHeight: '1.6', marginBottom: '2px' }}>{q.title}</div>
            <div style={{ fontSize: '8px', color: 'var(--dim)' }}>→ {q.targetStation}</div>
            {isPatrolHere && patrolProg < 3 && (
              <div style={{ marginTop: '4px', borderLeft: '2px solid var(--cyan)', paddingLeft: '6px', fontSize: '8px', color: 'var(--dim)' }}>
                Patrouille {patrolProg}/3
              </div>
            )}
            {isDeliveryReady && (
              <button className="px-btn px-btn--sm" style={{ marginTop: '6px', color: 'var(--green)', borderColor: 'var(--green)', fontSize: '8px', padding: '4px 8px' }}
                onClick={(e) => { e.stopPropagation(); setPendingDeliveryQuest(q); setDeliveryResult(null); setMode('delivery-event') }}>
                ▶ Livrer {q.targetItem}
              </button>
            )}
            {isPatrolHere && patrolProg >= 3 && (
              <button className="px-btn px-btn--sm" style={{ marginTop: '6px', color: 'var(--gold)', borderColor: 'var(--gold)', fontSize: '8px', padding: '4px 8px' }}
                onClick={(e) => { e.stopPropagation(); manualCompleteQuest(q.id) }}>
                ★ Terminer la patrouille
              </button>
            )}
            {isHov && (
              <div style={{ position: 'absolute', right: '104%', top: 0, width: '210px', background: 'var(--bg-panel2)', border: '2px solid var(--border-hi)', padding: '10px 12px', zIndex: 50, fontSize: '9px', lineHeight: '1.8', boxShadow: '2px 2px 0 var(--border-hi)' }}>
                <div style={{ color: 'var(--gold)', marginBottom: '6px' }}>{q.title}</div>
                <div style={{ color: 'var(--dim)', marginBottom: '6px', lineHeight: '1.6', fontSize: '8px' }}>{q.description}</div>
                <div style={{ color: 'var(--text)' }}>Donneur : <span style={{ color: 'var(--cyan)' }}>{q.giver}</span></div>
                <div style={{ color: 'var(--text)' }}>→ {q.targetStation}</div>
                {q.targetItem && <div style={{ color: 'var(--cyan)' }}>Item : {q.targetItem}</div>}
                <div style={{ color: 'var(--gold)', marginTop: '4px' }}>+{q.creditReward} cr · +{q.repReward} rép</div>
                {q.dayMult && <div style={{ color: 'var(--orange)', marginTop: '2px' }}>⏱ Limite de temps</div>}
              </div>
            )}
          </div>
        )
      })}
      {/* Daily expenses */}
      {(() => {
        const breakdown = getDailyExpenseBreakdown(gs)
        const total = breakdown.reduce((s, b) => s + b.amount, 0)
        if (total <= 0) return null
        return (
          <div style={{ marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
            <div style={{ fontSize: '8px', letterSpacing: '2px', color: 'var(--red)', marginBottom: '4px' }}>DÉPENSES /JOUR : {total} cr</div>
            {breakdown.map(b => (
              <div key={b.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--dim)', lineHeight: 1.8 }}>
                <span>{b.label}</span>
                <span>−{b.amount}</span>
              </div>
            ))}
          </div>
        )
      })()}
    </div>

  </div>
  )
}

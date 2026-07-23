import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameState, PlayerClass, Screen, Enemy, CombatOutcome, Quest } from '../types'
import { CLASSES } from '../data/classes'
import { initCombat, processCombatAction, type CombatAction } from '../engine/combat'
import { getArenaEnemyForRound } from '../data/enemies'
import { initMultiCombat, processMultiAction, type MultiCombatAction } from '../engine/multiCombat'
import { checkObjectives } from '../engine/objectives'
import { checkQuestsOnArrival, completeQuest, generateChainQuest } from '../engine/quests'
import { checkMajorQuestAdvancement } from '../engine/majorQuests'
import { applyClassTravelEffects, rollTravelEvent, spendAction } from '../engine/travelEvents'
import { checkArcTriggers, ARC_DEFINITIONS, advanceArc } from '../engine/narrativeArcs'
import { maybeRivalEncounter } from '../engine/npcTracker'
import { checkStalkerTrigger, rollStalkerEvent, escalateStalker } from '../engine/stalker'
import { getArrivalSituation } from '../engine/arrivalSituations'
import { getStation } from '../data/stations'
import { rollWeaponForTier } from '../data/weapons'
import { tickWorldEvents } from '../engine/worldEvents'
import { applyMetaBonuses, buildRunSummary } from '../engine/meta'
import { useMetaStore } from './metaStore'
import { drawRunModifiers, getRunCombatCreditBonus, getRunCombatRepDelta, getRunLootMult, getRunTravelFuelExtra } from '../data/runModifiers'
import { drawRunObjective, getRunObjective } from '../data/runObjectives'
import { createChainEvent, shouldCreateChainEvent, type ChainEvent } from '../engine/chainEvents'
import { addJournal } from '../engine/journal'
import { resolveNexusWars, HOLDER_BOUNTY_HUNTERS, getSubBossKillConsequence } from '../engine/nexus'
import { arePillarSubBossesCleared } from '../data/subBosses'
import { shouldRaphazarusStrike, getRaphazarusWarrior } from '../engine/raphazarus'
import { getSubBossAtStation } from '../data/subBosses'
import { getDailyExpenses } from '../engine/expenses'

function buildInitialState(playerClass: PlayerClass): GameState {
  return {
    screen: 'station-hub',
    playerName: 'Joueur',
    class: playerClass,
    playerHp: playerClass.startHp,
    playerMaxHp: playerClass.startHp,
    stamina: playerClass.startStamina,
    maxStamina: playerClass.startStamina,
    credits: playerClass.startCredits,
    fuel: playerClass.startFuel,
    maxFuel: playerClass.maxFuel,
    shipHp: 100,
    shipMaxHp: 100,
    reputation: 0,
    day: 1,
    actionsToday: 0,
    currentStation: playerClass.startStation,
    visitedStations: [playerClass.startStation],
    weapons: [],
    armors: [],
    equippedWeapon: null,
    equippedArmor: null,
    cargo: playerClass.medicBonus
      ? { 'Médicaments': 4 }
      : { 'Médicaments': 2 },
    activeQuests: [],
    completedQuestIds: [],
    completedObjectives: [],
    faction: 'none',
    factionMissions: 0,
    isFactionLeader: false,
    isDoubleAgent: false,
    knownNpcs: {},
    npcsMet: [],
    activeArcs: [],
    completedArcs: [],
    bossesDefeated: 0,
    stationBossesBeaten: [],
    stationPiecesRallied: 0,
    interrogationsSurvived: 0,
    prisonEscapes: 0,
    zoneDepth: 0,
    lastExploreWasCombat: false,
    explorationFightsDone: 0,
    tournamentRound: 0,
    pendingFuelReward: 0,
    isImprisoned: false,
    prisonDaysLeft: 0,
    pendingInterrogation: null,
    isDead: false,
    deathCause: '',
    addictionLevel: 0,
    debtDailyAmount: playerClass.dailyDebt ?? 0,
    lastIncomeDay: 0,
    combatEnemy: null,
    combatState: null,
    pendingCombatOutcome: null,
    pendingMessage: null,
    multiCombatState: null,
    nexusFragments: [],
    nexusPath: {},
    nexusWars: [],
    nexusAngered: [],
    stalker: undefined,
    pendingArrival: false,
    pendingDaySummary: null,
    pillageBonusActive: false,
    moralTags: [],
    pastDecisions: [],
    pillarStanding: { cesarion: 0, raphazarus: 0, eliotis: 0, maxance: 0, alanossa: 0, scotty: 0 },
    totalCreditsEarned: playerClass.startCredits,
    combatsWon: 0,
    combatsFled: 0,
    combatRewardData: null,
    folieLevel: 0,
    folieConsumedThisTurn: false,
    majorQuests: [],
    activeWorldEvents: [],
    shipModules: { moteur: 0, soute: 0, tourelle: 0, scanner: 0 },
    factionReputation: { faucons: 0, emporium: 0, gardiens: 0, culte: 0 },
    runModifiers: [],
    runObjectiveId: null,
    runObjectiveCompleted: false,
    craftsPerformed: 0,
    discoveredLore: [],
    pendingChainEvents: [],
    pendingCombatArcId: null,
    journal: [],
    prisonConfiscatedItems: null,
    prisonEscapeFailures: 0,
    prisonCellmatePending: false,
    implantsBought: [],
    usedFreeRestStations: [],
    usedLocalActivities: [],
    pendingChainQuests: [],
    stationAlerts: {},
    stationPriceSeeds: Object.fromEntries(
      ['La Carcasse','Port Méridien','Les Bas-Fonds de Vega','Fort Kharos','Station Rocaille',
       'La Balise','Nexus Aldara','La Raffinerie','Station Fantôme','Colonie Perséphone',
       'Le Purgatoire','Confluent','La Citadelle Écarlate','Arc Ouest Apocalypse',
       'Paradoxa Eterna','Le Sanctuaire des Dérives','Fort Ossian','Bastion Mineur',
       'Poste Vigie',"L'Arc Perdu",'Station Quarantaine','Relais Noir','Relais de Transit',
       'Scotty Golden North','La Tribosphère'].map(n => [n, 0.75 + Math.random() * 0.5])
    ),
    subBossesDefeated: {},
    completedEquipmentQuests: [],
    arcPerduClues: [],
    bazarPurchases: {},
    bazarLastResetDay: 1,
  }
}

interface Store {
  gs: GameState | null
  travelEventMessage: string | null
  objectivePopup: string | null
  questCompletionMsg: string | null
  combatVictoryPending: boolean
  pendingVictoryData: { gs: GameState; objMsg: string | null } | null
  playerDeathPending: boolean
  pendingDeathCause: string | null
  resolveDeath: () => void
  selectClass: (c: PlayerClass, mods?: import('../data/runModifiers').RunModifier[], activeMetaIds?: string[]) => void
  goTo: (screen: Screen) => void
  travel: (station: string, fuelCost: number) => void
  startCombat: (enemy: Enemy) => void
  startMultiCombat: (enemies: Enemy[]) => void
  submitCombatAction: (action: CombatAction) => void
  submitMultiAction: (action: MultiCombatAction) => void
  resolveVictory: () => void
  equipWeapon: (index: number) => void
  unequipWeapon: () => void
  equipArmor: (index: number) => void
  unequipArmor: () => void
  buyCargo: (item: string, price: number) => void
  sellCargo: (item: string, price: number) => void
  buyFuel: (amount: number, priceEach: number) => void
  repairShip: (amount: number, priceEach: number) => void
  scroungeFuel: () => void
  addQuest: (quest: Quest) => void
  manualCompleteQuest: (questId: string) => void
  completeEscortQuest: (won: boolean) => void
  spendAction: () => void
  joinFaction: (factionId: string) => void
  collectNexusFragment: (index: number) => void
  setWaypoint: (name: string | null) => void
  patch: (partial: Partial<GameState>) => void
  advanceMajorQuests: () => void
  chainEventNotification: ChainEvent | null
  dismissTravelEvent: () => void
  dismissObjectivePopup: () => void
  dismissQuestCompletion: () => void
  dismissChainEvent: () => void
  rest: () => void
  newGame: () => void
  continueConquest: () => void
  worldEventPopup: import('../types').WorldEvent | null
  dismissWorldEventPopup: () => void
}

export const useGameStore = create<Store>()(persist((set, get) => ({
  gs: null,
  travelEventMessage: null,
  objectivePopup: null,
  questCompletionMsg: null,
  worldEventPopup: null,
  combatVictoryPending: false,
  pendingVictoryData: null,
  playerDeathPending: false,
  pendingDeathCause: null,

  resolveDeath: () => {
    const { gs, pendingDeathCause } = get()
    if (!gs) return
    const summary = buildRunSummary(gs, false)
    useMetaStore.getState().addRunSummary(summary)
    set({ gs: { ...gs, isDead: true, deathCause: pendingDeathCause ?? '', screen: 'game-over' }, playerDeathPending: false, pendingDeathCause: null })
  },

  selectClass: (c, mods_arg, activeMetaIds) => {
    const base = buildInitialState(c)
    const { meta } = useMetaStore.getState()
    const effectiveIds = activeMetaIds ?? meta.unlockedIds
    let gs = effectiveIds.length > 0 ? applyMetaBonuses(base, { ...meta, unlockedIds: effectiveIds }) : base
    // Tirage des modificateurs de run
    const mods = mods_arg ?? drawRunModifiers(2)
    gs = { ...gs, runModifiers: mods.map(m => m.id) }
    for (const mod of mods) gs = { ...gs, ...mod.apply(gs) }
    // Tirage de l'objectif secret
    const obj = drawRunObjective()
    gs = { ...gs, runObjectiveId: obj.id }
    set({ gs: { ...gs, screen: 'intro' as Screen } })
  },

  goTo: (screen) => set(s => s.gs ? { gs: { ...s.gs, screen, pendingCombatOutcome: null, pendingMessage: null } } : s),

  travel: (station, fuelCost) => {
    const { gs } = get()
    if (!gs) return

    const wear = Math.floor(Math.random() * 7) + 2
    const dailyCost = getDailyExpenses(gs)
    const daySummary = { prevDay: gs.day, actionsUsed: gs.actionsToday, station: gs.currentStation }
    let newGs: GameState = {
      ...gs,
      currentStation: station,
      fuel: Math.max(0, gs.fuel - fuelCost),
      shipHp: Math.max(1, gs.shipHp - wear),
      day: gs.day + 1,
      actionsToday: 0,
      credits: Math.max(0, gs.credits - dailyCost),
      zoneDepth: 0,
      explorationFightsDone: 0,
      tournamentRound: 0,
      usedLocalActivities: [],
      visitedStations: Array.from(new Set([...gs.visitedStations, station])),
      screen: 'station-arrival',
      pendingCombatOutcome: null,
      pendingMessage: null,
      pendingDaySummary: daySummary,
    }

    // Moteur Mk III — réduction carburant
    const moteurReduction = (newGs.shipModules?.moteur ?? 0) >= 3 ? 1 : 0
    if (moteurReduction > 0) {
      newGs = { ...newGs, fuel: newGs.fuel + moteurReduction }
    }
    // Modificateur Karma Négatif — +1 fuel/voyage
    const extraFuel = getRunTravelFuelExtra(newGs)
    if (extraFuel > 0) {
      newGs = { ...newGs, fuel: Math.max(0, newGs.fuel - extraFuel) }
    }

    // Événements mondiaux — expirer + déclencher
    const { gs: eventGs, newWorldEvent } = tickWorldEvents(newGs)
    newGs = eventGs

    // Effets de classe au voyage
    const classEffects = applyClassTravelEffects(newGs)
    newGs = { ...newGs, ...classEffects }

    // Folie : Accro + Cannibale
    let folieLevel = gs.folieLevel ?? 0
    if (gs.class.name === 'Accro') {
      const hadCredits = gs.credits >= (gs.class.travelCreditCost ?? 0)
      folieLevel = hadCredits ? Math.max(0, folieLevel - 10) : Math.min(100, folieLevel + 20)
    }
    if (gs.moralTags.includes('cannibal') && !gs.folieConsumedThisTurn) {
      folieLevel = Math.min(100, folieLevel + 20)
    }
    newGs = { ...newGs, folieLevel, folieConsumedThisTurn: false }

    // Événement de voyage
    const event = rollTravelEvent(newGs)
    let travelMsg: string | null = null
    if (event) {
      const result = event.effect(newGs)
      if (result.message === 'COMBAT_TRIGGER') {
        const pirate: Enemy = {
          name: 'Pirate spatial', isBoss: false, role: 'normal',
          maxHp: 40 + newGs.day * 2, damageMin: 8, damageMax: 20,
          lootMin: 300, lootMax: 900, captureChance: 15, killChance: 20,
          description: 'Attaque surprise depuis les débris.',
        }
        newGs = { ...newGs, combatEnemy: pirate, combatState: initCombat(pirate), screen: 'combat', stamina: newGs.maxStamina }
        travelMsg = `⚔ ${event.title} — Combat immédiat.`
      } else if (result.message === 'BOUNTY_TRIGGER') {
        const hunter: Enemy = {
          name: 'Chasseur de primes', isBoss: true, role: 'normal',
          maxHp: 85, damageMin: 15, damageMax: 30,
          lootMin: 600, lootMax: 1800, captureChance: 25, killChance: 15,
          description: 'Ta réputation t\'a précédé. Il t\'attendait.',
        }
        newGs = { ...newGs, combatEnemy: hunter, combatState: initCombat(hunter), screen: 'combat', stamina: newGs.maxStamina }
        travelMsg = `⚔ ${event.title} — Combat immédiat.`
      } else {
        travelMsg = result.message ?? event.description
        const { message: _m, ...rest } = result
        newGs = { ...newGs, ...rest }
      }
    }

    // Quêtes à l'arrivée
    const { completed } = checkQuestsOnArrival(newGs)
    const escortCompleted = completed.filter(q => q.type === 'escort')
    const nonEscortCompleted = completed.filter(q => q.type !== 'escort')
    for (const q of nonEscortCompleted) {
      newGs = { ...newGs, ...completeQuest(newGs, q) }
    }
    // Escorte → mini-jeu avant complétion
    if (escortCompleted.length > 0) {
      newGs = { ...newGs, pendingEscortQuestId: escortCompleted[0].id, screen: 'escort-minigame' }
    }
    // Quêtes simples complétées
    const simpleQuestLines = nonEscortCompleted.map(q => `★ ${q.title}\n+${q.creditReward.toLocaleString()} cr · +${q.repReward} rép`)

    // Avancement des quêtes majeures
    const { newGs: majorGs, messages: majorMsgs } = checkMajorQuestAdvancement(newGs)
    newGs = { ...newGs, ...majorGs }

    const allQuestLines = [...simpleQuestLines, ...majorMsgs]
    const questMsg = allQuestLines.length > 0 ? allQuestLines.join('\n\n') : null

    // Objectifs
    const { newGs: objGs, newlyCompleted } = checkObjectives(newGs)
    newGs = { ...newGs, ...objGs }
    const objMsg = newlyCompleted.length > 0
      ? `★ OBJECTIF : ${newlyCompleted.map(o => o.name).join(', ')}`
      : null

    // Arcs narratifs — déclencher de nouveaux arcs
    const newArcs = checkArcTriggers(newGs)
    if (newArcs.length > 0) {
      newGs = { ...newGs, activeArcs: [...newGs.activeArcs, ...newArcs] }
    }

    // Rival encounter — trigger combat si rencontre
    const rival = maybeRivalEncounter(newGs)
    if (rival.triggered && rival.rival) {
      const rivalEnemy = {
        name: rival.rival.name,
        maxHp: 55 + Math.min(80, Math.abs(rival.rival.repDelta) * 2),
        damageMin: 10, damageMax: 24,
        lootMin: 200, lootMax: 800,
        description: `Il se bat avec la rage de quelqu'un qui attendait longtemps.`,
        captureChance: 15, killChance: 20, isBoss: false, role: 'normal' as const,
      }
      newGs = { ...newGs, combatEnemy: rivalEnemy, combatState: initCombat(rivalEnemy), screen: 'combat', stamina: newGs.maxStamina }
      travelMsg = `RIVAL — ${rival.rival.name} t'attendait à l'arrivée.`
    }

    // Stalker — vérifier déclenchement ou événement
    const newStalker = checkStalkerTrigger(newGs)
    if (newStalker && !newGs.stalker) {
      newGs = { ...newGs, stalker: newStalker }
      travelMsg = (travelMsg ? travelMsg + ' | ' : '') + `⚠ Quelqu'un te suit. ${newStalker.name}.`
    } else if (newGs.stalker) {
      // Escalade : le stalker devient plus fort à chaque voyage
      const escalated = escalateStalker(newGs.stalker)
      const didEscalate = escalated.threatLevel > newGs.stalker.threatLevel
      newGs = { ...newGs, stalker: escalated }
      if (didEscalate) {
        travelMsg = (travelMsg ? travelMsg + ' | ' : '') + `⚠ ${escalated.name} — menace niveau ${escalated.threatLevel}. Il devient plus dangereux.`
      }
      const stalkerEvt = rollStalkerEvent(newGs, escalated)
      if (stalkerEvt) {
        travelMsg = (travelMsg ? travelMsg + ' | ' : '') + stalkerEvt.description
        if (stalkerEvt.newStalkerState) {
          newGs = { ...newGs, stalker: { ...newGs.stalker!, ...stalkerEvt.newStalkerState } }
        }
      }
    }

    // ── GUERRES ENTRE DÉTENTEURS — résolution après 4 jours ─────────────────
    if ((newGs.nexusWars ?? []).some(w => !w.resolved)) {
      const { gs: warGs, messages: warMsgs } = resolveNexusWars(newGs)
      if (Object.keys(warGs).length > 0) {
        newGs = { ...newGs, ...warGs }
        if (warMsgs.length > 0) travelMsg = (travelMsg ? travelMsg + ' | ' : '') + warMsgs[0]
      }
    }

    // ── BOUNTY HUNTERS DES DÉTENTEURS TRAHIS ─────────────────────────────────
    if ((newGs.nexusAngered ?? []).length > 0 && !newGs.stalker) {
      const angeredPillar = (newGs.nexusAngered ?? [])[Math.floor(Math.random() * (newGs.nexusAngered ?? []).length)]
      const bountyData = HOLDER_BOUNTY_HUNTERS[angeredPillar]
      if (bountyData && Math.random() < 0.25) {
        newGs = {
          ...newGs,
          stalker: {
            name: bountyData.name,
            station: newGs.currentStation,
            closingIn: true,
            daysSinceLastSeen: newGs.day,
            threatLevel: bountyData.threatLevel,
            daysActive: 0,
          },
        }
        travelMsg = (travelMsg ? travelMsg + ' | ' : '') + `⚠ ${bountyData.name} — ${bountyData.description}`
      }
    }

    // ── CONSÉQUENCES DE RÉPUTATION FACTION ───────────────────────────────────
    if (!newGs.stalker) {
      const fRep = newGs.factionReputation
      const hostileFactions: Array<{ faction: string; name: string }> = []
      if (fRep.faucons <= -70)  hostileFactions.push({ faction: 'faucons',  name: 'L\'Assassin des Faucons' })
      if (fRep.emporium <= -70) hostileFactions.push({ faction: 'emporium', name: 'L\'Exécuteur de l\'Emporium' })
      if (fRep.gardiens <= -70) hostileFactions.push({ faction: 'gardiens', name: 'Le Bras Armé des Gardiens' })
      if (fRep.culte <= -70)    hostileFactions.push({ faction: 'culte',    name: 'Le Serviteur du Vide' })
      if (hostileFactions.length > 0 && Math.random() < 0.20) {
        const chosen = hostileFactions[Math.floor(Math.random() * hostileFactions.length)]
        newGs = {
          ...newGs,
          stalker: {
            name: chosen.name,
            station: newGs.currentStation,
            closingIn: true,
            daysSinceLastSeen: newGs.day,
            threatLevel: 3,
            daysActive: 0,
          },
        }
        travelMsg = (travelMsg ? travelMsg + ' | ' : '') + `⚠ ${chosen.name} te traque — réputation ${chosen.faction} désastreuse.`
      }
    }

    // ── GUERRIERS DE RAPHAZARUS — il traque le porteur des fragments ─────────
    // Priorité sur les rencontres mineures : seulement si rien d'autre n'a déjà
    // saisi l'écran (combat/escorte). Surpuissant et de plus en plus fréquent.
    if (newGs.screen === 'station-arrival' && shouldRaphazarusStrike(newGs)) {
      const warrior = getRaphazarusWarrior(newGs)
      newGs = {
        ...newGs,
        combatEnemy: warrior,
        combatState: initCombat(warrior),
        screen: 'combat',
        stamina: newGs.maxStamina,
        pillarStanding: { ...newGs.pillarStanding, raphazarus: (newGs.pillarStanding?.raphazarus ?? 0) - 5 },
        journal: addJournal(newGs, `${warrior.name} m'a intercepté. Raphazarus a compris que je rassemble les fragments — et il a lâché ses guerriers.`, 'combat'),
      }
      travelMsg = (travelMsg ? travelMsg + ' | ' : '') + `☠ ${warrior.name} — Raphazarus a lancé ses guerriers à tes trousses.`
    }

    // Situation d'arrivée (40% de chance)
    const arrival = getArrivalSituation(newGs)
    if (arrival && newGs.screen === 'station-arrival') {
      newGs = { ...newGs, pendingArrival: true, pendingMessage: arrival.title }
    }

    // ── CHAIN EVENTS — créer selon conditions ────────────────────────────────
    let pendingChain = [...(newGs.pendingChainEvents ?? [])]

    if (newGs.reputation <= -40 && shouldCreateChainEvent('low_rep', newGs)) {
      const evt = createChainEvent('low_rep', newGs)
      if (evt) pendingChain.push(evt)
    }
    if (newGs.credits >= 10000 && shouldCreateChainEvent('rich', newGs)) {
      const evt = createChainEvent('rich', newGs)
      if (evt) pendingChain.push(evt)
    }
    if ((newGs.factionMissions ?? 0) >= 5 && newGs.faction !== 'none' && shouldCreateChainEvent('faction_loyal', newGs)) {
      const evt = createChainEvent('faction_loyal', newGs)
      if (evt) pendingChain.push(evt)
    }

    // ── CHAIN EVENTS — déclencher les events prêts ───────────────────────────
    const readyIdx = pendingChain.findIndex(e => newGs.day >= e.triggerDay)
    let chainNotif: ChainEvent | null = null
    if (readyIdx >= 0) {
      chainNotif = pendingChain[readyIdx]
      pendingChain.splice(readyIdx, 1)
      if (chainNotif.effect) {
        const eff = chainNotif.effect
        if (eff.credits)     newGs = { ...newGs, credits: newGs.credits + eff.credits }
        if (eff.reputation)  newGs = { ...newGs, reputation: newGs.reputation + eff.reputation }
        if (eff.fuel)        newGs = { ...newGs, fuel: Math.min(newGs.maxFuel, newGs.fuel + eff.fuel) }
        if (eff.cargo) {
          const maxCargo = 15 + (newGs.shipModules?.soute ?? 0) * 5
          const newCargo = { ...newGs.cargo }
          for (const [item, qty] of Object.entries(eff.cargo)) {
            const current = Object.values(newCargo).reduce((a, b) => a + b, 0)
            const canAdd = Math.max(0, maxCargo - current)
            if (canAdd > 0) newCargo[item] = (newCargo[item] ?? 0) + Math.min(qty, canAdd)
          }
          newGs = { ...newGs, cargo: newCargo }
        }
      }
    }
    newGs = { ...newGs, pendingChainEvents: pendingChain }

    // Journal — entrée de voyage
    const travelJournal = addJournal(gs, `J'ai quitté ${gs.currentStation} en direction de ${station}.`, 'travel')
    newGs = { ...newGs, journal: travelJournal }

    set({ gs: newGs, travelEventMessage: travelMsg, objectivePopup: objMsg, questCompletionMsg: questMsg, ...(chainNotif ? { chainEventNotification: chainNotif } : {}), ...(newWorldEvent ? { worldEventPopup: newWorldEvent } : {}) })
  },

  startCombat: (enemy) => set(s => {
    if (!s.gs) return s
    const cs = initCombat(enemy)
    const momentumStart = s.gs.class.combatMomentumStart ?? 0
    return {
      gs: {
        ...s.gs,
        combatEnemy: enemy,
        combatState: { ...cs, momentum: momentumStart },
        stamina: s.gs.maxStamina,
        pendingCombatOutcome: null,
        combatRewardData: null,
        screen: 'combat',
      }
    }
  }),

  startMultiCombat: (enemies) => set(s => {
    if (!s.gs) return s
    return {
      gs: {
        ...s.gs,
        multiCombatState: initMultiCombat(enemies),
        stamina: s.gs.maxStamina,
        pendingCombatOutcome: null,
        screen: 'multi-combat' as Screen,
      }
    }
  }),

  submitMultiAction: (action) => {
    const { gs } = get()
    if (!gs || !gs.multiCombatState) return
    const result = processMultiAction(gs, gs.multiCombatState, action)
    const merged: GameState = { ...gs, ...result.newGs }
    if (result.outcome) {
      handleMultiCombatOutcome(result.outcome, merged, result.newMcs, set)
    } else {
      set({ gs: { ...merged, multiCombatState: result.newMcs } })
    }
  },

  scroungeFuel: () => set(s => {
    if (!s.gs) return s
    const station = getStation(s.gs.currentStation)
    const chance = station.danger >= 2 ? 0.60 : station.danger >= 1 ? 0.45 : 0.30
    const found = Math.random() < chance
    const amount = found ? (Math.random() < 0.3 ? 2 : 1) : 0
    const gs = s.gs
    const changes = spendAction(gs)
    return {
      gs: {
        ...gs,
        ...changes,
        fuel: Math.min(gs.maxFuel, gs.fuel + amount),
        pendingMessage: found
          ? `Carburant trouvé ! +${amount} unité${amount > 1 ? 's' : ''}.`
          : 'Rien trouvé cette fois. Les réserves sont sèches.',
      }
    }
  }),

  collectNexusFragment: (index) => set(s => {
    if (!s.gs) return s
    const fragments = [...(s.gs.nexusFragments ?? []), index]
    const rallied = fragments.length
    let newGs = { ...s.gs, nexusFragments: fragments, stationPiecesRallied: rallied }
    if (index !== 2 && !newGs.raphazarusActivated) {
      newGs = { ...newGs, raphazarusActivated: true }
    }
    if (rallied >= 4) {
      newGs = { ...newGs, screen: 'victory' as Screen }
      const summary = buildRunSummary(newGs, true)
      useMetaStore.getState().addRunSummary(summary)
    }
    const { newGs: objGs } = checkObjectives(newGs)
    return { gs: { ...newGs, ...objGs, multiCombatState: newGs.multiCombatState } }
  }),

  submitCombatAction: (action) => {
    const { gs } = get()
    if (!gs || !gs.combatEnemy || !gs.combatState) return

    const result = processCombatAction(gs, gs.combatState, gs.combatEnemy, action)
    const merged: GameState = { ...gs, ...result.newGs }

    if (result.outcome) {
      handleCombatOutcome(result.outcome, merged, result.newCs, set, result.reward)
    } else {
      set({ gs: { ...merged, combatState: { ...gs.combatState, ...result.newCs, log: result.newCs.log } } })
    }
  },

  equipWeapon: (index) => set(s => {
    if (!s.gs) return s
    return { gs: { ...s.gs, equippedWeapon: s.gs.weapons[index] } }
  }),

  unequipWeapon: () => set(s => s.gs ? { gs: { ...s.gs, equippedWeapon: null } } : s),

  equipArmor: (index) => set(s => {
    if (!s.gs) return s
    const a = s.gs.armors[index]
    const prev = s.gs.equippedArmor
    const hpDiff = a.hpBonus - (prev?.hpBonus ?? 0)
    const newMaxHp = s.gs.playerMaxHp + hpDiff
    return {
      gs: {
        ...s.gs,
        equippedArmor: a,
        playerMaxHp: newMaxHp,
        playerHp: Math.min(s.gs.playerHp, newMaxHp),
      }
    }
  }),

  unequipArmor: () => set(s => {
    if (!s.gs) return s
    const bonus = s.gs.equippedArmor?.hpBonus ?? 0
    return {
      gs: {
        ...s.gs,
        equippedArmor: null,
        playerMaxHp: s.gs.playerMaxHp - bonus,
        playerHp: Math.min(s.gs.playerHp, s.gs.playerMaxHp - bonus),
      }
    }
  }),


  buyCargo: (item, price) => set(s => {
    if (!s.gs || s.gs.credits < price) return s
    if (s.gs.class.cannotBuyWeapons && item.toLowerCase().includes('arme')) return s
    const maxCargo = 15 + (s.gs.shipModules?.soute ?? 0) * 5
    const totalItems = Object.values(s.gs.cargo).reduce((a, b) => a + b, 0)
    if (totalItems >= maxCargo) return s
    // Limites par item (protection anti-abus)
    const CARGO_MAX: Record<string, number> = {
      'Implants': 2, 'Implants militaires': 2,
      'Médicaments premium': 4, 'Or': 5,
      'Cristaux énergétiques': 6, 'Métaux rares': 8,
      'Technologies avancées': 4, 'Composants expérimentaux': 4,
      'Données classifiées': 5,
    }
    const itemMax = CARGO_MAX[item]
    if (itemMax !== undefined && (s.gs.cargo[item] ?? 0) >= itemMax) return s
    const cargo = { ...s.gs.cargo, [item]: (s.gs.cargo[item] ?? 0) + 1 }
    return { gs: { ...s.gs, credits: s.gs.credits - price, cargo } }
  }),

  sellCargo: (item, price) => set(s => {
    if (!s.gs || !s.gs.cargo[item]) return s
    const cargo = { ...s.gs.cargo, [item]: s.gs.cargo[item] - 1 }
    if (cargo[item] === 0) delete cargo[item]
    const medBonus = s.gs.class.medicBonus && item === 'Médicaments' ? Math.floor(price * 0.5) : 0
    return { gs: { ...s.gs, credits: s.gs.credits + price + medBonus, cargo } }
  }),

  buyFuel: (amount, priceEach) => set(s => {
    if (!s.gs) return s
    const total = amount * priceEach
    if (s.gs.credits < total) return s
    return { gs: { ...s.gs, credits: s.gs.credits - total, fuel: Math.min(s.gs.maxFuel, s.gs.fuel + amount) } }
  }),

  repairShip: (amount, priceEach) => set(s => {
    if (!s.gs) return s
    const total = amount * priceEach
    if (s.gs.credits < total) return s
    return { gs: { ...s.gs, credits: s.gs.credits - total, shipHp: Math.min(s.gs.shipMaxHp, s.gs.shipHp + amount) } }
  }),

  addQuest: (quest) => set(s => {
    if (!s.gs) return s
    if (s.gs.activeQuests.length >= 5) return s
    const cargoUpdate = quest.type === 'escort'
      ? { cargo: { ...s.gs.cargo, 'Passager': (s.gs.cargo['Passager'] ?? 0) + 1 } }
      : {}
    return { gs: { ...s.gs, activeQuests: [...s.gs.activeQuests, quest], ...cargoUpdate } }
  }),

  manualCompleteQuest: (questId) => {
    const { gs } = get()
    if (!gs) return
    const quest = gs.activeQuests.find(q => q.id === questId)
    if (!quest) return
    let newGs = { ...gs, ...completeQuest(gs, quest) }
    const chain = generateChainQuest(quest, newGs)
    if (chain) {
      newGs = { ...newGs, pendingChainQuests: [...(newGs.pendingChainQuests ?? []), chain] }
    }
    const { newGs: objGs, newlyCompleted } = checkObjectives(newGs)
    newGs = { ...newGs, ...objGs }
    const objMsg = newlyCompleted.length > 0 ? `★ OBJECTIF : ${newlyCompleted.map(o => o.name).join(', ')}` : null
    const questMsg = `★ ${quest.title}\n+${quest.creditReward.toLocaleString()} cr · +${quest.repReward} rép${chain ? '\n📋 Suite disponible — voir Chercher du travail' : ''}`
    set({ gs: newGs, objectivePopup: objMsg, questCompletionMsg: questMsg })
  },

  completeEscortQuest: (won) => {
    const { gs } = get()
    if (!gs) return
    const quest = gs.activeQuests.find(q => q.id === gs.pendingEscortQuestId)
    if (!quest) {
      set(s => s.gs ? { gs: { ...s.gs, pendingEscortQuestId: undefined, screen: 'station-hub' as Screen } } : s)
      return
    }
    if (won) {
      let newGs = { ...gs, ...completeQuest(gs, quest), pendingEscortQuestId: undefined, screen: 'station-hub' as Screen }
      const chain = generateChainQuest(quest, newGs)
      if (chain) newGs = { ...newGs, pendingChainQuests: [...(newGs.pendingChainQuests ?? []), chain] }
      const { newGs: objGs, newlyCompleted } = checkObjectives(newGs)
      newGs = { ...newGs, ...objGs }
      const objMsg = newlyCompleted.length > 0 ? `★ OBJECTIF : ${newlyCompleted.map(o => o.name).join(', ')}` : null
      const questMsg = `★ ${quest.title}\n+${quest.creditReward.toLocaleString()} cr · +${quest.repReward} rép`
      set({ gs: newGs, objectivePopup: objMsg, questCompletionMsg: questMsg })
    } else {
      const newCargo = { ...gs.cargo }
      const cur = newCargo['Passager'] ?? 0
      if (cur <= 1) delete newCargo['Passager']
      else newCargo['Passager'] = cur - 1
      const newGs: GameState = {
        ...gs,
        cargo: newCargo,
        activeQuests: gs.activeQuests.filter(q => q.id !== quest.id),
        shipHp: Math.max(1, gs.shipHp - 20),
        pendingEscortQuestId: undefined,
        screen: 'station-hub' as Screen,
        pendingMessage: '✕ Passager perdu. −20 PV de vaisseau.',
      }
      set({ gs: newGs })
    }
  },

  spendAction: () => set(s => {
    if (!s.gs) return s
    const changes = spendAction(s.gs)
    return { gs: { ...s.gs, ...changes } }
  }),

  joinFaction: (factionId) => set(s => {
    if (!s.gs) return s
    const withFaction = { ...s.gs, faction: factionId as GameState['faction'] }
    const { newGs: majorGs } = checkMajorQuestAdvancement(withFaction)
    return { gs: { ...withFaction, ...majorGs } }
  }),

  setWaypoint: (name) => set(s => s.gs ? { gs: { ...s.gs, waypoint: name ?? undefined } } : s),
  patch: (partial) => set(s => s.gs ? { gs: { ...s.gs, ...partial } } : s),

  chainEventNotification: null,
  dismissTravelEvent: () => set({ travelEventMessage: null }),
  dismissObjectivePopup: () => set({ objectivePopup: null }),
  dismissWorldEventPopup: () => set({ worldEventPopup: null }),
  dismissQuestCompletion: () => set({ questCompletionMsg: null }),
  dismissChainEvent: () => set({ chainEventNotification: null }),

  rest: () => set(s => {
    if (!s.gs) return s
    let debt = 0
    if (s.gs.class.dailyDebt) debt = s.gs.class.dailyDebt
    const dailyCost = getDailyExpenses(s.gs)
    const dayGs = {
      ...s.gs,
      playerHp: s.gs.playerMaxHp,
      stamina: s.gs.maxStamina,
      day: s.gs.day + 1,
      actionsToday: 0,
      credits: Math.max(0, s.gs.credits - debt - dailyCost),
    }
    const { gs: tickedGs } = tickWorldEvents(dayGs)
    return { gs: tickedGs }
  }),

  resolveVictory: () => {
    const { pendingVictoryData } = get()
    if (!pendingVictoryData) return
    set({
      gs: pendingVictoryData.gs,
      objectivePopup: pendingVictoryData.objMsg,
      combatVictoryPending: false,
      pendingVictoryData: null,
    })
  },

  advanceMajorQuests: () => {
    const { gs } = get()
    if (!gs) return
    const { newGs, messages } = checkMajorQuestAdvancement(gs)
    if (messages.length > 0 || Object.keys(newGs).some(k => k === 'majorQuests')) {
      set(s => s.gs ? { gs: { ...s.gs, ...newGs } } : s)
    }
  },

  newGame: () => set({ gs: null, travelEventMessage: null, objectivePopup: null, worldEventPopup: null, combatVictoryPending: false, pendingVictoryData: null, playerDeathPending: false, pendingDeathCause: null, chainEventNotification: null }),

  // Après la victoire, reprendre la partie en mode conquête (continuer à jouer).
  continueConquest: () => set(s => s.gs ? {
    gs: {
      ...s.gs,
      conquestMode: true,
      screen: 'station-hub' as Screen,
      pendingCombatOutcome: null,
      pendingMessage: 'CONQUÊTE — Le Nexus est restauré, mais l\'espace reste à conquérir. Accomplis tous les objectifs et termine ce que tu as commencé.',
    },
  } : s),
}), {
  name: 'snipeweb-save',
  partialize: (state) => ({ gs: state.gs }),
}))

function handleCombatOutcome(
  outcome: CombatOutcome,
  gs: GameState,
  cs: ReturnType<typeof initCombat>,
  set: (partial: Partial<Store>) => void,
  reward?: { loot: number; weaponName?: string; armorName?: string; isBossKill: boolean }
) {
  let newGs = { ...gs, combatState: cs }

  // ── TOURNOI : victoire en round intermédiaire ou finale ──────────────────
  if (outcome === 'victory' && gs.tournamentRound > 0) {
    if (gs.tournamentRound < 10) {
      const nextRound = gs.tournamentRound + 1
      const nextEnemy = getArenaEnemyForRound(nextRound)
      const nextCs = initCombat(nextEnemy)
      const momentumStart = gs.class.combatMomentumStart ?? 0
      const healedHp = Math.min(gs.playerMaxHp, gs.playerHp + 50)
      const nextGs: GameState = {
        ...gs,
        tournamentRound: nextRound,
        playerHp: healedHp,
        stamina: gs.maxStamina,
        combatEnemy: nextEnemy,
        combatState: { ...nextCs, momentum: momentumStart },
        pendingCombatOutcome: null,
        combatRewardData: null,
        screen: 'combat',
      }
      const dyingGs = { ...gs, combatState: { ...cs, enemyHp: 0 }, pendingCombatOutcome: null }
      const interMsg = `TOURNOI — ROUND ${nextRound}/10  |  +50 PV récupérés. Stamina pleine.`
      set({ gs: dyingGs, combatVictoryPending: true, pendingVictoryData: { gs: nextGs, objMsg: interMsg } })
    } else {
      // Round 10 terminé — victoire du tournoi
      const loot = 12000 + gs.reputation * 15
      const w = rollWeaponForTier(5)
      const finalGs: GameState = {
        ...gs,
        tournamentRound: 0,
        credits: gs.credits + loot,
        reputation: gs.reputation + 60,
        combatsWon: (gs.combatsWon ?? 0) + 1,
        weapons: [...gs.weapons, w],
        combatRewardData: { loot, weaponName: w.name, isBossKill: true },
        screen: 'combat-result' as Screen,
      }
      const dyingGs = { ...gs, combatState: { ...cs, enemyHp: 0 }, pendingCombatOutcome: null }
      const winMsg = `TOURNOI COMPLÉTÉ ! +${loot} cr, +60 réputation, arme légendaire : ${w.name}`
      set({ gs: dyingGs, combatVictoryPending: true, pendingVictoryData: { gs: finalGs, objMsg: winMsg } })
    }
    return
  }

  if (outcome === 'victory') {
    const beaten = gs.stationBossesBeaten.includes(gs.currentStation)
      ? gs.stationBossesBeaten
      : [...gs.stationBossesBeaten, gs.currentStation]
    newGs = {
      ...newGs,
      combatsWon: (gs.combatsWon ?? 0) + 1,
      stationBossesBeaten: beaten,
      combatRewardData: reward ?? null,
      screen: 'combat-result' as Screen,
    }
    // Modificateurs de run au combat
    const runCreditBonus = getRunCombatCreditBonus(gs)
    const lootBonus = Math.floor((reward?.loot ?? 0) * (getRunLootMult(gs) - 1))
    const runRepDelta = getRunCombatRepDelta(gs)
    if (runCreditBonus + lootBonus !== 0 || runRepDelta !== 0) {
      newGs = { ...newGs, credits: newGs.credits + runCreditBonus + lootBonus, reputation: newGs.reputation + runRepDelta }
    }
    if (gs.pendingFuelReward > 0) {
      newGs = { ...newGs, fuel: Math.min(gs.maxFuel, gs.fuel + gs.pendingFuelReward), pendingFuelReward: 0 }
    }
    // Vérifier objectif de run
    // Stalker tué au combat
    if (gs.stalker && gs.combatEnemy?.name === gs.stalker.name) {
      newGs = { ...newGs, stalker: undefined }
      const evt = createChainEvent('stalker_killed', newGs)
      if (evt) newGs = { ...newGs, pendingChainEvents: [...(newGs.pendingChainEvents ?? []), evt] }
    }
    // Boss tué — créer un chain event
    if (reward?.isBossKill && shouldCreateChainEvent('boss_killed', newGs)) {
      const evt = createChainEvent('boss_killed', newGs)
      if (evt) newGs = { ...newGs, pendingChainEvents: [...(newGs.pendingChainEvents ?? []), evt] }
    }
    const runObjId = newGs.runObjectiveId
    if (runObjId && !newGs.runObjectiveCompleted) {
      const runObj = getRunObjective(runObjId)
      if (runObj?.check(newGs)) newGs = { ...newGs, runObjectiveCompleted: true }
    }
    // Compléter les quêtes de combat (vengeance, kill, bounty, sabotage) après victoire
    const { completed: combatQuests } = checkQuestsOnArrival(newGs)
    for (const q of combatQuests) {
      newGs = { ...newGs, ...completeQuest(newGs, q) }
      const chain = generateChainQuest(q, newGs)
      if (chain) newGs = { ...newGs, pendingChainQuests: [...(newGs.pendingChainQuests ?? []), chain] }
    }
    const { newGs: objGs, newlyCompleted } = checkObjectives(newGs)
    const { newGs: majorGs, messages: majorMsgs } = checkMajorQuestAdvancement(newGs)
    newGs = { ...newGs, ...objGs, ...majorGs, combatState: cs, combatRewardData: reward ?? null, screen: 'combat-result' as Screen }
    const objMsg = [
      gs.pendingFuelReward > 0 ? `⛽ +${gs.pendingFuelReward} carburant récupéré de force.` : null,
      newlyCompleted.length > 0 ? `★ ${newlyCompleted.map(o => o.name).join(', ')}` : null,
      ...majorMsgs,
      ...combatQuests.map(q => `★ ${q.title} — +${q.creditReward.toLocaleString()} cr, +${q.repReward} rép`),
    ].filter(Boolean).join('\n') || null
    // Journal — victoire au combat
    const enemyName = gs.combatEnemy?.name ?? 'un ennemi'
    const isBoss = reward?.isBossKill
    const victoryText = isBoss
      ? `J'ai vaincu ${enemyName} à ${gs.currentStation}. Un adversaire qui méritait le respect.`
      : `J'ai vaincu ${enemyName} à ${gs.currentStation}.`
    newGs = { ...newGs, journal: addJournal(gs, victoryText, 'combat') }
    // Sub-boss vaincu au combat
    let subBossMsg: string | null = null
    if (gs.combatEnemy?.isSubBoss) {
      const sb = getSubBossAtStation(gs.currentStation)
      if (sb && sb.enemy.name === gs.combatEnemy.name) {
        const defeated = { ...(newGs.subBossesDefeated ?? {}) }
        defeated[sb.pillar] = [...(defeated[sb.pillar] ?? []), sb.id]
        newGs = { ...newGs, subBossesDefeated: defeated }
        if (sb.reward.type === 'credits') {
          newGs = { ...newGs, credits: newGs.credits + (sb.reward.value as number) }
        } else if (sb.reward.type === 'rep') {
          newGs = { ...newGs, reputation: newGs.reputation + (sb.reward.value as number) }
        }
        // Conséquences : on attire l'attention du boss du pilier (ralliements/discussions)
        const fullyCleared = arePillarSubBossesCleared(defeated, sb.pillar)
        const cons = getSubBossKillConsequence(newGs, sb.pillar, fullyCleared)
        newGs = {
          ...newGs,
          pillarStanding: cons.patch.pillarStanding ?? newGs.pillarStanding,
          pastDecisions: cons.patch.pastDecisions ?? newGs.pastDecisions,
        }
        subBossMsg = cons.message
      }
    }
    // Arc narratif en attente de victoire au combat
    if (newGs.pendingCombatArcId) {
      const arcId = newGs.pendingCombatArcId
      const pendingArc = newGs.activeArcs?.find(a => a.id === arcId)
      const arcDef = ARC_DEFINITIONS.find(d => d.id === arcId)
      if (pendingArc && arcDef) {
        const { arc: advancedArc, rewardGs, completed } = advanceArc(pendingArc, newGs)
        const otherArcs = (newGs.activeArcs ?? []).filter(a => a.id !== arcId)
        if (completed) {
          newGs = {
            ...newGs,
            ...(rewardGs ?? {}),
            activeArcs: otherArcs,
            completedArcs: [...(newGs.completedArcs ?? []), arcId],
            pendingCombatArcId: null,
          }
        } else {
          newGs = { ...newGs, activeArcs: [...otherArcs, advancedArc], pendingCombatArcId: null }
        }
      } else {
        newGs = { ...newGs, pendingCombatArcId: null }
      }
    }
    // Fragment Nexus en attente (méthode "force") — collecter après la victoire
    const nxPath = newGs.nexusPath ?? {}
    const nxFragments = newGs.nexusFragments ?? []
    const pendingNxEntry = Object.entries(nxPath).find(
      ([idxStr, method]) => method === 'force' && !nxFragments.includes(Number(idxStr))
    )
    if (pendingNxEntry) {
      const nxIdx = Number(pendingNxEntry[0])
      const newFragments = [...nxFragments, nxIdx]
      newGs = { ...newGs, nexusFragments: newFragments, stationPiecesRallied: newFragments.length }
      if (newFragments.length >= 4) {
        const summary = buildRunSummary(newGs, true)
        useMetaStore.getState().addRunSummary(summary)
        newGs = { ...newGs, screen: 'victory' as Screen }
      }
    }
    // Montrer d'abord l'ennemi à 0 PV, puis transition différée vers combat-result
    const dyingGs = { ...gs, combatState: { ...cs, enemyHp: 0 }, pendingCombatOutcome: null }
    const finalObjMsg = [objMsg, subBossMsg].filter(Boolean).join('\n') || null
    set({ gs: dyingGs, combatVictoryPending: true, pendingVictoryData: { gs: newGs, objMsg: finalObjMsg } })
  } else if (outcome === 'fled') {
    const fledGs = {
      ...newGs,
      combatsFled: (gs.combatsFled ?? 0) + 1,
      pendingCombatOutcome: 'fled' as CombatOutcome,
      screen: 'combat-outcome' as Screen,
      journal: addJournal(gs, `J'ai fui le combat contre ${gs.combatEnemy?.name ?? 'un ennemi'} à ${gs.currentStation}. Survivre, c'est aussi gagner.`, 'combat'),
    }
    set({ gs: fledGs })
  } else if (outcome === 'dead') {
    // Meta unlock : Dernier souffle — survit une fois à un coup mortel
    if (gs.lethalSurviveAvailable) {
      const surviveLog = { id: Date.now(), text: '★ DERNIER SOUFFLE — Tu survis à 1 PV. Cela ne se reproduira pas.', type: 'player' as const }
      const surviveCs = { ...cs, log: [...cs.log, surviveLog] }
      set({ gs: { ...newGs, playerHp: 1, lethalSurviveAvailable: false, combatState: surviveCs, pendingCombatOutcome: null } })
      return
    }
    const deathCause = `Vaincu au combat contre ${gs.combatEnemy?.name ?? 'un ennemi'}.`
    const deathLog = { id: Date.now(), text: 'Vous êtes mort.', type: 'enemy' as const }
    const dyingCs = { ...cs, log: [deathLog] }
    set({ gs: { ...newGs, combatState: dyingCs }, playerDeathPending: true, pendingDeathCause: deathCause })
  } else if (outcome === 'captured') {
    const creditsFine    = Math.floor(gs.credits * 0.25)
    const weaponSeized   = !!gs.equippedWeapon && Math.random() < 0.45
    const cargoSeized    = Object.keys(gs.cargo).filter(k => k !== 'Médicaments')
    const captureInfo    = JSON.stringify({ creditsFine, weaponName: weaponSeized ? gs.equippedWeapon?.name ?? null : null, cargoLost: cargoSeized.length })
    const newCargo       = { ...gs.cargo }
    for (const k of cargoSeized) delete newCargo[k]
    set({ gs: { ...newGs, isImprisoned: true, prisonDaysLeft: 3, pendingCombatOutcome: 'captured', screen: 'combat-outcome' as Screen,
      credits: Math.max(0, gs.credits - creditsFine),
      cargo: newCargo,
      equippedWeapon: weaponSeized ? null : gs.equippedWeapon,
      pendingMessage: captureInfo,
      journal: addJournal(gs, `J'ai été capturé après le combat contre ${gs.combatEnemy?.name ?? 'un ennemi'} à ${gs.currentStation}. 3 jours derrière les barreaux.`, 'prison'),
    }})
  } else if (outcome === 'stunned') {
    const creditsLost = Math.floor(Math.random() * 400 + 200)
    set({
      gs: {
        ...newGs,
        playerHp: Math.max(1, Math.floor(gs.playerMaxHp / 4)),
        credits: Math.max(0, gs.credits - creditsLost),
        pendingCombatOutcome: 'stunned',
        pendingMessage: String(creditsLost),
        screen: 'combat-outcome' as Screen,
      }
    })
  }
}

function handleMultiCombatOutcome(
  outcome: CombatOutcome,
  gs: GameState,
  mcs: ReturnType<typeof initMultiCombat>,
  set: (partial: Partial<Store>) => void
) {
  if (outcome === 'victory') {
    let newGs = { ...gs, multiCombatState: mcs, combatsWon: (gs.combatsWon ?? 0) + 1, pendingCombatOutcome: 'victory' as CombatOutcome, screen: 'station-hub' as Screen }
    const { newGs: objGs, newlyCompleted } = checkObjectives(newGs)
    newGs = { ...newGs, ...objGs, multiCombatState: mcs, pendingCombatOutcome: 'victory' as CombatOutcome }
    const objMsg = newlyCompleted.length > 0 ? `★ ${newlyCompleted.map(o => o.name).join(', ')}` : null
    set({ gs: newGs, objectivePopup: objMsg })
  } else if (outcome === 'fled') {
    set({ gs: { ...gs, multiCombatState: mcs, combatsFled: (gs.combatsFled ?? 0) + 1, pendingCombatOutcome: 'fled', screen: 'station-hub' } })
  } else if (outcome === 'dead') {
    const summary = buildRunSummary(gs, false)
    useMetaStore.getState().addRunSummary(summary)
    set({ gs: { ...gs, isDead: true, deathCause: 'Trop nombreux. Tu n\'as pas survécu.', screen: 'game-over' } })
  } else if (outcome === 'captured') {
    set({ gs: { ...gs, multiCombatState: mcs, isImprisoned: true, prisonDaysLeft: 3, screen: 'prison' } })
  } else if (outcome === 'stunned') {
    set({ gs: { ...gs, multiCombatState: mcs, playerHp: Math.max(1, Math.floor(gs.playerMaxHp / 4)), credits: Math.max(0, gs.credits - Math.floor(Math.random() * 400 + 200)), pendingCombatOutcome: 'stunned', screen: 'station-hub' } })
  }
}

export const AVAILABLE_CLASSES = CLASSES

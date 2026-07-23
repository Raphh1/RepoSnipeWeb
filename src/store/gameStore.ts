import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameState, PlayerClass, Screen, Enemy, CombatOutcome, Quest } from '../types'
import { CLASSES } from '../data/classes'
import { initCombat, processCombatAction, type CombatAction } from '../engine/combat'
import { initMultiCombat, processMultiAction, type MultiCombatAction } from '../engine/multiCombat'
import { checkObjectives } from '../engine/objectives'
import { checkQuestsOnArrival, completeQuest } from '../engine/quests'
import { checkMajorQuestAdvancement } from '../engine/majorQuests'
import { applyClassTravelEffects, rollTravelEvent, spendAction } from '../engine/travelEvents'
import { checkArcTriggers } from '../engine/narrativeArcs'
import { maybeRivalEncounter } from '../engine/npcTracker'
import { checkStalkerTrigger, rollStalkerEvent } from '../engine/stalker'
import { getArrivalSituation } from '../engine/arrivalSituations'
import { getStation } from '../data/stations'

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
    isImprisoned: false,
    prisonDaysLeft: 0,
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
    stalker: undefined,
    pendingArrival: false,
    moralTags: [],
    totalCreditsEarned: playerClass.startCredits,
    combatsWon: 0,
    combatsFled: 0,
    combatRewardData: null,
    folieLevel: 0,
    folieConsumedThisTurn: false,
    majorQuests: [],
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
  selectClass: (c: PlayerClass) => void
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
  spendAction: () => void
  joinFaction: (factionId: string) => void
  collectNexusFragment: (index: number) => void
  patch: (partial: Partial<GameState>) => void
  advanceMajorQuests: () => void
  dismissTravelEvent: () => void
  dismissObjectivePopup: () => void
  dismissQuestCompletion: () => void
  rest: () => void
  newGame: () => void
}

export const useGameStore = create<Store>()(persist((set, get) => ({
  gs: null,
  travelEventMessage: null,
  objectivePopup: null,
  questCompletionMsg: null,
  combatVictoryPending: false,
  pendingVictoryData: null,
  playerDeathPending: false,
  pendingDeathCause: null,

  resolveDeath: () => {
    const { gs, pendingDeathCause } = get()
    if (!gs) return
    set({ gs: { ...gs, isDead: true, deathCause: pendingDeathCause ?? '', screen: 'game-over' }, playerDeathPending: false, pendingDeathCause: null })
  },

  selectClass: (c) => set({ gs: buildInitialState(c) }),

  goTo: (screen) => set(s => s.gs ? { gs: { ...s.gs, screen, pendingCombatOutcome: null, pendingMessage: null } } : s),

  travel: (station, fuelCost) => {
    const { gs } = get()
    if (!gs) return

    const wear = Math.floor(Math.random() * 7) + 2
    let newGs: GameState = {
      ...gs,
      currentStation: station,
      fuel: gs.fuel - fuelCost,
      shipHp: Math.max(1, gs.shipHp - wear),
      day: gs.day + 1,
      actionsToday: 0,
      zoneDepth: 0,
      visitedStations: Array.from(new Set([...gs.visitedStations, station])),
      screen: 'station-arrival',
      pendingCombatOutcome: null,
      pendingMessage: null,
    }

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
      travelMsg = result.message ?? event.description
      if (result.message !== 'COMBAT_TRIGGER' && result.message !== 'BOUNTY_TRIGGER') {
        const { message: _m, ...rest } = result
        newGs = { ...newGs, ...rest }
      }
    }

    // Quêtes à l'arrivée
    const { completed } = checkQuestsOnArrival(newGs)
    for (const q of completed) {
      newGs = { ...newGs, ...completeQuest(newGs, q) }
    }
    // Quêtes simples complétées
    const simpleQuestLines = completed.map(q => `★ ${q.title}\n+${q.creditReward.toLocaleString()} cr · +${q.repReward} rép`)

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
      travelMsg = (travelMsg ? travelMsg + ' | ' : '') + `Quelqu'un te suit depuis un moment. ${newStalker.name}.`
    } else if (newGs.stalker) {
      const stalkerEvt = rollStalkerEvent(newGs, newGs.stalker)
      if (stalkerEvt) {
        travelMsg = (travelMsg ? travelMsg + ' | ' : '') + stalkerEvt.description
        if (stalkerEvt.newStalkerState) {
          newGs = { ...newGs, stalker: { ...newGs.stalker, ...stalkerEvt.newStalkerState } }
        }
      }
    }

    // Situation d'arrivée (40% de chance)
    const arrival = getArrivalSituation(newGs)
    if (arrival) {
      newGs = { ...newGs, pendingArrival: true, pendingMessage: arrival.title }
    }

    set({ gs: newGs, travelEventMessage: travelMsg, objectivePopup: objMsg, questCompletionMsg: questMsg })
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
    if (rallied >= 4) {
      newGs = { ...newGs, screen: 'victory' as Screen }
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
    return {
      gs: {
        ...s.gs,
        equippedArmor: a,
        playerMaxHp: s.gs.playerMaxHp + hpDiff,
        playerHp: Math.min(s.gs.playerHp + hpDiff, s.gs.playerMaxHp + hpDiff),
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
    return { gs: { ...s.gs, activeQuests: [...s.gs.activeQuests, quest] } }
  }),

  spendAction: () => set(s => {
    if (!s.gs) return s
    const changes = spendAction(s.gs)
    return { gs: { ...s.gs, ...changes } }
  }),

  joinFaction: (factionId) => set(s => {
    if (!s.gs) return s
    return { gs: { ...s.gs, faction: factionId as GameState['faction'] } }
  }),

  patch: (partial) => set(s => s.gs ? { gs: { ...s.gs, ...partial } } : s),

  dismissTravelEvent: () => set({ travelEventMessage: null }),
  dismissObjectivePopup: () => set({ objectivePopup: null }),
  dismissQuestCompletion: () => set({ questCompletionMsg: null }),

  rest: () => set(s => {
    if (!s.gs) return s
    let debt = 0
    if (s.gs.class.dailyDebt) debt = s.gs.class.dailyDebt
    return {
      gs: {
        ...s.gs,
        playerHp: s.gs.playerMaxHp,
        stamina: s.gs.maxStamina,
        day: s.gs.day + 1,
        actionsToday: 0,
        credits: Math.max(0, s.gs.credits - debt),
      }
    }
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

  newGame: () => set({ gs: null, travelEventMessage: null, objectivePopup: null, combatVictoryPending: false, pendingVictoryData: null, playerDeathPending: false, pendingDeathCause: null }),
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
    const { newGs: objGs, newlyCompleted } = checkObjectives(newGs)
    const { newGs: majorGs, messages: majorMsgs } = checkMajorQuestAdvancement(newGs)
    newGs = { ...newGs, ...objGs, ...majorGs, combatState: cs, combatRewardData: reward ?? null, screen: 'combat-result' as Screen }
    const objMsg = [
      newlyCompleted.length > 0 ? `★ ${newlyCompleted.map(o => o.name).join(', ')}` : null,
      ...majorMsgs,
    ].filter(Boolean).join('\n') || null
    // Montrer d'abord l'ennemi à 0 PV, puis transition différée vers combat-result
    const dyingGs = { ...gs, combatState: { ...cs, enemyHp: 0 }, pendingCombatOutcome: null }
    set({ gs: dyingGs, combatVictoryPending: true, pendingVictoryData: { gs: newGs, objMsg } })
  } else if (outcome === 'fled') {
    newGs = { ...newGs, combatsFled: (gs.combatsFled ?? 0) + 1, pendingCombatOutcome: 'fled', screen: 'combat-outcome' as Screen }
    set({ gs: newGs })
  } else if (outcome === 'dead') {
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
    set({ gs: { ...gs, isDead: true, deathCause: 'Trop nombreux. Tu n\'as pas survécu.', screen: 'game-over' } })
  } else if (outcome === 'captured') {
    set({ gs: { ...gs, multiCombatState: mcs, isImprisoned: true, prisonDaysLeft: 3, screen: 'prison' } })
  } else if (outcome === 'stunned') {
    set({ gs: { ...gs, multiCombatState: mcs, playerHp: Math.max(1, Math.floor(gs.playerMaxHp / 4)), credits: Math.max(0, gs.credits - Math.floor(Math.random() * 400 + 200)), pendingCombatOutcome: 'stunned', screen: 'station-hub' } })
  }
}

export const AVAILABLE_CLASSES = CLASSES

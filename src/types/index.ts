export type Screen =
  | 'class-select'
  | 'station-hub'
  | 'travel'
  | 'market'
  | 'combat'
  | 'multi-combat'
  | 'inventory'
  | 'exploration'
  | 'wander'
  | 'quests'
  | 'objectives'
  | 'prison'
  | 'factions'
  | 'ship-workshop'
  | 'narrative-arcs'
  | 'nexus'
  | 'wiki'
  | 'arrival'
  | 'stalker'
  | 'station-arrival'
  | 'combat-result'
  | 'combat-outcome'
  | 'victory'
  | 'game-over'

export type PlayerClassName =
  | 'Vagabond' | 'Ferrailleur' | 'Endetté' | 'Accro' | 'Maudit'
  | 'Marchand' | 'Mécanicien' | 'Explorateur' | 'Médecin'
  | 'Contrebandier' | 'Vétéran' | 'Héritier' | 'Hackeur' | 'Seigneur de guerre'

export type ClassTier = 'bad' | 'balanced' | 'good'

export interface PlayerClass {
  name: PlayerClassName
  description: string
  tier: ClassTier
  startCredits: number
  startFuel: number
  maxFuel: number
  startHp: number
  startStamina: number
  startStation: string
  bonusDesc: string
  color: string
  icon: string
  // Mécaniques spéciales
  cargoDegrades?: boolean       // Ferrailleur: 30% chance de perdre cargo en voyage
  dailyDebt?: number            // Endetté: crédits perdus par jour
  travelCreditCost?: number     // Accro: crédits perdus par voyage
  cursedEvents?: boolean        // Maudit: événements positifs 50% chance de fizzle
  buyDiscountPercent?: number   // Contrebandier: réduction achats
  piratesDoubled?: boolean      // Contrebandier: pirates 2x plus souvent
  cannotBuyWeapons?: boolean    // Héritier: impossible d'acheter des armes
  periodicIncome?: number       // Héritier: crédits toutes les 5 jours
  seesPrices?: boolean          // Hackeur: voit les prix à destination
  autoKillsPirates?: boolean    // Seigneur de guerre: pirates auto-résolus
  peacefulBan?: boolean         // Seigneur de guerre: stations paisibles refusent
  medicBonus?: boolean          // Médecin: médicaments vendus 50% plus cher
  neutralEventsBoost?: boolean  // Explorateur: événements neutres plus fréquents
  // Stats de combat
  combatAttackMult?: number     // multiplicateur dégâts infligés (défaut 1.0)
  combatDefenseMult?: number    // multiplicateur dégâts reçus (défaut 1.0, < 1 = résistant)
  combatCritBonus?: number      // bonus chance critique flat
  combatStaminaRegen?: number   // stamina regen bonus par tour
  combatMomentumStart?: number  // momentum de départ (Vétéran)
}

export type WeaponEffect =
  | 'none' | 'stun' | 'paralyze' | 'burn' | 'poison'
  | 'blind' | 'flee' | 'distraction' | 'confusion'
  | 'random' | 'silence' | 'armorPierce'

export interface WeaponData {
  name: string
  tier: number
  damageMin: number
  damageMax: number
  critChance: number
  effect: WeaponEffect
  effectChance: number
  effectDesc: string
  selfDmgChance: number
  selfDmgMax: number
  affinities: Partial<Record<PlayerClassName, number>>
}

export type ArmorEffect = 'none' | 'regen' | 'thorns' | 'immunity' | 'staminaBoost'

export interface ArmorData {
  name: string
  tier: number
  defense: number
  hpBonus: number
  effect: ArmorEffect
  effectValue: number
  description: string
  sellValue: number
}

export type EnemyRole = 'normal' | 'tank' | 'ranged' | 'support'
export type EnemyIntent = 'normal' | 'heavy' | 'defend' | 'charge' | 'disarm'

export interface Enemy {
  name: string
  maxHp: number
  damageMin: number
  damageMax: number
  lootMin: number
  lootMax: number
  description: string
  captureChance: number
  killChance: number
  isBoss: boolean
  role: EnemyRole
}

export type CombatOutcome = 'victory' | 'stunned' | 'captured' | 'dead' | 'fled'
export type CombatStance = 'normal' | 'offensive' | 'defensive' | 'dodge'

export interface CombatState {
  enemyHp: number
  enemyStunTurns: number
  enemyBurnDmg: number
  enemyBurnTurns: number
  enemyBlinded: boolean
  playerFled: boolean
  immunityUsed: boolean
  playerStance: CombatStance
  momentum: number
  classActionUsed: boolean
  currentIntent: EnemyIntent
  enemyCharging: boolean
  enemyWeaponDisabledTurns: number
  lastPlayerDmg: number
  playerWeakenedTurns: number
  log: CombatLogEntry[]
}

export interface CombatLogEntry {
  id: number
  text: string
  type: 'player' | 'enemy' | 'info' | 'crit' | 'victory' | 'warning'
}

export interface Cargo {
  [item: string]: number
}

// ── QUÊTES ───────────────────────────────────────────────────────────────────

export type QuestType = 'delivery' | 'kill' | 'revenge' | 'info' | 'escort' | 'sabotage' | 'heist' | 'extraction' | 'bounty' | 'patrol'

export interface Quest {
  id: string
  title: string
  giver: string
  giverStation: string
  type: QuestType
  description: string
  targetStation: string
  targetItem?: string
  creditReward: number
  repReward: number
}

// ── FACTIONS ─────────────────────────────────────────────────────────────────

export type FactionId = 'none' | 'faucons' | 'emporium' | 'gardiens' | 'culte'

export interface Faction {
  id: FactionId
  name: string
  description: string
  bonus: string
  color: string
}

// ── NPC ──────────────────────────────────────────────────────────────────────

export type NpcReaction = 'ally' | 'friendly' | 'warm' | 'neutral' | 'cold' | 'hostile'

export interface PersistentNpc {
  id: string
  name: string
  station: string
  firstMetDay: number
  timesMet: number
  repDelta: number
  isAlly: boolean
  isEnemy: boolean
  tags: string[]
}

// ── ARCS NARRATIFS ────────────────────────────────────────────────────────────

export type ArcId = 'alanossa' | 'raphazarus' | 'vael' | 'factionwar'

export interface NarrativeArc {
  id: ArcId
  title: string
  step: number
  maxSteps: number
  completed: boolean
  failed: boolean
}

// ── EXPLORATION ──────────────────────────────────────────────────────────────

export type ExplorationOutcomeType = 'combat' | 'loot' | 'event' | 'nothing' | 'npc' | 'boss'

export interface ExplorationScene {
  description: string
  outcomeType: ExplorationOutcomeType
  choices: ExplorationChoice[]
}

export interface ExplorationChoice {
  label: string
  outcome: string
  effect?: 'credits' | 'damage' | 'combat' | 'item' | 'rep' | 'nothing' | 'loot_big' | 'fuel'
  value?: number
}

// ── EVENT NARRATIF ────────────────────────────────────────────────────────────

export interface NarrativeEvent {
  id: number
  title: string
  description: string
  choices: NarrativeChoice[]
}

export interface NarrativeChoice {
  label: string
  effect: (gs: GameState) => Partial<GameState>
  available?: (gs: GameState) => boolean
  result: string
}

// ── QUÊTES MAJEURES ───────────────────────────────────────────────────────────

export type MajorQuestCondition =
  | { type: 'visitStation';  station: string }
  | { type: 'visitStations'; count: number }
  | { type: 'winCombatAt';   station: string }
  | { type: 'meetNpc';       npcName: string }
  | { type: 'hasFaction';    faction: string }
  | { type: 'hasReputation'; min: number }
  | { type: 'hasCargo';      item: string }
  | { type: 'hasTag';        tag: string }
  | { type: 'bossKill';      bossName: string }

export interface MajorQuestStage {
  id: string
  title: string
  description: string
  objective: string
  condition: MajorQuestCondition
  reward?: { credits?: number; rep?: number; message?: string }
}

export interface MajorQuest {
  id: string
  title: string
  giver: string
  giverStation: string
  lore: string
  currentStage: number
  stages: MajorQuestStage[]
  completed: boolean
  failed: boolean
  requiresFaction?: string
  requiresReputation?: number
  requiresNpcMet?: string
}

// ── GAME STATE ────────────────────────────────────────────────────────────────

export interface GameState {
  screen: Screen
  playerName: string
  class: PlayerClass
  playerHp: number
  playerMaxHp: number
  stamina: number
  maxStamina: number
  credits: number
  fuel: number
  maxFuel: number
  shipHp: number
  shipMaxHp: number
  reputation: number
  day: number
  actionsToday: number   // Clock: 3 actions = 1 jour
  currentStation: string
  visitedStations: string[]
  weapons: WeaponData[]
  armors: ArmorData[]
  equippedWeapon: WeaponData | null
  equippedArmor: ArmorData | null
  cargo: Cargo
  // Quêtes
  activeQuests: Quest[]
  completedQuestIds: string[]
  // Objectifs
  completedObjectives: string[]
  // Factions
  faction: FactionId
  factionMissions: number
  isFactionLeader: boolean
  isDoubleAgent: boolean
  // NPCs
  knownNpcs: Record<string, PersistentNpc>
  npcsMet: string[]
  // Arcs narratifs
  activeArcs: NarrativeArc[]
  completedArcs: string[]
  // Progression
  bossesDefeated: number
  stationBossesBeaten: string[]
  stationPiecesRallied: number  // Nexus fragments
  interrogationsSurvived: number
  prisonEscapes: number
  // Zone exploration
  zoneDepth: number
  lastExploreWasCombat: boolean
  // Prison
  isImprisoned: boolean
  prisonDaysLeft: number
  // Mort
  isDead: boolean
  deathCause: string
  // Effets de classe spéciaux
  addictionLevel: number        // Accro
  debtDailyAmount: number       // Endetté
  lastIncomeDay: number         // Héritier
  // Combat session solo
  combatEnemy: Enemy | null
  combatState: CombatState | null
  pendingCombatOutcome: CombatOutcome | null
  pendingMessage: string | null
  // Combat multi-ennemis
  multiCombatState: import('../engine/multiCombat').MultiCombatState | null
  // Nexus fragments (condition de victoire)
  nexusFragments: number[]
  // Stalker system
  stalker: import('../engine/stalker').StalkerState | undefined
  // Arrival situation en cours
  pendingArrival: boolean
  // Moral / tags narratifs
  moralTags: string[]
  // Stats diverses
  totalCreditsEarned: number
  combatsWon: number
  combatsFled: number
  // Résultat du dernier combat (affiché sur combat-result)
  combatRewardData: { loot: number; weaponName?: string; armorName?: string; isBossKill: boolean } | null
  // Barre de folie (Accro + Cannibale)
  folieLevel: number
  folieConsumedThisTurn: boolean
  // Quêtes majeures
  majorQuests: MajorQuest[]
}

export interface StationData {
  name: string
  description: string
  danger: 0 | 1 | 2 | 3
  type: 'dangerous' | 'peaceful' | 'industrial' | 'scientific' | 'ruins' | 'luxury' | 'military'
  goods: string[]
  fuelCostFrom: Record<string, number>
}

export interface MarketItem {
  name: string
  basePrice: number
}

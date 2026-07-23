export type Screen =
  | 'class-select'
  | 'intro'
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
  | 'meta'
  | 'crafting'
  | 'interrogation'
  | 'journal'
  | 'escort-minigame'
  | 'map'

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
  coupDeGraceBonus?: number     // % dégâts bonus quand ennemi < 25% PV
}

export type WeaponEffect =
  | 'none' | 'stun' | 'paralyze' | 'burn' | 'poison'
  | 'blind' | 'flee' | 'distraction' | 'confusion'
  | 'random' | 'silence' | 'armorPierce' | 'disarm'
  // Nouveaux effets
  | 'lifesteal'       // vole 35% des dégâts infligés en PV
  | 'shock'           // stun + brûlure 3 tours
  | 'double_strike'   // frappe deux fois (×0.85 chacune)
  | 'sacrifice'       // coûte 25% PV max, frappe ×2.5
  | 'unstable'        // 50% : ×3.5 dégâts | 50% : self-damage massif + stun joueur
  | 'nuclear'         // ×4.5 dégâts, 65% chance self-damage 80-200 + affaibli
  | 'berserker'       // dégâts × (1 + 1.5×%PV manquants), max ×2.5
  | 'momentum_surge'  // frappe + momentum immédiatement à 3
  | 'curse'           // ennemi affaibli -40% dégâts pendant 3 tours

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
  | 'blood_rage' | 'execution' | 'weaken'
  | 'imperial_barrage' | 'phantom_strike' | 'party_over' | 'flora_toxin' | 'all_in'

export type PillarAbility = 'imperial_barrage' | 'phantom_strike' | 'party_over' | 'flora_toxin' | 'all_in'

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
  pillarAbility?: PillarAbility
  isSubBoss?: boolean
}

export type SubBossResolution = 'kill' | 'negotiate' | 'manipulate' | 'betray' | 'ally' | 'sabotage'

export interface SubBossData {
  id: string
  name: string
  pillar: string
  station: string
  order: 1 | 2 | 3 | 4
  personality: string
  motivation: string
  backstory: string
  combatMechanic: string
  specialAbility: string
  reward: { type: 'weapon' | 'armor' | 'credits' | 'rep' | 'item'; value: string | number }
  resolutions: SubBossResolution[]
  enemy: Enemy
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
  playerStunnedTurns: number   // attaques spéciales personnages piliers
  playerBurnDmg: number        // dégâts de poison/brûlure sur le joueur (flora_toxin)
  playerBurnTurns: number
  enemyWeakenedTurns: number   // curse — ennemi à -40% dégâts
  enemyConfusedTurns: number   // confusion — ennemi se frappe lui-même
  enemySilencedTurns: number   // silence — ennemi limité aux attaques basiques
  playerExposedTurns: number   // après frappe concentrée — ennemi frappe ×1.5 ce tour
  medicUses: number            // soins utilisés ce combat (max 3)
  turnCount: number            // compteur de tours pour mécaniques de sous-boss
  subBossShadowHits: number    // Le Maître des Ombres — coups encaissés par l'ombre (se brise après 3)
  subBossDefenseStacks: number
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

export type QuestType = 'delivery' | 'kill' | 'revenge' | 'escort' | 'sabotage' | 'heist' | 'extraction' | 'bounty' | 'patrol'

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
  dayMult?: number
  factionId?: string
  progress?: number
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
  lastQuestDay?: number
  lastServiceDay?: number
  lastTalkDay?: number
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

// ── ÉTAT DE STATION ───────────────────────────────────────────────────────────

export type StationAlertType = 'siege' | 'festival' | 'lockdown' | 'epidemic'

// ── GUERRE ENTRE DÉTENTEURS DU NEXUS ─────────────────────────────────────────

export interface NexusWar {
  holderA: string   // pillar key, ex: 'alanossa'
  holderB: string   // pillar key, ex: 'cesarion'
  startDay: number
  resolved: boolean
  winner?: string   // pillar key du vainqueur
  loser?: string    // pillar key du perdant
  fragIdxLoser?: number  // idx du fragment du perdant (maintenant dispo)
}

// ── ÉVÉNEMENTS MONDIAUX ───────────────────────────────────────────────────────

export interface WorldEvent {
  id: string
  title: string
  description: string
  shortDesc: string      // résumé une ligne pour le bandeau
  startDay: number
  duration: number       // en jours
  color: string          // couleur CSS pour l'affichage
  effects: {
    priceItems?: string[]       // items dont le prix est modifié
    priceMultiplier?: number    // multiplicateur pour ces items
    globalPriceMult?: number    // multiplicateur sur TOUS les items
    fuelCostBonus?: number      // carburant supplémentaire par trajet
    closedStations?: string[]   // stations inaccessibles
    combatChanceBonus?: number  // probabilité combat exploration +X (0-1)
    festivalStations?: string[] // stations en fête
  }
}

// ── JOURNAL DE BORD ──────────────────────────────────────────────────────────

export interface JournalEntry {
  id: number
  day: number
  station: string
  text: string
  category: 'combat' | 'decision' | 'travel' | 'nexus' | 'prison' | 'event'
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
  explorationFightsDone: number
  // Tournoi de l'arène
  tournamentRound: number   // 0 = hors tournoi, 1-10 = round en cours
  // Récompense carburant différée (combat pour du fuel)
  pendingFuelReward: number
  // Prison
  isImprisoned: boolean
  prisonDaysLeft: number
  // Interrogatoire (transfert forcé)
  pendingInterrogation: { faction: string; captureStation: string } | null
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
  nexusPath: Partial<Record<number, 'force' | 'pay' | 'alliance' | 'legendary' | 'gamble' | 'steal' | 'lore' | 'war' | 'betray' | 'manipulate'>>
  nexusWars: NexusWar[]
  nexusAngered: string[]  // pillar keys des détenteurs rendus ennemis permanents
  pendingCombatArcId: string | null
  // Stalker system
  stalker: import('../engine/stalker').StalkerState | undefined
  // Arrival situation en cours
  pendingArrival: boolean
  // Résumé fin de journée (montré à l'arrivée à la prochaine station)
  pendingDaySummary: { prevDay: number; actionsUsed: number; station: string } | null
  // Bonus de pillage activé par Matériel de pillage (consommé à la prochaine exploration)
  pillageBonusActive: boolean
  // Moral / tags narratifs
  moralTags: string[]
  // Mémoire des décisions importantes (identifiants uniques)
  pastDecisions: string[]
  // Relations avec les personnages piliers (-100 à +100)
  pillarStanding: {
    cesarion: number
    raphazarus: number
    eliotis: number
    maxance: number
    alanossa: number
    scotty: number
  }
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
  // Événements mondiaux actifs
  activeWorldEvents: WorldEvent[]
  // Modules vaisseau
  shipModules: { moteur: number; soute: number; tourelle: number; scanner: number }
  // Réputation par faction
  factionReputation: { faucons: number; emporium: number; gardiens: number; culte: number }
  // Modificateurs de run
  runModifiers: string[]
  runObjectiveId: string | null
  runObjectiveCompleted: boolean
  craftsPerformed: number
  // Lore et chaîne narrative
  discoveredLore: string[]
  pendingChainEvents: import('../engine/chainEvents').ChainEvent[]
  // Journal de bord auto-généré
  journal: JournalEntry[]
  // Système prison — confiscation et évasion
  prisonConfiscatedItems: {
    weapons: WeaponData[]
    armors: ArmorData[]
    equippedWeapon: WeaponData | null
    equippedArmor: ArmorData | null
    cargo: Cargo
  } | null
  prisonEscapeFailures: number    // nombre d'évasions ratées (catch) dans ce séjour
  prisonCellmatePending: boolean  // un codétenu hostile attend dans la cellule
  // Services exclusifs des stations
  implantsBought: string[]         // identifiants implants achetés ce run
  usedFreeRestStations: string[]   // stations où le repos gratuit a été utilisé ce run
  usedLocalActivities: string[]    // activités locales déjà faites (stationName-eventId), vidé à chaque voyage
  // Quêtes enchaînées
  pendingChainQuests: Quest[]
  // États dynamiques des stations
  stationAlerts: Record<string, StationAlertType>
  // Variance de prix par station (seed aléatoire par run, 0.75–1.25)
  stationPriceSeeds: Record<string, number>
  // Meta unlock : survit à un coup mortel une fois par run
  lethalSurviveAvailable?: boolean
  // Mini-jeu escorte en attente
  pendingEscortQuestId?: string
  // Waypoint — destination planifiée depuis la carte
  waypoint?: string
  // Sous-boss vaincus par pilier { pillarKey: subBossId[] }
  subBossesDefeated: Record<string, string[]>
  // Quêtes d'équipement complétées
  completedEquipmentQuests: string[]
  conquestMode?: boolean
  arcPerduUnlocked?: boolean
  arcPerduClues: string[]
  raphazarusActivated?: boolean
  raphazarusWarriorDay?: number
  scottyGambleWins?: number
  scottyGambleRound?: number
  // Grand Bazar — compteur d'achats (reset tous les 15j)
  bazarPurchases: Record<string, number>
  bazarLastResetDay: number
}

export type StationSpecialService =
  | 'gambling'
  | 'implants'
  | 'fuel_cheap'
  | 'weapon_forge'
  | 'arena'
  | 'rest_bonus'

export interface StationData {
  name: string
  description: string
  danger: 0 | 1 | 2 | 3
  type: 'dangerous' | 'peaceful' | 'industrial' | 'scientific' | 'ruins' | 'luxury' | 'military'
  goods: string[]
  fuelCostFrom: Record<string, number>
  specialService?: StationSpecialService
  fuelDiscount?: number        // fraction de réduction (ex. 0.35 = -35%)
  exclusiveGoods?: string[]    // goods marqués ★ EXCLUSIF dans le marché
}

export interface MarketItem {
  name: string
  basePrice: number
}

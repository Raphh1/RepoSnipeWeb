import type { GameState, Quest, QuestType } from '../types'
import { getRandomUndiscoveredFragment } from '../data/loreFragments'
import { getStation, getAccessibleStations } from '../data/stations'
import { rollWeaponForTier } from '../data/weapons'
import {
  JSON_WANDER_LOW, JSON_WANDER_MID, JSON_WANDER_HIGH, JSON_WANDER_EXTREME,
  JSON_EXPLORE_DANGEROUS, JSON_EXPLORE_PEACEFUL, JSON_EXPLORE_INDUSTRIAL,
  JSON_EXPLORE_SCIENTIFIC, JSON_EXPLORE_RUINS, JSON_EXPLORE_MILITARY,
  JSON_EXPLORE_LUXURY, JSON_EXPLORE_GENERIC,
} from './jsonEventLoader'
import { rollMemoryEvent, addDecision, shiftPillar } from './memoryEvents'
import { addJournal } from './journal'

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

export type ExploreResult =
  | { type: 'combat'; depth: number }
  | { type: 'boss' }
  | { type: 'loot'; credits: number; description: string; loreFragmentId?: string }
  | { type: 'item'; item: string; qty: number; description: string; loreFragmentId?: string }
  | { type: 'fuel'; amount: number; description: string; loreFragmentId?: string }
  | { type: 'event'; description: string; choices: ExploreChoice[]; loreFragmentId?: string; rare?: boolean }
  | { type: 'nothing'; description: string; loreFragmentId?: string }

export interface ExploreChoice {
  label: string
  hint?: string
  result: (gs: GameState) => { gs: Partial<GameState>; message: string; minigame?: 'lockpick'; minigameReward?: Partial<GameState> }
  available?: (gs: GameState) => boolean
}

// Scènes par type de zone
const SCENES_DANGEROUS: Array<() => ExploreResult> = [
  () => ({
    type: 'event',
    description: "Tu tombes sur un type inconscient dans une ruelle. Du sang. Un couteau pas loin.",
    choices: [
      {
        label: "Fouiller ses poches",
        result: () => {
          const cr = rng(80, 300)
          return { gs: { credits: cr }, message: `Tu trouves ${cr} crédits. Tu repars vite.` }
        }
      },
      {
        label: "Le soigner et partir",
        result: (gs) => ({ gs: { reputation: gs.reputation + 5 }, message: "+5 réputation. Il survivra peut-être." })
      },
      {
        label: "Ignorer et continuer",
        result: () => ({ gs: {}, message: "Tu passes. Ce n'est pas ton problème." })
      }
    ]
  }),
  () => ({
    type: 'event',
    description: "Deux gangs se font face dans le couloir. T'es au milieu. Ni l'un ni l'autre ne te regarde encore.",
    choices: [
      {
        label: "Reculer discrètement",
        result: () => ({ gs: {}, message: "Tu recules. Ils commencent à se taper dessus. Tu repars par l'autre côté." })
      },
      {
        label: "Jouer les médiateurs",
        result: (gs) => {
          const ok = Math.random() < 0.3 + gs.reputation / 200
          return ok
            ? { gs: { reputation: gs.reputation + 15, credits: gs.credits + rng(200, 500) }, message: "Ils t'écoutent. +15 rép, quelques crédits en guise de merci." }
            : { gs: { playerHp: Math.max(1, gs.playerHp - rng(10, 25)) }, message: "Ils t'écoutent pas. Tu prends quelques coups en partant." }
        }
      },
      {
        label: "Profiter du chaos pour fouiller les caisses derrière",
        result: () => {
          const cr = rng(150, 500)
          return { gs: { credits: cr }, message: `Tu disparais avec ${cr} crédits. Ils ont rien vu.` }
        }
      }
    ]
  }),
  () => ({ type: 'loot', credits: rng(100, 400), description: "Tu trouves un sac de voyage abandonné. Quelqu'un est parti vite." }),
  () => ({ type: 'combat', depth: 0 }),
  () => ({
    type: 'event',
    description: "Un enfant te tend quelque chose en silence. Un cristal d'énergie. Il disparaît avant que tu puisses parler.",
    choices: [
      { label: "Garder le cristal", result: () => ({ gs: { cargo: {} }, message: "+1 Cristal énergétique. Bizarre." }) },
      { label: "Le chercher pour le rendre", result: () => ({ gs: {}, message: "Introuvable. Le cristal reste dans ta main." }) }
    ]
  }),
  () => ({ type: 'nothing', description: "Un couloir vide. Des graffitis. Une odeur de métal brûlé. Rien d'autre." }),
  () => ({ type: 'loot', credits: rng(50, 200), description: "Des crédits éparpillés sur le sol. Quelqu'un a pris la fuite." }),
  () => ({
    type: 'event',
    description: "Une porte verrouillée avec un boîtier électronique cassé. Le contenu pourrait être intéressant.",
    choices: [
      { label: "Forcer la porte (-15 PV)", result: (gs) => ({ gs: { playerHp: Math.max(1, gs.playerHp - 15), credits: gs.credits + rng(200, 600) }, message: "Tu forces. Tes épaules te le rappelleront demain. +crédits." }) },
      { label: "Pirater le boîtier", result: (gs) => ({ gs: {}, message: '', minigame: 'lockpick' as const, minigameReward: { credits: gs.credits + rng(300, 800) } }) },
      { label: "Passer ton chemin", result: () => ({ gs: {}, message: "Tu passes. Ça valait probablement rien." }) }
    ]
  }),
  // ── PIÈGES ZONES DANGEREUSES ──
  () => ({
    type: 'event',
    description: "Des lumières stroboscopiques. Des voix qui aboient des ordres. Une rafle. Tu es dans la mauvaise ruelle au mauvais moment.",
    choices: [
      {
        label: "Tenter de fuir dans la foule (30% réussite)",
        result: (gs) => Math.random() < 0.30
          ? { gs: { playerHp: Math.max(1, gs.playerHp - rng(10, 22)) }, message: "Tu disparais dans le chaos. Quelques coups de matraque en chemin. -PV." }
          : { gs: { pendingInterrogation: { faction: 'Milice locale', captureStation: gs.currentStation }, screen: 'interrogation' as const }, message: "Ils t'ont chopé. Direction le poste." }
      },
      {
        label: "Obtempérer — montrer patte blanche",
        result: (gs) => ({ gs: { pendingInterrogation: { faction: 'Milice locale', captureStation: gs.currentStation }, screen: 'interrogation' as const }, message: "Ils t'escortent hors de la zone. Un interrogatoire attend." })
      },
      {
        label: "Résister — combat à l'aveugle",
        result: (gs) => ({ gs: { isImprisoned: true as const, prisonDaysLeft: rng(2, 5), screen: 'prison' as const, playerHp: Math.max(1, gs.playerHp - rng(25, 45)), reputation: gs.reputation - 20 }, message: "Ils te maîtrisent. Tu te réveilles en cellule avec des hématomes." })
      }
    ]
  }),
  () => ({
    type: 'event',
    description: "Un couloir sans issue. Quelqu'un l'a créé exprès. Le panneau 'Sortie' pointait dans la mauvaise direction.",
    choices: [
      {
        label: "Chercher une autre issue",
        result: (gs) => Math.random() < 0.40
          ? { gs: { playerHp: Math.max(1, gs.playerHp - rng(8, 18)) }, message: "Une fenêtre technique. Tu passes de justesse. -PV." }
          : { gs: { isImprisoned: true as const, prisonDaysLeft: rng(1, 3), screen: 'prison' as const, credits: Math.max(0, gs.credits - rng(100, 400)) }, message: "Ils t'attendaient. La cage se referme." }
      },
      {
        label: "Attendre — voir ce qui se passe",
        result: (gs) => ({ gs: { isImprisoned: true as const, prisonDaysLeft: rng(1, 2), screen: 'prison' as const }, message: "Des gens armés arrivent. Pas de question posée." })
      }
    ]
  }),
]

const SCENES_PEACEFUL: Array<() => ExploreResult> = [
  () => ({ type: 'loot', credits: rng(60, 200), description: "Une vieille pièce de monnaie oubliée. Valeur sentimentale et marchande." }),
  () => ({
    type: 'event',
    description: "Un marchand ambulant te propose ses services. Ses prix semblent raisonnables.",
    choices: [
      { label: "Acheter des médicaments (120cr)", result: (gs) => gs.credits >= 120 ? { gs: { credits: gs.credits - 120, cargo: { ...gs.cargo, 'Médicaments': (gs.cargo['Médicaments'] ?? 0) + 2 } }, message: "Acheté. +2 Médicaments." } : { gs: {}, message: "Pas assez de crédits." } },
      { label: "Acheter des vivres (60cr)", result: (gs) => gs.credits >= 60 ? { gs: { credits: gs.credits - 60, cargo: { ...gs.cargo, 'Nourriture fraîche': (gs.cargo['Nourriture fraîche'] ?? 0) + 3 } }, message: "Acheté. +3 Nourriture fraîche." } : { gs: {}, message: "Pas assez de crédits." } },
      { label: "Passer", result: () => ({ gs: {}, message: "Tu continues." }) }
    ]
  }),
  () => ({ type: 'nothing', description: "Des enfants jouent dans un couloir éclairé. Quelqu'un rit. L'univers n'est pas toujours sombre." }),
  () => ({ type: 'item', item: 'Médicaments', qty: 1, description: "Une trousse de premiers soins oubliée derrière une borne." }),
  () => ({
    type: 'event',
    description: "Un vieux pilote te raconte une route commerciale secrète. Ça a l'air légal.",
    choices: [
      { label: "Écouter attentivement", result: (gs) => ({ gs: { reputation: gs.reputation + 8, credits: gs.credits + rng(100, 300) }, message: "+8 rép, info monnayable. +quelques crédits." }) },
      { label: "Remercier et partir", result: () => ({ gs: {}, message: "Tu pars. Il hoche la tête." }) }
    ]
  }),
  () => ({ type: 'nothing', description: "Un café ouvert. Du vrai café. Tu t'assieds cinq minutes. Ça fait du bien." }),
  () => ({ type: 'fuel', amount: 1, description: "Une citerne de carburant mal sécurisée. Personne regarde." }),
]

const SCENES_INDUSTRIAL: Array<() => ExploreResult> = [
  () => ({ type: 'loot', credits: rng(100, 350), description: "Une caisse de pièces détachées. Valeur monnayable." }),
  () => ({ type: 'item', item: 'Métaux bruts', qty: 2, description: "Des rebuts de fabrication jetés. Récupérables." }),
  () => ({
    type: 'event',
    description: "Un ouvrier te bloque le passage. 'Zone interdite.' Il a l'air épuisé, pas agressif.",
    choices: [
      { label: "Négocier un passage (50cr)", result: (gs) => gs.credits >= 50 ? { gs: { credits: gs.credits - 50 }, message: "Il te laisse passer. -50cr." } : { gs: {}, message: "Pas assez de crédits. Tu fais demi-tour." } },
      { label: "Faire demi-tour", result: () => ({ gs: {}, message: "Tu repars par l'autre entrée." }) },
      { label: "Forcer le passage", result: (gs) => ({ gs: { playerHp: Math.max(1, gs.playerHp - rng(8, 20)), reputation: gs.reputation - 5 }, message: "Il résiste. Courte bagarre. -PV, -5 rép." }) }
    ]
  }),
  () => ({ type: 'combat', depth: 0 }),
  () => ({ type: 'nothing', description: "Des machines qui tournent. De la chaleur. Du bruit. Rien de utile ici." }),
  () => ({ type: 'item', item: 'Composants électroniques', qty: 1, description: "Des composants tombés d'une chaîne. Encore bons." }),
  () => ({ type: 'fuel', amount: 2, description: "Des bidons de carburant entreposés sans surveillance. Tu en prends deux." }),
]

const SCENES_RUINS: Array<() => ExploreResult> = [
  () => ({ type: 'loot', credits: rng(150, 500), description: "Un coffre-fort descellé. Probablement oublié depuis des années." }),
  () => ({
    type: 'event',
    description: "Des ruines d'une ancienne boutique. Des hologrammes encore actifs affichent des prix d'une autre époque.",
    choices: [
      { label: "Fouiller les décombres", result: () => { const r = Math.random(); return r < 0.4 ? { gs: { credits: rng(200, 700) as number }, message: `Tu trouves ${rng(200, 700)} crédits cachés.` } : r < 0.7 ? { gs: {}, message: "Juste de la poussière et des souvenirs." } : { gs: { playerHp: 0 }, message: "Un piège. -15 PV." } } },
      { label: "Prendre un hologramme comme souvenir", result: (gs) => ({ gs: { reputation: gs.reputation + 3 }, message: "Tu gardes ça. +3 rép narrative." }) }
    ]
  }),
  () => ({ type: 'nothing', description: "Des couloirs effondrés. Des poutres tordues. L'histoire d'une catastrophe que personne ne raconte plus." }),
  () => ({ type: 'combat', depth: 0 }),
  () => ({ type: 'item', item: 'Artefacts', qty: 1, description: "Un objet d'avant la guerre. Sa fonction n'est plus claire." }),
  () => ({
    type: 'event',
    description: "Tu trouves un terminal encore actif. Des données partielles. Quelqu'un cherchait quelque chose.",
    choices: [
      { label: "Extraire les données", result: (gs) => ({ gs: { credits: gs.credits + rng(200, 600), reputation: gs.reputation + 10 }, message: "Données vendables. +crédits, +10 rép." }) },
      { label: "Effacer le terminal", result: () => ({ gs: {}, message: "Tu effaces tout. Parfois mieux vaut pas savoir." }) }
    ]
  }),
  // ── PIÈGES RUINES ──
  () => ({
    type: 'event',
    description: "Le sol émet un craquement sourd sous ton pied. Une fraction de seconde pour comprendre. Puis le vide.",
    choices: [
      {
        label: "S'agripper à une poutre en tombant (20% survie)",
        result: (gs) => Math.random() < 0.20
          ? { gs: { playerHp: Math.max(1, gs.playerHp - rng(35, 55)) }, message: "Tu t'accroches. L'épaule sort de son axe. Tu survis. À peine." }
          : { gs: { isDead: true as const, deathCause: "Effondrement structural dans les ruines. La dalle a cédé sans prévenir. Personne ne le saura." }, message: "Le noir." }
      },
      {
        label: "Rien — trop rapide.",
        result: () => ({ gs: { isDead: true as const, deathCause: "Effondrement structural dans les ruines. La dalle a cédé sans prévenir. Personne ne le saura." }, message: "Le noir." })
      }
    ]
  }),
  () => ({
    type: 'event',
    description: "Trois silhouettes sortent de l'ombre en même temps. Armées, coordonnées. Quelqu'un attendait que tu entres là.",
    choices: [
      {
        label: "Se débattre violemment (25% réussite)",
        result: (gs) => Math.random() < 0.25
          ? { gs: { playerHp: Math.max(1, gs.playerHp - rng(20, 40)) }, message: "Tu t'en sors. Eux aussi. Tu fuis en sang." }
          : { gs: { isImprisoned: true as const, prisonDaysLeft: rng(2, 4), screen: 'prison' as const, credits: Math.max(0, gs.credits - rng(200, 500)), reputation: gs.reputation - 10 }, message: "Ils t'ont eu. Tu te réveilles en cellule, allégé de tes crédits." }
      },
      {
        label: "Se rendre — ne pas résister",
        result: (gs) => ({ gs: { isImprisoned: true as const, prisonDaysLeft: rng(1, 3), screen: 'prison' as const }, message: "Tu lèves les mains. Ils t'emmènent sans un mot." })
      }
    ]
  }),
]

const SCENES_MILITARY: Array<() => ExploreResult> = [
  () => ({ type: 'combat', depth: 0 }),
  () => ({
    type: 'event',
    description: "Un soldat te dévisage. Sa main se pose sur son arme. Il attend que tu justifies ta présence.",
    choices: [
      { label: "Présenter des papiers (50% succès)", result: (gs) => Math.random() < 0.5 + gs.reputation / 200 ? { gs: { reputation: gs.reputation + 5 }, message: "Il te laisse passer. +5 rép." } : { gs: { playerHp: Math.max(1, gs.playerHp - rng(10, 20)) }, message: "Il t'escorte de force dehors. -PV." } },
      { label: "Battre en retraite immédiatement", result: () => ({ gs: {}, message: "Tu recules. Il te suit des yeux jusqu'à ce que tu sois hors de vue." }) },
      { label: "Soudoyer (200cr)", result: (gs) => gs.credits >= 200 ? { gs: { credits: gs.credits - 200 }, message: "Il empoche sans un mot et regarde ailleurs." } : { gs: {}, message: "Pas assez de crédits. Tu recules." } }
    ]
  }),
  () => ({ type: 'loot', credits: rng(200, 600), description: "Une armurerie partiellement pillée. Il reste quelques crédits dans le tiroir-caisse." }),
  () => ({ type: 'item', item: 'Munitions', qty: 2, description: "Des munitions abandonnées dans un couloir désaffecté." }),
  () => ({ type: 'nothing', description: "Des salles vides. Des bottes qui résonnent quelque part. Tu ne t'attardes pas." }),
  () => ({ type: 'combat', depth: 0 }),
]

const SCENES_LUXURY: Array<() => ExploreResult> = [
  () => ({ type: 'loot', credits: rng(200, 700), description: "Un portefeuille oublié sur une banquette. Quelqu'un de riche ne le cherchera pas." }),
  () => ({
    type: 'event',
    description: "Un client fortuné t'aborde. Il veut discrétion et service. Il paie bien.",
    choices: [
      { label: "Accepter la mission vague (500cr)", result: (gs) => ({ gs: { credits: gs.credits + 500, reputation: gs.reputation - 5 }, message: "+500cr. Tu poses pas de questions. -5 rép morale." }) },
      { label: "Décliner poliment", result: () => ({ gs: {}, message: "Tu déclines. Il hoche la tête et disparaît." }) }
    ]
  }),
  () => ({ type: 'nothing', description: "Un bar open-bar. Tu te sers discrètement. Personne regarde." }),
  () => ({ type: 'item', item: 'Médicaments premium', qty: 1, description: "Une pharmacie de luxe avec de l'inventaire non sécurisé." }),
  () => ({
    type: 'event',
    description: "Un tournoi d'arène clandestin. Spectateurs. Enjeux élevés.",
    choices: [
      { label: "Parier 200cr sur toi-même", result: (gs) => gs.credits >= 200 ? Math.random() < 0.55 ? { gs: { credits: gs.credits - 200 + 500, reputation: gs.reputation + 10 }, message: "Tu gagnes. +500cr, +10 rép." } : { gs: { credits: gs.credits - 200, playerHp: Math.max(1, gs.playerHp - rng(20, 40)) }, message: "Tu perds. -200cr, -PV." } : { gs: {}, message: "Pas assez pour parier." } },
      { label: "Observer seulement", result: () => ({ gs: {}, message: "Spectacle gratuit. Tu repars." }) }
    ]
  }),
]

const SCENES_SCIENTIFIC: Array<() => ExploreResult> = [
  () => ({ type: 'item', item: 'Implants', qty: 1, description: "Un prototype d'implant dans une boîte non scellée. Quelqu'un a oublié de la ranger." }),
  () => ({
    type: 'event',
    description: "Un scientifique paniqué te court après. 'Aide-moi. Ils arrivent.' Il tient quelque chose d'important.",
    choices: [
      { label: "L'aider à fuir", result: (gs) => ({ gs: { reputation: gs.reputation + 20, credits: gs.credits + rng(400, 900), pastDecisions: addDecision(gs, 'aided-scientist'), journal: addJournal(gs, "J'ai aidé un scientifique en fuite. Il avait peur de quelque chose — ou de quelqu'un. Il m'a tout donné pour sa liberté.", 'decision') }, message: "+20 rép. Il te remercie avec tout ce qu'il a. +crédits." }) },
      { label: "Prendre ce qu'il tient et partir", result: (gs) => ({ gs: { credits: gs.credits + rng(500, 1200), reputation: gs.reputation - 15 }, message: "Tu prends l'objet. +crédits, -15 rép." }) },
      { label: "Ignorer", result: () => ({ gs: {}, message: "Tu passes. Ses cris s'éloignent." }) }
    ]
  }),
  () => ({ type: 'loot', credits: rng(100, 400), description: "Une subvention de recherche en crédits liquides non traçables. Dans un casier ouvert." }),
  () => ({ type: 'nothing', description: "Des laboratoires vides. Des expériences à moitié terminées. Personne pour te dire ce qu'elles étaient." }),
  () => ({ type: 'item', item: 'Données classifiées', qty: 1, description: "Un terminal de recherche avec des données non chiffrées. Tu copie ce que tu peux." }),
  () => ({ type: 'combat', depth: 0 }),
]

function pillarShift(gs: GameState, shifts: [string, number][]): Partial<GameState> {
  const cur = gs.pillarStanding ?? { cesarion: 0, raphazarus: 0, eliotis: 0, maxance: 0, alanossa: 0, scotty: 0 }
  const updated = { ...cur }
  for (const [key, delta] of shifts) {
    const k = key as keyof typeof cur
    updated[k] = Math.max(-100, Math.min(100, (updated[k] ?? 0) + delta))
  }
  return { pillarStanding: updated }
}

const SCENES_PILLAR_DILEMMAS: Array<() => ExploreResult> = [
  () => ({
    type: 'event',
    rare: true,
    description: "Un messager portant les couleurs de Cesarion te tends un paquet. 'Dépose ça au dépôt de Raphazarus. Il ne doit pas savoir que ça vient de nous.' Le paquet est scellé.",
    choices: [
      {
        label: "Livrer discrètement",
        hint: "+10 Cesarion, -5 Raphazarus",
        result: (gs) => ({ gs: pillarShift(gs, [['cesarion', 10], ['raphazarus', -5]]), message: "Livré. Cesarion te considère de confiance. Raphazarus... ne sait rien. Pour l'instant." }),
      },
      {
        label: "Prévenir Raphazarus",
        hint: "+10 Raphazarus, -10 Cesarion",
        result: (gs) => ({ gs: pillarShift(gs, [['raphazarus', 10], ['cesarion', -10]]), message: "Raphazarus apprécie ta loyauté. Le messager de Cesarion ne reviendra pas." }),
      },
      { label: "Refuser — pas tes affaires", result: () => ({ gs: {}, message: "Tu passes. Le messager disparaît dans la foule." }) },
    ],
  }),
  () => ({
    type: 'event',
    rare: true,
    description: "Eliotis a laissé des données de recherche dans un terminal ouvert. Maxance les cherche — il veut les détruire avant qu'elles ne circulent.",
    choices: [
      {
        label: "Copier les données pour Eliotis",
        hint: "+8 Eliotis, -8 Maxance",
        result: (gs) => ({ gs: pillarShift(gs, [['eliotis', 8], ['maxance', -8]]), message: "Tu sécurises les données. Eliotis saura que tu les as protégées." }),
      },
      {
        label: "Les donner à Maxance",
        hint: "+8 Maxance, -8 Eliotis",
        result: (gs) => ({ gs: pillarShift(gs, [['maxance', 8], ['eliotis', -8]]), message: "Maxance hoche la tête. Les données disparaissent. Eliotis ne saura jamais." }),
      },
      { label: "Les détruire — danger trop grand", hint: "-3 Eliotis, -3 Maxance", result: (gs) => ({ gs: pillarShift(gs, [['eliotis', -3], ['maxance', -3]]), message: "Personne n'aura rien. Ni merci, ni rancune." }) },
    ],
  }),
  () => ({
    type: 'event',
    rare: true,
    description: "Alanossa et Scotty se disputent le contrôle d'un couloir marchand. Chacun veut que tu témoignes en sa faveur devant le conseil de station.",
    choices: [
      {
        label: "Soutenir Alanossa",
        hint: "+12 Alanossa, -6 Scotty, +5 rép",
        result: (gs) => ({ gs: { ...pillarShift(gs, [['alanossa', 12], ['scotty', -6]]), reputation: gs.reputation + 5 }, message: "Alanossa remporte le vote. Scotty te lance un regard glacial. +5 rép." }),
      },
      {
        label: "Soutenir Scotty",
        hint: "+12 Scotty, -6 Alanossa, +5 rép",
        result: (gs) => ({ gs: { ...pillarShift(gs, [['scotty', 12], ['alanossa', -6]]), reputation: gs.reputation + 5 }, message: "Scotty contrôle le couloir. Alanossa n'oubliera pas. +5 rép." }),
      },
      { label: "Refuser de témoigner", hint: "-3 rép", result: (gs) => ({ gs: { reputation: gs.reputation - 3 }, message: "Les deux te trouvent lâche. -3 rép." }) },
    ],
  }),
  () => ({
    type: 'event',
    rare: true,
    description: "Un agent de Raphazarus te propose un contrat : saboter une livraison destinée à Alanossa. Paiement généreux.",
    choices: [
      {
        label: "Accepter le sabotage",
        hint: "+8 Raphazarus, -10 Alanossa, +400 cr",
        result: (gs) => ({ gs: { ...pillarShift(gs, [['raphazarus', 8], ['alanossa', -10]]), credits: gs.credits + 400 }, message: "La livraison n'arrivera jamais. +400 cr. Raphazarus est satisfait." }),
      },
      {
        label: "Prévenir Alanossa",
        hint: "+10 Alanossa, -8 Raphazarus",
        result: (gs) => ({ gs: pillarShift(gs, [['alanossa', 10], ['raphazarus', -8]]), message: "Alanossa renforce sa sécurité. Raphazarus perd un agent — et un peu de confiance en toi." }),
      },
      { label: "Ignorer les deux", result: () => ({ gs: {}, message: "Pas ton problème. La livraison suit son cours. Ou pas." }) },
    ],
  }),
  () => ({
    type: 'event',
    rare: true,
    description: "Tu surprends une conversation entre un lieutenant de Maxance et un contact de Cesarion. Un échange d'information clandestin. Ils ne t'ont pas vu.",
    choices: [
      {
        label: "Vendre l'info à Eliotis",
        hint: "+10 Eliotis, -5 Maxance, -5 Cesarion, +200 cr",
        result: (gs) => ({ gs: { ...pillarShift(gs, [['eliotis', 10], ['maxance', -5], ['cesarion', -5]]), credits: gs.credits + 200 }, message: "Eliotis paie bien pour ce genre de renseignement. +200 cr." }),
      },
      {
        label: "Faire chanter les deux",
        hint: "+500 cr, -5 Maxance, -5 Cesarion",
        result: (gs) => ({ gs: { ...pillarShift(gs, [['maxance', -5], ['cesarion', -5]]), credits: gs.credits + 500 }, message: "Ils paient. Cher. Mais ils ne t'oublieront pas." }),
      },
      { label: "Fermer les yeux", result: () => ({ gs: {}, message: "Tu n'as rien vu. C'est mieux comme ça." }) },
    ],
  }),
]

function getScenesForZone(type: string): Array<() => ExploreResult> {
  switch (type) {
    case 'dangerous': return [...SCENES_DANGEROUS, ...JSON_EXPLORE_DANGEROUS, ...JSON_EXPLORE_GENERIC, ...SCENES_PILLAR_DILEMMAS]
    case 'peaceful':  return [...SCENES_PEACEFUL,  ...JSON_EXPLORE_PEACEFUL,  ...JSON_EXPLORE_GENERIC, ...SCENES_PILLAR_DILEMMAS]
    case 'industrial':return [...SCENES_INDUSTRIAL,...JSON_EXPLORE_INDUSTRIAL,...JSON_EXPLORE_GENERIC, ...SCENES_PILLAR_DILEMMAS]
    case 'ruins':     return [...SCENES_RUINS,     ...JSON_EXPLORE_RUINS,     ...JSON_EXPLORE_GENERIC, ...SCENES_PILLAR_DILEMMAS]
    case 'military':  return [...SCENES_MILITARY,  ...JSON_EXPLORE_MILITARY,  ...JSON_EXPLORE_GENERIC, ...SCENES_PILLAR_DILEMMAS]
    case 'luxury':    return [...SCENES_LUXURY,    ...JSON_EXPLORE_LUXURY,    ...JSON_EXPLORE_GENERIC, ...SCENES_PILLAR_DILEMMAS]
    case 'scientific':return [...SCENES_SCIENTIFIC,...JSON_EXPLORE_SCIENTIFIC,...JSON_EXPLORE_GENERIC, ...SCENES_PILLAR_DILEMMAS]
    default:          return [...SCENES_DANGEROUS, ...JSON_EXPLORE_DANGEROUS, ...JSON_EXPLORE_GENERIC, ...SCENES_PILLAR_DILEMMAS]
  }
}

export function rollExplorationEvent(gs: GameState): ExploreResult {
  const station = getStation(gs.currentStation)
  const depth = gs.zoneDepth
  const danger = station.danger
  const fightsDone = gs.explorationFightsDone ?? 0

  // Garantie minimum 3 combats : forcer un combat tous les 2 niveaux
  // si le quota de combats n'est pas atteint
  if (depth >= 2 && depth % 2 === 0 && fightsDone < depth / 2) {
    return { type: 'combat', depth }
  }

  // Boss uniquement après 3 combats ET profondeur 7+, dans les zones dangereuses
  if (fightsDone >= 3 && depth >= 7 && danger >= 2 && Math.random() < 0.30) {
    return { type: 'boss' }
  }

  // Grand loot à profondeur élevée (après les combats)
  if (fightsDone >= 2 && depth >= 5 && Math.random() < 0.15) {
    return { type: 'loot', credits: rng(600, 2000), description: "Profondeur récompensée. Un vrai trésor au fond." }
  }

  // Alternance forcée : pas de combat deux fois de suite
  if (!gs.lastExploreWasCombat) {
    const scannerLevel = gs.shipModules?.scanner ?? 0
    const scannerReduction = scannerLevel >= 3 ? 0.20 : scannerLevel >= 2 ? 0.10 : 0
    const gardiensRep = gs.factionReputation?.gardiens ?? 0
    const gardiensReduction = gardiensRep >= 80 ? 0.15 : gardiensRep >= 50 ? 0.10 : gardiensRep >= 20 ? 0.05 : 0
    const traqueMod = (gs.runModifiers ?? []).includes('traque') ? 0.15 : 0
    const combatChance = Math.max(0, 0.15 + depth * 0.07 + danger * 0.08 - scannerReduction - gardiensReduction + traqueMod)
    if (Math.random() < combatChance) {
      return { type: 'combat', depth }
    }
  }

  const scenes = getScenesForZone(station.type)
  const base = pick(scenes)()

  // 12% de chance de trouver un fragment de lore pendant l'exploration
  if (base.type !== 'combat' && base.type !== 'boss' && Math.random() < 0.12) {
    const fragment = getRandomUndiscoveredFragment(gs.discoveredLore ?? [])
    if (fragment) return { ...base, loreFragmentId: fragment.id } as typeof base
  }

  return base
}

// ── HELPER GÉNÉRATION DE QUÊTE INLINE ────────────────────────────────────────
function quickQuest(gs: GameState, type: QuestType, giver: string, title: string, desc: string, targetStation: string, item?: string, credits = 1200, rep = 12): Quest {
  return { id: Math.random().toString(36).slice(2, 8), title, giver, giverStation: gs.currentStation, type, description: desc, targetStation, targetItem: item, creditReward: credits, repReward: rep }
}
function pickTarget(gs: GameState) {
  const list = getAccessibleStations(gs.currentStation).filter(s => s.name !== gs.currentStation)
  return list.length > 0 ? list[Math.floor(Math.random() * list.length)] : null
}

// ── WANDER : STATIONS SÉCURISÉES / PAISIBLES ─────────────────────────────────
export const WANDER_EVENTS_LOW: Array<(gs: GameState) => WanderEvent> = [

  (gs) => ({
    title: "Une enveloppe pour toi",
    description: "Un gamin te tend une enveloppe froissée. 'Quelqu'un a payé pour que je te la remette.' Il disparaît avant que tu puisses répondre.",
    choices: [
      { label: "Ouvrir l'enveloppe", result: (gs) => {
        const t = gs && pickTarget(gs)
        if (!t) return { gs: {}, message: "L'enveloppe est vide. Un coup monté ? Tu ne saurais pas dire." }
        const q = quickQuest(gs!, 'extraction', 'Expéditeur inconnu', `Colis sur ${t.name}`, `L'enveloppe contient des coordonnées précises et une instruction : récupérer le colis sur ${t.name} et le ramener ici. Pas de nom, pas d'explication.`, t.name, 'Pièces techniques', 1800, 15)
        return { gs: {}, message: `Des coordonnées sur ${t.name}. Quelqu'un veut que tu récupères quelque chose là-bas.`, quest: q }
      }},
      { label: "Brûler l'enveloppe sans l'ouvrir", result: () => ({ gs: {}, message: "Tu t'en débarrasses. Ça sentait le piège — ou pire, une obligation." }) }
    ]
  }),

  (gs) => ({
    title: "Vieux pilote et routes oubliées",
    description: "Un ancien pilote t'attrape par le bras dans le couloir. 'J'ai volé partout. Il y a une station que personne ne visite plus. Des raisons valables — et des ressources abandonnées.' Il veut juste qu'on s'en souvienne.",
    choices: [
      { label: "Écouter attentivement", result: (gs) => {
        const t = gs && pickTarget(gs)
        if (!t) return { gs: { reputation: gs!.reputation + 5 }, message: "Il te raconte. Intéressant mais pas directement exploitable. +5 rép." }
        const q = quickQuest(gs!, 'patrol', 'Vieux Drela', `Vérification sur ${t.name}`, `Le pilote t'a décrit une station laissée à l'abandon selon lui : ${t.name}. 'Vérifie si c'est toujours vrai. Si non, ça change tout.'`, t.name, undefined, 800, 10)
        return { gs: { reputation: gs!.reputation + 5 }, message: `Il décrit ${t.name} avec précision. Une piste concrète. +5 rép.`, quest: q }
      }},
      { label: "Remercier et partir", result: () => ({ gs: {}, message: "Il hoche la tête. Tu repars. Il retourne à son verre." }) }
    ]
  }),

  (gs) => ({
    title: "Marchande sous pression",
    description: "Une marchande ambulante emballe rapidement sa marchandise en te voyant. 'Les gars du quartier reviennent dans une heure. Si t'as besoin de quelque chose, c'est maintenant ou jamais.'",
    choices: [
      { label: "Acheter des médicaments (120cr)", result: (gs) => gs && gs.credits >= 120
        ? { gs: { credits: gs.credits - 120, cargo: { ...gs.cargo, 'Médicaments': (gs.cargo['Médicaments'] ?? 0) + 2 } }, message: "Elle t'emballe deux boîtes vite fait. -120cr, +2 Médicaments." }
        : { gs: {}, message: "Pas les crédits. Elle hoche la tête et remballe." }
      },
      { label: "Lui demander pourquoi elle est pressée", result: (gs) => {
        const t = gs && pickTarget(gs)
        if (!t) return { gs: { reputation: gs!.reputation + 8 }, message: "Elle te raconte sa situation. Difficile. Tu l'aides un peu. +8 rép." }
        const q = quickQuest(gs!, 'delivery', 'Marchande', `Livraison urgente`, `La marchande a du matériel bloqué sur ${t.name}. Elle ne peut pas s'y rendre. 'Si tu passes par là, tu me rendrais un service immense.' Elle paye bien.`, t.name, 'Médicaments', 1400, 18)
        return { gs: { reputation: gs!.reputation + 8 }, message: `Elle a besoin qu'on lui livre quelque chose sur ${t.name}. +8 rép pour l'écoute.`, quest: q }
      }},
      { label: "Ignorer et continuer", result: () => ({ gs: {}, message: "Tu passes. C'est pas ton problème." }) }
    ]
  }),

  (gs) => ({
    title: "Dispute de marchands",
    description: "Deux marchands se hurlent dessus. L'un accuse l'autre d'avoir falsifié des données de livraison. Ils cherchent un témoin neutre — ou quelqu'un qui tranche.",
    choices: [
      { label: "Arbitrer sérieusement", result: (gs) => {
        const ok = Math.random() < 0.45 + (gs ? gs.reputation / 300 : 0)
        if (ok) {
          const t = gs && pickTarget(gs)
          const q = t ? quickQuest(gs!, 'delivery', 'Marchand reconnaissant', `Livraison pour service rendu`, `Le marchand que tu as défendu te confie une livraison. 'Je me souviens des gens qui m'ont aidé.' Direction ${t.name}.`, t.name, 'Pièces techniques', 1600, 15) : undefined
          return { gs: { reputation: (gs?.reputation ?? 0) + 12 }, message: `Tu tranches. L'un a tort, il le sait. Le gagnant te remercie. +12 rép.${q ? ` Il te propose aussi du travail.` : ''}`, quest: q ?? undefined }
        }
        return { gs: { reputation: (gs?.reputation ?? 0) - 5 }, message: "Tu prends position et les deux te tombent dessus. Parfois l'arbitre perd aussi. -5 rép." }
      }},
      { label: "Prendre le parti du plus fort", result: (gs) => ({ gs: { reputation: (gs?.reputation ?? 0) - 8, credits: (gs?.credits ?? 0) + rng(80, 200) }, message: "Il te glisse quelques crédits discrètement. Le perdant t'en veut. -8 rép." }) },
      { label: "Passer ton chemin", result: () => ({ gs: {}, message: "Tu contournes. C'est pas ton cirque." }) }
    ]
  }),

  (gs) => ({
    title: "Mécanicien en manque de pièces",
    description: "Un mécano t'interpelle depuis son atelier improvisé. 'Je cherche quelqu'un qui peut aller chercher des pièces sur une autre station. Je paye bien, j'ai pas le temps d'y aller moi-même.'",
    choices: [
      { label: "Accepter d'écouter", result: (gs) => {
        const t = gs && pickTarget(gs)
        if (!t) return { gs: {}, message: "Il n'a pas de pièces à faire venir. Peut-être une autre fois." }
        const q = quickQuest(gs!, 'delivery', 'Mécanicien local', `Pièces pour l'atelier`, `Le mécano a besoin de composants spécifiques depuis ${t.name}. 'C'est urgent, mon client attend depuis trois jours.' Paiement à la livraison.`, t.name, 'Composants électroniques', 1300, 10)
        return { gs: {}, message: `Il te donne les détails. Des composants depuis ${t.name}. Mission claire, paiement honnête.`, quest: q }
      }},
      { label: "Pas le temps", result: () => ({ gs: {}, message: "Il hausse les épaules. Il trouvera quelqu'un d'autre." }) }
    ]
  }),

  (gs) => ({
    title: "Ivrogne avec de bonnes infos",
    description: "Un type éméché dans un coin marmonne des noms, des stations, des chiffres. Il a l'air d'avoir travaillé pour quelqu'un d'important — et d'avoir trop bu pour le taire.",
    choices: [
      { label: "Écouter attentivement (et payer à boire, 40cr)", result: (gs) => {
        if (!gs || gs.credits < 40) return { gs: {}, message: "Pas assez de crédits pour l'entretenir. Il s'endort." }
        const t = pickTarget(gs)
        if (!t) return { gs: { credits: gs.credits - 40 }, message: "Il délire. Rien d'exploitable. -40cr pour rien." }
        const q = quickQuest(gs, 'patrol', 'Source anonyme', `Vérification : ${t.name}`, `L'ivrogne a mentionné des activités inhabituelles sur ${t.name}. Ça mérite vérification. 'Si c'est vrai, quelqu'un paiera cher pour le savoir.'`, t.name, undefined, 900, 8)
        return { gs: { credits: gs.credits - 40 }, message: `Il mentionne ${t.name} plusieurs fois. Quelque chose s'y passe. -40cr, piste intéressante.`, quest: q }
      }},
      { label: "L'ignorer", result: () => ({ gs: {}, message: "Il s'endort tout seul. Probablement rien d'utile." }) },
      { label: "Le fouiller discrètement (-rép)", result: (gs) => ({ gs: { credits: (gs?.credits ?? 0) + rng(40, 120), reputation: (gs?.reputation ?? 0) - 10 }, message: `Quelques crédits dans ses poches. Il se réveillera sans savoir. -10 rép.` }) }
    ]
  }),

  (_gs) => ({
    title: "Un marchand intercepte ton chemin",
    description: "Il se lève de sa table avant même que tu passes devant lui. 'J'ai un contrat à proposer — du transport, rien de compliqué. Mais je veux un bon prix et pas de questions.' Il a l'air pressé.",
    choices: [
      { label: "Écouter ce qu'il propose", result: () => ({ type: 'negotiation' as const, message: '' }) },
      { label: "Décliner poliment", result: () => ({ gs: {}, message: "Il hausse les épaules et se rassied. Une autre fois peut-être." }) },
    ],
  }),

  (_gs) => ({
    title: "Courtier cherche un pilote fiable",
    description: "Une femme en tailleur sombre t'observe depuis le bar. Elle pose son verre et vient vers toi. 'On m'a dit que tu faisais de bonnes liaisons. J'ai une marchandise délicate. Les termes sont à négocier — maintenant, ici.'",
    choices: [
      { label: "S'asseoir et négocier", result: () => ({ type: 'negotiation' as const, message: '' }) },
      { label: "Tu n'es pas intéressé", result: (gs) => ({ gs: { reputation: (gs?.reputation ?? 0) + 2 }, message: "Elle note ton refus avec une légère surprise. +2 rép (elle respecte les gens qui savent dire non)." }) },
    ],
  }),

]

// ── WANDER : STATIONS RISQUÉES / DANGEREUSES ──────────────────────────────────
export const WANDER_EVENTS_MID: Array<(gs: GameState) => WanderEvent> = [

  (gs) => ({
    title: "Chasseur de primes avec une liste",
    description: "Un type te fixe depuis l'entrée. Il a une liste plastifiée. Il vérifie ta tête. Son regard s'attarde.",
    choices: [
      { label: "Fuir discrètement", result: () => Math.random() < 0.55
        ? { gs: {}, message: "Tu te fondes dans la foule. Il te perd de vue." }
        : { gs: { playerHp: Math.max(1, (gs?.playerHp ?? 50) - rng(12, 28)) }, message: "Il te rattrape dans une ruelle. Courte bagarre. Tu t'en sors, lui aussi. -PV." }
      },
      { label: "L'affronter", result: () => ({ type: 'combat' as const, message: "Il sort son arme. Combat." }) },
      { label: "Négocier — proposer une collaboration", result: (gs) => {
        const t = gs && pickTarget(gs)
        if (!t) return { gs: { credits: (gs?.credits ?? 0) - 300 }, message: "Il accepte de te laisser passer. -300cr. Mauvais investissement." }
        const chance = Math.random() < 0.5 + (gs ? gs.reputation / 300 : 0)
        if (chance) {
          const q = quickQuest(gs!, 'bounty', 'Chasseur Besh', `Prime partagée — ${t.name}`, `Le chasseur t'a proposé une cible commune sur ${t.name}. 'Je prends la moitié, tu prends l'autre.' Il a l'air sérieux.`, t.name, undefined, 3500, 25)
          return { gs: { reputation: gs!.reputation + 5 }, message: `Il hésite, puis tend une main. Il partage une prime sur ${t.name}. +5 rép.`, quest: q }
        }
        return { gs: { credits: gs!.credits - 300 }, message: "Il n'est pas intéressé par la collaboration. -300cr pour qu'il regarde ailleurs." }
      }},
      { label: "Soudoyer directement (300cr)", result: (gs) => gs && gs.credits >= 300
        ? { gs: { credits: gs.credits - 300 }, message: "-300cr. Il range sa liste sans un mot. Transaction." }
        : { gs: {}, message: "Pas les crédits. Il continue de te regarder." }
      }
    ]
  }),

  (gs) => ({
    title: "Contact en imperméable",
    description: "Un homme s'approche sans te regarder dans les yeux. 'J'ai un colis. J'ai besoin d'un transporteur qui pose pas de questions. Paiement correct, risque modéré.' Il te tend une enveloppe avec les détails.",
    choices: [
      { label: "Prendre l'enveloppe et écouter", result: (gs) => {
        const t = gs && pickTarget(gs)
        if (!t) return { gs: {}, message: "Pas de destination exploitable. Il repart." }
        const q = quickQuest(gs!, 'delivery', 'Contact anonyme', `Transport discret`, `Le contact t'a confié un colis scellé à livrer sur ${t.name}. Il ne dit pas ce qu'il y a dedans. 'Discrétion totale. Paiement à l'arrivée.'`, t.name, 'Pièces de contrebande', 2800, 5)
        return { gs: { cargo: { ...(gs?.cargo ?? {}), 'Pièces de contrebande': ((gs?.cargo ?? {})['Pièces de contrebande'] ?? 0) + 1 } }, message: `Colis reçu. Destination : ${t.name}. Ce qu'il y a dedans, tu sais pas — et tu préfères pas savoir.`, quest: q }
      }},
      { label: "Demander ce qu'il y a dans le colis", result: () => ({ gs: {}, message: "Il reprend l'enveloppe. 'T'es pas le bon profil.' Il disparaît." }) },
      { label: "Refuser catégoriquement", result: () => ({ gs: {}, message: "Il repart sans insister. Ces gens-là ont des options." }) }
    ]
  }),

  (gs) => ({
    title: "Caïd du quartier",
    description: "Le caïd local se plante devant toi avec deux bras musclés en arrière-plan. 'Péage de passage. Ici c'est mon territoire.' Son regard dit qu'il l'a déjà fait mille fois.",
    choices: [
      { label: "Payer (200cr)", result: (gs) => {
        if (!gs || gs.credits < 200) return { gs: {}, message: "Pas les crédits. Il devient plus menaçant." }
        const t = pickTarget(gs)
        const q = t ? quickQuest(gs, 'sabotage', 'Caïd Orva', `Coup de main pour Orva`, `Le caïd t'a laissé passer et a gardé ton nom. 'Si t'as besoin de boulot propre, reviens me voir.' Il a une opération à ${t.name} qui nécessite quelqu'un d'extérieur.`, t.name, undefined, 2200, -5) : undefined
        return { gs: { credits: gs.credits - 200 }, message: `-200cr. Il te laisse passer. 'La prochaine fois t'auras peut-être quelque chose à faire pour moi.'${q ? ` Il te donne une piste.` : ''}`, quest: q ?? undefined }
      }},
      { label: "Tenir tête", result: (gs) => Math.random() < 0.35 + (gs ? gs.reputation / 250 : 0)
        ? { gs: { reputation: (gs?.reputation ?? 0) + 15 }, message: "Il recule. Il connaît les gens qui savent pas plier. +15 rép." }
        : { type: 'combat' as const, message: "Il fait signe à ses hommes." }
      },
      { label: "Proposition de travail à la place", result: (gs) => {
        const t = gs && pickTarget(gs)
        if (!t || Math.random() < 0.4) return { gs: {}, message: "Il rit. 'T'as du culot.' Il te laisse passer gratis. Cette fois." }
        const q = quickQuest(gs!, 'revenge', 'Caïd Orva', `Règlement de comptes`, `Le caïd a accepté l'échange. Il te donne une cible sur ${t.name} à la place du péage. 'Fais-leur comprendre qu'ils m'appartiennent aussi.'`, t.name, undefined, 1800, 12)
        return { gs: {}, message: `Il réfléchit et accepte. Une mission sur ${t.name} en échange du péage.`, quest: q }
      }},
      { label: "Intimider", result: (gs) => ({ gs: { reputation: (gs?.reputation ?? 0) + 25 }, message: "Ton ton le fait reculer d'un pas. Il te laisse passer. +25 rép." }), available: (gs) => gs.class.name === 'Seigneur de guerre' }
    ]
  }),

  (gs) => ({
    title: "Transfuge de faction",
    description: "Une femme te tire dans une alcôve. Elle transpire. 'Je suis recherchée par les miens. Je peux te donner des infos en échange. Des vraies infos. Sur une cible que beaucoup veulent.'",
    choices: [
      { label: "L'écouter", result: (gs) => {
        const t = gs && pickTarget(gs)
        if (!t) return { gs: { reputation: gs!.reputation + 10 }, message: "Elle te parle. Des noms, des lieux. Rien d'immédiatement exploitable, mais +10 rép." }
        const q = quickQuest(gs!, 'bounty', 'Transfuge', `Prime — cible identifiée`, `La transfuge t'a donné une adresse sur ${t.name} et un nom. 'Cette personne a du sang sur les mains. Et quelqu'un paie pour que ça s'arrête.' Elle n'en dit pas plus.`, t.name, undefined, 4500, 30)
        return { gs: { reputation: gs!.reputation + 10 }, message: `Elle te donne une cible sur ${t.name}. Précise. Documentée. +10 rép.`, quest: q }
      }},
      { label: "La livrer aux autorités (+crédits, -rép)", result: (gs) => ({ gs: { credits: (gs?.credits ?? 0) + rng(400, 900), reputation: (gs?.reputation ?? 0) - 20, moralTags: [...(gs?.moralTags ?? []), 'délateur'], pastDecisions: addDecision(gs!, 'betrayed-transfuge'), journal: addJournal(gs!, "J'ai livré une transfuge aux autorités. Elle m'a regardé partir sans un mot. Ce regard ne part pas.", 'decision') }, message: "+crédits. Elle te regarde partir. Ce regard restera. -20 rép, tag 'délateur'." }) },
      { label: "Refuser de t'impliquer", result: () => ({ gs: {}, message: "Elle disparaît dans la foule. Tu continues. Peut-être la bonne décision." }) }
    ]
  }),

  (gs) => ({
    title: "Informateur avec une prime",
    description: "Un homme nerveux s'approche et parle vite. 'T'as l'air capable. Il y a une prime ouverte sur une cible dans le secteur. Les grandes maisons chassent pas sur ce terrain-là. Toi oui, si t'es intéressé.'",
    choices: [
      { label: "Écouter les détails", result: (gs) => {
        const t = gs && pickTarget(gs)
        if (!t) return { gs: {}, message: "Il ne peut pas te donner de détails exploitables. 'Désolé, mauvais timing.'" }
        const q = quickQuest(gs!, 'bounty', 'Informateur Fen', `Chasse — ${t.name}`, `L'informateur t'a donné une cible sur ${t.name}. 'Fais vite. D'autres chasseurs sont sur la piste.' Sa nervosité semble sincère.`, t.name, undefined, 3800, 22)
        return { gs: {}, message: `Cible identifiée sur ${t.name}. Une prime sérieuse si tu arrives le premier.`, quest: q }
      }},
      { label: "Lui demander quelle part il veut", result: (gs) => {
        if (Math.random() < 0.5) {
          const t = gs && pickTarget(gs)
          if (t) {
            const q = quickQuest(gs!, 'patrol', 'Informateur Fen', `Surveillance : ${t.name}`, `L'informateur veut d'abord une présence active sur ${t.name}. 'Vérifie que la cible est encore là-bas. Je partage la prime après.'`, t.name, undefined, 1200, 8)
            return { gs: {}, message: `Il propose d'abord une reco sur ${t.name} avant de révéler la vraie cible.`, quest: q }
          }
        }
        return { gs: {}, message: "Il te regarde et repart. 'T'es trop prudent pour ce boulot.'" }
      }},
      { label: "Passer ton chemin", result: () => ({ gs: {}, message: "Tu passes. Il cherchera quelqu'un d'autre." }) }
    ]
  }),

  (_gs) => ({
    title: "Couloir de transit non sécurisé",
    description: "Un technicien de dock te hèle depuis une passerelle. 'Si tu repars bientôt, évite la route nord — il y a des débris flottants depuis l'explosion d'hier. Fais gaffe.' Il te tend une carte de secteur annotée à la main.",
    choices: [
      { label: "Prendre la carte et naviguer maintenant", result: () => ({ type: 'navigation' as const, message: '' }) },
      { label: "Le remercier et passer son chemin", result: (gs) => ({ gs: { reputation: (gs?.reputation ?? 0) + 3 }, message: "Tu notes l'info mentalement. +3 rép — les gens du coin te font confiance." }) },
    ],
  }),

  (_gs) => ({
    title: "Pilote en détresse dans le secteur",
    description: "Le signal de détresse est faible mais clair. Quelqu'un est coincé entre deux zones instables. Ta route passe par là de toute façon. Tu peux tenter la navigation — ou ignorer.",
    choices: [
      { label: "Tenter la navigation pour l'aider", result: () => ({ type: 'navigation' as const, message: '' }) },
      { label: "Ignorer — trop risqué", result: (gs) => ({ gs: { reputation: (gs?.reputation ?? 0) - 5 }, message: "Tu coupes le signal. Il s'arrangera. -5 rép." }) },
    ],
  }),

]

// ── WANDER : ZONES DE GUERRE / TRÈS DANGEREUSES ───────────────────────────────
export const WANDER_EVENTS_HIGH: Array<(gs: GameState) => WanderEvent> = [

  (gs) => ({
    title: "Assassin embusqué — mauvaise surprise",
    description: "Tu le vois dans le reflet d'un panneau métallique. Une fraction de seconde. Il a un couteau. Il attendait quelqu'un — peut-être toi, peut-être pas.",
    choices: [
      { label: "Esquiver et fuir", result: () => Math.random() < 0.5
        ? { gs: {}, message: "Tu te jettes sur le côté. Il rate. Tu cours. Il n'insiste pas." }
        : { gs: { playerHp: Math.max(1, (gs?.playerHp ?? 50) - rng(18, 40)) }, message: "Il t'effleure. Douloureux. Tu t'en sors. -PV." }
      },
      { label: "Se retourner et combattre", result: () => ({ type: 'combat' as const, message: "Il se retourne. Tu te bats." }) },
      { label: "L'immobiliser et interroger", result: (gs) => {
        if (Math.random() < 0.6) {
          const t = gs && pickTarget(gs)
          const q = t ? quickQuest(gs!, 'bounty', 'Source : assassin capturé', `Commanditaire — ${t.name}`, `L'assassin a parlé sous pression. Quelqu'un de ${t.name} a commandé l'opération. Peut-être pas toi comme cible — mais quelqu'un dans les parages. La piste est chaude.`, t.name, undefined, 5000, 35) : undefined
          return { gs: { playerHp: Math.max(1, gs!.playerHp - rng(8, 18)), reputation: gs!.reputation + 15 }, message: `Il parle. Une cible sur ${t?.name ?? 'une destination inconnue'}. +15 rép, -PV (courte lutte).`, quest: q ?? undefined }
        }
        return { gs: { playerHp: Math.max(1, gs!.playerHp - rng(15, 30)) }, message: "Il résiste. Tu l'as eu mais il dit rien. -PV. Rien d'exploitable." }
      }}
    ]
  }),

  (gs) => ({
    title: "Recrutement de faction — pas une question",
    description: "Trois hommes t'encerclent. L'un porte un emblème de faction. 'On cherche des indépendants compétents. T'as l'air d'en être un. C'est une proposition — mais le genre qu'on refuse pas facilement.'",
    choices: [
      { label: "Accepter une mission test", result: (gs) => {
        const t = gs && pickTarget(gs)
        if (!t) return { gs: { credits: (gs?.credits ?? 0) + 400 }, message: "Ils n'ont rien de concret à te donner ici. Ils te filent une avance. +400cr." }
        const q = quickQuest(gs!, 'sabotage', 'Faction locale', `Mission test — ${t.name}`, `Les recruteurs t'ont donné une mission de démonstration sur ${t.name}. 'Montre-nous que tu sais faire le travail. Résultat attendu : un adversaire neutralisé sur place.'`, t.name, undefined, 3000, -8)
        return { gs: { credits: gs!.credits + 400 }, message: `Une mission test sur ${t.name}. Si tu réussis, ils reviennent avec une proposition sérieuse. +400cr d'avance.`, quest: q }
      }},
      { label: "Négocier — exiger une prime en échange d'une info", result: (gs) => {
        const t = gs && pickTarget(gs)
        if (!t || Math.random() < 0.4) return { gs: { playerHp: Math.max(1, (gs?.playerHp ?? 50) - rng(15, 35)) }, message: "Ils apprécient pas la négociation. Courte leçon. -PV." }
        const q = quickQuest(gs!, 'extraction', 'Faction locale', `Récupération pour la faction`, `Les recruteurs ont accepté le deal. Ils veulent que tu récupères quelque chose sur ${t.name} et tu récupères ta prime. 'Personne d'autre que toi pour ça.'`, t.name, 'Données classifiées', 4200, 10)
        return { gs: {}, message: `Ils acceptent le deal à contrecœur. Une extraction sur ${t.name} contre une bonne prime.`, quest: q }
      }},
      { label: "Refuser fermement", result: () => Math.random() < 0.45
        ? { gs: {}, message: "Ils te fixent longtemps. Puis ils s'écartent. 'T'as du caractère. On revient.'" }
        : { gs: { playerHp: Math.max(1, (gs?.playerHp ?? 50) - rng(22, 45)) }, message: "Le refus passe mal. Ils t'en donnent un avant-goût. -PV." }
      }
    ]
  }),

  (gs) => ({
    title: "Double agent épuisé",
    description: "Un homme dans un couloir sombre te fait signe. Ses yeux sont ceux de quelqu'un qui dort pas depuis longtemps. 'J'ai des infos sur une opération en cours. Je peux pas les exploiter moi-même. Quelqu'un peut — contre paiement.'",
    choices: [
      { label: "Acheter l'information (600cr)", result: (gs) => {
        if (!gs || gs.credits < 600) return { gs: {}, message: "Pas les crédits. Il repart sans un mot." }
        const t = pickTarget(gs)
        if (!t) return { gs: { credits: gs.credits - 600, reputation: gs.reputation + 20 }, message: "-600cr. L'info est floue mais pertinente. +20 rép dans le milieu." }
        const q = quickQuest(gs, 'bounty', 'Double agent', `Cible prioritaire — ${t.name}`, `Le double agent t'a vendu des infos précises sur une cible haute-valeur à ${t.name}. 'Fais vite avant que les choses changent.' L'info a l'air fiable.`, t.name, undefined, 6000, 40)
        return { gs: { credits: gs.credits - 600, reputation: gs.reputation + 20 }, message: `-600cr. Cible identifiée sur ${t.name}. Prime élevée si tu agis vite. +20 rép.`, quest: q }
      }},
      { label: "Le renvoyer vers les autorités compétentes", result: (gs) => ({ gs: { reputation: (gs?.reputation ?? 0) + 8 }, message: "Il hoche la tête. Il savait que ça pouvait finir comme ça. +8 rép pour l'honnêteté." }) },
      { label: "Tenter de l'arnaquer (–rép)", result: (gs) => Math.random() < 0.5
        ? { gs: { reputation: (gs?.reputation ?? 0) - 15 }, message: "Il réalise avant que tu aies le temps. Il disparaît. -15 rép. Ces gens partagent les infos." }
        : { gs: { credits: (gs?.credits ?? 0) + rng(200, 500), reputation: (gs?.reputation ?? 0) - 20 }, message: "+quelques crédits. -20 rép. Il se souviendra." }
      }
    ]
  }),

  (gs) => ({
    title: "Mercenaire à terre",
    description: "Un mercenaire est appuyé contre le mur, une main sur le flanc. Du sang. Il lève les yeux. 'J'ai besoin d'aide. T'as l'air de savoir ce que tu fais. Je peux payer — pas en crédits, en informations.'",
    choices: [
      { label: "L'aider (utiliser des médicaments)", result: (gs) => {
        if (!gs || (gs.cargo['Médicaments'] ?? 0) <= 0) return { gs: {}, message: "T'as pas de médicaments. Il hoche la tête. 'Pas ta faute.'" }
        const t = pickTarget(gs)
        const newCargo: typeof gs.cargo = { ...gs.cargo, 'Médicaments': (gs.cargo['Médicaments'] ?? 1) - 1 }
        if ((newCargo['Médicaments'] ?? 0) <= 0) delete (newCargo as Record<string, number>)['Médicaments']
        const q = t ? quickQuest(gs, 'revenge', 'Mercenaire Cador', `Représailles — ${t.name}`, `Le mercenaire t'a donné le nom de ceux qui l'ont tendu un piège sur ${t.name}. 'Si tu passes par là-bas, rends-leur la politesse.' Reconnaissance en retour.`, t.name, undefined, 2500, 20) : undefined
        return { gs: { reputation: gs.reputation + 18, cargo: newCargo, pastDecisions: addDecision(gs, 'saved-mercenary'), journal: addJournal(gs, "J'ai soigné un mercenaire blessé dans les décombres. Il s'appelait Cador. Il m'a donné une piste en échange.", 'decision') }, message: `Tu soignes. Il tient. En échange, il te donne une piste sur ${t?.name ?? 'une destination'}. +18 rép, -1 Médicaments.`, quest: q ?? undefined }
      }},
      { label: "L'ignorer et passer", result: () => ({ gs: {}, message: "Tu passes. Il ne dit rien. Cette image restera." }) },
      { label: "Le fouiller s'il perd connaissance (–rép)", result: (gs) => ({ gs: { credits: (gs?.credits ?? 0) + rng(150, 400), reputation: (gs?.reputation ?? 0) - 18, moralTags: [...(gs?.moralTags ?? []), 'opportuniste'], pastDecisions: addDecision(gs!, 'pillaged-wounded'), journal: addJournal(gs!, "J'ai fouillé un blessé qui perdait connaissance. Je ne suis pas fier de ça.", 'decision') }, message: "+crédits. -18 rép. Tag 'opportuniste'. Tu savais ce que tu faisais." }) }
    ]
  }),

  (gs) => ({
    title: "Information sur Alanossa",
    description: "Une source te contacte dans l'ombre. 'J'ai des infos sur Alanossa. Des vrais mouvements, pas des rumeurs. Ça se paie — mais ça vaut le prix.'",
    choices: [
      { label: "Acheter les infos (700cr)", result: (gs) => {
        if (!gs || gs.credits < 700) return { gs: {}, message: "Pas assez. Elle repart." }
        const q = quickQuest(gs, 'bounty', 'Source proche d\'Alanossa', `Prime — Alanossa`, `La source t'a donné une fenêtre d'opportunité sur Arc Ouest Apocalypse. 'Alanossa sera exposée. Brièvement.' Une prime exceptionnelle attend celui qui agit.`, 'Arc Ouest Apocalypse', undefined, 8000, 50)
        return { gs: { credits: gs.credits - 700, reputation: gs.reputation + 30 }, message: `Alanossa sur Arc Ouest Apocalypse. Fenêtre courte. -700cr, +30 rép dans le milieu.`, quest: q }
      }},
      { label: "Négocier le prix", result: (gs) => Math.random() < 0.4
        ? { gs: {}, message: "Elle n'est pas d'humeur. Elle repart. Ces informations ont un prix fixe." }
        : { gs: { credits: (gs?.credits ?? 0) - 400, reputation: (gs?.reputation ?? 0) + 15 }, message: "-400cr. Elle accepte un résumé partiel. +15 rép." }
      },
      { label: "Refuser — trop risqué", result: () => ({ gs: {}, message: "Elle hausse les épaules. 'Quelqu'un d'autre prendra la prime.'" }) }
    ]
  }),

  // ── PIÈGES ZONES EXTRÊMES ──
  (gs) => ({
    title: "Embuscade — aucun signe avant-coureur",
    description: "Tu marches. Il n'y a personne. Et puis il y a quelqu'un. Un sac sur la tête. Des mains dans le dos. Quelqu'un a fait ça des milliers de fois.",
    choices: [
      {
        label: "Se débattre au hasard (15% réussite)",
        result: (gs) => Math.random() < 0.15
          ? { gs: { playerHp: Math.max(1, (gs?.playerHp ?? 50) - rng(30, 50)) }, message: "Tu te dégages dans un chaos total. Tu cours. Tu saignes. Tu es dehors. -PV." }
          : { gs: { isImprisoned: true, prisonDaysLeft: rng(3, 5), screen: 'prison' as const, credits: Math.max(0, (gs?.credits ?? 0) - rng(400, 900)) }, message: "Tu te réveilles en cellule. Portefeuille vide. Personne ne sait que tu es là." }
      },
      {
        label: "Rester immobile — ne pas provoquer",
        result: (gs) => ({ gs: { isImprisoned: true, prisonDaysLeft: rng(2, 4), screen: 'prison' as const, credits: Math.max(0, (gs?.credits ?? 0) - rng(200, 600)) }, message: "Ils t'embarquent. Méthodique. Tu perds des crédits et ta liberté." })
      }
    ]
  }),

  (gs) => ({
    title: "Cargaison piégée",
    description: "Une caisse abandonnée dans un couloir. Trop bien placée. Tu t'en approches. Tu t'accroupis. Tu l'ouvres.",
    choices: [
      {
        label: "Ouvrir",
        result: (gs) => {
          const roll = Math.random()
          if (roll < 0.30) return { gs: { isDead: true, deathCause: "Cargaison piégée. L'explosion t'a pris par surprise dans un couloir de zone dangereuse." }, message: "Lumière blanche. Bruit. Plus rien." }
          if (roll < 0.65) return { gs: { playerHp: Math.max(1, (gs?.playerHp ?? 50) - rng(30, 60)), isImprisoned: true, prisonDaysLeft: 2, screen: 'prison' as const }, message: "Gaz soporifique. Tu te réveilles en cellule, désorienté." }
          return { gs: { credits: (gs?.credits ?? 0) + rng(400, 1200) }, message: "De vrais crédits. Tu ne comprends pas. Tu ne cherches pas à comprendre." }
        }
      },
      {
        label: "Reculer et ne pas y toucher",
        result: () => ({ gs: {}, message: "Tu t'éloignes. Quelqu'un d'autre aura peut-être moins de self-control." })
      }
    ]
  }),

  (gs) => ({
    title: "Vérification d'identité — agents en civil",
    description: "Deux inconnus te bloquent poliment le passage. 'Vos papiers.' Ils n'ont aucun insigne visible. Ils n'en ont pas besoin — leurs attitudes suffisent.",
    choices: [
      {
        label: "Coopérer — donner ses papiers",
        result: (gs) => {
          const roll = Math.random()
          if (roll < 0.35) return { gs: { pendingInterrogation: { faction: 'Agents de faction inconnue', captureStation: gs?.currentStation ?? '' }, screen: 'interrogation' as const }, message: "Ils regardent tes papiers et font signe à un troisième homme. Direction poste d'interrogatoire." }
          return { gs: { reputation: (gs?.reputation ?? 0) - 5 }, message: "Ils vérifient et te laissent passer. Un dossier vient d'être ouvert sur toi, quelque part." }
        }
      },
      {
        label: "Refuser et partir",
        result: (gs) => Math.random() < 0.4
          ? { gs: {}, message: "Ils te laissent partir. Cette fois." }
          : { gs: { isImprisoned: true, prisonDaysLeft: rng(1, 3), screen: 'prison' as const, playerHp: Math.max(1, (gs?.playerHp ?? 50) - rng(15, 30)) }, message: "Refus de coopérer. Ils t'ont plaqué au sol avant que tu finisses ta phrase." }
      },
      {
        label: "Fuir immédiatement",
        result: (gs) => Math.random() < 0.50
          ? { gs: {}, message: "Tu cours. Ils ne te suivent pas. Peut-être qu'ils avaient autre chose à faire." }
          : { gs: { isImprisoned: true, prisonDaysLeft: rng(2, 4), screen: 'prison' as const }, message: "La fuite était la mauvaise réponse. Il y en avait d'autres dans le couloir." }
      }
    ]
  }),

]

export interface WanderEvent {
  title: string
  description: string
  choices: WanderChoice[]
}

// ── EVENTS MAUVAISE RÉPUTATION (rep < -20) ───────────────────────────────────
export const WANDER_EVENTS_BAD_REP: Array<(gs: GameState) => WanderEvent> = [

  (gs) => ({
    title: "Prix pour ta tête",
    description: `Un inconnu te suit depuis l'entrée. Quand tu te retournes, il sourit. "T'as ${Math.abs(gs.reputation)} de réputation en moins. Quelqu'un paie bien pour savoir où tu es." Il montre discrètement une arme.`,
    choices: [
      { label: "Payer pour qu'il se taise (300 cr)", result: (gs) => gs && gs.credits >= 300
        ? { gs: { credits: gs.credits - 300 }, message: "Il empoche. Il disparaît. Pour combien de temps ?" }
        : { gs: { playerHp: Math.max(1, (gs?.playerHp ?? 50) - rng(15, 30)) }, message: "Pas assez. Il t'envoie un avertissement physique avant de disparaître." }
      },
      { label: "Appeler son bluff", result: (gs) => {
        const success = Math.random() < 0.40
        return success
          ? { gs: {}, message: "Il recule. C'était un bluff. Mais maintenant il sait que tu tiens bon." }
          : { gs: { playerHp: Math.max(1, (gs?.playerHp ?? 50) - rng(20, 40)), reputation: (gs?.reputation ?? 0) - 10 }, message: "C'était pas un bluff. Tu le sors de justesse mais tu prends cher." }
      }},
      { label: "Fuir dans la foule", result: () => {
        const success = Math.random() < 0.65
        return success
          ? { gs: {}, message: "Tu te perds dans le couloir bondé. Il perd ta trace." }
          : { gs: { reputation: -5, playerHp: Math.max(1, 50 - rng(10, 20)) }, message: "Il te rattrape. Un coup. Il te laisse tomber et disparaît." }
      }}
    ]
  }),

  (gs) => ({
    title: "Refus de service",
    description: `Un tenancier te reconnaît dès que tu entres. "Désolé, on sert pas les gens comme toi ici." Il fait signe à ses gorilles. "Ta réputation te précède — et pas dans le bon sens."`,
    choices: [
      { label: "Insister poliment", result: (gs) => ({
        gs: { reputation: (gs?.reputation ?? 0) - 5, credits: (gs?.credits ?? 0) + rng(0, 50) },
        message: "Ils t'escortent dehors. -5 rép. Tu glanes quelques infos en passant."
      })},
      { label: "Invoquer ta réputation passée (si tu en as)", result: (gs) => {
        const ok = (gs?.reputation ?? 0) > -35
        return ok
          ? { gs: { reputation: (gs?.reputation ?? 0) + 3 }, message: "Tu rappelles quelques bons coups. Le tenancier hésite. Il accepte à contrecœur. +3 rép." }
          : { gs: { reputation: (gs?.reputation ?? 0) - 8 }, message: "Il rit. Ta 'réputation passée' a pas de valeur ici. Tu sors humilié. -8 rép." }
      }},
      { label: "Partir sans un mot", result: () => ({ gs: {}, message: "Tu ressors. Cette station, c'est plus pour toi. Pour l'instant." }) }
    ]
  }),

  (gs) => ({
    title: "Transaction toxique",
    description: "Un revendeur de l'ombre t'aborde. Il sait qui tu es — et il pense qu'une personne avec ta réputation cherche forcément des trucs pas nets. Il propose des implants de contrebande à prix bradé.",
    choices: [
      { label: "Acheter l'implant (200 cr, risque)", result: (gs) => {
        if (!gs || gs.credits < 200) return { gs: {}, message: "Pas assez de crédits." }
        const ok = Math.random() < 0.55
        return ok
          ? { gs: { credits: gs.credits - 200, playerMaxHp: gs.playerMaxHp + 12, playerHp: Math.min(gs.playerMaxHp + 12, gs.playerHp + 8) }, message: "+12 PV max. L'implant prend. Pas mal pour du marché noir. -200 cr." }
          : { gs: { credits: gs.credits - 200, playerHp: Math.max(1, gs.playerHp - rng(15, 30)) }, message: "L'implant rejette. -PV, -200 cr. Le revendeur est déjà parti." }
      }},
      { label: "Refuser mais demander des infos", result: (gs) => ({
        gs: { reputation: (gs?.reputation ?? 0) + 5 },
        message: "Il te parle de contacts utiles en zone grise. +5 rép dans l'ombre."
      })},
      { label: "Ignorer et partir", result: () => ({ gs: {}, message: "Tu passes. Pas le bon jour pour jouer avec le marché noir." }) }
    ]
  }),

  (gs) => ({
    title: "Ancien ennemi",
    description: `Quelqu'un te fixe depuis l'autre bout du couloir. Tu le reconnais — ou lui te reconnaît. Un visage d'une station que t'aurais préféré oublier. Il avance vers toi. Calme. Décidé.`,
    choices: [
      { label: "Faire face", result: (gs) => {
        const ok = Math.random() < 0.35 + ((gs?.reputation ?? 0) < -40 ? -0.15 : 0)
        return ok
          ? { gs: { reputation: (gs?.reputation ?? 0) + 8 }, message: "La confrontation tourne à la paix froide. Il repart. Quelque chose de réglé. +8 rép." }
          : { gs: { playerHp: Math.max(1, (gs?.playerHp ?? 50) - rng(20, 35)), reputation: (gs?.reputation ?? 0) - 10 }, message: "Ça dégénère. Tu t'en sors mais c'est moche. -PV, -10 rép." }
      }},
      { label: "Tenter de s'expliquer", result: (gs) => {
        const ok = Math.random() < 0.50
        return ok
          ? { gs: { reputation: (gs?.reputation ?? 0) + 15 }, message: "Il écoute. Vraiment. Tu gagnes quelque chose de rare : une deuxième chance. +15 rép." }
          : { gs: { reputation: (gs?.reputation ?? 0) - 5 }, message: "Il t'écoute pas. 'T'aurais dû y penser avant.' Il repart dégoûté. -5 rép." }
      }},
      { label: "Partir rapidement dans la direction opposée", result: (gs) => ({
        gs: { reputation: (gs?.reputation ?? 0) - 3 },
        message: "Tu évites l'affrontement. Pour l'instant. Mais les ruelles sont petites."
      })}
    ]
  }),

  (_gs) => ({
    title: "Rumeurs qui voyagent",
    description: "Deux personnes parlent de toi sans te voir — ou font semblant. Ce que tu entends n'est pas flatteur. Ton nom circule dans la mauvaise catégorie. Tu choisis comment réagir.",
    choices: [
      { label: "Corriger la rumeur en public", result: (gs) => {
        const ok = Math.random() < 0.45
        return ok
          ? { gs: { reputation: (gs?.reputation ?? 0) + 12 }, message: "Tu interviens avec aplomb. Les gens t'écoutent. La version change. +12 rép." }
          : { gs: { reputation: (gs?.reputation ?? 0) - 8 }, message: "Tu t'emballes. Ça tourne à l'incident public. -8 rép. Tu ressors honteux." }
      }},
      { label: "Alimenter délibérément la rumeur (rep vers le bas)", result: (gs) => ({
        gs: { reputation: (gs?.reputation ?? 0) - 5, credits: (gs?.credits ?? 0) + rng(200, 500) },
        message: "Tu joues le jeu de ta mauvaise réputation. Quelqu'un te paie pour un boulot sale. -5 rép, +crédits."
      })},
      { label: "Ignorer et passer", result: () => ({ gs: {}, message: "Tu passes sans un mot. La rumeur continuera sans toi." }) }
    ]
  }),
]

// ── EVENTS CONTEXTUELS (selon l'état du joueur) ──────────────────────────────
function rollContextAwareEvent(gs: GameState): WanderEvent | null {
  const candidates: Array<[number, () => WanderEvent]> = []

  // HP très bas → quelqu'un propose de l'aide
  if (gs.playerHp < gs.playerMaxHp * 0.3) {
    candidates.push([0.5, () => ({
      title: "Tu as mauvaise mine",
      description: "Un médecin de terrain te remarque en passant. 'T'as l'air d'avoir besoin de soins d'urgence. Je peux faire quelque chose — mais je travaille pas pour rien.'",
      choices: [
        { label: "Accepter et payer (150 cr)", result: (gs) => gs && gs.credits >= 150
          ? { gs: { credits: gs.credits - 150, playerHp: Math.min(gs.playerMaxHp, gs.playerHp + 40) }, message: "+40 PV. Soins de fortune mais efficaces. -150 cr." }
          : { gs: {}, message: "Pas les crédits. Il hoche la tête et repart." }
        },
        { label: "Demander un crédit humanitaire", result: (gs) => {
          const ok = (gs?.reputation ?? 0) >= 10
          return ok
            ? { gs: { playerHp: Math.min((gs?.playerMaxHp ?? 100), (gs?.playerHp ?? 1) + 20) }, message: "+20 PV. Il se souvient des gens qui ont bonne réputation." }
            : { gs: {}, message: "Il sourit poliment. 'Ta réputation te fait pas de faveur.' Il repart." }
        }},
        { label: "Refuser — tu t'en sortiras", result: () => ({ gs: {}, message: "Il hoche la tête et repart. Le vide ne soigne personne." }) }
      ]
    })])
  }

  // Beaucoup de cargo → tentative de vol
  const cargoCount = Object.values(gs.cargo).reduce((s, v) => s + v, 0)
  if (cargoCount >= 5) {
    candidates.push([0.4, () => ({
      title: "Regard sur ta soute",
      description: "Tu remarques deux types qui scrutent ton vaisseau depuis le quai. Ils font semblant de ne pas regarder. Ils regardent.",
      choices: [
        { label: "Les approcher directement", result: (gs) => {
          const ok = (gs?.reputation ?? 0) >= 0
          return ok
            ? { gs: { reputation: (gs?.reputation ?? 0) + 5 }, message: "Ta réputation les décourage. Ils partent. +5 rép pour avoir tenu bon." }
            : { gs: { reputation: (gs?.reputation ?? 0) - 3, cargo: {} }, message: "Ils se sentent dans leur droit face à quelqu'un de ta réputation. Ta soute est vide quand tu reviens. -3 rép." }
        }},
        { label: "Surveiller discrètement et les prendre sur le fait", result: (gs) => {
          const ok = Math.random() < 0.60
          return ok
            ? { gs: { reputation: (gs?.reputation ?? 0) + 10, credits: (gs?.credits ?? 0) + rng(100, 300) }, message: "Tu les attends. Tu les confrontes. Ils laissent leurs affaires en partant. +10 rép, +crédits." }
            : { gs: { cargo: {} }, message: "Trop tard. Ils étaient plus malins. Ta soute est vide." }
        }},
        { label: "Déplacer ton vaisseau dans un autre hangar", result: (gs) => ({
          gs: { credits: (gs?.credits ?? 0) - 80 },
          message: "80 crédits pour changer de quai. Cher mais sûr. -80 cr."
        })}
      ]
    })])
  }

  // Beaucoup de crédits → pickpocket
  if (gs.credits >= 1500) {
    candidates.push([0.3, () => ({
      title: "Mains rapides",
      description: "Tu sens quelque chose. Un frôlement. Une légèreté dans ta poche que t'aurais pas dû remarquer aussi tôt.",
      choices: [
        { label: "Courir après (50% chance de rattraper)", result: (gs) => {
          const ok = Math.random() < 0.50
          const stolen = rng(200, 600)
          return ok
            ? { gs: {}, message: `Tu le rattrapes au coin. Il lâche ${stolen} cr et détale. Tu récupères tout.` }
            : { gs: { credits: (gs?.credits ?? 0) - stolen }, message: `Trop lent. ${stolen} cr envolés dans la foule.` }
        }},
        { label: "Vérifier tes poches d'abord", result: (gs) => {
          const lost = rng(100, 400)
          const detected = (gs?.credits ?? 0) > 0
          return detected
            ? { gs: { credits: Math.max(0, (gs?.credits ?? 0) - lost) }, message: `${lost} cr ont disparu. Tu remarques le vol trop tard.` }
            : { gs: {}, message: "Rien de manquant. Peut-être que tu as imaginé." }
        }}
      ]
    })])
  }

  // Long voyage (many days) → reconnaissance par un inconnu
  if (gs.day >= 10 && gs.visitedStations.length >= 4) {
    candidates.push([0.35, () => ({
      title: "Ta réputation t'a précédé",
      description: `Un pilote t'aborde. "J'ai entendu parler de toi sur ${gs.visitedStations[gs.visitedStations.length - 2] ?? 'une autre station'}. Quelqu'un a dit que tu étais passé par là." Il a l'air d'attendre quelque chose.`,
      choices: [
        { label: "Parler de tes voyages", result: (gs) => {
          const t = gs && pickTarget(gs)
          if (!t) return { gs: { reputation: (gs?.reputation ?? 0) + 8 }, message: "Tu partages. Il écoute. Ta réputation de voyageur est utile. +8 rép." }
          const q = quickQuest(gs!, 'delivery', 'Pilote rencontré', `Paquet pour un contact`, `Le pilote a un colis urgent à faire livrer sur ${t.name}. Il n'a pas le temps. Toi si.`, t.name, 'Données', 1600, 12)
          return { gs: { reputation: gs!.reputation + 8 }, message: `Il te propose du boulot. +8 rép pour la conversation.`, quest: q }
        }},
        { label: "Demander pourquoi ça l'intéresse", result: (gs) => ({
          gs: { reputation: (gs?.reputation ?? 0) + 3 },
          message: "Il cherchait quelqu'un de confiance pour un message. Il te le remet. +3 rép, un billet chiffré dans ta poche."
        })},
        { label: "Rester évasif", result: () => ({ gs: {}, message: "Tu esquives les questions. Il comprend. Il repart." }) }
      ]
    })])
  }

  if (candidates.length === 0) return null
  for (const [chance, factory] of candidates) {
    if (Math.random() < chance) return factory()
  }
  return null
}

export interface WanderChoice {
  label: string
  hint?: string
  result: (gs: GameState) => { gs?: Partial<GameState>; message: string; type?: 'combat' | 'negotiation' | 'navigation'; quest?: import('../types').Quest }
  available?: (gs: GameState) => boolean
}

// ── ÉVÉNEMENTS UNIQUES PAR STATION ───────────────────────────────────────────

export const STATION_WANDER_EVENTS: Partial<Record<string, Array<(gs: GameState) => WanderEvent>>> = {

  'La Carcasse': [
    (gs) => ({
      title: "L'atelier de Marek",
      description: "Marek est dans son atelier, les mains jusqu'aux coudes dans un moteur de propulsion désossé. Il lève les yeux une seconde. 'T'as besoin de quelque chose ou tu regardes juste ?'",
      choices: [
        { label: "Lui demander s'il a du travail", result: (gs) => {
          const t = gs && pickTarget(gs)
          if (!t) return { gs: { reputation: (gs?.reputation ?? 0) + 5 }, message: "Il a rien de concret pour toi maintenant. Mais il note ton nom. +5 rép." }
          const q = quickQuest(gs!, 'delivery', 'Marek', `Pièces pour Marek`, `Marek a besoin de composants spécifiques depuis ${t.name}. 'Ces pièces-là je peux les trouver nulle part ici. T'as un vaisseau.' Paiement honnête à la livraison.`, t.name, 'Pièces techniques', 1400, 12)
          return { gs: { reputation: gs!.reputation + 5 }, message: `Marek a une commande sur ${t.name}. Livraison simple, paiement honnête.`, quest: q }
        }},
        { label: "Lui poser des questions sur La Carcasse", result: (gs) => ({ gs: { reputation: (gs?.reputation ?? 0) + 8, credits: (gs?.credits ?? 0) + rng(80, 200) }, message: "Il parle en travaillant. Des histoires de la Carcasse qu'aucun panneau ne raconte. Tu repars avec des infos utiles. +8 rép, quelques crédits." }) },
        { label: "Proposer ton aide pour la réparation", result: (gs) => ({ gs: { reputation: (gs?.reputation ?? 0) + 12, shipHp: Math.min((gs?.shipMaxHp ?? 100), (gs?.shipHp ?? 100) + rng(8, 20)) }, message: "Deux heures plus tard, le moteur tourne. Il jette un œil à ton vaisseau en échange. +12 rép, réparations gratuites." }) }
      ]
    }),
    (gs) => ({
      title: "La viande sans étiquette",
      description: "Un vendeur propose de la viande grillée depuis un chariot. Ça sent bon. Aucune étiquette. Aucune question. Un gamin devant toi en achète trois portions sans se poser de question.",
      choices: [
        { label: "En acheter et ne pas demander d'où ça vient", result: (gs) => ({ gs: { playerHp: Math.min((gs?.playerMaxHp ?? 100), (gs?.playerHp ?? 50) + rng(10, 20)), credits: Math.max(0, (gs?.credits ?? 0) - 30) }, message: "C'est bon. Tu essaies de ne pas trop y penser. +PV, -30cr." }) },
        { label: "Demander l'origine de la viande", result: () => ({ gs: {}, message: "Il te regarde. Il ne répond pas. Le gamin le regarde aussi. Tu passes ton chemin." }) },
        { label: "Dénoncer aux autorités de La Carcasse", result: () => ({ gs: {}, message: "Les autorités de La Carcasse ? C'est une bonne blague. Il n'y en a pas vraiment." }) }
      ]
    }),
    (gs) => ({
      title: "Les enfants des soutes",
      description: "Un groupe d'enfants te bloque le passage dans un couloir étroit. Ils ont l'air de jouer — mais leur formation est trop précise pour être un jeu.",
      choices: [
        { label: "Négocier un passage", result: (gs) => ({ gs: { credits: Math.max(0, (gs?.credits ?? 0) - rng(20, 60)) }, message: "Tu leur donnes quelque chose. La formation s'ouvre. Ils gèrent ce couloir mieux que n'importe quelle milice." }) },
        { label: "Les contourner par un autre chemin", result: (gs) => {
          const found = Math.random() < 0.5
          return found
            ? { gs: { credits: (gs?.credits ?? 0) + rng(60, 180), cargo: { ...(gs?.cargo ?? {}), 'Médicaments': ((gs?.cargo ?? {})['Médicaments'] ?? 0) + 1 } }, message: "Le chemin alternatif passe par une section abandonnée. Tu y trouves quelque chose d'utile." }
            : { gs: {}, message: "Le chemin alternatif est plus long et ne mène nulle part d'intéressant." }
        }},
        { label: "Les recruter comme informateurs", result: (gs) => ({ gs: { reputation: (gs?.reputation ?? 0) + 10 }, message: "Ils acceptent. Dans deux heures, ils t'ont envoyé trois rumeurs utiles. +10 rép." }) }
      ]
    }),
  ],

  'Les Bas-Fonds de Vega': [
    (gs) => ({
      title: "Boro dans un angle",
      description: "Boro est appuyé contre un mur dans une alcôve, les yeux mi-clos. Il te voit approcher depuis dix mètres. Il a toujours été plus observateur qu'il n'en a l'air.",
      choices: [
        { label: "Lui demander ce qu'il a à vendre", result: (gs) => {
          const t = gs && pickTarget(gs)
          if (!t) return { gs: { credits: (gs?.credits ?? 0) - 200, cargo: { ...(gs?.cargo ?? {}), 'Drogues de synthèse': ((gs?.cargo ?? {})['Drogues de synthèse'] ?? 0) + 1 } }, message: "Il a quelque chose. Tu achètes. -200cr, +marchandise." }
          const q = quickQuest(gs!, 'delivery', 'Boro', `Transport pour Boro`, `Boro a un colis à faire passer sur ${t.name}. 'Rien d'illégal. Enfin rien de trop illégal.' Il paie bien. Il ne donne pas de reçu.`, t.name, 'Pièces de contrebande', 2200, 5)
          return { gs: { credits: (gs?.credits ?? 0) - 100 }, message: `Boro a un transport à faire. ${t.name}. Il te donne une avance.`, quest: q }
        }},
        { label: "Lui demander des informations sur la zone", result: (gs) => ({ gs: { reputation: (gs?.reputation ?? 0) + 6, credits: (gs?.credits ?? 0) + rng(100, 300) }, message: "Boro connaît tout ce qui transite aux Bas-Fonds. Il te donne une piste exploitable. +6 rép, +crédits." }) },
        { label: "Passer sans s'arrêter", result: () => ({ gs: {}, message: "Il te regarde partir. Il se souvient de qui s'arrête et qui ne s'arrête pas." }) }
      ]
    }),
    (gs) => ({
      title: "Le code des Bas-Fonds",
      description: "Tu as enfreint quelque chose sans le savoir — un regard trop direct, un couloir trop emprunté. Trois personnes te bloquent maintenant. Pas agressivement. Juste présentes.",
      choices: [
        { label: "Reconnaître la faute et offrir une compensation", result: (gs) => ({ gs: { credits: Math.max(0, (gs?.credits ?? 0) - rng(100, 300)), reputation: (gs?.reputation ?? 0) + 5 }, message: "Tu comprends vite. Tu paies. La situation se désamorce. -crédits, +5 rép (tu sais te comporter)." }) },
        { label: "Faire comme si tu n'avais rien compris", result: (gs) => Math.random() < 0.4
          ? { gs: { reputation: (gs?.reputation ?? 0) - 10 }, message: "L'ignorance volontaire est le pire affront possible ici. -10 rép." }
          : { gs: {}, message: "Soit tu as vraiment l'air innocent, soit tu les as convaincus. Ils s'écartent." }
        },
        { label: "Demander poliment qui tu as offensé", result: (gs) => ({ gs: { reputation: (gs?.reputation ?? 0) + 8 }, message: "Demander directement, c'est respecter les règles. Ils t'expliquent. Tu t'excuses. Situation réglée. +8 rép." }) }
      ]
    }),
    (gs) => ({
      title: "Le fond du fond",
      description: "Un escalier dissimulé mène à un niveau encore plus bas que les Bas-Fonds. Les néons ne descendent pas jusque-là. Des gens y vivent quand même.",
      choices: [
        { label: "Descendre et explorer", result: (gs) => {
          const ok = Math.random() < 0.55
          return ok
            ? { gs: { credits: (gs?.credits ?? 0) + rng(300, 800), cargo: { ...(gs?.cargo ?? {}), 'Données volées': ((gs?.cargo ?? {})['Données volées'] ?? 0) + 1 } }, message: "Tu trouves un marché encore plus informel. Des choses que personne ne vend officiellement. +crédits, +données." }
            : { gs: { playerHp: Math.max(1, (gs?.playerHp ?? 50) - rng(15, 35)) }, message: "Les gens d'ici n'apprécient pas les visiteurs. Tu repars avec des contusions. -PV." }
        }},
        { label: "Remonter — certains endroits ne méritent pas d'être trouvés", result: () => ({ gs: {}, message: "Probablement la bonne décision. Probablement." }) }
      ]
    }),
  ],

  'Arc Ouest Apocalypse': [
    (gs) => ({
      title: "Un Faucon Noir qui t'évalue",
      description: "Un homme en uniforme des Faucons Noirs te regarde depuis l'entrée d'un couloir. Il n'est pas menaçant. Il évalue. Il décide quelque chose sur toi en moins de dix secondes.",
      choices: [
        { label: "Soutenir son regard et continuer", result: (gs) => ({ gs: { reputation: (gs?.reputation ?? 0) + 10 }, message: "Tu passes. Il hoche la tête, presque imperceptiblement. Tu viens de réussir quelque chose. +10 rép." }) },
        { label: "L'approcher et te présenter", result: (gs) => {
          const t = gs && pickTarget(gs)
          if (!t || Math.random() < 0.35) return { gs: { reputation: (gs?.reputation ?? 0) + 5 }, message: "Il écoute. Il dit peu. Avant de partir, il glisse quelque chose. +5 rép." }
          const q = quickQuest(gs!, 'sabotage', 'Cael', `Mission pour les Faucons`, `Un Faucon Noir t'a reconnu capable. Il veut quelque chose sur ${t.name}. 'Pas besoin de savoir pourquoi. Besoin de savoir si t'es fiable.'`, t.name, undefined, 3500, -5)
          return { gs: { reputation: gs!.reputation + 8 }, message: `Il a une mission sur ${t.name}. Tu as l'air fiable. +8 rép.`, quest: q }
        }},
        { label: "Changer de direction pour l'éviter", result: () => ({ gs: {}, message: "Il note que tu as changé de direction. Il note tout." }) }
      ]
    }),
    (gs) => ({
      title: "Le réseau d'enfants d'Alanossa",
      description: "Un gamin de douze ans te remet une enveloppe sans dire un mot. Sur l'enveloppe : rien. Il disparaît dans la foule avant que tu puisses poser une question.",
      choices: [
        { label: "Ouvrir l'enveloppe", result: (gs) => {
          const t = gs && pickTarget(gs)
          if (!t) return { gs: { credits: (gs?.credits ?? 0) + 500 }, message: "Des crédits et une note : 'Tu es observé. Continue à bien te comporter.' +500cr." }
          const q = quickQuest(gs!, 'bounty', 'Source anonyme (Faucons)', `Cible désignée`, `L'enveloppe contient une photo, un nom, une station : ${t.name}. Pas d'explication. La récompense est réelle.`, t.name, undefined, 5500, 15)
          return { gs: {}, message: `Une cible. Une station : ${t.name}. La récompense est réelle — si tu fais confiance à la source.`, quest: q }
        }},
        { label: "Ne pas l'ouvrir et partir", result: () => ({ gs: {}, message: "Tu t'en débarrasses dans le premier couloir. Quelqu'un te regarde faire. Il ramasse l'enveloppe." }) }
      ]
    }),
    (gs) => ({
      title: "Cael dans son coin",
      description: "Cael est seul à une table dans un coin sombre. Il te regarde approcher avec la patience de quelqu'un qui a décidé depuis longtemps ce qu'il ferait si tu t'approchais.",
      choices: [
        { label: "S'asseoir face à lui", result: (gs) => {
          const t = gs && pickTarget(gs)
          const q = t ? quickQuest(gs!, 'sabotage', 'Cael', `Opération Faucon — ${t.name}`, `Cael a une opération en cours sur ${t.name}. Il te teste en te le confiant. 'Si tu rates, j'ai jamais parlé.' Si tu réussis, tu as une dette positive avec les Faucons.`, t.name, undefined, 4000, -8) : undefined
          return { gs: { reputation: gs!.reputation + 5, pastDecisions: addDecision(gs!, 'cael-contact') }, message: `Cael parle peu. Mais il te donne quelque chose sur ${t?.name ?? 'une cible'}. +5 rép.`, quest: q ?? undefined }
        }},
        { label: "Ne pas s'approcher — Cael ne se rencontre pas par accident", result: () => ({ gs: {}, message: "Tu continues. Ce n'est probablement pas le bon moment." }) }
      ]
    }),
  ],

  'Le Purgatoire': [
    (gs) => ({
      title: "Neva dans l'ombre du couloir 4",
      description: "Neva te regarde depuis une alcôve obscure. Elle n'essaie pas de se cacher — elle te laisse le temps de décider si tu viens ou pas.",
      choices: [
        { label: "L'approcher", result: (gs) => {
          const t = gs && pickTarget(gs)
          const q = t ? quickQuest(gs!, 'patrol', 'Neva', `Présence pour Neva`, `Neva a besoin que tu te montres sur ${t.name}. 'J'ai des raisons. Tu as les moyens d'y aller.' Elle paie pour des faits, pas des rumeurs.`, t.name, undefined, 1100, 15) : undefined
          return { gs: { reputation: gs!.reputation + 6 }, message: `Neva a besoin d'informations sur ${t?.name ?? 'une destination'}. +6 rép.`, quest: q ?? undefined }
        }},
        { label: "La saluer de loin et continuer", result: (gs) => ({ gs: { reputation: (gs?.reputation ?? 0) + 4 }, message: "Elle hoche la tête. C'est suffisant. Le Purgatoire a ses codes. +4 rép." }) }
      ]
    }),
    (gs) => ({
      title: "Un ancien prisonnier avec une dette",
      description: "Un vieil homme t'arrête. 'T'as une tête de quelqu'un qui sort de quelque part aussi.' Il a les yeux de ceux qui ont compté les barreaux. Il veut parler.",
      choices: [
        { label: "L'écouter", result: (gs) => {
          const t = gs && pickTarget(gs)
          const q = t ? quickQuest(gs!, 'extraction', 'Ancien prisonnier', `Retour sur ${t.name}`, `Le vieil homme a laissé quelque chose sur ${t.name} quand il est parti vite. 'J'peux pas y retourner. Toi si.' Il te dit exactement où chercher.`, t.name, 'Artefacts', 1600, 18) : undefined
          return { gs: { reputation: gs!.reputation + 8 }, message: `Il avait quelque chose à récupérer sur ${t?.name ?? 'une station'}. Il ne peut pas y aller lui-même. +8 rép.`, quest: q ?? undefined }
        }},
        { label: "Refuser poliment — pas le temps", result: () => ({ gs: {}, message: "Il hoche la tête. 'Personne a le temps ici.' Il repart." }) }
      ]
    }),
    (gs) => ({
      title: "Le niveau 7 interdit",
      description: "Une porte marquée 'Niveau -7 — Accès restreint' est entrouverte. Quelqu'un a forcé la serrure depuis l'extérieur. Récemment.",
      choices: [
        { label: "Entrer et voir ce qu'il y a", result: (gs) => {
          const ok = Math.random() < 0.6
          return ok
            ? { gs: { credits: (gs?.credits ?? 0) + rng(400, 1000), cargo: { ...(gs?.cargo ?? {}), 'Artefacts': ((gs?.cargo ?? {})['Artefacts'] ?? 0) + 1 } }, message: "Une ancienne salle de détention. Des affaires laissées par les derniers prisonniers. Certaines ont de la valeur. +crédits, +artefacts." }
            : { gs: { playerHp: Math.max(1, (gs?.playerHp ?? 50) - rng(20, 40)) }, message: "Quelqu'un est déjà là. Il n'apprécie pas d'être dérangé. -PV." }
        }},
        { label: "Signaler la porte ouverte à Neva", result: (gs) => ({ gs: { reputation: (gs?.reputation ?? 0) + 12 }, message: "Neva apprécie. Elle connaît le niveau 7. Et maintenant elle sait que tu es quelqu'un à qui on peut dire des choses. +12 rép." }) },
        { label: "Refermer la porte et passer", result: () => ({ gs: {}, message: "Quelqu'un voulait que cette porte soit ouverte. Tu viens de contrarier ses plans." }) }
      ]
    }),
  ],

  'Fort Kharos': [
    (gs) => ({
      title: "Torvak en pause",
      description: "Torvak mange seul dans la cafétéria. Il mange lentement, méthodiquement, comme quelqu'un qui a appris à savourer les moments de silence.",
      choices: [
        { label: "S'asseoir à sa table et lui parler", result: (gs) => {
          const t = gs && pickTarget(gs)
          const q = t ? quickQuest(gs!, 'revenge', 'Torvak', `Justice pour Torvak`, `Torvak a une histoire non résolue sur ${t.name}. Il ne peut pas y aller — il est en service. 'Si t'y passes, rends-leur mon compliment.' Il te dit exactement comment.`, t.name, undefined, 2800, 25) : undefined
          return { gs: { reputation: gs!.reputation + 10 }, message: `Torvak parle peu mais chaque mot compte. Il te donne une piste sur ${t?.name ?? 'une destination'}. +10 rép.`, quest: q ?? undefined }
        }},
        { label: "Le laisser tranquille — certains silences méritent d'être respectés", result: (gs) => ({ gs: { reputation: (gs?.reputation ?? 0) + 5 }, message: "Tu passes à une autre table. Il lève les yeux une seconde, puis rebaisse. Tu viens de marquer un point. +5 rép." }) }
      ]
    }),
    (gs) => ({
      title: "Une recrue qui veut déserter",
      description: "Une recrue s'approche de toi dans un couloir secondaire. Elle est jeune. Elle a l'air d'avoir pris une décision en te voyant. 'Vous partez bientôt ?'",
      choices: [
        { label: "L'emmener — elle monte à bord", result: (gs) => {
          const t = gs && pickTarget(gs)
          const q = t ? quickQuest(gs!, 'escort', 'Recrue désertrice', `Extraction urgente`, `Tu as une désertrice à bord. Elle veut aller sur ${t.name}. Les autorités de Fort Kharos pourraient chercher. Pas de détours.`, t.name, undefined, 2000, -10) : undefined
          return { gs: { cargo: { ...(gs?.cargo ?? {}), 'Passager': ((gs?.cargo ?? {})['Passager'] ?? 0) + 1 }, pastDecisions: addDecision(gs!, 'helped-defector'), journal: addJournal(gs!, "J'ai embarqué une désertrice de Fort Kharos. Elle fuyait quelque chose de plus lourd que moi. Je l'ai aidée.", 'decision') }, message: `Elle monte. Tu as maintenant une désertrice à bord et une destination sur ${t?.name ?? 'une station'}.`, quest: q ?? undefined }
        }},
        { label: "Lui conseiller de partir par d'autres moyens", result: (gs) => ({ gs: { reputation: (gs?.reputation ?? 0) + 6 }, message: "Tu lui donnes des noms, des routes. Elle te remercie. +6 rép." }) },
        { label: "La signaler — tu veux pas d'ennuis", result: (gs) => ({ gs: { reputation: (gs?.reputation ?? 0) - 15, credits: (gs?.credits ?? 0) + 300 }, message: "La milice la récupère. Une prime arrive dans ta poche. -15 rép, +300cr." }) }
      ]
    }),
  ],

  'Nexus Aldara': [
    (gs) => ({
      title: "Lira a craqué quelque chose",
      description: "Lira t'aborde avec cet air de quelqu'un qui vient de faire quelque chose qu'elle ne devrait pas avoir fait. 'J'ai eu accès à un système. J'ai vu des choses. J'ai besoin que ça circule pas.'",
      choices: [
        { label: "L'écouter et garder ça pour toi", result: (gs) => {
          const t = gs && pickTarget(gs)
          const q = t ? quickQuest(gs!, 'heist', 'Lira', `Extraction de données — ${t.name}`, `Lira a identifié des données sur ${t.name} qui ont de la valeur. 'Je peux pas m'y pointer moi-même. T'as un vaisseau.' Elle te dit exactement quoi chercher.`, t.name, 'Données classifiées', 3200, 12) : undefined
          return { gs: { reputation: gs!.reputation + 8 }, message: `Lira t'a confié quelque chose. Elle a un travail sur ${t?.name ?? 'une station'}. +8 rép.`, quest: q ?? undefined }
        }},
        { label: "Vendre l'information à ses adversaires", result: (gs) => ({ gs: { credits: (gs?.credits ?? 0) + rng(500, 1200), reputation: (gs?.reputation ?? 0) - 25 }, message: "+crédits. Lira saura. Elle sait toujours. -25 rép." }) }
      ]
    }),
    (gs) => ({
      title: "Un hacker en fuite active",
      description: "Un type court dans le couloir, terminal sous le bras, les yeux partout. Il te heurte, te fixe une seconde, et reprend sa course en disant 'excuse' sans s'arrêter.",
      choices: [
        { label: "Le rattraper pour l'aider", result: (gs) => {
          const t = gs && pickTarget(gs)
          const q = t ? quickQuest(gs!, 'escort', 'Hacker en fuite', `Passage sûr vers ${t.name}`, `Le hacker a besoin de quitter Nexus Aldara vite. Il connaît des choses que des gens ne veulent pas qu'il sache. ${t.name} est le plan. Paiement à l'arrivée.`, t.name, undefined, 2800, 10) : undefined
          return { gs: {}, message: `Il a besoin de partir vers ${t?.name ?? 'une destination'}. Vite.`, quest: q ?? undefined }
        }},
        { label: "L'ignorer — ses problèmes ne sont pas les tiens", result: () => ({ gs: {}, message: "Il disparaît dans un couloir latéral. Tu entends des bruits de poursuite dix secondes plus tard." }) }
      ]
    }),
  ],

  'Emporium Requiem': [
    (gs) => ({
      title: "Pistis au niveau 9",
      description: "Pistis est dans un café du niveau 9 — là où l'éclairage est tamis et les enseignes plus discrètes. Il te fait signe de t'asseoir sans que tu aies demandé.",
      choices: [
        { label: "S'asseoir et voir ce qu'il a", result: (gs) => {
          const t = gs && pickTarget(gs)
          if (!t) return { gs: { credits: (gs?.credits ?? 0) + 400, reputation: (gs?.reputation ?? 0) + 8, pastDecisions: addDecision(gs!, 'pistis-ally'), pillarStanding: shiftPillar(gs!, 'cesarion', +8), journal: addJournal(gs!, "J'ai rencontré Pistis au niveau 9. Il m'a glissé des infos sans me regarder dans les yeux. Ce type a des contacts partout.", 'event') }, message: "Pistis a des contacts partout. Il te glisse quelques informations monnayables. +400cr, +8 rép." }
          const q = quickQuest(gs!, 'delivery', 'Pistis', `Livraison discrète`, `Pistis a quelque chose à faire parvenir sur ${t.name}. 'Rien d'illégal. Enfin rien que la loi peut prouver.' Il paie au-dessus du marché pour la discrétion.`, t.name, 'Renseignements', 3000, 8)
          return { gs: { reputation: gs!.reputation + 8, pastDecisions: addDecision(gs!, 'pistis-ally'), pillarStanding: shiftPillar(gs!, 'cesarion', +8), journal: addJournal(gs!, "J'ai rencontré Pistis au niveau 9. Il avait une livraison. Je n'ai pas demandé ce que c'était.", 'event') }, message: `Pistis a une livraison pour ${t.name}. Il paie bien. +8 rép.`, quest: q }
        }},
        { label: "Refuser poliment — Pistis crée des obligations", result: (gs) => ({ gs: { reputation: (gs?.reputation ?? 0) + 3 }, message: "Il comprend. 'Tu reviendras.' Probablement vrai. +3 rép (tu sais ce que tu fais)." }) }
      ]
    }),
    (gs) => ({
      title: "Une vente aux enchères au niveau 7",
      description: "Une porte gardée, un bourdonnement de voix derrière. Quelqu'un vend quelque chose que les niveaux officiels ne voient pas. La porte est entrouverte pendant le changement de garde.",
      choices: [
        { label: "Entrer avec assurance", result: (gs) => {
          const ok = Math.random() < 0.6
          return ok
            ? { gs: { credits: (gs?.credits ?? 0) + rng(500, 1500), cargo: { ...(gs?.cargo ?? {}), 'Artefacts': ((gs?.cargo ?? {})['Artefacts'] ?? 0) + 1 } }, message: "Tu sembles à ta place. Une vente d'artefacts. Tu repars avec quelque chose de valeur. +crédits, +artefact." }
            : { type: 'combat' as const, message: "Ils savent que tu n'as pas ta place ici." }
        }},
        { label: "Observer depuis le couloir", result: (gs) => ({ gs: { reputation: (gs?.reputation ?? 0) + 5, credits: (gs?.credits ?? 0) + rng(100, 300) }, message: "Tu identifies des visages, des alliances, des prix. Informations vendables. +5 rép, +crédits." }) }
      ]
    }),
  ],

  'La Forge Noire': [
    (gs) => ({
      title: "Rook au travail",
      description: "Rook forge quelque chose. Le bruit est régulier, presque hypnotique. Il ne lève pas les yeux quand tu entres. Il sait que tu es là.",
      choices: [
        { label: "Lui commander une arme", result: (gs) => {
          if (!gs || gs.credits < 800) return { gs: {}, message: "Il faut au moins 800cr pour une commande chez Rook." }
          const arme = rollWeaponForTier(rng(2, 3))
          return { gs: { credits: gs.credits - 800, weapons: [...gs.weapons, arme] }, message: `Il forge. Une heure plus tard : ${arme.name}. -800cr.` }
        }},
        { label: "Lui apporter des matériaux rares en échange d'un travail", result: (gs) => {
          const t = gs && pickTarget(gs)
          const q = t ? quickQuest(gs!, 'extraction', 'Rook', `Matériaux pour Rook`, `Rook a besoin de matériaux spécifiques depuis ${t.name}. 'Je fabrique mieux avec de meilleures matières premières. T'apportes, je forge, tu pars avec quelque chose de bien.'`, t.name, 'Métaux rares', 800, 10) : undefined
          return { gs: {}, message: `Rook a besoin de matériaux depuis ${t?.name ?? 'une source'}.`, quest: q ?? undefined }
        }},
        { label: "Observer son travail en silence", result: (gs) => ({ gs: { reputation: (gs?.reputation ?? 0) + 8 }, message: "Il forge pendant une heure. Tu regardes. À la fin il te montre quelque chose — une technique. +8 rép." }) }
      ]
    }),
  ],

  'L\'Arc Perdu': [
    (gs) => ({
      title: "Sentinelle automatique — aucune hésitation",
      description: "Un ronronnement mécanique dans un couloir latéral. Un gyroscope. Un canon. Il pivote vers toi avant que tu comprennes ce que c'est.",
      choices: [
        {
          label: "Plonger sur le côté (30% survie)",
          result: (gs) => Math.random() < 0.30
            ? { gs: { playerHp: Math.max(1, gs!.playerHp - rng(40, 65)) }, message: "Tu évites l'essentiel. La rafale t'effleure. Tu cours sans te retourner. -PV." }
            : { gs: { isDead: true, deathCause: "Sentinelle automatique dans L'Arc Perdu. Système d'avant-guerre. Aucune conscience. Aucune pitié." }, message: "Le canon n'a pas hésité. Toi si." }
        },
        {
          label: "Lever les mains — peut-être un capteur de reddition",
          result: (gs) => Math.random() < 0.20
            ? { gs: { isImprisoned: true, prisonDaysLeft: rng(2, 5), screen: 'prison' as const }, message: "Le système t'encercle et t'escorte. Tu finis en cellule. Les soldats de Raphazarus arrivent plus tard." }
            : { gs: { isDead: true, deathCause: "La sentinelle n'avait pas de mode 'reddition'. L'Arc Perdu n'a pas été conçu pour faire des prisonniers." }, message: "Il n'y avait pas de protocole de reddition." }
        }
      ]
    }),

    (gs) => ({
      title: "Soldats de Raphazarus — patrouille silencieuse",
      description: "Quatre hommes en armure lourde, sans insigne clair. Ils marchent sans parler. Ils t'ont vu il y a trente secondes. Ils attendent que tu fasses un geste.",
      choices: [
        {
          label: "T'identifier et demander à passer",
          result: (gs) => {
            const roll = Math.random()
            if (roll < 0.25) return { gs: { reputation: gs!.reputation + 5, pillarStanding: shiftPillar(gs!, 'raphazarus', +8), pastDecisions: addDecision(gs!, 'passed-raphazarus-patrol'), journal: addJournal(gs!, "La patrouille de Raphazarus m'a laissé passer. Pas un mot. Ils m'ont regardé comme s'ils savaient quelque chose que j'ignore.", 'event') }, message: "L'un d'eux fait signe de laisser passer. Pas un mot. Un test réussi, tu sais pas pourquoi." }
            if (roll < 0.60) return { gs: { pendingInterrogation: { faction: "Soldats de Raphazarus", captureStation: gs!.currentStation }, screen: 'interrogation' as const }, message: "Ils t'escortent. Pas de force. 'Vous avez des questions. Nous aussi.'" }
            return { gs: { isImprisoned: true, prisonDaysLeft: rng(3, 6), screen: 'prison' as const, playerHp: Math.max(1, gs!.playerHp - rng(20, 40)) }, message: "L'un d'eux n'attendait pas ta réponse. Tu te réveilles dans un cachot de L'Arc Perdu." }
          }
        },
        {
          label: "Fuir — immédiatement",
          result: (gs) => Math.random() < 0.35
            ? { gs: { playerHp: Math.max(1, gs!.playerHp - rng(15, 30)) }, message: "Tu cours dans les décombres. Ils ne te suivent pas loin. Tu t'en sors, à peine. -PV." }
            : { gs: { isImprisoned: true, prisonDaysLeft: rng(4, 7), screen: 'prison' as const, playerHp: Math.max(1, gs!.playerHp - rng(30, 55)) }, message: "Ils couraient plus vite que tu pensais. Les ruines n'ont aucun secret pour eux." }
        },
        {
          label: "Rester immobile — laisser décider",
          result: (gs) => Math.random() < 0.50
            ? { gs: { pendingInterrogation: { faction: "Soldats de Raphazarus", captureStation: gs!.currentStation }, screen: 'interrogation' as const }, message: "'Vous venez avec nous.' Pas de violence. Juste une certitude." }
            : { gs: {}, message: "Ils passent. L'un d'eux te regarde une seconde de trop. Puis ils disparaissent dans les ruines." }
        }
      ]
    }),

    (gs) => ({
      title: "Zone de radiations non cartographiée",
      description: "Un couloir au fond des ruines. Les murs changent de couleur — une fluorescence faible, presque belle. Quelque chose rayonne là-dedans.",
      choices: [
        {
          label: "Entrer — explorer (risque élevé)",
          result: (gs) => {
            const roll = Math.random()
            if (roll < 0.20) return { gs: { isDead: true, deathCause: "Radiations létales dans une zone non cartographiée de L'Arc Perdu. Dose fatale en quelques minutes." }, message: "Tu avances. La douleur commence cinq minutes plus tard. Tu ne ressors pas." }
            if (roll < 0.55) return { gs: { playerHp: Math.max(1, gs!.playerHp - rng(35, 70)), cargo: { ...gs!.cargo, 'Artefacts': (gs!.cargo['Artefacts'] ?? 0) + 2 } }, message: "Tu récupères des artefacts d'avant-guerre. Et des nausées qui ne partiront pas de sitôt. -PV, +2 Artefacts." }
            return { gs: { cargo: { ...gs!.cargo, 'Données pré-Fracture': (gs!.cargo['Données pré-Fracture'] ?? 0) + 1 }, credits: gs!.credits + rng(1000, 2500) }, message: "Une capsule blindée. Protégée par la coque. Des données d'avant la Grande Guerre. Valeur inestimable. +crédits, +données." }
          }
        },
        {
          label: "Rester dehors — attendre que la fluorescence s'atténue",
          result: () => ({ gs: {}, message: "Elle ne s'atténue pas. Tu repars. Ces zones ne se visitent pas sans équipement." })
        }
      ]
    }),
  ],

  'Star Quest': [
    (gs) => ({
      title: "Ganz a une proposition",
      description: "Ganz t'intercepte près de l'entrée du casino. Il sourit mais ses yeux calculent. Il a toujours une proposition.",
      choices: [
        { label: "Écouter ce qu'il a", result: (gs) => {
          const t = gs && pickTarget(gs)
          if (!t) return { gs: { reputation: gs!.reputation + 5 }, message: "Il teste ton intérêt. Pas de mission concrète ce soir. Mais il se souvient que tu as écouté. +5 rép." }
          const q = quickQuest(gs!, 'patrol', 'Ganz', `Présence pour Ganz`, `Ganz veut une présence active sur ${t.name}. Certains de ses clients viennent de là-bas. 'Je paie pour du concret.' Il paie bien.`, t.name, undefined, 1800, 10)
          return { gs: { reputation: gs!.reputation + 5 }, message: `Ganz veut une surveillance de ${t.name}. Paiement sérieux. +5 rép.`, quest: q }
        }},
        { label: "Refuser poliment et aller au casino", result: (gs) => ({ gs: { reputation: (gs?.reputation ?? 0) + 2 }, message: "Il rit. 'Bonne idée.' Il te laisse passer. +2 rép." }) }
      ]
    }),
  ],
}

export function rollWanderEvent(gs: GameState): WanderEvent {
  const station = getStation(gs.currentStation)

  // 1. Mauvaise réputation → événements spécifiques (rep < -20, 40% de chance)
  if (gs.reputation < -20 && Math.random() < 0.40) {
    return pick(WANDER_EVENTS_BAD_REP)(gs)
  }

  // 2. Événements contextuels (20% de chance) — surprise selon l'état du joueur
  if (Math.random() < 0.20) {
    const ctx = rollContextAwareEvent(gs)
    if (ctx) return ctx
  }

  // 3. Événements de mémoire (25% si éligible — priorité narrative)
  if (Math.random() < 0.25) {
    const mem = rollMemoryEvent(gs)
    if (mem) return mem
  }

  // 4. Événement unique à cette station (30% de chance si disponible)
  const stationSpecific = STATION_WANDER_EVENTS[gs.currentStation]
  if (stationSpecific && stationSpecific.length > 0 && Math.random() < 0.30) {
    return pick(stationSpecific)(gs)
  }

  // 5. JSON ou TS générique
  const useJson = Math.random() < 0.55
  if (useJson) {
    const jsonPool =
      station.danger >= 3 ? JSON_WANDER_EXTREME :
      station.danger >= 2 ? JSON_WANDER_HIGH :
      station.danger >= 1 ? JSON_WANDER_MID :
      JSON_WANDER_LOW
    if (jsonPool.length > 0) return pick(jsonPool)(gs)
  }
  const tsPool =
    station.danger >= 3 ? WANDER_EVENTS_HIGH :
    station.danger >= 2 ? WANDER_EVENTS_MID :
    WANDER_EVENTS_LOW
  return pick(tsPool)(gs)
}

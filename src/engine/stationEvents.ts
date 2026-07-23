import type { GameState } from '../types'

const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

export interface StationEvent {
  id: string
  label: string
  available: (gs: GameState) => boolean
  description: string
  choices: StationEventChoice[]
}

export interface StationEventChoice {
  label: string
  available?: (gs: GameState) => boolean
  result: (gs: GameState) => { gs: Partial<GameState>; message: string }
}

export const STATION_EVENTS: Record<string, StationEvent[]> = {
  'Star Quest': [
    {
      id: 'salon_vip',
      label: 'Salon VIP — Réseau d\'affaires',
      available: gs => gs.credits >= 400,
      description: 'Une salle privée, lumière tamisée, flûtes de champagne synthétique. Des marchands, des courtiers, des gens qui se font des faveurs. Ici, les contacts valent plus que l\'or.',
      choices: [
        {
          label: 'Payer l\'entrée et réseauter (400 cr)',
          available: gs => gs.credits >= 400,
          result: gs => ({
            gs: { credits: gs.credits - 400 + rng(500, 1500), reputation: gs.reputation + 30 },
            message: `-400 cr. Tu repars avec des contacts et des engagements. +${rng(500, 1500)} cr, +30 rép.`,
          }),
        },
        {
          label: 'Extraire des données discrètement (Hackeur)',
          available: gs => gs.class.name === 'Hackeur',
          result: gs => Math.random() < 0.70
            ? { gs: { credits: gs.credits + rng(1200, 2800), reputation: gs.reputation + 15 }, message: `[HACK] Données privées extraites. +${rng(1200, 2800)} cr, +15 rép.` }
            : { gs: { reputation: gs.reputation - 25 }, message: 'Détecté. Expulsion discrète. -25 rép.' },
        },
        {
          label: 'Entrée gratuite (Rép ≥ 80)',
          available: gs => gs.reputation >= 80,
          result: gs => ({
            gs: { credits: gs.credits + rng(800, 2000), reputation: gs.reputation + 40 },
            message: `On te reconnaît. Tu entres sans payer. +${rng(800, 2000)} cr, +40 rép.`,
          }),
        },
        { label: 'Ignorer', result: gs => ({ gs: {}, message: '' }) },
      ],
    },
    {
      id: 'arena',
      label: 'Arène de combat',
      available: gs => true,
      description: 'Des combats légaux (à peu près). La foule réclame du sang.',
      choices: [
        {
          label: 'Participer (combat)',
          result: gs => ({ gs: {}, message: 'ARENA_COMBAT' }),
        },
        {
          label: 'Parier sur un combattant (300 cr)',
          available: gs => gs.credits >= 300,
          result: gs => Math.random() < 0.5
            ? { gs: { credits: gs.credits + 600 }, message: 'Ton poulain gagne. +600 cr.' }
            : { gs: { credits: gs.credits - 300 }, message: 'Il s\'effondre au troisième round. -300 cr.' },
        },
        { label: 'Partir', result: gs => ({ gs: {}, message: '' }) },
      ],
    },
  ],

  'Scotty Golden North': [
    {
      id: 'grand_casino',
      label: 'Le Grand Casino Samy Scotty',
      available: gs => gs.credits >= 150,
      description: 'L\'entrée est un mur de lumière. Bruit de jetons, musique synthétique, odeur de carburant de luxe. Samy Scotty a transformé cette station en temple du hasard. Tout le monde peut jouer. Tout le monde peut perdre.',
      choices: [
        {
          label: 'Table basse — miser 150 cr (55% chance → +200)',
          available: gs => gs.credits >= 150,
          result: gs => Math.random() < 0.55
            ? { gs: { credits: gs.credits + 200 }, message: 'La bille tombe sur ton numéro. +200 cr.' }
            : { gs: { credits: gs.credits - 150 }, message: 'Raté. La maison garde les 150 cr.' },
        },
        {
          label: 'Table standard — miser 500 cr (50% → +650)',
          available: gs => gs.credits >= 500,
          result: gs => Math.random() < 0.50
            ? { gs: { credits: gs.credits + 650 }, message: 'Double ou rien — double. +650 cr.' }
            : { gs: { credits: gs.credits - 500 }, message: 'La maison ramasse. -500 cr.' },
        },
        {
          label: 'Haute mise — miser 1500 cr (45% → +2400)',
          available: gs => gs.credits >= 1500,
          result: gs => Math.random() < 0.45
            ? { gs: { credits: gs.credits + 2400 }, message: 'Le croupier blêmit. Tu empoches 2400 cr.' }
            : { gs: { credits: gs.credits - 1500 }, message: 'Perdu. -1500 cr. Le croupier ne sourit même pas.' },
        },
        {
          label: 'Table VIP — miser 3000 cr (40% → +6000) [Rép ≥ 60]',
          available: gs => gs.credits >= 3000 && gs.reputation >= 60,
          result: gs => Math.random() < 0.40
            ? { gs: { credits: gs.credits + 6000, reputation: gs.reputation + 10 }, message: 'La table VIP applaudit. +6000 cr, +10 rép.' }
            : { gs: { credits: gs.credits - 3000 }, message: 'Personne ne dit un mot. -3000 cr.' },
        },
        {
          label: 'Pirater les algorithmes (Hackeur — 75% → +1800 cr)',
          available: gs => gs.class.name === 'Hackeur' && gs.credits >= 500,
          result: gs => Math.random() < 0.75
            ? { gs: { credits: gs.credits + 1800 }, message: '[HACK] Odds biaisés. Tu gagnes systématiquement. +1800 cr.' }
            : { gs: { credits: gs.credits - 500, reputation: gs.reputation - 20 }, message: 'Samy a des bons techniciens. Détecté. -500 cr, -20 rép.' },
        },
        { label: 'Observer la folie ambiante', result: gs => ({ gs: {}, message: 'Quelqu\'un perd sa fortune. Quelqu\'un d\'autre gagne la sienne. Rien de nouveau.' }) },
      ],
    },
    {
      id: 'machines_samy',
      label: 'Les Machines de Samy — Paris clandestins',
      available: gs => gs.credits >= 200,
      description: 'Dans l\'arrière-salle, des paris sur des combats illégaux diffusés en direct. Des machines à sous trafiquées mais pas trop. L\'odeur de transgression à prix abordable.',
      choices: [
        {
          label: 'Machine à sous — 200 cr (3 roues, jackpot ×6, deux identiques ×1.5)',
          available: gs => gs.credits >= 200,
          result: gs => {
            const w = [rng(1, 6), rng(1, 6), rng(1, 6)]
            if (w[0] === w[1] && w[1] === w[2]) return { gs: { credits: gs.credits + 200 * 6 - 200 }, message: `🎰 [${w[0]}][${w[1]}][${w[2]}] JACKPOT ! +${200 * 6 - 200} cr.` }
            if (w[0] === w[1] || w[1] === w[2] || w[0] === w[2]) return { gs: { credits: gs.credits + Math.floor(200 * 1.5) - 200 }, message: `🎰 [${w[0]}][${w[1]}][${w[2]}] Deux identiques. +${Math.floor(200 * 1.5) - 200} cr.` }
            return { gs: { credits: gs.credits - 200 }, message: `🎰 [${w[0]}][${w[1]}][${w[2]}] Rien. -200 cr.` }
          },
        },
        {
          label: 'Machine à sous premium — 1000 cr (jackpot ×6)',
          available: gs => gs.credits >= 1000,
          result: gs => {
            const w = [rng(1, 6), rng(1, 6), rng(1, 6)]
            if (w[0] === w[1] && w[1] === w[2]) return { gs: { credits: gs.credits + 1000 * 6 - 1000 }, message: `🎰 [${w[0]}][${w[1]}][${w[2]}] JACKPOT PREMIUM ! +${1000 * 6 - 1000} cr.` }
            if (w[0] === w[1] || w[1] === w[2] || w[0] === w[2]) return { gs: { credits: gs.credits + Math.floor(1000 * 1.5) - 1000 }, message: `🎰 [${w[0]}][${w[1]}][${w[2]}] Deux identiques. +${Math.floor(1000 * 1.5) - 1000} cr.` }
            return { gs: { credits: gs.credits - 1000 }, message: `🎰 [${w[0]}][${w[1]}][${w[2]}] Rien. -1000 cr.` }
          },
        },
        {
          label: 'Parier sur un combat illégal — 600 cr (35% → ×3)',
          available: gs => gs.credits >= 600,
          result: gs => Math.random() < 0.35
            ? { gs: { credits: gs.credits + 600 * 3 - 600 }, message: `Ton combattant démolit l'adversaire. +${600 * 3 - 600} cr.` }
            : { gs: { credits: gs.credits - 600 }, message: 'Il tombe en trente secondes. -600 cr.' },
        },
        { label: 'Partir', result: gs => ({ gs: {}, message: '' }) },
      ],
    },
  ],

  'Les Bas-Fonds de Vega': [
    {
      id: 'dealer',
      label: 'Chercher un dealer',
      available: gs => gs.credits >= 200,
      description: 'Dans les ruelles basses, quelqu\'un vend des choses qui n\'existent pas officiellement.',
      choices: [
        {
          label: 'Acheter un stimulant de combat (300 cr)',
          available: gs => gs.credits >= 300,
          result: gs => ({
            gs: { credits: gs.credits - 300, maxStamina: gs.maxStamina + 20, stamina: Math.min(gs.stamina + 20, gs.maxStamina + 20) },
            message: '-300 cr. Stamina max +20 temporairement.',
          }),
        },
        {
          label: 'Acheter une info sur un convoi (400 cr)',
          available: gs => gs.credits >= 400,
          result: gs => ({
            gs: { credits: gs.credits - 400 + rng(600, 1200) },
            message: `-400 cr. L'info mène à un convoi. +${rng(600, 1200)} cr.`,
          }),
        },
        {
          label: 'Acheter des médicaments non tracés (150 cr)',
          available: gs => gs.credits >= 150,
          result: gs => ({
            gs: { credits: gs.credits - 150, cargo: { ...gs.cargo, 'Médicaments': (gs.cargo['Médicaments'] ?? 0) + 3 } },
            message: '-150 cr. +3 Médicaments.',
          }),
        },
        { label: 'Rien, trop risqué', result: gs => ({ gs: {}, message: '' }) },
      ],
    },
    {
      id: 'fence',
      label: 'Receleur local',
      available: gs => Object.keys(gs.cargo).length > 0,
      description: 'Il reprend n\'importe quoi sans poser de questions. Prix en dessous du marché.',
      choices: [
        {
          label: 'Vendre tout le cargo (+25% prix noir)',
          result: gs => {
            const total = Object.entries(gs.cargo).reduce((sum, [, qty]) => sum + qty * 120, 0)
            return { gs: { credits: gs.credits + total, cargo: {} }, message: `+${total} cr. Cargo vendu au noir.` }
          },
        },
        { label: 'Partir', result: gs => ({ gs: {}, message: '' }) },
      ],
    },
  ],

  'Fort Kharos': [
    {
      id: 'armoury_access',
      label: 'Accès à l\'armurerie militaire',
      available: gs => gs.credits >= 400,
      description: 'Un sergent te fait signe depuis le couloir. "T\'as l\'air de quelqu\'un qui sait utiliser du matériel. L\'armurerie vend quelques surplus — pas au catalogue officiel."',
      choices: [
        {
          label: 'Acheter des munitions spéciales (400 cr)',
          available: gs => gs.credits >= 400,
          result: gs => ({
            gs: { credits: gs.credits - 400, cargo: { ...gs.cargo, 'Munitions spéciales': (gs.cargo['Munitions spéciales'] ?? 0) + 2 } },
            message: '-400 cr. Il glisse deux caisses sans regarder. +2 Munitions spéciales.',
          }),
        },
        {
          label: 'Acheter des rations militaires (200 cr)',
          available: gs => gs.credits >= 200,
          result: gs => ({
            gs: { credits: gs.credits - 200, cargo: { ...gs.cargo, 'Rations militaires': (gs.cargo['Rations militaires'] ?? 0) + 3 } },
            message: '-200 cr. +3 Rations militaires. "Discrétion attendue."',
          }),
        },
        {
          label: 'Refuser',
          result: _ => ({ gs: {}, message: 'Il hoche la tête. Pas de problème.' }),
        },
      ],
    },
  ],

  'Nexus Aldara': [
    {
      id: 'data_market',
      label: 'Marché de données',
      available: gs => true,
      description: 'Des brokers vendent des informations classifiées. Certaines valent une fortune.',
      choices: [
        {
          label: 'Acheter des données commerciales (300 cr)',
          available: gs => gs.credits >= 300,
          result: gs => ({
            gs: { credits: gs.credits - 300 + rng(400, 900) },
            message: `-300 cr. Données revendues. +${rng(400, 900)} cr.`,
          }),
        },
        {
          label: 'Vendre tes propres infos',
          available: gs => gs.completedQuestIds.length >= 2,
          result: gs => ({
            gs: { credits: gs.credits + rng(200, 600) },
            message: `Tes infos ont de la valeur ici. +${rng(200, 600)} cr.`,
          }),
        },
        {
          label: 'Pirater le système (Hackeur)',
          available: gs => gs.class.name === 'Hackeur',
          result: gs => Math.random() < 0.75
            ? { gs: { credits: gs.credits + rng(800, 2000), reputation: gs.reputation + 20 }, message: '[HACK] Accès obtenu. +crédits, +20 rép.' }
            : { gs: { reputation: gs.reputation - 20 }, message: 'Détecté. -20 rép.' },
        },
        { label: 'Passer', result: gs => ({ gs: {}, message: '' }) },
      ],
    },
  ],

  'Le Purgatoire': [
    {
      id: 'rumor_network',
      label: 'Réseau des anciens prisonniers',
      available: gs => true,
      description: 'Les anciens détenus ont des contacts partout. Leur réseau vaut de l\'or.',
      choices: [
        {
          label: 'Acheter une info sur un convoi (200 cr)',
          available: gs => gs.credits >= 200,
          result: gs => ({
            gs: { credits: gs.credits - 200 + rng(300, 700) },
            message: `-200 cr. Info profitable. +${rng(300, 700)} cr.`,
          }),
        },
        {
          label: 'Proposer tes services comme passeur',
          result: gs => ({
            gs: { credits: gs.credits + rng(400, 1000), reputation: gs.reputation - 5 },
            message: `Contrat de passage accepté. +${rng(400, 1000)} cr. -5 rép (morale).`,
          }),
        },
        { label: 'Ignorer', result: gs => ({ gs: {}, message: '' }) },
      ],
    },
  ],

  'Arc Ouest Apocalypse': [
    {
      id: 'alanossa_contact',
      label: 'Contact avec les lieutenants d\'Alanossa',
      available: gs => gs.reputation >= 20 || gs.bossesDefeated >= 1,
      description: 'Des lieutenants t\'observent depuis ton arrivée. Un signe de tête — une invitation.',
      choices: [
        {
          label: 'Rencontrer le lieutenant',
          result: gs => ({
            gs: { credits: gs.credits + rng(500, 1500), reputation: gs.reputation + 20 },
            message: `Accord tacite. +${rng(500, 1500)} cr, +20 rép.`,
          }),
        },
        {
          label: 'Décliner',
          result: gs => ({ gs: {}, message: 'Il note ton refus. Ça compte.' }),
        },
      ],
    },
  ],
}

// ── ARÈNE DE KORSUN ──────────────────────────────────────────────────────────
;(STATION_EVENTS as Record<string, StationEvent[]>)["L'Arène de Korsun"] = [
  {
    id: 'tournament_register',
    label: 'Consulter l\'affiche du Tournoi',
    available: gs => gs.tournamentRound === 0,
    description: 'Une affiche massive barre le couloir d\'entrée. DIX COMBATS. DIX ADVERSAIRES. Le dernier debout repart avec la gloire et l\'or. Un portier te dévisage depuis l\'entrée de l\'arène.',
    choices: [
      {
        label: 'S\'inscrire — entrer dans l\'arène',
        result: () => ({ gs: {}, message: 'TOURNAMENT_START' }),
      },
      {
        label: 'Regarder le tableau des anciens champions',
        result: () => ({ gs: {}, message: 'Des noms. Des étoiles à côté de certains. Des croix rouges à côté de la plupart. Tu comptes les survivants sur une main.' }),
      },
      {
        label: 'Partir',
        result: () => ({ gs: {}, message: '' }),
      },
    ],
  },
  {
    id: 'tournament_ongoing',
    label: 'Tournoi en cours — Round suivant',
    available: gs => gs.tournamentRound > 0,
    description: 'Tu es inscrit. La foule attend. Le prochain adversaire se prépare derrière la porte.',
    choices: [
      {
        label: 'Continuer le tournoi',
        result: () => ({ gs: {}, message: 'TOURNAMENT_CONTINUE' }),
      },
      {
        label: 'Abandonner (disqualification)',
        result: gs => ({ gs: { tournamentRound: 0 }, message: 'Tu jettes l\'éponge. La foule hue. Pas de honte à survivre.' }),
      },
    ],
  },
]

export function getStationEvents(gs: GameState): StationEvent[] {
  const events = STATION_EVENTS[gs.currentStation] ?? []
  return events.filter(e => e.available(gs))
}

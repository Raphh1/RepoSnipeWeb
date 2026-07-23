import type { GameState } from '../types'
import { shiftPillar } from './memoryEvents'
import { arePillarSubBossesCleared } from '../data/subBosses'
import { HOLDER_BOUNTY_HUNTERS } from './nexus'

// ── VISITE PRIVÉE — le vol par la réputation ─────────────────────────────────
// Le vol n'est plus une tentative instantanée déclenchable à volonté : il faut
// avoir gagné assez de confiance auprès d'un détenteur pour qu'il t'invite chez
// lui. S'il te fait alors assez confiance, il te montre où se trouve le
// fragment — et tu repars avec. Chaque détenteur réagit différemment, en
// cohérence avec sa personnalité.

export interface BossHomeVisitDef {
  pillar: keyof GameState['pillarStanding']
  idx: number
  station: string
  // Réputation nécessaire pour être invité du tout.
  inviteThreshold: number
  // Réputation nécessaire pour que la confiance suffise à révéler le fragment.
  trustThreshold: number
  bossName: string
  inviteLine: string
  tourLine: string
  notYetLine: (gs: GameState) => string
  revealLine: string
}

export const BOSS_HOME_VISITS: BossHomeVisitDef[] = [
  {
    pillar: 'alanossa',
    idx: 0,
    station: 'Arc Ouest Apocalypse',
    inviteThreshold: 25,
    trustThreshold: 45,
    bossName: 'Alanossa',
    inviteLine: "Alanossa te bloque le passage avant que tu n'atteignes le hub. 'T'es pas comme les autres qui traînent ici.' Elle te jauge un instant. 'Viens. Je montre pas mes quartiers à n'importe qui.'",
    tourLine: "Ses quartiers privés sentent le métal et la poudre. Des trophées partout — armes de rivaux tombés, plaques de vaisseaux qu'elle a coulés. Aucune décoration inutile. Tout ici a été gagné, rien n'a été acheté.",
    notYetLine: gs => `Elle te regarde longuement, les bras croisés. 'T'es solide. Pas encore assez pour que je te montre tout.' Elle désigne la sortie sans hostilité. Standing actuel : ${((gs.pillarStanding ?? {}) as Record<string, number>).alanossa ?? 0}/${45}.`,
    revealLine: "Elle s'arrête devant un coffre sans serrure apparente — juste posé là, comme un défi. 'Personne y touche parce que personne oserait.' Elle hausse les épaules. 'T'as osé plein de trucs pour arriver jusqu'ici. Autant que ce soit pour quelque chose.' Elle tourne le dos. Le message est clair.",
  },
  {
    pillar: 'cesarion',
    idx: 1,
    station: 'Emporium Requiem',
    inviteThreshold: 35,
    trustThreshold: 60,
    bossName: 'Cesarion',
    inviteLine: "Un aide de camp t'intercepte, protocole impeccable. 'L'Empereur a noté vos états de service. Il vous accorde une audience privée — dans ses appartements, pas la salle du trône.'",
    tourLine: "Cesarion te fait traverser une galerie d'archives personnelles — traités, décrets, portraits de prédécesseurs qu'il a écartés du pouvoir. 'Chaque objet ici raconte comment on garde ce qu'on a pris.' Il ne s'arrête jamais longtemps sur rien.",
    notYetLine: gs => `Il t'observe avec la froideur d'un comptable qui vérifie un bilan. 'Vos services sont notés. Insuffisants pour la suite.' Standing actuel : ${((gs.pillarStanding ?? {}) as Record<string, number>).cesarion ?? 0}/${60}.`,
    revealLine: "Il s'arrête devant un coffre blindé, dissimulé derrière un tableau. 'La confiance de l'Empire ne se décrète pas — elle se calcule. Votre dossier est... concluant.' Il ouvre le coffre d'un geste sec et s'écarte, sans un mot de plus.",
  },
  {
    pillar: 'raphazarus',
    idx: 2,
    station: "L'Arc Perdu",
    inviteThreshold: 30,
    trustThreshold: 55,
    bossName: 'Raphazarus',
    inviteLine: "Raphazarus t'attend sur le pont, seul. 'Viens. Il y a des endroits de cette station que je ne montre à personne.' Sa voix est calme — celle d'un homme qui n'a plus rien à prouver.",
    tourLine: "Il te guide à travers un mémorial silencieux — les noms de son bataillon entier, gravés un par un. Des objets personnels de soldats morts depuis des décennies, toujours à leur place. 'Ils méritaient mieux que d'être oubliés. Je fais ce que je peux.'",
    notYetLine: gs => `Il s'arrête, te regarde longtemps. 'Tu portes encore trop de doutes pour que je te confie ça.' Ce n'est pas un reproche — juste un constat. Standing actuel : ${((gs.pillarStanding ?? {}) as Record<string, number>).raphazarus ?? 0}/${55}.`,
    revealLine: "Il s'arrête devant une simple caisse militaire, non verrouillée, posée entre deux plaques commémoratives. 'Quarante-sept ans que je le garde ici. Personne ne l'a jamais cherché d'aussi près que toi.' Il ne l'ouvre pas lui-même. 'Vas-y.'",
  },
  {
    pillar: 'scotty',
    idx: 3,
    station: 'Scotty Golden North',
    inviteThreshold: 20,
    trustThreshold: 40,
    bossName: 'Samy Scotty',
    inviteLine: "Un serveur en costume te guide vers une porte discrète au fond du casino. Scotty t'attend, deux verres déjà servis. 'La salle VIP. Réservée aux gens que j'aime vraiment perdre du temps avec.'",
    tourLine: "Il te montre sa collection privée — pas ses gains, ses meilleures parties. Une carte encadrée, un dé fêlé, une photo d'une table qu'il a fait sauter à lui seul. 'Chaque objet ici, c'est une histoire que je raconte jamais deux fois pareil.'",
    notYetLine: gs => `Il trinque avec toi mais garde son sourire de façade. 'T'es sympa. Pas encore du genre à qui je montre les vraies affaires.' Standing actuel : ${((gs.pillarStanding ?? {}) as Record<string, number>).scotty ?? 0}/${40}.`,
    revealLine: "Il pousse discrètement un pan du mur — un compartiment que même ses gardes du corps ignorent. 'T'as jamais essayé de me rouler. Rare, dans mon métier.' Il te fait signe de prendre le fragment. 'Considère ça comme... une dette que je choisis de payer.'",
  },
]

export function getBossHomeVisit(pillar: string): BossHomeVisitDef | undefined {
  return BOSS_HOME_VISITS.find(v => v.pillar === pillar)
}

// Vérifie si une visite privée doit se déclencher à l'arrivée sur la station.
export function checkBossHomeVisit(gs: GameState): BossHomeVisitDef | null {
  const collected = gs.nexusFragments ?? []
  const angered = gs.nexusAngered ?? []

  for (const def of BOSS_HOME_VISITS) {
    if (gs.currentStation !== def.station) continue
    if (collected.includes(def.idx)) continue
    if (angered.includes(def.pillar)) continue
    const defeated = gs.subBossesDefeated ?? {}
    if (!arePillarSubBossesCleared(defeated, def.pillar)) continue
    const standing = ((gs.pillarStanding ?? {}) as Record<string, number>)[def.pillar] ?? 0
    if (standing < def.inviteThreshold) continue
    return def
  }
  return null
}

export interface BossHomeVisitResult {
  revealed: boolean
  message: string
  patch: Partial<GameState>
}

// Résout la visite : révèle le fragment si la confiance est suffisante.
export function resolveBossHomeVisit(gs: GameState, def: BossHomeVisitDef): BossHomeVisitResult {
  const standing = ((gs.pillarStanding ?? {}) as Record<string, number>)[def.pillar] ?? 0
  const trusted = standing >= def.trustThreshold

  if (!trusted) {
    return {
      revealed: false,
      message: def.notYetLine(gs),
      patch: { pillarStanding: shiftPillar(gs, def.pillar, +2) },
    }
  }

  // Voler dans le dos d'un détenteur, c'est une trahison — il ne le prend pas
  // bien. Colère permanente, standing durement sanctionné, et un chasseur de
  // primes se lance immédiatement à tes trousses, partout, sans relâche,
  // jusqu'à ce qu'il te rattrape (et récupère le fragment) ou que tu le battes.
  const hunter = HOLDER_BOUNTY_HUNTERS[def.pillar]
  const angered = [...(gs.nexusAngered ?? []).filter(p => p !== def.pillar), def.pillar]

  return {
    revealed: true,
    message: `${def.revealLine} Ce que ${def.bossName} ne sait pas encore : ${hunter?.name ?? 'quelqu\'un'} le saura bientôt, et sera envoyé pour le récupérer. Tu ne seras en sécurité nulle part avant de le semer ou de le vaincre.`,
    patch: {
      pillarStanding: shiftPillar(gs, def.pillar, -70),
      nexusAngered: angered,
      ...(hunter ? {
        stalker: {
          name: hunter.name,
          station: gs.currentStation,
          closingIn: true,
          daysSinceLastSeen: gs.day,
          threatLevel: hunter.threatLevel,
          daysActive: 0,
          avengingPillar: def.pillar,
        },
      } : {}),
    },
  }
}

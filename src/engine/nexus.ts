import type { GameState } from '../types'
import { shiftPillar } from './memoryEvents'

// ── DÉFINITION DES FRAGMENTS ──────────────────────────────────────────────────

export interface NexusFragment {
  idx: number
  pillar: string
  station: string
  name: string
  lore: string
}

export const NEXUS_FRAGMENTS: NexusFragment[] = [
  {
    idx: 0,
    pillar: 'alanossa',
    station: 'Arc Ouest Apocalypse',
    name: 'Fragment d\'Alanossa',
    lore: "La grande pirate le garde comme un trophée de guerre. Elle l'a arraché lors de la Purge de l'Ouest — au prix de la moitié de son équipage. Pour elle, il représente ce que personne ne peut lui prendre. Sauf peut-être quelqu'un qui mérite de le détenir.",
  },
  {
    idx: 1,
    pillar: 'cesarion',
    station: 'Emporium Requiem',
    name: 'Fragment Impérial',
    lore: "Cesarion ne cède rien. Il possède le fragment depuis avant qu'il monte sur le trône — héritage d'un père qu'il a lui-même renversé. Sa valeur n'est pas symbolique : elle est stratégique. Y toucher, c'est attaquer l'Emporium entier.",
  },
  {
    idx: 2,
    pillar: 'eliotis',
    station: "L'Arc Perdu",
    name: 'Fragment Originel',
    lore: "Eliotis est la dernière mémoire vivante du Nexus d'avant. Personne ne sait depuis combien de temps ils attendent dans L'Arc Perdu. Le fragment qu'ils gardent est le premier — celui qui a tout commencé. Ils ne le céderont qu'à celui qui a prouvé comprendre ce que le Nexus signifie vraiment.",
  },
  {
    idx: 3,
    pillar: 'scotty',
    station: 'Scotty Golden North',
    name: 'Fragment de Scotty',
    lore: "Samy Scotty l'a obtenu aux cartes, il y a longtemps. Il le garde dans son coffre-fort personnel, entre une bouteille de whisky vieux et un pistolet chargé. Pour lui, tout a un prix — mais le prix n'est pas toujours en crédits.",
  },
]

// ── TYPE D'ACTION ─────────────────────────────────────────────────────────────

export type NexusAction = 'force' | 'pay' | 'alliance' | 'legendary' | 'gamble' | 'steal' | 'lore'

export interface NexusResult {
  success: boolean
  message: string
  newGs?: Partial<GameState>
  triggerCombat?: boolean
  pillarBossName?: string
}

// ── CONDITIONS PAR FRAGMENT ───────────────────────────────────────────────────

export function canAttempt(gs: GameState, idx: number, action: NexusAction): { ok: boolean; reason?: string } {
  const standing = gs.pillarStanding ?? { cesarion: 0, raphazarus: 0, eliotis: 0, maxance: 0, alanossa: 0, scotty: 0 }
  const decisions = gs.pastDecisions ?? []
  const nexusDone = gs.nexusFragments ?? []

  switch (idx) {

    // ── ALANOSSA ──────────────────────────────────────────────────────────────
    case 0:
      if (action === 'force')
        return { ok: true }
      if (action === 'pay') {
        if (standing.alanossa < -10)
          return { ok: false, reason: 'Standing Alanossa trop négatif — elle refuse de traiter avec toi' }
        return gs.credits >= 12000
          ? { ok: true }
          : { ok: false, reason: `Manque ${(12000 - gs.credits).toLocaleString()} cr` }
      }
      if (action === 'alliance') {
        const cond = standing.alanossa >= 28 && gs.reputation >= 55 && (gs.combatsWon ?? 0) >= 4
        if (!cond) {
          const missing = []
          if (standing.alanossa < 28) missing.push(`Standing Alanossa ${standing.alanossa}/28`)
          if (gs.reputation < 55) missing.push(`Réputation ${gs.reputation}/55`)
          if ((gs.combatsWon ?? 0) < 4) missing.push(`Combats gagnés ${gs.combatsWon ?? 0}/4`)
          return { ok: false, reason: missing.join(' · ') }
        }
        return { ok: true }
      }
      if (action === 'steal') {
        if (!['Vagabond', 'Contrebandier'].includes(gs.class.name))
          return { ok: false, reason: 'Classe Vagabond ou Contrebandier requise' }
        if (standing.alanossa < 0)
          return { ok: false, reason: 'Standing Alanossa négatif — elle te surveille' }
        return { ok: true }
      }
      return { ok: false, reason: 'Méthode indisponible' }

    // ── CESARION — le plus exigeant ──────────────────────────────────────────
    case 1:
      if (action === 'force') {
        if (!gs.equippedWeapon)
          return { ok: false, reason: 'Cesarion refuse le combat face à quelqu\'un de désarmé — équipe une arme' }
        return { ok: true }
      }
      if (action === 'pay')
        return gs.credits >= 18000
          ? { ok: true }
          : { ok: false, reason: `Manque ${(18000 - gs.credits).toLocaleString()} cr` }
      if (action === 'alliance') {
        const cond = standing.cesarion >= 45 && gs.factionReputation.emporium >= 35 && gs.completedQuestIds.length >= 3
        if (!cond) {
          const missing = []
          if (standing.cesarion < 45) missing.push(`Standing Cesarion ${standing.cesarion}/45`)
          if (gs.factionReputation.emporium < 35) missing.push(`Rép. Emporium ${gs.factionReputation.emporium}/35`)
          if (gs.completedQuestIds.length < 3) missing.push(`Quêtes complétées ${gs.completedQuestIds.length}/3`)
          return { ok: false, reason: missing.join(' · ') }
        }
        return { ok: true }
      }
      if (action === 'legendary') {
        if (!gs.weapons.some(w => w.tier >= 5))
          return { ok: false, reason: 'Aucune arme Tier 5 en possession' }
        if (standing.cesarion < 10)
          return { ok: false, reason: `Standing Cesarion trop faible (${standing.cesarion}/10) — il ne t'accorde pas cette transaction` }
        return { ok: true }
      }
      return { ok: false, reason: 'Méthode indisponible' }

    // ── ELIOTIS — le plus mystérieux ─────────────────────────────────────────
    case 2:
      if (action === 'force')
        return { ok: true }
      if (action === 'alliance') {
        const cond = nexusDone.length >= 2 && standing.eliotis >= 10
        if (!cond) {
          const missing = []
          if (nexusDone.length < 2) missing.push(`Fragments collectés ${nexusDone.length}/2 requis d'abord`)
          if (standing.eliotis < 10) missing.push(`Standing Eliotis ${standing.eliotis}/10`)
          return { ok: false, reason: missing.join(' · ') }
        }
        return { ok: true }
      }
      if (action === 'legendary') {
        if (!gs.weapons.some(w => w.tier >= 5))
          return { ok: false, reason: 'Aucune arme Tier 5 en possession' }
        if ((gs.bossesDefeated ?? 0) < 2)
          return { ok: false, reason: `Boss vaincus ${gs.bossesDefeated ?? 0}/2 requis` }
        if (nexusDone.length < 1)
          return { ok: false, reason: 'Récupère au moins 1 autre fragment d\'abord' }
        return { ok: true }
      }
      if (action === 'lore') {
        const loreCount = (gs.discoveredLore ?? []).length
        const cond = loreCount >= 5 && gs.reputation >= 40 && gs.day >= 8
        if (!cond) {
          const missing = []
          if (loreCount < 5) missing.push(`Fragments de lore ${loreCount}/5`)
          if (gs.reputation < 40) missing.push(`Réputation ${gs.reputation}/40`)
          if (gs.day < 8) missing.push(`Jours ${gs.day}/8`)
          return { ok: false, reason: missing.join(' · ') }
        }
        return { ok: true }
      }
      return { ok: false, reason: 'Méthode indisponible' }

    // ── SAMY SCOTTY ──────────────────────────────────────────────────────────
    case 3:
      if (action === 'force')
        return { ok: true }
      if (action === 'pay')
        return gs.credits >= 8000
          ? { ok: true }
          : { ok: false, reason: `Manque ${(8000 - gs.credits).toLocaleString()} cr` }
      if (action === 'alliance') {
        const cond = standing.scotty >= 25 && gs.day >= 5
        if (!cond) {
          const missing = []
          if (standing.scotty < 25) missing.push(`Standing Scotty ${standing.scotty}/25`)
          if (gs.day < 5) missing.push(`Jour ${gs.day}/5 (il faut le temps de se faire connaître)`)
          return { ok: false, reason: missing.join(' · ') }
        }
        return { ok: true }
      }
      if (action === 'gamble')
        return gs.credits >= 5000
          ? { ok: true }
          : { ok: false, reason: 'Mise minimale 5 000 cr' }
      return { ok: false, reason: 'Méthode indisponible' }

    default:
      return { ok: false, reason: 'Fragment inconnu' }
  }
}

// ── TENTATIVE D'OBTENTION ─────────────────────────────────────────────────────

export function attemptNexusFragment(
  gs: GameState,
  idx: number,
  action: NexusAction
): NexusResult {
  const check = canAttempt(gs, idx, action)
  if (!check.ok) return { success: false, message: check.reason ?? 'Conditions non remplies.' }

  const standing = gs.pillarStanding ?? { cesarion: 0, raphazarus: 0, eliotis: 0, maxance: 0, alanossa: 0, scotty: 0 }

  switch (idx) {

    // ── ALANOSSA ──────────────────────────────────────────────────────────
    case 0:
      if (action === 'force') {
        return { success: true, message: "Tu l'affrontes en plein pont de commandement. Elle rit et sort sa lame. 'C'est le meilleur argument que j'aie entendu aujourd'hui.'", triggerCombat: true, pillarBossName: 'Alanossa' }
      }
      if (action === 'pay') {
        return {
          success: true,
          message: "Elle compte les crédits sans se presser. 'Quelqu'un qui paie sans négocier, ça en dit long sur lui. Ou alors il est stupide.' Elle sourit. 'J'espère que c'est le premier cas.' -12 000 cr.",
          newGs: { credits: gs.credits - 12000, pillarStanding: shiftPillar(gs, 'alanossa', -3) }
        }
      }
      if (action === 'alliance') {
        const byRep = gs.reputation >= 70
        return {
          success: true,
          message: byRep
            ? "Elle t'étudie longuement avant de parler. 'Ta réputation est arrivée avant toi dans chaque station de ce secteur. Je fais confiance aux rumeurs — quand elles ont l'air vraies.' Elle pose le fragment dans ta main."
            : "Elle tape le fragment contre la paume de sa main, une, deux, trois fois. 'Ton standing ici, tes combats, ta gueule — tout ça parle pour toi. Prends-le. Et reviens si t'es encore en vie dans six mois.'",
          newGs: { pillarStanding: shiftPillar(gs, 'alanossa', +15) }
        }
      }
      if (action === 'steal') {
        const ok = Math.random() < 0.55
        if (ok) return {
          success: true,
          message: "Il a disparu de sa ceinture avant qu'elle remette le pied dans la pièce. Une heure plus tard, tu entends son rire résonner dans tout le vaisseau — 'QUI L'A FAIT ?!' Elle sait pas. Pas encore.",
          newGs: { pillarStanding: shiftPillar(gs, 'alanossa', -25) }
        }
        return {
          success: false,
          message: "Elle te voit. Ses yeux descendent vers sa ceinture, puis remontent vers toi. Un long silence. 'Bien tenté.' Ce qu'elle fait ensuite n'est pas agréable. -standing, -PV.",
          newGs: { pillarStanding: shiftPillar(gs, 'alanossa', -18), playerHp: Math.max(1, gs.playerHp - 40) }
        }
      }
      break

    // ── CESARION ──────────────────────────────────────────────────────────
    case 1:
      if (action === 'force') {
        return { success: true, message: "Tu défies Cesarion dans son propre trône. Il se lève lentement. 'Je t'accorde le respect de ne pas appeler les gardes.' Il sort une lame de derrière le dossier. 'Tu vas le regretter.'", triggerCombat: true, pillarBossName: 'Cesarion' }
      }
      if (action === 'pay') {
        return {
          success: true,
          message: "'18 000. Transaction enregistrée.' Il signe le document sans lever les yeux. 'Tu peux sortir.' C'est tout. L'Emporium fonctionne ainsi. -18 000 cr.",
          newGs: { credits: gs.credits - 18000, pillarStanding: shiftPillar(gs, 'cesarion', +5) }
        }
      }
      if (action === 'alliance') {
        return {
          success: true,
          message: "Il prend le temps de lire ton dossier complet — chaque quête, chaque faction, chaque décision enregistrée. Un silence d'une minute entière. 'Tu as servi cet empire sans le savoir. On ne fait pas ça sans que ça se voie.' Il retire le fragment d'un tiroir fermé à clé. 'Une dette mérite un retour.'",
          newGs: { pillarStanding: shiftPillar(gs, 'cesarion', +20), factionReputation: { ...gs.factionReputation, emporium: gs.factionReputation.emporium + 15 } }
        }
      }
      if (action === 'legendary') {
        const kept = gs.weapons.filter(w => w.tier < 5)
        const offered = gs.weapons.find(w => w.tier >= 5)
        return {
          success: true,
          message: `Tu poses ${offered?.name ?? 'l\'arme'} sur son bureau. Cesarion ne la touche pas immédiatement. Il la regarde. Puis il la prend, la tourne dans ses mains, vérifie le tranchant. 'L'acier de qualité mérite acier de qualité.' Il ouvre son coffre. 'L'échange est équitable.' -${offered?.name ?? 'arme Tier 5'}`,
          newGs: { weapons: kept, pillarStanding: shiftPillar(gs, 'cesarion', +12) }
        }
      }
      break

    // ── ELIOTIS ───────────────────────────────────────────────────────────
    case 2:
      if (action === 'force') {
        return { success: true, message: "Eliotis incline la tête très légèrement, comme si quelque chose venait de confirmer une vieille théorie. 'Intéressant. Tu choisis la force.' Ils se lèvent — et ce qu'ils sortent de derrière leur manteau n'est pas une arme normale.", triggerCombat: true, pillarBossName: 'Eliotis' }
      }
      if (action === 'alliance') {
        const byFragments = (gs.nexusFragments ?? []).length >= 3
        return {
          success: true,
          message: byFragments
            ? "Eliotis te regarde longtemps. 'Tu as convaincu trois gardiens. Tu as fait ce que personne n'avait fait depuis la Grande Rupture.' Ils posent le fragment dans ta main avec une douceur étrange. 'Le Nexus t'attendait. Je commençais à en douter.'"
            : `'Tu comprends ce que tu demandes. Et tu as prouvé que tu méritais de le demander.' Eliotis tend le fragment. 'Deux autres t'ont fait confiance. Je ne serai pas le seul à refuser.' Standing Eliotis : ${standing.eliotis}. Fragments : ${(gs.nexusFragments ?? []).length + 1}/4.`,
          newGs: { pillarStanding: shiftPillar(gs, 'eliotis', +20) }
        }
      }
      if (action === 'legendary') {
        const kept = gs.weapons.filter(w => w.tier < 5)
        const offered = gs.weapons.find(w => w.tier >= 5)
        return {
          success: true,
          message: `Eliotis examine l'arme en silence pendant très longtemps. 'Tu l'as gagnée. Et tu la cèdes.' Ils hochent la tête une fois, comme si la réponse venait enfin. 'Voilà quelqu'un qui comprend ce que valent les choses.' Le fragment change de main. -${offered?.name ?? 'arme Tier 5'}`,
          newGs: { weapons: kept, reputation: gs.reputation + 25 }
        }
      }
      if (action === 'lore') {
        return {
          success: true,
          message: "'Tu as trouvé les fragments de mémoire. Tu as cherché à comprendre, pas juste à prendre.' Eliotis ferme les yeux un moment. 'Il y a longtemps, j'aurais refusé à quiconque venait avec des armes et de l'argent. Toi, tu es venu avec des questions.' Ils te tendent le fragment originel sans cérémonie. 'Le Nexus se souvient de ceux qui se souviennent de lui.'",
          newGs: {
            pillarStanding: shiftPillar(gs, 'eliotis', +25),
            pastDecisions: [...(gs.pastDecisions ?? []).filter(d => d !== 'nexus-seeker'), 'nexus-seeker-honored'],
          }
        }
      }
      break

    // ── SCOTTY ────────────────────────────────────────────────────────────
    case 3:
      if (action === 'force') {
        return { success: true, message: "'Tss. Tu pouvais juste payer.' Il siffle. Les gardes entrent par trois portes différentes. Scotty se rassied avec son verre. 'Je regarde, moi. C'est plus intéressant comme ça.'", triggerCombat: true, pillarBossName: 'Samy Scotty' }
      }
      if (action === 'pay') {
        return {
          success: true,
          message: "Scotty regarde les crédits transiter sur son terminal. 'Toujours un plaisir de traiter avec quelqu'un qui comprend la valeur des choses.' Il ouvre son coffre et en sort le fragment entre deux doigts. 'Je savais pas que ça valait ça. Maintenant si. Bonne route.' -8 000 cr.",
          newGs: { credits: gs.credits - 8000, pillarStanding: shiftPillar(gs, 'scotty', +8) }
        }
      }
      if (action === 'alliance') {
        return {
          success: true,
          message: "Scotty t'observe par-dessus son verre. 'T'as été dans les parages. T'as jamais triché, jamais mal joué.' Il se lève pour ouvrir son coffre. 'Dans mon métier, la loyauté dure rarement. La tienne oui.' Il te tend le fragment. 'Maintenant, bois quelque chose.'",
          newGs: { pillarStanding: shiftPillar(gs, 'scotty', +15) }
        }
      }
      if (action === 'gamble') {
        const win = Math.random() < 0.50
        if (win) return {
          success: true,
          message: "Les cartes tombent dans ton sens. Scotty fixe la table. Puis il rit — vraiment, franchement. 'Bon. D'accord. T'as gagné ce truc-là plus honnêtement que moi.' Il sort le fragment et le pose au centre de la table. 'Accord de joueur, accord de gentleman. Ramasse.'",
          newGs: { pillarStanding: shiftPillar(gs, 'scotty', +10) }
        }
        return {
          success: false,
          message: "Les cartes ne mentent pas. Scotty empoche les crédits sans un mot, puis hausse les épaules. 'La maison gagne toujours. Mais l'offre tient.' -5 000 cr.",
          newGs: { credits: gs.credits - 5000 }
        }
      }
      break
  }

  return { success: false, message: "Quelque chose a mal tourné." }
}

// ── HELPERS UI ────────────────────────────────────────────────────────────────

export function isFragmentAvailable(gs: GameState, idx: number): boolean {
  const f = NEXUS_FRAGMENTS[idx]
  return gs.currentStation === f.station && !(gs.nexusFragments ?? []).includes(idx)
}

export function getFragmentStatusLabel(gs: GameState, idx: number): string {
  if ((gs.nexusFragments ?? []).includes(idx)) return 'COLLECTÉ'
  if (gs.currentStation === NEXUS_FRAGMENTS[idx].station) return 'DISPONIBLE'
  return NEXUS_FRAGMENTS[idx].station
}

export function getPillarStandingLabel(gs: GameState, pillar: keyof GameState['pillarStanding']): string {
  const v = (gs.pillarStanding ?? {})[pillar] ?? 0
  if (v >= 60) return 'Allié'
  if (v >= 30) return 'Respecté'
  if (v >= 10) return 'Connu'
  if (v >= -10) return 'Neutre'
  if (v >= -30) return 'Méfiant'
  return 'Ennemi'
}

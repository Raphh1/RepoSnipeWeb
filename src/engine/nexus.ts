import type { GameState, NexusWar } from '../types'
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
    name: "Fragment d'Alanossa",
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
    pillar: 'maxance',
    station: 'Paradoxa Eterna',
    name: 'Fragment Royal',
    lore: "Le Roi Maxance a hérité du fragment de sa mère, la dernière reine avant la Fracture. Il le garde non par cupidité mais par devoir — il croit sincèrement être son gardien légitime. Il ne le cédera qu'à quelqu'un qui lui prouvera mériter sa confiance absolue. La trahison, pour lui, est la seule chose impardonnable.",
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

export type NexusAction =
  | 'force'       // Combat direct
  | 'pay'         // Transaction financière
  | 'alliance'    // Relation + standing
  | 'legendary'   // Sacrifice arme tier 5
  | 'gamble'      // Pari (Scotty)
  | 'steal'       // Vol (classes voleur)
  | 'lore'        // (héritage Eliotis — non utilisé)
  | 'war'         // Déclencher une guerre entre deux détenteurs
  | 'betray'      // Trahir après alliance
  | 'manipulate'  // Entourloupe sans combat

export interface NexusResult {
  success: boolean
  message: string
  newGs?: Partial<GameState>
  triggerCombat?: boolean
  pillarBossName?: string
  triggersWar?: { holderA: string; holderB: string }
  spawnsBounty?: boolean
}

// ── HELPERS INTERNES ──────────────────────────────────────────────────────────

function getStanding(gs: GameState, pillar: string): number {
  return ((gs.pillarStanding ?? {}) as Record<string, number>)[pillar] ?? 0
}

function hasMetHolder(gs: GameState, pillar: string): boolean {
  return (gs.pastDecisions ?? []).some(d => d === `met-${pillar}` || d === `alliance-${pillar}`)
}

// ── CONDITIONS PAR FRAGMENT ───────────────────────────────────────────────────

export function canAttempt(gs: GameState, idx: number, action: NexusAction): { ok: boolean; reason?: string } {
  const nexusDone = gs.nexusFragments ?? []
  const angered = gs.nexusAngered ?? []
  const decisions = gs.pastDecisions ?? []

  const pillarMap: Record<number, string> = { 0: 'alanossa', 1: 'cesarion', 2: 'maxance', 3: 'scotty' }
  const pillar = pillarMap[idx]

  if (pillar && angered.includes(pillar) && action !== 'force')
    return { ok: false, reason: `${pillar.charAt(0).toUpperCase() + pillar.slice(1)} est ton ennemi juré — seul le combat est possible` }

  switch (idx) {

    // ── ALANOSSA ──────────────────────────────────────────────────────────────
    case 0:
      if (action === 'force') return { ok: true }
      if (action === 'pay') {
        if (getStanding(gs, 'alanossa') < -10) return { ok: false, reason: 'Standing Alanossa trop négatif — elle refuse de traiter avec toi' }
        return gs.credits >= 12000 ? { ok: true } : { ok: false, reason: `Manque ${(12000 - gs.credits).toLocaleString()} cr` }
      }
      if (action === 'alliance') {
        const ok = getStanding(gs, 'alanossa') >= 28 && gs.reputation >= 55 && (gs.combatsWon ?? 0) >= 4
        if (!ok) {
          const m: string[] = []
          if (getStanding(gs, 'alanossa') < 28) m.push(`Standing Alanossa ${getStanding(gs, 'alanossa')}/28`)
          if (gs.reputation < 55) m.push(`Réputation ${gs.reputation}/55`)
          if ((gs.combatsWon ?? 0) < 4) m.push(`Combats gagnés ${gs.combatsWon ?? 0}/4`)
          return { ok: false, reason: m.join(' · ') }
        }
        return { ok: true }
      }
      if (action === 'steal') {
        if (!['Vagabond', 'Contrebandier'].includes(gs.class.name)) return { ok: false, reason: 'Classe Vagabond ou Contrebandier requise' }
        if (getStanding(gs, 'alanossa') < 0) return { ok: false, reason: 'Standing Alanossa négatif — elle te surveille trop' }
        return { ok: true }
      }
      if (action === 'war') {
        const targets = ['cesarion', 'maxance', 'scotty'].filter(p => hasMetHolder(gs, p))
        if (targets.length === 0) return { ok: false, reason: 'Rencontre d\'abord un autre détenteur pour semer la discorde' }
        if (getStanding(gs, 'alanossa') < 5) return { ok: false, reason: 'Standing Alanossa insuffisant — elle ne t\'écouterait pas' }
        return { ok: true }
      }
      if (action === 'betray') {
        if (getStanding(gs, 'alanossa') < 28) return { ok: false, reason: 'Atteins d\'abord le niveau Alliance avec Alanossa' }
        if (!decisions.includes('alliance-alanossa')) return { ok: false, reason: 'Forme d\'abord une alliance avec Alanossa' }
        return { ok: true }
      }
      if (action === 'manipulate') {
        if (getStanding(gs, 'alanossa') < 15) return { ok: false, reason: `Standing Alanossa insuffisant (${getStanding(gs, 'alanossa')}/15)` }
        if (gs.credits < 5000) return { ok: false, reason: 'Manque de crédits pour l\'entourloupe (5000 cr)' }
        return { ok: true }
      }
      return { ok: false, reason: 'Méthode indisponible' }

    // ── CESARION ──────────────────────────────────────────────────────────────
    case 1:
      if (action === 'force') {
        if (!gs.equippedWeapon) return { ok: false, reason: "Cesarion refuse le combat face à quelqu'un de désarmé" }
        return { ok: true }
      }
      if (action === 'pay') return gs.credits >= 18000 ? { ok: true } : { ok: false, reason: `Manque ${(18000 - gs.credits).toLocaleString()} cr` }
      if (action === 'alliance') {
        const ok = getStanding(gs, 'cesarion') >= 45 && gs.factionReputation.emporium >= 35 && gs.completedQuestIds.length >= 3
        if (!ok) {
          const m: string[] = []
          if (getStanding(gs, 'cesarion') < 45) m.push(`Standing Cesarion ${getStanding(gs, 'cesarion')}/45`)
          if (gs.factionReputation.emporium < 35) m.push(`Rép. Emporium ${gs.factionReputation.emporium}/35`)
          if (gs.completedQuestIds.length < 3) m.push(`Quêtes complétées ${gs.completedQuestIds.length}/3`)
          return { ok: false, reason: m.join(' · ') }
        }
        return { ok: true }
      }
      if (action === 'legendary') {
        if (!gs.weapons.some(w => w.tier >= 5)) return { ok: false, reason: 'Aucune arme Tier 5 en possession' }
        if (getStanding(gs, 'cesarion') < 10) return { ok: false, reason: `Standing Cesarion trop faible (${getStanding(gs, 'cesarion')}/10)` }
        return { ok: true }
      }
      if (action === 'war') {
        const targets = ['alanossa', 'maxance', 'scotty'].filter(p => hasMetHolder(gs, p))
        if (targets.length === 0) return { ok: false, reason: 'Rencontre d\'abord un autre détenteur' }
        if (getStanding(gs, 'cesarion') < 5) return { ok: false, reason: 'Standing Cesarion insuffisant — il ne t\'accordera pas d\'audience' }
        return { ok: true }
      }
      if (action === 'betray') {
        if (getStanding(gs, 'cesarion') < 45) return { ok: false, reason: 'Atteins d\'abord le niveau Alliance avec Cesarion' }
        if (!decisions.includes('alliance-cesarion')) return { ok: false, reason: 'Forme d\'abord une alliance avec Cesarion' }
        return { ok: true }
      }
      if (action === 'manipulate') {
        if (getStanding(gs, 'cesarion') < 20) return { ok: false, reason: `Standing Cesarion insuffisant (${getStanding(gs, 'cesarion')}/20)` }
        if (gs.credits < 8000) return { ok: false, reason: 'Manque de crédits pour l\'opération (8000 cr)' }
        if (gs.completedQuestIds.length < 2) return { ok: false, reason: 'Pas assez d\'antécédents — Cesarion vérifie tout' }
        return { ok: true }
      }
      return { ok: false, reason: 'Méthode indisponible' }

    // ── ROI MAXANCE ───────────────────────────────────────────────────────────
    case 2:
      if (action === 'force') return { ok: true }
      if (action === 'pay') {
        if (getStanding(gs, 'maxance') < -5) return { ok: false, reason: "Maxance juge l'argent comme une insulte — standing trop négatif" }
        return gs.credits >= 15000 ? { ok: true } : { ok: false, reason: `Manque ${(15000 - gs.credits).toLocaleString()} cr` }
      }
      if (action === 'alliance') {
        const ok = getStanding(gs, 'maxance') >= 35 && gs.reputation >= 45 && nexusDone.length >= 1
        if (!ok) {
          const m: string[] = []
          if (getStanding(gs, 'maxance') < 35) m.push(`Standing Maxance ${getStanding(gs, 'maxance')}/35`)
          if (gs.reputation < 45) m.push(`Réputation ${gs.reputation}/45`)
          if (nexusDone.length < 1) m.push(`Collecte d\'abord un autre fragment`)
          return { ok: false, reason: m.join(' · ') }
        }
        return { ok: true }
      }
      if (action === 'legendary') {
        if (!gs.weapons.some(w => w.tier >= 5)) return { ok: false, reason: 'Aucune arme Tier 5 — Maxance n\'accepte que les armes de légende' }
        if (getStanding(gs, 'maxance') < 5) return { ok: false, reason: `Standing Maxance insuffisant (${getStanding(gs, 'maxance')}/5)` }
        return { ok: true }
      }
      if (action === 'war') {
        const targets = ['alanossa', 'cesarion', 'scotty'].filter(p => hasMetHolder(gs, p))
        if (targets.length === 0) return { ok: false, reason: 'Rencontre d\'abord un autre détenteur' }
        if (getStanding(gs, 'maxance') < 10) return { ok: false, reason: 'Maxance est trop méfiant (standing 10 requis)' }
        if (gs.reputation < 30) return { ok: false, reason: 'Ta réputation est trop basse — Maxance ne te croira pas (30 requis)' }
        return { ok: true }
      }
      if (action === 'betray') {
        if (getStanding(gs, 'maxance') < 35) return { ok: false, reason: 'Atteins d\'abord le niveau Alliance avec Maxance' }
        if (!decisions.includes('alliance-maxance')) return { ok: false, reason: 'Forme d\'abord une alliance avec Maxance' }
        return { ok: true }
      }
      if (action === 'manipulate') {
        if (getStanding(gs, 'maxance') < 30) return { ok: false, reason: `Maxance résiste — standing ${getStanding(gs, 'maxance')}/30` }
        if (gs.reputation < 60) return { ok: false, reason: `Réputation insuffisante — Maxance enquête sur tout (60 requis)` }
        if (nexusDone.length < 2) return { ok: false, reason: 'Maxance exige la preuve que tu en vaux la peine (2 fragments requis)' }
        return { ok: true }
      }
      return { ok: false, reason: 'Méthode indisponible' }

    // ── SAMY SCOTTY ──────────────────────────────────────────────────────────
    case 3:
      if (action === 'force') return { ok: true }
      if (action === 'pay') return gs.credits >= 8000 ? { ok: true } : { ok: false, reason: `Manque ${(8000 - gs.credits).toLocaleString()} cr` }
      if (action === 'alliance') {
        const ok = getStanding(gs, 'scotty') >= 25 && gs.day >= 5
        if (!ok) {
          const m: string[] = []
          if (getStanding(gs, 'scotty') < 25) m.push(`Standing Scotty ${getStanding(gs, 'scotty')}/25`)
          if (gs.day < 5) m.push(`Jour ${gs.day}/5 — il faut le temps de se faire connaître`)
          return { ok: false, reason: m.join(' · ') }
        }
        return { ok: true }
      }
      if (action === 'gamble') return gs.credits >= 5000 ? { ok: true } : { ok: false, reason: 'Mise minimale 5 000 cr' }
      if (action === 'war') {
        const targets = ['alanossa', 'cesarion', 'maxance'].filter(p => hasMetHolder(gs, p))
        if (targets.length === 0) return { ok: false, reason: 'Rencontre d\'abord un autre détenteur' }
        if (getStanding(gs, 'scotty') < 5) return { ok: false, reason: 'Scotty ne t\'écouterait pas — standing trop faible' }
        return { ok: true }
      }
      if (action === 'betray') {
        if (getStanding(gs, 'scotty') < 25) return { ok: false, reason: 'Atteins d\'abord le niveau Alliance avec Scotty' }
        if (!decisions.includes('alliance-scotty')) return { ok: false, reason: 'Forme d\'abord une alliance avec Scotty' }
        return { ok: true }
      }
      if (action === 'manipulate') {
        if (getStanding(gs, 'scotty') < 10) return { ok: false, reason: `Standing Scotty insuffisant (${getStanding(gs, 'scotty')}/10)` }
        if (gs.credits < 4000) return { ok: false, reason: 'Mise pour l\'entourloupe : 4000 cr minimum' }
        return { ok: true }
      }
      return { ok: false, reason: 'Méthode indisponible' }

    default:
      return { ok: false, reason: 'Fragment inconnu' }
  }
}

// ── TENTATIVE D'OBTENTION ─────────────────────────────────────────────────────

export function attemptNexusFragment(gs: GameState, idx: number, action: NexusAction): NexusResult {
  const check = canAttempt(gs, idx, action)
  if (!check.ok) return { success: false, message: check.reason ?? 'Conditions non remplies.' }

  const decisions = gs.pastDecisions ?? []

  function angeredAdd(pillar: string): string[] {
    return [...(gs.nexusAngered ?? []).filter(p => p !== pillar), pillar]
  }

  switch (idx) {

    // ── ALANOSSA ──────────────────────────────────────────────────────────────
    case 0:
      if (action === 'force')
        return { success: true, message: "Tu l'affrontes en plein pont de commandement. Elle rit et sort sa lame. 'C'est le meilleur argument que j'aie entendu aujourd'hui.'", triggerCombat: true, pillarBossName: 'Alanossa' }
      if (action === 'pay')
        return { success: true, message: "Elle compte les crédits sans se presser. 'Quelqu'un qui paie sans négocier — soit stupide, soit pressé. J'espère que c'est le second.' Elle sourit. -12 000 cr.", newGs: { credits: gs.credits - 12000, pillarStanding: shiftPillar(gs, 'alanossa', -3) } }
      if (action === 'alliance')
        return { success: true, message: gs.reputation >= 70 ? "Elle t'étudie longuement. 'Ta réputation est arrivée avant toi dans chaque station. Je fais confiance aux rumeurs — quand elles sont vraies.' Elle pose le fragment dans ta main." : "Elle tape le fragment contre sa paume trois fois. 'Ton standing, tes combats, ta gueule — tout ça parle. Prends-le. Et reviens si t'es encore en vie dans six mois.'", newGs: { pillarStanding: shiftPillar(gs, 'alanossa', +15), pastDecisions: [...decisions.filter(d => d !== 'alliance-alanossa'), 'alliance-alanossa'] } }
      if (action === 'steal') {
        const ok = Math.random() < 0.55
        if (ok) return { success: true, message: "Il a disparu de sa ceinture avant qu'elle remette le pied dans la pièce. Une heure plus tard, tu entends son rire dans tout le vaisseau — 'QUI L'A FAIT ?!' Elle sait pas. Pas encore.", newGs: { pillarStanding: shiftPillar(gs, 'alanossa', -25) } }
        return { success: false, message: "Elle te voit. Ses yeux descendent vers sa ceinture, puis remontent. Un long silence. 'Bien tenté.' Ce qu'elle fait ensuite n'est pas agréable. -standing, -PV.", newGs: { pillarStanding: shiftPillar(gs, 'alanossa', -18), playerHp: Math.max(1, gs.playerHp - 40) } }
      }
      if (action === 'war') {
        const targets = ['cesarion', 'maxance', 'scotty'].filter(p => hasMetHolder(gs, p))
        const target = targets[Math.floor(Math.random() * targets.length)]
        const tName = target.charAt(0).toUpperCase() + target.slice(1)
        return { success: false, message: `Tu glisses à Alanossa de fausses infos sur ${tName}. Elle écoute, mâchoires serrées. 'Il a vraiment fait ça ?' La paix entre eux est terminée. Mais les deux pourraient bien te chercher si la vérité éclate.`, triggersWar: { holderA: 'alanossa', holderB: target }, newGs: { pillarStanding: shiftPillar(gs, 'alanossa', -5) } }
      }
      if (action === 'betray')
        return { success: true, message: "Elle lui tournait le dos — confiance absolue. Tu en as profité. Le fragment est dans ta poche avant qu'elle comprenne. Son regard quand elle se retourne vaut tout l'or du secteur. Et maintenant, elle va te le faire payer.", newGs: { pillarStanding: shiftPillar(gs, 'alanossa', -80), nexusAngered: angeredAdd('alanossa'), pastDecisions: [...decisions, 'betrayed-alanossa'] }, spawnsBounty: true }
      if (action === 'manipulate') {
        const ok = Math.random() < 0.55
        if (ok) return { success: true, message: "Tu lui joues la comédie du partenariat stratégique. Elle y croit. Pour l'instant. Le fragment change de main dans le cadre d'un 'accord commercial'. -5000 cr.", newGs: { credits: gs.credits - 5000, pillarStanding: shiftPillar(gs, 'alanossa', -10) } }
        return { success: false, message: "Elle voit clair dans ton jeu. 'T'aurais dû être plus subtil.' Elle sort sa lame. -5000 cr, combat imminent.", triggerCombat: true, pillarBossName: 'Alanossa', newGs: { credits: gs.credits - 5000, pillarStanding: shiftPillar(gs, 'alanossa', -25), nexusAngered: angeredAdd('alanossa') } }
      }
      break

    // ── CESARION ──────────────────────────────────────────────────────────────
    case 1:
      if (action === 'force')
        return { success: true, message: "Tu défies Cesarion dans son propre trône. Il se lève lentement. 'Je t'accorde le respect de ne pas appeler les gardes.' Il sort une lame de derrière le dossier. 'Tu vas le regretter.'", triggerCombat: true, pillarBossName: 'Cesarion' }
      if (action === 'pay')
        return { success: true, message: "'18 000. Transaction enregistrée.' Il signe sans lever les yeux. 'Tu peux sortir.' -18 000 cr.", newGs: { credits: gs.credits - 18000, pillarStanding: shiftPillar(gs, 'cesarion', +5) } }
      if (action === 'alliance')
        return { success: true, message: "Il prend le temps de lire ton dossier complet. Un silence d'une minute. 'Tu as servi cet empire sans le savoir.' Il retire le fragment d'un tiroir fermé à clé. 'Une dette mérite un retour.'", newGs: { pillarStanding: shiftPillar(gs, 'cesarion', +20), factionReputation: { ...gs.factionReputation, emporium: gs.factionReputation.emporium + 15 }, pastDecisions: [...decisions.filter(d => d !== 'alliance-cesarion'), 'alliance-cesarion'] } }
      if (action === 'legendary') {
        const kept = gs.weapons.filter(w => w.tier < 5)
        const offered = gs.weapons.find(w => w.tier >= 5)
        return { success: true, message: `Tu poses ${offered?.name ?? 'l\'arme'} sur son bureau. 'L\'acier de qualité mérite acier de qualité.' Il ouvre son coffre. 'L'échange est équitable.' -${offered?.name ?? 'arme Tier 5'}`, newGs: { weapons: kept, pillarStanding: shiftPillar(gs, 'cesarion', +12) } }
      }
      if (action === 'war') {
        const targets = ['alanossa', 'maxance', 'scotty'].filter(p => hasMetHolder(gs, p))
        const target = targets[Math.floor(Math.random() * targets.length)]
        const tName = target.charAt(0).toUpperCase() + target.slice(1)
        return { success: false, message: `Tu présentes à Cesarion des données fabriquées sur ${tName}. Il les analyse en silence. 'Intéressant. Très intéressant.' Il appelle ses conseillers. La guerre commerciale — ou pire — vient de commencer.`, triggersWar: { holderA: 'cesarion', holderB: target }, newGs: { pillarStanding: shiftPillar(gs, 'cesarion', -5) } }
      }
      if (action === 'betray')
        return { success: true, message: "L'accord était scellé. Tu l'as utilisé comme outil, précisément comme il l'aurait fait lui-même. 'Élégant.' dit-il quand il comprend. 'Je n'oublierai pas.' Ce n'est pas une menace. C'est une promesse.", newGs: { pillarStanding: shiftPillar(gs, 'cesarion', -80), nexusAngered: angeredAdd('cesarion'), pastDecisions: [...decisions, 'betrayed-cesarion'] }, spawnsBounty: true }
      if (action === 'manipulate') {
        const ok = Math.random() < 0.45
        if (ok) return { success: true, message: "Tu lui présentes le fragment comme un investissement stratégique. La logique est tordue mais les chiffres tiennent. Il transfère. 'Un partenariat inhabituel.' -8000 cr.", newGs: { credits: gs.credits - 8000, pillarStanding: shiftPillar(gs, 'cesarion', -5) } }
        return { success: false, message: "Cesarion a des conseillers pour vérifier ce genre de raisonnement. Son regard change. 'C'est non. Et je retiens l'audace.' Combat. -8000 cr.", triggerCombat: true, pillarBossName: 'Cesarion', newGs: { credits: gs.credits - 8000, pillarStanding: shiftPillar(gs, 'cesarion', -30), nexusAngered: angeredAdd('cesarion') } }
      }
      break

    // ── ROI MAXANCE ───────────────────────────────────────────────────────────
    case 2:
      if (action === 'force')
        return { success: true, message: "Le Roi Maxance te regarde entrer sans invitation. Il se lève, sans peur. 'Je ne fuis pas.' Son épée d'apparat n'a rien d'un objet de cérémonie. 'Tu auras ce que tu mérites.'", triggerCombat: true, pillarBossName: 'Le Roi Maxance' }
      if (action === 'pay')
        return { success: true, message: "Maxance accepte avec une grimace discrète. 'Je suis roi. Mon peuple, lui...' Il signe le transfert. 'Prends-le. Et ne te montre plus.' -15 000 cr.", newGs: { credits: gs.credits - 15000, pillarStanding: shiftPillar(gs, 'maxance', -8) } }
      if (action === 'alliance')
        return { success: true, message: gs.nexusFragments.length >= 3 ? "Il t'observe longuement. 'Tu as convaincu les trois autres. Aucun d'eux n'est facile à convaincre.' Il se lève. 'Le Nexus a besoin de quelqu'un comme toi — pas de quelqu'un comme moi.' Il te remet le fragment avec solennité." : "Il lit ton historique, tes décisions. 'Il y a une cohérence dans tout ça. Une forme d'intégrité.' Il pose le fragment dans ta main. 'Ne me prouve pas tort.'", newGs: { pillarStanding: shiftPillar(gs, 'maxance', +20), reputation: gs.reputation + 15, pastDecisions: [...decisions.filter(d => d !== 'alliance-maxance'), 'alliance-maxance'] } }
      if (action === 'legendary') {
        const kept = gs.weapons.filter(w => w.tier < 5)
        const offered = gs.weapons.find(w => w.tier >= 5)
        return { success: true, message: `Maxance tient l'arme à deux mains, la pèse. 'Une arme de cette trempe devrait appartenir à quelqu'un qui sait s'en servir. Mais toi tu choisis de la céder. Ça en dit plus long que tous les combats.' Le fragment change de main. -${offered?.name ?? 'arme Tier 5'}`, newGs: { weapons: kept, reputation: gs.reputation + 20 } }
      }
      if (action === 'war') {
        const targets = ['alanossa', 'cesarion', 'scotty'].filter(p => hasMetHolder(gs, p))
        const target = targets[Math.floor(Math.random() * targets.length)]
        const tName = target.charAt(0).toUpperCase() + target.slice(1)
        return { success: false, message: `Convaincre Maxance de haïr quelqu'un n'est pas simple. Mais tu trouves l'argument juste — une offense à son honneur. Son visage se ferme. 'S'il a vraiment fait ça...' La guerre entre lui et ${tName} vient de commencer. Et toi tu es au milieu.`, triggersWar: { holderA: 'maxance', holderB: target }, newGs: { pillarStanding: shiftPillar(gs, 'maxance', -10) } }
      }
      if (action === 'betray')
        return { success: true, message: "Il t'avait ouvert sa cour, sa confiance, son histoire. Et tu en as profité. Quand il comprend — et il comprendra vite — ce qui t'attend ne sera pas un stalker. Ce sera une croisade personnelle du Roi Maxance. Il n'oublie pas. Il ne pardonne jamais.", newGs: { pillarStanding: shiftPillar(gs, 'maxance', -100), nexusAngered: angeredAdd('maxance'), pastDecisions: [...decisions, 'betrayed-maxance'], reputation: gs.reputation - 25 }, spawnsBounty: true }
      if (action === 'manipulate') {
        const ok = Math.random() < 0.35
        if (ok) return { success: true, message: "Même Maxance peut être convaincu par une argumentation parfaite. Tu passes la soirée à construire ton histoire. Il finit par acquiescer. 'Tu as ma confiance.' Ce qu'il ne sait pas, c'est qu'elle était déjà utilisée.", newGs: { pillarStanding: shiftPillar(gs, 'maxance', -15) } }
        return { success: false, message: "Il a posé une question à laquelle tu n'avais pas de réponse. Une seule. C'est tout ce qu'il lui fallait. 'Je pensais mieux de toi.' Il appelle ses gardes. Combat.", triggerCombat: true, pillarBossName: 'Le Roi Maxance', newGs: { pillarStanding: shiftPillar(gs, 'maxance', -40), nexusAngered: angeredAdd('maxance'), reputation: gs.reputation - 15 } }
      }
      break

    // ── SAMY SCOTTY ───────────────────────────────────────────────────────────
    case 3:
      if (action === 'force')
        return { success: true, message: "'Tss. Tu pouvais juste payer.' Il siffle. Les gardes entrent par trois portes. Scotty se rassied avec son verre. 'Je regarde — c'est plus intéressant comme ça.'", triggerCombat: true, pillarBossName: 'Samy Scotty' }
      if (action === 'pay')
        return { success: true, message: "Scotty regarde les crédits transiter. 'Toujours un plaisir de traiter avec quelqu'un qui comprend la valeur des choses.' Il ouvre son coffre. 'Bonne route.' -8 000 cr.", newGs: { credits: gs.credits - 8000, pillarStanding: shiftPillar(gs, 'scotty', +8) } }
      if (action === 'alliance')
        return { success: true, message: "Scotty t'observe par-dessus son verre. 'T'as jamais triché, jamais mal joué.' Il ouvre son coffre. 'Dans mon métier, la loyauté dure rarement. La tienne oui.' Il te tend le fragment. 'Maintenant, bois quelque chose.'", newGs: { pillarStanding: shiftPillar(gs, 'scotty', +15), pastDecisions: [...decisions.filter(d => d !== 'alliance-scotty'), 'alliance-scotty'] } }
      if (action === 'gamble') {
        const win = Math.random() < 0.50
        if (win) return { success: true, message: "Les cartes tombent dans ton sens. Scotty fixe la table. Puis il rit — franchement. 'Bon. D'accord. T'as gagné ce truc-là plus honnêtement que moi.' Il pose le fragment au centre. 'Accord de joueur, accord de gentleman.'", newGs: { pillarStanding: shiftPillar(gs, 'scotty', +10) } }
        return { success: false, message: "Les cartes ne mentent pas. Scotty empoche les crédits sans un mot. 'La maison gagne toujours. Mais l'offre tient.' -5 000 cr.", newGs: { credits: gs.credits - 5000 } }
      }
      if (action === 'war') {
        const targets = ['alanossa', 'cesarion', 'maxance'].filter(p => hasMetHolder(gs, p))
        const target = targets[Math.floor(Math.random() * targets.length)]
        const tName = target.charAt(0).toUpperCase() + target.slice(1)
        return { success: false, message: `Scotty écoute ton histoire sur ${tName} avec un sourire croissant. 'Ah. Intéressant jeu.' Il sort un communicateur. 'Ce genre de rumeur fait de très bonnes affaires — pour moi.' La guerre vient de commencer, et Scotty en tirera profit d'une façon ou d'une autre.`, triggersWar: { holderA: 'scotty', holderB: target }, newGs: { pillarStanding: shiftPillar(gs, 'scotty', -5) } }
      }
      if (action === 'betray')
        return { success: true, message: "Il t'avait accordé sa confiance — ce qui n'arrive presque jamais. Et tu l'as retournée contre lui. Quand il réalise, il ne crie pas. Il dit juste : 'J'aurais dû parier contre toi.' La prime sur ta tête est posée dans l'heure.", newGs: { pillarStanding: shiftPillar(gs, 'scotty', -80), nexusAngered: angeredAdd('scotty'), pastDecisions: [...decisions, 'betrayed-scotty'] }, spawnsBounty: true }
      if (action === 'manipulate') {
        const ok = Math.random() < 0.60
        if (ok) return { success: true, message: "Tu lui présentes un deal tellement tordu que même lui n'arrive pas à trouver le piège. Il accepte juste pour voir. 'T'es soit brillant soit fou.' Le fragment change de main. -4000 cr.", newGs: { credits: gs.credits - 4000, pillarStanding: shiftPillar(gs, 'scotty', -5) } }
        return { success: false, message: "Scotty est dans les combines depuis trop longtemps. Il voit le piège avant que tu le refermes. 'Pas mal. Mais non.' Il appelle la sécurité. -4000 cr.", newGs: { credits: gs.credits - 4000, pillarStanding: shiftPillar(gs, 'scotty', -15) } }
      }
      break
  }

  return { success: false, message: "Quelque chose a mal tourné." }
}

// ── RÉSOLUTION DES GUERRES ────────────────────────────────────────────────────

const PILLAR_TO_FRAGMENT_IDX: Record<string, number> = { alanossa: 0, cesarion: 1, maxance: 2, scotty: 3 }

export function resolveNexusWars(gs: GameState): { gs: Partial<GameState>; messages: string[] } {
  const wars = gs.nexusWars ?? []
  if (wars.length === 0) return { gs: {}, messages: [] }

  const messages: string[] = []
  const resolvedWars: NexusWar[] = []
  let patchGs: Partial<GameState> = {}

  for (const war of wars) {
    if (war.resolved) { resolvedWars.push(war); continue }
    if (gs.day - war.startDay < 4) { resolvedWars.push(war); continue }

    const winnerPillar = Math.random() < 0.5 ? war.holderA : war.holderB
    const loserPillar  = winnerPillar === war.holderA ? war.holderB : war.holderA
    const loserFragIdx = PILLAR_TO_FRAGMENT_IDX[loserPillar]

    resolvedWars.push({ ...war, resolved: true, winner: winnerPillar, loser: loserPillar, fragIdxLoser: loserFragIdx })

    const wName = winnerPillar.charAt(0).toUpperCase() + winnerPillar.slice(1)
    const lName = loserPillar.charAt(0).toUpperCase() + loserPillar.slice(1)
    messages.push(`⚔ GUERRE RÉSOLUE — ${wName} a vaincu ${lName}. Le fragment de ${lName} est maintenant récupérable — mais ${wName} sait que tu es derrière tout ça.`)

    const standing = { ...(gs.pillarStanding ?? {}) } as Record<string, number>
    standing[winnerPillar] = (standing[winnerPillar] ?? 0) - 20
    standing[loserPillar]  = (standing[loserPillar]  ?? 0) - 40

    patchGs = { ...patchGs, pillarStanding: standing as GameState['pillarStanding'], nexusAngered: [...(gs.nexusAngered ?? []), loserPillar] }
  }

  return { gs: { ...patchGs, nexusWars: resolvedWars }, messages }
}

export function getWarAvailableFragments(gs: GameState): number[] {
  const wars = gs.nexusWars ?? []
  const collected = gs.nexusFragments ?? []
  return wars
    .filter(w => w.resolved && w.fragIdxLoser !== undefined && !collected.includes(w.fragIdxLoser!))
    .map(w => w.fragIdxLoser!)
}

// ── HELPERS UI ────────────────────────────────────────────────────────────────

export function isFragmentAvailable(gs: GameState, idx: number): boolean {
  const f = NEXUS_FRAGMENTS[idx]
  if ((gs.nexusFragments ?? []).includes(idx)) return false
  return gs.currentStation === f.station || getWarAvailableFragments(gs).includes(idx)
}

export function getFragmentStatusLabel(gs: GameState, idx: number): string {
  if ((gs.nexusFragments ?? []).includes(idx)) return 'COLLECTÉ'
  if (getWarAvailableFragments(gs).includes(idx)) return '⚔ RÉCUPÉRABLE (guerre)'
  if (gs.currentStation === NEXUS_FRAGMENTS[idx].station) return 'DISPONIBLE'
  return NEXUS_FRAGMENTS[idx].station
}

export function getPillarStandingLabel(gs: GameState, pillar: keyof NonNullable<GameState['pillarStanding']>): string {
  const v = ((gs.pillarStanding ?? {}) as Record<string, number>)[pillar] ?? 0
  if (v >= 60) return 'Allié'
  if (v >= 30) return 'Respecté'
  if (v >= 10) return 'Connu'
  if (v >= -10) return 'Neutre'
  if (v >= -30) return 'Méfiant'
  return 'Ennemi'
}

// ── BOUNTY HUNTERS DES DÉTENTEURS ─────────────────────────────────────────────

export const HOLDER_BOUNTY_HUNTERS: Record<string, { name: string; threatLevel: 1 | 2 | 3 | 4 | 5; description: string }> = {
  alanossa: { name: "Le Vengeur d'Alanossa", threatLevel: 4, description: "Le meilleur chasseur des Faucons. Ordres directs d'Alanossa. Il ne négocie pas." },
  cesarion: { name: "L'Exécuteur Impérial",  threatLevel: 5, description: "Envoyé personnel de Cesarion. Armé par l'Emporium. Formé pour une seule chose." },
  maxance:  { name: "Le Chevalier de Maxance", threatLevel: 4, description: "Loyal au roi jusqu'à la mort. Il vient récupérer ce qui a été pris — ou venger l'honneur de son roi." },
  scotty:   { name: "Malone le Collecteur", threatLevel: 3, description: "Scotty l'a engagé sur la prime. Malone travaille vite et proprement. Il veut juste être payé." },
}

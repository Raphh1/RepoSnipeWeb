import type { GameState, NexusWar } from '../types'
import { shiftPillar } from './memoryEvents'
import { arePillarSubBossesCleared, getSubBossProgress } from '../data/subBosses'

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
    pillar: 'raphazarus',
    station: "L'Arc Perdu",
    name: 'Fragment du Général',
    lore: "Raphazarus a disparu avec son fragment après la Grande Guerre. 47 ans dans l'Arc Perdu — une station que personne ne sait localiser. Il attend. Il observe. Et quand tu commences à rassembler les fragments, il se réveille. Le Général ne négocie pas. Il ne pardonne pas. Il ne perd pas.",
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

  const pillarMap: Record<number, string> = { 0: 'alanossa', 1: 'cesarion', 2: 'raphazarus', 3: 'scotty' }
  const pillar = pillarMap[idx]

  if (pillar) {
    const defeated = gs.subBossesDefeated ?? {}
    if (!arePillarSubBossesCleared(defeated, pillar)) {
      const { done, total } = getSubBossProgress(defeated, pillar)
      const pName = pillar.charAt(0).toUpperCase() + pillar.slice(1)
      return { ok: false, reason: `${pName} refuse de te recevoir — ses lieutenants te barrent la route (${done}/${total} vaincus)` }
    }
  }

  if (pillar && angered.includes(pillar) && action !== 'force')
    return { ok: false, reason: `${pillar.charAt(0).toUpperCase() + pillar.slice(1)} est ton ennemi juré — seul le combat est possible` }

  switch (idx) {

    // ── ALANOSSA (guerrière sanguinaire — négociation/manipulation très difficile) ──
    case 0:
      if (action === 'force') return { ok: true }
      if (action === 'pay') {
        if (getStanding(gs, 'alanossa') < -10) return { ok: false, reason: 'Standing Alanossa trop négatif — elle refuse de traiter avec toi' }
        return gs.credits >= 12000 ? { ok: true } : { ok: false, reason: `Manque ${(12000 - gs.credits).toLocaleString()} cr` }
      }
      if (action === 'alliance') {
        const defeated = gs.subBossesDefeated ?? {}
        const hasProvedCombat = arePillarSubBossesCleared(defeated, 'cesarion') || arePillarSubBossesCleared(defeated, 'scotty')
        const ok = getStanding(gs, 'alanossa') >= 28 && gs.reputation >= 55 && (gs.combatsWon ?? 0) >= 6 && hasProvedCombat
        if (!ok) {
          const m: string[] = []
          if (getStanding(gs, 'alanossa') < 28) m.push(`Standing Alanossa ${getStanding(gs, 'alanossa')}/28`)
          if (gs.reputation < 55) m.push(`Réputation ${gs.reputation}/55`)
          if ((gs.combatsWon ?? 0) < 6) m.push(`Combats gagnés ${gs.combatsWon ?? 0}/6`)
          if (!hasProvedCombat) m.push('⚠ Élimine les lieutenants de Cesarion OU Scotty pour prouver ta valeur')
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
        const targets = ['cesarion', 'raphazarus', 'scotty'].filter(p => hasMetHolder(gs, p))
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
        if (getStanding(gs, 'alanossa') < 20) return { ok: false, reason: `Standing Alanossa insuffisant (${getStanding(gs, 'alanossa')}/20) — cette guerrière ne se laisse pas avoir facilement` }
        if (gs.credits < 7000) return { ok: false, reason: 'Manque de crédits pour l\'entourloupe (7000 cr) — Alanossa est chère à duper' }
        if ((gs.combatsWon ?? 0) < 4) return { ok: false, reason: `Pas assez d'expérience de combat (${gs.combatsWon ?? 0}/4) — elle repère les faibles` }
        return { ok: true }
      }
      return { ok: false, reason: 'Méthode indisponible' }

    // ── CESARION (guerrier impérial — négociation/manipulation très difficile) ──
    case 1:
      if (action === 'force') {
        if (!gs.equippedWeapon) return { ok: false, reason: "Cesarion refuse le combat face à quelqu'un de désarmé" }
        return { ok: true }
      }
      if (action === 'pay') return gs.credits >= 18000 ? { ok: true } : { ok: false, reason: `Manque ${(18000 - gs.credits).toLocaleString()} cr` }
      if (action === 'alliance') {
        const defeated = gs.subBossesDefeated ?? {}
        const hasProvedLoyalty = arePillarSubBossesCleared(defeated, 'alanossa') || arePillarSubBossesCleared(defeated, 'raphazarus')
        const ok = getStanding(gs, 'cesarion') >= 45 && gs.factionReputation.emporium >= 35 && gs.completedQuestIds.length >= 3 && hasProvedLoyalty
        if (!ok) {
          const m: string[] = []
          if (getStanding(gs, 'cesarion') < 45) m.push(`Standing Cesarion ${getStanding(gs, 'cesarion')}/45`)
          if (gs.factionReputation.emporium < 35) m.push(`Rép. Emporium ${gs.factionReputation.emporium}/35`)
          if (gs.completedQuestIds.length < 3) m.push(`Quêtes complétées ${gs.completedQuestIds.length}/3`)
          if (!hasProvedLoyalty) m.push('⚠ Élimine les lieutenants d\'Alanossa OU Raphazarus pour prouver ta loyauté à l\'Empire')
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
        const targets = ['alanossa', 'raphazarus', 'scotty'].filter(p => hasMetHolder(gs, p))
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
        if (getStanding(gs, 'cesarion') < 25) return { ok: false, reason: `Standing Cesarion insuffisant (${getStanding(gs, 'cesarion')}/25) — il a des conseillers partout` }
        if (gs.credits < 10000) return { ok: false, reason: 'Manque de crédits pour l\'opération (10 000 cr) — corrompre l\'Emporium coûte cher' }
        if (gs.completedQuestIds.length < 2) return { ok: false, reason: 'Pas assez d\'antécédents — Cesarion vérifie tout' }
        return { ok: true }
      }
      return { ok: false, reason: 'Méthode indisponible' }

    // ── RAPHAZARUS ─────────────────────────────────────────────────────────────
    case 2:
      if (!gs.arcPerduUnlocked) return { ok: false, reason: "L'Arc Perdu est introuvable — cherche des indices auprès des PNJs dans les stations" }
      if (action === 'force') {
        if (!gs.equippedWeapon) return { ok: false, reason: 'Raphazarus refuse de combattre un adversaire désarmé — par respect, pas par pitié' }
        if (gs.playerHp < gs.playerMaxHp * 0.5) return { ok: false, reason: `Raphazarus te regarde et secoue la tête. "Reviens quand tu seras en état de te battre." (PV ${gs.playerHp}/${gs.playerMaxHp})` }
        return { ok: true }
      }
      if (action === 'pay') return { ok: false, reason: "Raphazarus ne peut pas être acheté. Il a refusé des fortunes. L'argent n'a pas de sens pour un homme qui a tout perdu." }
      if (action === 'alliance') {
        const ok = getStanding(gs, 'raphazarus') >= 40 && (gs.combatsWon ?? 0) >= 8 && nexusDone.length >= 2
        if (!ok) {
          const m: string[] = []
          if (getStanding(gs, 'raphazarus') < 40) m.push(`Standing Raphazarus ${getStanding(gs, 'raphazarus')}/40`)
          if ((gs.combatsWon ?? 0) < 8) m.push(`Combats gagnés ${gs.combatsWon ?? 0}/8`)
          if (nexusDone.length < 2) m.push(`Fragments collectés ${nexusDone.length}/2`)
          return { ok: false, reason: m.join(' · ') }
        }
        return { ok: true }
      }
      if (action === 'legendary') {
        if (!gs.weapons.some(w => w.tier >= 5)) return { ok: false, reason: 'Seule une arme de légende pourrait impressionner Raphazarus' }
        if (getStanding(gs, 'raphazarus') < 15) return { ok: false, reason: `Raphazarus ne daigne pas regarder — standing ${getStanding(gs, 'raphazarus')}/15` }
        return { ok: true }
      }
      if (action === 'war') {
        const targets = ['alanossa', 'cesarion', 'scotty'].filter(p => hasMetHolder(gs, p))
        if (targets.length === 0) return { ok: false, reason: 'Rencontre d\'abord un autre détenteur' }
        if (getStanding(gs, 'raphazarus') < 15) return { ok: false, reason: 'Raphazarus ne t\'écoute pas — standing trop faible (15 requis)' }
        return { ok: true }
      }
      if (action === 'betray') {
        if (!decisions.includes('alliance-raphazarus')) return { ok: false, reason: 'Forme d\'abord une alliance avec Raphazarus — si tu en es capable' }
        return { ok: true }
      }
      if (action === 'manipulate') {
        if (getStanding(gs, 'raphazarus') < 25) return { ok: false, reason: `Raphazarus voit clair — standing ${getStanding(gs, 'raphazarus')}/25` }
        if ((gs.combatsWon ?? 0) < 6) return { ok: false, reason: `Pas assez d'expérience au combat (${gs.combatsWon ?? 0}/6) — il te percera à jour` }
        if (gs.credits < 6000) return { ok: false, reason: 'Fonds insuffisants pour monter l\'opération (6000 cr)' }
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
      if (action === 'gamble') {
        const wins = gs.scottyGambleWins ?? 0
        const mise = wins === 0 ? 3000 : wins === 1 ? 4000 : 5000
        return gs.credits >= mise ? { ok: true } : { ok: false, reason: `Mise requise : ${mise.toLocaleString()} cr (manche ${wins + 1}/3)` }
      }
      if (action === 'war') {
        const targets = ['alanossa', 'cesarion', 'raphazarus'].filter(p => hasMetHolder(gs, p))
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
        return { success: true, message: "Elle regarde les dossiers que tu lui apportes — les lieutenants d'un autre pilier, tous éliminés par tes mains. Un long silence. 'T'as fait le ménage chez les autres avant de venir chez moi. C'est soit de la loyauté, soit de la stratégie.' Elle sourit. 'J'aime les deux.' Elle pose le fragment dans ta main. 'Bienvenue dans la famille.'", newGs: { pillarStanding: shiftPillar(gs, 'alanossa', +15), pastDecisions: [...decisions.filter(d => d !== 'alliance-alanossa'), 'alliance-alanossa'] } }
      if (action === 'steal') {
        const ok = Math.random() < 0.55
        if (ok) return { success: true, message: "Il a disparu de sa ceinture avant qu'elle remette le pied dans la pièce. Une heure plus tard, tu entends son rire dans tout le vaisseau — 'QUI L'A FAIT ?!' Elle sait pas. Pas encore.", newGs: { pillarStanding: shiftPillar(gs, 'alanossa', -25) } }
        return { success: false, message: "Elle te voit. Ses yeux descendent vers sa ceinture, puis remontent. Un long silence. 'Bien tenté.' Ce qu'elle fait ensuite n'est pas agréable. -standing, -PV.", newGs: { pillarStanding: shiftPillar(gs, 'alanossa', -18), playerHp: Math.max(1, gs.playerHp - 40) } }
      }
      if (action === 'war') {
        const targets = ['cesarion', 'raphazarus', 'scotty'].filter(p => hasMetHolder(gs, p))
        const target = targets[Math.floor(Math.random() * targets.length)]
        const tName = target.charAt(0).toUpperCase() + target.slice(1)
        return { success: false, message: `Tu glisses à Alanossa de fausses infos sur ${tName}. Elle écoute, mâchoires serrées. 'Il a vraiment fait ça ?' La paix entre eux est terminée. Mais les deux pourraient bien te chercher si la vérité éclate.`, triggersWar: { holderA: 'alanossa', holderB: target }, newGs: { pillarStanding: shiftPillar(gs, 'alanossa', -5) } }
      }
      if (action === 'betray')
        return { success: true, message: "Elle lui tournait le dos — confiance absolue. Tu en as profité. Le fragment est dans ta poche avant qu'elle comprenne. Son regard quand elle se retourne vaut tout l'or du secteur. Et maintenant, elle va te le faire payer.", newGs: { pillarStanding: shiftPillar(gs, 'alanossa', -80), nexusAngered: angeredAdd('alanossa'), pastDecisions: [...decisions, 'betrayed-alanossa'] }, spawnsBounty: true }
      if (action === 'manipulate') {
        const ok = Math.random() < 0.40
        if (ok) return { success: true, message: "Tu lui joues la comédie du partenariat stratégique. Elle y croit — une guerrière, pas une politique. Le fragment change de main dans le cadre d'un 'accord de sang'. -7000 cr.", newGs: { credits: gs.credits - 7000, pillarStanding: shiftPillar(gs, 'alanossa', -10) } }
        return { success: false, message: "Elle voit clair dans ton jeu. Les guerriers sanguinaires ont un instinct que tu ne peux pas tromper. 'T'aurais dû venir les armes à la main.' Elle dégaine. -7000 cr, combat imminent.", triggerCombat: true, pillarBossName: 'Alanossa', newGs: { credits: gs.credits - 7000, pillarStanding: shiftPillar(gs, 'alanossa', -25), nexusAngered: angeredAdd('alanossa') } }
      }
      break

    // ── CESARION ──────────────────────────────────────────────────────────────
    case 1:
      if (action === 'force')
        return { success: true, message: "Tu défies Cesarion dans son propre trône. Il se lève lentement. 'Je t'accorde le respect de ne pas appeler les gardes.' Il sort une lame de derrière le dossier. 'Tu vas le regretter.'", triggerCombat: true, pillarBossName: 'Cesarion' }
      if (action === 'pay')
        return { success: true, message: "'18 000. Transaction enregistrée.' Il signe sans lever les yeux. 'Tu peux sortir.' -18 000 cr.", newGs: { credits: gs.credits - 18000, pillarStanding: shiftPillar(gs, 'cesarion', +5) } }
      if (action === 'alliance')
        return { success: true, message: "Il examine les preuves de tes exploits — les lieutenants d'un rival, tous neutralisés. Son regard ne change pas, mais sa voix s'adoucit d'un micron. 'Tu as prouvé ta loyauté par le sang. C'est la seule monnaie que l'Empire reconnaît.' Il ouvre un coffre blindé. 'Bienvenue dans les cercles intérieurs.'", newGs: { pillarStanding: shiftPillar(gs, 'cesarion', +20), factionReputation: { ...gs.factionReputation, emporium: gs.factionReputation.emporium + 15 }, pastDecisions: [...decisions.filter(d => d !== 'alliance-cesarion'), 'alliance-cesarion'] } }
      if (action === 'legendary') {
        const kept = gs.weapons.filter(w => w.tier < 5)
        const offered = gs.weapons.find(w => w.tier >= 5)
        return { success: true, message: `Tu poses ${offered?.name ?? 'l\'arme'} sur son bureau. 'L\'acier de qualité mérite acier de qualité.' Il ouvre son coffre. 'L'échange est équitable.' -${offered?.name ?? 'arme Tier 5'}`, newGs: { weapons: kept, pillarStanding: shiftPillar(gs, 'cesarion', +12) } }
      }
      if (action === 'war') {
        const targets = ['alanossa', 'raphazarus', 'scotty'].filter(p => hasMetHolder(gs, p))
        const target = targets[Math.floor(Math.random() * targets.length)]
        const tName = target.charAt(0).toUpperCase() + target.slice(1)
        return { success: false, message: `Tu présentes à Cesarion des données fabriquées sur ${tName}. Il les analyse en silence. 'Intéressant. Très intéressant.' Il appelle ses conseillers. La guerre commerciale — ou pire — vient de commencer.`, triggersWar: { holderA: 'cesarion', holderB: target }, newGs: { pillarStanding: shiftPillar(gs, 'cesarion', -5) } }
      }
      if (action === 'betray')
        return { success: true, message: "L'accord était scellé. Tu l'as utilisé comme outil, précisément comme il l'aurait fait lui-même. 'Élégant.' dit-il quand il comprend. 'Je n'oublierai pas.' Ce n'est pas une menace. C'est une promesse.", newGs: { pillarStanding: shiftPillar(gs, 'cesarion', -80), nexusAngered: angeredAdd('cesarion'), pastDecisions: [...decisions, 'betrayed-cesarion'] }, spawnsBounty: true }
      if (action === 'manipulate') {
        const ok = Math.random() < 0.35
        if (ok) return { success: true, message: "Tu lui présentes le fragment comme un investissement stratégique. La logique est tordue mais les chiffres tiennent — et Cesarion respecte les chiffres. 'Un partenariat inhabituel.' -10 000 cr.", newGs: { credits: gs.credits - 10000, pillarStanding: shiftPillar(gs, 'cesarion', -5) } }
        return { success: false, message: "Cesarion a des conseillers, des espions, et un instinct de guerrier impérial. Tes calculs ne passent pas. 'L'audace sans la force est une faiblesse.' Combat. -10 000 cr.", triggerCombat: true, pillarBossName: 'Cesarion', newGs: { credits: gs.credits - 10000, pillarStanding: shiftPillar(gs, 'cesarion', -30), nexusAngered: angeredAdd('cesarion') } }
      }
      break

    // ── RAPHAZARUS ─────────────────────────────────────────────────────────────
    case 2:
      if (action === 'force')
        return { success: true, message: "Raphazarus se lève de son siège — lentement, comme s'il avait tout le temps du monde. Il pose son regard sur toi, celui d'un homme qui a vu des civilisations s'éteindre. 'Tu sais ce que ça fait, de perdre une guerre ?' Il dégaine. 'Tu vas l'apprendre.'", triggerCombat: true, pillarBossName: 'Raphazarus' }
      if (action === 'alliance')
        return { success: true, message: gs.nexusFragments.length >= 3 ? "Il te fixe longtemps. Très longtemps. 'Tu as fait ce que j'ai échoué à faire — réunir ce qui a été brisé.' Il ouvre sa main. Le fragment brille. 'Finis ce que j'ai commencé. Et ne trahis pas leur mémoire.'" : "Il écoute ton histoire en silence. Tes combats, tes choix, tes cicatrices. Quand tu finis, il dit simplement : 'Tu n'es pas un soldat. Mais tu as la discipline d'un guerrier.' Il pose le fragment entre vous deux. 'Prouve que tu mérites ce que des milliers sont morts pour protéger.'", newGs: { pillarStanding: shiftPillar(gs, 'raphazarus', +25), reputation: gs.reputation + 20, pastDecisions: [...decisions.filter(d => d !== 'alliance-raphazarus'), 'alliance-raphazarus'] } }
      if (action === 'legendary') {
        const kept = gs.weapons.filter(w => w.tier < 5)
        const offered = gs.weapons.find(w => w.tier >= 5)
        return { success: true, message: `Raphazarus prend ${offered?.name ?? "l'arme"} dans ses mains calleuses. Il la retourne, la soupèse, passe le pouce sur la lame. Ses yeux brillent — pour la première fois. 'Ça fait quarante-sept ans que j'ai pas tenu une arme comme ça.' Il pose le fragment. 'Échange de soldat à soldat.'`, newGs: { weapons: kept, pillarStanding: shiftPillar(gs, 'raphazarus', +15) } }
      }
      if (action === 'war') {
        const targets = ['alanossa', 'cesarion', 'scotty'].filter(p => hasMetHolder(gs, p))
        const target = targets[Math.floor(Math.random() * targets.length)]
        const tName = target.charAt(0).toUpperCase() + target.slice(1)
        return { success: false, message: `Tu présentes à Raphazarus des informations falsifiées sur ${tName}. Le Général ne réagit pas tout de suite. Il analyse. Puis : 'Si c'est vrai, c'est une déclaration de guerre. Et je ne perds pas les guerres.' Ses vétérans commencent à se mobiliser. La tempête arrive.`, triggersWar: { holderA: 'raphazarus', holderB: target }, newGs: { pillarStanding: shiftPillar(gs, 'raphazarus', -8) } }
      }
      if (action === 'betray')
        return { success: true, message: "Tu as gagné sa confiance — la chose la plus rare de l'univers. Et tu l'as utilisée comme une arme. Quand le Général comprend, il ne crie pas. Il ne menace pas. Il dit simplement : 'La dernière personne qui m'a trahi, je l'ai poursuivie pendant onze ans. Elle n'a jamais dormi tranquille.' Il te regarde partir. Tu sens son regard dans ton dos longtemps après avoir quitté l'Arc Perdu.", newGs: { pillarStanding: shiftPillar(gs, 'raphazarus', -100), nexusAngered: angeredAdd('raphazarus'), pastDecisions: [...decisions, 'betrayed-raphazarus'], reputation: gs.reputation - 30 }, spawnsBounty: true }
      if (action === 'manipulate') {
        const ok = Math.random() < 0.30
        if (ok) return { success: true, message: "Tu montes une opération complexe — faux renseignements, fausses pistes, fausse urgence. Raphazarus, pour la première fois en 47 ans, quitte l'Arc Perdu. Le fragment est resté. Tu ne restes pas longtemps non plus. -6000 cr.", newGs: { credits: gs.credits - 6000, pillarStanding: shiftPillar(gs, 'raphazarus', -20) } }
        return { success: false, message: "Raphazarus a survécu à la Grande Guerre. Il a vu des manipulations plus élaborées que la tienne avant le petit-déjeuner. 'Intéressant.' Son regard se durcit. 'Maintenant, on fait ça à ma façon.' -6000 cr. Combat.", triggerCombat: true, pillarBossName: 'Raphazarus', newGs: { credits: gs.credits - 6000, pillarStanding: shiftPillar(gs, 'raphazarus', -35), nexusAngered: angeredAdd('raphazarus') } }
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
        const wins = gs.scottyGambleWins ?? 0
        const round = wins + 1
        const mise = wins === 0 ? 3000 : wins === 1 ? 4000 : 5000
        const winChance = wins === 0 ? 0.40 : wins === 1 ? 0.35 : 0.30
        const win = Math.random() < winChance

        const ROUND_GAMES = [
          { name: 'le Menteur Stellaire', winMsg: "Tu repères son bluff — un léger tic au coin de l'œil. 'Pas mal, gamin.'", loseMsg: "Il retourne ses cartes. Full. Tu avais rien. 'C'est le jeu.'" },
          { name: "le Dé de l'Abîme", winMsg: "Le dé roule, roule, et s'arrête sur ton chiffre. Scotty siffle. 'La chance est une pute. Mais là, elle t'aime bien.'", loseMsg: "Le dé te trahit. Scotty ramasse tes crédits. 'Tu veux vraiment continuer ? Je t'admire.'" },
          { name: 'la Roulette du Vide', winMsg: "La bille atterrit dans ton secteur. Scotty se lève, applaudit. 'Trois manches. Personne a jamais gagné trois manches. Personne.' Il ouvre le coffre.", loseMsg: "La roulette tourne. Et tourne. Et s'arrête. Pas sur ton numéro. 'Presque. C'est toujours presque.' -crédits." },
        ]
        const game = ROUND_GAMES[Math.min(wins, ROUND_GAMES.length - 1)]

        if (win) {
          if (round >= 3) {
            return { success: true, message: `🎲 MANCHE ${round}/3 — ${game.name}. ${game.winMsg} Le fragment est à toi. 'Accord de joueur, accord de gentleman.'`, newGs: { scottyGambleWins: 3, pillarStanding: shiftPillar(gs, 'scotty', +10) } }
          }
          return { success: false, message: `🎲 MANCHE ${round}/3 — ${game.name}. ${game.winMsg} Manche suivante : mise plus élevée, Scotty plus concentré.`, newGs: { scottyGambleWins: wins + 1 } }
        }
        return { success: false, message: `🎲 MANCHE ${round}/3 — ${game.name}. ${game.loseMsg} -${mise.toLocaleString()} cr. Tes victoires sont réinitialisées.`, newGs: { credits: gs.credits - mise, scottyGambleWins: 0 } }
      }
      if (action === 'war') {
        const targets = ['alanossa', 'cesarion', 'raphazarus'].filter(p => hasMetHolder(gs, p))
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

const PILLAR_TO_FRAGMENT_IDX: Record<string, number> = { alanossa: 0, cesarion: 1, raphazarus: 2, scotty: 3 }

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

// ── CONSÉQUENCES DE LA MORT D'UN SOUS-BOSS ────────────────────────────────────
// Tuer un sous-boss n'est jamais anodin : on attire l'attention du boss du pilier,
// ce qui peut déclencher des ralliements (le boss appelle un rival en renfort) ou
// des discussions (un rival en froid avec lui te voit comme un allié potentiel).

const PILLAR_BOSS_NAME: Record<string, string> = {
  alanossa: 'Alanossa', cesarion: 'Cesarion', raphazarus: 'Raphazarus', scotty: 'Samy Scotty',
}
const PILLAR_RIVALS: Record<string, string[]> = {
  alanossa: ['cesarion', 'raphazarus'],
  cesarion: ['alanossa', 'scotty'],
  raphazarus: ['alanossa', 'cesarion'],
  scotty:   ['raphazarus', 'cesarion'],
}

export function getSubBossKillConsequence(
  gs: GameState,
  pillar: string,
  fullyCleared: boolean,
): { patch: Partial<GameState>; message: string } {
  const standing = { ...((gs.pillarStanding ?? {}) as Record<string, number>) }
  const bossName = PILLAR_BOSS_NAME[pillar] ?? pillar
  const lines: string[] = []

  // 1) Attention du boss principal — il sait désormais qui tu es.
  const baseHit = fullyCleared ? -18 : -8
  standing[pillar] = (standing[pillar] ?? 0) + baseHit
  lines.push(fullyCleared
    ? `⚠ Tu as éliminé TOUS les lieutenants de ${bossName}. Son regard est maintenant fixé sur toi — et il t'attend en personne.`
    : `⚠ La mort de son lieutenant remonte jusqu'à ${bossName}. Il sait que tu approches.`)

  // 2) Ralliement ou discussion avec un rival "en froid".
  const rivals = PILLAR_RIVALS[pillar] ?? []
  const rival = rivals[Math.floor(Math.random() * rivals.length)]
  const decisions = [...(gs.pastDecisions ?? [])]
  const patch: Partial<GameState> = {}

  if (rival) {
    const rivalName = PILLAR_BOSS_NAME[rival] ?? rival
    const r = Math.random()
    if (r < 0.45) {
      // Le boss rallie un rival contre toi.
      standing[rival] = (standing[rival] ?? 0) - 6
      lines.push(`🤝 ${bossName} a mis sa rancune de côté : il s'est rapproché de ${rivalName} pour te barrer la route.`)
    } else if (r < 0.80) {
      // Un rival en froid te voit comme un allié potentiel — ouverture de discussion.
      standing[rival] = (standing[rival] ?? 0) + 8
      decisions.push(`met-${rival}`)
      lines.push(`💬 ${rivalName}, en froid avec ${bossName}, a eu vent de ton coup. Il te fait passer un message : « On devrait parler. »`)
    } else {
      // Le boss redouble simplement de vigilance.
      lines.push(`👁 ${bossName} renforce sa garde. La prochaine confrontation sera plus rude.`)
    }
  }

  patch.pillarStanding = standing as GameState['pillarStanding']
  if (decisions.length !== (gs.pastDecisions ?? []).length) patch.pastDecisions = decisions

  return { patch, message: lines.join('\n') }
}

// ── BOUNTY HUNTERS DES DÉTENTEURS ─────────────────────────────────────────────

export const HOLDER_BOUNTY_HUNTERS: Record<string, { name: string; threatLevel: 1 | 2 | 3 | 4 | 5; description: string }> = {
  alanossa: { name: "Le Vengeur d'Alanossa", threatLevel: 4, description: "Le meilleur chasseur des Faucons. Ordres directs d'Alanossa. Il ne négocie pas." },
  cesarion: { name: "L'Exécuteur Impérial",  threatLevel: 5, description: "Envoyé personnel de Cesarion. Armé par l'Emporium. Formé pour une seule chose." },
  raphazarus: { name: "Le Dernier Soldat", threatLevel: 5, description: "Envoyé personnel de Raphazarus. Formé pendant la Grande Guerre. Il ne s'arrête pas. Il ne négocie pas. Il ne meurt pas facilement." },
  scotty:   { name: "Malone le Collecteur", threatLevel: 3, description: "Scotty l'a engagé sur la prime. Malone travaille vite et proprement. Il veut juste être payé." },
}

// ── SYSTÈME DE DÉCOUVERTE DE L'ARC PERDU ─────────────────────────────────────

export interface ArcPerduClue {
  id: string
  station: string
  npcName: string
  dialogue: string
  clueText: string
  requirement?: { credits?: number; reputation?: number; standing?: number }
}

const CLUES_NEEDED = 4

export const ARC_PERDU_CLUES: ArcPerduClue[] = [
  {
    id: 'clue-cendres',
    station: 'Les Cendres',
    npcName: 'Le Vieux Caporal',
    dialogue: "Un vieil homme couvert de cendres te fixe. 'Tu cherches le Général ? Hmph. Tout le monde le cherche. Personne le trouve.' Il crache par terre. 'Moi j'étais sous ses ordres au 3e Bataillon. La dernière fois que je l'ai vu, il partait vers le secteur Velkor avec une escorte de six vaisseaux. Six. Il en est revenu un seul.'",
    clueText: 'Le Général est parti vers le secteur Velkor après la Grande Guerre.',
  },
  {
    id: 'clue-fantome',
    station: 'Station Fantôme',
    npcName: 'La Mécanicienne Muette',
    dialogue: "Elle ne parle pas. Elle n'a jamais parlé — du moins pas depuis l'incident. Mais quand tu montres la plaque du 3e Bataillon, ses yeux s'agrandissent. Elle griffonne sur un morceau de métal : 'L'Arc Perdu n'a pas été détruit. Il dérive. Coordonnées partielles : secteur 7-Kappa. Cherche le signal fantôme.'",
    clueText: 'L\'Arc Perdu dérive dans le secteur 7-Kappa — chercher un signal fantôme.',
    requirement: { reputation: 25 },
  },
  {
    id: 'clue-forge',
    station: 'La Forge des Damnés',
    npcName: "L'Armurier du Général",
    dialogue: "'Tu veux trouver Raphazarus ?' L'armurier rit — un son qui ressemble à du métal qu'on tord. 'J'ai forgé ses armes pendant vingt ans. Il m'a dit un jour : Si quelqu'un vient me chercher, dis-lui que je suis là où la lumière ne va pas. Là où les étoiles meurent.' Il te montre une carte gravée dans l'acier. 'La Nébuleuse Noire, entre Velkor et Quarantaine. C'est là.'",
    clueText: 'L\'Arc Perdu se cache dans la Nébuleuse Noire, entre les Abysses de Velkor et Station Quarantaine.',
    requirement: { credits: 2000 },
  },
  {
    id: 'clue-exilee',
    station: 'La Forteresse Exilée',
    npcName: 'Le Déserteur Repenti',
    dialogue: "'J'ai déserté le 7e Corps il y a trente ans. Raphazarus m'a laissé partir — le seul qu'il ait jamais laissé partir.' Il tremble. 'Mais il m'a dit quelque chose ce jour-là. Il a dit : Mon arc n'est pas perdu. Il est caché. Et le jour où quelqu'un le trouvera, c'est que le Nexus aura besoin de lui.' Il te donne une fréquence radio. 'Émets sur cette fréquence dans la Nébuleuse Noire. Il répondra. Ou il te tuera. Probablement les deux.'",
    clueText: 'Fréquence radio secrète pour contacter l\'Arc Perdu dans la Nébuleuse Noire.',
    requirement: { reputation: 35 },
  },
  {
    id: 'clue-quarantaine',
    station: 'Station Quarantaine',
    npcName: 'Le Médecin de Guerre',
    dialogue: "'Raphazarus ?' Le médecin pâlit. 'Je l'ai soigné après la Bataille de Korsun. Il avait pris sept balles. Sept. Il s'est relevé le lendemain.' Il baisse la voix. 'Son vaisseau, l'Arc, émet un signal médical codé — protocole de la Grande Guerre. Fréquence 7-Kappa-12. Si tu captes ce signal, tu le trouveras. Mais réfléchis avant d'y aller. Il ne reçoit pas de visiteurs.'",
    clueText: 'Signal médical codé de la Grande Guerre — fréquence 7-Kappa-12 confirme la position.',
  },
  {
    id: 'clue-velkor',
    station: 'Les Abysses de Velkor',
    npcName: "L'Exploratrice des Abysses",
    dialogue: "'La Nébuleuse Noire ? Oui, j'y suis allée. Une fois.' Elle montre une cicatrice qui court de sa tempe à sa mâchoire. 'Il y a quelque chose là-bas. Une station qui ne devrait pas exister. Pas sur les cartes. Pas sur les scans. Mais je l'ai VUE. Immense. Silencieuse. Et les canons étaient pointés vers moi avant que je puisse faire demi-tour.' Elle frissonne. 'Si tu veux y aller, assure-toi d'être prêt à mourir.'",
    clueText: 'Confirmation visuelle : une station fortifiée non répertoriée dans la Nébuleuse Noire.',
    requirement: { credits: 1500 },
  },
]

export function getAvailableClues(gs: GameState): ArcPerduClue[] {
  if (gs.arcPerduUnlocked) return []
  const collected = gs.arcPerduClues ?? []
  return ARC_PERDU_CLUES.filter(c =>
    c.station === gs.currentStation && !collected.includes(c.id)
  )
}

export function canCollectClue(gs: GameState, clue: ArcPerduClue): { ok: boolean; reason?: string } {
  if (!clue.requirement) return { ok: true }
  const m: string[] = []
  if (clue.requirement.credits && gs.credits < clue.requirement.credits)
    m.push(`${clue.requirement.credits} cr requis`)
  if (clue.requirement.reputation && gs.reputation < clue.requirement.reputation)
    m.push(`Réputation ${gs.reputation}/${clue.requirement.reputation}`)
  if (clue.requirement.standing) {
    const s = ((gs.pillarStanding ?? {}) as Record<string, number>)['raphazarus'] ?? 0
    if (s < clue.requirement.standing) m.push(`Standing Raphazarus ${s}/${clue.requirement.standing}`)
  }
  return m.length > 0 ? { ok: false, reason: m.join(' · ') } : { ok: true }
}

export function collectClue(gs: GameState, clueId: string): { gs: Partial<GameState>; unlocked: boolean; message: string } {
  const clue = ARC_PERDU_CLUES.find(c => c.id === clueId)
  if (!clue) return { gs: {}, unlocked: false, message: '' }

  const newClues = [...(gs.arcPerduClues ?? []), clueId]
  const creditCost = clue.requirement?.credits ?? 0
  const unlocked = newClues.length >= CLUES_NEEDED

  return {
    gs: {
      arcPerduClues: newClues,
      credits: gs.credits - creditCost,
      ...(unlocked ? { arcPerduUnlocked: true } : {}),
    },
    unlocked,
    message: unlocked
      ? `★ L'ARC PERDU LOCALISÉ — Les indices convergent. La Nébuleuse Noire, secteur 7-Kappa. L'Arc Perdu apparaît sur ta carte de navigation. Raphazarus t'attend.`
      : `Indice collecté (${newClues.length}/${CLUES_NEEDED}). ${clue.clueText}`,
  }
}

// ── GUERRIERS DE RAPHAZARUS (intercepteurs) ──────────────────────────────────

export function shouldSpawnRaphazarusWarrior(gs: GameState): boolean {
  if (!gs.raphazarusActivated) return false
  if ((gs.nexusFragments ?? []).includes(2)) return false
  if (gs.raphazarusWarriorDay === gs.day) return false
  return Math.random() < 0.25
}

export const RAPHAZARUS_WARRIORS = [
  { name: 'Éclaireur du Général', maxHp: 120, damageMin: 18, damageMax: 35, lootMin: 800, lootMax: 1800, description: 'Envoyé par Raphazarus pour te traquer. Armé légèrement mais rapide.', captureChance: 0, killChance: 20, isBoss: false, role: 'normal' as const },
  { name: 'Vétéran de la Grande Guerre', maxHp: 180, damageMin: 25, damageMax: 48, lootMin: 1500, lootMax: 3500, description: 'Un survivant de la Grande Guerre envoyé par Raphazarus. Il a vu pire que toi.', captureChance: 5, killChance: 25, isBoss: false, role: 'tank' as const },
  { name: 'Assassin du 7e Corps', maxHp: 140, damageMin: 30, damageMax: 55, lootMin: 2000, lootMax: 4500, description: 'Spécialiste en élimination du 7e Corps de Raphazarus. Silencieux. Mortel.', captureChance: 0, killChance: 35, isBoss: false, role: 'ranged' as const },
]

export function rollRaphazarusWarrior(gs: GameState): typeof RAPHAZARUS_WARRIORS[number] {
  const fragmentCount = (gs.nexusFragments ?? []).length
  const idx = Math.min(fragmentCount, RAPHAZARUS_WARRIORS.length - 1)
  return RAPHAZARUS_WARRIORS[idx]
}

import type { GameState, SubBossData, SubBossResolution } from '../types'
import { shiftPillar } from './memoryEvents'

// ── RÉSOLUTIONS NON-LÉTALES DES LIEUTENANTS ───────────────────────────────────
// Chaque lieutenant (sous-boss) peut être neutralisé autrement que par le combat.
// Chaque voie ouvre une SCÈNE (texte basé sur sa personnalité) avec un coût, un
// risque et des conséquences réelles — au lieu d'un bouton instantané silencieux.

export interface SubBossResolutionResult {
  success: boolean
  message: string
  patch: Partial<GameState>
  triggerCombat?: boolean   // échec qui bascule en combat forcé
}

export const RESOLUTION_META: Record<SubBossResolution, { icon: string; label: string }> = {
  kill:      { icon: '⚔', label: 'Affronter' },
  negotiate: { icon: '🗣', label: 'Négocier' },
  manipulate:{ icon: '🎭', label: 'Manipuler' },
  sabotage:  { icon: '💣', label: 'Saboter' },
  ally:      { icon: '🤝', label: 'Rallier' },
  betray:    { icon: '🗡', label: 'Trahir' },
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)
const pillarKey = (sb: SubBossData) => sb.pillar as keyof GameState['pillarStanding']
const getStanding = (gs: GameState, sb: SubBossData): number =>
  ((gs.pillarStanding ?? {}) as Record<string, number>)[sb.pillar] ?? 0

function markDefeated(gs: GameState, sb: SubBossData): Partial<GameState> {
  const defeated = { ...(gs.subBossesDefeated ?? {}) }
  defeated[sb.pillar] = [...(defeated[sb.pillar] ?? []), sb.id]
  return { subBossesDefeated: defeated }
}

// Coûts / seuils qui montent avec l'ordre du lieutenant (1 = garde avancé, 4 = bras droit).
const NEGOTIATE_REP   = (o: number) => 20 + o * 10          // 30 / 40 / 50 / 60
const MANIPULATE_CR   = (o: number) => 1500 + o * 500       // 2000 / 2500 / 3000 / 3500
const MANIPULATE_PCT  = (o: number) => [55, 45, 35, 30][o - 1] ?? 35
const SABOTAGE_PCT    = (o: number) => [85, 75, 65, 55][o - 1] ?? 65
const ALLY_STANDING   = (o: number) => 15 + o * 8           // 23 / 31 / 39 / 47
const ALLY_REWARD_CR  = (o: number) => 800 + o * 400        // 1200 … 2400

// ── DISPONIBILITÉ (pour l'UI) ─────────────────────────────────────────────────

export function canResolveSubBoss(
  gs: GameState, sb: SubBossData, action: SubBossResolution,
): { ok: boolean; reason?: string; hint: string } {
  const o = sb.order
  switch (action) {
    case 'negotiate': {
      const req = NEGOTIATE_REP(o)
      if (gs.reputation < req) return { ok: false, reason: `Réputation ${gs.reputation}/${req}`, hint: `Rép. ${req}+ requise` }
      return { ok: true, hint: `Rép. ${req}+ · sans effusion de sang` }
    }
    case 'manipulate': {
      const cr = MANIPULATE_CR(o)
      if (gs.credits < cr) return { ok: false, reason: `Manque ${(cr - gs.credits).toLocaleString()} cr`, hint: `-${cr.toLocaleString()} cr · ${MANIPULATE_PCT(o)}%` }
      return { ok: true, hint: `-${cr.toLocaleString()} cr · ${MANIPULATE_PCT(o)}% · échec = combat` }
    }
    case 'sabotage': {
      const have = gs.cargo['Composants électroniques'] ?? 0
      if (have < 2) return { ok: false, reason: `2× Composants électroniques requis (${have}/2)`, hint: `2× Composants · ${SABOTAGE_PCT(o)}%` }
      return { ok: true, hint: `2× Composants électroniques · ${SABOTAGE_PCT(o)}%` }
    }
    case 'ally': {
      const req = ALLY_STANDING(o)
      const st = getStanding(gs, sb)
      if (st < req || gs.reputation < 40) {
        const m: string[] = []
        if (st < req) m.push(`Standing ${cap(sb.pillar)} ${st}/${req}`)
        if (gs.reputation < 40) m.push(`Réputation ${gs.reputation}/40`)
        return { ok: false, reason: m.join(' · '), hint: `Standing ${req}+ & rép 40+` }
      }
      return { ok: true, hint: `Le rallier à ta cause · +standing` }
    }
    case 'betray': {
      const st = getStanding(gs, sb)
      if (st < 15) return { ok: false, reason: `Approche-le d'abord (standing ${cap(sb.pillar)} ${st}/15)`, hint: `Standing 15+ · gros butin, -standing` }
      return { ok: true, hint: `Gros butin · -standing, -réputation` }
    }
    default:
      return { ok: false, hint: '' }
  }
}

// ── EXÉCUTION (scène + effets) ────────────────────────────────────────────────

export function resolveSubBoss(
  gs: GameState, sb: SubBossData, action: SubBossResolution,
): SubBossResolutionResult {
  const check = canResolveSubBoss(gs, sb, action)
  if (!check.ok) return { success: false, message: check.reason ?? 'Conditions non remplies.', patch: {} }

  const o = sb.order
  const boss = cap(sb.pillar)

  switch (action) {
    // ── NÉGOCIER : voie diplomatique, gâtée par la réputation. Pas de sang. ──
    case 'negotiate': {
      return {
        success: true,
        message: `Tu poses tes armes et tu parles. ${sb.name} t'écoute — méfiant. « ${sb.motivation} » Tu trouves les mots : un compromis qui le laisse sauver la face. Il s'écarte. « Va. Mais ne reviens pas me chercher des noises. » Le passage vers ${boss} est ouvert, sans un mort. (+standing ${boss}, +réputation)`,
        patch: {
          ...markDefeated(gs, sb),
          pillarStanding: shiftPillar(gs, pillarKey(sb), +6),
          reputation: gs.reputation + 4,
        },
      }
    }

    // ── MANIPULER : ruse coûteuse. Échec = il te démasque et attaque. ──
    case 'manipulate': {
      const cr = MANIPULATE_CR(o)
      const ok = Math.random() * 100 < MANIPULATE_PCT(o)
      if (ok) {
        return {
          success: true,
          message: `Tu montes une mise en scène taillée pour lui : « ${sb.personality.split('.')[0]}. » Tu exploites précisément ça. ${sb.name} mord à l'hameçon et se retire, persuadé d'avoir pris la bonne décision. Il ne comprendra jamais. -${cr.toLocaleString()} cr.`,
          patch: {
            ...markDefeated(gs, sb),
            credits: gs.credits - cr,
            pillarStanding: shiftPillar(gs, pillarKey(sb), -3),
          },
        }
      }
      const hpLoss = Math.floor(Math.random() * 20) + 15
      return {
        success: false,
        message: `${sb.name} te laisse dérouler ton mensonge… puis sourit. « Tu me prends pour un débutant ? » Il a vu clair. -${cr.toLocaleString()} cr, -${hpLoss} PV, et il dégaine. Il faut se battre.`,
        patch: {
          credits: gs.credits - cr,
          playerHp: Math.max(1, gs.playerHp - hpLoss),
          pillarStanding: shiftPillar(gs, pillarKey(sb), -8),
        },
        triggerCombat: true,
      }
    }

    // ── SABOTER : préparation matérielle. Échec = alarme, pas de neutralisation. ──
    case 'sabotage': {
      const newCargo = { ...gs.cargo }
      newCargo['Composants électroniques'] = (newCargo['Composants électroniques'] ?? 0) - 2
      if (newCargo['Composants électroniques'] <= 0) delete newCargo['Composants électroniques']
      const ok = Math.random() * 100 < SABOTAGE_PCT(o)
      if (ok) {
        return {
          success: true,
          message: `Tu bricoles ses systèmes en amont — ${sb.combatMechanic.split(':')[0].toLowerCase()}. Quand ${sb.name} veut réagir, rien ne répond. Neutralisé sans un coup de feu. -2 Composants électroniques.`,
          patch: { ...markDefeated(gs, sb), cargo: newCargo },
        }
      }
      return {
        success: false,
        message: `Le sabotage tourne mal — une alarme se déclenche. ${sb.name} sait maintenant que tu es venu pour lui, et il t'attend de pied ferme. -2 Composants électroniques.`,
        patch: { cargo: newCargo, pillarStanding: shiftPillar(gs, pillarKey(sb), -6) },
      }
    }

    // ── RALLIER : le retourner à ta cause. Cher en réputation/standing, gros gain. ──
    case 'ally': {
      const reward = ALLY_REWARD_CR(o)
      return {
        success: true,
        message: `Tu ne le combats pas : tu lui offres mieux. « ${sb.motivation} » — tu lui montres que ton chemin sert ce but plus que ${boss} ne le fera jamais. ${sb.name} hésite longtemps… puis te serre la main. Il passe dans ton camp, et t'ouvre les portes vers ${boss}. +${reward.toLocaleString()} cr, +standing, +réputation.`,
        patch: {
          ...markDefeated(gs, sb),
          credits: gs.credits + reward,
          pillarStanding: shiftPillar(gs, pillarKey(sb), +12),
          reputation: gs.reputation + 6,
          pastDecisions: [...(gs.pastDecisions ?? []), `allied-lt-${sb.id}`],
        },
      }
    }

    // ── TRAHIR : gagner sa confiance pour le poignarder. Mercenaire, mal vu. ──
    case 'betray': {
      const loot = sb.enemy.lootMax
      return {
        success: true,
        message: `Tu joues l'ami, l'allié, le camarade. ${sb.name} baisse sa garde — la première erreur de sa carrière, la dernière aussi. Tu prends tout : +${loot.toLocaleString()} cr. Mais ${boss} saura comment son lieutenant est tombé, et le secteur entier retiendra ta méthode. -standing, -réputation.`,
        patch: {
          ...markDefeated(gs, sb),
          credits: gs.credits + loot,
          pillarStanding: shiftPillar(gs, pillarKey(sb), -25),
          reputation: gs.reputation - 10,
          pastDecisions: [...(gs.pastDecisions ?? []), `betrayed-lt-${sb.id}`],
        },
      }
    }

    default:
      return { success: false, message: 'Méthode indisponible.', patch: {} }
  }
}

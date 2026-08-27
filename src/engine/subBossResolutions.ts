import type { GameState, SubBossData, SubBossResolution } from '../types'
import { shiftPillar } from './memoryEvents'
import i18n from '../i18n/config'

const sr = (key: string, params?: Record<string, unknown>) => i18n.t(key, { ns: 'subBossResolutions', ...params })

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

export function getResolutionMeta(): Record<SubBossResolution, { icon: string; label: string }> {
  return {
    kill:      { icon: '⚔', label: sr('meta.kill') },
    manipulate:{ icon: '🎭', label: sr('meta.manipulate') },
    sabotage:  { icon: '💣', label: sr('meta.sabotage') },
    ally:      { icon: '🤝', label: sr('meta.ally') },
    betray:    { icon: '🗡', label: sr('meta.betray') },
  }
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
    case 'manipulate': {
      const cr = MANIPULATE_CR(o)
      const pct = MANIPULATE_PCT(o)
      if (gs.credits < cr) return { ok: false, reason: sr('canResolve.manipulateWhyNot', { amount: (cr - gs.credits).toLocaleString() }), hint: sr('canResolve.manipulateHintFail', { cr: cr.toLocaleString(), pct }) }
      return { ok: true, hint: sr('canResolve.manipulateHintOk', { cr: cr.toLocaleString(), pct }) }
    }
    case 'sabotage': {
      const have = gs.cargo['Composants électroniques'] ?? 0
      const pct = SABOTAGE_PCT(o)
      if (have < 2) return { ok: false, reason: sr('canResolve.sabotageWhyNot', { have }), hint: sr('canResolve.sabotageHintFail', { pct }) }
      return { ok: true, hint: sr('canResolve.sabotageHintOk', { pct }) }
    }
    case 'ally': {
      const req = ALLY_STANDING(o)
      const st = getStanding(gs, sb)
      if (st < req || gs.reputation < 40) {
        const m: string[] = []
        if (st < req) m.push(sr('canResolve.allyStandingReason', { pillar: cap(sb.pillar), cur: st, req }))
        if (gs.reputation < 40) m.push(sr('canResolve.allyRepReason', { rep: gs.reputation }))
        return { ok: false, reason: m.join(' · '), hint: sr('canResolve.allyHintFail', { req }) }
      }
      return { ok: true, hint: sr('canResolve.allyHintOk') }
    }
    case 'betray': {
      const st = getStanding(gs, sb)
      if (st < 15) return { ok: false, reason: sr('canResolve.betrayWhyNot', { pillar: cap(sb.pillar), cur: st }), hint: sr('canResolve.betrayHintFail') }
      return { ok: true, hint: sr('canResolve.betrayHintOk') }
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
  if (!check.ok) return { success: false, message: check.reason ?? sr('canResolve.conditionsNotMet'), patch: {} }

  const o = sb.order
  const boss = cap(sb.pillar)

  switch (action) {
    // ── MANIPULER : ruse coûteuse. Échec = il te démasque et attaque. ──
    case 'manipulate': {
      const cr = MANIPULATE_CR(o)
      const ok = Math.random() * 100 < MANIPULATE_PCT(o)
      if (ok) {
        return {
          success: true,
          message: sr('resolve.manipulateSuccess', { trait: sb.personality.split('.')[0], name: sb.name, cr: cr.toLocaleString() }),
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
        message: sr('resolve.manipulateFail', { name: sb.name, cr: cr.toLocaleString(), hp: hpLoss }),
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
          message: sr('resolve.sabotageSuccess', { mechanic: sb.combatMechanic.split(':')[0].toLowerCase(), name: sb.name }),
          patch: { ...markDefeated(gs, sb), cargo: newCargo },
        }
      }
      return {
        success: false,
        message: sr('resolve.sabotageFail', { name: sb.name }),
        patch: { cargo: newCargo, pillarStanding: shiftPillar(gs, pillarKey(sb), -6) },
      }
    }

    // ── RALLIER : le retourner à ta cause. Cher en réputation/standing, gros gain. ──
    case 'ally': {
      const reward = ALLY_REWARD_CR(o)
      return {
        success: true,
        message: sr('resolve.allySuccess', { motivation: sb.motivation, boss, name: sb.name, reward: reward.toLocaleString() }),
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
        message: sr('resolve.betraySuccess', { name: sb.name, loot: loot.toLocaleString(), boss }),
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
      return { success: false, message: sr('canResolve.unavailable'), patch: {} }
  }
}

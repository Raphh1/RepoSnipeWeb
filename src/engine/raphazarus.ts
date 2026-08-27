import type { GameState, Enemy } from '../types'
import i18n from '../i18n/config'

const rz = (key: string) => i18n.t(key, { ns: 'raphazarus' })

interface WarriorTemplate {
  name: string
  description: string
}

function getWarriors(): WarriorTemplate[] {
  return [
    { name: rz('drakhanos.name'), description: rz('drakhanos.description') },
    { name: rz('legionAcier.name'), description: rz('legionAcier.description') },
    { name: rz('vorne.name'), description: rz('vorne.description') },
    { name: rz('soeurKaln.name'), description: rz('soeurKaln.description') },
    { name: rz('spectre.name'), description: rz('spectre.description') },
  ]
}

export function shouldRaphazarusStrike(gs: GameState): boolean {
  if (!gs.raphazarusActivated) return false
  if ((gs.nexusFragments ?? []).includes(2)) return false
  const frags = (gs.nexusFragments ?? []).length
  if (frags >= 4) return false
  const chance = frags <= 1 ? 0.18 : frags === 2 ? 0.25 : 0.35
  return Math.random() < chance
}

export function getRaphazarusWarrior(gs: GameState): Enemy {
  const frags = (gs.nexusFragments ?? []).length
  const power = 1 + frags * 0.40 + gs.day * 0.02
  const warriors = getWarriors()
  const t = warriors[Math.floor(Math.random() * warriors.length)]
  return {
    name: t.name,
    description: t.description,
    maxHp: Math.floor((190 + gs.day * 5) * power),
    damageMin: Math.floor(28 * power),
    damageMax: Math.floor(56 * power),
    lootMin: 1800,
    lootMax: 4200,
    captureChance: 6,
    killChance: 32,
    isBoss: true,
    role: 'normal',
  }
}

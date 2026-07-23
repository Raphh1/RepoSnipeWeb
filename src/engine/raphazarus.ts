import type { GameState, Enemy } from '../types'

interface WarriorTemplate {
  name: string
  description: string
}

const WARRIORS: WarriorTemplate[] = [
  { name: 'Drakhanos, Première Lame', description: "La main droite de Raphazarus. On dit qu'il n'a jamais perdu un duel — parce qu'aucun adversaire n'a survécu pour en parler." },
  { name: 'La Légion d\'Acier de Raphazarus', description: "Une escouade soudée par 47 ans de guerre. Ils se battent comme un seul homme, et meurent comme personne." },
  { name: 'Vorne le Bourreau de l\'Arc', description: "Il exécutait les déserteurs pendant la Grande Guerre. Raphazarus l'a réveillé rien que pour toi." },
  { name: 'Sœur Kaln, Veuve de Guerre', description: "Elle a tout perdu dans la Fracture. Raphazarus lui a rendu un but : t'empêcher de finir ce qu'il a commencé." },
  { name: 'Le Spectre du Front Perdu', description: "Un vétéran que la guerre n'a jamais laissé partir. Il frappe depuis des angles que tu ne vois pas venir." },
]

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
  const t = WARRIORS[Math.floor(Math.random() * WARRIORS.length)]
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

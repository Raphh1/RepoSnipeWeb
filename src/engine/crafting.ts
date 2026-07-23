import type { GameState } from '../types'
import type { Recipe } from '../data/recipes'
import { rollWeaponForTier } from '../data/weapons'
import { rollArmorForTier } from '../data/armors'

export function canCraft(recipe: Recipe, cargo: GameState['cargo']): boolean {
  return Object.entries(recipe.ingredients).every(
    ([item, qty]) => (cargo[item] ?? 0) >= qty
  )
}

export function getMissingIngredients(recipe: Recipe, cargo: GameState['cargo']): Record<string, number> {
  const missing: Record<string, number> = {}
  for (const [item, qty] of Object.entries(recipe.ingredients)) {
    const have = cargo[item] ?? 0
    if (have < qty) missing[item] = qty - have
  }
  return missing
}

export function applyCraft(gs: GameState, recipe: Recipe): GameState {
  // Consomme les ingrédients
  const newCargo = { ...gs.cargo }
  for (const [item, qty] of Object.entries(recipe.ingredients)) {
    newCargo[item] = (newCargo[item] ?? 0) - qty
    if (newCargo[item] <= 0) delete newCargo[item]
  }

  let result: GameState = { ...gs, cargo: newCargo }
  const out = recipe.output

  if (out.type === 'weapon_roll') {
    const weapon = rollWeaponForTier(out.tier)
    result = { ...result, weapons: [...result.weapons, weapon] }
  } else if (out.type === 'armor_roll') {
    const armor = rollArmorForTier(out.tier)
    result = { ...result, armors: [...result.armors, armor] }
  } else if (out.type === 'cargo') {
    // Cas spécial : carburant de synthèse appliqué directement
    if (out.item === 'Carburant de synthèse') {
      result = { ...result, fuel: Math.min(result.maxFuel, result.fuel + 2) }
    } else {
      result = {
        ...result,
        cargo: { ...result.cargo, [out.item]: (result.cargo[out.item] ?? 0) + out.quantity },
      }
    }
  }

  return result
}

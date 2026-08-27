import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../../store/gameStore'
import { playCraft } from '../../engine/sfx'
import { getRecipes } from '../../data/recipes'
import { canCraft, getMissingIngredients, applyCraft } from '../../engine/crafting'
import type { Recipe } from '../../data/recipes'
import { translateGood } from '../../engine/goodsI18n'

const CAT_COLORS = {
  arme:        'var(--orange)',
  armure:      'var(--blue)',
  consommable: 'var(--green)',
  ressource:   'var(--cyan)',
}
const CATEGORIES = ['arme', 'armure', 'consommable', 'ressource'] as const

export function CraftingScreen() {
  const { t } = useTranslation('craftingScreen')
  const gs    = useGameStore(s => s.gs!)
  const patch = useGameStore(s => s.patch)
  const goTo  = useGameStore(s => s.goTo)
  const [lastCrafted, setLastCrafted] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'available'>('all')

  function outputLabel(recipe: Recipe): string {
    const out = recipe.output
    if (out.type === 'weapon_roll') return t('randomWeaponTier', { tier: out.tier })
    if (out.type === 'armor_roll')  return t('randomArmorTier', { tier: out.tier })
    if (out.item === 'Carburant de synthèse') return t('instantFuel')
    return t('outputQty', { item: translateGood(out.item), qty: out.quantity })
  }

  function craft(recipe: Recipe) {
    if (!canCraft(recipe, gs.cargo)) return
    if (gs.actionsToday >= 3) return
    const newGs = applyCraft(gs, recipe)
    const out = recipe.output
    let msg = ''
    if (out.type === 'weapon_roll') {
      msg = t('craftedWeapon', { recipe: recipe.name, item: newGs.weapons[newGs.weapons.length - 1]?.name ?? t('unknownWeapon') })
    } else if (out.type === 'armor_roll') {
      msg = t('craftedArmor', { recipe: recipe.name, item: newGs.armors[newGs.armors.length - 1]?.name ?? t('unknownArmor') })
    } else if (out.type === 'cargo' && out.item === 'Carburant de synthèse') {
      msg = t('craftedFuel', { recipe: recipe.name })
    } else if (out.type === 'cargo') {
      msg = t('craftedCargo', { recipe: recipe.name, item: translateGood(out.item), qty: out.quantity })
    }
    patch({ ...newGs, actionsToday: gs.actionsToday + 1, pendingMessage: msg, craftsPerformed: (gs.craftsPerformed ?? 0) + 1 })
    setLastCrafted(recipe.id)
  }

  const actionsLeft = 3 - gs.actionsToday

  return (
    <div className="layout">
      {/* Header */}
      <div className="row" style={{ alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => goTo('station-hub')}>{t('back')}</button>
        <div className="t-sm t-bright" style={{ flex: 1 }}>{t('title')}</div>
        <div className="t-xs t-dim">{t('actions')} <span style={{ color: actionsLeft > 0 ? 'var(--cyan)' : 'var(--red)' }}>{actionsLeft}/3</span></div>
      </div>

      {/* Filtre */}
      <div className="row gap4">
        <button className="px-btn px-btn--sm" style={{ width: 'auto', borderColor: filter === 'all' ? 'var(--cyan)' : undefined, color: filter === 'all' ? 'var(--cyan)' : undefined }}
          onClick={() => setFilter('all')}>{t('all')}</button>
        <button className="px-btn px-btn--sm" style={{ width: 'auto', borderColor: filter === 'available' ? 'var(--green)' : undefined, color: filter === 'available' ? 'var(--green)' : undefined }}
          onClick={() => setFilter('available')}>{t('available')}</button>
        <div className="t-xs t-dim" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
          {t('cargo', { list: Object.entries(gs.cargo).map(([k, v]) => `${translateGood(k)} ×${v}`).join(' · ') || t('cargoEmpty') })}
        </div>
      </div>

      {/* Recettes par catégorie */}
      {CATEGORIES.map(cat => {
        const recipes = getRecipes().filter(r => r.category === cat && (filter === 'all' || canCraft(r, gs.cargo)))
        if (recipes.length === 0) return null
        const color = CAT_COLORS[cat]
        return (
          <div key={cat}>
            <div className="section-header" style={{ borderColor: color, color }}>{t(`categories.${cat}`)}</div>
            <div className="col gap4">
              {recipes.map(recipe => {
                const craftable = canCraft(recipe, gs.cargo)
                const missing   = craftable ? {} : getMissingIngredients(recipe, gs.cargo)
                const isLast    = lastCrafted === recipe.id
                return (
                  <div key={recipe.id} className="px-box" style={{
                    borderColor: craftable ? color : 'var(--border)',
                    opacity: craftable ? 1 : 0.6,
                    background: isLast ? 'rgba(0,255,0,0.04)' : undefined,
                  }}>
                    <div className="row" style={{ alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div className="t-sm" style={{ color: craftable ? color : 'var(--text)' }}>{recipe.name}</div>
                        <div className="t-xs t-dim mt4" style={{ lineHeight: '1.8' }}>{recipe.description}</div>

                        {/* Ingrédients */}
                        <div className="row mt8" style={{ flexWrap: 'wrap', gap: '6px' }}>
                          {Object.entries(recipe.ingredients).map(([item, qty]) => {
                            const have = gs.cargo[item] ?? 0
                            const ok   = have >= qty
                            return (
                              <span key={item} className="tag t-xs" style={{
                                borderColor: ok ? 'var(--border)' : 'var(--red)',
                                color: ok ? 'var(--text-dim)' : 'var(--red)',
                              }}>
                                {translateGood(item)} ×{qty}{!ok ? ` (${have})` : ''}
                              </span>
                            )
                          })}
                        </div>

                        {/* Output */}
                        <div className="t-xs mt8" style={{ color }}>
                          → {outputLabel(recipe)}
                        </div>

                        {/* Manquants */}
                        {!craftable && Object.keys(missing).length > 0 && (
                          <div className="t-xs t-red mt4">
                            {t('missing', { list: Object.entries(missing).map(([k, v]) => `${translateGood(k)} ×${v}`).join(', ') })}
                          </div>
                        )}
                      </div>

                      <button
                        className="px-btn px-btn--sm"
                        disabled={!craftable || actionsLeft <= 0}
                        style={craftable && actionsLeft > 0 ? { borderColor: color, color, minWidth: '80px' } : { minWidth: '80px' }}
                        onClick={() => { playCraft(); craft(recipe) }}
                      >
                        {actionsLeft <= 0 ? t('exhausted') : t('craft')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {filter === 'available' && getRecipes().filter(r => canCraft(r, gs.cargo)).length === 0 && (
        <div className="px-box t-dim t-xs t-center">
          {t('noRecipesAvailable')}
        </div>
      )}
    </div>
  )
}

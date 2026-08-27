import type { GameState, WeaponData, ArmorData } from '../types'
import { rollWeaponForTier } from '../data/weapons'
import { rollArmorForTier, grantArmor } from '../data/armors'
import i18n from '../i18n/config'

const bm = (key: string, params?: Record<string, unknown>) => i18n.t(key, { ns: 'blackMarket', ...params })

export interface BlackMarketOffer {
  id: string
  type: 'weapon' | 'armor' | 'item' | 'intel' | 'implant'
  name: string
  description: string
  price: number
  weapon?: WeaponData
  armor?: ArmorData
  itemName?: string
  itemQty?: number
  repCost?: number
  effect?: Partial<GameState>
}

function seededRng(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return s / 2147483647
  }
}

export function getBlackMarketOffers(gs: GameState): BlackMarketOffer[] {
  const rng = seededRng(gs.day * 7919 + gs.currentStation.length * 31)
  const offers: BlackMarketOffer[] = []

  // Le marché noir vend des armes FORTES mais jamais les plus fortes (Tier 5)
  // ni les armes des piliers (ex. Le Sceptre de Raphazarus) — celles-ci sont
  // loot/quête uniquement. Plafond : Tier 4.
  const weaponTier = gs.day < 10 ? 2 : gs.day < 20 ? 3 : 4
  const w = rollWeaponForTier(weaponTier)
  const wPrice = Math.floor((weaponTier * 1800 + rng() * 2000) * 1.5)
  offers.push({
    id: `bm-w-${gs.day}`,
    type: 'weapon',
    name: w.name,
    description: bm('weaponDesc', { tier: weaponTier, effect: w.effectDesc || bm('noSpecialEffect') }),
    price: wPrice,
    weapon: w,
  })

  const armorTier = Math.min(5, weaponTier)
  const a = rollArmorForTier(armorTier)
  const aPrice = Math.floor((armorTier * 1500 + rng() * 1500) * 1.5)
  offers.push({
    id: `bm-a-${gs.day}`,
    type: 'armor',
    name: a.name,
    description: bm('armorDesc', { tier: armorTier, desc: a.description }),
    price: aPrice,
    armor: a,
  })

  const contraband: { name: string; desc: string; item: string; qty: number; price: number }[] = [
    { name: bm('contraband.stolenData.name'), desc: bm('contraband.stolenData.desc'), item: 'Données volées', qty: 3, price: 1500 },
    { name: bm('contraband.illegalArms.name'), desc: bm('contraband.illegalArms.desc'), item: 'Armes illégales', qty: 2, price: 1200 },
    { name: bm('contraband.milStims.name'), desc: bm('contraband.milStims.desc'), item: 'Stimulants de combat', qty: 3, price: 1000 },
    { name: bm('contraband.classifiedComponents.name'), desc: bm('contraband.classifiedComponents.desc'), item: 'Composants expérimentaux', qty: 2, price: 2200 },
    { name: bm('contraband.preFractureData.name'), desc: bm('contraband.preFractureData.desc'), item: 'Données pré-Fracture', qty: 1, price: 2800 },
    { name: bm('contraband.premiumFakeId.name'), desc: bm('contraband.premiumFakeId.desc'), item: 'Fausses identités', qty: 1, price: 1800 },
    { name: bm('contraband.smuggledImplants.name'), desc: bm('contraband.smuggledImplants.desc'), item: 'Implants cybernétiques', qty: 1, price: 1600 },
    { name: bm('contraband.rawCrystals.name'), desc: bm('contraband.rawCrystals.desc'), item: 'Cristaux énergétiques', qty: 3, price: 1900 },
  ]
  const idx1 = Math.floor(rng() * contraband.length)
  const idx2 = (idx1 + 1 + Math.floor(rng() * (contraband.length - 1))) % contraband.length
  for (const idx of [idx1, idx2]) {
    const c = contraband[idx]
    offers.push({
      id: `bm-c-${idx}-${gs.day}`,
      type: 'item',
      name: c.name,
      description: c.desc,
      price: c.price,
      itemName: c.item,
      itemQty: c.qty,
    })
  }

  if (rng() < 0.4) {
    offers.push({
      id: `bm-intel-${gs.day}`,
      type: 'intel',
      name: bm('intel.name'),
      description: bm('intel.desc'),
      price: 2500,
      repCost: 0,
      effect: { reputation: gs.reputation + 15 },
    })
  }

  return offers
}

export function isBlackMarketAvailable(gs: GameState): boolean {
  return gs.day >= 3
}

export function buyBlackMarketOffer(gs: GameState, offer: BlackMarketOffer): Partial<GameState> | null {
  if (gs.credits < offer.price) return null
  const patch: Partial<GameState> = { credits: gs.credits - offer.price }

  if (offer.weapon) {
    patch.weapons = [...gs.weapons, offer.weapon]
  }
  if (offer.armor) {
    Object.assign(patch, grantArmor({ ...gs, credits: patch.credits! }, offer.armor))
  }
  if (offer.itemName && offer.itemQty) {
    const newCargo = { ...gs.cargo }
    newCargo[offer.itemName] = (newCargo[offer.itemName] ?? 0) + offer.itemQty
    patch.cargo = newCargo
  }
  if (offer.effect) {
    Object.assign(patch, offer.effect)
  }

  return patch
}

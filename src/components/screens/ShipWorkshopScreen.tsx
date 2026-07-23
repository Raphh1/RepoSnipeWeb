import { useGameStore } from '../../store/gameStore'
import { FUEL_STATIONS } from '../../data/stations'
import type { GameState } from '../../types'

type ModuleKey = 'moteur' | 'soute' | 'tourelle' | 'scanner'

interface ModuleUpgrade {
  level: 1 | 2 | 3
  label: string
  desc: string
  cost: number
  ingredient?: { name: string; qty: number }
  apply: (gs: GameState) => Partial<GameState>
}

const MODULE_DEFS: Record<ModuleKey, { name: string; icon: string; color: string; upgrades: ModuleUpgrade[] }> = {
  moteur: {
    name: 'Moteur', icon: '⚡', color: 'var(--cyan)',
    upgrades: [
      { level: 1, label: 'Mk I — Réservoir étendu',    desc: '+2 carburant max',                         cost: 800,  ingredient: { name: 'Pièces techniques',      qty: 1 },
        apply: gs => ({ maxFuel: gs.maxFuel + 2, fuel: Math.min(gs.maxFuel + 2, gs.fuel + 2), credits: gs.credits - 800,  cargo: consumeItem(gs.cargo, 'Pièces techniques', 1) }) },
      { level: 2, label: 'Mk II — Chambre de poussée', desc: '+2 carburant max supplémentaires',          cost: 1800, ingredient: { name: 'Composants électroniques', qty: 1 },
        apply: gs => ({ maxFuel: gs.maxFuel + 2, fuel: Math.min(gs.maxFuel + 2, gs.fuel + 2), credits: gs.credits - 1800, cargo: consumeItem(gs.cargo, 'Composants électroniques', 1) }) },
      { level: 3, label: 'Mk III — Overdrive',         desc: '+2 carburant max · −1 coût tous les voyages', cost: 3500, ingredient: { name: 'Cristaux énergétiques',   qty: 1 },
        apply: gs => ({ maxFuel: gs.maxFuel + 2, fuel: Math.min(gs.maxFuel + 2, gs.fuel + 2), credits: gs.credits - 3500, cargo: consumeItem(gs.cargo, 'Cristaux énergétiques', 1) }) },
    ],
  },
  soute: {
    name: 'Soute', icon: '📦', color: 'var(--gold)',
    upgrades: [
      { level: 1, label: 'Mk I — Rangements optimisés', desc: 'Vente cargo +10%',  cost: 600,  ingredient: { name: 'Ferraille',         qty: 2 },
        apply: gs => ({ credits: gs.credits - 600,  cargo: consumeItem(gs.cargo, 'Ferraille', 2) }) },
      { level: 2, label: 'Mk II — Isolation thermique', desc: 'Vente cargo +20%',  cost: 1400, ingredient: { name: 'Composants divers',  qty: 2 },
        apply: gs => ({ credits: gs.credits - 1400, cargo: consumeItem(gs.cargo, 'Composants divers', 2) }) },
      { level: 3, label: 'Mk III — Soute pressurisée',  desc: 'Vente cargo +30%',  cost: 2800, ingredient: { name: 'Métaux rares',       qty: 1 },
        apply: gs => ({ credits: gs.credits - 2800, cargo: consumeItem(gs.cargo, 'Métaux rares', 1) }) },
    ],
  },
  tourelle: {
    name: 'Tourelle', icon: '🔫', color: 'var(--orange)',
    upgrades: [
      { level: 1, label: 'Mk I — Viseur laser',      desc: '+12% dégâts combat',              cost: 1000, ingredient: { name: 'Métaux bruts',          qty: 2 },
        apply: gs => ({ credits: gs.credits - 1000, cargo: consumeItem(gs.cargo, 'Métaux bruts', 2),          class: { ...gs.class, combatAttackMult: (gs.class.combatAttackMult ?? 1.0) + 0.12 } }) },
      { level: 2, label: 'Mk II — Canon secondaire', desc: '+15% dégâts combat supplémentaires', cost: 2500, ingredient: { name: 'Munitions spéciales',    qty: 1 },
        apply: gs => ({ credits: gs.credits - 2500, cargo: consumeItem(gs.cargo, 'Munitions spéciales', 1),    class: { ...gs.class, combatAttackMult: (gs.class.combatAttackMult ?? 1.0) + 0.15 } }) },
      { level: 3, label: 'Mk III — Surcharge',       desc: '+18% dégâts · +5% crit',          cost: 5000, ingredient: { name: 'Composants expérimentaux', qty: 1 },
        apply: gs => ({ credits: gs.credits - 5000, cargo: consumeItem(gs.cargo, 'Composants expérimentaux', 1), class: { ...gs.class, combatAttackMult: (gs.class.combatAttackMult ?? 1.0) + 0.18, combatCritBonus: (gs.class.combatCritBonus ?? 0) + 5 } }) },
    ],
  },
  scanner: {
    name: 'Scanner', icon: '📡', color: 'var(--purple)',
    upgrades: [
      { level: 1, label: 'Mk I — Capteurs passifs',   desc: 'Voit les prix aux destinations',       cost: 800,  ingredient: { name: 'Logiciels',           qty: 1 },
        apply: gs => ({ credits: gs.credits - 800,  cargo: consumeItem(gs.cargo, 'Logiciels', 1),           class: { ...gs.class, seesPrices: true } }) },
      { level: 2, label: 'Mk II — Analyse tactique',  desc: '−10% risque combat en exploration',   cost: 2000, ingredient: { name: 'Données classifiées',   qty: 1 },
        apply: gs => ({ credits: gs.credits - 2000, cargo: consumeItem(gs.cargo, 'Données classifiées', 1) }) },
      { level: 3, label: 'Mk III — Réseau neural',    desc: '−20% risque combat (cumul)',          cost: 4000, ingredient: { name: 'Technologies avancées', qty: 1 },
        apply: gs => ({ credits: gs.credits - 4000, cargo: consumeItem(gs.cargo, 'Technologies avancées', 1) }) },
    ],
  },
}

function consumeItem(cargo: GameState['cargo'], item: string, qty: number): GameState['cargo'] {
  const newCargo = { ...cargo }
  newCargo[item] = (newCargo[item] ?? 0) - qty
  if (newCargo[item] <= 0) delete newCargo[item]
  return newCargo
}

function canInstall(gs: GameState, key: ModuleKey, upg: ModuleUpgrade): boolean {
  if (gs.credits < upg.cost) return false
  if (upg.ingredient && (gs.cargo[upg.ingredient.name] ?? 0) < upg.ingredient.qty) return false
  return true
}

const REPAIR_PRICE = 80  // cr par PV

// Upgrades nécessitant des items cargo + crédits
const SHIP_UPGRADES = [
  {
    id: 'hull_basic',
    label: 'Blindage renforcé',
    desc: '+20 PV coque max',
    cost: 600,
    items: [{ name: 'Métaux bruts', qty: 2 }] as { name: string; qty: number }[],
    apply: (gs: ReturnType<typeof useGameStore.getState>['gs']) => {
      if (!gs) return
      const cargo = { ...gs.cargo }
      cargo['Métaux bruts'] = (cargo['Métaux bruts'] ?? 0) - 2
      if (cargo['Métaux bruts'] <= 0) delete cargo['Métaux bruts']
      useGameStore.getState().patch({
        credits: gs.credits - 600,
        shipMaxHp: gs.shipMaxHp + 20,
        shipHp: gs.shipHp + 20,
        cargo,
      })
    },
    available: (gs: ReturnType<typeof useGameStore.getState>['gs']) =>
      !!gs && gs.shipMaxHp < 200 && gs.credits >= 600 && (gs.cargo['Métaux bruts'] ?? 0) >= 2,
  },
  {
    id: 'hull_advanced',
    label: 'Alliage de guerre',
    desc: '+30 PV coque max',
    cost: 1500,
    items: [{ name: 'Métaux rares', qty: 1 }] as { name: string; qty: number }[],
    apply: (gs: ReturnType<typeof useGameStore.getState>['gs']) => {
      if (!gs) return
      const cargo = { ...gs.cargo }
      cargo['Métaux rares'] = (cargo['Métaux rares'] ?? 0) - 1
      if (cargo['Métaux rares'] <= 0) delete cargo['Métaux rares']
      useGameStore.getState().patch({
        credits: gs.credits - 1500,
        shipMaxHp: gs.shipMaxHp + 30,
        shipHp: gs.shipHp + 30,
        cargo,
      })
    },
    available: (gs: ReturnType<typeof useGameStore.getState>['gs']) =>
      !!gs && gs.shipMaxHp < 200 && gs.credits >= 1500 && (gs.cargo['Métaux rares'] ?? 0) >= 1,
  },
  {
    id: 'tank_basic',
    label: 'Réservoir étendu',
    desc: '+2 carburant max',
    cost: 1000,
    items: [{ name: 'Pièces techniques', qty: 1 }] as { name: string; qty: number }[],
    apply: (gs: ReturnType<typeof useGameStore.getState>['gs']) => {
      if (!gs) return
      const cargo = { ...gs.cargo }
      cargo['Pièces techniques'] = (cargo['Pièces techniques'] ?? 0) - 1
      if (cargo['Pièces techniques'] <= 0) delete cargo['Pièces techniques']
      useGameStore.getState().patch({
        credits: gs.credits - 1000,
        maxFuel: gs.maxFuel + 2,
        cargo,
      })
    },
    available: (gs: ReturnType<typeof useGameStore.getState>['gs']) =>
      !!gs && gs.maxFuel < 20 && gs.credits >= 1000 && (gs.cargo['Pièces techniques'] ?? 0) >= 1,
  },
  {
    id: 'tank_advanced',
    label: 'Moteur suralimenté',
    desc: '+3 carburant max',
    cost: 2000,
    items: [{ name: 'Cristaux énergétiques', qty: 1 }] as { name: string; qty: number }[],
    apply: (gs: ReturnType<typeof useGameStore.getState>['gs']) => {
      if (!gs) return
      const cargo = { ...gs.cargo }
      cargo['Cristaux énergétiques'] = (cargo['Cristaux énergétiques'] ?? 0) - 1
      if (cargo['Cristaux énergétiques'] <= 0) delete cargo['Cristaux énergétiques']
      useGameStore.getState().patch({
        credits: gs.credits - 2000,
        maxFuel: gs.maxFuel + 3,
        cargo,
      })
    },
    available: (gs: ReturnType<typeof useGameStore.getState>['gs']) =>
      !!gs && gs.maxFuel < 20 && gs.credits >= 2000 && (gs.cargo['Cristaux énergétiques'] ?? 0) >= 1,
  },
  {
    id: 'implant',
    label: 'Implant médical',
    desc: '+25 PV joueur max',
    cost: 1800,
    items: [{ name: 'Implants', qty: 1 }] as { name: string; qty: number }[],
    apply: (gs: ReturnType<typeof useGameStore.getState>['gs']) => {
      if (!gs) return
      const cargo = { ...gs.cargo }
      cargo['Implants'] = (cargo['Implants'] ?? 0) - 1
      if (cargo['Implants'] <= 0) delete cargo['Implants']
      useGameStore.getState().patch({
        credits: gs.credits - 1800,
        playerMaxHp: gs.playerMaxHp + 25,
        playerHp: Math.min(gs.playerHp + 25, gs.playerMaxHp + 25),
        cargo,
      })
    },
    available: (gs: ReturnType<typeof useGameStore.getState>['gs']) =>
      !!gs && gs.playerMaxHp < 250 && gs.credits >= 1800 && (gs.cargo['Implants'] ?? 0) >= 1,
  },
]

export function ShipWorkshopScreen() {
  const gs         = useGameStore(s => s.gs!)
  const goTo       = useGameStore(s => s.goTo)
  const patch      = useGameStore(s => s.patch)
  const repairShip = useGameStore(s => s.repairShip)
  const buyFuel    = useGameStore(s => s.buyFuel)

  const missingHp   = gs.shipMaxHp - gs.shipHp
  const missingFuel = gs.maxFuel - gs.fuel
  const fuelPrice   = 210
  const isFuelStation = FUEL_STATIONS.has(gs.currentStation)

  const shipPct = (gs.shipHp / gs.shipMaxHp) * 100

  return (
    <div className="layout">
      <div className="row" style={{ alignItems: 'center', gap: '16px' }}>
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => goTo('station-hub')}>← RETOUR</button>
        <div className="t-sm t-bright">ATELIER VAISSEAU</div>
        <div className="t-xs t-gold">{gs.credits.toLocaleString()} cr</div>
        {isFuelStation && <div className="tag tag--green t-xs">STATION DE RAVITAILLEMENT</div>}
      </div>

      {/* État du vaisseau */}
      <div className="px-box">
        <div className="t-xs t-dim mb4">STRUCTURE</div>
        <div className="bar bar--ship mb4">
          <div className="bar__fill" style={{ width: `${shipPct}%` }} />
        </div>
        <div className="t-sm" style={{ color: shipPct < 30 ? 'var(--red)' : 'var(--blue)' }}>
          {gs.shipHp} / {gs.shipMaxHp} PV
        </div>
        <div className="t-xs t-dim mt4">
          Carburant : <span className="t-cyan">{gs.fuel}/{gs.maxFuel}</span>
        </div>
      </div>

      {/* Réparations — disponibles partout */}
      <div className="px-box">
        <div className="t-xs t-dim mb8">RÉPARATIONS</div>
        {missingHp <= 0
          ? <div className="t-xs t-green">Vaisseau en parfait état.</div>
          : (
            <div className="col gap4">
              {[10, 25, 50, missingHp].filter((v, i, a) => a.indexOf(v) === i && v <= missingHp && v > 0).map(amount => {
                const cost = amount * REPAIR_PRICE
                return (
                  <button key={amount} className="px-btn" disabled={gs.credits < cost}
                    onClick={() => repairShip(amount, REPAIR_PRICE)}>
                    +{amount} PV — {cost.toLocaleString()} cr
                    {gs.credits < cost ? ' (insuffisant)' : ''}
                  </button>
                )
              })}
            </div>
          )
        }
      </div>

      {/* Carburant — uniquement stations de ravitaillement */}
      {isFuelStation
        ? missingFuel > 0
          ? (
            <div className="px-box">
              <div className="t-xs t-dim mb8">RAVITAILLEMENT</div>
              <div className="col gap4">
                {[1, Math.min(3, missingFuel), missingFuel].filter((v, i, a) => a.indexOf(v) === i && v > 0).map(amount => {
                  const cost = amount * fuelPrice
                  return (
                    <button key={amount} className="px-btn" disabled={gs.credits < cost}
                      onClick={() => buyFuel(amount, fuelPrice)}>
                      +{amount} carburant — {cost.toLocaleString()} cr
                      {gs.credits < cost ? ' (insuffisant)' : ''}
                    </button>
                  )
                })}
              </div>
            </div>
          )
          : (
            <div className="px-box">
              <div className="t-xs t-dim mb4">RAVITAILLEMENT</div>
              <div className="t-xs t-green">Réservoir plein.</div>
            </div>
          )
        : (
          <div className="px-box" style={{ borderColor: 'var(--red)' }}>
            <div className="t-xs t-dim mb4">RAVITAILLEMENT</div>
            <div className="t-xs t-red">Cette station ne dispose pas de dépôt de carburant.</div>
            <div className="t-xs t-dim mt4">Rejoins une station de ravitaillement : La Carcasse, Port Méridien, La Balise, Confluent, La Raffinerie, Relais Noir, Relais de Transit, Fort Kharos.</div>
          </div>
        )
      }

      {/* Modules vaisseau */}
      <div className="px-box">
        <div className="t-xs t-dim mb8">MODULES DU VAISSEAU</div>
        <div className="col gap4">
          {(Object.keys(MODULE_DEFS) as ModuleKey[]).map(key => {
            const def       = MODULE_DEFS[key]
            const current   = gs.shipModules?.[key] ?? 0
            const nextUpg   = def.upgrades.find(u => u.level === current + 1)
            const maxed     = current >= 3
            const ok        = nextUpg ? canInstall(gs, key, nextUpg) : false

            return (
              <div key={key} className="px-box" style={{ borderColor: current > 0 ? def.color : 'var(--border)', padding: '10px 14px' }}>
                <div className="row" style={{ alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ color: def.color }}>{def.icon} {def.name}</span>
                  <div className="row" style={{ gap: '4px' }}>
                    {[1, 2, 3].map(lvl => (
                      <div key={lvl} style={{
                        width: '16px', height: '6px', borderRadius: '2px',
                        background: current >= lvl ? def.color : 'var(--border)',
                      }} />
                    ))}
                  </div>
                  <span className="t-xs t-dim" style={{ marginLeft: 'auto' }}>
                    {maxed ? <span style={{ color: def.color }}>MAXÉ</span> : `Mk ${current} → Mk ${current + 1}`}
                  </span>
                </div>

                {/* Effets actifs */}
                {current > 0 && (
                  <div className="t-xs t-dim mb6" style={{ lineHeight: '1.8' }}>
                    Actif : {def.upgrades.slice(0, current).map(u => u.desc).join(' · ')}
                  </div>
                )}

                {/* Prochain upgrade */}
                {nextUpg && !maxed && (
                  <div>
                    <div className="t-xs mb6">
                      <span style={{ color: def.color }}>{nextUpg.label}</span>
                      <span className="t-dim"> — {nextUpg.desc}</span>
                    </div>
                    <div className="row" style={{ alignItems: 'center', gap: '8px' }}>
                      <span className="t-xs t-gold">{nextUpg.cost.toLocaleString()} cr</span>
                      {nextUpg.ingredient && (
                        <span className="tag t-xs" style={{
                          borderColor: (gs.cargo[nextUpg.ingredient.name] ?? 0) >= nextUpg.ingredient.qty ? 'var(--border)' : 'var(--red)',
                          color:       (gs.cargo[nextUpg.ingredient.name] ?? 0) >= nextUpg.ingredient.qty ? 'var(--text-dim)' : 'var(--red)',
                        }}>
                          {nextUpg.ingredient.name} ×{nextUpg.ingredient.qty}
                          {(gs.cargo[nextUpg.ingredient.name] ?? 0) < nextUpg.ingredient.qty
                            ? ` (${gs.cargo[nextUpg.ingredient.name] ?? 0}/${nextUpg.ingredient.qty})`
                            : ''}
                        </span>
                      )}
                      <button
                        className="px-btn px-btn--sm"
                        disabled={!ok}
                        style={ok ? { borderColor: def.color, color: def.color, marginLeft: 'auto' } : { marginLeft: 'auto' }}
                        onClick={() => {
                          const changes = nextUpg.apply(gs)
                          patch({
                            ...changes,
                            shipModules: { ...(gs.shipModules ?? { moteur: 0, soute: 0, tourelle: 0, scanner: 0 }), [key]: current + 1 },
                          })
                        }}
                      >
                        INSTALLER
                      </button>
                    </div>
                    {!ok && gs.credits < nextUpg.cost && (
                      <div className="t-xs t-red mt4">Crédits insuffisants</div>
                    )}
                  </div>
                )}
                {maxed && <div className="t-xs mt4" style={{ color: def.color }}>Toutes les améliorations installées.</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Améliorations legacy — uniquement stations de ravitaillement */}
      {isFuelStation && (
        <div className="px-box">
          <div className="t-xs t-dim mb8">AMÉLIORATIONS VAISSEAU</div>
          <div className="t-xs t-dim mb8" style={{ color: 'var(--cyan)' }}>
            Cargo disponible : {Object.entries(gs.cargo).map(([k, v]) => `${k} ×${v}`).join(' · ') || 'aucun'}
          </div>
          <div className="col gap4">
            {SHIP_UPGRADES.map(upg => {
              const ok = upg.available(gs)
              const maxed =
                (upg.id.startsWith('hull') && gs.shipMaxHp >= 200) ||
                (upg.id.startsWith('tank') && gs.maxFuel >= 20) ||
                (upg.id === 'implant' && gs.playerMaxHp >= 250)
              const itemLabel = upg.items.map(i => `${i.qty}× ${i.name}`).join(', ')
              return (
                <button key={upg.id} className="px-btn" disabled={!ok || maxed}
                  onClick={() => upg.apply(gs)}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="t-xs">{upg.label} — {upg.desc}</span>
                    <span className="t-gold t-xs">
                      {maxed ? 'MAX' : `${upg.cost.toLocaleString()} cr + ${itemLabel}`}
                    </span>
                  </div>
                  {!maxed && !ok && (
                    <div className="t-xs t-red mt2">
                      {gs.credits < upg.cost ? 'Crédits insuffisants. ' : ''}
                      {upg.items.some(i => (gs.cargo[i.name] ?? 0) < i.qty)
                        ? `Manque : ${upg.items.filter(i => (gs.cargo[i.name] ?? 0) < i.qty).map(i => `${i.name}`).join(', ')}`
                        : ''}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

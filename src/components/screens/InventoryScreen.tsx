import { useGameStore } from '../../store/gameStore'

export function InventoryScreen() {
  const gs          = useGameStore(s => s.gs!)
  const goTo        = useGameStore(s => s.goTo)
  const equipWeapon = useGameStore(s => s.equipWeapon)
  const unequipWeapon = useGameStore(s => s.unequipWeapon)
  const equipArmor  = useGameStore(s => s.equipArmor)
  const unequipArmor  = useGameStore(s => s.unequipArmor)

  return (
    <div className="layout">
      <div className="row" style={{ alignItems: 'center', gap: '16px' }}>
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => goTo('station-hub')}>← RETOUR</button>
        <div className="t-sm t-bright">INVENTAIRE</div>
      </div>

      <div className="grid2">
        {/* Weapons */}
        <div className="col">
          <div className="t-xs t-dim">ARMES ({gs.weapons.length})</div>
          {gs.weapons.length === 0 && <div className="px-box t-dim t-xs">Aucune arme.</div>}
          {gs.weapons.map((w, i) => {
            const equipped = gs.equippedWeapon?.name === w.name
            return (
              <div key={i} className={`px-box ${equipped ? 'px-box--act' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="t-sm t-orange">{w.name}</span>
                  <span className="tag tag--dim t-xs">Tier {w.tier}</span>
                </div>
                <div className="t-xs t-dim">
                  Dégâts : <span className="t-bright">{w.damageMin}–{w.damageMax}</span> · Crit : {w.critChance}%
                </div>
                {w.effect !== 'none' && (
                  <div className="t-xs t-purple" style={{ color: 'var(--purple)' }}>
                    {w.effectDesc} ({w.effectChance}%)
                  </div>
                )}
                {w.selfDmgChance > 0 && (
                  <div className="t-xs t-red">⚠ Self-dmg {w.selfDmgChance}% ({w.selfDmgMax/2}–{w.selfDmgMax})</div>
                )}
                <button
                  className={`px-btn px-btn--sm ${equipped ? 'px-btn--danger' : 'px-btn--primary'}`}
                  onClick={() => equipped ? unequipWeapon() : equipWeapon(i)}
                >
                  {equipped ? 'DÉSÉQUIPER' : 'ÉQUIPER'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Armors */}
        <div className="col">
          <div className="t-xs t-dim">ARMURES ({gs.armors.length})</div>
          {gs.armors.length === 0 && <div className="px-box t-dim t-xs">Aucune armure.</div>}
          {gs.armors.map((a, i) => {
            const equipped = gs.equippedArmor?.name === a.name
            return (
              <div key={i} className={`px-box ${equipped ? 'px-box--act' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="t-sm" style={{ color: 'var(--blue)' }}>{a.name}</span>
                  <span className="tag tag--dim t-xs">Tier {a.tier}</span>
                </div>
                <div className="t-xs t-dim">
                  Défense : <span className="t-bright">{a.defense}%</span>
                  {a.hpBonus > 0 && <> · PV +{a.hpBonus}</>}
                </div>
                {a.effect !== 'none' && (
                  <div className="t-xs t-cyan">
                    {a.effect === 'regen'        && `Régén +${a.effectValue} PV/tour`}
                    {a.effect === 'thorns'       && `Épines ${a.effectValue}% renvoyés`}
                    {a.effect === 'immunity'     && 'Absorbe 1 coup fatal'}
                    {a.effect === 'staminaBoost' && `Stamina +${a.effectValue}/tour`}
                  </div>
                )}
                <div className="t-xs t-dim">{a.description}</div>
                <button
                  className={`px-btn px-btn--sm ${equipped ? 'px-btn--danger' : 'px-btn--primary'}`}
                  onClick={() => equipped ? unequipArmor() : equipArmor(i)}
                >
                  {equipped ? 'DÉSÉQUIPER' : 'ÉQUIPER'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

import { useGameStore } from '../../store/gameStore'
import { playEquip } from '../../engine/sfx'

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

      {/* Cargo */}
      {Object.keys(gs.cargo).length > 0 && (
        <div className="px-box" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="t-xs t-dim">SOUTE ({Object.keys(gs.cargo).length} type{Object.keys(gs.cargo).length > 1 ? 's' : ''})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {Object.entries(gs.cargo).map(([item, qty]) => (
              <div key={item} className="tag t-xs" style={{ borderColor: item === 'Passager' ? 'var(--gold)' : 'var(--cyan)', color: item === 'Passager' ? 'var(--gold)' : 'var(--cyan)' }}>
                {item} ×{qty}
              </div>
            ))}
          </div>
        </div>
      )}
      {Object.keys(gs.cargo).length === 0 && (
        <div className="px-box t-dim t-xs">Soute vide.</div>
      )}

      <div className="grid2">
        {/* Weapons */}
        <div className="col list-zebra">
          <div className="t-xs t-dim">ARMES ({gs.weapons.length})</div>
          {gs.weapons.length === 0 && <div className="px-box t-dim t-xs">Aucune arme.</div>}
          {gs.weapons.map((w, i) => {
            const equipped = gs.equippedWeapon?.name === w.name
            return (
              <div key={i} className={`px-box ${equipped ? 'px-box--act' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="t-sm t-orange">{w.name}</span>
                  <span className={`tag tier-${w.tier} t-xs`}>Tier {w.tier}</span>
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
                  onClick={() => { if (!equipped) playEquip(); equipped ? unequipWeapon() : equipWeapon(i) }}
                >
                  {equipped ? 'DÉSÉQUIPER' : 'ÉQUIPER'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Armors */}
        <div className="col list-zebra">
          <div className="t-xs t-dim">ARMURES ({gs.armors.length})</div>
          {gs.armors.length === 0 && <div className="px-box t-dim t-xs">Aucune armure.</div>}
          {gs.armors.map((a, i) => {
            const equipped = gs.equippedArmor?.name === a.name
            return (
              <div key={i} className={`px-box ${equipped ? 'px-box--act' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="t-sm" style={{ color: 'var(--blue)' }}>{a.name}</span>
                  <span className={`tag tier-${a.tier} t-xs`} style={{ color: 'var(--blue)', borderColor: '#224488' }}>Tier {a.tier}</span>
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
                  onClick={() => { if (!equipped) playEquip(); equipped ? unequipArmor() : equipArmor(i) }}
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

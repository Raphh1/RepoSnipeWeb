import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'

export function CombatResultScreen() {
  const gs         = useGameStore(s => s.gs!)
  const goTo       = useGameStore(s => s.goTo)
  const patch      = useGameStore(s => s.patch)
  const obj        = useGameStore(s => s.objectivePopup)
  const dismissObj = useGameStore(s => s.dismissObjectivePopup)

  const reward = gs.combatRewardData
  const enemy  = gs.combatEnemy

  // 4% de chance de montrer l'option cannibal si l'ennemi est humanoïde
  const [canShowCannibalism]   = useState(() => !gs.moralTags.includes('cannibal') && Math.random() < 0.04)
  const [cannibalPopup, setCannibalPopup] = useState(false)

  function gouter() {
    const isFirstTime = !gs.moralTags.includes('cannibal')
    patch({
      moralTags: [...gs.moralTags.filter(t => t !== 'cannibal'), 'cannibal'],
      folieLevel: Math.max(0, (gs.folieLevel ?? 0) - 50),
      folieConsumedThisTurn: true,
    })
    if (isFirstTime) setCannibalPopup(true)
    else goTo('station-hub')
  }

  // Popup cannibalisme première fois
  if (cannibalPopup) {
    return (
      <div className="layout scanlines" style={{ justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', width: '100%' }}>
          <div className="t-center mb8" style={{ color: 'var(--red)', fontSize: '9px', letterSpacing: '4px' }}>
            ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓
          </div>
          <div className="px-box" style={{ borderColor: 'var(--red)', textAlign: 'center', padding: '28px' }}>
            <div style={{ fontSize: '16px', color: 'var(--red)', letterSpacing: '3px', marginBottom: '20px' }}>
              CANNIBALE
            </div>
            <div className="t-xs t-dim" style={{ lineHeight: '2.4', marginBottom: '20px' }}>
              Tu as goûté.
              <br />
              Il y a une ligne que personne ne franchit deux fois de la même façon.
              <br />
              Tu viens de la franchir.
              <br /><br />
              Ton corps s'en souvient.
              <br />
              Ta tête aussi — différemment.
              <br /><br />
              <span style={{ color: 'var(--orange)' }}>Ta vie ne sera plus jamais la même.</span>
            </div>
            <div className="t-xs t-dim" style={{ fontStyle: 'italic' }}>
              La faim reviendra. Elle revient toujours.
            </div>
          </div>
          <div className="t-center mb8 mt8" style={{ color: 'var(--red)', fontSize: '9px', letterSpacing: '4px' }}>
            ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓
          </div>
          <button className="px-btn px-btn--danger" onClick={() => goTo('station-hub')}>
            Continuer →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="layout scanlines" style={{ justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>

        <div className="t-xs t-dim t-center mb8">— VICTOIRE —</div>

        {enemy && (
          <div className="px-box mb8" style={{ borderColor: 'var(--gold)' }}>
            <div className="t-sm t-gold mb4">
              {reward?.isBossKill ? '★ BOSS ÉLIMINÉ' : '◆ ENNEMI VAINCU'}
            </div>
            <div className="t-xs t-bright">{enemy.name}</div>
            <div className="t-xs t-dim mt4" style={{ lineHeight: '1.8' }}>{enemy.description}</div>
          </div>
        )}

        {reward && (
          <div className="px-box mb8">
            <div className="t-xs t-dim mb8">BUTIN</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="t-xs t-dim">Crédits récupérés</span>
                <span className="t-xs t-gold">+{reward.loot.toLocaleString()} cr</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="t-xs t-dim">Réputation</span>
                <span className="t-xs t-green">+10</span>
              </div>
              {reward.weaponName && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="t-xs t-dim">Arme trouvée</span>
                  <span className="t-xs t-orange">{reward.weaponName}</span>
                </div>
              )}
              {reward.armorName && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="t-xs t-dim">Armure trouvée</span>
                  <span className="t-xs" style={{ color: 'var(--blue)' }}>{reward.armorName}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="px-box mb8">
          <div className="t-xs t-dim mb8">ÉTAT ACTUEL</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="t-xs t-dim">PV</span>
              <span className="t-xs" style={{ color: gs.playerHp < gs.playerMaxHp * 0.3 ? 'var(--red)' : 'var(--green)' }}>
                {gs.playerHp}/{gs.playerMaxHp}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="t-xs t-dim">Crédits</span>
              <span className="t-xs t-gold">{gs.credits.toLocaleString()} cr</span>
            </div>
            {(gs.folieLevel ?? 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="t-xs t-dim">Folie</span>
                <span className="t-xs" style={{ color: (gs.folieLevel ?? 0) >= 80 ? 'var(--red)' : 'var(--orange)' }}>
                  {gs.folieLevel}/100
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Option cannibalisme — 15% de chance */}
        {canShowCannibalism && enemy && (
          <div className="px-box mb8" style={{ borderColor: 'var(--red)', background: '#100505' }}>
            <div className="t-xs t-dim mb4" style={{ fontStyle: 'italic' }}>
              {enemy.name} est à terre. Quelque chose en toi — quelque chose de très ancien — remarque que tu as faim.
            </div>
            <button className="px-btn px-btn--danger" onClick={gouter} style={{ fontSize: '8px' }}>
              Goûter {enemy.name}
            </button>
          </div>
        )}

        {/* Déjà cannibale — option de consommer toujours disponible */}
        {gs.moralTags.includes('cannibal') && enemy && !gs.folieConsumedThisTurn && (
          <div className="px-box mb8" style={{ borderColor: 'var(--orange)', background: '#100805' }}>
            <div className="t-xs" style={{ color: 'var(--orange)', marginBottom: '8px' }}>
              La faim est là. {enemy.name} est là.
            </div>
            <button className="px-btn" onClick={gouter} style={{ borderColor: 'var(--orange)', color: 'var(--orange)' }}>
              Consommer (−50 folie)
            </button>
          </div>
        )}

        {obj && (
          <div className="px-box mb8" style={{ borderColor: 'var(--gold)' }}>
            <div className="t-xs t-gold">{obj}</div>
            <button className="px-btn px-btn--sm mt8" style={{ width: 'auto' }} onClick={dismissObj}>OK</button>
          </div>
        )}

        {gs.isImprisoned
          ? <button className="px-btn" style={{ borderColor: 'var(--red)', color: 'var(--red)' }} onClick={() => goTo('prison')}>
              Retour en cellule →
            </button>
          : <button className="px-btn px-btn--primary" onClick={() => goTo('station-hub')}>
              Continuer →
            </button>
        }
      </div>
    </div>
  )
}

import { useGameStore } from '../../store/gameStore'

export function CombatOutcomeScreen() {
  const gs   = useGameStore(s => s.gs!)
  const goTo = useGameStore(s => s.goTo)
  const patch = useGameStore(s => s.patch)

  const outcome  = gs.pendingCombatOutcome
  const enemy    = gs.combatEnemy

  if (outcome === 'stunned') {
    const creditsLost = parseInt(gs.pendingMessage ?? '0', 10)
    return (
      <div className="layout scanlines" style={{ justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', width: '100%' }}>

          <div className="t-center mb8" style={{ letterSpacing: '6px', color: 'var(--red)', fontSize: '9px' }}>
            ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■
          </div>

          <div className="px-box" style={{ borderColor: 'var(--red)', textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '20px', color: 'var(--red)', letterSpacing: '4px', marginBottom: '16px' }}>
              ASSOMMÉ
            </div>
            <div className="t-xs t-dim" style={{ lineHeight: '2.2', marginBottom: '16px' }}>
              {enemy
                ? `${enemy.name} t'a mis hors combat.`
                : "Tu t'effondres."}
              <br />
              Quand tu reprends conscience, le couloir est vide.
              <br />
              Tes poches aussi.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {creditsLost > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="t-xs t-dim">Crédits volés</span>
                  <span className="t-xs t-red">−{creditsLost.toLocaleString()} cr</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="t-xs t-dim">PV restants</span>
                <span className="t-xs t-red">{gs.playerHp}/{gs.playerMaxHp}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="t-xs t-dim">Crédits restants</span>
                <span className="t-xs t-gold">{gs.credits.toLocaleString()} cr</span>
              </div>
            </div>
            <div className="t-xs t-dim" style={{ fontStyle: 'italic', marginBottom: '20px' }}>
              Tu te relèves. Lentement. Le vide t'a épargné — cette fois.
            </div>
          </div>

          <div className="t-center mb8" style={{ letterSpacing: '6px', color: 'var(--red)', fontSize: '9px' }}>
            ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■
          </div>

          <button className="px-btn" onClick={() => {
            patch({ pendingCombatOutcome: null, pendingMessage: null })
            goTo(gs.isImprisoned ? 'prison' : 'station-hub')
          }}>
            {gs.isImprisoned ? 'Retour en cellule →' : 'Se relever et continuer →'}
          </button>
        </div>
      </div>
    )
  }

  if (outcome === 'captured') {
    let captureInfo: { creditsFine?: number; weaponName?: string | null; cargoLost?: number } = {}
    try { captureInfo = JSON.parse(gs.pendingMessage ?? '{}') } catch {}

    return (
      <div className="layout scanlines" style={{ justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', width: '100%' }}>

          <div className="t-center mb8" style={{ letterSpacing: '6px', color: 'var(--orange)', fontSize: '9px' }}>
            ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓
          </div>

          <div className="px-box" style={{ borderColor: 'var(--orange)', textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '20px', color: 'var(--orange)', letterSpacing: '4px', marginBottom: '16px' }}>
              CAPTURÉ
            </div>
            <div className="t-xs t-dim" style={{ lineHeight: '2.2', marginBottom: '16px' }}>
              {enemy ? `${enemy.name} ne te laisse pas le choix.` : "Ils ne te laissent pas le choix."}
              <br />
              Menottes. Sol froid. Fouille complète.
              <br />
              Tout ce qu'ils trouvent leur appartient maintenant.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {(captureInfo.creditsFine ?? 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="t-xs t-dim">Crédits saisis (25%)</span>
                  <span className="t-xs t-red">−{(captureInfo.creditsFine ?? 0).toLocaleString()} cr</span>
                </div>
              )}
              {(captureInfo.cargoLost ?? 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="t-xs t-dim">Cargaison confisquée</span>
                  <span className="t-xs t-red">{captureInfo.cargoLost} type{(captureInfo.cargoLost ?? 0) > 1 ? 's' : ''} de cargo</span>
                </div>
              )}
              {captureInfo.weaponName && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="t-xs t-dim">Arme saisie</span>
                  <span className="t-xs t-orange">{captureInfo.weaponName}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="t-xs t-dim">Peine initiale</span>
                <span className="t-xs t-orange">3 jours</span>
              </div>
            </div>

            <div className="t-xs t-dim" style={{ fontStyle: 'italic', marginBottom: '8px' }}>
              Tu peux purger ta peine, payer la caution, soudoyer un garde, ou tenter une évasion.
            </div>
            <div className="t-xs t-red" style={{ fontStyle: 'italic', marginBottom: '20px' }}>
              Purger sa peine a un coût. La liberté aussi.
            </div>
          </div>

          <div className="t-center mb8" style={{ letterSpacing: '6px', color: 'var(--orange)', fontSize: '9px' }}>
            ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓
          </div>

          <button className="px-btn px-btn--danger" onClick={() => {
            patch({ pendingCombatOutcome: null, pendingMessage: null })
            goTo('prison')
          }}>
            Vers la cellule →
          </button>
        </div>
      </div>
    )
  }

  if (outcome === 'fled') {
    return (
      <div className="layout scanlines" style={{ justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', width: '100%' }}>

          <div className="t-center mb8" style={{ letterSpacing: '6px', color: 'var(--cyan)', fontSize: '9px' }}>
            ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░
          </div>

          <div className="px-box" style={{ borderColor: 'var(--cyan)', textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '20px', color: 'var(--cyan)', letterSpacing: '4px', marginBottom: '16px' }}>
              FUITE
            </div>
            <div className="t-xs t-dim" style={{ lineHeight: '2.2', marginBottom: '16px' }}>
              Tu cours. Tu ne te retournes pas.
              <br />
              {enemy ? `${enemy.name} crie derrière toi. Tu n'entends plus rien.` : "L'adrénaline fait le reste."}
              <br />
              Ton vaisseau démarre avant que les portes soient fermées.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="t-xs t-dim">Carburant</span>
                <span className="t-xs t-cyan">{gs.fuel} restant</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="t-xs t-dim">Fuites au compteur</span>
                <span className="t-xs t-dim">{gs.combatsFled}</span>
              </div>
            </div>
            <div className="t-xs t-dim" style={{ fontStyle: 'italic', marginBottom: '20px' }}>
              Survivre, c'est aussi une forme de victoire.
            </div>
          </div>

          <div className="t-center mb8" style={{ letterSpacing: '6px', color: 'var(--cyan)', fontSize: '9px' }}>
            ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░ ░
          </div>

          <button className="px-btn" onClick={() => {
            patch({ pendingCombatOutcome: null })
            goTo(gs.isImprisoned ? 'prison' : 'station-hub')
          }}>
            {gs.isImprisoned ? 'Retour en cellule →' : 'Continuer →'}
          </button>
        </div>
      </div>
    )
  }

  // Fallback
  return (
    <div className="layout" style={{ justifyContent: 'center', minHeight: '100vh' }}>
      <button className="px-btn" onClick={() => goTo('station-hub')}>← Retour</button>
    </div>
  )
}

import { useGameStore } from '../../store/gameStore'
import { FACTIONS } from '../../engine/factions'

// Conditions pour rejoindre chaque faction : station + NPC à avoir rencontré
const FACTION_REQUIREMENTS: Record<string, { station: string; npcId: string; npcName: string }> = {
  faucons:  { station: 'Arc Ouest Apocalypse',  npcId: 'cael',   npcName: 'Cael' },
  emporium: { station: 'Emporium Requiem',       npcId: 'pistis', npcName: 'Pistis' },
  gardiens: { station: 'La Citadelle Écarlate',  npcId: 'myrra',  npcName: 'Myrra' },
  culte:    { station: 'Le Purgatoire',          npcId: 'neva',   npcName: 'Neva' },
}

export function FactionsScreen() {
  const gs         = useGameStore(s => s.gs!)
  const goTo       = useGameStore(s => s.goTo)
  const joinFaction= useGameStore(s => s.joinFaction)
  const patch      = useGameStore(s => s.patch)

  function doMission(factionId: string) {
    const rewards: Record<string, { cr: number; rep: number }> = {
      faucons:  { cr: 1500, rep: 30 },
      emporium: { cr: 2000, rep: 20 },
      gardiens: { cr: 1000, rep: 50 },
      culte:    { cr: 800,  rep: 40 },
    }
    const r = rewards[factionId] ?? { cr: 1000, rep: 20 }
    patch({ credits: gs.credits + r.cr, reputation: gs.reputation + r.rep, factionMissions: gs.factionMissions + 1 })
  }

  return (
    <div className="layout">
      <div className="row" style={{ alignItems: 'center', gap: '16px' }}>
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => goTo('station-hub')}>← RETOUR</button>
        <div className="t-sm t-bright">FACTIONS</div>
        {gs.faction !== 'none' && (
          <div className="tag tag--gold">MEMBRE : {gs.faction.toUpperCase()}</div>
        )}
      </div>

      {gs.faction !== 'none' && (
        <div className="px-box px-box--act">
          <div className="t-sm t-gold mb4">Mission de faction disponible</div>
          <div className="t-xs t-dim mb8">
            Missions accomplies : {gs.factionMissions} · Réputation : {gs.reputation}
          </div>
          <button className="px-btn px-btn--primary" onClick={() => doMission(gs.faction)}>
            Accomplir une mission (+crédits, +rép)
          </button>
        </div>
      )}

      <div className="col gap4">
        {FACTIONS.map(f => {
          const isMember  = gs.faction === f.id
          const canJoin   = gs.faction === 'none'
          const req       = FACTION_REQUIREMENTS[f.id]
          const atStation = req && gs.currentStation === req.station
          const metNpc    = req && gs.npcsMet.includes(req.npcName)
          const eligible  = atStation && metNpc

          return (
            <div key={f.id} className={`px-box ${isMember ? 'px-box--act' : ''}`}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div className="t-sm t-bright" style={{ color: f.color }}>{f.name}</div>
                {isMember && <div className="tag tag--gold t-xs">MEMBRE</div>}
              </div>
              <div className="t-xs t-dim mb8" style={{ lineHeight: '2' }}>{f.description}</div>
              <div className="t-xs t-cyan mb8">{f.bonus}</div>

              {!isMember && canJoin && req && (
                <div className="col gap4">
                  {/* Conditions affichées */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '6px' }}>
                    <div className="t-xs" style={{ color: atStation ? 'var(--green)' : 'var(--text-dim)' }}>
                      {atStation ? '✓' : '○'} Station : {req.station}
                    </div>
                    <div className="t-xs" style={{ color: metNpc ? 'var(--green)' : 'var(--text-dim)' }}>
                      {metNpc ? '✓' : '○'} Rencontrer {req.npcName} sur place
                    </div>
                  </div>
                  <button className="px-btn px-btn--sm" disabled={!eligible}
                    onClick={() => joinFaction(f.id)}
                    style={{ color: eligible ? f.color : undefined }}>
                    {eligible ? `Rejoindre ${f.name}` : 'Conditions non remplies'}
                  </button>
                </div>
              )}

              {!isMember && !canJoin && (
                <div className="t-xs t-dim">Tu es déjà membre d'une autre faction.</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

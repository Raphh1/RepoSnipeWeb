import { useGameStore } from '../../store/gameStore'
import { FACTIONS } from '../../engine/factions'
import {
  getFactionRep, getRepLevel,
  REP_LABELS, REP_COLORS, FACTION_BONUS_DESC,
  type FactionKey,
} from '../../engine/factionRep'
import { generateFactionMission } from '../../engine/quests'
import { canJoinFactionThisRun } from '../../data/runModifiers'

const FACTION_REQUIREMENTS: Record<string, { station: string; npcId: string; npcName: string }> = {
  faucons:  { station: 'Arc Ouest Apocalypse',  npcId: 'cael',   npcName: 'Cael' },
  emporium: { station: 'Emporium Requiem',       npcId: 'pistis', npcName: 'Pistis' },
  gardiens: { station: 'La Citadelle Écarlate',  npcId: 'myrra',  npcName: 'Myrra' },
  culte:    { station: 'Le Purgatoire',          npcId: 'neva',   npcName: 'Neva' },
}

function RepBar({ rep }: { rep: number }) {
  const level = getRepLevel(rep)
  const color = REP_COLORS[level]
  // −100 à +100 → 0% à 100% sur la barre
  const pct = (rep + 100) / 200 * 100
  return (
    <div style={{ position: 'relative', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px',
        background: 'var(--border-hi)', zIndex: 1,
      }} />
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${pct}%`, background: color, borderRadius: '3px',
        transition: 'width 0.3s ease',
      }} />
    </div>
  )
}

export function FactionsScreen() {
  const gs          = useGameStore(s => s.gs!)
  const goTo        = useGameStore(s => s.goTo)
  const joinFaction = useGameStore(s => s.joinFaction)
  const addQuest    = useGameStore(s => s.addQuest)

  const actionsLeft = 3 - gs.actionsToday
  const activeFactionQuest = gs.activeQuests.find(q => q.factionId === gs.faction)

  return (
    <div className="layout">
      <div className="row" style={{ alignItems: 'center', gap: '16px' }}>
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => goTo('station-hub')}>← RETOUR</button>
        <div className="t-sm t-bright">FACTIONS</div>
        {gs.faction !== 'none' && (
          <div className="tag tag--gold">MEMBRE : {gs.faction.toUpperCase()}</div>
        )}
      </div>

      {/* Mission de faction */}
      {gs.faction !== 'none' && (
        <div className="px-box" style={{ borderColor: 'var(--gold)', background: 'rgba(255,200,0,0.05)' }}>
          <div className="row" style={{ alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div className="t-sm t-gold">Missions de faction</div>
            <div className="t-xs t-dim" style={{ marginLeft: 'auto' }}>
              {gs.factionMissions} missions accomplies
            </div>
          </div>
          {activeFactionQuest ? (
            <div className="col gap4">
              <div className="t-xs t-dim mb4">Mission en cours :</div>
              <div className="px-box" style={{ padding: '8px 12px', borderColor: 'var(--cyan)' }}>
                <div className="t-xs t-bright mb2">{activeFactionQuest.title}</div>
                <div className="t-xs t-dim" style={{ lineHeight: '1.8' }}>{activeFactionQuest.description}</div>
                <div className="t-xs t-gold mt4">→ Destination : {activeFactionQuest.targetStation}</div>
                <div className="t-xs t-dim mt2">Récompense : {activeFactionQuest.creditReward.toLocaleString()} cr · +{activeFactionQuest.repReward} rép · +20 rép faction</div>
              </div>
              <div className="t-xs t-dim">Complète la mission pour prendre la suivante.</div>
            </div>
          ) : (
            <div className="col gap4">
              <div className="t-xs t-dim" style={{ lineHeight: '2' }}>
                Les missions de faction exigent de voyager et de se battre pour la cause. Chaque mission accomplie augmente ton rang et affaiblit les factions rivales.
              </div>
              <button
                className="px-btn px-btn--primary"
                disabled={actionsLeft <= 0 || gs.activeQuests.length >= 5}
                onClick={() => {
                  const mission = generateFactionMission(gs, gs.faction)
                  if (mission) addQuest(mission)
                }}
              >
                {actionsLeft <= 0 ? 'Plus d\'actions aujourd\'hui' : gs.activeQuests.length >= 5 ? 'Journal de quêtes plein (5/5)' : '▶ Prendre une mission de faction'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Réputation générale + Standing Piliers */}
      <div className="px-box mb4" style={{ borderColor: 'var(--cyan)' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div className="t-xs t-dim" style={{ letterSpacing: '2px' }}>RÉPUTATION GLOBALE</div>
          <div className="t-xs" style={{ color: gs.reputation >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {gs.reputation > 0 ? '+' : ''}{gs.reputation}
          </div>
        </div>
        <div style={{ background: 'var(--border)', height: '4px', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
          <div style={{
            width: `${Math.min(100, Math.max(0, (gs.reputation + 200) / 400 * 100))}%`,
            height: '100%', background: gs.reputation >= 0 ? 'var(--cyan)' : 'var(--red)',
          }} />
        </div>

        <div className="t-xs t-dim mb6" style={{ letterSpacing: '2px' }}>STANDING PILIERS NEXUS</div>
        <div className="col gap4">
          {(Object.entries(gs.pillarStanding ?? {}) as [string, number][]).map(([npc, val]) => {
            const color = val >= 60 ? 'var(--gold)' : val >= 30 ? 'var(--green)' : val >= 10 ? 'var(--cyan)' : 'var(--dim)'
            const label = val >= 60 ? 'ALLIÉ' : val >= 30 ? 'RESPECTÉ' : val >= 10 ? 'CONNU' : 'INCONNU'
            return (
              <div key={npc}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span className="t-xs t-bright" style={{ textTransform: 'capitalize' }}>{npc}</span>
                  <span className="t-xs" style={{ color }}>{label} · {val}/100</span>
                </div>
                <div style={{ background: 'var(--border)', height: '3px', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, val)}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cartes factions avec barres de réputation */}
      <div className="col gap4">
        {FACTIONS.map(f => {
          const fKey     = f.id as FactionKey
          const rep      = getFactionRep(gs, fKey)
          const level    = getRepLevel(rep)
          const color    = REP_COLORS[level]
          const isMember = gs.faction === f.id
          const canJoin  = gs.faction === 'none' && canJoinFactionThisRun(gs)
          const req      = FACTION_REQUIREMENTS[f.id]
          const atStation= req && gs.currentStation === req.station
          const metNpc   = req && gs.npcsMet.includes(req.npcName)
          const eligible = atStation && metNpc

          // Bonus actifs selon niveau de rep
          const activeBonus = level === 'exaltee' ? FACTION_BONUS_DESC[fKey][2]
            : level === 'honoree' ? FACTION_BONUS_DESC[fKey][1]
            : level === 'amicale' ? FACTION_BONUS_DESC[fKey][0]
            : null

          return (
            <div key={f.id} className={`px-box ${isMember ? 'px-box--act' : ''}`}
              style={{ borderColor: isMember ? f.color : level === 'hostile' ? 'var(--red)' : undefined }}>

              {/* En-tête */}
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div className="t-sm t-bright" style={{ color: f.color }}>{f.name}</div>
                <div className="row" style={{ gap: '6px', alignItems: 'center' }}>
                  {isMember && <div className="tag tag--gold t-xs">MEMBRE</div>}
                  <div className="tag t-xs" style={{ borderColor: color, color }}>{REP_LABELS[level]}</div>
                  <div className="t-xs" style={{ color, minWidth: '32px', textAlign: 'right' }}>{rep > 0 ? '+' : ''}{rep}</div>
                </div>
              </div>

              {/* Barre de réputation */}
              <RepBar rep={rep} />
              <div className="row" style={{ justifyContent: 'space-between', marginTop: '2px', marginBottom: '10px' }}>
                <span className="t-xs" style={{ color: 'var(--red)', fontSize: '8px' }}>HOSTILE</span>
                <span className="t-xs" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>NEUTRE</span>
                <span className="t-xs" style={{ color: 'var(--gold)', fontSize: '8px' }}>EXALTÉE</span>
              </div>

              {/* Description */}
              <div className="t-xs t-dim mb8" style={{ lineHeight: '2' }}>{f.description}</div>

              {/* Bonus actif */}
              {activeBonus ? (
                <div className="t-xs mb8" style={{ color }}>★ Bonus actif : {activeBonus}</div>
              ) : (
                <div className="t-xs t-dim mb8">
                  Prochains bonus : {FACTION_BONUS_DESC[fKey].join(' → ')}
                </div>
              )}

              {/* Rejoindre */}
              {!isMember && canJoin && req && (
                <div className="col gap4">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div className="t-xs" style={{ color: atStation ? 'var(--green)' : 'var(--text-dim)' }}>
                      {atStation ? '✓' : '○'} Station : {req.station}
                    </div>
                    <div className="t-xs" style={{ color: metNpc ? 'var(--green)' : 'var(--text-dim)' }}>
                      {metNpc ? '✓' : '○'} Rencontrer {req.npcName} sur place
                    </div>
                  </div>
                  <button className="px-btn px-btn--sm" disabled={!eligible}
                    style={{ color: eligible ? f.color : undefined, borderColor: eligible ? f.color : undefined }}
                    onClick={() => joinFaction(f.id)}>
                    {eligible ? `Rejoindre ${f.name}` : 'Conditions non remplies'}
                  </button>
                </div>
              )}
              {!isMember && gs.faction !== 'none' && (
                <div className="t-xs t-dim">Déjà membre d'une autre faction.</div>
              )}
              {!isMember && gs.faction === 'none' && !canJoinFactionThisRun(gs) && (
                <div className="t-xs t-red">⚠ Modificateur PARIA actif — aucune faction ne veut de toi cette run.</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { FACTIONS } from '../../engine/factions'
import {
  getFactionRep, getRepLevel,
  REP_LABELS, REP_COLORS, FACTION_BONUS_DESC,
  type FactionKey,
} from '../../engine/factionRep'
import { generateFactionMission } from '../../engine/quests'
import { canJoinFactionThisRun } from '../../data/runModifiers'
import type { GameState } from '../../types'

const FACTION_REQUIREMENTS: Record<string, { station: string; npcId: string; npcName: string }> = {
  faucons:  { station: 'Arc Ouest Apocalypse',  npcId: 'cael',   npcName: 'Cael' },
  emporium: { station: 'Emporium Requiem',       npcId: 'pistis', npcName: 'Pistis' },
  gardiens: { station: 'La Citadelle Écarlate',  npcId: 'myrra',  npcName: 'Myrra' },
  culte:    { station: 'Le Purgatoire',          npcId: 'neva',   npcName: 'Neva' },
}

const MORAL_TAG_LABELS: Record<string, { label: string; color: string }> = {
  cannibal:     { label: 'Cannibale',     color: 'var(--red)' },
  trafiquant:   { label: 'Trafiquant',    color: 'var(--orange)' },
  délateur:     { label: 'Délateur',      color: '#aa6633' },
  opportuniste: { label: 'Opportuniste',  color: 'var(--dim)' },
  pacifiste:    { label: 'Pacifiste',     color: 'var(--green)' },
  sanguinaire:  { label: 'Sanguinaire',   color: 'var(--red)' },
  héros:        { label: 'Héros',         color: 'var(--gold)' },
  mercenaire:   { label: 'Mercenaire',    color: 'var(--cyan)' },
}

type Tab = 'general' | 'pillars' | 'factions'
const TABS: { key: Tab; label: string }[] = [
  { key: 'general',  label: 'GÉNÉRALE' },
  { key: 'pillars',  label: 'PILIERS' },
  { key: 'factions', label: 'FACTIONS' },
]

function RepBar({ rep }: { rep: number }) {
  const level = getRepLevel(rep)
  const color = REP_COLORS[level]
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

function GeneralTab({ gs }: { gs: GameState }) {
  if (!gs) return null
  const repColor = gs.reputation >= 0 ? 'var(--green)' : 'var(--red)'
  const tags = gs.moralTags ?? []

  return (
    <>
      <div className="px-box" style={{ borderColor: 'var(--cyan)' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div className="t-xs t-dim" style={{ letterSpacing: '2px' }}>RÉPUTATION GLOBALE</div>
          <div className="t-sm" style={{ color: repColor }}>
            {gs.reputation > 0 ? '+' : ''}{gs.reputation}
          </div>
        </div>
        <div style={{ background: 'var(--border)', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{
            width: `${Math.min(100, Math.max(0, (gs.reputation + 200) / 400 * 100))}%`,
            height: '100%', background: repColor,
            transition: 'width 0.3s',
          }} />
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="t-xs" style={{ color: 'var(--red)', fontSize: '8px' }}>-200</span>
          <span className="t-xs t-dim" style={{ fontSize: '8px' }}>0</span>
          <span className="t-xs" style={{ color: 'var(--green)', fontSize: '8px' }}>+200</span>
        </div>
      </div>

      <div className="px-box">
        <div className="t-xs t-dim mb6" style={{ letterSpacing: '2px' }}>TRAITS MORAUX</div>
        {tags.length === 0 ? (
          <div className="t-xs t-dim">Aucun trait acquis. Tes choix définiront ta réputation.</div>
        ) : (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {tags.map(tag => {
              const info = MORAL_TAG_LABELS[tag] ?? { label: tag, color: 'var(--dim)' }
              return (
                <span key={tag} className="tag t-xs" style={{ borderColor: info.color, color: info.color }}>
                  {info.label}
                </span>
              )
            })}
          </div>
        )}
      </div>

      <div className="px-box">
        <div className="t-xs t-dim mb6" style={{ letterSpacing: '2px' }}>STATISTIQUES</div>
        <div className="col gap4">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="t-xs t-dim">Jour</span>
            <span className="t-xs t-bright">{gs.day}</span>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="t-xs t-dim">Boss vaincus</span>
            <span className="t-xs t-bright">{gs.bossesDefeated ?? 0}</span>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="t-xs t-dim">Stations visitées</span>
            <span className="t-xs t-bright">{gs.visitedStations?.length ?? 0}</span>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="t-xs t-dim">NPC rencontrés</span>
            <span className="t-xs t-bright">{gs.npcsMet?.length ?? 0}</span>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="t-xs t-dim">Quêtes complétées</span>
            <span className="t-xs t-bright">{gs.completedQuestIds?.length ?? 0}</span>
          </div>
          {gs.faction !== 'none' && (
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="t-xs t-dim">Missions de faction</span>
              <span className="t-xs t-gold">{gs.factionMissions}</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function PillarsTab({ gs }: { gs: GameState }) {
  if (!gs) return null
  const standing = gs.pillarStanding ?? {} as Record<string, number>
  const angered = gs.nexusAngered ?? []

  const PILLAR_NAMES: Record<string, string> = {
    cesarion: 'Cesarion',
    raphazarus: 'Raphazarus',
    eliotis: 'Eliotis',
    maxance: 'Maxance',
    alanossa: 'Alanossa',
    scotty: 'Scotty',
  }

  return (
    <>
      {(Object.entries(standing) as [string, number][]).map(([key, val]) => {
        const isAngered = angered.includes(key)
        const color = isAngered ? 'var(--red)' : val >= 60 ? 'var(--gold)' : val >= 30 ? 'var(--green)' : val >= 10 ? 'var(--cyan)' : 'var(--dim)'
        const label = isAngered ? 'ENNEMI' : val >= 60 ? 'ALLIÉ' : val >= 30 ? 'RESPECTÉ' : val >= 10 ? 'CONNU' : 'INCONNU'
        const name = PILLAR_NAMES[key] ?? key

        return (
          <div key={key} className="px-box" style={{ borderColor: color }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div className="t-sm t-bright">{name}</div>
              <div className="row" style={{ gap: '6px', alignItems: 'center' }}>
                <span className="tag t-xs" style={{ borderColor: color, color }}>{label}</span>
                <span className="t-xs" style={{ color }}>{val}/100</span>
              </div>
            </div>
            <div style={{ background: 'var(--border)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Math.max(0, val))}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
            </div>
            {isAngered && (
              <div className="t-xs mt4" style={{ color: 'var(--red)' }}>Ce détenteur est devenu ton ennemi permanent.</div>
            )}
          </div>
        )
      })}
      <div className="px-box" style={{ borderColor: 'var(--border)' }}>
        <div className="t-xs t-dim" style={{ lineHeight: '1.8' }}>
          Le standing détermine les actions disponibles pour obtenir les fragments du Nexus.
          Un standing élevé débloque des approches diplomatiques. Un standing bas force des approches plus risquées.
        </div>
      </div>
    </>
  )
}

function FactionsTab({ gs }: { gs: GameState }) {
  if (!gs) return null
  const goTo        = useGameStore(s => s.goTo)
  const joinFaction = useGameStore(s => s.joinFaction)
  const addQuest    = useGameStore(s => s.addQuest)
  const actionsLeft = 3 - gs.actionsToday
  const activeFactionQuest = gs.activeQuests.find(q => q.factionId === gs.faction)

  return (
    <>
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

          const activeBonus = level === 'exaltee' ? FACTION_BONUS_DESC[fKey][2]
            : level === 'honoree' ? FACTION_BONUS_DESC[fKey][1]
            : level === 'amicale' ? FACTION_BONUS_DESC[fKey][0]
            : null

          return (
            <div key={f.id} className={`px-box ${isMember ? 'px-box--act' : ''}`}
              style={{ borderColor: isMember ? f.color : level === 'hostile' ? 'var(--red)' : undefined }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div className="t-sm t-bright" style={{ color: f.color }}>{f.name}</div>
                <div className="row" style={{ gap: '6px', alignItems: 'center' }}>
                  {isMember && <div className="tag tag--gold t-xs">MEMBRE</div>}
                  <div className="tag t-xs" style={{ borderColor: color, color }}>{REP_LABELS[level]}</div>
                  <div className="t-xs" style={{ color, minWidth: '32px', textAlign: 'right' }}>{rep > 0 ? '+' : ''}{rep}</div>
                </div>
              </div>
              <RepBar rep={rep} />
              <div className="row" style={{ justifyContent: 'space-between', marginTop: '2px', marginBottom: '10px' }}>
                <span className="t-xs" style={{ color: 'var(--red)', fontSize: '8px' }}>HOSTILE</span>
                <span className="t-xs" style={{ color: 'var(--text-dim)', fontSize: '8px' }}>NEUTRE</span>
                <span className="t-xs" style={{ color: 'var(--gold)', fontSize: '8px' }}>EXALTÉE</span>
              </div>
              <div className="t-xs t-dim mb8" style={{ lineHeight: '2' }}>{f.description}</div>
              {activeBonus ? (
                <div className="t-xs mb8" style={{ color }}>★ Bonus actif : {activeBonus}</div>
              ) : (
                <div className="t-xs t-dim mb8">
                  Prochains bonus : {FACTION_BONUS_DESC[fKey].join(' → ')}
                </div>
              )}
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
    </>
  )
}

export function FactionsScreen() {
  const gs   = useGameStore(s => s.gs!)
  const goTo = useGameStore(s => s.goTo)
  const [tab, setTab] = useState<Tab>('general')

  return (
    <div className="layout">
      <div className="row" style={{ alignItems: 'center', gap: '16px' }}>
        <button className="px-btn px-btn--sm" style={{ width: 'auto' }} onClick={() => goTo('station-hub')}>← RETOUR</button>
        <div className="t-sm t-bright">RÉPUTATION</div>
        {gs.faction !== 'none' && (
          <div className="tag tag--gold t-xs">FACTION : {gs.faction.toUpperCase()}</div>
        )}
      </div>

      <div className="row" style={{ gap: '4px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
        {TABS.map(t => (
          <button key={t.key} className="px-btn px-btn--sm"
            style={{
              width: 'auto', flex: 1,
              borderColor: tab === t.key ? 'var(--cyan)' : 'var(--border)',
              color: tab === t.key ? 'var(--cyan)' : 'var(--dim)',
              background: tab === t.key ? 'rgba(0,255,255,0.05)' : 'transparent',
            }}
            onClick={() => setTab(t.key)}>
            <span className="t-xs">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'general'  && <GeneralTab gs={gs} />}
      {tab === 'pillars'  && <PillarsTab gs={gs} />}
      {tab === 'factions' && <FactionsTab gs={gs} />}
    </div>
  )
}

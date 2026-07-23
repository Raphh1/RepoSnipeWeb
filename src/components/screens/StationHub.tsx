import { useState } from 'react'
import { TypewriterText } from '../ui/TypewriterText'
import type { GameState } from '../../types'
import { useGameStore } from '../../store/gameStore'
import { StatusBar } from '../ui/StatusBar'
import { getStation } from '../../data/stations'
import { getEnemyForDepth, scaleEnemy, TIER_BOSS, TIER_MID } from '../../data/enemies'
import { rollExplorationEvent, rollWanderEvent, type WanderEvent } from '../../engine/exploration'
import type { ExploreResult } from '../../engine/exploration'
import { generateQuest, generateNpcQuest, getGossip } from '../../engine/quests'
import { getMajorQuestForNpc } from '../../engine/majorQuests'
import { getStationEvents, type StationEvent } from '../../engine/stationEvents'
import { NAMED_NPCS, getNpcReaction, getNpcGreeting, recordMeeting } from '../../engine/npcTracker'
import { getAmbiance } from '../../engine/jsonEventLoader'
import { getEnemyByTier } from '../../data/enemies'
import { checkArcTriggers } from '../../engine/narrativeArcs'
import { OBJECTIVES } from '../../engine/objectives'
import { StopTheBar, type StopResult } from '../minigames/StopTheBar'
import { CardGame } from '../minigames/CardGame'

const DANGER_LABEL = ['◆ SÉCURISÉE', '◆ RISQUÉE', '◆ DANGEREUSE', '◆ ZONE DE GUERRE']
const DANGER_CLS   = ['danger-0', 'danger-1', 'danger-2', 'danger-3']

type HubMode = 'menu' | 'explore-result' | 'wander-result' | 'quest-offer' | 'station-event' | 'npc-encounter' | 'lockpick-game' | 'card-game'

export function StationHub() {
  const gs           = useGameStore(s => s.gs!)
  const goTo         = useGameStore(s => s.goTo)
  const startCombat  = useGameStore(s => s.startCombat)
  const rest         = useGameStore(s => s.rest)
  const patch        = useGameStore(s => s.patch)
  const addQuest     = useGameStore(s => s.addQuest)
  const spendAction  = useGameStore(s => s.spendAction)
  const travelMsg    = useGameStore(s => s.travelEventMessage)
  const objPopup     = useGameStore(s => s.objectivePopup)
  const questPopup   = useGameStore(s => s.questCompletionMsg)
  const dismissTravel    = useGameStore(s => s.dismissTravelEvent)
  const dismissObj       = useGameStore(s => s.dismissObjectivePopup)
  const dismissQuest     = useGameStore(s => s.dismissQuestCompletion)
  const advanceMajorQuests = useGameStore(s => s.advanceMajorQuests)

  const [mode, setMode]             = useState<HubMode>('menu')
  const [exploreResult, setExploreResult] = useState<ExploreResult | null>(null)
  const [wanderEvent, setWanderEvent]     = useState<WanderEvent | null>(null)
  const [questOffer, setQuestOffer]       = useState<ReturnType<typeof generateQuest>>(null)
  const [stationEvent, setStationEvent]   = useState<StationEvent | null>(null)
  const [resultMsg, setResultMsg]         = useState<string | null>(null)
  const [npcDialogResult, setNpcDialogResult] = useState<string | null>(null)
  const [miniGameReward, setMiniGameReward] = useState<Partial<GameState>>({})

  const station      = getStation(gs.currentStation)
  const outcome      = gs.pendingCombatOutcome
  const stationEvts  = getStationEvents(gs)
  const localNpc     = NAMED_NPCS.find(n => n.station === gs.currentStation)
  const availableArcs = checkArcTriggers(gs)
  const hasArcs      = gs.activeArcs.length > 0 || availableArcs.length > 0 || gs.completedArcs.length > 0
  const newArcsCount = availableArcs.filter(a => !gs.activeArcs.find(b => b.id === a.id)).length

  // ── ACTIONS ──────────────────────────────────────────────────────────────

  function explore() {
    spendAction()
    const depth = gs.zoneDepth + 1
    const result = rollExplorationEvent({ ...gs, zoneDepth: depth })
    if (result.type === 'combat') {
      patch({ zoneDepth: depth, lastExploreWasCombat: true })
      startCombat(scaleEnemy(getEnemyForDepth(depth, gs.day), Math.max(0, depth - 1)))
      return
    }
    if (result.type === 'boss') {
      patch({ zoneDepth: depth, lastExploreWasCombat: true })
      startCombat(TIER_BOSS[Math.floor(Math.random() * TIER_BOSS.length)])
      return
    }
    patch({ zoneDepth: depth, lastExploreWasCombat: false })
    setExploreResult(result); setResultMsg(null); setMode('explore-result')
  }

  function wander() {
    spendAction()
    setWanderEvent(rollWanderEvent(gs)); setResultMsg(null); setMode('wander-result')
  }

  function lookForQuest() {
    spendAction()
    setQuestOffer(generateQuest(gs)); setMode('quest-offer')
  }

  function openStationEvent(ev: StationEvent) {
    spendAction()
    setStationEvent(ev); setResultMsg(null); setMode('station-event')
  }

  function applyExploreChoice(choice: { label: string; result: (g: GameState) => { gs: Partial<GameState>; message: string; minigame?: 'lockpick'; minigameReward?: Partial<GameState> } }) {
    const result = choice.result(gs)
    if (result.minigame === 'lockpick') {
      setMiniGameReward(result.minigameReward ?? {})
      setMode('lockpick-game')
      return
    }
    patch(result.gs)
    setResultMsg(result.message)
  }

  // ── MODES ────────────────────────────────────────────────────────────────

  if (mode === 'explore-result' && exploreResult) {
    return (
      <div className="layout">
        <div className="t-xs t-dim t-center">— EXPLORATION — Profondeur {gs.zoneDepth} —</div>

        {'description' in exploreResult && (
          <div className="px-box">
            <div className="t-sm t-gold mb8">
              <TypewriterText text={exploreResult.description} speed={14} />
            </div>

            {exploreResult.type === 'loot' && !resultMsg && (
              <button className="px-btn px-btn--primary" onClick={() => {
                patch({ credits: gs.credits + (exploreResult as Extract<ExploreResult, {type:'loot'}> ).credits })
                setResultMsg(`+${(exploreResult as Extract<ExploreResult, {type:'loot'}>).credits} cr récupérés.`)
              }}>Ramasser (+{(exploreResult as Extract<ExploreResult, {type:'loot'}>).credits} cr)</button>
            )}

            {exploreResult.type === 'item' && !resultMsg && (
              <button className="px-btn px-btn--primary" onClick={() => {
                const e = exploreResult as Extract<ExploreResult, {type:'item'}>
                patch({ cargo: { ...gs.cargo, [e.item]: (gs.cargo[e.item] ?? 0) + e.qty } })
                setResultMsg(`+${e.qty}x ${e.item}`)
              }}>Prendre ({(exploreResult as Extract<ExploreResult, {type:'item'}>).item})</button>
            )}

            {exploreResult.type === 'fuel' && !resultMsg && (
              <button className="px-btn px-btn--primary" onClick={() => {
                patch({ fuel: Math.min(gs.maxFuel, gs.fuel + (exploreResult as Extract<ExploreResult, {type:'fuel'}>).amount) })
                setResultMsg(`+${(exploreResult as Extract<ExploreResult, {type:'fuel'}>).amount} carburant.`)
              }}>Prendre le carburant</button>
            )}

            {'choices' in exploreResult && exploreResult.choices && !resultMsg && (
              <div className="col gap4 mt8">
                {(exploreResult as Extract<ExploreResult, {type:'event'}>).choices
                  .filter((c: {available?:(g:GameState)=>boolean}) => !c.available || c.available(gs))
                  .map((c: {label:string; result:(g:GameState)=>{gs:Partial<GameState>;message:string}}, i: number) => (
                    <button key={i} className="px-btn" onClick={() => applyExploreChoice(c)}>{c.label}</button>
                  ))
                }
              </div>
            )}

            {resultMsg && <div className="t-green t-sm mt8">{resultMsg}</div>}
          </div>
        )}

        <div className="row gap4 mt8">
          <button className="px-btn" style={{ flex: 1 }} onClick={explore}>
            Continuer (profondeur {gs.zoneDepth + 1})
          </button>
          <button className="px-btn px-btn--danger" style={{ flex: 1 }} onClick={() => { patch({ zoneDepth: 0 }); setMode('menu') }}>
            Retourner à la station
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'wander-result' && wanderEvent) {
    return (
      <div className="layout">
        <div className="t-xs t-dim t-center">— EN STATION —</div>
        <div className="px-box">
          <div className="t-sm t-gold mb4">{wanderEvent.title}</div>
          <div className="t-xs mb8" style={{ lineHeight: '2.2' }}>
            <TypewriterText text={wanderEvent.description} speed={16} />
          </div>
          {resultMsg
            ? <div className="t-xs mt4" style={{ color: 'var(--green)', lineHeight: '2' }}>{resultMsg}</div>
            : <div className="col gap4">
                {wanderEvent.choices
                  .filter(c => !c.available || c.available(gs))
                  .map((c, i) => (
                    <button key={i} className="px-btn" onClick={() => {
                      const res = c.result(gs)
                      if (res.type === 'combat') {
                        const tier = station.danger >= 3 ? 3 : station.danger >= 2 ? 2 : 1
                        startCombat(getEnemyByTier(tier as 1|2|3))
                        return
                      }
                      if (res.gs) patch(res.gs as Partial<GameState>)
                      if (res.quest && gs.activeQuests.length < 5) addQuest(res.quest)
                      setResultMsg(res.message + (res.quest ? `\n[QUÊTE AJOUTÉE : ${res.quest.title}]` : ''))
                    }}>{c.label}</button>
                  ))}
              </div>
          }
        </div>
        <div className="row gap4">
          {resultMsg && (
            <button className="px-btn px-btn--primary" style={{ flex: 1 }} onClick={() => {
              setWanderEvent(rollWanderEvent(gs))
              setResultMsg(null)
              spendAction()
            }}>
              Traîner encore
            </button>
          )}
          <button className="px-btn" style={{ flex: 1 }} onClick={() => { setResultMsg(null); setMode('menu') }}>
            ← Retour au hub
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'station-event' && stationEvent) {
    return (
      <div className="layout">
        <div className="t-xs t-dim t-center">— {station.name.toUpperCase()} —</div>
        <div className="px-box px-box--hi">
          <div className="t-sm t-bright mb8">
            <TypewriterText text={stationEvent.description} speed={16} />
          </div>
          {resultMsg
            ? <div className={`t-sm ${resultMsg.includes('-') ? 't-red' : 't-green'}`}>{resultMsg}</div>
            : <div className="col gap4">
                {stationEvent.choices
                  .filter(c => !c.available || c.available(gs))
                  .map((c, i) => (
                    <button key={i} className="px-btn" onClick={() => {
                      if (c.label === 'Participer (combat)') {
                        startCombat(TIER_MID[Math.floor(Math.random() * TIER_MID.length)])
                        return
                      }
                      const res = c.result(gs)
                      if (Object.keys(res.gs).length > 0) patch(res.gs as Partial<GameState>)
                      if (res.message) setResultMsg(res.message)
                      else setMode('menu')
                    }}>{c.label}</button>
                  ))}
              </div>
          }
        </div>
        <button className="px-btn" onClick={() => setMode('menu')}>← Retour</button>
      </div>
    )
  }

  if (mode === 'lockpick-game') {
    return (
      <StopTheBar difficulty={2} label="CROCHETAGE DU BOÎTIER" onResult={(result: StopResult) => {
        if (result === 'perfect') {
          const bonus = Math.floor((miniGameReward.credits ?? 0) * 0.2)
          patch({ ...miniGameReward, credits: (miniGameReward.credits ?? 0) + bonus })
          setResultMsg(`Crochetage parfait ! +${((miniGameReward.credits ?? 0) + bonus).toLocaleString()} cr (bonus précision)`)
        } else if (result === 'good') {
          patch(miniGameReward)
          setResultMsg(`Réussi. +${(miniGameReward.credits ?? 0).toLocaleString()} cr`)
        } else {
          setResultMsg('Raté. L\'alarme se déclenche. Tu pars vite.')
          patch({ reputation: gs.reputation - 5 })
        }
        setMode('explore-result')
      }} />
    )
  }

  if (mode === 'card-game') {
    return (
      <CardGame onResult={(creditsWon) => {
        if (creditsWon > 0) {
          patch({ credits: gs.credits + creditsWon })
        }
        setNpcDialogResult(creditsWon > 0 ? `Tu repars avec ${creditsWon.toLocaleString()} cr de gain.` : 'La chance n\'était pas de ton côté ce soir.')
        setMode('npc-encounter')
      }} />
    )
  }

  if (mode === 'quest-offer') {
    return (
      <div className="layout">
        <div className="t-xs t-dim t-center">— CHERCHER DU TRAVAIL —</div>
        <div className="px-box">
          <div className="t-xs t-dim mb4">RUMEUR DU COIN</div>
          <div className="t-xs" style={{ lineHeight: '2', fontStyle: 'italic' }}>{getGossip(gs.currentStation)}</div>
        </div>
        {questOffer ? (
          <div className="px-box px-box--hi">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: '8px' }}>
              <div className="t-sm t-bright">{questOffer.title}</div>
              <div className={`tag t-xs ${questOffer.type === 'kill' ? 'tag--red' : questOffer.type === 'delivery' ? 'tag--cyan' : 'tag--dim'}`}>
                {questOffer.type.toUpperCase()}
              </div>
            </div>
            <div className="t-xs" style={{ lineHeight: '2' }}>{questOffer.description}</div>
            <div className="t-xs t-gold mt8">Récompense : {questOffer.creditReward.toLocaleString()} cr · +{questOffer.repReward} rép</div>
            <div className="row gap4 mt8">
              <button className="px-btn px-btn--primary" style={{ flex: 1 }}
                onClick={() => { addQuest(questOffer); setMode('menu') }}
                disabled={gs.activeQuests.length >= 5}>
                Accepter
              </button>
              <button className="px-btn px-btn--danger" style={{ flex: 1 }} onClick={() => setMode('menu')}>Refuser</button>
            </div>
          </div>
        ) : (
          <div className="px-box t-dim t-xs">Aucun travail disponible ici pour l'instant.</div>
        )}
        <button className="px-btn" onClick={() => setMode('menu')}>← Retour</button>
      </div>
    )
  }

  // ── NPC ENCOUNTER ─────────────────────────────────────────────────────────

  if (mode === 'npc-encounter' && localNpc) {
    const npcState = gs.knownNpcs[localNpc.id]
    const reaction = npcState ? getNpcReaction(npcState, gs) : 'neutral'
    const greeting = npcState ? getNpcGreeting(npcState, reaction) : `${localNpc.name} te regarde arriver.`
    const timesMet = npcState?.timesMet ?? 0

    const REACTION_COLOR: Record<string, string> = {
      ally: 'var(--gold)', friendly: 'var(--green)', warm: 'var(--cyan)',
      neutral: 'var(--text-dim)', cold: 'var(--orange)', hostile: 'var(--red)',
    }
    const REACTION_LABEL: Record<string, string> = {
      ally: '★ Allié', friendly: '◆ Amical', warm: '◆ Chaleureux',
      neutral: '◆ Neutre', cold: '◆ Froid', hostile: '⚠ Hostile',
    }

    function openNpc() {
      const updated = recordMeeting(
        npcState ?? { id: localNpc!.id, name: localNpc!.name, station: localNpc!.station, firstMetDay: gs.day, timesMet: 0, repDelta: 0, isAlly: false, isEnemy: false, tags: [] },
      )
      const names = new Set(gs.npcsMet)
      names.add(localNpc!.name)
      patch({ knownNpcs: { ...gs.knownNpcs, [localNpc!.id]: updated }, npcsMet: Array.from(names) })
      advanceMajorQuests()
    }

    function handleTalk() {
      openNpc()
      const rep = npcState?.repDelta ?? 0
      const lines: Record<string, string[]> = {
        Ferrailleur:       ["Il te montre une pièce rare. +30cr.", "Il grogne, mais t'indique une cache de matériel."],
        Marchande:         ["Elle glisse une info commerciale. +40cr.", "Elle te fait un prix sur le prochain achat. +50cr."],
        Vétéran:           ["Il raconte une bataille. Tu apprends quelque chose d'utile. +5 rép.", "Il te montre une technique. Ta prochaine attaque sera meilleure."],
        Hackeuse:          ["Elle te transfère des crédits volés. +60cr.", "Elle a effacé ton casier quelque part. +10 rép."],
        Dealer:            ["Il te propose quelque chose. Tu refuses poliment.", "Il a l'air méfiant. Il regarde ailleurs."],
        Survivante:        ["Elle te raconte comment elle a tenu ici. +8 rép.", "Elle a un objet qu'elle veut céder. +1 Médicaments."],
        Courtier:          ["Il te donne un tuyau sur le marché. +50cr.", "Il mentionne un acheteur intéressant quelque part."],
        Organisateur:      ["Il te parle d'un pari gagnant. +70cr.", "Il te reconnaît. +5 rép."],
        Commandante:       ["Elle te juge du regard. +5 rép si tu tiens.", "Elle a un travail pour toi — peut-être."],
        Chercheuse:        ["Elle t'explique sa découverte. Fascinant. +10 rép.", "Elle a besoin d'aide pour quelque chose."],
        'Pilote retraité': ["Il se souvient de routes que personne ne connaît. +40cr.", "Il rit de tes aventures. +5 rép."],
        Forgeron:          ["Il te montre une arme qu'il fabrique. Impressionnant.", "Il fait des prix pour les réguliers. +30cr."],
        Fermier:           ["Il partage sa récolte. +1 Nourriture fraîche.", "Calme et honnête. +5 rép."],
        Lieutenant:        ["Il ne dit rien. Mais son regard dit tout.", "Il te laisse passer. Pour l'instant."],
      }
      const pool = lines[localNpc!.role] ?? ["Il hocha la tête. Pas grand chose de plus."]
      const base = pool[timesMet % pool.length]
      let gsUpdate: Partial<GameState> = {}
      let msg = base
      if (rep >= 20) {
        gsUpdate = { credits: gs.credits + 50, reputation: gs.reputation + 3 }
        msg += ' (ami : +50cr, +3 rép)'
      } else if (rep <= -20) {
        msg = `${localNpc!.name} tourne la tête. La conversation est terminée.`
      } else {
        gsUpdate = { reputation: gs.reputation + 2 }
        msg += ' (+2 rép)'
      }
      patch(gsUpdate)
      setNpcDialogResult(msg)
    }

    function handleProvoke() {
      openNpc()
      const updated = { ...(npcState ?? { id: localNpc!.id, name: localNpc!.name, station: localNpc!.station, firstMetDay: gs.day, timesMet: 1, repDelta: 0, isAlly: false, isEnemy: false, tags: [] }), isEnemy: true, repDelta: -50 }
      patch({ knownNpcs: { ...gs.knownNpcs, [localNpc!.id]: updated }, reputation: gs.reputation - 5 })
      const enemy = {
        name: localNpc!.name,
        maxHp: 40 + Math.floor(gs.day * 2),
        damageMin: 8, damageMax: 18,
        lootMin: 150, lootMax: 500,
        description: `${localNpc!.role}. Tu l'as cherché.`,
        captureChance: 15, killChance: 15, isBoss: false, role: 'normal' as const,
      }
      startCombat(enemy)
    }

    return (
      <div className="layout">
        <div className="t-xs t-dim t-center">— {localNpc.name.toUpperCase()} —</div>

        <div className="px-box px-box--hi" style={{ borderColor: 'var(--cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <div className="t-sm t-bright">{localNpc.name}</div>
              <div className="t-xs t-dim">{localNpc.role}</div>
            </div>
            <div className="t-xs" style={{ color: REACTION_COLOR[reaction] }}>{REACTION_LABEL[reaction]}</div>
          </div>
          <div className="t-xs t-dim mb8" style={{ lineHeight: '1.8' }}>
            <TypewriterText text={localNpc.description} speed={14} />
          </div>
          {timesMet > 0 && <div className="t-xs t-dim mb8">{timesMet} rencontre{timesMet > 1 ? 's' : ''} · Jour {npcState?.firstMetDay ?? gs.day}</div>}
          <div className="t-xs t-cyan" style={{ fontStyle: 'italic' }}>
            "<TypewriterText text={greeting} speed={28} />"
          </div>
        </div>

        {npcDialogResult ? (
          <div className="px-box" style={{ borderColor: 'var(--green)' }}>
            <div className="t-xs" style={{ lineHeight: '2' }}>
              <TypewriterText text={npcDialogResult} speed={14} />
            </div>
          </div>
        ) : (
          <div className="col gap4">
            {reaction !== 'hostile' && (
              <button className="px-btn" onClick={handleTalk}>
                Parler / Échanger des infos
              </button>
            )}
            {reaction !== 'hostile' && gs.activeQuests.length < 5 && (
              <button className="px-btn" style={{ color: 'var(--gold)' }} onClick={() => {
                openNpc()
                const q = generateNpcQuest(gs, localNpc!.name, localNpc!.role, localNpc!.station)
                if (q) {
                  addQuest(q)
                  setNpcDialogResult(`${localNpc!.name} te confie une mission : "${q.title}". Destination : ${q.targetStation}.`)
                } else {
                  setNpcDialogResult(`${localNpc!.name} n'a rien de concret pour toi en ce moment.`)
                }
              }}>
                ★ Demander du travail
              </button>
            )}
            {reaction !== 'hostile' && (() => {
              const mq = getMajorQuestForNpc(gs, localNpc!.name)
              if (!mq) return null
              return (
                <button className="px-btn" style={{ color: 'var(--purple)', borderColor: 'var(--purple)' }} onClick={() => {
                  openNpc()
                  patch({ majorQuests: [...gs.majorQuests, { ...mq }] })
                  setNpcDialogResult(`[MISSION MAJEURE] ${mq.title}\n\n${mq.lore}\n\nPremière étape : ${mq.stages[0].objective}`)
                }}>
                  ★★ Mission importante — {mq.title}
                </button>
              )
            })()}
            {localNpc.role === 'Organisateur' && reaction !== 'hostile' && (
              <button className="px-btn px-btn--primary" onClick={() => {
                openNpc()
                setMode('card-game')
              }}>
                ★ Jouer aux cartes (peut gagner des crédits)
              </button>
            )}
            {reaction === 'ally' && (
              <button className="px-btn px-btn--green" onClick={() => {
                openNpc()
                patch({ playerHp: Math.min(gs.playerMaxHp, gs.playerHp + 20), reputation: gs.reputation + 5 })
                setNpcDialogResult(`${localNpc.name} t'aide. +20 PV, +5 rép.`)
              }}>
                Demander de l'aide (allié)
              </button>
            )}
            {reaction === 'hostile' && (
              <button className="px-btn px-btn--danger" onClick={handleProvoke}>
                ⚔ Se battre — il t'en veut
              </button>
            )}
            {reaction !== 'hostile' && reaction !== 'ally' && (
              <button className="px-btn t-dim" style={{ opacity: 0.6 }} onClick={handleProvoke}>
                Provoquer (déclenche un combat, -5 rép)
              </button>
            )}
          </div>
        )}

        <button className="px-btn" onClick={() => { setMode('menu'); setNpcDialogResult(null) }}>← Retour</button>
      </div>
    )
  }

  // ── MENU PRINCIPAL ────────────────────────────────────────────────────────

  return (
    <div className="layout scanlines">
      <StatusBar gs={gs} />

      {/* Popups voyage */}
      {travelMsg && (
        <div className="px-box" style={{ borderColor: 'var(--cyan)' }}>
          <div className="t-xs t-cyan mb4">ÉVÉNEMENT DE VOYAGE</div>
          <div className="t-xs">{travelMsg}</div>
          <button className="px-btn px-btn--sm mt8" style={{ width: 'auto' }} onClick={dismissTravel}>OK</button>
        </div>
      )}
      {objPopup && (
        <div className="px-box" style={{ borderColor: 'var(--gold)' }}>
          <div className="t-xs t-gold">{objPopup}</div>
          <button className="px-btn px-btn--sm mt8" style={{ width: 'auto' }} onClick={dismissObj}>OK</button>
        </div>
      )}
      {questPopup && (
        <div className="px-box" style={{ borderColor: 'var(--green)', background: '#0a1a0a' }}>
          <div className="t-xs t-green mb8">QUÊTE ACCOMPLIE</div>
          {questPopup.split('\n\n').map((block, i) => {
            const lines = block.split('\n')
            return (
              <div key={i} style={{ marginBottom: i < questPopup.split('\n\n').length - 1 ? '10px' : 0 }}>
                <div className="t-xs t-bright">{lines[1]}</div>
                <div className="t-xs t-green mt4">{lines[2]}</div>
              </div>
            )
          })}
          <button className="px-btn px-btn--sm mt8" style={{ width: 'auto', borderColor: 'var(--green)', color: 'var(--green)' }} onClick={dismissQuest}>Continuer</button>
        </div>
      )}
      {newArcsCount > 0 && (
        <div className="px-box" style={{ borderColor: 'var(--purple)' }}>
          <div className="t-xs t-purple mb4">NOUVEAU ARC NARRATIF — {availableArcs.slice(0, newArcsCount).map(a => a.title).join(', ')}</div>
          <button className="px-btn px-btn--sm" style={{ width: 'auto', color: 'var(--purple)' }}
            onClick={() => goTo('narrative-arcs')}>Voir les arcs →</button>
        </div>
      )}

      {/* Outcomes combat */}
      {outcome === 'victory'  && <div className="px-box t-gold t-sm t-center">★ VICTOIRE — Butin collecté !</div>}
      {outcome === 'fled'     && <div className="px-box t-dim t-sm t-center">Tu t'es échappé.</div>}
      {outcome === 'stunned'  && <div className="px-box t-red t-sm t-center">Assommé et dévalisé. Tu te relèves.</div>}
      {outcome === 'captured' && <div className="px-box t-red t-sm t-center">Capturé. Direction la prison.</div>}

      {gs.isImprisoned && (
        <div className="px-box" style={{ borderColor: 'var(--red)' }}>
          <div className="t-xs t-red mb4">⚠ EMPRISONNÉ</div>
          <button className="px-btn px-btn--danger px-btn--sm" onClick={() => goTo('prison')}>Gérer l'emprisonnement</button>
        </div>
      )}

      {/* Station info */}
      <div className="px-box">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div className="t-lg t-bright">{station.name}</div>
          <div className={`tag t-xs ${DANGER_CLS[station.danger]}`}>{DANGER_LABEL[station.danger]}</div>
        </div>
        <div className="t-xs t-dim" style={{ lineHeight: '2' }}>{station.description}</div>
        {(() => { const a = getAmbiance(gs.currentStation); return a ? (
          <div className="t-xs t-dim mt8" style={{ lineHeight: '2.2', fontStyle: 'italic', borderLeft: '2px solid var(--border)', paddingLeft: '10px' }}>
            {a}
          </div>
        ) : null })()}
        <div className="t-xs t-dim mt4">
          Jour {gs.day} · {gs.actionsToday}/3 actions · <span style={{ color: gs.class.color }}>{gs.class.name}</span>
          {gs.equippedWeapon && <> · <span className="t-orange">{gs.equippedWeapon.name}</span></>}
          {gs.equippedArmor  && <> · <span style={{ color: 'var(--blue)' }}>{gs.equippedArmor.name}</span></>}
        </div>
      </div>

      {/* Grille de menus */}
      <div className="grid2">
        <div className="px-box col" style={{ gap: '8px' }}>
          <div className="t-xs t-dim mb4">◆ NAVIGATION</div>
          <button className="px-btn" onClick={() => goTo('travel')} disabled={gs.fuel <= 0}>
            Voyager{gs.fuel <= 0 ? ' (plus de carburant)' : ` — ${gs.fuel} carburant`}
          </button>
          <button className="px-btn" onClick={() => goTo('market')}>
            Marché
          </button>
          <button className="px-btn" onClick={() => goTo('ship-workshop')}>
            Atelier vaisseau — {gs.shipHp}/{gs.shipMaxHp} PV
          </button>
        </div>

        <div className="px-box col" style={{ gap: '8px' }}>
          <div className="t-xs t-dim mb4">◆ ACTIONS ({gs.actionsToday}/3)</div>
          <button className="px-btn" onClick={explore}>
            Explorer la zone (profondeur {gs.zoneDepth + 1})
          </button>
          <button className="px-btn" onClick={wander}>
            Traîner dans le coin
          </button>
          <button className="px-btn" onClick={lookForQuest}>
            Chercher du travail / Rumeurs
          </button>
          <button className="px-btn" onClick={() => {
            spendAction()
            const weights: [number, number, number][] = [
              [70, 22, 8],
              [45, 40, 15],
              [20, 50, 30],
              [8,  32, 60],
            ]
            const [w1, w2, w3] = weights[station.danger]
            const roll = Math.random() * 100
            const tier: 1|2|3 = roll < w1 ? 1 : roll < w1 + w2 ? 2 : 3
            startCombat(scaleEnemy(getEnemyByTier(tier), Math.floor(gs.day / 15)))
          }}>
            Chercher la bagarre
          </button>
        </div>
      </div>

      {/* Événements spéciaux de station */}
      {stationEvts.length > 0 && (
        <div className="px-box" style={{ borderColor: 'var(--gold)' }}>
          <div className="t-xs t-gold mb8">ACTIVITÉS LOCALES</div>
          <div className="col gap4">
            {stationEvts.map(ev => (
              <button key={ev.id} className="px-btn" onClick={() => openStationEvent(ev)}>
                {ev.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PNJ local */}
      {localNpc && (
        <div className="px-box" style={{ borderColor: 'var(--cyan)' }}>
          <div className="t-xs t-cyan mb4">PNJ LOCAL</div>
          <div className="t-sm t-bright mb4">{localNpc.name}
            <span className="t-xs t-dim" style={{ marginLeft: '8px' }}>{localNpc.role}</span>
          </div>
          <div className="t-xs t-dim mb8">{localNpc.description}</div>
          <button className="px-btn px-btn--sm" onClick={() => {
            setNpcDialogResult(null)
            setMode('npc-encounter')
          }}>
            › Parler à {localNpc.name}
          </button>
        </div>
      )}

      <div className="grid2">
        <div className="col">
          <div className="t-xs t-dim">INVENTAIRE</div>
          <button className="px-btn" onClick={() => goTo('inventory')} disabled={gs.weapons.length === 0 && gs.armors.length === 0}>
            Armes & Armures ({gs.weapons.length} / {gs.armors.length})
          </button>
          {(gs.cargo['Médicaments'] ?? 0) > 0 && gs.playerHp < gs.playerMaxHp && (
            <button className="px-btn px-btn--green" onClick={() => {
              const qty = (gs.cargo['Médicaments'] ?? 1) - 1
              const nc = { ...gs.cargo, 'Médicaments': qty }
              if (qty <= 0) delete (nc as Record<string,number>)['Médicaments']
              patch({ playerHp: Math.min(gs.playerMaxHp, gs.playerHp + 30), cargo: nc })
            }}>
              Se soigner +30 PV (Médicaments ×{gs.cargo['Médicaments']})
            </button>
          )}
        </div>

        <div className="col">
          <div className="t-xs t-dim">PROGRESSION</div>
          <button className="px-btn" onClick={() => goTo('quests')} disabled={gs.activeQuests.length === 0}>
            Quêtes ({gs.activeQuests.length})
          </button>
          <button className="px-btn" onClick={() => goTo('objectives')}>
            Objectifs ({gs.completedObjectives.length}/{OBJECTIVES.length})
          </button>
          <button className="px-btn" onClick={() => goTo('factions')}>
            Factions {gs.faction !== 'none' ? `[${gs.faction.toUpperCase()}]` : ''}
          </button>
          {hasArcs && (
            <button className="px-btn" style={{ color: 'var(--purple)' }} onClick={() => goTo('narrative-arcs')}>
              Arcs narratifs ({gs.activeArcs.length} actifs{newArcsCount > 0 ? `, +${newArcsCount} nouveau` : ''})
            </button>
          )}
        </div>
      </div>

      {/* Résumé cargo */}
      {Object.keys(gs.cargo).length > 0 && (
        <div className="px-box">
          <div className="t-xs t-dim mb4">CARGAISON</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {Object.entries(gs.cargo).map(([item, qty]) => (
              <div key={item} className="tag tag--dim">{item} ×{qty}</div>
            ))}
          </div>
        </div>
      )}

      {/* Résumé quêtes */}
      {gs.activeQuests.length > 0 && (
        <div className="px-box">
          <div className="t-xs t-dim mb4">QUÊTES EN COURS</div>
          {gs.activeQuests.slice(0, 3).map(q => (
            <div key={q.id} className="t-xs" style={{ lineHeight: '1.8' }}>
              <span className={`tag t-xs ${q.type === 'kill' ? 'tag--red' : 'tag--cyan'}`} style={{ marginRight: '8px' }}>
                {q.type.toUpperCase()}
              </span>
              {q.title} → <span className="t-dim">{q.targetStation}</span>
              {q.targetStation === gs.currentStation && <span className="t-gold"> ← ICI</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { TypewriterText } from '../../ui/TypewriterText'
import type { GameState } from '../../../types'
import type { NamedNpcDef as NamedNpc } from '../../../engine/npcTracker'
import { getNpcReaction, getNpcGreeting, recordMeeting, getNpcService } from '../../../engine/npcTracker'
import { getMajorQuestForNpc } from '../../../engine/majorQuests'
import { getPillarRumor } from '../../../engine/npcLore'

interface Props {
  gs: GameState
  localNpc: NamedNpc
  npcDialogResult: string | null
  onDialogResult: (msg: string) => void
  onCardGame: () => void
  onBack: () => void
  patch: (p: Partial<GameState>) => void
  startCombat: (enemy: import('../../../types').Enemy) => void
  advanceMajorQuests: () => void
  spendAction: () => void
}

const REACTION_COLOR: Record<string, string> = {
  ally: 'var(--gold)', friendly: 'var(--green)', warm: 'var(--cyan)',
  neutral: 'var(--text-dim)', cold: 'var(--orange)', hostile: 'var(--red)',
}
const REACTION_LABEL: Record<string, string> = {
  ally: '★ Allié', friendly: '◆ Amical', warm: '◆ Chaleureux',
  neutral: '◆ Neutre', cold: '◆ Froid', hostile: '⚠ Hostile',
}

const NPC_LORE: Record<string, string[]> = {
  'marek': [
    "Il tourne une pièce entre ses doigts sans te regarder. 'Cette station a brûlé deux fois. Ils l'ont reconstruite sans jamais demander pourquoi elle avait brûlé.' Il range la pièce.",
    "'Les Gardiens fouillent les sous-niveaux depuis trois semaines.' Il secoue la tête. 'Quand l'armée creuse en silence, c'est qu'ils ont perdu quelque chose qu'ils auraient pas dû perdre.'",
    "'Le Culte du Vide.' Il baisse la voix. 'Avant, c'était des fous dans des caves. Maintenant, j'ai vu des gens respectables les rejoindre discrètement. C'est ça qui inquiète.'",
  ],
  'sela': [
    "Elle range des factures. 'L'Emporium contrôle maintenant deux routes sur trois dans ce secteur. Il y a cinq ans, c'était une sur cinq.' Elle sourit sans humour. 'Le marché se conquiert silencieusement.'",
    "'Les routes vers les zones profondes sont fermées, officiellement pour radiation.' Elle baisse la voix. 'Officieusement, quelqu'un ne veut pas qu'on trouve ce qu'il y a là-bas. Et ce quelqu'un a assez d'influence pour que personne ne pose de questions.'",
    "Elle glisse un document. 'Les Faucons et l'Emporium négocient en ce moment. Si ça aboutit, les indépendants comme toi et moi...' Elle trace un doigt sur sa gorge.",
  ],
  'torvak': [
    "Il fixe un point derrière toi. 'J'ai servi sous trois commandants. Le premier croyait à l'ordre. Le deuxième à la justice. Le troisième ne croit à rien — c'est lui qui a survécu.' Il se tait.",
    "'La guerre des factions, il y a vingt ans.' Il parle lentement. 'Tout le monde blâme les Faucons. Mais l'Emporium a fourni les armes des deux côtés. Les Gardiens ont regardé. On a tous nos rôles.'",
    "Il te montre une cicatrice sur l'avant-bras. 'Velkor. Quelque chose dans les ruines profondes que le Directeur Pale surveille personnellement. J'ai vu des soldats partir en exploration ne jamais revenir. Personne ne pose de questions.'",
  ],
  'lira': [
    "Elle ne lève pas les yeux de son écran. 'Le réseau de Nexus Aldara a été piraté il y a trois jours. Pas par moi. Quelqu'un cherchait des archives militaires — des coordonnées de zones profondes.' Un silence. 'Ils ont trouvé.'",
    "'Tu sais ce qu'est un Fragment Nexus ?' Elle te regarde enfin. 'Une clé. Mais pour quoi — les archives que j'ai cracké suggèrent que même ceux qui les ont construits ne sont plus sûrs de la réponse.'",
    "'Il y a un signal qui émerge des zones profondes depuis six mois. Régulier, codé, pas naturel.' Elle hausse les épaules. 'Personne ne veut l'admettre officiellement. Moi je l'enregistre.'",
  ],
  'boro': [
    "Il regarde à gauche, puis à droite. 'Un pilote est passé hier, des zones profondes. Les yeux différents. Il m'a payé avec des crédits qui n'existent pas officiellement.' Il hausse les épaules. 'J'ai quand même pris.'",
    "'Le Culte du Vide paye bien. Très bien.' Il te fixe. 'Je pose pas de questions. Mais les trucs qu'ils achètent, c'est pas pour un culte religieux ordinaire.'",
    "'Y'a quelque chose qui se prépare.' Il dit ça simplement. 'Les gros acheteurs stockent. Les petits fuient. Moi j'attends de voir qui gagne.'",
  ],
  'neva': [
    "Elle regarde le mur. 'Cette prison a été fermée officiellement il y a douze ans. Officiellement.' Elle indique les murs. 'Les inscriptions du niveau sept — les plus récentes datent de six mois. Quelqu'un était là. Quelqu'un qu'on voulait pas voir ailleurs.'",
    "'Y'a des gens qui cherchent à partir d'ici. Y'a des gens qui cherchent à y rester.' Elle te regarde. 'Les deuxièmes savent quelque chose que les premiers pas encore. J'ai décidé que la curiosité était trop dangereuse.'",
    "'Le Culte tient des réunions dans les sous-niveaux.' Elle hausse les épaules. 'Ici, on a arrêté de chasser les secrets. Ça prend trop d'énergie et ça attire trop d'ennuis.'",
  ],
  'pistis': [
    "Il fait glisser quelque chose sur la table. 'L'Emporium Requiem a une liste noire. Des gens dont ils veulent contrôler les mouvements sans qu'ils le sachent.' Il sourit. 'Certaines personnes dans ce secteur paient cher pour savoir si leur nom est dessus.'",
    "'Le marché des artefacts explose.' Il te regarde. 'Depuis que les zones profondes ont commencé à... produire des choses. Des choses que personne ne comprend encore. Certains acheteurs sont très patients.'",
  ],
  'ganz': [
    "Il te parle sans te regarder. 'Les paris sur les factions ont changé. Avant, les gens misaient sur les Faucons ou les Gardiens. Maintenant, la nouvelle catégorie qui rapporte le plus, c'est Le Vide vainqueur. Ça fait réfléchir sur ce que les gens savent.'",
    "'Les riches qui fréquentent Star Quest ont commencé à acheter des propriétés dans les zones reculées. Les vraiment reculées.' Il sourit. 'Ils savent quelque chose. Ils partent pas encore. Mais ils se préparent.'",
  ],
  'myrra': [
    "Elle te juge du regard avant de parler. 'Les Gardiens ont perdu trois postes avancés ce mois-ci. Officiellement, des défaillances techniques.' Elle marque une pause. 'Aucun des trois postes n'avait de problèmes techniques signalés la veille.'",
    "'Quelqu'un recrute des soldats déserteurs dans ce secteur. Pas les Faucons — j'aurais su.' Elle te regarde. 'Ce niveau d'organisation, cette discrétion... ça ressemble au Culte. Mais le Culte ne recrute pas des soldats d'ordinaire.'",
  ],
  'ysla': [
    "Elle t'explique sans pause. 'Les ruines des Abysses de Velkor ne sont pas des ruines ordinaires. La disposition des structures suggère une civilisation bien antérieure à ce que les archives officielles documentent.' Elle te regarde. 'Quelqu'un a effacé ça des archives. Délibérément.'",
    "'J'ai trouvé quelque chose ici.' Elle baisse la voix. 'Un fragment avec une inscription que je n'arrive pas à dater. Les matériaux non plus. Ça n'aurait pas dû exister à cette époque.' Elle hésite. 'Je l'ai caché. Le Directeur Pale cherche exactement ce genre de chose.'",
  ],
  'vance': [
    "Il regarde ses mains. 'La colonie a été fondée il y a trente ans. On nous a dit que c'était une zone vierge.' Il lève les yeux. 'Sauf que j'ai trouvé des fondations sous la mienne. Vieilles. Très vieilles. Personne de la compagnie veut en parler.'",
    "'Les enfants entendent des choses la nuit, dans certaines zones de la colonie. On leur dit que c'est le vent.' Il secoue la tête lentement. 'Ce secteur a une histoire qu'on nous a pas racontée.'",
  ],
  'cael': [
    "Il ne dit rien pendant un moment. 'Alanossa prépare quelque chose de plus grand que les raids habituels.' Il te regarde. 'Je te dis pas quoi. Mais si t'as des dettes à régler dans ce secteur, règle-les avant la fin du mois.'",
  ],
  'vosh': [
    "Il t'évalue. 'Les Faucons Noirs recrutent pas pour faire des raids. On construit quelque chose.' Il marque une pause. 'Alanossa a une vision. Ceux qui la comprennent avant les autres seront bien placés.'",
  ],
}

const TALK_LINES: Record<string, string[]> = {
  Ferrailleur:        ["Il grogne, montre une pièce rare.", "Il t'indique une cache de matériel."],
  Marchande:          ["Elle glisse une info commerciale.", "Elle te parle d'un fournisseur discret."],
  Vétéran:            ["Il raconte une bataille. Tu écoutes.", "Il te montre une technique de survie."],
  Hackeuse:           ["Elle parle peu. Ses yeux balaient la salle.", "Elle mentionne un contrat en cours."],
  Dealer:             ["Il te propose quelque chose. Tu déclines poliment.", "Il regarde ailleurs. Méfiant."],
  Survivante:         ["Elle te raconte comment elle a tenu ici.", "Elle a vu pire. Elle le dit calmement."],
  Courtier:           ["Il glisse un tuyau sur le marché.", "Il mentionne un acheteur discret quelque part."],
  Organisateur:       ["Il te parle d'un pari intéressant.", "Il te reconnaît. Ça compte."],
  Commandante:        ["Elle te juge du regard. Court. Précis.", "Elle a un travail pour toi — peut-être."],
  Chercheuse:         ["Elle t'explique sa découverte. C'est fascinant.", "Elle a besoin d'aide pour quelque chose."],
  'Pilote retraité':  ["Il se souvient de routes oubliées.", "Il rit de tes aventures récentes."],
  Forgeron:           ["Il te montre une arme en cours. Propre.", "Il fait des prix pour les réguliers."],
  Fermier:            ["Il partage sa récolte sans chichi.", "Calme et honnête. Une rareté."],
  Lieutenant:         ["Il ne dit rien. Mais il écoute.", "Il te laisse passer. Pour l'instant."],
}

export function NpcEncounterPanel({ gs, localNpc, npcDialogResult, onDialogResult, onCardGame, onBack, patch, startCombat, advanceMajorQuests, spendAction }: Props) {
  const npcState   = gs.knownNpcs[localNpc.id]
  const reaction   = npcState ? getNpcReaction(npcState, gs) : 'neutral'
  const greeting   = npcState ? getNpcGreeting(npcState, reaction, gs) : `${localNpc.name} te regarde arriver.`
  const timesMet   = npcState?.timesMet ?? 0
  const service    = getNpcService(localNpc.role)
  const serviceUsed = (npcState?.lastServiceDay ?? -1) === gs.day
  const talkUsed    = (npcState?.lastTalkDay   ?? -1) === gs.day

  function openNpc() {
    const base = npcState ?? { id: localNpc.id, name: localNpc.name, station: localNpc.station, firstMetDay: gs.day, timesMet: 0, repDelta: 0, isAlly: false, isEnemy: false, tags: [] }
    const updated = recordMeeting(base)
    const names = new Set(gs.npcsMet)
    names.add(localNpc.name)
    patch({ knownNpcs: { ...gs.knownNpcs, [localNpc.id]: updated }, npcsMet: Array.from(names) })
    advanceMajorQuests()
  }

  function patchNpc(extra: Record<string, unknown>) {
    const base = npcState ?? { id: localNpc.id, name: localNpc.name, station: localNpc.station, firstMetDay: gs.day, timesMet: 0, repDelta: 0, isAlly: false, isEnemy: false, tags: [] }
    patch({ knownNpcs: { ...gs.knownNpcs, [localNpc.id]: { ...base, ...extra } } })
  }

  function handleTalk() {
    const base = npcState ?? { id: localNpc.id, name: localNpc.name, station: localNpc.station, firstMetDay: gs.day, timesMet: 0, repDelta: 0, isAlly: false, isEnemy: false, tags: [] }
    const updated = recordMeeting({ ...base, lastTalkDay: gs.day })
    const names = new Set(gs.npcsMet)
    names.add(localNpc.name)

    const rep = base.repDelta ?? 0
    const decisions = gs.pastDecisions ?? []

    // Callbacks narratifs (T7) — réactions basées sur les décisions passées
    const DECISION_CALLBACKS: Array<{ decision: string; line: string }> = [
      { decision: 'escaped-interrogation',     line: "Il baisse la voix. 'J'ai entendu parler de quelqu'un qui a brisé un interrogatoire. Proprement. Ça court, comme histoire.' Il te regarde différemment." },
      { decision: 'betrayed-at-interrogation', line: "Il te jette un regard de côté. 'Des gens ont donné des noms sous pression. Ça arrive.' Il dit ça sans jugement apparent. C'est pire." },
      { decision: 'cooperated-interrogation',  line: "'T'es encore là.' Il énonce juste le fait. 'Certains coopèrent et survivent. Ça dit quelque chose — je sais pas encore quoi.'" },
      { decision: 'aided-scientist',           line: "'Y'a eu un bruit qui courait sur quelqu'un qui a aidé un chercheur à fuir.' Il croise les bras. 'Ce genre de geste, ça attire les gens bien. Et les autres.'"},
      { decision: 'saved-mercenary',           line: "'Soigner un mercenaire en zone de guerre.' Il hoche la tête lentement. 'Risqué. Coûteux. Les gens comme ça s'en souviennent longtemps.'" },
      { decision: 'defector-network',          line: "'Le réseau de déserteurs.' Il dit ça vite et rebaisse la voix. 'Si t'as trempé là-dedans, fais attention. Certains veulent comprendre ce réseau de l'intérieur.'" },
    ]
    const matchedCallback = DECISION_CALLBACKS.find(cb => decisions.includes(cb.decision))

    // Sélection du dialogue de base
    const lorelines = NPC_LORE[localNpc.id]
    const useLoRe = lorelines && Math.random() < 0.65
    const usePillarRumor = !lorelines && Math.random() < 0.30
    const pool = useLoRe
      ? lorelines
      : (TALK_LINES[localNpc.role] ?? ["Il hochait la tête. Pas grand-chose de plus."])
    const baseLine = usePillarRumor ? getPillarRumor() : pool[base.timesMet % pool.length]

    // Préfixe callback si une décision connue est détectée (30% de chance de trigger)
    const callbackPrefix = matchedCallback && Math.random() < 0.30
      ? matchedCallback.line + '\n\n'
      : ''

    let gsUpdate: Partial<GameState> = {}
    let msg = callbackPrefix + baseLine
    if (rep >= 20) {
      gsUpdate = { credits: gs.credits + 50, reputation: gs.reputation + 3 }
      msg += ' · (+50 cr, +3 rép)'
    } else if (rep <= -20) {
      msg = `${localNpc.name} tourne la tête. La conversation est terminée.`
    } else {
      gsUpdate = { reputation: gs.reputation + 2 }
      msg += ' · (+2 rép)'
    }
    patch({ ...gsUpdate, knownNpcs: { ...gs.knownNpcs, [localNpc.id]: updated }, npcsMet: Array.from(names) })
    advanceMajorQuests()
    onDialogResult(msg)
  }

  function handleService() {
    if (!service) return
    spendAction()
    const { patch: newGs, message } = service.execute(gs)
    patch(newGs)
    patchNpc({ lastServiceDay: gs.day })
    onDialogResult(message)
  }

  function handleProvoke() {
    openNpc()
    const base = npcState ?? { id: localNpc.id, name: localNpc.name, station: localNpc.station, firstMetDay: gs.day, timesMet: 1, repDelta: 0, isAlly: false, isEnemy: false, tags: [] }
    const updated = { ...base, isEnemy: true, repDelta: -50 }
    patch({ knownNpcs: { ...gs.knownNpcs, [localNpc.id]: updated }, reputation: gs.reputation - 5 })
    startCombat({
      name: localNpc.name,
      maxHp: 40 + Math.floor(gs.day * 2),
      damageMin: 8, damageMax: 18,
      lootMin: 150, lootMax: 500,
      description: `${localNpc.role}. Tu l'as cherché.`,
      captureChance: 15, killChance: 15, isBoss: false, role: 'normal' as const,
    })
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
        {timesMet > 0 && (
          <div className="t-xs t-dim mb8">{timesMet} rencontre{timesMet > 1 ? 's' : ''} · Jour {npcState?.firstMetDay ?? gs.day}</div>
        )}
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
            <button className="px-btn" disabled={talkUsed} style={{ opacity: talkUsed ? 0.4 : 1 }} onClick={handleTalk}>
              Parler
              {talkUsed && <span className="t-dim" style={{ marginLeft: '8px', fontSize: '9px' }}>(déjà parlé aujourd'hui)</span>}
            </button>
          )}

          {service && reaction !== 'hostile' && (
            <button
              className="px-btn"
              style={{
                color: serviceUsed ? undefined : 'var(--cyan)',
                borderColor: serviceUsed ? undefined : 'var(--cyan)',
                opacity: serviceUsed || !service.canUse(gs) ? 0.5 : 1,
              }}
              disabled={serviceUsed || !service.canUse(gs) || gs.actionsToday >= 3}
              onClick={handleService}
            >
              {service.label}
              <span className="t-dim" style={{ marginLeft: '8px', fontSize: '9px' }}>
                {serviceUsed ? '(déjà utilisé)' : `— ${service.costText} · 1 action`}
              </span>
              {!serviceUsed && !service.canUse(gs) && (
                <span className="t-red" style={{ marginLeft: '6px', fontSize: '9px' }}>
                  {service.whyNot(gs)}
                </span>
              )}
            </button>
          )}

          {reaction !== 'hostile' && (() => {
            const mq = getMajorQuestForNpc(gs, localNpc.name)
            if (!mq) return null
            return (
              <button className="px-btn" style={{ color: 'var(--purple)', borderColor: 'var(--purple)' }} onClick={() => {
                openNpc()
                patch({ majorQuests: [...gs.majorQuests, { ...mq }] })
                onDialogResult(`[MISSION MAJEURE] ${mq.title}\n\n${mq.lore}\n\nPremière étape : ${mq.stages[0].objective}`)
              }}>
                ★★ Mission importante — {mq.title}
              </button>
            )
          })()}

          {localNpc.role === 'Organisateur' && reaction !== 'hostile' && (
            <button className="px-btn px-btn--primary" onClick={() => { openNpc(); onCardGame() }}>
              ★ Jouer aux cartes
            </button>
          )}

          {reaction === 'ally' && (
            <button className="px-btn px-btn--green" onClick={() => {
              openNpc()
              patch({ playerHp: Math.min(gs.playerMaxHp, gs.playerHp + 20), reputation: gs.reputation + 5 })
              onDialogResult(`${localNpc.name} t'aide sans hésiter. +20 PV · +5 rép.`)
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
            <button className="px-btn" style={{ color: 'var(--orange)', borderColor: 'var(--orange)' }} onClick={handleProvoke}>
              Provoquer (combat, -5 rép)
            </button>
          )}
        </div>
      )}

      <button className="px-btn" onClick={onBack}>← Retour</button>
    </div>
  )
}

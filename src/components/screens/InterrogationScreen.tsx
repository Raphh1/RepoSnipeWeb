import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { addDecision, shiftPillar } from '../../engine/memoryEvents'
import { addJournal } from '../../engine/journal'
import { drawInterrogation, INTERROGATION_PASS_SCORE, INTERROGATION_TOTAL, type InterrogationQuestion } from '../../data/interrogationQuestions'

type Phase = 'intro' | 'choices' | 'quiz' | 'result'

interface InterrogatorProfile {
  title: string
  description: string
  demandLabel: string
  tone: string
}

function getInterrogatorProfile(faction: string): InterrogatorProfile {
  if (faction.includes('Raphazarus')) return {
    title: "INTERROGATOIRE — SOLDATS DE RAPHAZARUS",
    description: "La salle est de béton brut. Un homme d'âge impossible te regarde sans ciller. Ses soldats sont derrière lui, immobiles. Il n'y a pas de formulaire, pas de procédure. Juste ses yeux et ton silence.",
    demandLabel: "Raphazarus veut savoir ce que tu faisais dans L'Arc Perdu.",
    tone: "var(--orange)",
  }
  if (faction.includes('Emporium') || faction.includes('Cesarion') || faction.includes('Pistis')) return {
    title: "INTERROGATOIRE — SERVICES DE L'EMPORIUM",
    description: "Une salle propre, éclairée de façon clinique. L'agent en face de toi sourit. C'est le pire signe. L'Emporium a des ressources. Et du temps. Et une définition très large du mot 'aveu'.",
    demandLabel: "Les services veulent connaître tes activités dans la zone impériale.",
    tone: "var(--cyan)",
  }
  if (faction.includes('Gardien') || faction.includes('Kharos')) return {
    title: "INTERROGATOIRE — GARDIENS DE L'EMPIRE",
    description: "Le colonel t'observe depuis l'autre côté d'une table de métal. Aucun papier. Aucun enregistrement visible. Les Gardiens ont leurs propres méthodes — et leurs propres définitions de la justice.",
    demandLabel: "Les Gardiens veulent que tu justifies ta présence dans la zone militaire.",
    tone: "var(--green)",
  }
  return {
    title: "INTERROGATOIRE — AUTORITÉS LOCALES",
    description: "Une pièce quelconque. Des hommes en uniforme générique. Ils ont un mandat et aucune patience. La question n'est pas si tu parles — c'est quand.",
    demandLabel: "Ils veulent savoir qui tu es et ce que tu faisais là.",
    tone: "var(--orange)",
  }
}

export function InterrogationScreen() {
  const gs    = useGameStore(s => s.gs!)
  const patch = useGameStore(s => s.patch)
  const goTo  = useGameStore(s => s.goTo)

  const [phase, setPhase]   = useState<Phase>('intro')
  const [result, setResult] = useState<{ text: string; free: boolean }>({ text: '', free: false })

  // ── Quiz d'interrogatoire ──
  const [quiz, setQuiz]       = useState<InterrogationQuestion[]>(() => drawInterrogation(INTERROGATION_TOTAL))
  const [qIdx, setQIdx]       = useState(0)
  const [score, setScore]     = useState(0)
  const [picked, setPicked]   = useState<number | null>(null)

  const info = gs.pendingInterrogation ?? { faction: 'Autorités locales', captureStation: gs.currentStation }
  const profile = getInterrogatorProfile(info.faction)
  const bribeAmount = 600 + gs.day * 25

  function free(text: string, extraPatch?: Partial<typeof gs>) {
    patch({ pendingInterrogation: null, interrogationsSurvived: gs.interrogationsSurvived + 1, ...extraPatch })
    setResult({ text, free: true })
    setPhase('result')
  }

  function prison(text: string, days: number, extraPatch?: Partial<typeof gs>) {
    patch({ pendingInterrogation: null, isImprisoned: true, prisonDaysLeft: days, ...extraPatch })
    setResult({ text, free: false })
    setPhase('result')
  }

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="layout">
        <div className="t-xs t-dim t-center" style={{ letterSpacing: '3px' }}>
          — {profile.title} —
        </div>

        <div className="px-box" style={{ borderColor: profile.tone }}>
          <div className="t-sm mb8" style={{ color: profile.tone, letterSpacing: '1px' }}>DÉTENU</div>
          <div className="t-xs t-dim mb8" style={{ lineHeight: '2.2' }}>{profile.description}</div>
          <div className="px-box mt4" style={{ borderColor: 'var(--dim)', background: 'rgba(255,255,255,0.03)' }}>
            <div className="t-xs t-dim" style={{ fontStyle: 'italic', lineHeight: '2' }}>
              "{profile.demandLabel}"
            </div>
          </div>
        </div>

        <div className="px-box" style={{ padding: '8px 12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="t-xs t-dim">Capturé à</span>
              <span className="t-xs">{info.captureStation}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="t-xs t-dim">Faction</span>
              <span className="t-xs" style={{ color: profile.tone }}>{info.faction}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="t-xs t-dim">PV actuels</span>
              <span className="t-xs" style={{ color: gs.playerHp < gs.playerMaxHp * 0.3 ? 'var(--red)' : 'var(--green)' }}>{gs.playerHp}/{gs.playerMaxHp}</span>
            </div>
          </div>
        </div>

        <div className="px-box" style={{ padding: '8px 12px', borderColor: 'var(--dim)' }}>
          <div className="t-xs t-dim" style={{ lineHeight: '1.9' }}>
            Avant la cellule, ils tiennent à « vérifier que tu es bien un citoyen normal ».
            Une série de {INTERROGATION_TOTAL} questions. Réponds correctement à au moins {INTERROGATION_PASS_SCORE} et
            tu ressors libre. La plupart sont triviales… mais certaines n'ont aucune réponse possible. Bonne chance.
          </div>
        </div>

        <button className="px-btn px-btn--primary" onClick={() => setPhase('quiz')}>
          Subir l'interrogatoire culturel ({INTERROGATION_PASS_SCORE}/{INTERROGATION_TOTAL}) →
        </button>
        <button className="px-btn" onClick={() => setPhase('choices')}>
          Tenter une autre approche (soudoyer, nier, fuir…)
        </button>
      </div>
    )
  }

  // ── QUIZ ─────────────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    const question = quiz[qIdx]
    const answered = picked !== null
    const isLast   = qIdx >= quiz.length - 1

    function choose(i: number) {
      if (picked !== null) return
      setPicked(i)
      if (i === question.answer) setScore(s => s + 1)
    }

    function next() {
      if (isLast) {
        const finalScore = score
        const passed = finalScore >= INTERROGATION_PASS_SCORE
        if (passed) {
          free(
            `Tu as répondu juste à ${finalScore}/${INTERROGATION_TOTAL} questions. L'interrogateur soupire, déçu de ne pas pouvoir te garder. « Citoyen modèle, apparemment. » On te relâche.`,
            { journal: addJournal(gs, `J'ai survécu à l'interrogatoire culturel de ${info.faction} (${finalScore}/${INTERROGATION_TOTAL}). Ils n'ont pas pu me garder.`, 'prison') }
          )
        } else {
          prison(
            `Seulement ${finalScore}/${INTERROGATION_TOTAL} bonnes réponses. « Soit tu es un espion, soit tu es inculte. Dans les deux cas, cellule. » Ils t'emmènent.`,
            rng(3, 6),
            { journal: addJournal(gs, `J'ai échoué à l'interrogatoire culturel de ${info.faction} (${finalScore}/${INTERROGATION_TOTAL}). Cellule.`, 'prison') }
          )
        }
        return
      }
      setQIdx(i => i + 1)
      setPicked(null)
    }

    return (
      <div className="layout">
        <div className="t-xs t-dim t-center" style={{ letterSpacing: '3px' }}>
          — INTERROGATOIRE CULTUREL —
        </div>

        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="t-xs t-dim">Question {qIdx + 1}/{quiz.length}</span>
          <span className="t-xs">Score : <span style={{ color: score >= INTERROGATION_PASS_SCORE ? 'var(--green)' : 'var(--dim)' }}>{score}</span> · seuil {INTERROGATION_PASS_SCORE}</span>
        </div>

        <div className="px-box" style={{ borderColor: profile.tone }}>
          <div className="t-sm" style={{ lineHeight: '1.9' }}>{question.q}</div>
        </div>

        <div className="col gap4">
          {question.choices.map((c, i) => {
            const correct = answered && i === question.answer
            const wrong   = answered && i === picked && i !== question.answer
            return (
              <button
                key={i}
                className="px-btn"
                disabled={answered}
                style={{
                  borderColor: correct ? 'var(--green)' : wrong ? 'var(--red)' : undefined,
                  color: correct ? 'var(--green)' : wrong ? 'var(--red)' : undefined,
                  opacity: answered && !correct && !wrong ? 0.5 : 1,
                }}
                onClick={() => choose(i)}
              >
                {c}
              </button>
            )
          })}
        </div>

        {answered && (
          <>
            <div className="px-box" style={{ padding: '6px 12px', borderColor: picked === question.answer ? 'var(--green)' : 'var(--red)' }}>
              <span className="t-xs" style={{ color: picked === question.answer ? 'var(--green)' : 'var(--red)' }}>
                {picked === question.answer ? '✓ Bonne réponse.' : '✗ Mauvaise réponse.'}
                {question.impossible ? ' (Personne ne pouvait répondre à celle-là. C\'était le piège.)' : ''}
              </span>
            </div>
            <button className="px-btn px-btn--primary" onClick={next}>
              {isLast ? 'Voir le verdict →' : 'Question suivante →'}
            </button>
          </>
        )}
      </div>
    )
  }

  // ── RÉSULTAT ─────────────────────────────────────────────────────────────
  if (phase === 'result') {
    return (
      <div className="layout" style={{ justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
          <div className="t-xs t-dim t-center mb8">— FIN D'INTERROGATOIRE —</div>
          <div className="px-box" style={{ borderColor: result.free ? 'var(--green)' : 'var(--red)' }}>
            <div className="t-sm mb8" style={{ color: result.free ? 'var(--green)' : 'var(--red)' }}>
              {result.free ? 'RELÂCHÉ' : 'INCARCÉRÉ'}
            </div>
            <div className="t-xs t-dim" style={{ lineHeight: '2.2' }}>{result.text}</div>
          </div>
          {result.free
            ? <button className="px-btn px-btn--primary mt8" onClick={() => goTo('station-hub')}>Retourner en station →</button>
            : <button className="px-btn px-btn--danger mt8" onClick={() => goTo('prison')}>Rejoindre la cellule →</button>
          }
        </div>
      </div>
    )
  }

  // ── CHOIX ────────────────────────────────────────────────────────────────
  return (
    <div className="layout">
      <div className="t-xs t-dim t-center" style={{ letterSpacing: '3px' }}>
        — INTERROGATOIRE EN COURS —
      </div>

      <div className="px-box" style={{ borderColor: profile.tone }}>
        <div className="t-xs t-dim" style={{ lineHeight: '2' }}>
          Ils attendent. Le silence dure depuis trop longtemps pour être confortable.
          Tu as des options — aucune n'est bonne.
        </div>
      </div>

      <div className="col gap4">

        {/* PARLER LIBREMENT */}
        <div className="px-box" style={{ padding: '8px 12px' }}>
          <div className="t-xs t-dim" style={{ lineHeight: '1.8' }}>
            ⚠ Parler : libéré, mais -rép et -crédits confisqués
          </div>
        </div>
        <button className="px-btn" onClick={() => {
          const confiscated = Math.min(gs.credits, Math.floor(gs.credits * 0.25))
          const pillarDelta = info.faction.includes('Raphazarus') ? shiftPillar(gs, 'raphazarus', +5)
            : info.faction.includes('Emporium') ? shiftPillar(gs, 'cesarion', +5)
            : gs.pillarStanding
          free(
            `Tu parles. Pas tout — mais assez. Ils semblent satisfaits d'une manière qui ne te rassure pas. Ils te libèrent après deux heures. Tes crédits ont été 'vérifiés'. -${confiscated} cr confisqués. -10 rép.`,
            { credits: gs.credits - confiscated, reputation: gs.reputation - 10, pastDecisions: addDecision(gs, 'cooperated-interrogation'), pillarStanding: pillarDelta, journal: addJournal(gs, `J'ai coopéré à l'interrogatoire de ${info.faction}. Ils ont pris mes crédits. Je suis sorti libre — ce qui est déjà quelque chose.`, 'decision') }
          )
        }}>
          Parler librement — coopérer complètement
        </button>

        {/* NIER TOUT */}
        <button className="px-btn" onClick={() => {
          const roll = Math.random()
          if (roll < 0.45) {
            free(
              "Tu nies tout avec constance. Ils n'ont rien de solide. Après un temps interminable, ils te relâchent avec un avertissement. Tu sors en tremblant mais libre. -5 rép.",
              { reputation: gs.reputation - 5, journal: addJournal(gs, "J'ai tout nié à l'interrogatoire. Ils n'avaient rien de solide. Je suis sorti libre mais tremblant.", 'decision') }
            )
          } else if (roll < 0.75) {
            prison(
              "Ton déni les agace. Ils décident que tu as l'air coupable d'autre chose. Tu prends quelques jours en cellule le temps qu'ils 'vérifient'. -15 rép.",
              rng(2, 4),
              { reputation: gs.reputation - 15, journal: addJournal(gs, "J'ai nié à l'interrogatoire. Ils m'ont mis en cellule le temps de 'vérifier'. Ils vérifieront longtemps.", 'prison') }
            )
          } else {
            prison(
              "Ils ont plus d'infos que tu croyais. Ton déni les convainc que tu caches quelque chose de sérieux. Longue détention. -20 rép.",
              rng(4, 7),
              { reputation: gs.reputation - 20, journal: addJournal(gs, "Ils avaient plus d'informations sur moi que je ne croyais. Mon déni n'a servi à rien. Longue cellule.", 'prison') }
            )
          }
        }}>
          Nier tout — maintenir le silence
        </button>

        {/* SOUDOYER */}
        <button
          className="px-btn"
          disabled={gs.credits < bribeAmount}
          onClick={() => {
            const roll = Math.random()
            if (roll < 0.65) {
              free(
                `L'argent change de mains discrètement. Personne ne dit rien. Tu es dehors en dix minutes. -${bribeAmount} cr.`,
                { credits: gs.credits - bribeAmount, journal: addJournal(gs, `J'ai acheté ma liberté à ${gs.currentStation}. ${bribeAmount} crédits. L'agent n'a même pas levé les yeux.`, 'decision') }
              )
            } else {
              patch({ credits: gs.credits - bribeAmount })
              prison(
                `L'agent empoche. Et appelle du renfort. 'Pour corruption aggravée.' Tu as payé pour rien. -${bribeAmount} cr. Cellule.`,
                rng(3, 5),
                { journal: addJournal(gs, `J'ai essayé de soudoyer l'agent. Il a empoché et a appelé du renfort. J'ai payé pour une cellule.`, 'prison') }
              )
            }
          }}>
          Soudoyer ({bribeAmount.toLocaleString()} cr · 65% réussite){gs.credits < bribeAmount ? ` · manque ${(bribeAmount - gs.credits).toLocaleString()} cr` : ''}
        </button>

        {/* RÉSISTER PHYSIQUEMENT */}
        <button className="px-btn" style={{ borderColor: 'var(--red)', color: 'var(--red)' }} onClick={() => {
          const roll = Math.random()
          if (roll < 0.15) {
            free(
              "Un geste violent, une ouverture, un couloir. Tu cours comme tu n'as jamais couru. Tu sors. Tu ne comprends pas encore comment. +20 rép (on parle de toi).",
              { playerHp: Math.max(1, gs.playerHp - rng(30, 55)), prisonEscapes: gs.prisonEscapes + 1, reputation: gs.reputation + 20, pastDecisions: addDecision(gs, 'escaped-interrogation'), journal: addJournal(gs, "Je me suis évadé d'un interrogatoire. Un geste, une ouverture, un couloir. Je ne comprends pas encore comment.", 'prison') }
            )
          } else {
            prison(
              "La tentative tourne mal immédiatement. Ils étaient quatre. Tu n'en sauras jamais plus. -PV, cellule de sécurité renforcée.",
              rng(4, 8),
              { playerHp: Math.max(1, gs.playerHp - rng(35, 65)), journal: addJournal(gs, "J'ai résisté physiquement à l'interrogatoire. Ils étaient quatre. Je me suis réveillé en cellule de sécurité renforcée.", 'prison') }
            )
          }
        }}>
          Résister physiquement — tenter une évasion immédiate (15%)
        </button>

        {/* DONNER UN NOM — option morale noire */}
        <button className="px-btn" style={{ color: 'var(--dim)' }} onClick={() => {
          free(
            "Tu donnes un nom. Pas le tien — celui de quelqu'un d'autre. Quelqu'un que tu as croisé. Quelqu'un qui n'a rien demandé. Ils notent. Tu sors. -25 rép. Tag 'délateur'.",
            {
              reputation: gs.reputation - 25,
              moralTags: [...(gs.moralTags ?? []), 'délateur'],
              credits: gs.credits + 500,
              pastDecisions: addDecision(gs, 'betrayed-at-interrogation'),
              journal: addJournal(gs, "J'ai donné un nom qui n'était pas le mien à l'interrogatoire. Je ne sais pas ce qu'ils ont fait de ce nom. Je ne veux pas le savoir.", 'decision'),
            }
          )
        }}>
          Balancer quelqu'un d'autre (+500 cr, -25 rép, tag 'délateur')
        </button>

      </div>
    </div>
  )

  function rng(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
}

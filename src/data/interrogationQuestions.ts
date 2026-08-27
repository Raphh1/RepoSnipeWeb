// Banque de questions pour l'interrogatoire (cf. InterrogationScreen).
// Quand le joueur est capturé, ses geôliers lui posent une série de questions
// "culturelles" — la plupart sont faciles, mais dans le lot se cachent des
// questions absurdes/impossibles. Il faut 8 bonnes réponses sur 12 pour sortir.
import i18n from '../i18n/config'

export interface InterrogationQuestion {
  q: string
  choices: string[]
  answer: number       // index de la bonne réponse (0-based)
  impossible?: boolean // question piège : personne ne peut raisonnablement savoir
}

const EASY_ANSWERS = [1, 2, 1, 1, 1, 2, 0, 1, 2, 1, 1, 1, 1, 0, 2, 1, 1, 2, 2, 1, 1, 2, 1, 2, 1, 2]
const IMPOSSIBLE_ANSWERS = [3, 1, 2, 0, 1, 1, 0, 2, 1, 3]

function getEasyQuestions(): InterrogationQuestion[] {
  const raw = i18n.t('easy', { ns: 'interrogationQuestions', returnObjects: true }) as unknown as { q: string; choices: string[] }[]
  return raw.map((item, i) => ({ ...item, answer: EASY_ANSWERS[i] }))
}

function getImpossibleQuestions(): InterrogationQuestion[] {
  const raw = i18n.t('impossible', { ns: 'interrogationQuestions', returnObjects: true }) as unknown as { q: string; choices: string[] }[]
  return raw.map((item, i) => ({ ...item, answer: IMPOSSIBLE_ANSWERS[i], impossible: true }))
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Tire 12 questions : ~9 faciles + ~3 impossibles, mélangées.
export function drawInterrogation(total = 12, impossibleCount = 3): InterrogationQuestion[] {
  const easy = shuffle(getEasyQuestions()).slice(0, total - impossibleCount)
  const imp  = shuffle(getImpossibleQuestions()).slice(0, impossibleCount)
  return shuffle([...easy, ...imp])
}

export const INTERROGATION_PASS_SCORE = 8
export const INTERROGATION_TOTAL = 12

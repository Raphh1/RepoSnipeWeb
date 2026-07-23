// Banque de questions pour l'interrogatoire (cf. InterrogationScreen).
// Quand le joueur est capturé, ses geôliers lui posent une série de questions
// "culturelles" — la plupart sont faciles, mais dans le lot se cachent des
// questions absurdes/impossibles. Il faut 8 bonnes réponses sur 12 pour sortir.

export interface InterrogationQuestion {
  q: string
  choices: string[]
  answer: number       // index de la bonne réponse (0-based)
  impossible?: boolean // question piège : personne ne peut raisonnablement savoir
}

// ── Questions faciles (culture générale) ──────────────────────────────────────
const EASY: InterrogationQuestion[] = [
  { q: 'Combien de jours dans une semaine ?', choices: ['5', '7', '10', '12'], answer: 1 },
  { q: 'Quelle est la couleur du ciel par temps clair ?', choices: ['Vert', 'Rouge', 'Bleu', 'Jaune'], answer: 2 },
  { q: 'Combien font 7 × 8 ?', choices: ['54', '56', '64', '49'], answer: 1 },
  { q: 'Quel astre éclaire la Terre le jour ?', choices: ['La Lune', 'Le Soleil', 'Mars', 'Vénus'], answer: 1 },
  { q: 'Combien de pattes a une araignée ?', choices: ['6', '8', '10', '4'], answer: 1 },
  { q: 'Quelle planète habitons-nous ?', choices: ['Mars', 'Jupiter', 'La Terre', 'Saturne'], answer: 2 },
  { q: 'Combien de côtés a un triangle ?', choices: ['3', '4', '5', '6'], answer: 0 },
  { q: 'Quel animal aboie ?', choices: ['Le chat', 'Le chien', 'La vache', 'Le canard'], answer: 1 },
  { q: 'Quelle est la capitale de la France ?', choices: ['Lyon', 'Marseille', 'Paris', 'Bordeaux'], answer: 2 },
  { q: 'Combien font 100 ÷ 4 ?', choices: ['20', '25', '40', '50'], answer: 1 },
  { q: 'De quelle couleur est l\'herbe ?', choices: ['Bleue', 'Verte', 'Rouge', 'Noire'], answer: 1 },
  { q: 'Quel liquide tombe quand il pleut ?', choices: ['Du lait', 'De l\'eau', 'Du sable', 'De l\'huile'], answer: 1 },
  { q: 'Combien de doigts a une main (en général) ?', choices: ['4', '5', '6', '3'], answer: 1 },
  { q: 'Quel est le contraire de "chaud" ?', choices: ['Froid', 'Mouillé', 'Grand', 'Lourd'], answer: 0 },
  { q: 'Dans quel océan se trouve la France métropolitaine côté ouest ?', choices: ['Pacifique', 'Indien', 'Atlantique', 'Arctique'], answer: 2 },
  { q: 'Combien font 12 + 13 ?', choices: ['24', '25', '26', '23'], answer: 1 },
  { q: 'Quel fruit est jaune et courbé ?', choices: ['La pomme', 'La banane', 'La fraise', 'Le raisin'], answer: 1 },
  { q: 'Quelle saison vient après l\'hiver ?', choices: ['L\'été', 'L\'automne', 'Le printemps', 'La mousson'], answer: 2 },
  { q: 'Combien de minutes dans une heure ?', choices: ['30', '45', '60', '100'], answer: 2 },
  { q: 'Quel métal est attiré par un aimant ?', choices: ['L\'or', 'Le fer', 'Le cuivre', 'L\'argent'], answer: 1 },
  { q: 'Quelle forme a un ballon de football ?', choices: ['Cube', 'Sphère', 'Pyramide', 'Cylindre'], answer: 1 },
  { q: 'Combien de continents y a-t-il (modèle courant) ?', choices: ['5', '6', '7', '9'], answer: 2 },
  { q: 'Quel gaz respirons-nous pour vivre ?', choices: ['Azote', 'Oxygène', 'Hélium', 'Méthane'], answer: 1 },
  { q: 'Quel est le premier nombre premier ?', choices: ['0', '1', '2', '3'], answer: 2 },
  { q: 'Quelle est la couleur du sang humain ?', choices: ['Bleu', 'Rouge', 'Vert', 'Jaune'], answer: 1 },
  { q: 'Combien de roues a une voiture standard ?', choices: ['2', '3', '4', '6'], answer: 2 },
]

// ── Questions IMPOSSIBLES (le piège marrant) ─────────────────────────────────
const IMPOSSIBLE: InterrogationQuestion[] = [
  { q: 'Combien de grains de sable y a-t-il exactement sur la plage de Velkor ?', choices: ['8 412 003 991', '8 412 003 992', '8 412 003 990', 'Aucune idée, évidemment'], answer: 3, impossible: true },
  { q: 'À quoi pensait l\'interrogateur précisément il y a trois secondes ?', choices: ['À sa retraite', 'À toi', 'À son petit-déjeuner', 'À rien'], answer: 1, impossible: true },
  { q: 'Quel était le prénom du chien du voisin de ton geôlier en 2174 ?', choices: ['Brutus', 'Pixel', 'Sergent', 'Mochi'], answer: 2, impossible: true },
  { q: 'Quelle est la 9 999 999e décimale de Pi ?', choices: ['1', '4', '7', '8'], answer: 0, impossible: true },
  { q: 'Combien de fois as-tu cligné des yeux depuis ta capture ?', choices: ['142', '317', '88', 'Personne ne compte ça'], answer: 1, impossible: true },
  { q: 'Quel nombre l\'interrogateur a-t-il en tête, là, maintenant ?', choices: ['7', '42', '13', '666'], answer: 1, impossible: true },
  { q: 'Quelle est la couleur préférée du grand-père de l\'Empereur Cesarion ?', choices: ['Pourpre', 'Ocre', 'Cyan', 'Personne ne le sait'], answer: 0, impossible: true },
  { q: 'Quel jour de la semaine tomberait le 3e anniversaire du vaisseau qui t\'a capturé ?', choices: ['Lundi', 'Jeudi', 'Samedi', 'Dimanche'], answer: 2, impossible: true },
  { q: 'Combien de poils as-tu exactement sur le bras gauche ?', choices: ['2 209', '11 040', '7 777', 'Sérieusement ?'], answer: 1, impossible: true },
  { q: 'Quel est le dernier mot que prononcera l\'interrogateur avant de mourir ?', choices: ['"Maman"', '"Encore"', '"Pourquoi"', 'Indéterminable'], answer: 3, impossible: true },
]

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
  const easy = shuffle(EASY).slice(0, total - impossibleCount)
  const imp  = shuffle(IMPOSSIBLE).slice(0, impossibleCount)
  return shuffle([...easy, ...imp])
}

export const INTERROGATION_PASS_SCORE = 8
export const INTERROGATION_TOTAL = 12

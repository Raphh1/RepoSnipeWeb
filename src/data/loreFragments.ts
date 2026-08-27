import i18n from '../i18n/config'

const lf = (key: string) => i18n.t(key, { ns: 'loreFragments' })

export type LoreFragmentType = 'journal' | 'transmission' | 'inscription' | 'datapad' | 'rumeur'

export interface LoreFragment {
  id: string
  type: LoreFragmentType
  title: string
  source: string
  content: string
}

export function getLoreFragments(): LoreFragment[] {
  return [

  // ── LA FRACTURE ───────────────────────────────────────────────────────────
  { id: 'fracture_01', type: 'transmission', title: lf('fracture01.title'), source: lf('fracture01.source'), content: lf('fracture01.content') },
  { id: 'fracture_02', type: 'journal', title: lf('fracture02.title'), source: lf('fracture02.source'), content: lf('fracture02.content') },
  { id: 'fracture_03', type: 'datapad', title: lf('fracture03.title'), source: lf('fracture03.source'), content: lf('fracture03.content') },
  { id: 'fracture_04', type: 'transmission', title: lf('fracture04.title'), source: lf('fracture04.source'), content: lf('fracture04.content') },
  { id: 'fracture_05', type: 'inscription', title: lf('fracture05.title'), source: lf('fracture05.source'), content: lf('fracture05.content') },

  // ── LES FAUCONS ───────────────────────────────────────────────────────────
  { id: 'faucons_01', type: 'journal', title: lf('faucons01.title'), source: lf('faucons01.source'), content: lf('faucons01.content') },
  { id: 'faucons_02', type: 'datapad', title: lf('faucons02.title'), source: lf('faucons02.source'), content: lf('faucons02.content') },
  { id: 'faucons_03', type: 'rumeur', title: lf('faucons03.title'), source: lf('faucons03.source'), content: lf('faucons03.content') },
  { id: 'faucons_04', type: 'inscription', title: lf('faucons04.title'), source: lf('faucons04.source'), content: lf('faucons04.content') },

  // ── L'EMPORIUM ────────────────────────────────────────────────────────────
  { id: 'emporium_01', type: 'datapad', title: lf('emporium01.title'), source: lf('emporium01.source'), content: lf('emporium01.content') },
  { id: 'emporium_02', type: 'transmission', title: lf('emporium02.title'), source: lf('emporium02.source'), content: lf('emporium02.content') },
  { id: 'emporium_03', type: 'rumeur', title: lf('emporium03.title'), source: lf('emporium03.source'), content: lf('emporium03.content') },
  { id: 'emporium_04', type: 'inscription', title: lf('emporium04.title'), source: lf('emporium04.source'), content: lf('emporium04.content') },

  // ── LES GARDIENS ──────────────────────────────────────────────────────────
  { id: 'gardiens_01', type: 'journal', title: lf('gardiens01.title'), source: lf('gardiens01.source'), content: lf('gardiens01.content') },
  { id: 'gardiens_02', type: 'datapad', title: lf('gardiens02.title'), source: lf('gardiens02.source'), content: lf('gardiens02.content') },
  { id: 'gardiens_03', type: 'transmission', title: lf('gardiens03.title'), source: lf('gardiens03.source'), content: lf('gardiens03.content') },

  // ── LE CULTE ──────────────────────────────────────────────────────────────
  { id: 'culte_01', type: 'inscription', title: lf('culte01.title'), source: lf('culte01.source'), content: lf('culte01.content') },
  { id: 'culte_02', type: 'journal', title: lf('culte02.title'), source: lf('culte02.source'), content: lf('culte02.content') },
  { id: 'culte_03', type: 'datapad', title: lf('culte03.title'), source: lf('culte03.source'), content: lf('culte03.content') },
  { id: 'culte_04', type: 'transmission', title: lf('culte04.title'), source: lf('culte04.source'), content: lf('culte04.content') },
  { id: 'culte_05', type: 'rumeur', title: lf('culte05.title'), source: lf('culte05.source'), content: lf('culte05.content') },

  // ── LA DÉRIVE ET LE VIDE ──────────────────────────────────────────────────
  { id: 'void_01', type: 'journal', title: lf('void01.title'), source: lf('void01.source'), content: lf('void01.content') },
  { id: 'void_02', type: 'datapad', title: lf('void02.title'), source: lf('void02.source'), content: lf('void02.content') },
  { id: 'void_03', type: 'transmission', title: lf('void03.title'), source: lf('void03.source'), content: lf('void03.content') },
  { id: 'void_04', type: 'rumeur', title: lf('void04.title'), source: lf('void04.source'), content: lf('void04.content') },

  // ── STATION ZÉRO ──────────────────────────────────────────────────────────
  { id: 'zero_01', type: 'datapad', title: lf('zero01.title'), source: lf('zero01.source'), content: lf('zero01.content') },
  { id: 'zero_02', type: 'transmission', title: lf('zero02.title'), source: lf('zero02.source'), content: lf('zero02.content') },

  // ── L'INGÉNIEUR RHO ──────────────────────────────────────────────────────
  { id: 'rho_01', type: 'datapad', title: lf('rho01.title'), source: lf('rho01.source'), content: lf('rho01.content') },
  { id: 'rho_02', type: 'transmission', title: lf('rho02.title'), source: lf('rho02.source'), content: lf('rho02.content') },

  // ── LES PERSONNAGES PILIERS ────────────────────────────────────────────────
  { id: 'cesarion_01', type: 'datapad', title: lf('cesarion01.title'), source: lf('cesarion01.source'), content: lf('cesarion01.content') },
  { id: 'cesarion_02', type: 'rumeur', title: lf('cesarion02.title'), source: lf('cesarion02.source'), content: lf('cesarion02.content') },
  { id: 'cesarion_03', type: 'inscription', title: lf('cesarion03.title'), source: lf('cesarion03.source'), content: lf('cesarion03.content') },
  { id: 'raphazarus_01', type: 'datapad', title: lf('raphazarus01.title'), source: lf('raphazarus01.source'), content: lf('raphazarus01.content') },
  { id: 'raphazarus_02', type: 'rumeur', title: lf('raphazarus02.title'), source: lf('raphazarus02.source'), content: lf('raphazarus02.content') },
  { id: 'raphazarus_03', type: 'transmission', title: lf('raphazarus03.title'), source: lf('raphazarus03.source'), content: lf('raphazarus03.content') },
  { id: 'eliotis_01', type: 'journal', title: lf('eliotis01.title'), source: lf('eliotis01.source'), content: lf('eliotis01.content') },
  { id: 'eliotis_02', type: 'datapad', title: lf('eliotis02.title'), source: lf('eliotis02.source'), content: lf('eliotis02.content') },
  { id: 'maxance_01', type: 'journal', title: lf('maxance01.title'), source: lf('maxance01.source'), content: lf('maxance01.content') },
  { id: 'maxance_02', type: 'transmission', title: lf('maxance02.title'), source: lf('maxance02.source'), content: lf('maxance02.content') },
  { id: 'maxance_03', type: 'rumeur', title: lf('maxance03.title'), source: lf('maxance03.source'), content: lf('maxance03.content') },
  { id: 'samy_scotty_01', type: 'datapad', title: lf('samyScotty01.title'), source: lf('samyScotty01.source'), content: lf('samyScotty01.content') },
  { id: 'samy_scotty_02', type: 'inscription', title: lf('samyScotty02.title'), source: lf('samyScotty02.source'), content: lf('samyScotty02.content') },

  // ── FRAGMENTS DE VIE ──────────────────────────────────────────────────────
  { id: 'life_01', type: 'journal', title: lf('life01.title'), source: lf('life01.source'), content: lf('life01.content') },
  { id: 'life_02', type: 'inscription', title: lf('life02.title'), source: lf('life02.source'), content: lf('life02.content') },
  { id: 'life_03', type: 'rumeur', title: lf('life03.title'), source: lf('life03.source'), content: lf('life03.content') },
  { id: 'life_04', type: 'journal', title: lf('life04.title'), source: lf('life04.source'), content: lf('life04.content') },

  // ── L'EXTÉRIEUR ──────────────────────────────────────────────────────────
  { id: 'outside_01', type: 'datapad', title: lf('outside01.title'), source: lf('outside01.source'), content: lf('outside01.content') },
  { id: 'outside_02', type: 'rumeur', title: lf('outside02.title'), source: lf('outside02.source'), content: lf('outside02.content') },
  { id: 'outside_03', type: 'inscription', title: lf('outside03.title'), source: lf('outside03.source'), content: lf('outside03.content') },
  { id: 'outside_04', type: 'transmission', title: lf('outside04.title'), source: lf('outside04.source'), content: lf('outside04.content') },
  ]
}

export const LORE_TOTAL = getLoreFragments().length

export function getFragment(id: string): LoreFragment | undefined {
  return getLoreFragments().find(f => f.id === id)
}

export function getRandomUndiscoveredFragment(discovered: string[]): LoreFragment | null {
  const set = new Set(discovered)
  const available = getLoreFragments().filter(f => !set.has(f.id))
  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
}

export function getFragmentTypeLabels(): Record<LoreFragmentType, string> {
  return {
    journal:      lf('types.journal'),
    transmission: lf('types.transmission'),
    inscription:  lf('types.inscription'),
    datapad:      lf('types.datapad'),
    rumeur:       lf('types.rumeur'),
  }
}

export const FRAGMENT_TYPE_COLORS: Record<LoreFragmentType, string> = {
  journal:      'var(--cyan)',
  transmission: 'var(--green)',
  inscription:  'var(--text-dim)',
  datapad:      'var(--gold)',
  rumeur:       'var(--purple)',
}

import type { GameState } from '../types'

// ── SEEDING EARLY PILIERS (5.2) ───────────────────────────────────────────────
// Rumeurs entendues à l'arrivée, jours 3-8, mentionnant les détenteurs de
// fragments par leur nom. Prépare le joueur au système Nexus sans rien forcer.

interface PillarRumor {
  id: string
  pillar: string
  text: string
}

const PILLAR_RUMORS: PillarRumor[] = [
  { id: 'rum-cesarion-1', pillar: 'cesarion',
    text: "Rumeur de dock : « Cesarion ne quitte jamais son trône de ferraille. On dit qu'il garde un Fragment du Nexus sous son fauteuil — et qu'il tue ceux qui le regardent de trop près. »" },
  { id: 'rum-raphazarus-1', pillar: 'raphazarus',
    text: "Un contrebandier baisse la voix : « Raphazarus envoie ses guerriers contre quiconque touche aux Fragments. Si tu cherches le Nexus, il finira par te chercher, lui. »" },
  { id: 'rum-eliotis-1', pillar: 'eliotis',
    text: "Une archiviste griffonne dans son carnet : « Eliotis collectionne les vérités plus que l'or. Apporte-lui un fragment de lore et elle t'ouvrira des portes que personne d'autre ne connaît. »" },
  { id: 'rum-maxance-1', pillar: 'maxance',
    text: "Deux mercenaires parlent bas : « Maxance préfère brûler un secret plutôt que de le partager. Méfie-toi — ce qu'il détruit, personne ne le revoit. »" },
  { id: 'rum-alanossa-1', pillar: 'alanossa',
    text: "Une marchande te dévisage : « Alanossa tient l'Arc Ouest d'une main de fer. On murmure qu'elle garde l'un des Fragments du Nexus. Reste en bons termes avec elle… ou pas du tout. »" },
  { id: 'rum-scotty-1', pillar: 'scotty',
    text: "Un pilote ivre rigole : « Scotty ? Ce vieux renard du Golden North vendrait sa mère pour un bon deal. Même un Fragment du Nexus, si le prix est juste. »" },
  { id: 'rum-cesarion-2', pillar: 'cesarion',
    text: "Graffiti frais sur une cloison : 'CESARION VEILLE'. Quelqu'un a ajouté dessous, à la hâte : 'et il sait pour les Fragments'." },
  { id: 'rum-alanossa-2', pillar: 'alanossa',
    text: "Un enfant des couloirs récite une comptine : « Alanossa, Alanossa, qui trahit la paie deux fois… » Il s'enfuit avant que tu poses la moindre question." },
]

// Renvoie une rumeur non encore entendue, uniquement jours 3-8, ~50% de chance.
export function rollPillarRumor(gs: GameState): { text: string; rumorId: string } | null {
  if (gs.day < 3 || gs.day > 8) return null
  if (Math.random() > 0.5) return null
  const seen = new Set(gs.pillarRumorsSeen ?? [])
  const available = PILLAR_RUMORS.filter(r => !seen.has(r.id))
  if (available.length === 0) return null
  const chosen = available[Math.floor(Math.random() * available.length)]
  return { text: `👁 ${chosen.text}`, rumorId: chosen.id }
}

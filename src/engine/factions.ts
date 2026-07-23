import type { Faction, FactionId, GameState } from '../types'

export const FACTIONS: Faction[] = [
  {
    id: 'faucons', name: 'Les Faucons Noirs', color: '#2040ff',
    description: "Pirates organisés. Discipline militaire. Alanossa à leur tête. Rejoindre c'est choisir le bord de l'ombre.",
    bonus: "Accès aux zones pirates sans combat · +20% crédits sur butin · Armes à prix réduit",
  },
  {
    id: 'emporium', name: "L'Emporium", color: '#ffd700',
    description: "Alliance de marchands. La monnaie est leur loi. Légal en façade. Tout le reste se discute.",
    bonus: "-15% sur tous les achats · Prix exclusifs · Réseau commercial étendu",
  },
  {
    id: 'gardiens', name: 'Les Gardiens Écarlates', color: '#ff4040',
    description: "Ordre de guerriers-paladins. Justice draconienne. Pas de nuances, pas de pitié.",
    bonus: "+50% rép sur actes héroïques · Accès zones militaires · Équipement d'élite",
  },
  {
    id: 'culte', name: 'Le Culte du Vide', color: '#a040ff',
    description: "Mystiques de l'espace profond. Leurs rituels fonctionnent — personne ne sait pourquoi.",
    bonus: "Événements WTF amplifiés · Artefacts accessibles · Visions de l'avenir (infos gratuites)",
  },
]

export const FACTION_MAP: Record<FactionId, Faction | null> = {
  none:     null,
  faucons:  FACTIONS[0],
  emporium: FACTIONS[1],
  gardiens: FACTIONS[2],
  culte:    FACTIONS[3],
}

export function getFaction(id: FactionId): Faction | null {
  return FACTION_MAP[id]
}

export function getBuyDiscount(gs: GameState): number {
  let disc = gs.class.buyDiscountPercent ?? 0
  if (gs.faction === 'emporium') disc += 15
  // Bonus réputation Emporium (stackable avec membership)
  const emporiumRep = gs.factionReputation?.emporium ?? 0
  if (emporiumRep >= 80)      disc += 15
  else if (emporiumRep >= 50) disc += 10
  else if (emporiumRep >= 20) disc += 5
  return disc
}

export function getFactionMissionReward(factionId: FactionId): { credits: number; rep: number } {
  switch (factionId) {
    case 'faucons':  return { credits: 1500, rep: 30 }
    case 'emporium': return { credits: 2000, rep: 20 }
    case 'gardiens': return { credits: 1000, rep: 50 }
    case 'culte':    return { credits: 800,  rep: 40 }
    default:         return { credits: 0, rep: 0 }
  }
}

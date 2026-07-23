import type { GameState, MajorQuest, MajorQuestCondition, MajorQuestStage } from '../types'

// ── VÉRIFICATION DE CONDITION ─────────────────────────────────────────────────

export function checkCondition(gs: GameState, cond: MajorQuestCondition): boolean {
  switch (cond.type) {
    case 'visitStation':  return gs.visitedStations.includes(cond.station)
    case 'visitStations': return gs.visitedStations.length >= cond.count
    case 'winCombatAt':   return gs.stationBossesBeaten.includes(cond.station)
    case 'meetNpc':       return gs.npcsMet.includes(cond.npcName)
    case 'hasFaction':    return gs.faction === cond.faction
    case 'hasReputation': return gs.reputation >= cond.min
    case 'hasCargo':      return (gs.cargo[cond.item] ?? 0) > 0
    case 'hasTag':        return gs.moralTags.includes(cond.tag)
    case 'bossKill':      return gs.stationBossesBeaten.some(s => {
      const BOSS_STATIONS: Record<string, string> = {
        'Arc Ouest Apocalypse': 'Alanossa', 'Le Nid des Faucons': 'La Faucon',
        'Station Ombre': 'Le Fantôme des Ombres', 'La Tanière': 'La Bête Noire',
        'Repaire Vega-Sud': 'La Veuve de Vega', 'La Forteresse Exilée': "L'Exilé Écarlate",
        'Station Quarantaine': 'Patient Zéro', 'Station Fantôme': "L'Ombre du Vide",
        'Port de Nuit': 'Le Roi de Nuit',
      }
      return BOSS_STATIONS[s] === cond.bossName
    })
  }
}

// ── AVANCEMENT D'ÉTAPE ────────────────────────────────────────────────────────

export function checkMajorQuestAdvancement(gs: GameState): { newGs: Partial<GameState>; messages: string[] } {
  const messages: string[] = []
  let majorQuests = [...gs.majorQuests]
  let credits = gs.credits
  let reputation = gs.reputation

  for (let qi = 0; qi < majorQuests.length; qi++) {
    const q = majorQuests[qi]
    if (q.completed || q.failed) continue
    const stage = q.stages[q.currentStage]
    if (!stage) continue

    if (checkCondition(gs, stage.condition)) {
      const reward = stage.reward
      if (reward?.credits) credits += reward.credits
      if (reward?.rep) reputation += reward.rep

      const nextStage = q.currentStage + 1
      const isComplete = nextStage >= q.stages.length

      majorQuests[qi] = { ...q, currentStage: nextStage, completed: isComplete }

      if (isComplete) {
        messages.push(`★★ QUÊTE MAJEURE ACCOMPLIE : ${q.title}`)
      } else {
        const nextStageDef = q.stages[nextStage]
        messages.push(`[${q.title}] Étape ${nextStage}/${q.stages.length} : ${nextStageDef?.title ?? ''}`)
        if (reward?.message) messages.push(reward.message)
      }
    }
  }

  return { newGs: { majorQuests, credits, reputation }, messages }
}

// ── CANACCÉDER À LA QUÊTE ─────────────────────────────────────────────────────

export function canStartMajorQuest(gs: GameState, quest: MajorQuest): boolean {
  if (gs.majorQuests.some(q => q.id === quest.id)) return false
  if (quest.requiresFaction && gs.faction !== quest.requiresFaction) return false
  if (quest.requiresReputation && gs.reputation < quest.requiresReputation) return false
  if (quest.requiresNpcMet && !gs.npcsMet.includes(quest.requiresNpcMet)) return false
  return true
}

// ── DÉFINITIONS DES QUÊTES MAJEURES ──────────────────────────────────────────

const stage = (id: string, title: string, description: string, objective: string,
  condition: MajorQuestCondition, reward?: MajorQuestStage['reward']): MajorQuestStage =>
  ({ id, title, description, objective, condition, reward })

export const MAJOR_QUESTS: MajorQuest[] = [

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. LA FILIÈRE NOIRE (Boro → Faucons Noirs)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'filiere_noire',
    title: 'La Filière Noire',
    giver: 'Boro',
    giverStation: 'Les Bas-Fonds de Vega',
    lore: "Boro ne te confie pas sa vie par sympathie. Il te confie une mission parce qu'il a besoin de quelqu'un d'extérieur — quelqu'un dont le nom ne figure sur aucune liste des Faucons. Encore.",
    currentStage: 0, completed: false, failed: false,
    stages: [
      stage('fn1', 'Le premier contact', "Boro a une livraison qui doit passer par le Relais Noir. Pas de questions. Prise en charge dans les 48h. Il te donne les coordonnées.", "Voyager au Relais Noir", { type: 'visitStation', station: 'Relais Noir' }, { credits: 400, message: "+400cr — Boro paye toujours l'avance." }),
      stage('fn2', 'Le contact sur place', "Setta au Relais Noir t'attend. Elle connaît ton nom — tu ne lui as pas dit. La livraison est acceptée sans inspection. Elle te donne une adresse : Station Ombre.", "Parler à Setta (visiter Relais Noir et rencontrer Setta)", { type: 'meetNpc', npcName: 'Setta' }, { message: "Setta note ton visage. Ce n'est pas la dernière fois." }),
      stage('fn3', "L'opération fantôme", "Station Ombre. Officiellement inexistante. Kross t'attend avec une mission simple : surveiller un transfert et ne pas intervenir. Sauf si ça tourne mal.", "Voyager à Station Ombre et rencontrer Kross", { type: 'meetNpc', npcName: 'Kross' }, { credits: 800, message: "+800cr. Kross est satisfait. Pour l'instant." }),
      stage('fn4', 'Le transfert sous tension', "Le transfert tourne mal. Des intercepteurs attaquent. Kross s'échappe. Toi, tu dois gérer.", "Gagner un combat à Station Ombre", { type: 'winCombatAt', station: 'Station Ombre' }, { rep: 15, message: "Tu as prouvé quelque chose. +15 rép." }),
      stage('fn5', 'Le rapport à Boro', "Retour aux Bas-Fonds. Boro a besoin d'entendre ce qui s'est passé. Il a besoin de savoir si tu es quelqu'un sur qui il peut compter.", "Retourner aux Bas-Fonds de Vega", { type: 'visitStation', station: 'Les Bas-Fonds de Vega' }),
      stage('fn6', 'La vérité sur la filière', "Boro te révèle que toute cette opération était un test des Faucons Noirs. Tu travaillais pour Alanossa sans le savoir. Maintenant tu as le choix.", "Rejoindre les Faucons Noirs ou refuser", { type: 'hasFaction', faction: 'faucons' }, { credits: 8000, rep: 40, message: "★★ La Filière Noire accomplie. +8000cr, +40 rép. Les Faucons Noirs t'ont évalué." }),
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. L'HÉRITAGE DE VELKOR (Ysla → enquête archéologique)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'heritage_velkor',
    title: "L'Héritage de Velkor",
    giver: 'Ysla',
    giverStation: 'Les Abysses de Velkor',
    lore: "Velkor n'était pas un scientifique. C'est ce qu'Ysla a compris après des mois dans les ruines de sa station. Ce qu'il était vraiment est enfoui dans des archives que personne n'a osé lire entièrement.",
    currentStage: 0, completed: false, failed: false,
    requiresReputation: 20,
    stages: [
      stage('hv1', "Les premières pistes", "Ysla a trouvé des fragments dans les niveaux inférieurs des Abysses. Elle a besoin que tu explores plus profond qu'elle ne peut y aller seule.", "Explorer Les Abysses de Velkor (profondeur 3)", { type: 'winCombatAt', station: 'Les Abysses de Velkor' }, { credits: 600, message: "+600cr. Ysla note tes méthodes." }),
      stage('hv2', "Le Berceau", "Les fragments pointent vers Le Berceau — une station ancienne qui aurait servi d'origine à quelque chose. Ysla n'y est jamais allée. Elle t'envoie à sa place.", "Voyager au Berceau et en explorer les archives", { type: 'meetNpc', npcName: 'Archiviste Zal' }, { credits: 1200, message: "+1200cr. Archiviste Zal détient des pièces du puzzle." }),
      stage('hv3', "Les données de Lira", "Archiviste Zal a des archives chiffrées qu'il ne peut pas ouvrir. Lira à Nexus Aldara pourrait — si tu la convaincs.", "Aller sur Nexus Aldara et parler à Lira", { type: 'meetNpc', npcName: 'Lira' }, { message: "Lira accepte à contrecœur. Elle a ses propres questions sur Velkor." }),
      stage('hv4', "Les gardiens de la vérité", "Quelqu'un ne veut pas que ces archives soient ouvertes. Des agents ont été envoyés pour t'arrêter. Ils savent où tu es.", "Survivre à une attaque (gagner un combat à Nexus Aldara)", { type: 'winCombatAt', station: 'Nexus Aldara' }, { rep: 20, credits: 2000, message: "+2000cr, +20 rép. Tu as leur attention maintenant." }),
      stage('hv5', "La révélation finale", "Retour aux Abysses avec les données déchiffrées. Velkor n'était pas seulement un scientifique — il cartographiait quelque chose que personne n'était censé trouver. Le rapport final à Ysla.", "Retourner aux Abysses et retrouver Ysla", { type: 'visitStation', station: 'Les Abysses de Velkor' }),
      stage('hv6', "L'affrontement final", "Ceux qui protègent le secret de Velkor arrivent en personne. Ysla est en danger. Tu dois les arrêter.", "Vaincre le boss des Abysses de Velkor", { type: 'winCombatAt', station: 'Les Abysses de Velkor' }, { credits: 12000, rep: 50, message: "★★ L'Héritage de Velkor accompli. +12000cr, +50 rép, arme légendaire." }),
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. LA VENGEANCE D'OSSIAN (Torvak → réputation ≥ 30)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'vengeance_ossian',
    title: "La Vengeance d'Ossian",
    giver: 'Torvak',
    giverStation: 'Fort Kharos',
    lore: "Frère Ossian le Dernier avait des élèves. Ils n'ont pas accepté sa mort. Torvak les connaît. Il connaît aussi ce qu'ils préparent.",
    currentStage: 0, completed: false, failed: false,
    requiresReputation: 30,
    stages: [
      stage('vo1', "Le dossier Ossian", "Torvak t'explique la situation : trois héritiers d'Ossian préparent des représailles contre quiconque a eu un rôle dans sa mort — y compris toi si tu as croisé leur chemin. Il faut les neutraliser avant.", "Écouter Torvak (visiter Fort Kharos)", { type: 'visitStation', station: 'Fort Kharos' }, { message: "Torvak te confie des noms. Des stations. Des méthodes." }),
      stage('vo2', "Le premier héritier", "Le premier héritier d'Ossian opère depuis Fort Ossian — il a retourné une partie de la garnison à sa cause. Orva peut t'aider à l'identifier.", "Aller à Fort Ossian, rencontrer Orva", { type: 'meetNpc', npcName: 'Orva' }, { credits: 1500, message: "+1500cr. Orva t'indique le premier héritier." }),
      stage('vo3', "La purge de Fort Ossian", "Le premier héritier doit être arrêté. Il n'abdiquera pas volontairement.", "Gagner un combat à Fort Ossian", { type: 'winCombatAt', station: 'Fort Ossian' }, { rep: 20, credits: 2000, message: "+2000cr, +20 rép. Un héritier de moins." }),
      stage('vo4', "Le deuxième héritier", "Le deuxième a rallié des forces à La Forteresse Exilée. Keln t'a peut-être des informations — il connaît les réseaux des anciens Gardiens.", "Visiter La Forteresse Exilée et parler à Keln", { type: 'meetNpc', npcName: 'Keln' }, { credits: 1000, message: "+1000cr. Keln a ses propres raisons de vouloir ça réglé." }),
      stage('vo5', "La Forteresse Exilée", "Le deuxième héritier est retranché. La confrontation est inévitable.", "Vaincre le boss de La Forteresse Exilée", { type: 'winCombatAt', station: 'La Forteresse Exilée' }, { rep: 25, credits: 3000, message: "+3000cr, +25 rép. Deux héritiers." }),
      stage('vo6', "Le rapport à Torvak", "Retour à Fort Kharos. Le dernier héritier s'est rendu — ou a disparu. Torvak a besoin d'entendre ce qui s'est passé.", "Revenir à Fort Kharos", { type: 'visitStation', station: 'Fort Kharos' }, { credits: 10000, rep: 45, message: "★★ La Vengeance d'Ossian accomplie. +10000cr, +45 rép. Les Gardiens ont une dette envers toi." }),
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. LA COURONNE ET LE VIDE (Ulmo → faction Emporium OU rép ≥ 50)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'couronne_vide',
    title: 'La Couronne et le Vide',
    giver: 'Ulmo',
    giverStation: "La Couronne d'Eos",
    lore: "Quelqu'un à La Couronne d'Eos transmet des informations à Alanossa. Ulmo ne peut pas mener l'enquête lui-même — trop visible. Toi, tu es parfait : assez compétent pour réussir, assez étranger pour ne pas être suspect.",
    currentStage: 0, completed: false, failed: false,
    requiresFaction: 'emporium',
    stages: [
      stage('cv1', "La mission d'Ulmo", "Ulmo te confie que des décisions prises à La Couronne arrivent aux oreilles d'Alanossa avant même d'être votées. Le traître est haut placé. Il te faut des preuves.", "Rencontrer Ulmo (visiter La Couronne d'Eos)", { type: 'visitStation', station: "La Couronne d'Eos" }, { message: "Ulmo te donne un premier indice : l'information passe par le Club Privé." }),
      stage('cv2', "L'infiltration du Club", "Le Club Privé Éos est le seul endroit où le traître peut transmettre discrètement. Sael, le maître d'hôtel, voit tout — mais il ne parle pas gratuitement.", "Visiter le Club Privé Éos et parler à Sael", { type: 'meetNpc', npcName: 'Sael' }, { credits: 2000, message: "+2000cr. Sael a vu quelque chose. Il te dit ce qu'il peut." }),
      stage('cv3', "Lady Sonn sait", "Un des noms que Sael a mentionné fréquente la Résidence Orbitale. Lady Sonn, qui y vit depuis trente ans, connaît tout le monde. Elle peut identifier.", "Parler à Lady Sonn à la Résidence Orbitale", { type: 'meetNpc', npcName: 'Lady Sonn' }, { message: "Lady Sonn te donne un nom. Elle a l'air soulagée de le dire à quelqu'un." }),
      stage('cv4', "Les agents du traître", "Le traître a appris qu'une enquête est en cours. Des agents ont été envoyés pour interrompre l'investigation.", "Survivre à l'attaque (gagner un combat à La Couronne d'Eos)", { type: 'winCombatAt', station: "La Couronne d'Eos" }, { rep: 25, credits: 3000, message: "+3000cr, +25 rép. Le traître est acculé." }),
      stage('cv5', "La confrontation finale", "Le traître tente de fuir vers Scotty Golden North. Tu dois l'intercepter.", "Gagner un combat à Scotty Golden North", { type: 'winCombatAt', station: 'Scotty Golden North' }, { message: "Le traître est neutralisé. Les preuves sont sécurisées." }),
      stage('cv6', "Le rapport à Ulmo", "Retour à La Couronne. Ulmo attend. La question est : que faire de ces preuves ?", "Retourner à La Couronne d'Eos", { type: 'visitStation', station: "La Couronne d'Eos" }, { credits: 15000, rep: 60, message: "★★ La Couronne et le Vide accomplie. +15000cr, +60 rép. Alanossa a perdu une source précieuse." }),
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. LA ROUTE DES CENDRES (Murn → 8+ stations visitées)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'route_cendres',
    title: 'La Route des Cendres',
    giver: 'Murn',
    giverStation: 'Les Cendres',
    lore: "Murn a survécu à l'incendie. Il a vu ce que personne d'autre n'a vu : les flammes ne sont pas venues d'une panne. Elles sont venues de quelqu'un. Vingt ans plus tard, il veut savoir qui.",
    currentStage: 0, completed: false, failed: false,
    requiresReputation: 0,
    stages: [
      stage('rc1', "L'incendie et ses témoins", "Murn te confie ses soupçons : l'incendie des Cendres était délibéré. Il a gardé un fragment de la structure originale — quelqu'un peut l'analyser.", "Rencontrer Murn aux Cendres", { type: 'meetNpc', npcName: 'Murn' }, { message: "Murn te donne le fragment. 'Trouve qui a fait ça.'" }),
      stage('rc2', "L'analyse de Docta", "Station Quarantaine abrite Docta — un médecin qui a aussi analysé des matériaux inhabituels par le passé. Il peut identifier l'origine du fragment.", "Aller à Station Quarantaine, parler à Docta", { type: 'meetNpc', npcName: 'Docta' }, { credits: 800, message: "+800cr. Docta identifie une signature chimique rare — industrielle." }),
      stage('rc3', "La piste industrielle", "La signature pointe vers La Raffinerie ou La Forge Noire. Brenn à La Raffinerie pourrait reconnaître le composant.", "Aller à La Raffinerie, parler à Brenn", { type: 'meetNpc', npcName: 'Brenn' }, { message: "Brenn reconnaît le composant. Il a l'air mal à l'aise. 'C'est vieux ça. Vraiment vieux.'" }),
      stage('rc4', "Ceux qui protègent le secret", "Brenn a lâché un nom avant de se fermer. Ce nom mène à L'Épave Vivante — et à ceux qui y planquent des archives depuis vingt ans.", "Gagner un combat à L'Épave Vivante", { type: 'winCombatAt', station: "L'Épave Vivante" }, { rep: 20, credits: 2500, message: "+2500cr, +20 rép. Les archives sont récupérées." }),
      stage('rc5', "Le commanditaire", "Les archives révèlent que l'incendie a été commandité depuis Port de Nuit — le Roi de Nuit d'alors avait des raisons. Il faut confronter l'actuel.", "Vaincre le boss de Port de Nuit", { type: 'winCombatAt', station: 'Port de Nuit' }, { credits: 4000, message: "+4000cr. La chaîne de commandement remonte à la surface." }),
      stage('rc6', "La vérité à Murn", "Retour aux Cendres. Murn attend depuis vingt ans. Il mérite la vérité — même si elle est plus compliquée qu'il ne l'imaginait.", "Retourner aux Cendres", { type: 'visitStation', station: 'Les Cendres' }, { credits: 9000, rep: 40, message: "★★ La Route des Cendres accomplie. +9000cr, +40 rép. Murn peut enfin partir d'ici." }),
    ],
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // 6. CARNAGE CONTRÔLÉ (Vix → bossesDefeated ≥ 1, rép ≥ 0)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'carnage_controle',
    title: 'Carnage Contrôlé',
    giver: 'Vix',
    giverStation: 'La Carcasse',
    lore: "Vix est ce qu'on appelle un fixeur indépendant — pas d'affiliation, pas de loyauté, juste du travail propre. Ce qu'il te propose est loin d'être propre : un contrat anonyme pour décapiter les quatre factions du secteur. Simultanément. Le commanditaire reste dans l'ombre. Le tarif, lui, est réel.",
    currentStage: 0, completed: false, failed: false,
    requiresReputation: 0,
    stages: [
      stage('cc1', 'La proposition de Vix',
        "Vix t'attend à La Carcasse avec une enveloppe scellée. Un contrat : quatre factions, quatre chefs, quatre morts. Ordre libre. Paiement à l'issue. Il te donne des coordonnées et une phrase : 'Tu n'as pas besoin de savoir pourquoi. Tu as juste besoin d'être meilleur qu'eux.'",
        "Parler à Vix à La Carcasse",
        { type: 'visitStation', station: 'La Carcasse' },
        { credits: 2000, message: "+2000cr — avance de Vix. Il te regarde partir sans un mot." }),

      stage('cc2', "Alanossa — Faucons Noirs",
        "Arc Ouest Apocalypse. Territoire d'Alanossa. Elle dirige les Faucons Noirs depuis cette station — tout le réseau passe par elle. Tu dois aller là-bas et finir ce qui a commencé.",
        "Vaincre Alanossa à Arc Ouest Apocalypse",
        { type: 'winCombatAt', station: 'Arc Ouest Apocalypse' },
        { credits: 5000, rep: 20, message: "+5000cr, +20 rép. Les Faucons Noirs sont en état de choc. Un chef ça ne se remplace pas vite." }),

      stage('cc3', "Commandante Zara Sable — Gardiens Écarlates",
        "La Citadelle Écarlate. Commandante Zara Sable coordonne toutes les opérations militaires des Gardiens depuis ce bastion. Elle ne sortira pas d'elle-même — il faut entrer.",
        "Vaincre la Commandante Zara Sable à La Citadelle Écarlate",
        { type: 'winCombatAt', station: 'La Citadelle Écarlate' },
        { credits: 5000, rep: 20, message: "+5000cr, +20 rép. La Citadelle est silencieuse. Pour la première fois depuis des années." }),

      stage('cc4', "Le Négociant Fantôme — Emporium",
        "Emporium Requiem. Le chef de l'Emporium opère dans l'ombre depuis ce hub commercial. Personne ne sait son vrai nom. Vix t'a donné assez d'informations pour le trouver.",
        "Vaincre le Négociant Fantôme à Emporium Requiem",
        { type: 'winCombatAt', station: 'Emporium Requiem' },
        { credits: 6000, rep: 25, message: "+6000cr, +25 rép. L'Emporium s'effondre en interne. Les marchés sont en panique." }),

      stage('cc5', "Directeur Pale — Culte du Vide",
        "Les Abysses de Velkor. Le Directeur Pale contrôle le Culte depuis cette station perdue aux confins du secteur. Le voyage est long. Lui n'attend pas de visiteurs.",
        "Vaincre le Directeur Pale aux Abysses de Velkor",
        { type: 'winCombatAt', station: 'Les Abysses de Velkor' },
        { credits: 6000, rep: 25, message: "+6000cr, +25 rép. Quatre factions. Quatre chefs. Zéro regret." }),

      stage('cc6', "Le Compte est bon",
        "Vix t'attend à La Carcasse. Il a l'air de déjà savoir. Le commanditaire a envoyé le solde — il ne se manifeste pas en personne. Évidemment. Tu as fait quelque chose que personne n'avait jamais fait : décapiter tout le secteur en une seule run.",
        "Retourner à La Carcasse — collecter le solde",
        { type: 'visitStation', station: 'La Carcasse' },
        { credits: 30000, rep: 100, message: "★★ CARNAGE CONTRÔLÉ ACCOMPLI. +30000cr, +100 rép. Le secteur entier t'a entendu. Personne ne sait quoi faire de toi." }),
    ],
  },

]

// Récupère les quêtes majeures disponibles pour un NPC donné
export function getMajorQuestForNpc(gs: GameState, npcName: string): MajorQuest | null {
  const quest = MAJOR_QUESTS.find(q => q.giver === npcName)
  if (!quest) return null
  if (!canStartMajorQuest(gs, quest)) return null
  return quest
}

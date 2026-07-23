// Révélations de lore spécifiques à chaque PNJ nommé.
// Clé = id du PNJ (voir NAMED_NPCS dans npcTracker.ts).
// 65% de chance d'utiliser ces lignes à la place des lignes génériques de rôle.

export const NPC_LORE: Record<string, string[]> = {
  marek: [
    "Il tourne une pièce entre ses doigts sans te regarder. 'Cette station a brûlé deux fois. Ils l'ont reconstruite sans jamais demander pourquoi elle avait brûlé.' Il range la pièce.",
    "'Les Gardiens fouillent les sous-niveaux depuis trois semaines.' Il secoue la tête. 'Quand l'armée creuse en silence, c'est qu'ils ont perdu quelque chose qu'ils auraient pas dû perdre.'",
    "'Le Culte du Vide.' Il baisse la voix. 'Avant, c'était des fous dans des caves. Maintenant, j'ai vu des gens respectables les rejoindre discrètement. C'est ça qui inquiète.'",
  ],
  sela: [
    "Elle range des factures. 'L'Emporium contrôle maintenant deux routes sur trois dans ce secteur. Il y a cinq ans, c'était une sur cinq.' Elle sourit sans humour. 'Le marché se conquiert silencieusement.'",
    "'Les routes vers les zones profondes sont fermées, officiellement pour radiation.' Elle baisse la voix. 'Officieusement, quelqu'un ne veut pas qu'on trouve ce qu'il y a là-bas. Et ce quelqu'un a assez d'influence pour que personne ne pose de questions.'",
    "Elle glisse un document. 'Les Faucons et l'Emporium négocient en ce moment. Si ça aboutit, les indépendants comme toi et moi...' Elle trace un doigt sur sa gorge.",
  ],
  torvak: [
    "Il fixe un point derrière toi. 'J'ai servi sous trois commandants. Le premier croyait à l'ordre. Le deuxième à la justice. Le troisième ne croit à rien — c'est lui qui a survécu.' Il se tait.",
    "'La guerre des factions, il y a vingt ans.' Il parle lentement. 'Tout le monde blâme les Faucons. Mais l'Emporium a fourni les armes des deux côtés. Les Gardiens ont regardé. On a tous nos rôles.'",
    "Il te montre une cicatrice sur l'avant-bras. 'Velkor. Quelque chose dans les ruines profondes que le Directeur Pale surveille personnellement. J'ai vu des soldats partir en exploration ne jamais revenir. Personne ne pose de questions.'",
  ],
  lira: [
    "Elle ne lève pas les yeux de son écran. 'Le réseau de Nexus Aldara a été piraté il y a trois jours. Pas par moi. Quelqu'un cherchait des archives militaires — des coordonnées de zones profondes.' Un silence. 'Ils ont trouvé.'",
    "'Tu sais ce qu'est un Fragment Nexus ?' Elle te regarde enfin. 'Une clé. Mais pour quoi — les archives que j'ai cracké suggèrent que même ceux qui les ont construits ne sont plus sûrs de la réponse.'",
    "'Il y a un signal qui émerge des zones profondes depuis six mois. Régulier, codé, pas naturel.' Elle hausse les épaules. 'Personne ne veut l'admettre officiellement. Moi je l'enregistre.'",
  ],
  boro: [
    "Il regarde à gauche, puis à droite. 'Un pilote est passé hier, des zones profondes. Les yeux différents. Il m'a payé avec des crédits qui n'existent pas officiellement.' Il hausse les épaules. 'J'ai quand même pris.'",
    "'Le Culte du Vide paye bien. Très bien.' Il te fixe. 'Je pose pas de questions. Mais les trucs qu'ils achètent, c'est pas pour un culte religieux ordinaire.'",
    "'Y'a quelque chose qui se prépare.' Il dit ça simplement. 'Les gros acheteurs stockent. Les petits fuient. Moi j'attends de voir qui gagne.'",
  ],
  neva: [
    "Elle regarde le mur. 'Cette prison a été fermée officiellement il y a douze ans. Officiellement.' Elle indique les murs. 'Les inscriptions du niveau sept — les plus récentes datent de six mois. Quelqu'un était là. Quelqu'un qu'on voulait pas voir ailleurs.'",
    "'Y'a des gens qui cherchent à partir d'ici. Y'a des gens qui cherchent à y rester.' Elle te regarde. 'Les deuxièmes savent quelque chose que les premiers pas encore. J'ai décidé que la curiosité était trop dangereuse.'",
    "'Le Culte tient des réunions dans les sous-niveaux.' Elle hausse les épaules. 'Ici, on a arrêté de chasser les secrets. Ça prend trop d'énergie et ça attire trop d'ennuis.'",
  ],
  pistis: [
    "Il fait glisser quelque chose sur la table. 'L'Emporium Requiem a une liste noire. Des gens dont ils veulent contrôler les mouvements sans qu'ils le sachent.' Il sourit. 'Certaines personnes paient cher pour savoir si leur nom est dessus.'",
    "'Le marché des artefacts explose.' Il te regarde. 'Depuis que les zones profondes ont commencé à... produire des choses. Des choses que personne ne comprend encore. Certains acheteurs sont très patients.'",
  ],
  ganz: [
    "Il te parle sans te regarder. 'Les paris sur les factions ont changé. La nouvelle catégorie qui rapporte le plus, c'est Le Vide vainqueur. Ça fait réfléchir sur ce que les gens savent.'",
    "'Les riches qui fréquentent Star Quest ont commencé à acheter des propriétés dans les zones reculées. Les vraiment reculées.' Il sourit. 'Ils savent quelque chose. Ils partent pas encore. Mais ils se préparent.'",
  ],
  myrra: [
    "Elle te juge du regard avant de parler. 'Les Gardiens ont perdu trois postes avancés ce mois-ci. Officiellement, des défaillances techniques.' Elle marque une pause. 'Aucun des trois postes n'avait de problèmes signalés la veille.'",
    "'Quelqu'un recrute des soldats déserteurs dans ce secteur. Pas les Faucons — j'aurais su.' Elle te regarde. 'Ce niveau d'organisation, cette discrétion... ça ressemble au Culte. Mais le Culte ne recrute pas des soldats d'ordinaire.'",
  ],
  ysla: [
    "Elle t'explique sans pause. 'Les ruines des Abysses de Velkor ne sont pas ordinaires. La disposition des structures suggère une civilisation bien antérieure à ce que les archives officielles documentent.' Elle te regarde. 'Quelqu'un a effacé ça des archives. Délibérément.'",
    "'J'ai trouvé quelque chose ici.' Elle baisse la voix. 'Un fragment avec une inscription que je n'arrive pas à dater. Les matériaux non plus. Ça n'aurait pas dû exister à cette époque. Je l'ai caché — le Directeur Pale cherche exactement ce genre de chose.'",
  ],
  vance: [
    "Il regarde ses mains. 'La colonie a été fondée il y a trente ans. On nous a dit que c'était une zone vierge.' Il lève les yeux. 'J'ai trouvé des fondations sous la mienne. Vieilles. Très vieilles. Personne de la compagnie veut en parler.'",
    "'Les enfants entendent des choses la nuit, dans certaines zones de la colonie. On leur dit que c'est le vent.' Il secoue la tête. 'Ce secteur a une histoire qu'on nous a pas racontée.'",
  ],
  cael: [
    "Il ne dit rien pendant un moment. 'Alanossa prépare quelque chose de plus grand que les raids habituels.' Il te regarde. 'Je te dis pas quoi. Mais si t'as des dettes à régler dans ce secteur, règle-les avant la fin du mois.'",
    "'Tu connais Alanossa ?' Il sourit sans humour. 'Elle a survécu à trois tentatives d'assassinat et une guerre civile. Elle gouverne Arc Ouest Apocalypse pas parce qu'elle est forte — parce qu'elle est patiente. C'est plus dangereux.'",
  ],
  vosh: [
    "Il t'évalue. 'Les Faucons Noirs recrutent pas pour faire des raids. On construit quelque chose.' Il marque une pause. 'Alanossa a une vision. Ceux qui la comprennent avant les autres seront bien placés.'",
    "'Si tu croises un type nommé Scotty dans les zones profondes.' Il s'arrête. 'Non. Juste — si tu le croises, t'as rien à faire là-bas. Personne de sensé n'approche ce secteur.'",
  ],
}

// Rumeurs de piliers — injectées dans les dialogues génériques selon le jour de run
export const PILLAR_RUMORS: string[] = [
  // Alanossa
  "'Arc Ouest Apocalypse.' Un vieux pilote crache par terre. 'Alanossa contrôle chaque gramme de carburant qui rentre ou sort. Tu veux passer ? T'as intérêt à avoir une bonne raison — ou une bonne réputation.'",
  "'J'ai vu Alanossa une fois.' La femme parle sans lever les yeux. 'Petite. Calme. Le genre de calme qui t'indique que la personne a arrêté d'avoir peur il y a longtemps.'",
  // Cesarion
  "'Cesarion dirige l'Emporium depuis quinze ans.' L'homme remplit son verre. 'Pas le genre à agiter des armes. Il achète les gens avant qu'ils deviennent des problèmes. Intelligent, ou dangereux — difficile de distinguer.'",
  "'Si tu cherches à commercer en règle dans ce secteur, tôt ou tard tu passes devant Cesarion.' Le marchand hausse les épaules. 'Il est juste. Mais il oublie rien.'",
  // Eliotis
  "'Les Archives de Velkor.' Le vieil homme dit ça doucement. 'Eliotis y passe ses journées. Il dit qu'il cherche des réponses sur le Nexus. Les autres disent qu'il cherche quelque chose de bien plus ancien. Peut-être les deux.'",
  "'J'ai bossé pour Eliotis pendant deux ans.' Elle range ses outils. 'Il sait des choses. Des choses vieilles. Il les partage pas facilement — mais il les partage avec ceux qui méritent de les entendre.'",
  // Scotty
  "'Scotty.' Le pilote rit. 'Tout le monde le connait dans les zones profondes. Un fantôme. Apparaît quand il veut, disparaît pareil. Il sait des chemins qui existent pas sur les cartes officielles.'",
  "'On m'a dit de trouver Scotty si j'avais besoin d'un passage discret.' Le contrebandier baisse la voix. 'Je l'ai cherché six semaines. C'est lui qui m'a trouvé. Ça m'a refroidi.'",
]

export function getPillarRumor(): string {
  return PILLAR_RUMORS[Math.floor(Math.random() * PILLAR_RUMORS.length)]
}

export function getNpcLore(id: string): string[] | null {
  return NPC_LORE[id] ?? null
}

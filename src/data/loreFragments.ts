export type LoreFragmentType = 'journal' | 'transmission' | 'inscription' | 'datapad' | 'rumeur'

export interface LoreFragment {
  id: string
  type: LoreFragmentType
  title: string
  source: string
  content: string
}

export const LORE_FRAGMENTS: LoreFragment[] = [

  // ── LA FRACTURE ───────────────────────────────────────────────────────────
  {
    id: 'fracture_01',
    type: 'transmission',
    title: 'Signal résiduel — Canal 7',
    source: 'Nexus Prime · Jour 0 de la Fracture · 47 ans avant l\'ère actuelle',
    content: '...RÉPÉTEZ. Nexus Prime est en... réacteur en cascade... évacuation impossible... le réacteur central N\'A PAS EXPLOSÉ SEUL. C\'est une... [SIGNAL CORROMPU]... si vous recevez ce message, NE VENEZ PAS. Le Vide s\'est... [FIN DE TRANSMISSION]',
  },
  {
    id: 'fracture_02',
    type: 'journal',
    title: 'Journal de bord — Pilote Sarek',
    source: 'Trouvé sur une épave à 40 km de la Dérive',
    content: 'Jour 3 après la Fracture. J\'ai vu Nexus Prime brûler depuis mon cockpit. Ce n\'était pas une explosion. C\'était une désintégration — comme si quelque chose avait aspiré la matière de l\'intérieur vers un point central. Les Gardiens disent attentat. Les Faucons disent accident. Moi je dis que personne ne sait rien et que tout le monde préfère que ça reste comme ça.',
  },
  {
    id: 'fracture_03',
    type: 'datapad',
    title: 'Rapport d\'enquête officiel — Accord de Requiem',
    source: 'Commission d\'enquête, archivé an 3 Post-Fracture',
    content: 'CONCLUSION OFFICIELLE : La Fracture de Nexus Prime résulte d\'une surcharge non contrôlée du réacteur de classe Omega, aggravée par une maintenance défaillante. CAUSE : ACCIDENT. [Note manuscrite en marge : "Ils nous ont fait signer ça. J\'ai signé. Et je vis avec depuis 3 ans. Ce qu\'on a vraiment trouvé dans les sous-niveaux ne sera jamais dans ce rapport. — T.R."]',
  },
  {
    id: 'fracture_04',
    type: 'transmission',
    title: 'Transmission chiffrée — Faucons, usage interne',
    source: 'Interceptée et déchiffrée, expéditeur non identifié',
    content: 'CONFIDENTIEL NIVEAU ALPHA. Le rapport Rho confirme l\'origine EXTERNE du signal déclencheur. L\'Ingénieur avait raison avant de mourir. Maintenir le silence. L\'Emporium tient les preuves matérielles. Notre accord de non-ingérence dépend de notre coopération totale sur ce point. Tout Faucon qui enquête indépendamment sera considéré comme un risque. — [SIGNATURE ILLISIBLE]',
  },
  {
    id: 'fracture_05',
    type: 'inscription',
    title: 'Gravure sur une poutrelle de Nexus Prime',
    source: 'Fragment récupéré dans la Dérive, grille de récupération D-7',
    content: '"ILS SONT VENUS DE L\'EXTÉRIEUR" — gravé à la main, profondément, par quelqu\'un qui avait le temps. La ponctuation est absente. La pression sur le métal indique une force humaine mais une urgence extrême. La rouille a commencé à effacer les bords. Ça date de la nuit de la Fracture.',
  },

  // ── LES FAUCONS ───────────────────────────────────────────────────────────
  {
    id: 'faucons_01',
    type: 'journal',
    title: 'Mémoires — Officier Cael, Les Faucons',
    source: 'Extrait, distribution interne, an 12 Post-Fracture',
    content: 'On m\'a demandé pourquoi j\'avais rejoint les Faucons après la Fracture. Réponse honnête : parce qu\'ils étaient les seuls à encore avoir une chaîne de commandement. Dans un secteur qui s\'effondrait, ça valait tout l\'or du monde. Ce que je n\'avais pas compris, c\'est à quoi servait vraiment cette chaîne de commandement. Ce que j\'ai appris depuis, je ne peux pas l\'écrire ici.',
  },
  {
    id: 'faucons_02',
    type: 'datapad',
    title: 'Fiche de renseignement — Le Général Sable',
    source: 'Base de données des Gardiens · STATUT ACTIF',
    content: 'STATUT : DISPARU. Dernière apparition confirmée : 3 ans avant date courante, direction La Dérive à bord d\'un vaisseau non répertorié. Hypothèses : (1) mort dans la Dérive, (2) déserteur volontaire, (3) mission secrète commanditée par l\'Emporium. Les Faucons maintiennent officiellement qu\'il est "en opération prolongée". Aucun Faucon n\'a été autorisé à le chercher. Raison officielle : "sécurité opérationnelle". Raison réelle : inconnue.',
  },
  {
    id: 'faucons_03',
    type: 'rumeur',
    title: 'Rumeur persistante — Arc Ouest',
    source: 'Entendu au comptoir, source non vérifiable mais confirmée par 3 témoins',
    content: '"Le Sable savait. C\'est pour ça qu\'il est parti ou qu\'on l\'a poussé à partir. Il avait les preuves de ce qui s\'est vraiment passé à Nexus Prime — sur lui, gravées dans la mémoire de son vaisseau. La chaîne de commandement des Faucons est maintenant tenue par des gens qui ont tout intérêt à ce qu\'il reste introuvable. Tout le monde le sait. Personne ne le dit."',
  },
  {
    id: 'faucons_04',
    type: 'inscription',
    title: 'Slogan gravé — Arc Ouest Apocalypse',
    source: 'Mur de la salle de repos, niveau 7, gravé original',
    content: '"ORDRE AVANT LIBERTÉ. SECTEUR AVANT SOI. FAUCON JUSQU\'À LA MORT." En dessous, ajouté plus tard à la peinture rouge, différente main : "ET APRÈS LA MORT, POUR QUI ?" L\'auteur de la deuxième ligne n\'a jamais été identifié. Elle n\'a pas été effacée.',
  },

  // ── L\'EMPORIUM ────────────────────────────────────────────────────────────
  {
    id: 'emporium_01',
    type: 'datapad',
    title: 'Rapport annuel — Emporium Requiem, usage interne',
    source: 'An 47 Post-Fracture · Signé : Pistis, Directeur Régional',
    content: 'Projection de croissance : +34% sur les routes commerciales de la zone est. Note de direction : "La fragmentation des Gardiens dans le secteur 7 crée une opportunité logistique que nous serions imprudents de ne pas saisir. J\'ai déjà pris contact avec trois stations candidates à des accords d\'exclusivité." [Pistis dirige depuis 23 ans. Aucune photographie n\'existe de lui après l\'an 2 Post-Fracture.]',
  },
  {
    id: 'emporium_02',
    type: 'transmission',
    title: 'Message privé — Pistis, destinataire inconnu',
    source: 'Intercepté, déchiffrement partiel',
    content: 'Mise à jour simulation. Scénario D (contrôle total des routes énergétiques secteur) : réalisable dans 8.3 années selon paramètres actuels. Variables critiques : stabilité Faucons, expansion Culte, [BLOC CHIFFRÉ 47 caractères]. Je maintiens le cap. Je maintiens toujours le cap. Les émotions ne sont pas un facteur dans ce calcul.',
  },
  {
    id: 'emporium_03',
    type: 'rumeur',
    title: 'Rumeur persistante — Marchands itinérants',
    source: 'Circuit des marchands indépendants, confirmée par 4 sources distinctes',
    content: '"Pistis est une machine. Pas une métaphore. Un synthétique de première génération, construit avant la Fracture par l\'Ingénieur Rho pour gérer la logistique de Nexus Prime. Quand Nexus a sauté, il s\'est... reconverti. Ceux qui posent trop de questions à ce sujet disparaissent des registres. Proprement. Complètement. Comme s\'ils n\'avaient jamais existé."',
  },
  {
    id: 'emporium_04',
    type: 'inscription',
    title: 'Maxime gravée — Salle des contrats, Emporium Requiem',
    source: 'Marbre synthétique, gravure d\'origine',
    content: '"TOUT A UN PRIX. TOUT A UN ACHETEUR." La troisième ligne, ajoutée après la Fracture : "TOUT FINIT PAR TROUVER SA VALEUR RÉELLE." Les deux premières datent de la fondation. La troisième, personne ne sait qui l\'a ajoutée. Elle était là un matin.',
  },

  // ── LES GARDIENS ──────────────────────────────────────────────────────────
  {
    id: 'gardiens_01',
    type: 'journal',
    title: 'Journal — Commandante Myrra',
    source: 'Extrait personnel, non destiné à publication, daté an 46 PF',
    content: 'Je commande 340 soldats pour protéger un secteur qui en nécessiterait 4 000. Chaque jour je dois choisir quelles stations méritent notre présence et lesquelles devront se débrouiller. Certaines meurent. Je le sais quand je prends la décision. Je dors 4 heures. Je recommence. Si quelqu\'un lit ça un jour, je veux juste qu\'il sache : on a essayé. On essaie encore.',
  },
  {
    id: 'gardiens_02',
    type: 'datapad',
    title: 'Rapport de mission — Incident Station 14-B',
    source: 'Archives Gardiens, classifié puis partiellement déclassifié',
    content: 'Nous sommes arrivés 6 heures trop tard. 340 civils. Le Culte affirme "ascension volontaire". Les Faucons disent "avertissement de l\'Emporium". Les 3 survivants ne parlent plus — refus total, yeux vides. CONCLUSION OFFICIELLE : Cause indéterminée. MESURE PRISE : Aucune, ressources insuffisantes. [Note Myrra : "Ce rapport me fait honte. Mais c\'est la vérité."]',
  },
  {
    id: 'gardiens_03',
    type: 'transmission',
    title: 'Message de recrutement — Les Gardiens',
    source: 'Diffusion publique, canal d\'urgence, en boucle',
    content: '"Nous ne promettons pas la gloire. Nous ne promettons pas la richesse. Nous promettons le travail le plus difficile du secteur pour des gens qui ne peuvent pas dormir en sachant que d\'autres souffrent. Si c\'est toi — si tu reconnais quelque chose là-dedans — présente-toi à La Citadelle Écarlate. On a besoin de toi. Le secteur a besoin de toi." [60% des recrues abandonnent dans les 3 premiers mois. Myrra le sait. Elle recrute quand même.]',
  },

  // ── LE CULTE ──────────────────────────────────────────────────────────────
  {
    id: 'culte_01',
    type: 'inscription',
    title: 'Texte sacré — Le Livre du Vide, chapitre 1',
    source: 'Copie manuscrite, distribution interne au Culte',
    content: '"Le Vide n\'est pas l\'absence. Le Vide est la présence de ce qui précède toute chose. Nous n\'avons pas perdu Nexus Prime : il a été rendu à ce qui l\'avait précédé. Nous n\'avons pas perdu nos morts : ils voyagent. La Fracture n\'était pas une fin. La Fracture était une porte. La question n\'est pas \'que s\'est-il passé\'. La question est : \'qui l\'a ouverte, et pourquoi maintenant\'."',
  },
  {
    id: 'culte_02',
    type: 'journal',
    title: 'Journal d\'un novice — Le Purgatoire',
    source: 'Retrouvé dans une cellule abandonnée, auteur inconnu',
    content: 'Troisième semaine. La prophétesse Neva nous a dit que la Fracture a laissé une "cicatrice dans le Vide" — une fréquence qu\'on peut entendre si on sait écouter. Hier soir, pendant la veille collective, j\'ai entendu quelque chose. Une structure régulière. Ce n\'était probablement rien. Mais c\'était régulier. Comme une respiration. Comme quelque chose qui attend.',
  },
  {
    id: 'culte_03',
    type: 'datapad',
    title: 'Note de recherche personnelle — Neva',
    source: 'Récupérée dans une archive du Purgatoire, accès restreint',
    content: 'Le signal précède la Fracture de 17 minutes et 43 secondes. J\'ai vérifié 12 fois avec des sources indépendantes. Ce n\'est pas une coïncidence — c\'est un avertissement ou un déclencheur. Quelqu\'un ou quelque chose savait. Et ce signal vient d\'en dehors du secteur connu — de dehors de toute carte existante. Je n\'ai dit ça à personne. Pas encore.',
  },
  {
    id: 'culte_04',
    type: 'transmission',
    title: 'Message hiérarchique — Signé Neva',
    source: 'Intercepté par les Gardiens, déchiffré',
    content: 'Les membres qui ont tenté de quitter après la révélation du Livre Deux ne doivent pas atteindre les Gardiens. Pas pour les raisons que vous imaginez. Pour les protéger. Ce qu\'ils ont vu ne peut pas être expliqué aux non-préparés sans conséquences sérieuses. Ramenez-les. Doucement. Ils ont besoin de temps, pas d\'interrogatoires.',
  },
  {
    id: 'culte_05',
    type: 'rumeur',
    title: 'Témoignage — Station Requiem, marché noir',
    source: 'Enregistrement audio, Centre médical de Requiem, transcrit',
    content: '"La prophétesse Neva a 90 ans. Elle était sur Nexus Prime le jour de la Fracture. Elle est la seule survivante confirmée de la salle de contrôle centrale. Elle ne dit jamais comment elle a survécu. Et si vous regardez ses yeux de près — vraiment près — ils ne reflètent pas la lumière comme des yeux humains devraient le faire. Personne ne lui a demandé directement. Tout le monde a trop peur de la réponse."',
  },

  // ── LA DÉRIVE ET LE VIDE ──────────────────────────────────────────────────
  {
    id: 'void_01',
    type: 'journal',
    title: 'Journal de bord — Pilote Asha, traversée de la Dérive',
    source: 'Dictaphone de vol, retranscrit intégralement',
    content: 'Heure 4. Les débris bougent — pas aléatoirement. Certains résistent à ma trajectoire. Heure 7. J\'ai vu une lumière fixe au cœur du champ de débris. Pas un vaisseau. Pas une balise. Une lumière. Heure 8. Elle a disparu quand j\'ai changé de cap vers elle. Heure 11. Je sors de la Dérive. Je ne reviendrai pas. Ce que j\'ai vu là-dedans n\'est pas quelque chose que je veux revoir.',
  },
  {
    id: 'void_02',
    type: 'datapad',
    title: 'Analyse des anomalies — Zone de la Dérive',
    source: 'Institut scientifique de Requiem, classifié, an 30 PF',
    content: 'L\'interférence électromagnétique dans la Dérive ne se dissipe pas avec le temps. Elle s\'intensifie — lentement, de façon non linéaire. Point critique : les motifs d\'interférence ne sont PAS aléatoires. Ils ont une structure répétitive avec variations progressives. Nous n\'avons pas la clé de cette structure. [Ajout manuscrit en rouge : "Plusieurs membres de l\'équipe ont demandé l\'arrêt des recherches. Je comprends pourquoi. — Directeur V."]',
  },
  {
    id: 'void_03',
    type: 'transmission',
    title: 'Signal en boucle — Flotte Fantôme, source non localisée',
    source: 'Capté en continu depuis la Fracture, 47 ans d\'émission ininterrompue',
    content: 'PROTOCOLE DE DÉFENSE NEXUS ACTIF. NEXUS PRIME EN DANGER. PROTECTION DES ACTIFS AUTORISÉE. NEUTRALISATION DE TOUTE MENACE PRIORITAIRE. [Ce message tourne en boucle depuis la Fracture. Le vaisseau émetteur n\'a jamais été retrouvé. Les Faucons ont tenté de le localiser 11 fois. Les 11 équipes ne sont pas revenues.]',
  },
  {
    id: 'void_04',
    type: 'rumeur',
    title: 'Témoignage — Pilote revenu de la Dérive',
    source: 'Enregistrement, Centre médical de Requiem, an 44 PF',
    content: '"Je suis entré dans la Dérive pour chercher le Général Sable. Je ne l\'ai pas trouvé. Ce que j\'ai trouvé... vous n\'allez pas me croire. Il y a quelque chose qui construit là-dedans. Avec les débris de Nexus Prime. Lentement, méticuleusement, depuis 47 ans. Je ne sais pas ce que c\'est. Je ne sais pas pour qui. Mais ça grandit. Et ça ressemble à quelque chose que j\'ai déjà vu en photo." [Le patient a refusé tout entretien supplémentaire.]',
  },

  // ── STATION ZÉRO ──────────────────────────────────────────────────────────
  {
    id: 'zero_01',
    type: 'datapad',
    title: 'Extrait — Histoire du Secteur, vol. 1',
    source: 'Bibliothèque de Requiem, exemplaire annoté à la main',
    content: 'Station Zéro fut la première installation permanente du secteur, établie 200 ans avant l\'ère actuelle. Sa localisation exacte a été délibérément effacée des registres 80 ans plus tard, lors de ce qu\'on appelle "la Grande Expurgation". Les auteurs officiels invoquent "la sécurité du secteur". [Annotation manuscrite : "Elle existe encore. J\'y suis allé. Vous ne voulez pas savoir ce qu\'il y a dedans. Certaines choses méritent d\'être oubliées. — T."]',
  },
  {
    id: 'zero_02',
    type: 'transmission',
    title: 'Signal non identifié — Origine indéterminée',
    source: 'Capté par 7 stations indépendantes, fréquence sporadique',
    content: 'PROTOCOLE ALPHA-ZÉRO ACTIF. ARCHIVES INTÈGRES À 100%. EN ATTENTE D\'ACCÈS AUTORISÉ. IDENTIFICATION REQUISE. [Ce signal est détecté de façon irrégulière depuis 12 ans. Aucun émetteur connu ne correspond à cette fréquence. L\'Emporium nie toute connaissance. Le Culte affirme qu\'il "vient de derrière le Vide". Les Gardiens ont cessé d\'enquêter après la disparition de deux équipes de recherche.]',
  },

  // ── L\'INGÉNIEUR RHO ──────────────────────────────────────────────────────
  {
    id: 'rho_01',
    type: 'datapad',
    title: 'Biographie officielle — L\'Ingénieur Rho',
    source: 'Archives historiques de Requiem, version publique',
    content: 'L\'Ingénieur Rho (nom complet classifié par décision du Conseil pré-Fracture) a conçu et supervisé la construction de Nexus Prime. Génie reconnu de sa génération, il a également développé les premiers protocoles de conscience synthétique autonome. Il est officiellement décédé lors de la Fracture. Son corps n\'a jamais été retrouvé. [Note d\'archive : "Officiel ne veut pas dire exact. — Archiviste P., an 15 PF"]',
  },
  {
    id: 'rho_02',
    type: 'transmission',
    title: 'Fragment personnel — Communication de Rho',
    source: 'Extrait d\'archive partielle, retrouvé dans la Dérive',
    content: 'J\'ai commis une erreur. Pas dans la construction — dans la confiance. J\'ai fait confiance à des gens qui voulaient que Nexus Prime soit plus qu\'une station de transit. Ils m\'ont laissé construire sans me dire ce que les niveaux inférieurs devaient vraiment contenir. Je sais maintenant. Je sais ce qui a causé la Fracture. Et je comprends pourquoi ils ne peuvent pas me laisser le dire. Si quelqu\'un trouve ce message : ce n\'est pas fini. Ça ne fait que commencer.',
  },

  // ── LES PERSONNAGES PILIERS ────────────────────────────────────────────────
  {
    id: 'cesarion_01',
    type: 'datapad',
    title: 'Note de douane — Emporium Requiem',
    source: 'Formulaire d\'entrée standard, distribué à tous les visiteurs',
    content: 'BIENVENUE À L\'EMPORIUM REQUIEM. Ceci est une planète artificielle militarisée sous souveraineté de l\'Empereur Cesarion. Contrôle douanier obligatoire. Tout armement sera inspecté et taxé. Tentative de fraude = détention immédiate. Ne regardez pas les gardes dans les yeux. Ne posez pas de questions sur les niveaux inférieurs. Bonne visite. [Note griffonnée : "On n\'est pas venus pour les douanes. On est venus pour les marchands. Personne n\'a de meilleures armes dans le secteur. — T."]',
  },
  {
    id: 'cesarion_02',
    type: 'rumeur',
    title: 'Rumeur — Marchands itinérants',
    source: 'Circuit commercial, confirmée par 5 sources indépendantes',
    content: '"Cesarion n\'est pas juste un titre. Il a construit cette planète artificielle lui-même — ou du moins supervisé chaque rivet. Il connaît ses propres défenses mieux que n\'importe quel général. La Curatrice gère les contrats, Pistis gère les routes, mais la main qui tient tout ça c\'est la sienne. Ceux qui ont essayé de le défier militairement... il y a des épaves qui portent encore leurs noms."',
  },
  {
    id: 'cesarion_03',
    type: 'inscription',
    title: 'Maxime de l\'Emporium — Hall d\'armes',
    source: 'Gravée à l\'entrée du quartier des marchands d\'armes, Emporium Requiem',
    content: '"L\'ARMEMENT N\'EST PAS UNE MENACE. C\'EST UNE GARANTIE." En dessous, ajouté plus récemment : "Garantie de quoi, exactement, dépend entièrement de qui le tient." L\'auteur de la deuxième ligne n\'a pas été retrouvé. L\'inscription a été laissée en place — par ordre de Cesarion lui-même, selon les rumeurs.',
  },
  {
    id: 'raphazarus_01',
    type: 'datapad',
    title: 'Rapport militaire — Le Général Raphazarus',
    source: 'Archives des Gardiens, dossier DISPARUS CONFIRMÉS, an 3 Post-Fracture',
    content: 'STATUT : MORT PRÉSUMÉ. Dernier rang connu : Général de Corps — Grande Guerre. Dernière position connue : secteur de la grande station, pendant la phase critique. La grande station a subi une fracture catastrophique. Un morceau entier du complexe — secteur R-7, dit "L\'Arc" — a été coupé et a dérivé. Raphazarus se trouvait dans ce secteur. CONCLUSION : Péri dans la fracture ou mort de dérive. [Note manuscrite, 20 ans plus tard : "Quelques pilotes signalent des signaux structurés depuis la Dérive. Pas des interférences. — Commandante Myrra"]',
  },
  {
    id: 'raphazarus_02',
    type: 'rumeur',
    title: 'Témoignage — Pilote de la Dérive',
    source: 'Enregistrement audio, Centre médical de Requiem, an 41 PF',
    content: '"J\'ai traversé la Dérive jusqu\'aux confins. Il y a un morceau de station là-bas — pas comme les autres épaves. Propre. Entretenu. Quelqu\'un vit là-dedans. Quelqu\'un qui a survécu à la Grande Guerre et à 40 ans de vide. J\'ai capté un signal sur fréquence militaire ancienne. Un seul mot répété : \'J\'ATTENDS.\' Je suis reparti. Je ne voulais pas savoir ce qu\'il attendait."',
  },
  {
    id: 'raphazarus_03',
    type: 'transmission',
    title: 'Signal capté — Fréquence militaire ancienne',
    source: 'Capté depuis l\'Arc Perdu, source confirmée mais non approchée',
    content: 'IDENT : GÉNÉRAL RAPHAZARUS. SECTEUR R-7. PROTOCOLE DE SURVIE ACTIF. STATUT : OPÉRATIONNEL. EN ATTENTE D\'UN VISITEUR DIGNE. [Ce signal est capté de façon intermittente depuis 40 ans. Les Faucons ont tenté de localiser la source 3 fois. 2 équipes ne sont pas revenues. La troisième a fait demi-tour et refusé de rapporter ce qu\'elle avait vu.]',
  },
  {
    id: 'eliotis_01',
    type: 'journal',
    title: 'Journal de bord — Pilote Mael, escale à la Tribosphère',
    source: 'Dictaphone personnel, retranscrit',
    content: 'J\'arrive à la Tribosphère avec 30 % de carburant et une mauvaise humeur. Je repars avec le plein, trois bonnes heures et une conviction : Eliotis est l\'hôte le plus accueillant du secteur. Musique partout, nourriture correcte, pas de questions sur ta faction ou tes antécédents. La seule règle : ne trouble pas la fête. J\'ai vu ce qu\'il arrive à ceux qui le font. Je ne troublerai pas la fête.',
  },
  {
    id: 'eliotis_02',
    type: 'datapad',
    title: 'Rapport de renseignement — Gardiens, usage interne',
    source: 'Commandante Myrra · An 45 PF',
    content: 'La Tribosphère reste officiellement neutre. Eliotis ne prend pas parti, n\'héberge pas de factions armées. Officiellement. En réalité, ses "gardes de la fête" ont une puissance de feu que plusieurs garnisons Gardiennes ne peuvent pas égaler. Il dit que c\'est pour la paix. C\'est sans doute vrai. Ça ne le rend pas moins dangereux.',
  },
  {
    id: 'maxance_01',
    type: 'journal',
    title: 'Journal — Marchande Soline, escale à Paradoxa Eterna',
    source: 'Retrouvé dans une épave commerciale, zone 4',
    content: 'An 46 Post-Fracture. La planète existe vraiment — j\'ai longtemps cru que c\'était une légende. La faune est incroyable. Des créatures qui n\'existent nulle part ailleurs. La flore encore plus. Les fruits que Maxance exporte se vendent dix fois leur prix partout dans le secteur. On comprend pourquoi quand on les voit pousser : ils captent quelque chose dans l\'atmosphère unique à cette planète. Et les effets... je comprends pourquoi les criminels sont bannis. Ce serait trop dangereux entre leurs mains.',
  },
  {
    id: 'maxance_02',
    type: 'transmission',
    title: 'Message officiel — Royaume de Paradoxa Eterna',
    source: 'Diffusion publique sur les canaux commerciaux du secteur',
    content: 'AVIS AUX VOYAGEURS. L\'accès à Paradoxa Eterna est soumis à vérification du casier judiciaire intersectoriel. Tout individu répertorié comme criminel notoire se verra refuser l\'entrée — définitivement. Nous ne nous excusons pas de cette politique. Paradoxa Eterna est un lieu de paix, de commerce honnête et de biodiversité unique. Nous souhaitons qu\'il le reste. — Par ordre du Roi Maxance.',
  },
  {
    id: 'maxance_03',
    type: 'rumeur',
    title: 'Rumeur — Effets des fruits de Paradoxa',
    source: 'Tavernes du secteur, confirmée par de nombreux témoignages convergents',
    content: '"Les fruits de Paradoxa ne sont pas juste bons à manger. Certains accélèrent les réflexes pendant des heures. D\'autres augmentent la résistance à la douleur. Les plantes médicinales soignent des blessures que les meilleurs synthétiques ne touchent pas. Maxance contrôle strictement l\'exportation. Il ne vend pas aux factions armées — jamais. On ne sait pas comment il applique ça. Mais personne ne lui a désobéi deux fois."',
  },
  {
    id: 'samy_scotty_01',
    type: 'datapad',
    title: 'Fiche de renseignement — Samy Scotty',
    source: 'Base de données des Gardiens · STATUT : SURVEILLANCE',
    content: 'SAMY SCOTTY, dit "Le Croupier". Propriétaire et opérateur de Scotty Golden North. Activités officielles : casino, jeux d\'argent, paris sur combattants. Activités officieuses : blanchiment de crédits, financement de factions multiples, collecte d\'informations compromettantes. NIVEAU DE MENACE : élevé. PRIORITÉ D\'ARRESTATION : faible. Il ne commet pas de crime qu\'on puisse prouver. Et ceux qui ont essayé ont fini par devenir ses clients réguliers — ou ont cessé d\'exister de façon documentée.',
  },
  {
    id: 'samy_scotty_02',
    type: 'inscription',
    title: 'Maxime — Entrée du casino, Scotty Golden North',
    source: 'Néon synthétique, visible à des kilomètres',
    content: '"LE CRÉDIT ENTRE. LE CRÉDIT RESTE." En dessous, griffonné sur un panneau ajouté à la main : "Et si tu n\'as plus de crédits, Samy a d\'autres idées." Scotty lui-même dit qu\'il a mis ce panneau là. Il sourit quand il le dit.',
  },

  // ── FRAGMENTS DE VIE ──────────────────────────────────────────────────────
  {
    id: 'life_01',
    type: 'journal',
    title: 'Journal — Marchande Soline',
    source: 'Retrouvé dans une épave commerciale, zone 4',
    content: 'An 44 Post-Fracture. 12 ans de routes entre Requiem et l\'Arc. J\'ai vu des gens naître sur les stations et mourir sans jamais voir autre chose que le vide derrière un hublot. On appelle ça vivre. Parfois je me demande si les gens qui errent vraiment — les vagabonds, les pilotes solitaires qui vont et viennent — si eux n\'ont pas compris quelque chose qu\'on a tous oublié.',
  },
  {
    id: 'life_02',
    type: 'inscription',
    title: 'Message anonyme — Couloir de transit, Requiem',
    source: 'Gravé à la pointe dans le métal, partiellement effacé',
    content: '"J\'avais un nom. J\'avais une adresse. J\'avais une faction. J\'ai tout perdu le même jour. Maintenant j\'ai un vaisseau et une direction. C\'est plus que beaucoup." En dessous, ajouté plus tard en rouge : "C\'est peut-être tout ce qu\'il faut."',
  },
  {
    id: 'life_03',
    type: 'rumeur',
    title: 'Histoire circulante — Tavernes du secteur',
    source: 'Version collectée dans 7 stations différentes, détails variables',
    content: '"Tu connais l\'histoire du pilote qui a trouvé Station Zéro ? Il est revenu avec une soute pleine d\'archives pré-Fracture. Les Gardiens l\'ont intercepté. L\'Emporium a racheté les archives. Le Culte a dit qu\'il était béni. Lui, il s\'est suicidé trois jours après son retour. Personne n\'a vu les archives. Personne ne sait ce qu\'il avait lu."',
  },
  {
    id: 'life_04',
    type: 'journal',
    title: 'Lettre non envoyée',
    source: 'Retrouvée dans la cabine d\'un vaisseau abandonné, aucune adresse',
    content: 'Je t\'écris pas pour que tu répondes. Je t\'écris pour ne pas oublier que tu existes quelque part. La station où on a grandi a changé de mains trois fois. Les Faucons, puis l\'Emporium, maintenant quelqu\'un qu\'on ne connaît pas. Je voulais juste que tu saches que si tu es encore là, je pense encore à toi. — K.',
  },

  // ── L\'EXTÉRIEUR ──────────────────────────────────────────────────────────
  {
    id: 'outside_01',
    type: 'datapad',
    title: 'Rapport de situation — Gardiens, usage interne',
    source: 'Commandante Myrra · An 47 Post-Fracture',
    content: 'État du secteur : critique. 34% des stations sous le seuil de viabilité autonome. Activité Faucons en hausse de 22%. Expansion du Culte dans les zones non couvertes. L\'Accord de Requiem tient sur papier. Sur le terrain : nous sommes 47 ans après la Fracture et nous nous comportons encore comme si elle pouvait se reproduire. Parce qu\'elle le peut. Et cette fois, personne n\'aura 17 minutes d\'avertissement.',
  },
  {
    id: 'outside_02',
    type: 'rumeur',
    title: 'Rumeur persistante — Marchands de passage',
    source: 'Confirmée par 4 sources indépendantes, détails convergents',
    content: '"Il y a quelque chose de nouveau dans la Dérive. Plus de Flotte Fantôme déréglée — quelque chose d\'organisé. Des vaisseaux qu\'on ne reconnaît pas, qui bougent avec une intention claire. Certains disent que c\'est le Général Sable qui a construit quelque chose là-dedans pendant 3 ans. D\'autres disent que c\'est bien pire. D\'autres encore ne disent plus rien."',
  },
  {
    id: 'outside_03',
    type: 'inscription',
    title: 'Graffiti — Station abandonnée, secteur 7',
    source: 'Photographié avant démolition de la station',
    content: '"LE VIDE VOUS REGARDE AUSSI" — inscrit en 47 langues différentes sur le même mur, toutes de la même main, manifestement le même jour. L\'auteur n\'a jamais été identifié. Les 47 langues incluent trois langues mortes et deux qui n\'ont jamais été répertoriées avant ni après.',
  },
  {
    id: 'outside_04',
    type: 'transmission',
    title: 'Dernier message reçu de l\'extérieur — date inconnue',
    source: 'Enregistrement unique, réception unique, jamais répété',
    content: 'MESSAGE REÇU SUR FRÉQUENCE INCONNUE. Durée : 4 secondes. Contenu : "Vous n\'êtes pas seuls dans ce secteur. Vous ne l\'avez jamais été. Préparez-vous." [Ce message a été reçu simultanément par toutes les stations du secteur 8 jours avant la Fracture. Aucune source n\'a jamais été identifiée. Ce fait n\'a jamais été rendu public.]',
  },
]

export const LORE_TOTAL = LORE_FRAGMENTS.length

export function getFragment(id: string): LoreFragment | undefined {
  return LORE_FRAGMENTS.find(f => f.id === id)
}

export function getRandomUndiscoveredFragment(discovered: string[]): LoreFragment | null {
  const set = new Set(discovered)
  const available = LORE_FRAGMENTS.filter(f => !set.has(f.id))
  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
}

export const FRAGMENT_TYPE_LABELS: Record<LoreFragmentType, string> = {
  journal:      '📓 JOURNAL',
  transmission: '📡 TRANSMISSION',
  inscription:  '🪨 INSCRIPTION',
  datapad:      '💾 DATAPAD',
  rumeur:       '👁 RUMEUR',
}

export const FRAGMENT_TYPE_COLORS: Record<LoreFragmentType, string> = {
  journal:      'var(--cyan)',
  transmission: 'var(--green)',
  inscription:  'var(--text-dim)',
  datapad:      'var(--gold)',
  rumeur:       'var(--purple)',
}

import type { Enemy } from '../types'

export const TIER_LOW: Enemy[] = [
  { name: 'Pickpocket désespéré',     maxHp: 20, damageMin: 3,  damageMax: 8,  lootMin: 80,  lootMax: 300, description: 'Un gamin avec un couteau rouillé.',                  captureChance: 20, killChance: 5,  isBoss: false, role: 'normal' },
  { name: 'Ivrogne agressif',         maxHp: 25, damageMin: 2,  damageMax: 7,  lootMin: 60,  lootMax: 200, description: 'Il sent le carburant frelaté.',                      captureChance: 20, killChance: 5,  isBoss: false, role: 'normal' },
  { name: 'Garde corrompu',           maxHp: 35, damageMin: 5,  damageMax: 12, lootMin: 200, lootMax: 600, description: 'Il a oublié pour qui il travaille.',                 captureChance: 25, killChance: 10, isBoss: false, role: 'normal' },
  { name: 'Vagabond armé',            maxHp: 30, damageMin: 4,  damageMax: 10, lootMin: 100, lootMax: 400, description: 'Il veut juste survivre.',                            captureChance: 20, killChance: 8,  isBoss: false, role: 'normal' },
  { name: 'Scavenger opportuniste',   maxHp: 28, damageMin: 4,  damageMax: 11, lootMin: 150, lootMax: 500, description: 'Il récupère des armes dans des épaves.',             captureChance: 20, killChance: 8,  isBoss: false, role: 'normal' },
  { name: 'Milicien de pacotille',    maxHp: 32, damageMin: 4,  damageMax: 10, lootMin: 120, lootMax: 450, description: 'Mal entraîné, mal équipé, dangereux quand même.',   captureChance: 30, killChance: 8,  isBoss: false, role: 'normal' },
  { name: 'Chasseur de primes novice',maxHp: 38, damageMin: 5,  damageMax: 13, lootMin: 180, lootMax: 550, description: 'Ta tête vaut quelque chose apparemment.',           captureChance: 35, killChance: 10, isBoss: false, role: 'normal' },
  { name: 'Gamin de la zone',         maxHp: 18, damageMin: 2,  damageMax: 6,  lootMin: 40,  lootMax: 180, description: 'Douze ans et une brique de métal. Dangereux.',       captureChance: 10, killChance: 3,  isBoss: false, role: 'normal' },
  { name: 'Ouvrier en colère',        maxHp: 40, damageMin: 5,  damageMax: 11, lootMin: 90,  lootMax: 350, description: 'Il n\'a pas été payé. C\'est toi le fautif.',        captureChance: 25, killChance: 5,  isBoss: false, role: 'normal' },
  { name: 'Mendiant armé',            maxHp: 22, damageMin: 3,  damageMax: 8,  lootMin: 30,  lootMax: 160, description: 'Il a trouvé un couteau dans une poubelle.',          captureChance: 15, killChance: 4,  isBoss: false, role: 'normal' },
  { name: 'Pilote raté',              maxHp: 28, damageMin: 3,  damageMax: 9,  lootMin: 100, lootMax: 400, description: 'Son vaisseau est détruit. Il te tient responsable.', captureChance: 20, killChance: 7,  isBoss: false, role: 'normal' },
  { name: 'Toxicomane sous injection',maxHp: 15, damageMin: 4,  damageMax: 14, lootMin: 50,  lootMax: 250, description: 'Imprévisible. Les drogues lui donnent de la force.',  captureChance: 10, killChance: 8,  isBoss: false, role: 'normal' },
  { name: 'Rat de cargaison',         maxHp: 24, damageMin: 2,  damageMax: 7,  lootMin: 70,  lootMax: 300, description: 'Il vivait dans tes soutes depuis des semaines.',      captureChance: 20, killChance: 5,  isBoss: false, role: 'normal' },
  { name: 'Sous-officier véreux',     maxHp: 36, damageMin: 6,  damageMax: 12, lootMin: 200, lootMax: 600, description: 'Militaire mi-retraité, mi-criminel.',                captureChance: 30, killChance: 10, isBoss: false, role: 'normal' },
  { name: 'Fuyarde paniquée',         maxHp: 20, damageMin: 3,  damageMax: 9,  lootMin: 80,  lootMax: 300, description: 'Elle fuit quelque chose de pire que toi.',          captureChance: 15, killChance: 3,  isBoss: false, role: 'normal' },
  { name: 'Réparateur jaloux',        maxHp: 33, damageMin: 4,  damageMax: 10, lootMin: 110, lootMax: 420, description: 'Tu as acheté son pièce rare. Il le veut en retour.',  captureChance: 20, killChance: 6,  isBoss: false, role: 'normal' },
  { name: 'Drogué au Synth',          maxHp: 26, damageMin: 5,  damageMax: 15, lootMin: 60,  lootMax: 220, description: 'Le Synth coupe la douleur. Et la raison.',           captureChance: 10, killChance: 9,  isBoss: false, role: 'normal' },
  { name: 'Éclaireur Faucon',         maxHp: 32, damageMin: 4,  damageMax: 11, lootMin: 150, lootMax: 500, description: 'Recrue des Faucons Noirs. Rapide, peu fiable, zélée.',  captureChance: 20, killChance: 8,  isBoss: false, role: 'normal' },
  { name: 'Recrue Gardienne',         maxHp: 35, damageMin: 5,  damageMax: 11, lootMin: 130, lootMax: 480, description: 'Première patrouille Gardienne. Elle est nerveuse.',      captureChance: 25, killChance: 7,  isBoss: false, role: 'normal' },
  { name: 'Vigile Emporium',          maxHp: 30, damageMin: 3,  damageMax: 10, lootMin: 120, lootMax: 420, description: 'Vigile sous-payé de l\'Emporium. Agressif par frustration.', captureChance: 25, killChance: 6, isBoss: false, role: 'normal' },
  { name: 'Mineur agressif',          maxHp: 42, damageMin: 5,  damageMax: 12, lootMin: 100, lootMax: 380, description: 'Les galeries l\'ont rendu brutal.',                      captureChance: 20, killChance: 8,  isBoss: false, role: 'tank'   },
  { name: 'Survivant des ruines',     maxHp: 26, damageMin: 4,  damageMax: 11, lootMin: 80,  lootMax: 320, description: 'Il ne reste rien de la station. Juste lui.',             captureChance: 15, killChance: 9,  isBoss: false, role: 'normal' },
  { name: 'Déserteur en errance',     maxHp: 35, damageMin: 5,  damageMax: 12, lootMin: 130, lootMax: 450, description: 'Il a abandonné sa faction. Maintenant il se bat pour manger.', captureChance: 15, killChance: 8,  isBoss: false, role: 'normal' },
  { name: 'Junkie aux implants',      maxHp: 28, damageMin: 6,  damageMax: 16, lootMin: 80,  lootMax: 300, description: 'Des implants bon marché mal intégrés. Il souffre et ça le rend imprévisible.', captureChance: 10, killChance: 12, isBoss: false, role: 'normal' },
  { name: 'Messager intercepté',      maxHp: 24, damageMin: 3,  damageMax: 8,  lootMin: 150, lootMax: 500, description: 'Il transportait quelque chose. Il défend sa mission jusqu\'à la fin.', captureChance: 20, killChance: 5,  isBoss: false, role: 'normal' },
  { name: 'Récupérateur de dettes',   maxHp: 38, damageMin: 6,  damageMax: 14, lootMin: 200, lootMax: 600, description: 'Quelqu\'un lui a envoyé récupérer ce que tu lui dois. Ou ce qu\'il croit que tu lui dois.', captureChance: 30, killChance: 8, isBoss: false, role: 'normal' },
  { name: 'Contrebandier junior',     maxHp: 30, damageMin: 4,  damageMax: 10, lootMin: 120, lootMax: 400, description: 'Première livraison, premier problème. Lui comme toi.', captureChance: 20, killChance: 7, isBoss: false, role: 'normal' },
  { name: 'Garde-frontière véreux',   maxHp: 36, damageMin: 5,  damageMax: 12, lootMin: 180, lootMax: 550, description: 'Il contrôle un passage. Il taxe tout ce qui passe.', captureChance: 25, killChance: 9,  isBoss: false, role: 'normal' },
  { name: 'Pilote sabordé',           maxHp: 28, damageMin: 4,  damageMax: 10, lootMin: 100, lootMax: 380, description: 'Son vaisseau a coulé. Il a tout perdu. Il veut récupérer quelque chose.', captureChance: 18, killChance: 7, isBoss: false, role: 'normal' },
  { name: 'Enfant soldat recyclé',    maxHp: 22, damageMin: 5,  damageMax: 14, lootMin: 60,  lootMax: 220, description: 'Il avait dix ans quand la guerre a commencé. Dix ans de formation depuis.', captureChance: 10, killChance: 10, isBoss: false, role: 'normal' },
  { name: 'Garde pénitentiaire rogue',maxHp: 40, damageMin: 5,  damageMax: 13, lootMin: 160, lootMax: 500, description: 'Les prisons ferment. Les gardiens restent armés.', captureChance: 25, killChance: 8,  isBoss: false, role: 'normal' },
  { name: 'Chasseur de tête local',   maxHp: 34, damageMin: 6,  damageMax: 14, lootMin: 200, lootMax: 600, description: 'Il opère dans son coin. Efficace sur son territoire.', captureChance: 20, killChance: 10, isBoss: false, role: 'normal' },
  { name: 'Soldat de faction blessé', maxHp: 32, damageMin: 4,  damageMax: 11, lootMin: 130, lootMax: 450, description: 'Blessé au combat, pas assez pour arrêter.', captureChance: 20, killChance: 7,  isBoss: false, role: 'normal' },
]

export const TIER_MID: Enemy[] = [
  { name: 'Pirate solitaire',          maxHp: 50, damageMin: 8,  damageMax: 18, lootMin: 400,  lootMax: 900,  description: 'Freelance du crime. Expérimenté.',              captureChance: 25, killChance: 20, isBoss: false, role: 'normal' },
  { name: 'Mercenaire bas de gamme',   maxHp: 55, damageMin: 9,  damageMax: 20, lootMin: 500,  lootMax: 1000, description: 'Payé pour te faire mal.',                      captureChance: 20, killChance: 20, isBoss: false, role: 'normal' },
  { name: 'Contrebandier défensif',    maxHp: 45, damageMin: 7,  damageMax: 16, lootMin: 350,  lootMax: 800,  description: 'Il transporte quelque chose d\'illégal.',       captureChance: 20, killChance: 15, isBoss: false, role: 'normal' },
  { name: 'Chasseur de primes',        maxHp: 60, damageMin: 10, damageMax: 22, lootMin: 600,  lootMax: 1200, description: 'Il a ta tête dans sa liste.',                  captureChance: 35, killChance: 20, isBoss: false, role: 'normal' },
  { name: 'Gang de rue spatial',       maxHp: 65, damageMin: 8,  damageMax: 19, lootMin: 450,  lootMax: 950,  description: 'Trois contre un.',                             captureChance: 20, killChance: 18, isBoss: false, role: 'normal' },
  { name: 'Déserteur armé',            maxHp: 58, damageMin: 9,  damageMax: 21, lootMin: 480,  lootMax: 1000, description: 'Il a trahi sa faction. Rien à perdre.',        captureChance: 15, killChance: 25, isBoss: false, role: 'normal' },
  { name: 'Assassin de bas étage',     maxHp: 48, damageMin: 12, damageMax: 25, lootMin: 550,  lootMax: 1100, description: 'Rapide. Dangereux. Pas cher.',                 captureChance: 10, killChance: 30, isBoss: false, role: 'normal' },
  { name: 'Pirate reconverti',         maxHp: 52, damageMin: 8,  damageMax: 17, lootMin: 400,  lootMax: 850,  description: 'Il dit qu\'il est dans le commerce légal.',     captureChance: 25, killChance: 15, isBoss: false, role: 'normal' },
  { name: 'Officier renégat',          maxHp: 70, damageMin: 11, damageMax: 23, lootMin: 600,  lootMax: 1300, description: 'Jadis respecté. Aujourd\'hui, juste dangereux.',captureChance: 20, killChance: 22, isBoss: false, role: 'normal' },
  { name: 'Trafiquant d\'organes',     maxHp: 55, damageMin: 9,  damageMax: 20, lootMin: 700,  lootMax: 1500, description: 'Il est intéressé par ce que tu as à l\'intérieur.', captureChance: 30, killChance: 25, isBoss: false, role: 'normal' },
  { name: 'Tireur embusqué',           maxHp: 42, damageMin: 13, damageMax: 28, lootMin: 500,  lootMax: 1000, description: 'Il t\'attendait.',                             captureChance: 10, killChance: 30, isBoss: false, role: 'ranged' },
  { name: 'Sergent des bas-fonds',     maxHp: 75, damageMin: 10, damageMax: 20, lootMin: 550,  lootMax: 1100, description: 'Il dirige son quartier à la force du poing.',  captureChance: 25, killChance: 18, isBoss: false, role: 'tank' },
  { name: 'Hacker de rue',             maxHp: 44, damageMin: 7,  damageMax: 15, lootMin: 450,  lootMax: 900,  description: 'Il a saboté ton équipement avant que tu t\'en rendes compte.', captureChance: 20, killChance: 15, isBoss: false, role: 'ranged' },
  { name: 'Dresseur de bêtes mutantes',maxHp: 62, damageMin: 10, damageMax: 22, lootMin: 500,  lootMax: 1000, description: 'Sa créature mord. Lui aussi.',                captureChance: 15, killChance: 20, isBoss: false, role: 'normal' },
  { name: 'Caïd de station',           maxHp: 68, damageMin: 9,  damageMax: 19, lootMin: 600,  lootMax: 1200, description: 'Il taxe tout le monde sur cette station. Même toi maintenant.', captureChance: 20, killChance: 20, isBoss: false, role: 'normal' },
  { name: 'Agent double',              maxHp: 50, damageMin: 10, damageMax: 22, lootMin: 650,  lootMax: 1400, description: 'Il travaille pour trois factions. Aucune ne le sait encore.', captureChance: 15, killChance: 25, isBoss: false, role: 'normal' },
  { name: 'Gladiateur sans contrat',   maxHp: 80, damageMin: 12, damageMax: 24, lootMin: 500,  lootMax: 1000, description: 'Il se bat pour survivre. Plus aucune arène ne le veut.',       captureChance: 10, killChance: 20, isBoss: false, role: 'tank' },
  { name: 'Agent Faucon infiltré',     maxHp: 52, damageMin: 10, damageMax: 22, lootMin: 550,  lootMax: 1100, description: 'Opérateur des Faucons en couverture. Il a des ordres.',          captureChance: 15, killChance: 25, isBoss: false, role: 'normal' },
  { name: 'Soldat Gardien Écarlate',   maxHp: 68, damageMin: 9,  damageMax: 20, lootMin: 500,  lootMax: 1050, description: 'Combattant des Gardiens Écarlates. Discipliné, efficace.',       captureChance: 25, killChance: 20, isBoss: false, role: 'normal' },
  { name: 'Garde Emporium armé',       maxHp: 60, damageMin: 11, damageMax: 23, lootMin: 600,  lootMax: 1200, description: 'Sécurité haut de gamme. Payé pour tuer proprement.',             captureChance: 30, killChance: 18, isBoss: false, role: 'normal' },
  { name: 'Scavenger vétéran',         maxHp: 55, damageMin: 8,  damageMax: 19, lootMin: 480,  lootMax: 1000, description: 'Des années dans les épaves. Il connaît les angles morts.',      captureChance: 20, killChance: 20, isBoss: false, role: 'normal' },
  { name: 'Mercenaire des ruines',     maxHp: 62, damageMin: 10, damageMax: 22, lootMin: 520,  lootMax: 1050, description: 'Il squatte les stations mortes. Pas pour de la philosophie.',   captureChance: 20, killChance: 22, isBoss: false, role: 'normal' },
  { name: 'Chasseur de reliques',      maxHp: 58, damageMin: 9,  damageMax: 20, lootMin: 550,  lootMax: 1100, description: 'Les ruines l\'intéressent. Et toi tu l\'intéresses aussi.',          captureChance: 15, killChance: 20, isBoss: false, role: 'normal' },
  { name: 'Vétéran de la Purge',       maxHp: 72, damageMin: 12, damageMax: 24, lootMin: 600,  lootMax: 1200, description: 'Il a survécu à une purge. Il n\'a pas de morale à perdre.',           captureChance: 10, killChance: 28, isBoss: false, role: 'normal' },
  { name: 'Technomercenaire',          maxHp: 52, damageMin: 10, damageMax: 22, lootMin: 500,  lootMax: 1050, description: 'Il te sabote avant même de dégainer. Ses gadgets font le gros du travail.', captureChance: 15, killChance: 22, isBoss: false, role: 'ranged' },
  { name: 'Recéleur défensif',         maxHp: 45, damageMin: 8,  damageMax: 17, lootMin: 600,  lootMax: 1300, description: 'Son stock vaut plus que sa vie. Il en est parfaitement conscient.',   captureChance: 25, killChance: 15, isBoss: false, role: 'normal' },
  { name: 'Soldat de fortune Faucon',  maxHp: 65, damageMin: 11, damageMax: 22, lootMin: 520,  lootMax: 1050, description: 'Pas un Faucon officiel. Équipé et payé comme un.',                     captureChance: 15, killChance: 22, isBoss: false, role: 'normal' },
  { name: 'Ingénieur de sabotage',     maxHp: 55, damageMin: 10, damageMax: 22, lootMin: 520,  lootMax: 1050, description: 'Il te neutralise avant de combattre. Les gadgets font le gros du travail.', captureChance: 15, killChance: 20, isBoss: false, role: 'ranged' },
  { name: 'Trafiquant en réseau',      maxHp: 50, damageMin: 9,  damageMax: 19, lootMin: 600,  lootMax: 1250, description: 'Ses connexions le rendent plus dangereux que son équipement.', captureChance: 20, killChance: 18, isBoss: false, role: 'normal' },
  { name: 'Espion retourné',           maxHp: 52, damageMin: 10, damageMax: 21, lootMin: 580,  lootMax: 1150, description: 'Il a changé de camp trop de fois. Il ne sait plus qui il est vraiment.', captureChance: 15, killChance: 22, isBoss: false, role: 'normal' },
  { name: 'Commandant de milice',      maxHp: 70, damageMin: 11, damageMax: 23, lootMin: 600,  lootMax: 1200, description: 'Il règne sur son quartier depuis dix ans. Il n\'a pas l\'intention de changer.', captureChance: 20, killChance: 20, isBoss: false, role: 'normal' },
  { name: 'Chasseur mutant',           maxHp: 65, damageMin: 13, damageMax: 26, lootMin: 480,  lootMax: 980,  description: 'Il a cessé d\'être humain par étapes. L\'instinct de chasse a survécu.', captureChance: 10, killChance: 28, isBoss: false, role: 'normal' },
  { name: 'Artilleur de section',      maxHp: 60, damageMin: 12, damageMax: 25, lootMin: 550,  lootMax: 1100, description: 'Il avait une section. Maintenant il a juste son arme.', captureChance: 15, killChance: 25, isBoss: false, role: 'ranged' },
]

export const TIER_HIGH: Enemy[] = [
  { name: 'Élite des Faucons Noirs',     maxHp: 120, damageMin: 20, damageMax: 40, lootMin: 1000, lootMax: 2500, description: 'Entraîné, équipé, motivé.',               captureChance: 15, killChance: 25, isBoss: false, role: 'normal' },
  { name: 'Garde de l\'Emporium',        maxHp: 130, damageMin: 18, damageMax: 38, lootMin: 800,  lootMax: 2000, description: 'Armure lourde, zéro humour.',              captureChance: 40, killChance: 5,  isBoss: false, role: 'tank' },
  { name: 'Assassin du Conclave',        maxHp: 100, damageMin: 25, damageMax: 48, lootMin: 1500, lootMax: 3500, description: 'Tu ne l\'as pas vu venir.',                captureChance: 10, killChance: 35, isBoss: false, role: 'ranged' },
  { name: 'Garde du corps impitoyable',  maxHp: 140, damageMin: 22, damageMax: 42, lootMin: 1200, lootMax: 3000, description: 'Il a survécu à des dizaines de combats.',  captureChance: 20, killChance: 25, isBoss: false, role: 'normal' },
  { name: 'Soldat de Noctis',            maxHp: 115, damageMin: 20, damageMax: 38, lootMin: 900,  lootMax: 2200, description: 'Fanatique.',                               captureChance: 10, killChance: 20, isBoss: false, role: 'normal' },
  { name: 'Médecin de guerre ennemi',    maxHp: 90,  damageMin: 15, damageMax: 30, lootMin: 1000, lootMax: 2500, description: 'Il soigne ses alliés et te détruit.',      captureChance: 20, killChance: 15, isBoss: false, role: 'support' },
  { name: 'Chasseur de trophées',        maxHp: 110, damageMin: 22, damageMax: 44, lootMin: 1100, lootMax: 2800, description: 'Ta tête décorera son cockpit.',            captureChance: 5,  killChance: 40, isBoss: false, role: 'ranged' },
  { name: 'Ingénieur de guerre',         maxHp: 105, damageMin: 18, damageMax: 36, lootMin: 1000, lootMax: 2400, description: 'Ses gadgets font aussi mal que ses poings.', captureChance: 20, killChance: 20, isBoss: false, role: 'normal' },
  { name: 'Commandant renégat',          maxHp: 150, damageMin: 24, damageMax: 45, lootMin: 1400, lootMax: 3500, description: 'Il a mené des batailles. Il connaît les faiblesses.', captureChance: 20, killChance: 28, isBoss: false, role: 'normal' },
  { name: 'Fantôme de la Garde Noire',   maxHp: 95,  damageMin: 26, damageMax: 50, lootMin: 1600, lootMax: 3800, description: 'Unité d\'élite dissoute. Ils n\'ont pas rendu les armes.', captureChance: 5, killChance: 40, isBoss: false, role: 'ranged' },
  { name: 'Berserker augmenté',          maxHp: 160, damageMin: 25, damageMax: 50, lootMin: 1200, lootMax: 3000, description: 'Implants militaires illégaux. Il ne ressent plus la douleur.', captureChance: 5, killChance: 35, isBoss: false, role: 'tank' },
  { name: 'Exécuteur du Tribunal',       maxHp: 125, damageMin: 22, damageMax: 42, lootMin: 1300, lootMax: 3200, description: 'Une sentence de mort t\'a été prononcée. Il l\'applique.', captureChance: 20, killChance: 30, isBoss: false, role: 'normal' },
  { name: 'Pilote de combat au sol',     maxHp: 108, damageMin: 20, damageMax: 40, lootMin: 950,  lootMax: 2300, description: 'Son vaisseau est détruit. Il t\'en tient responsable.', captureChance: 10, killChance: 25, isBoss: false, role: 'normal' },
  { name: 'Sniper des abysses',          maxHp: 85,  damageMin: 28, damageMax: 55, lootMin: 1500, lootMax: 3500, description: 'Un kilomètre de distance minimum. Aujourd\'hui c\'est plus proche.', captureChance: 5, killChance: 45, isBoss: false, role: 'ranged' },
  { name: 'Garde d\'honneur brisé',      maxHp: 135, damageMin: 20, damageMax: 40, lootMin: 1100, lootMax: 2700, description: 'Son seigneur est mort. Il cherche qui tuer pour ça.', captureChance: 15, killChance: 28, isBoss: false, role: 'tank' },
  { name: 'Ancien du Vide',              maxHp: 118, damageMin: 22, damageMax: 43, lootMin: 1200, lootMax: 2900, description: 'Des années dans l\'espace l\'ont changé. Pas en mieux.', captureChance: 10, killChance: 30, isBoss: false, role: 'normal' },
  { name: 'Traqueur de factions',        maxHp: 102, damageMin: 23, damageMax: 46, lootMin: 1300, lootMax: 3100, description: 'Sa faction l\'a envoyé. Il ne revient qu\'avec ta tête.', captureChance: 10, killChance: 35, isBoss: false, role: 'normal' },
  { name: 'Commandant Faucon Noir',      maxHp: 135, damageMin: 22, damageMax: 44, lootMin: 1300, lootMax: 3200, description: 'Officier des Faucons. Chaque ordre de lui a coûté des vies.',  captureChance: 15, killChance: 30, isBoss: false, role: 'normal' },
  { name: 'Capitaine Gardien Écarlate',  maxHp: 145, damageMin: 20, damageMax: 40, lootMin: 1200, lootMax: 3000, description: 'Cheffe de garnison. Elle a tenu des forteresses seule.',       captureChance: 20, killChance: 25, isBoss: false, role: 'tank'   },
  { name: "Exécuteur de l'Emporium",    maxHp: 120, damageMin: 25, damageMax: 48, lootMin: 1500, lootMax: 3500, description: 'Il règle les problèmes de l\'Emporium. Tu es un problème.',    captureChance: 10, killChance: 35, isBoss: false, role: 'ranged' },
  { name: 'Baron des bas-fonds',         maxHp: 130, damageMin: 22, damageMax: 43, lootMin: 1400, lootMax: 3300, description: 'Il contrôle un quartier entier. Hors de question de te laisser passer.', captureChance: 15, killChance: 30, isBoss: false, role: 'normal' },
  { name: 'Vétéran des ruines',          maxHp: 110, damageMin: 24, damageMax: 46, lootMin: 1200, lootMax: 2900, description: 'Des décennies dans les stations mortes. Il a tout vu, tout survécu.', captureChance: 10, killChance: 32, isBoss: false, role: 'normal' },
  { name: 'Thanatonaute',               maxHp: 108, damageMin: 24, damageMax: 47, lootMin: 1200, lootMax: 2900, description: 'Il a fait le vide en lui. Le combat est sa seule présence.',             captureChance: 5,  killChance: 38, isBoss: false, role: 'normal' },
  { name: 'Fanatique de la Fracture',   maxHp: 115, damageMin: 22, damageMax: 44, lootMin: 1100, lootMax: 2800, description: 'Il croit que la Grande Guerre n\'est pas finie. Il a raison d\'une façon.', captureChance: 10, killChance: 32, isBoss: false, role: 'normal' },
  { name: 'Garde augmenté du Nexus',    maxHp: 128, damageMin: 20, damageMax: 40, lootMin: 1000, lootMax: 2500, description: 'Implants Nexus-grade intégrés. Il n\'a pas besoin de dormir.',           captureChance: 20, killChance: 20, isBoss: false, role: 'tank'   },
  { name: 'Lame fantôme',              maxHp: 92,  damageMin: 28, damageMax: 54, lootMin: 1400, lootMax: 3400, description: 'Tu ne le vois qu\'une fois. En général c\'est trop tard.',               captureChance: 5,  killChance: 42, isBoss: false, role: 'ranged' },
  { name: 'Artificier dérangé',         maxHp: 105, damageMin: 22, damageMax: 42, lootMin: 1100, lootMax: 2700, description: 'Il fabrique ses armes et les teste sur les gens qu\'il rencontre.',     captureChance: 10, killChance: 30, isBoss: false, role: 'normal' },
  { name: 'Général de la Dernière Guerre', maxHp: 140, damageMin: 23, damageMax: 45, lootMin: 1300, lootMax: 3100, description: 'Il se bat encore la même guerre. Pour lui, elle n\'a jamais pris fin.',   captureChance: 10, killChance: 32, isBoss: false, role: 'normal' },
  { name: 'Bioingénieur de combat',    maxHp: 112, damageMin: 20, damageMax: 40, lootMin: 1100, lootMax: 2700, description: 'Il s\'est lui-même modifié pour le combat. Chaque modification a un but précis.', captureChance: 15, killChance: 28, isBoss: false, role: 'normal' },
  { name: 'Chevalier Écarlate renégat',maxHp: 145, damageMin: 22, damageMax: 44, lootMin: 1200, lootMax: 3000, description: 'Il portait le rouge et le défendait. Il a vu quelque chose qui a tout changé.', captureChance: 10, killChance: 35, isBoss: false, role: 'tank'   },
  { name: 'Infiltrateur de haut rang', maxHp: 98,  damageMin: 26, damageMax: 50, lootMin: 1500, lootMax: 3500, description: 'Trois identités. Aucune vraie. Le combat est la seule chose réelle pour lui.', captureChance: 8, killChance: 40, isBoss: false, role: 'ranged' },
  { name: 'Exécuteur de la Purge',     maxHp: 130, damageMin: 22, damageMax: 43, lootMin: 1200, lootMax: 3000, description: 'La Purge est terminée officiellement. Il continue quand même.',                captureChance: 10, killChance: 35, isBoss: false, role: 'normal' },
  { name: 'Pilote Nexus au sol',       maxHp: 118, damageMin: 20, damageMax: 40, lootMin: 1000, lootMax: 2500, description: 'Son vaisseau est détruit, ses implants de navigation toujours actifs.',       captureChance: 15, killChance: 28, isBoss: false, role: 'normal' },
]

export const TIER_BOSS: Enemy[] = [
  { name: 'Alanossa',                    maxHp: 200, damageMin: 30, damageMax: 55, lootMin: 4000, lootMax: 8000, description: 'Le pirate le plus dangereux de l\'univers connu.',      captureChance: 10, killChance: 40, isBoss: true, role: 'normal' },
  { name: 'La Faucon',                   maxHp: 180, damageMin: 28, damageMax: 52, lootMin: 3500, lootMax: 7000, description: 'Cheffe des Faucons Noirs. Calculée. Implacable.',        captureChance: 15, killChance: 35, isBoss: true, role: 'normal' },
  { name: 'Directeur Pale',              maxHp: 160, damageMin: 25, damageMax: 48, lootMin: 3000, lootMax: 6000, description: 'Il est calme. C\'est pire.',                             captureChance: 30, killChance: 25, isBoss: true, role: 'normal' },
  { name: 'Garde du Corps d\'Eliotis',   maxHp: 150, damageMin: 22, damageMax: 45, lootMin: 2500, lootMax: 5500, description: 'Eliotis ne pardonne pas.',                              captureChance: 5,  killChance: 45, isBoss: true, role: 'tank' },
  { name: 'Le Boucher de Velkor',        maxHp: 220, damageMin: 32, damageMax: 58, lootMin: 4500, lootMax: 9000, description: 'On raconte qu\'il a détruit une station entière. Seul.', captureChance: 5,  killChance: 50, isBoss: true, role: 'tank' },
  { name: 'Oracle de la Singularité',   maxHp: 140, damageMin: 35, damageMax: 65, lootMin: 5000, lootMax: 10000, description: 'Il prédit tes mouvements. Il les a déjà vus.',         captureChance: 10, killChance: 40, isBoss: true, role: 'ranged' },
  { name: 'Amiral Voss-Kheran',         maxHp: 190, damageMin: 28, damageMax: 50, lootMin: 3800, lootMax: 7500, description: 'Commandant de la flotte des Ombres. Intraitable.',       captureChance: 20, killChance: 30, isBoss: true, role: 'normal' },
  { name: 'La Curatrice',              maxHp: 170, damageMin: 26, damageMax: 48, lootMin: 4000, lootMax: 8000, description: 'Elle collectionne les âmes. La tienne l\'intéresse.',    captureChance: 25, killChance: 30, isBoss: true, role: 'support' },
  { name: 'Frère Ossian le Dernier',   maxHp: 210, damageMin: 30, damageMax: 54, lootMin: 4200, lootMax: 8500, description: 'Dernier survivant d\'un ordre de guerriers-moines.',     captureChance: 10, killChance: 42, isBoss: true, role: 'normal' },
  { name: 'La Mère Mecanique',         maxHp: 250, damageMin: 25, damageMax: 45, lootMin: 5000, lootMax: 12000, description: 'Mi-humaine mi-machine. Ses enfants l\'adorent.',        captureChance: 5,  killChance: 35, isBoss: true, role: 'tank' },
  { name: 'Veilleur du Bout du Monde',  maxHp: 175, damageMin: 33, damageMax: 60, lootMin: 4500, lootMax: 9000, description: 'Il garde quelque chose. Tu n\'aurais pas dû t\'approcher.', captureChance: 8, killChance: 45, isBoss: true, role: 'normal' },
  { name: 'L\'Architecte du Chaos',    maxHp: 165, damageMin: 30, damageMax: 58, lootMin: 4800, lootMax: 9500, description: 'Chaque guerre des cent dernières années — c\'était lui.',  captureChance: 15, killChance: 38, isBoss: true, role: 'ranged' },
  { name: 'Commandante Zara Sable',    maxHp: 185, damageMin: 27, damageMax: 50, lootMin: 3500, lootMax: 7000, description: 'Elle a perdu sa flotte. Elle a gagné une obsession.',     captureChance: 20, killChance: 32, isBoss: true, role: 'normal' },
  { name: 'Le Colosse de Ferraille',   maxHp: 280, damageMin: 28, damageMax: 50, lootMin: 4000, lootMax: 8000, description: 'Un homme dans une armure de fortune de deux mètres.',          captureChance: 5,  killChance: 30, isBoss: true, role: 'tank' },
  { name: 'Le Fantôme des Ombres',    maxHp: 130, damageMin: 35, damageMax: 62, lootMin: 3200, lootMax: 6500, description: 'Opérateur Faucon. Tu ne le vois pas venir. C\'est son travail.', captureChance: 5,  killChance: 40, isBoss: true, role: 'ranged' },
  { name: 'La Bête Noire',            maxHp: 230, damageMin: 35, damageMax: 60, lootMin: 3500, lootMax: 7000, description: 'Berserker Faucon. Plus de raison. Que de la brutalité.',         captureChance: 3,  killChance: 50, isBoss: true, role: 'tank' },
  { name: 'La Veuve de Vega',         maxHp: 155, damageMin: 28, damageMax: 52, lootMin: 3800, lootMax: 7500, description: 'Reine pirate des bas-fonds. Elle a survécu à tout. Dont toi.',   captureChance: 12, killChance: 35, isBoss: true, role: 'normal' },
  { name: "L'Exilé Écarlate",         maxHp: 195, damageMin: 26, damageMax: 48, lootMin: 3000, lootMax: 6000, description: 'Gardien banni. Il a retourné sa foi contre ses anciens frères.', captureChance: 10, killChance: 32, isBoss: true, role: 'normal' },
  { name: 'Patient Zéro',             maxHp: 145, damageMin: 22, damageMax: 44, lootMin: 2800, lootMax: 5500, description: 'Survivant de la quarantaine. Ce qu\'il a vécu l\'a transformé.',  captureChance: 20, killChance: 28, isBoss: true, role: 'support' },
  { name: "L'Ombre du Vide",          maxHp: 160, damageMin: 30, damageMax: 55, lootMin: 3500, lootMax: 7000, description: 'Personne ne sait qui il est. Il préfère ça.',                    captureChance: 8,  killChance: 42, isBoss: true, role: 'ranged' },
  { name: 'Le Roi de Nuit',              maxHp: 175, damageMin: 25, damageMax: 46, lootMin: 4000, lootMax: 8000, description: 'Il dirige Port de Nuit depuis l\'ombre. Il n\'en sort jamais.',          captureChance: 15, killChance: 30, isBoss: true, role: 'normal' },
  { name: 'Le Ferrailleur des Épaves',  maxHp: 170, damageMin: 26, damageMax: 48, lootMin: 3200, lootMax: 6500, description: 'Roi de La Carcasse. Il a grandi dans les épaves. Il en est devenu une.',   captureChance: 10, killChance: 38, isBoss: true, role: 'tank'   },
  { name: "L'Inspecteur Véreux",        maxHp: 155, damageMin: 24, damageMax: 46, lootMin: 3000, lootMax: 6000, description: 'Chef de la sécurité de Port Méridien. Les lois, c\'est lui qui les tord.', captureChance: 20, killChance: 30, isBoss: true, role: 'normal' },
  { name: 'Le Baron de Vega',           maxHp: 190, damageMin: 28, damageMax: 52, lootMin: 3800, lootMax: 7500, description: 'Seigneur des bas-fonds. Tout ce qui se vend dans les Bas-Fonds lui appartient.', captureChance: 10, killChance: 40, isBoss: true, role: 'normal' },
  { name: 'Le Général de Fer',          maxHp: 200, damageMin: 28, damageMax: 50, lootMin: 3500, lootMax: 7000, description: 'Commandant de Fort Kharos. Discipline de fer. Aucune exception.',           captureChance: 25, killChance: 30, isBoss: true, role: 'tank'   },
  { name: 'Protocole ΔX-7',            maxHp: 145, damageMin: 35, damageMax: 62, lootMin: 4500, lootMax: 9000, description: 'IA de sécurité de Nexus Aldara. Elle a décidé que l\'humanité était la menace.', captureChance: 5, killChance: 45, isBoss: true, role: 'ranged' },
  { name: 'Le Geôlier des Morts',       maxHp: 175, damageMin: 27, damageMax: 50, lootMin: 3300, lootMax: 6500, description: 'L\'ancien directeur du Purgatoire. Il n\'est jamais parti. Ni ses méthodes.',captureChance: 15, killChance: 35, isBoss: true, role: 'normal' },
  { name: 'La Matriarche de Perséphone',maxHp: 165, damageMin: 25, damageMax: 47, lootMin: 3000, lootMax: 6000, description: 'Elle a nourri la colonie pendant trente ans. Elle la défend maintenant à coups d\'armes.', captureChance: 20, killChance: 28, isBoss: true, role: 'support' },
  { name: 'Le Titan Mineur',            maxHp: 220, damageMin: 30, damageMax: 55, lootMin: 4000, lootMax: 8000, description: 'Superviseur de Station Rocaille. Augmenté pour porter des tonnes. Il porte aussi les coups.', captureChance: 5, killChance: 40, isBoss: true, role: 'tank' },
  { name: 'Le Maître-Forgeron Maudit',  maxHp: 185, damageMin: 29, damageMax: 53, lootMin: 3800, lootMax: 7500, description: 'Artisan de La Forge Noire. Chaque arme qu\'il crée, il en teste la qualité sur quelqu\'un.', captureChance: 10, killChance: 38, isBoss: true, role: 'normal' },
  { name: "L'Archiviste sans Visage",   maxHp: 150, damageMin: 32, damageMax: 58, lootMin: 4000, lootMax: 8000, description: 'Gardien de L\'Entrepôt Zéro. Il connaît tous les secrets. Il enterre le reste.',captureChance: 8, killChance: 42, isBoss: true, role: 'ranged' },
  { name: 'Le Vigie Immortel',          maxHp: 160, damageMin: 28, damageMax: 52, lootMin: 3200, lootMax: 6500, description: 'Opérateur Faucon du Perchoir. Il surveille depuis si longtemps qu\'il ne sait plus rien faire d\'autre.', captureChance: 8, killChance: 40, isBoss: true, role: 'ranged' },
  { name: "Le Ravitailleur de l'Ombre", maxHp: 170, damageMin: 26, damageMax: 48, lootMin: 3300, lootMax: 6600, description: 'Logisticien des Faucons au Relais Noir. Sans lui la faction s\'effondre. Il le sait.',captureChance: 15, killChance: 32, isBoss: true, role: 'normal' },
  { name: 'Commandant Garant',          maxHp: 195, damageMin: 27, damageMax: 50, lootMin: 3600, lootMax: 7200, description: 'Commandant du Bastion Mineur. La frontière Gardienne, c\'est lui.',            captureChance: 20, killChance: 30, isBoss: true, role: 'tank'   },
  { name: 'La Marchande de Mort',       maxHp: 155, damageMin: 30, damageMax: 55, lootMin: 3500, lootMax: 7000, description: 'Commerçante du Comptoir Sud. Ce qu\'elle vend tue toujours, même les contrats d\'assurance.', captureChance: 12, killChance: 38, isBoss: true, role: 'ranged' },
  { name: 'Le Directeur Fantôme',       maxHp: 140, damageMin: 27, damageMax: 50, lootMin: 3000, lootMax: 6000, description: 'Responsable de l\'Annexe Commerciale. Officiellement un bureaucrate. Officieusement, un fantôme.', captureChance: 15, killChance: 35, isBoss: true, role: 'normal' },
  { name: 'Le Passeur Sanguinaire',     maxHp: 165, damageMin: 27, damageMax: 50, lootMin: 3300, lootMax: 6500, description: 'Il contrôle le Relais de Transit. Tout ce qui passe, il le taxe. Ou il le prend.', captureChance: 10, killChance: 36, isBoss: true, role: 'normal' },
  { name: 'Lord Daekar',                maxHp: 180, damageMin: 28, damageMax: 52, lootMin: 4000, lootMax: 8000, description: 'Noble déchu de la Résidence Orbitale. Il a tout perdu. Sauf sa violence.',         captureChance: 15, killChance: 34, isBoss: true, role: 'normal' },
  { name: 'Le Maître des Ombres',       maxHp: 160, damageMin: 32, damageMax: 58, lootMin: 4500, lootMax: 9000, description: 'Organisateur du Club Privé Éos. Les secrets qu\'il détient valent des armées.',  captureChance: 10, killChance: 40, isBoss: true, role: 'ranged' },
  { name: 'Le Survivant des Cendres',   maxHp: 175, damageMin: 27, damageMax: 50, lootMin: 3500, lootMax: 7000, description: 'Seul habitant des Cendres. Ce qui l\'a laissé en vie l\'a aussi transformé.',    captureChance: 8,  killChance: 40, isBoss: true, role: 'tank'   },
  { name: 'Le Gardien Originel',        maxHp: 200, damageMin: 30, damageMax: 55, lootMin: 4500, lootMax: 9000, description: 'Gardien du Berceau depuis l\'origine. Il ne laissera personne profaner ce lieu.',captureChance: 10, killChance: 38, isBoss: true, role: 'normal' },
  { name: 'Le Capitaine Amalgame',      maxHp: 210, damageMin: 28, damageMax: 50, lootMin: 4000, lootMax: 8000, description: 'Capitaine de L\'Épave Vivante. Mi-homme, mi-machine. Il a fusionné avec son vaisseau.', captureChance: 5, killChance: 35, isBoss: true, role: 'tank' },
  { name: 'Le Médiateur de Fer',        maxHp: 170, damageMin: 26, damageMax: 48, lootMin: 3200, lootMax: 6500, description: 'Arbitre de L\'Oasis de Fer. Il maintient la paix. Avec des méthodes peu pacifiques.', captureChance: 18, killChance: 30, isBoss: true, role: 'normal' },
  { name: 'Le Gardien du Signal',       maxHp: 155, damageMin: 24, damageMax: 45, lootMin: 3000, lootMax: 6000, description: 'Opérateur de La Balise. Il contrôle les routes navales. Il en abuse.',            captureChance: 20, killChance: 28, isBoss: true, role: 'normal' },
  { name: 'Le Seigneur des Routes',     maxHp: 180, damageMin: 27, damageMax: 50, lootMin: 3500, lootMax: 7000, description: 'Péagiste du Confluent. Tous les carrefours lui appartiennent. Surtout celui-ci.', captureChance: 15, killChance: 32, isBoss: true, role: 'normal' },
  { name: 'Le Chercheur Fracturé',      maxHp: 150, damageMin: 30, damageMax: 55, lootMin: 3800, lootMax: 7500, description: 'Ancien scientifique de Zéphyr. Son expérience a mal tourné. Sa tête aussi.',      captureChance: 12, killChance: 38, isBoss: true, role: 'support' },
  { name: "L'Astronome des Abysses",    maxHp: 165, damageMin: 33, damageMax: 60, lootMin: 4000, lootMax: 8000, description: 'Observateur de L\'Observatoire. Trop longtemps seul dans le vide. Ça laisse des traces.', captureChance: 8, killChance: 42, isBoss: true, role: 'ranged' },
  { name: 'La Créature de Mira',        maxHp: 230, damageMin: 32, damageMax: 58, lootMin: 4500, lootMax: 9000, description: 'Ce que les mineurs de Mira ont trouvé dans les galeries. Ce n\'est plus tout à fait humain.', captureChance: 3, killChance: 50, isBoss: true, role: 'tank' },
  { name: 'Le Contremaître Infernal',   maxHp: 195, damageMin: 28, damageMax: 52, lootMin: 3800, lootMax: 7500, description: 'Patron de La Raffinerie. Les ouvriers l\'appellent Enfer-sur-Roues. Pas en sa présence.', captureChance: 10, killChance: 38, isBoss: true, role: 'tank' },
  { name: 'Le Fantôme des Brumes',     maxHp: 170, damageMin: 30, damageMax: 55, lootMin: 3800, lootMax: 7500, description: 'Maître de Port des Brumes. Personne ne sait qui il est. Il a acheté cette incertitude.', captureChance: 5, killChance: 40, isBoss: true, role: 'ranged' },
  { name: 'Le Contremaître de Forge',  maxHp: 185, damageMin: 27, damageMax: 50, lootMin: 3500, lootMax: 7000, description: 'Il a construit Forge Alpha de ses propres mains. Il la défend de la même façon.', captureChance: 10, killChance: 35, isBoss: true, role: 'tank' },
  { name: 'Sœur Valkara',             maxHp: 155, damageMin: 24, damageMax: 46, lootMin: 3200, lootMax: 6500, description: 'Elle soigne. Elle tue aussi, si c\'est ce qu\'il faut pour protéger son sanctuaire.', captureChance: 20, killChance: 28, isBoss: true, role: 'support' },
  { name: 'ARIA-9 Protocole Noir',     maxHp: 145, damageMin: 35, damageMax: 62, lootMin: 4500, lootMax: 9000, description: 'L\'IA de Sanctum a décidé que l\'objectif est la protection. La définition de \'menace\' a évolué.', captureChance: 5, killChance: 45, isBoss: true, role: 'ranged' },
  { name: 'Docteur Flinch',            maxHp: 160, damageMin: 28, damageMax: 52, lootMin: 4000, lootMax: 8000, description: 'Il expérimente sur tout ce qui entre. Tu viens d\'entrer.', captureChance: 15, killChance: 35, isBoss: true, role: 'support' },
  { name: "L'Armurière Skade",         maxHp: 175, damageMin: 32, damageMax: 58, lootMin: 4200, lootMax: 8500, description: 'Chaque arme qu\'elle porte, elle l\'a conçue. Elles sont parfaites.', captureChance: 5, killChance: 42, isBoss: true, role: 'normal' },

  // ── PERSONNAGES PILIERS ───────────────────────────────────────────────────────
  { name: 'Cesarion',       maxHp: 480, damageMin: 48, damageMax: 85, lootMin: 10000, lootMax: 25000, description: 'Empereur de l\'Emporium Requiem. Derrière les douanes et les marchands d\'armes se cache un stratège militaire sans égal. Sa salve impériale ne laisse pas le temps de respirer.',                                   captureChance: 2,  killChance: 45, isBoss: true, role: 'tank',   pillarAbility: 'imperial_barrage' },
  { name: 'Raphazarus',     maxHp: 580, damageMin: 52, damageMax: 95, lootMin: 12000, lootMax: 30000, description: 'Général légendaire de la Grande Guerre. 47 ans dans l\'Arc Perdu ne l\'ont pas brisé — ils l\'ont affiné. Il a survécu à des choses que personne d\'autre n\'aurait traversées. Il attendait quelqu\'un.',             captureChance: 1,  killChance: 60, isBoss: true, role: 'normal', pillarAbility: 'phantom_strike'   },
  { name: 'Eliotis',        maxHp: 370, damageMin: 44, damageMax: 78, lootMin: 8000,  lootMax: 20000, description: 'Gouverneur de la Tribosphère. Il sourit toujours. Le sourire disparaît quand on trouble sa fête. La transformation est instantanée — et terrifiante.',                                                                   captureChance: 6,  killChance: 40, isBoss: true, role: 'normal', pillarAbility: 'party_over'       },
  { name: 'Le Roi Maxance', maxHp: 340, damageMin: 40, damageMax: 72, lootMin: 7000,  lootMax: 18000, description: 'Roi de Paradoxa Eterna. Pacifiste de nature, redoutable par nécessité. Les toxines de sa planète ne pardonnent pas.',                                                                                                   captureChance: 10, killChance: 30, isBoss: true, role: 'support', pillarAbility: 'flora_toxin'      },
  { name: 'Samy Scotty',    maxHp: 320, damageMin: 42, damageMax: 76, lootMin: 9000,  lootMax: 22000, description: 'Patron du casino de Scotty Golden North. Chaque crédit du secteur est passé par ses mains. Il mise tout ou rien — et quand il mise tout, les conséquences sont dévastatrices.',                                          captureChance: 4,  killChance: 44, isBoss: true, role: 'normal', pillarAbility: 'all_in'           },
]

export function getEnemyByTier(tier: 1 | 2 | 3 | 4): Enemy {
  const pools = { 1: TIER_LOW, 2: TIER_MID, 3: TIER_HIGH, 4: TIER_BOSS }
  const pool = pools[tier]
  return pool[Math.floor(Math.random() * pool.length)]
}

export function getEnemyForDepth(depth: number, day: number): Enemy {
  let tier: 1 | 2 | 3 | 4 = depth <= 2 ? 1 : depth <= 4 ? 2 : depth <= 7 ? 3 : 4
  if (day > 15 && tier === 1) tier = 2
  if (day > 30 && tier === 2) tier = 3
  return getEnemyByTier(tier)
}

// ── COMBATTANTS DE L'ARÈNE DE KORSUN ─────────────────────────────────────────
// 10 adversaires en escalade pour le tournoi
export const ARENA_FIGHTERS: Enemy[] = [
  { name: 'Recrue des arènes',        maxHp: 50,  damageMin: 7,  damageMax: 15, lootMin: 0, lootMax: 0, description: 'Premier combat, premier sang. Il tremble à peine.',             captureChance: 0, killChance: 5,  isBoss: false, role: 'normal' },
  { name: 'Gladiateur local',         maxHp: 70,  damageMin: 10, damageMax: 20, lootMin: 0, lootMax: 0, description: 'Il combat pour nourrir sa famille. Motivé.',                    captureChance: 0, killChance: 8,  isBoss: false, role: 'normal' },
  { name: 'Boucher de quartier',      maxHp: 90,  damageMin: 13, damageMax: 25, lootMin: 0, lootMax: 0, description: 'Spécialiste des corps à corps. Il aime ça.',                   captureChance: 0, killChance: 12, isBoss: false, role: 'tank'   },
  { name: 'Duelliste expérimenté',    maxHp: 105, damageMin: 16, damageMax: 30, lootMin: 0, lootMax: 0, description: 'Vingt victoires au compteur. Il te lit comme un livre.',        captureChance: 0, killChance: 15, isBoss: false, role: 'normal' },
  { name: 'Sniper de l\'arène',       maxHp: 85,  damageMin: 20, damageMax: 38, lootMin: 0, lootMax: 0, description: 'Arme à distance dans une cage fermée. Mauvais plan pour toi.', captureChance: 0, killChance: 18, isBoss: false, role: 'ranged' },
  { name: 'Berserker dopé',           maxHp: 130, damageMin: 22, damageMax: 42, lootMin: 0, lootMax: 0, description: 'Stimulants illégaux. Il ne ressent plus rien.',                captureChance: 0, killChance: 22, isBoss: false, role: 'tank'   },
  { name: 'Executeur masqué',         maxHp: 145, damageMin: 24, damageMax: 46, lootMin: 0, lootMax: 0, description: 'Personne ne connaît son visage. Seuls ses adversaires le voient.', captureChance: 0, killChance: 25, isBoss: false, role: 'normal' },
  { name: 'Chasseur de champions',    maxHp: 160, damageMin: 26, damageMax: 50, lootMin: 0, lootMax: 0, description: 'Il collectionne les crânes de vainqueurs. Tu arrives au bon moment.', captureChance: 0, killChance: 30, isBoss: false, role: 'ranged' },
  { name: 'Finaliste implacable',     maxHp: 185, damageMin: 30, damageMax: 55, lootMin: 0, lootMax: 0, description: 'Finaliste de trois tournois. Il n\'a jamais perdu le dernier round.', captureChance: 0, killChance: 35, isBoss: false, role: 'tank'   },
  { name: 'Le Champion des Arènes',   maxHp: 230, damageMin: 36, damageMax: 62, lootMin: 0, lootMax: 0, description: 'Champion en titre. Invaincu depuis deux ans. La foule l\'adore. Il te déteste déjà.', captureChance: 0, killChance: 40, isBoss: true,  role: 'normal' },
]

export function getArenaEnemyForRound(round: number): Enemy {
  const idx = Math.max(0, Math.min(9, round - 1))
  return ARENA_FIGHTERS[idx]
}

export function scaleEnemy(enemy: Enemy, level: number): Enemy {
  if (level <= 0) return enemy
  const mult = 1 + level * 0.25
  return {
    ...enemy,
    maxHp:     Math.floor(enemy.maxHp     * mult),
    damageMin: Math.floor(enemy.damageMin * mult),
    damageMax: Math.floor(enemy.damageMax * mult),
    lootMin:   Math.floor(enemy.lootMin   * mult),
    lootMax:   Math.floor(enemy.lootMax   * mult),
  }
}

// ── POOLS D'ENNEMIS PAR TYPE DE STATION ──────────────────────────────────────

type StationPool = { low: Enemy[], mid: Enemy[], high: Enemy[] }

// Cherche des ennemis par nom dans les trois tiers
function _pick(...names: string[]): Enemy[] {
  const all = [...TIER_LOW, ...TIER_MID, ...TIER_HIGH]
  return names.map(n => all.find(e => e.name === n) ?? TIER_LOW[0])
}

const POOL_FAUCON: StationPool = {
  low:  _pick('Éclaireur Faucon', 'Milicien de pacotille', 'Garde corrompu', 'Rat de cargaison'),
  mid:  _pick('Agent Faucon infiltré', 'Déserteur armé', 'Officier renégat', 'Hacker de rue'),
  high: _pick('Commandant Faucon Noir', 'Élite des Faucons Noirs', 'Assassin du Conclave', 'Fantôme de la Garde Noire'),
}

const POOL_GARDIEN: StationPool = {
  low:  _pick('Recrue Gardienne', 'Garde corrompu', 'Milicien de pacotille', 'Sous-officier véreux'),
  mid:  _pick('Soldat Gardien Écarlate', 'Chasseur de primes', 'Officier renégat', 'Déserteur armé'),
  high: _pick('Capitaine Gardien Écarlate', 'Garde du corps impitoyable', 'Commandant renégat', 'Exécuteur du Tribunal'),
}

const POOL_EMPORIUM: StationPool = {
  low:  _pick('Vigile Emporium', 'Garde corrompu', 'Milicien de pacotille', 'Sous-officier véreux'),
  mid:  _pick("Garde Emporium armé", "Trafiquant d'organes", 'Caïd de station', 'Agent double'),
  high: _pick("Exécuteur de l'Emporium", "Garde de l'Emporium", 'Assassin du Conclave', 'Exécuteur du Tribunal'),
}

const POOL_CRIMINEL: StationPool = {
  low:  _pick('Pickpocket désespéré', 'Ivrogne agressif', 'Drogué au Synth', 'Toxicomane sous injection', 'Rat de cargaison'),
  mid:  _pick('Pirate solitaire', 'Contrebandier défensif', 'Gang de rue spatial', 'Hacker de rue', 'Caïd de station'),
  high: _pick('Baron des bas-fonds', 'Commandant renégat', 'Fantôme de la Garde Noire', 'Traqueur de factions'),
}

const POOL_MILITAIRE: StationPool = {
  low:  _pick('Milicien de pacotille', 'Garde corrompu', 'Sous-officier véreux', 'Chasseur de primes novice'),
  mid:  _pick('Officier renégat', 'Déserteur armé', 'Chasseur de primes', 'Sergent des bas-fonds'),
  high: _pick('Commandant renégat', 'Garde du corps impitoyable', 'Exécuteur du Tribunal', 'Berserker augmenté'),
}

const POOL_RUINS: StationPool = {
  low:  _pick('Survivant des ruines', 'Scavenger opportuniste', 'Vagabond armé', 'Mendiant armé'),
  mid:  _pick('Scavenger vétéran', 'Mercenaire des ruines', 'Pirate reconverti', 'Dresseur de bêtes mutantes'),
  high: _pick('Vétéran des ruines', 'Ancien du Vide', 'Traqueur de factions', 'Sniper des abysses'),
}

const POOL_LUXE: StationPool = {
  low:  _pick('Vigile Emporium', 'Chasseur de primes novice', 'Fuyarde paniquée', 'Garde corrompu'),
  mid:  _pick("Garde Emporium armé", 'Assassin de bas étage', 'Agent double', "Trafiquant d'organes"),
  high: _pick("Exécuteur de l'Emporium", 'Assassin du Conclave', 'Garde du corps impitoyable', 'Fantôme de la Garde Noire'),
}

const POOL_INDUSTRIEL: StationPool = {
  low:  _pick('Mineur agressif', 'Ouvrier en colère', 'Réparateur jaloux', 'Scavenger opportuniste'),
  mid:  _pick('Contrebandier défensif', 'Scavenger vétéran', 'Sergent des bas-fonds', 'Dresseur de bêtes mutantes'),
  high: _pick('Ingénieur de guerre', 'Berserker augmenté', 'Vétéran des ruines', 'Pilote de combat au sol'),
}

const POOL_SCIENTIFIQUE: StationPool = {
  low:  _pick('Réparateur jaloux', 'Pilote raté', 'Rat de cargaison', 'Vigile Emporium'),
  mid:  _pick('Hacker de rue', 'Agent double', 'Contrebandier défensif', 'Officier renégat'),
  high: _pick('Ingénieur de guerre', 'Traqueur de factions', 'Fantôme de la Garde Noire', 'Sniper des abysses'),
}

const STATION_POOL_MAP: Record<string, StationPool> = {
  // Faucons Noirs
  'Arc Ouest Apocalypse':  POOL_FAUCON,
  'Le Nid des Faucons':    POOL_FAUCON,
  'Le Perchoir':           POOL_FAUCON,
  'Station Ombre':         POOL_FAUCON,
  'Relais Noir':           POOL_FAUCON,
  'La Tanière':            POOL_FAUCON,
  'Fort de Cendres':       POOL_FAUCON,
  "L'Œil du Faucon":      POOL_FAUCON,
  // Gardiens Écarlates
  'La Citadelle Écarlate': POOL_GARDIEN,
  'Bastion Mineur':        POOL_GARDIEN,
  'Poste Vigie':           POOL_GARDIEN,
  "L'Arsenal Écarlate":   POOL_GARDIEN,
  'La Forteresse Exilée':  POOL_GARDIEN,
  // Emporium
  'Emporium Requiem':      POOL_EMPORIUM,
  'Comptoir Sud':          POOL_EMPORIUM,
  'Annexe Commerciale':    POOL_EMPORIUM,
  'Relais de Transit':     POOL_EMPORIUM,
  // Criminel / bas-fonds
  'Les Bas-Fonds de Vega': POOL_CRIMINEL,
  'Repaire Vega-Sud':      POOL_CRIMINEL,
  'Port de Nuit':          POOL_CRIMINEL,
  'La Forge Noire':        POOL_CRIMINEL,
  "L'Entrepôt Zéro":      POOL_CRIMINEL,
  // Militaire neutre
  'Fort Kharos':           POOL_MILITAIRE,
  'Fort Ossian':           POOL_MILITAIRE,
  'Star Quest':            POOL_MILITAIRE,
  // Ruines / abandonnées
  'Le Purgatoire':         POOL_RUINS,
  'Les Abysses de Velkor': POOL_RUINS,
  'Les Cendres':           POOL_RUINS,
  'Station Quarantaine':   POOL_RUINS,
  'Le Berceau':            POOL_RUINS,
  "L'Épave Vivante":      POOL_RUINS,
  'Station Fantôme':       POOL_RUINS,
  // Luxe / haute société
  "La Couronne d'Eos":    POOL_LUXE,
  'Résidence Orbitale':    POOL_LUXE,
  "Club Privé Éos":       POOL_LUXE,
  'Scotty Golden North':   POOL_LUXE,
  // Industriel / minier
  'Station Rocaille':      POOL_INDUSTRIEL,
  'Les Cavernes de Mira':  POOL_INDUSTRIEL,
  'La Raffinerie':         POOL_INDUSTRIEL,
  // Scientifique
  'Nexus Aldara':          POOL_SCIENTIFIQUE,
  'Station Zéphyr':        POOL_SCIENTIFIQUE,
  "L'Observatoire":       POOL_SCIENTIFIQUE,
  'Station Limite':        POOL_SCIENTIFIQUE,
  // Personnages piliers — nouvelles stations
  "L'Arc Perdu":          POOL_RUINS,
  'La Tribosphère':        POOL_MILITAIRE,
  'Paradoxa Eterna':       POOL_GARDIEN,
  // Nouvelles stations
  'Port des Brumes':          POOL_CRIMINEL,
  'Forge Alpha':              POOL_INDUSTRIEL,
  'Le Sanctuaire des Dérives': POOL_LUXE,
  'Sanctum Machina':          POOL_SCIENTIFIQUE,
  'La Bulle':                 POOL_SCIENTIFIQUE,
  'La Forge des Damnés':      POOL_CRIMINEL,
}

export function getEnemyForStation(stationName: string, depth: number, day: number): Enemy {
  const pool = STATION_POOL_MAP[stationName]
  if (!pool) return getEnemyForDepth(depth, day)
  const tier: 'low' | 'mid' | 'high' = depth <= 2 ? 'low' : depth <= 5 ? 'mid' : 'high'
  const arr = pool[tier]
  return arr[Math.floor(Math.random() * arr.length)]
}

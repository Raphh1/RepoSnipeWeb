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
]

export const TIER_HIGH: Enemy[] = [
  { name: 'Élite des Faucons Noirs',     maxHp: 120, damageMin: 20, damageMax: 40, lootMin: 1000, lootMax: 2500, description: 'Entraîné, équipé, motivé.',               captureChance: 15, killChance: 25, isBoss: false, role: 'normal' },
  { name: 'Garde de l\'Emporium',        maxHp: 130, damageMin: 18, damageMax: 38, lootMin: 800,  lootMax: 2000, description: 'Armure lourde, zéro humour.',              captureChance: 40, killChance: 5,  isBoss: false, role: 'tank' },
  { name: 'Assassin du Conclave',        maxHp: 100, damageMin: 25, damageMax: 48, lootMin: 1500, lootMax: 3500, description: 'Tu ne l\'as pas vu venir.',                captureChance: 10, killChance: 35, isBoss: false, role: 'ranged' },
  { name: 'Bras droit d\'Alanossa',      maxHp: 140, damageMin: 22, damageMax: 42, lootMin: 1200, lootMax: 3000, description: 'Il a survécu à des dizaines de combats.',  captureChance: 20, killChance: 25, isBoss: false, role: 'normal' },
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
  { name: 'Le Roi de Nuit',           maxHp: 175, damageMin: 25, damageMax: 46, lootMin: 4000, lootMax: 8000, description: 'Il dirige Port de Nuit depuis l\'ombre. Il n\'en sort jamais.',  captureChance: 15, killChance: 30, isBoss: true, role: 'normal' },
]

export function getEnemyByTier(tier: 1 | 2 | 3 | 4): Enemy {
  const pools = { 1: TIER_LOW, 2: TIER_MID, 3: TIER_HIGH, 4: TIER_BOSS }
  const pool = pools[tier]
  return pool[Math.floor(Math.random() * pool.length)]
}

export function getEnemyForDepth(depth: number, day: number): Enemy {
  let tier: 1 | 2 | 3 | 4 = depth <= 1 ? 1 : depth <= 3 ? 2 : depth <= 5 ? 3 : 4
  if (day > 15 && tier === 1) tier = 2
  if (day > 30 && tier === 2) tier = 3
  return getEnemyByTier(tier)
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

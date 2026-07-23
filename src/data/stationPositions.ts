export interface StationPos { x: number; y: number }

// Coordonnées de la carte — espace 1000×690
export const STATION_POSITIONS: Record<string, StationPos> = {
  // ── NOYAU ─────────────────────────────────────────────────────────────────
  'La Carcasse':               { x: 420, y: 340 },
  'Port Méridien':             { x: 360, y: 255 },
  'Confluent':                 { x: 430, y: 415 },
  'La Balise':                 { x: 380, y: 490 },
  "L'Oasis de Fer":            { x: 510, y: 400 },
  'Le Grand Bazar':            { x: 470, y: 470 },

  // ── SCIENTIFIQUE ─────────────────────────────────────────────────────────
  'Fort Kharos':               { x: 455, y: 185 },
  'Nexus Aldara':              { x: 530, y: 215 },
  'Station Zéphyr':            { x: 570, y: 162 },
  'Le Berceau':                { x: 555, y: 278 },
  'Sanctum Machina':           { x: 610, y: 208 },
  "L'Observatoire":            { x: 638, y: 125 },
  'Station Limite':            { x: 700, y: 158 },
  'La Bulle':                  { x: 682, y: 200 },
  'Le Purgatoire':             { x: 555, y: 318 },
  'Le Sanctuaire des Dérives': { x: 415, y: 218 },

  // ── FAUCONS NOIRS ────────────────────────────────────────────────────────
  'Arc Ouest Apocalypse':      { x: 128, y: 248 },
  'Le Nid des Faucons':        { x: 112, y: 328 },
  'Le Perchoir':               { x: 158, y: 385 },
  'Station Ombre':             { x: 72,  y: 355 },
  'Relais Noir':               { x: 192, y: 298 },
  'La Tanière':                { x: 102, y: 440 },
  'Fort de Cendres':           { x: 152, y: 460 },
  "L'Œil du Faucon":           { x: 222, y: 210 },

  // ── CRIMINEL / BAS-FONDS ─────────────────────────────────────────────────
  'Les Bas-Fonds de Vega':     { x: 248, y: 312 },
  'Repaire Vega-Sud':          { x: 215, y: 392 },
  'Port de Nuit':              { x: 265, y: 430 },
  'Port des Brumes':           { x: 252, y: 362 },
  'La Forge des Damnés':       { x: 298, y: 475 },

  // ── COLONIES / PAISIBLE ──────────────────────────────────────────────────
  'Colonie Perséphone':        { x: 368, y: 505 },
  'Paradoxa Eterna':           { x: 308, y: 548 },
  'Station Rocaille':          { x: 442, y: 512 },

  // ── MILITAIRE ────────────────────────────────────────────────────────────
  'Fort Ossian':               { x: 502, y: 448 },
  'Poste Vigie':               { x: 535, y: 492 },
  'Bastion Mineur':            { x: 728, y: 430 },
  'La Citadelle Écarlate':     { x: 768, y: 365 },
  "L'Arsenal Écarlate":        { x: 808, y: 408 },
  'La Forteresse Exilée':      { x: 752, y: 295 },

  // ── INDUSTRIEL / MINIER ──────────────────────────────────────────────────
  'La Forge Noire':            { x: 488, y: 545 },
  'Les Cavernes de Mira':      { x: 528, y: 575 },
  'La Raffinerie':             { x: 510, y: 608 },
  'Forge Alpha':               { x: 548, y: 628 },
  "L'Entrepôt Zéro":           { x: 582, y: 528 },
  'Station Fantôme':           { x: 472, y: 478 },

  // ── EMPORIUM ─────────────────────────────────────────────────────────────
  'Emporium Requiem':          { x: 655, y: 322 },
  'Comptoir Sud':              { x: 638, y: 392 },
  'Annexe Commerciale':        { x: 698, y: 348 },
  'Relais de Transit':         { x: 612, y: 388 },

  // ── LUXE / HAUTE SOCIÉTÉ ─────────────────────────────────────────────────
  "L'Arène de Korsun":         { x: 718, y: 268 },
  'Star Quest':                { x: 748, y: 225 },
  "La Couronne d'Eos":         { x: 822, y: 268 },
  'Résidence Orbitale':        { x: 862, y: 215 },
  "Club Privé Éos":            { x: 852, y: 302 },
  'Scotty Golden North':       { x: 825, y: 378 },
  'La Tribosphère':            { x: 782, y: 172 },

  // ── RUINES / MYSTÉRIEUSES ────────────────────────────────────────────────
  'Les Cendres':               { x: 618, y: 488 },
  "L'Épave Vivante":           { x: 622, y: 552 },
  'Les Abysses de Velkor':     { x: 742, y: 498 },
  'Station Quarantaine':       { x: 702, y: 562 },
  "L'Arc Perdu":               { x: 792, y: 538 },

  // ── PILIERS / ZONES SPÉCIALES ────────────────────────────────────────────
  'Paradoxa Eterna':           { x: 308, y: 548 },
  'La Tribosphère':            { x: 782, y: 172 },
}

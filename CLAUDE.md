# VoidTrader — Plan d'implémentation

Suivi de progression des items PARTIAL / NOT DONE identifiés dans les 3 documents (Audit, Backlog, Design).

## Sprint 1 — Fixes & Exploits

- [x] **1.1 Softlock carburant dynamique** — Seuil remplacé par calcul dynamique `reachableCount`. Bandeau alerte quand <=1 destination. Scavenge si 0 destinations ou fuel=0.
- [x] **1.2 Fuite retentable sans cap** — `fleeAttempts` ajouté à CombatState. Cap à 2 tentatives, bouton caché + message après.
- [x] **1.3 Scavenge farm rep** — Flag `scavengedThisVisit` reset au voyage, bloque le re-scavenge avec message.
- [x] **1.4 Arbitrage même station** — `getFullBuyMult` garanti >= `sellMult + 0.10`, impossible de profiter même avec discounts max.
- [x] **1.5 Collision escort/combat** — Guard `screen !== 'escort-minigame'` sur le trigger rival dans travel().
- [x] **1.6 Save version/migration** — `version: 1` + `migrate()` ajoutés au persist Zustand. Initialise les nouveaux champs pour les vieilles saves.
- [x] **1.7 Routes ignorent les stations interdites** — `findPath()` accepte `excluded: Set<string>`. TravelScreen et MapScreen passent l'union des stations bannies + Arc Perdu + fermées par événement.

## Sprint 2 — UX Core & Information

- [x] **2.1 Briefing d'arrivée unifié** — Tous les pop-ups (daySummary, worldEvent, chainEvent, travelMsg, quest, objectif) fusionnés en un seul bloc "BRIEFING — JOUR X" avec sections empilées et un bouton "Continuer" qui dismiss tout. ArrivalSit reste séparé car interactif.
- [x] **2.2 Alerte fuel stranding** — Fait dans 1.1 : bandeau rouge quand <=1 destination accessible + scavenge dynamique.
- [x] **2.3 % de réussite affiché** — `getActionSuccessChance()` + `getChanceLabel()` ajoutés dans nexus.ts. NexusScreen affiche "X% — Label" sur chaque bouton d'action (manipulate 30-40%, legendary 55%, war 60%).
- [x] **2.4 Tokens visuels d'actions** — 3 losanges (remplis = utilisés, vides = restants) + compteur "X restantes" dans la section ACTIONS.
- [x] **2.5 TypewriterText vitesse** — Bouton toggle normal/rapide (22ms/5ms) persisté en localStorage. Visible pendant l'animation.
- [x] **2.6 Exit point naturel** — Bandeau doré "Fin de journée — bon moment pour voyager ou se reposer" quand 3 actions épuisées.
- [x] **2.7 StatusBar épuré** — REP retiré de la StatusBar (ira dans l'écran Réputation unifié). Reste : PV, Stamina, Vaisseau, Crédits, Fuel, Jour.

## Sprint 3 — Écran Réputation & Nexus UI

- [x] **3.1 Écran Réputation unifié** — 3 tabs : Générale (rep globale + traits moraux + stats), Piliers (6 standings avec barres + labels ALLIÉ/RESPECTÉ/CONNU/INCONNU/ENNEMI), Factions (missions + cartes avec rep bars). Titre changé "RÉPUTATION".
- [x] **3.2 Deltas visibles sur choix** — Preview automatique des conséquences avant clic sur ExploreResultPanel et WanderResultPanel. Simule le résultat (sauf si random) et affiche les deltas (cr, rép, PV, fuel, prison). Supporte aussi un champ `hint` manuel.
- [x] **3.3 Dilemmes cross-cost piliers** — 5 scènes de dilemmes piliers ajoutées (Cesarion/Raphazarus, Eliotis/Maxance, Alanossa/Scotty, Raphazarus/Alanossa, Maxance/Cesarion/Eliotis). Helper `pillarShift()` pour multi-shift. Inclus dans toutes les zones d'exploration.

## Sprint 4 — Game Feel & Polish

- [x] **4.1 Crit shake + gold flash** — CSS keyframe `critShake` sur le conteneur combat lors d'un crit (détecté via log entry type 'crit'). CSS `goldFlash` sur NexusScreen quand un fragment est collecté.
- [x] **4.2 Momentum finisher** — Classe CSS `momentum-pulse` (glow animation infinie) sur le bouton finisher quand momentum >= 3. SFX `playFinisher()` dédié.
- [x] **4.3 SFX navigation/UI** — `playNavigate()` sur goTo (changement d'écran), `playCollectClue()` à l'archivage de fragment lore, `playFinisher()` au clic finisher. `playMenuOpen()` disponible.
- [x] **4.4 Events rares visuels** — Champ `rare?: boolean` sur ExploreResult. CSS `rareBorder` (bordure animée gold/purple). Label "★ ÉVÉNEMENT RARE" + classe `rare-event`. Dilemmes piliers marqués rares.
- [x] **4.5 Recap fin de run amélioré** — `NextUnlockBar` déjà existant avec barre de progression "Prochain déblocage" sur victoire et game over. Aucun changement nécessaire.
- [x] **4.6 Arbre méta clair** — MetaScreen restructuré avec tags visuels DÉBLOQUÉ/VERROUILLÉ/DISPONIBLE, icônes (✓/🔒/○), et requirement inline. Preview de chaque bonus via description.
- [x] **4.7 Compteur lore + milestones** — Compteur X/52 fragments affiché dans le tracker Nexus du StationHub. Milestones à 25% (+500cr, +10 rép), 50% (+1000cr, +20 rép), 75% (+2000cr, +30 rép), 100% (+5000cr, +50 rép).

## Sprint 5 — Tutoriel & Narration

- [x] **5.1 Première quête scriptée** — `buildTutorialQuest()` auto-assignée au jour 1 (id `tutorial-delivery`, giver "Vieux Doss"). Livraison d'un good vendu sur place (≠ Médicaments pour forcer l'achat) vers la station accessible la moins chère. Récompense : 800 cr + 15 rép + révélation du tracker Nexus (`nexusTrackerUnlocked`). Avant complétion, le tracker affiche un teaser. Migration v2 : vieilles saves = tracker visible d'office.
- [x] **5.2 Seeding early piliers** — `src/engine/pillarRumors.ts` : 8 rumeurs mentionnant les 6 détenteurs par nom. `rollPillarRumor()` injecte dans travelMsg jours 3-8 (~50% chance), sans répétition (`pillarRumorsSeen`). Affiché dans le briefing d'arrivée.
- [x] **5.3 NPC callbacks enrichis** — `getPillarCallback()` dans npcTracker : PNJ craignent le joueur si un détenteur est rendu ennemi (`nexusAngered`), se méfient si Alanossa trahie (standing <= -25), montrent du respect si standing pilier >= 60. Priorité sur les salutations génériques.

---

## Résumé progression

| Sprint | Total | Done | Restant |
|--------|-------|------|---------|
| 1 — Fixes | 7 | 7 | 0 |
| 2 — UX | 7 | 7 | 0 |
| 3 — Réputation | 3 | 3 | 0 |
| 4 — Polish | 7 | 7 | 0 |
| 5 — Tutoriel | 3 | 3 | 0 |
| **Total** | **27** | **27** | **0** |

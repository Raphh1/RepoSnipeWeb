# 🗂️ VOID TRADER — Backlog priorisé (Design + UX)

Tickets actionnables, triés par ratio **plaisir/coût**. Chaque ticket = un objectif, les fichiers à toucher, et un critère d'acceptation.
Légende : Impact / Coût / Risque.

---

## 🥇 SPRINT 1 — Quick wins à fort impact (game feel & lisibilité)

### T1 — Juice sur les gains (pop de chiffres + secousse) · Très fort / Faible / Faible
- **But** : chaque gain de crédits/loot/rép/PV "pop" en couleur et s'anime ; secousse d'écran sur coup critique ; flash doré sur fragment Nexus.
- **Fichiers** : nouveau composant `components/ui/FloatingNumber.tsx` ; hooks dans `CombatScreen.tsx`, `MarketScreen.tsx`, `StatusBar.tsx`, `NexusScreen.tsx`.
- **Acceptation** : un achat/un hit déclenche une animation visible sans clic.

### T2 — Banque de SFX (Web Audio, zéro asset) · Fort / Moyen / Faible
- **But** : sons synthétiques pour clic, achat, hit, crit, victoire, alerte carburant.
- **Fichiers** : nouveau `engine/sfx.ts` (oscillateurs Web Audio) ; appels dans les écrans clés ; toggle son dans les options.
- **Acceptation** : chaque action majeure émet un son ; désactivable.

### T3 — Typewriter : skip + vitesse · Fort / Faible / Faible
- **But** : clic = compléter le texte ; double-clic = passer ; réglage de vitesse ; pas d'effet sur texte déjà lu.
- **Fichiers** : `components/ui/TypewriterText.tsx` ; réglage dans options ; flag "déjà lu" pour ambiance/journal.
- **Acceptation** : on peut lire à son rythme et ne jamais subir le défilement.

### T4 — Tracker Nexus "1/4" permanent · Très fort / Faible / Faible
- **But** : indicateur persistant des fragments dans le hub, qui s'illumine à chaque gain.
- **Fichiers** : `components/screens/StationHub.tsx` (header) ; lit `gs.nexusFragments`.
- **Acceptation** : depuis le hub, le joueur voit sa progression vers la victoire.
- **Dépendance** : corriger d'abord les bugs Nexus (force non collectée, Eliotis injouable) — voir audit QA.

---

## 🥈 SPRINT 2 — Clarté des choix & de l'arrivée

### T5 — Deltas de choix visibles · Très fort / Faible / Faible
- **But** : afficher l'effet d'un choix ("Alanossa te respectera +", "−5 rép Emporium") à la résolution.
- **Fichiers** : `engine/*Events.ts`, `narrativeArcs.ts`, `exploration.ts` (exposer les deltas) ; panneaux `components/screens/hub/*Panel.tsx`.
- **Acceptation** : aucune conséquence sociale n'est silencieuse.

### T6 — Briefing d'arrivée unifié · Fort / Faible / Faible
- **But** : fusionner les pop-ups séquentiels (world event, voyage, objectif, quête, chain event) en une carte unique.
- **Fichiers** : `components/screens/StationHub.tsx` (blocs `worldEventPopup`/`dismissTravel`/`dismissObj`/`dismissQuest`/`dismissChain`).
- **Acceptation** : 1 seul écran, 1 seul bouton avant de reprendre le contrôle.

### T7 — Callbacks narratifs · Fort / Moyen / Moyen
- **But** : des PNJ référencent des décisions passées (`pastDecisions`).
- **Fichiers** : `engine/npcLore.ts`, `npcTracker.ts`, events ; lecture de `pastDecisions`.
- **Acceptation** : au moins 5 callbacks déclenchables selon l'historique.

---

## 🥉 SPRINT 3 — Onboarding & flow

### T8 — Première quête scriptée (tutoriel par la pratique) · Très fort / Moyen / Faible
- **But** : déverrouiller les systèmes un par un au lieu d'un pavé de texte.
- **Fichiers** : `components/screens/StationHub.tsx` (révélation progressive des boutons), nouveau script d'intro ; `IntroScreen.tsx`/`ClassSelect.tsx`.
- **Acceptation** : un nouveau joueur n'a jamais plus de 3 actions possibles à la fois au jour 1.

### T9 — Résumé de fin de journée · Moyen / Moyen / Faible
- **But** : battement régulier "encore un jour" + point de sortie naturel.
- **Fichiers** : nouvel écran/modal de fin de jour ; hook sur l'avance de `gs.day`.
- **Acceptation** : passer au jour suivant affiche gains + une ligne d'ambiance.

### T10 — Recap de fin de run + "prochain déblocage" · Très fort / Moyen / Faible
- **But** : vendre la relance (cœur roguelite).
- **Fichiers** : `GameOver`/`Victory` dans `App.tsx` ; `store/metaStore.ts` ; corriger `addRunSummary` (centraliser dans `endRun()`).
- **Acceptation** : l'écran de mort montre points gagnés + barre "X points avant le prochain déblocage".

---

## 🛠️ SPRINT 4 — Refonte structurelle (plus lourd)

### T11 — Écran Réputation unifié · Très fort / Moyen / Moyen
- **But** : remplacer l'affichage éclaté des 4 tracks par un écran à onglets + une jauge contextuelle selon le lieu.
- **Fichiers** : `FactionsScreen.tsx` (étendre), `StatusBar.tsx`, lecture de `reputation`/`factionReputation`/`pillarStanding`.
- **Acceptation** : à l'Emporium, le joueur voit en un coup d'œil sa relation Emporium + Cesarion.

### T12 — Rationaliser les mini-jeux · Moyen / Moyen / Moyen
- **But** : garder 2-3 mini-jeux excellents, retirer/fusionner les autres.
- **Fichiers** : `components/minigames/*`, points d'appel dans `StationHub.tsx`.
- **Acceptation** : chaque mini-jeu restant a une raison d'exister et un bon feel.

### T13 — Brancher ou supprimer le système d'arrivée · Moyen / Moyen / Moyen
- **But** : exploiter `arrivalSituations.ts` (actuellement code mort) ou le retirer.
- **Fichiers** : `engine/arrivalSituations.ts`, `gameStore.ts` (`pendingArrival`), nouvel écran de choix d'arrivée.
- **Acceptation** : `pendingArrival` est soit lu et jouable, soit supprimé proprement.

### T14 — Semer les piliers tôt · Fort / Moyen / Moyen
- **But** : mentions/rumeurs des 4 piliers dès le début pour créer l'attachement avant le Nexus.
- **Fichiers** : `engine/worldEvents.ts`, `npcLore.ts`, `journal.ts`, `loreFragments.ts`.
- **Acceptation** : chaque pilier est évoqué au moins une fois avant le mid-game.

---

## Ordre conseillé
SPRINT 1 (juice + Nexus tracker) → SPRINT 2 (clarté des choix) → SPRINT 3 (onboarding + rétention) → SPRINT 4 (refonte). Les bugs QA bloquants (Nexus, softlock carburant, sauvegardes) doivent être réglés **avant ou en parallèle** de T4 et T10.

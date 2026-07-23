# 🛰️ VOID TRADER WEB — RAPPORT FINAL CONSOLIDÉ
### Audit progression-blockers + état + exploits, + récap intégral de l'audit précédent

> **Méthodo** : audit en lecture seule du code source (`src/`). Findings vérifiés sur le code, pas supposés.
> Fichiers clés analysés : `nexus.ts`, `NexusScreen.tsx`, `gameStore.ts`, `combat.ts`, `PrisonScreen.tsx`, `StationHub.tsx`, `marketPricing.ts`, `narrativeArcs.ts`, `quests.ts`, `metaStore.ts`.

---

## 🚨 RÉSUMÉ EXÉCUTIF

Le jeu a **un défaut de conception qui rend la victoire impossible pour la plupart des parties** : le fragment Nexus d'**Eliotis** n'a, en pratique, **aucune méthode d'obtention fiable**. Comme les 4 fragments sont obligatoires pour gagner, une grande partie des runs sont des **dead-ends de victoire silencieux**. À cela s'ajoutent le softlock carburant vécu en jeu, des invariants d'état violables, et des exploits économiques massifs. Le build officiel (`npm run build`) est **cassé** (70 erreurs TypeScript).

---

# PARTIE 1 — BLOCAGES DE PROGRESSION

## 🔴🔴 DEAD-END #1 — Le fragment Eliotis est quasi-impossible à obtenir → victoire bloquée

Pour gagner, il faut les **4 fragments** (`NexusScreen.tsx:186` → `collected.length >= 4`). Méthodes du fragment Eliotis (idx 2, `nexus.ts:128-164`) :

| Méthode | Condition | Verdict |
|---|---|---|
| `force` | toujours "ok" | ❌ **CASSÉ** — le combat ne collecte jamais le fragment (voir #2) |
| `alliance` | `standing.eliotis >= 30` (+ 2 fragments déjà obtenus) | ❌ **IMPOSSIBLE** — le standing d'Eliotis n'a **aucune source dans tout le jeu** sauf l'obtention du fragment elle-même (`nexus.ts:288,305`). Chicken-and-egg. |
| `lore` | `decisions.includes('nexus-seeker')` | ❌ **IMPOSSIBLE** — `'nexus-seeker'` n'est écrit **nulle part** (seulement lu). Branche morte permanente. |
| `legendary` | arme **Tier 5** + `bossesDefeated≥2` + `nexusDone≥1` | ✅ **SEULE voie viable** — mais consomme une arme Tier 5 |

**Conclusion : Eliotis ne peut être obtenu QUE en sacrifiant une arme Tier 5.** Les armes Tier 5 ne tombent **que** des boss (`combat.ts:884`) ou de la finale de tournoi (`gameStore.ts:725`).

➡️ Tout joueur qui n'a jamais tué de boss, ou qui a perdu/cédé son arme Tier 5, **ne peut PLUS jamais finir le jeu**, sans aucun message. Sévérité 🔴 CRITIQUE — certitude **Élevée**.

## 🔴 DEAD-END #2 — La méthode "Forcer" est cassée pour les 4 fragments

`NexusScreen.tsx:72-80` : `force` lance un combat et pose `nexusPath[idx]='force'` (commentaire *« On marquera le fragment après le combat via la victoire »*). Mais `handleCombatOutcome` (`gameStore.ts:743-800`) **ne lit jamais `nexusPath` et n'appelle jamais `collectNexusFragment`**.

➡️ Gagner le combat du gardien ne donne **jamais** le fragment. La méthode présentée comme universelle (seule option sans prérequis pour Alanossa, Scotty, Eliotis) est inopérante. 🔴 CRITIQUE — certitude **Élevée**.

## 🔴 DEAD-END #3 — Perte définitive de l'arme Tier 5 (clé de la victoire)

Eliotis **exige** une arme Tier 5 (#1). Tout ce qui la fait disparaître ferme la victoire :
- **Scavenge carburant "Céder [arme]"** (`StationHub.tsx:456-470`) cède `gs.weapons[gs.weapons.length - 1]` — la **dernière arme ramassée**, typiquement la Tier 5 qui vient de tomber d'un boss. Échange involontaire de l'arme de victoire contre +2 carburant.
- **Cesarion `legendary`** (`nexus.ts:265-273`) consomme aussi une Tier 5. Avec une seule Tier 5, l'utiliser sur Cesarion ferme Eliotis (Cesarion a `pay 18000` en repli — pas Eliotis).

➡️ Interaction silencieuse menant à une victoire définitivement impossible. 🔴 CRITIQUE — certitude **Élevée**.

## 🔴 SOFTLOCK #4 — Zone morte carburant (vécu en jeu)

Bouton "Chercher du carburant" gaté à `fuel < 3` (`StationHub.tsx:947`), coûts de voyage jusqu'à **5** (`stations.ts`) **+1** via événement mondial = **6**, et le scavenge ne donne qu'**une action par visite** (`StationHub.tsx:566-618` : le résultat masque les boutons, "Retour" repasse au menu où le bouton disparaît dès `fuel≥3`).

➡️ **Zone morte à fuel = 3, 4 ou 5** : trop pour déclencher le sauvetage, pas assez pour voyager, surtout avec des destinations bannies. **Softlock total.** 🔴 CRITIQUE — certitude **Élevée**.

## 🟠 #5 — Système de situations d'arrivée mort
`pendingArrival` (`gameStore.ts:363`) n'est jamais lu/nettoyé ; tout `arrivalSituations.ts` est du code mort. Contenu de progression invisible (amendes/prison/récompenses jamais déclenchés). 🟠

---

# PARTIE 2 — INVARIANTS D'ÉTAT VIOLABLES

| Invariant attendu | Violé ? | Où |
|---|---|---|
| `0 ≤ fuel ≤ maxFuel` | ❌ fuel peut devenir **négatif** | `travel()` `gameStore.ts:218` (pas de `Math.max(0,…)`) |
| objet équipé ∈ inventaire | ❌ `equippedWeapon` peut pointer une arme cédée | scavenge `StationHub.tsx:456` |
| PV cohérents avec maxPV | ❌ équiper/déséquiper armure laisse des PV "fantômes" | `gameStore.ts:510-536` |
| `nexusFragments` cohérent avec `nexusPath` | ⚠️ `nexusPath[idx]='force'` posé sans collecte → état incohérent | `NexusScreen.tsx:79` |
| `pendingArrival` nettoyé | ❌ reste à `true` indéfiniment | `gameStore.ts:363` |
| capacité cargo respectée | ❌ aucune borne | `buyCargo gameStore.ts:539` |
| save rechargeable | ❌ pas de `version`/`migrate` → champs `undefined` au load | `gameStore.ts:686`, `metaStore.ts:46` |

---

# PARTIE 3 — EXPLOITS (génération illimitée)

| Exploit | Gain/cycle | Vitesse | Fichier |
|---|---|---|---|
| **Craft sans coût d'action** (`patch` annule `spendAction`) | objets/valeur ∞ | très rapide | `CraftingScreen.tsx:37-55` |
| **Heal gratuit** équiper/déséquiper armure | +`hpBonus` PV ∞ | très rapide | `gameStore.ts:510-536` |
| **Soute illimitée** (capacité jamais vérifiée) | stock ∞ | immédiat | `buyCargo gameStore.ts:539` |
| **Arbitrage achat→vente même station** (bonus pilier/faction + soute Mk3) | crédits ∞ | moyen | `marketPricing.ts:119-130` |
| **Fuite retentable gratuitement** | évasion garantie | moyen | `combat.ts:413` |
| **Re-roll des prix au re-render** (`Math.random` au rendu) | meilleur prix à volonté | rapide | `MarketScreen.tsx:33` |
| **Scavenge répétable** (favor +2 / humiliation +1 toujours dispo) | carburant contre rép | lent | `StationHub.tsx:443-516` |
| **Victoire sans combat + loot complet** (intimidate/negotiate → enemyHp=0) | loot+drop gratuits | moyen | `combat.ts:428-434` |

---

# PARTIE 4 — RÉCAP DE L'AUDIT PRÉCÉDENT (~54 bugs)

**Build : ❌ CASSÉ** — `tsc -b` = **70 erreurs** (59 dans `memoryEvents.ts` : `gs` possiblement `undefined` partout ; `PrisonScreen` écrit `factionStanding` inexistant ; `goTo('lore')` non typé ; `NexusScreen 'lore'`…). Vite masque tout car il ignore les types.

**Par domaine :**
- **Voyage** : système d'arrivée mort, fuel non revalidé/négatif, collision combat+escorte, textes/effets incohérents (cargo vidé sur "+1 cristal", PV mis à 0).
- **Économie** : craft gratuit, heal armure, soute illimitée, arbitrage, prix re-randomisés, consommables craftés inutilisables, creep de stats permanent.
- **Combat** : double-action post-mort, fuite gratuite, soins sautent le tour ennemi, victoire-sans-combat récompensée, finisher gratuit (`stamina -= 0`), DoT/mort sautés en stun.
- **Sauvegardes** : pas de migration → crash au load ; `addRunSummary` manquant sur la plupart des fins (points d'héritage perdus) ; crash metaStore sur save partiel.
- **Quêtes/Narration** : fragment Nexus "force" non collecté, arc à combat → récompense perdue + boucle, `factionMissions` jamais incrémenté, voie "lore" Eliotis morte, paiement informateur sans fonds.
- **React/TS** : index de choix narratif décalé (filtré vs non filtré), timers non nettoyés, build cassé.

---

# 🔝 TOP 10 DES SOFTLOCKS / DEAD-ENDS

1. 🔴 **Eliotis injouable** → victoire impossible (`nexus.ts:128-164`)
2. 🔴 **"Force" cassée pour les 4 fragments** (`NexusScreen.tsx:72` + `gameStore.ts:743`)
3. 🔴 **Perte définitive de l'arme Tier 5** = victoire fermée (`StationHub.tsx:456` / `nexus.ts:265`)
4. 🔴 **Zone morte carburant** (`StationHub.tsx:947`)
5. 🔴 **Arc narratif à combat** : récompense (dont fragment Nexus) perdue + boucle infinie (`NarrativeArcsScreen.tsx:64`)
6. 🔴 **Crash au chargement** d'un ancien save (pas de migration, `gameStore.ts:686`)
7. 🟠 **`factionMissions` jamais incrémenté** → objectifs de faction inatteignables (`quests.ts:394`)
8. 🟠 **Voie "lore" Eliotis** morte (`nexus.ts:153`)
9. 🟠 **Combat de voyage écrasé par l'escorte** → combat sauté, état fantôme (`gameStore.ts:299`)
10. 🟠 **Système d'arrivée mort** (`gameStore.ts:363`)

---

# 🎯 TOUS LES CHEMINS QUI RENDENT LA VICTOIRE IMPOSSIBLE

1. Ne jamais obtenir/garder une arme Tier 5 → fragment Eliotis impossible.
2. Compter sur "Forcer" pour n'importe quel fragment → fragment jamais collecté.
3. Sacrifier sa seule Tier 5 à Cesarion (legendary) ou au scavenge → Eliotis fermé.
4. Atteindre un arc narratif à combat dont la récompense est un fragment Nexus → fragment perdu, boucle.
5. Tomber dans la zone morte carburant → bloqué avant même d'atteindre le Nexus.

# 🗝️ OBJETS / FLAGS CRITIQUES PERDABLES DÉFINITIVEMENT

- **Arme Tier 5** (requise pour Eliotis) — cédée au scavenge / consommée par Cesarion.
- **Fragment Nexus** d'un arc narratif à combat — jamais versé.
- **Standing Eliotis** — n'a aucune source, jamais "récupérable".
- **Points d'héritage** d'une run — perdus si la fin passe par un chemin sans `addRunSummary`.

---

# ✅ CORRECTIONS PRIORITAIRES (ordre conseillé)

1. **Débloquer la victoire** : appeler `collectNexusFragment(nexusPath)` dans `handleCombatOutcome` (répare "force" pour les 4) **et** donner à Eliotis une méthode fiable (source de standing eliotis, ou un `pay`, ou réparer la voie `lore`). Sans ça le jeu est infinissable.
2. **Protéger l'arme Tier 5** : exclure les Tier 5 du scavenge "céder une arme", ou avertir.
3. **Softlock carburant** : déclencher le scavenge tant que `fuel < coût de la destination atteignable la moins chère` (au lieu de `< 3`), ou rendre le scavenge répétable jusqu'à pouvoir partir.
4. **Sauvegardes** : `version` + `migrate` profond, et centraliser `addRunSummary` dans une action `endRun()`.
5. **Réparer le build** (`memoryEvents.ts`, `factionStanding`, `goTo('lore')`) pour révéler les futurs bugs.

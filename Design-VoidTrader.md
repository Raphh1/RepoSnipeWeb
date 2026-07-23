# 🎮 VOID TRADER — Audit d'expérience joueur (Game Design)

> Analyse de game design (pas QA). Basée sur la structure réelle : hub à 3 actions/jour, `TypewriterText` omniprésent, empilement de pop-ups à l'arrivée, et 4 systèmes de réputation parallèles (`reputation`, `factionReputation`, `pillarStanding`, `moralTags`/`pastDecisions`).

## Diagnostic central

Le jeu souffre de deux maux, pas d'un manque de contenu :
1. **Surcharge de systèmes opaques** — le joueur ne sait pas ce qui compte, donc ne ressent ni ses choix ni sa progression.
2. **Déficit de feedback** — peu de "jus" visuel/sonore ; les actions ne claquent pas.

Toutes les recos servent ces deux axes : **rendre lisible** et **rendre satisfaisant**. ⭐ = meilleurs ratios plaisir/coût.

---

## 1. Frictions inutiles
- ⭐ **1.1 Empilement de modales à l'arrivée** — *Fort / Faible / Faible*. Fusionner les 4-5 pop-ups en un seul "Briefing d'arrivée" avec un seul bouton.
- ⭐ **1.2 Tunnels de TypewriterText** — *Fort / Faible / Faible*. Clic = compléter, double-clic = passer, réglage de vitesse, jamais sur du texte déjà lu.
- **1.3 Carburant = anxiété sans info** — *Fort / Moyen / Faible*. Afficher la portée et les destinations atteignables dès le hub ; alerte avant stranding.
- **1.4 Compteur 3 actions/jour invisible** — *Moyen / Faible / Moyen*. 3 jetons visuels qui se consument + fin de journée désirable.

## 2. Boucles de satisfaction
- ⭐ **2.1 Aucun "jus" sur les gains** — *Très fort / Faible / Faible*. Pop de chiffres animés, SFX par type, secousse sur crit, flash doré sur fragment Nexus.
- ⭐ **2.2 Loop combat momentum→finisher non mis en scène** — *Fort / Faible / Faible*. Barre de momentum visible, bouton finisher qui pulse + son "charge prête".
- **2.3 Fin de journée sans rituel** — *Moyen / Moyen / Faible*. Résumé du jour + phrase d'ambiance.
- **2.4 Surprise/découverte sous-exploitée** — *Moyen / Moyen / Moyen*. 2-3 events rares par run avec traitement visuel distinct.

## 3. Flow du joueur
- ⭐ **3.1 Premières minutes : hub trop dense** — *Très fort / Moyen / Faible*. Première quête scriptée qui déverrouille les systèmes un par un.
- **3.2 Milieu de partie répétitif** — *Fort / Moyen / Moyen*. Objectif directeur visible (Nexus) + secteur qui évolue par paliers de jour.
- **3.3 Pas de point de sortie naturel** — *Moyen / Faible / Faible*. Le résumé de fin de journée = point de sortie/sauvegarde idéal.

## 4. Narration et choix
- ⭐ **4.1 Les choix ne montrent pas leur impact** — *Très fort / Faible / Faible*. Afficher les deltas + callbacks de PNJ plus tard.
- **4.2 Choix trop évidents (un bon / un puni)** — *Fort / Moyen / Moyen*. Dilemmes à coût croisé connectés aux piliers.
- **4.3 Conséquences trop prévisibles** — *Moyen / Faible / Moyen*. Incertitude lisible ("70% de réussite") au lieu de binaire connu.

## 5. Ergonomie & UX
- ⭐ **5.1 Fusionner l'affichage des 4 réputations** — *Très fort / Moyen / Moyen*. Écran unifié à onglets + une seule jauge contextuelle selon le lieu.
- **5.2 StatusBar : 4 infos vitales seulement** — *Moyen / Faible / Faible*. PV, carburant, crédits, jour/actions ; le reste sur demande.
- **5.3 Feedback sonore quasi absent** — *Fort / Moyen / Faible*. Banque de SFX Web Audio (zéro asset).

## 6. Motivation long terme
- ⭐ **6.1 Le Nexus = étoile polaire** — *Très fort / Faible / Faible*. Tracker persistant "Fragments 1/4" dans le hub.
- **6.2 Collection lore sans méta-objectif** — *Moyen / Faible / Faible*. Compteur "Mémoire du secteur X/40" + déblocages par paliers.
- **6.3 Attachement aux personnages faible** — *Fort / Moyen / Moyen*. Semer les piliers tôt (rumeurs, journal) avant le Nexus.

## 7. Rétention
- ⭐ **7.1 Écran de fin de run doit vendre le retour** — *Très fort / Moyen / Faible*. Recap + "Prochain déblocage à X points" avec barre presque pleine. (Prérequis : corriger `addRunSummary`.)
- **7.2 Méta-progression peu lisible avant la run** — *Moyen / Faible / Faible*. Arbre clair de ce qui reste à débloquer.

## 8. Analyse critique (fusion / suppression)
| Système | Verdict | Reco |
|---|---|---|
| 4 jauges de réputation | ⚠️ Redondant/opaque | Fusionner à l'affichage (5.1) |
| 7 mini-jeux | ⚠️ Dilués | Garder 2-3 excellents, couper le reste |
| run modifiers + objectives + run objectives | ⚠️ Chevauchement | 1 objectif vedette, le reste en fond |
| Système d'arrivée (`arrivalSituations`) | ❌ Mort | Brancher ou supprimer |
| Piliers Nexus | ✅ Cœur fort | Mettre en avant (6.1) |
| Combat momentum/finisher | ✅ Riche | Mettre en scène (2.2) |

---

## 🏆 Top 6 (meilleur plaisir/coût)
1. Game feel : pop de chiffres + SFX + secousse crit (2.1, 5.3)
2. Skip/vitesse du typewriter (1.2)
3. Tracker Nexus "1/4" permanent (6.1)
4. Deltas de choix visibles + callbacks (4.1)
5. Briefing d'arrivée unifié (1.1)
6. Recap de fin de run avec "prochain déblocage" (7.1)

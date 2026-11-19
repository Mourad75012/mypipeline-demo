---
name: prospect
description: Rechercher et qualifier des leads pour les formations certifiantes. Usage /leadgen:prospect <segment> <certif> <zone> [nombre]
---

Charge le skill `lead-gen-formation` puis :

1. Interprète la demande : `$ARGUMENTS` (segment OF/ESN/CAB/ENT/IND, certification visée, zone, nombre de leads ; 25 par défaut, France par défaut).
2. Construis les critères (secteur, taille, rôles décideurs, signaux d'intérêt) selon le tableau ICP du skill.
3. Avec Vibe Prospecting (ou GojiberryAI `search_leads`) : estime le coût, montre un échantillon de 5 lignes et attends mon accord avant d'élargir ou d'enrichir.
4. Calcule le score de qualification pour chaque lead et trie (Chaud / Tiède / Froid).
5. Rends un tableau Markdown au format « Liste de leads » du skill, puis propose les 3 prochaines actions.

N'enregistre aucune donnée personnelle dans le dépôt Git.

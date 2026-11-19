---
name: campagne
description: Monter une campagne multicanale (liste + séquence + suivi) dans GojiberryAI. Usage /leadgen:campagne <nom> <segment> <certif>
---

Charge le skill `lead-gen-formation`, puis pour `$ARGUMENTS` :

1. Vérifie mon compte et mes listes GojiberryAI (`get_current_user`, `list_lists`, `list_campaigns`).
2. Propose la liste cible (existante ou à créer depuis `/leadgen:prospect`).
3. Rédige la séquence standard du skill (J0, J+2, J+7, J+14, J+21) adaptée au segment et à la certification.
4. Montre-moi le plan complet (liste, nombre de contacts, messages, cadence, coût éventuel).
5. Après mon accord explicite seulement : crée la liste et la campagne **en pause**. Ne l'active (`activate_campaign`) que sur un second accord explicite.
6. Termine par un mini-rapport : leads par segment et par score, actions de suivi.

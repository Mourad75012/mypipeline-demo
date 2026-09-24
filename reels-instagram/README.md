# Reels Instagram – formations certifiantes (1080x1920)

Un modèle de Reel de 15 s (`index.html`), décliné par certification grâce à `certifications.json`.
Cible : organismes de formation, ESN, cabinets, responsables formation.

| Scène | Durée | Contenu |
|---|---|---|
| 1. Accroche | 0–4 s | « Besoin d'un formateur PMP ? » |
| 2. Certification | 4–9,5 s | sigle, intitulé, organisme, public, point fort |
| 3. Appel à l'action | 9,5–15 s | intra/inter/distanciel, sous-traitance, « Écrivez-moi en DM » |

## Commandes

```bash
npm run dev          # studio de prévisualisation (http://localhost:3002)
npm run check        # vérification
npm run render:all   # un MP4 par certification dans renders/
```

## Modifier ou ajouter une certification

Éditez `certifications.json` (une ligne = un Reel) :
`slug` (nom du fichier), `code`, `name`, `org`, `audience`, `point`, `accent` (couleur).
Les textes communs (accroche, liste, appel à l'action) sont dans `index.html`.

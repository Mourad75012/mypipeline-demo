---
name: lead-gen-formation
description: Génération de leads B2B et B2C pour un formateur international certifié (ATP/ATO, SAFe SPC) — PMP, CAPM, PMI-ACP, CPMAI, PgMP, PSM, PSPO, PSK, PSD, SAFe (SA, RTE, POPM, LPM), PRINCE2 v7, PRINCE2 Agile, ITIL 4/5, ISTQB (Fondation, Agile, Automation), DevOps PeopleCert, Jira Atlassian. Utiliser pour rechercher des prospects (organismes de formation, ESN/SSII, cabinets de conseil, responsables formation, Head of Learning, consultants, personnes en reconversion), qualifier, segmenter, rédiger des messages LinkedIn/email et monter des campagnes.
---

# Lead-gen Formation certifiante

## 1. Offre (à ne pas déformer)

Formateur international expérimenté en gestion de projet, accrédité ATP/ATO et SAFe SPC.
Formations certifiantes : PMP, CAPM, PMI-ACP, CPMAI, PgMP · PSM, PSPO, PSK, PSD ·
SAFe SA, RTE, POPM, LPM · PRINCE2 v7, PRINCE2 Agile · ITIL 4, ITIL 5 ·
ISTQB Fondation / Agile / Automation · DevOps (PeopleCert) · Jira (Atlassian).

Taux de réussite aux examens (donnée fournie par le formateur) : **93 %**.

Ne jamais inventer d'autres chiffres, de références clients, de prix ou de dates de session.
Si une donnée manque, laisser un champ `[À COMPLÉTER]`.

## 2. Segments cibles (ICP)

| Code | Segment | Rôles décideurs | Angle de valeur | Offre phare |
|------|---------|-----------------|-----------------|-------------|
| OF | Organismes / sociétés de formation pour adultes | Dirigeant, Responsable pédagogique, Directeur des programmes | Formateur accrédité en sous-traitance, catalogue certifiant élargi sans recruter | PMP, PRINCE2, ITIL, SAFe |
| ESN | ESN / SSII | DRH, Responsable formation, Directeur delivery | Montée en compétences et certification des consultants = TJM et réponses aux appels d'offres | PSM, SAFe, ISTQB, ITIL, Jira |
| CAB | Cabinets de conseil / experts | Associé, Practice leader, Head of Learning | Crédibilité des missions, certification des équipes PMO/Agile | PMP, PgMP, SAFe LPM/RTE, PRINCE2 |
| ENT | Grandes entreprises / services IT | Head of Learning, Responsable formation, Responsable PMO / Agile | Transformation agile à l'échelle, standardisation des pratiques | SAFe, ITIL, DevOps, CPMAI |
| IND | Consultants indépendants, juniors, seniors, reconversion | Particulier | Employabilité, certification reconnue, financement possible | CAPM, PSM, ISTQB, PMP |

Hors cible par défaut : étudiants sans projet de certification, concurrents directs (formateurs indépendants sur les mêmes certifications), sociétés < 10 salariés hors OF.

## 3. Score de qualification (0–100)

- Segment prioritaire (OF, ESN, CAB = 25 ; ENT = 20 ; IND = 10)
- Rôle décideur formation/pédagogie/L&D (25), manager opérationnel (15), autre (5)
- Signal d'intérêt : recrutement de chefs de projet/Scrum Master/testeurs, appel d'offres, transformation agile, levée de fonds, post LinkedIn sur la formation (jusqu'à 25)
- Taille : 50–5000 salariés (15), autre (5)
- Zone : France / francophonie / zone servie (10)

Chaud ≥ 70 · Tiède 45–69 · Froid < 45.

## 4. Outils disponibles (vérifier avec ToolSearch avant usage)

1. **Vibe Prospecting** (`mcp__Vibe_Prospecting__*`, skill `vpai:vibe-prospecting`) : recherche entreprises/contacts, événements (recrutements, levées), enrichissement. Toujours `estimate-cost` puis `show-sample` (5 lignes) avant d'enrichir en masse.
2. **GojiberryAI** (`mcp__GojiberryAI__*`) : listes, contacts, signaux d'intention, campagnes LinkedIn/email.
3. **Gmail** (`mcp__Gmail__*`) : brouillons uniquement (`create_draft`). Ne jamais envoyer sans validation explicite.
4. **Gamma / Canva** : plaquettes, one-pagers d'offre par segment.

Règle de dépense : annoncer le coût estimé et attendre l'accord avant tout enrichissement ou révélation payante.

## 5. Conformité (RGPD / B2B)

- Prospection B2B par email : intérêt légitime, message en lien avec la fonction, lien de désinscription, identité de l'expéditeur.
- B2C (particuliers en reconversion) : pas d'email à froid sans consentement ; passer par LinkedIn, contenu, webinaires, formulaires.
- Ne pas stocker de données personnelles dans le dépôt Git. Exports CSV dans le scratchpad ou dans l'outil CRM, jamais commités.
- Aucune campagne activée, aucun message envoyé sans validation explicite de l'utilisateur.

## 6. Messages (règles de rédaction)

- Français par défaut, anglais si le prospect est hors francophonie.
- Court : invitation LinkedIn ≤ 300 caractères, email ≤ 120 mots, une seule question/CTA.
- Personnaliser avec 1 élément réel du prospect (poste, recrutement, post, actualité). Pas de flatterie générique.
- Ton : pair à pair, expert, sobre. Passer le texte au skill `anthropic-skills:humanizer` si besoin.
- Modèles par segment : voir `templates.md` dans ce dossier.

## 7. Livrables standard

- Liste de leads : `entreprise, site, taille, segment, contact, rôle, lien LinkedIn, signal, score, statut`.
- Séquence : J0 invitation → J+2 message → J+7 email (si B2B) → J+14 relance valeur (contenu) → J+21 dernière relance.
- Rapport : nombre de leads par segment et par score, prochaines actions.

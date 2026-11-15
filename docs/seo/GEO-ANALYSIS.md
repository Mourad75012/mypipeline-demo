# Analyse GEO — med-training-consulting.com

Date de l'analyse : 15 novembre 2026
Outil : Claude SEO (`seo-geo`), analyse du HTML brut tel que le reçoivent Googlebot et les robots d'IA.
Pages analysées : page d'accueil, robots.txt, llms.txt, sitemaps, pages formations (`/cours/...`), articles de blog, liens internes.

> Rappel : selon le guide officiel de Google sur l'IA (Search Central, 2026), « optimiser pour la recherche générative, c'est toujours du SEO ». Les recommandations ci-dessous sont des fondamentaux SEO appliqués aux réponses IA (AI Overviews, AI Mode, ChatGPT, Perplexity, Copilot).

---

## 1. Score GEO : 38 / 100

Score indicatif (grille de priorisation de l'outil), **pas** un taux de citation prédit.

| Critère | Poids | Note | Constat principal |
|---|---|---|---|
| Citabilité des passages | 25 | 8 | Accueil descriptif, mais aucun chiffre, aucune FAQ ; les pages formations sont invisibles |
| Structure / lisibilité | 20 | 8 | 1 seul H1 (bien), mais titres dupliqués, H4 vides, aucun titre en question, aucun tableau |
| Contenu multimodal | 15 | 7 | 113 images (36 sans `alt`), pas de vidéo YouTube intégrée détectée |
| Autorité et marque | 20 | 8 | Fondateur nommé avec références clients, mais preuves chiffrées absentes de la page, quasi aucune mention externe |
| Accessibilité technique | 20 | 7 | WordPress rendu côté serveur (bien), robots ouverts, **mais formations et articles bloqués par une page de connexion** |

### Par plateforme (qualitatif, non mesuré par un outil de suivi)

| Plateforme | Préparation | Pourquoi |
|---|---|---|
| Google AI Overviews / AI Mode | Faible | Seules l'accueil et la page contact sont indexables ; le llms.txt est ignoré par Google |
| ChatGPT Search | Faible | Accès autorisé, mais rien à citer sur les requêtes « formation PMP », « SAFe POPM »... |
| Perplexity | Faible | Dépend fortement des mentions Reddit / forums : aucune trouvée |
| Bing Copilot | Faible | Une recherche web sur « MED TRAINING & CONSULTING » ne renvoie pas le site |

---

## 2. Problème critique : 90 % du site est derrière une page de connexion

Toutes les pages ci-dessous renvoient une **redirection 302 vers `/o-mourad/` (« Connectez Vous ! »)**, page marquée `noindex, noarchive`. C'est vrai pour un visiteur, pour Googlebot, pour OAI-SearchBot et pour PerplexityBot (testé) :

- `/cours/` et les **23 pages formations** (PMP, CAPM, PSM, PSPO, SAFe SSM / POPM / RTE / LPM, PRINCE2 v7, ITIL 4, ISTQB, DevOps, Jira, AgilePM...)
- les **6 articles de blog** (PMP, CAPM, ITIL 4, ISTQB, Jira, AgilePM)
- `/feed/`, `/tableau-de-bord/`

Conséquence : pour Google comme pour ChatGPT, le site se résume à la page d'accueil. Aucune page ne peut se positionner, ni être citée, sur « formation PMP Paris », « certification SAFe POPM » ou « formation ITIL 4 Foundation ».

La redirection vient d'un réglage du plugin **Profile Builder** (`wppb_referer_url` dans l'URL) ou de la restriction de contenu de **Tutor LMS**. Correctif : rendre publiques les fiches formations et les articles ; ne restreindre que les leçons, quiz et espaces apprenants.

---

## 3. Accès des robots d'IA (robots.txt)

Le fichier autorise explicitement presque tous les robots. Il n'y a pas de groupe `User-agent: *` : les robots non listés sont donc autorisés par défaut.

**Robots de recherche / citation** (ce sont eux qui décident si vous êtes cité) :

| Robot | Rôle | Statut |
|---|---|---|
| Googlebot | Google Search, AI Overviews, AI Mode | Autorisé |
| OAI-SearchBot | Citations dans ChatGPT Search | Autorisé par défaut (non listé) |
| Claude-SearchBot | Citations dans la recherche de Claude | Autorisé par défaut (non listé) |
| PerplexityBot | Recherche Perplexity | Autorisé |
| Bingbot | Bing et Copilot | Autorisé |
| Applebot | Siri, Spotlight, Safari | Autorisé |

**Robots d'entraînement** (choix de licence, sans effet sur la visibilité en recherche) :

| Robot | Rôle | Statut |
|---|---|---|
| GPTBot | Entraînement des modèles OpenAI | Autorisé |
| ClaudeBot | Entraînement des modèles Anthropic | Autorisé |
| Google-Extended | Entraînement et ancrage Gemini / Vertex (n'affecte pas Google Search) | Autorisé |
| Applebot-Extended | Entraînement Apple Intelligence | Autorisé |
| CCBot | Common Crawl | Autorisé |

Petites corrections à faire :
- Ajouter `OAI-SearchBot` et `Claude-SearchBot` explicitement (plus lisible) ; `anthropic-ai` n'est plus documenté par Anthropic et peut être retiré.
- Le commentaire « OpenAI research crawler » sur `ChatGPT-User` est faux : c'est la navigation déclenchée par un utilisateur.

```txt
# OpenAI : citations dans ChatGPT Search
User-agent: OAI-SearchBot
Allow: /

# Anthropic : citations dans la recherche de Claude
User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /
```

Rien de tout cela ne sert tant que les pages formations redirigent vers la connexion.

---

## 4. llms.txt

**Présent** (14,7 Ko, mis à jour le 27/06/2026), bien rédigé : identité, SIREN, adresse, fondateur, publics, formats, chiffres clés, réponse type pour les IA.

Mais :
- Google indique officiellement que `llms.txt` n'aide ni ne pénalise la visibilité dans Search, AI Overviews et AI Mode. Aucun grand moteur d'IA n'a confirmé l'utiliser. L'outil lui accorde un poids de **zéro** dans le score.
- **Les preuves les plus fortes du site n'existent que dans ce fichier** : 1 200 sessions, 4 000 certifiés, Trustpilot 4,8/5 (62 avis), Google 4,9/5, création en 2020, accréditations ATP / ATO / SAFe SPC. Aucune n'apparaît dans le HTML de l'accueil (0 occurrence vérifiée). Il faut les **reporter sur les pages publiques**.

---

## 5. Présence de la marque (mentions externes)

Les mentions de marque sont fortement corrélées à la visibilité IA (Ahrefs, étude sur 75 000 marques, décembre 2025 : corrélation environ 3 fois plus forte que les backlinks ; corrélation, pas causalité).

| Plateforme | Constat |
|---|---|
| Recherche web « MED TRAINING & CONSULTING » | Le site n'apparaît pas ; résultats dominés par Orsys, Global Knowledge, Oo2, Capgemini |
| Profils du formateur | Simpliaxis (« PMI-ATP PMP-ACP-CAPM / SAFe 6 SPC »), Malt, Viadeo |
| LinkedIn | Profil personnel actif avec recommandations ; page entreprise au slug `met-training-and-consulting` (coquille « met » au lieu de « med » ?) |
| Trustpilot | Profil sur le domaine **.fr** alors que le site est en **.com** : incohérence d'entité |
| YouTube | Aucune chaîne liée depuis le site (c'est le signal le plus corrélé aux citations IA) |
| Reddit / forums | Aucune mention trouvée |
| Wikipedia / Wikidata | Absent |
| Comparatifs « meilleures formations PMP 2026 » | Absent (Elitek, Coursera, LearnThings citent Orsys, Oo2, CERTyou) |

---

## 6. Citabilité des passages (page d'accueil)

Seule la page d'accueil est lisible (5 236 mots dans le HTML brut). Passages exploitables :

- **Bon** : « MED TRAINING & CONSULTING est un organisme de formation professionnelle spécialisé en gestion de projet, méthodologies agiles et transformation digitale... » C'est une définition du type « X est... », placée en haut de page.
- **Bon** : la section « Mourad Ouannes : Expert en Gestion de Projet... » (15 ans d'expérience, BNP Paribas, Société Générale, Chanel, Dior, Amadeus, Groupe SEB, APTIV).
- **Faible** : les blocs « Expertise Reconnue », « Garantie de Résultats », « Réseau International » sont des promesses génériques sans chiffre ni preuve.
- **Absent** : aucun prix, aucune durée, aucun taux de réussite, aucune date de session, aucune FAQ.

Problème de structure : chaque section existe en double dans le HTML (versions mobile et ordinateur d'Elementor), d'où des H2 répétés, des H4 vides et un texte dupliqué qui dilue chaque passage.

---

## 7. Rendu côté serveur

- WordPress + Elementor : le contenu de l'accueil est présent dans le HTML initial, sans JavaScript. **Bien** : GPTBot et PerplexityBot, qui n'exécutent pas le JavaScript, voient le texte.
- `/wp-json/` renvoie 401 (sans impact SEO).
- Lien interne cassé : `/article/cours/lms-tutor/` renvoie 404.

---

## 8. Les 5 changements à plus fort impact

1. **Ouvrir les fiches formations et les articles au public** (section 2). Sans cela, rien d'autre ne compte. Vérifier ensuite que `/cours/pmp/` renvoie 200 pour Googlebot, puis demander l'indexation dans Search Console.
2. **Mettre les preuves chiffrées dans le HTML de l'accueil et des fiches** : « Depuis 2020 : plus de 1 200 sessions, plus de 4 000 professionnels certifiés, 4,8/5 sur Trustpilot (62 avis) », les accréditations exactes (PMI ATP, PeopleCert ATO, Scaled Agile SPC) et **Qualiopi si l'organisme est certifié** (critère décisif pour les responsables formation, à cause du financement CPF / OPCO).
3. **Réécrire chaque fiche formation pour qu'elle soit citable** : un paragraphe de réponse directe en tête, un tableau (durée, format, prix, examen inclus, prérequis, prochaines dates) et une FAQ avec des titres en question. Mettre à jour la fiche PMP pour la **nouvelle version PMP de 2026** : d'après Orsys, le PMI l'a publiée le 14/04/2026, l'examen V4 est ouvert depuis le 09/07/2026 et la page Orsys appelle cette version « V4 ». Une fiche non à jour se fera écarter.
4. **Corriger les données structurées** (section 9) : aujourd'hui, une seule entité mélange `Person` et `Organization` sous le nom « Med Training Consulting », sans adresse, sans fondateur et sans `sameAs`. La page d'accueil est aussi typée `AboutPage`.
5. **Construire la présence externe** : chaîne YouTube (les témoignages vidéo « en Live » existent déjà), page LinkedIn entreprise avec un slug corrigé, Trustpilot aligné sur le .com, fiche Google Business liée, demandes d'inclusion dans les comparatifs 2026, réponses expertes sur Reddit (r/projectmanagement, r/scrum, r/ITIL).

---

## 9. Données structurées recommandées

Remplacer le bloc `Person + Organization` de Rank Math par une entité organisation propre et une entité fondateur séparée. À placer sur l'accueil :

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": "https://med-training-consulting.com/#organization",
      "name": "MED TRAINING & CONSULTING",
      "url": "https://med-training-consulting.com/",
      "logo": "https://med-training-consulting.com/wp-content/uploads/2025/03/cropped-logo-med-1.png",
      "description": "Organisme de formation certifiante en gestion de projet, agilité, ITSM, DevOps et test logiciel : PMP, CAPM, PRINCE2, SAFe, ITIL, Scrum.org, ISTQB.",
      "foundingDate": "2020",
      "identifier": { "@type": "PropertyValue", "propertyID": "SIREN", "value": "903150118" },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "163 Rue de Charenton",
        "postalCode": "75012",
        "addressLocality": "Paris",
        "addressCountry": "FR"
      },
      "email": "contact@med-training-consulting.com",
      "telephone": "+33664712428",
      "founder": { "@id": "https://med-training-consulting.com/#founder" },
      "areaServed": ["FR", "BE", "ES", "CI", "ML", "MG", "GM"],
      "sameAs": [
        "https://www.linkedin.com/company/met-training-and-consulting/",
        "https://fr.trustpilot.com/review/med-training-consulting.fr",
        "https://www.facebook.com/MEDTRAINI",
        "https://www.instagram.com/medt.training.consulting"
      ]
    },
    {
      "@type": "Person",
      "@id": "https://med-training-consulting.com/#founder",
      "name": "Mourad Ouannes",
      "jobTitle": "Fondateur et formateur certifié (PMI ATP, SAFe SPC)",
      "worksFor": { "@id": "https://med-training-consulting.com/#organization" },
      "sameAs": [
        "https://www.linkedin.com/in/mouradouannes/",
        "https://www.simpliaxis.com/trainers/mourad-ouannes"
      ]
    }
  ]
}
```

Sur chaque fiche formation (une fois publique), ajouter un schéma `Course` :

```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Formation PMP – Préparation à la certification PMI",
  "description": "Préparation à l'examen PMP (version 2026) en 5 jours, en présentiel à Paris ou à distance.",
  "provider": { "@id": "https://med-training-consulting.com/#organization" },
  "inLanguage": "fr",
  "hasCourseInstance": {
    "@type": "CourseInstance",
    "courseMode": ["Onsite", "Online"],
    "location": "Paris",
    "instructor": { "@id": "https://med-training-consulting.com/#founder" }
  },
  "offers": { "@type": "Offer", "price": "À RENSEIGNER", "priceCurrency": "EUR", "category": "Paid" }
}
```

Remplacez les durées et le prix par les vraies valeurs ; n'inventez rien dans le balisage. N'ajoutez pas de note agrégée (`aggregateRating`) tirée de Trustpilot : Google ne l'accepte pas pour des avis collectés par un tiers sur sa propre entité.

---

## 10. Passages à réécrire

**a) Bloc « Garantie de Résultats » (actuellement générique)**
Proposition :
> **Quel est le taux de réussite des formations MED TRAINING & CONSULTING ?**
> Depuis 2020, MED TRAINING & CONSULTING a animé plus de 1 200 sessions et accompagné plus de 4 000 professionnels vers la certification (PMP, PRINCE2, SAFe, ITIL, Scrum.org, ISTQB). Chaque parcours comprend des examens blancs, des QCM d'entraînement et un suivi après la formation jusqu'au passage de l'examen. Les stagiaires notent l'organisme 4,8/5 sur Trustpilot (62 avis, novembre 2026).

**b) Bloc « Expertise Reconnue »**
Remplacer la promesse par les accréditations vérifiables, chacune liée à la page officielle de l'organisme accréditeur (annuaire PMI ATP, PeopleCert, Scaled Agile).

**c) Ajouter une FAQ sur l'accueil, réponses de 2 à 4 phrases :**
- Quelle certification choisir entre PMP et PRINCE2 ?
- Combien coûte une formation PMP à Paris ?
- Vos formations sont-elles finançables par le CPF ou un OPCO ?
- Proposez-vous des formations intra-entreprise pour les ESN et cabinets de conseil ?
- Formez-vous aussi d'autres organismes de formation (sous-traitance) ?

Les deux dernières questions parlent directement à vos cibles B2B (organismes de formation, ESN, responsables formation).

---

## Nettoyage technique secondaire

- Sitemap : retirer les pages sans valeur (`/cart-2/`, `/checkout-2/`, `/shop/`, `/login/`, `/register/`, `/dashboard/`, `/my-account/`, `/featured-course/`, `/cours/lms-tutor-mo/`, `/archives/`...) avec un `noindex` dans Rank Math.
- Slugs d'articles avec émojis (`/%f0%9f%94%a5-formation-pmp-...`) : passer à `/formation-pmp-certification-pmi/` avec une redirection 301.
- Blog figé depuis mars 2025 et accueil modifié pour la dernière fois en juillet 2025 : planifier une mise à jour au moins trimestrielle (prix, dates, versions d'examen).
- Ajouter un `alt` aux 36 images qui n'en ont pas (logos clients : « Logo BNP Paribas », etc.).
- Supprimer les sections Elementor dupliquées ; utiliser les réglages responsives d'une seule section.
- Corriger le lien cassé `/article/cours/lms-tutor/` (404).
- Le nom de marque varie : « MED TRAINING & CONSULTING », « Med Training Consulting », « met-training-and-consulting », domaine Trustpilot en .fr. Choisissez une seule forme et utilisez-la partout.

---

## Sources externes consultées

- [Simpliaxis — profil Mourad Ouannes](https://www.simpliaxis.com/trainers/mourad-ouannes)
- [Viadeo — profil Mourad Ouannes](https://viadeo.journaldunet.com/p/mourad-ouannes-910389)
- [Malt — profil](https://www.malt.fr/profile/mouradoua)
- [Orsys — formation PMP (version 2026 et calendrier)](https://www.orsys.fr/formation/PPC)
- [Elitek — Meilleures formations PMP en France 2026](https://www.elitek.fr/post/meilleures-formations-pmp-france-2026-comparatif)
- [Oo2 — guide PMP](https://www.oo2.fr/sites/default/files/document/pdf/guide-complet-PMP-pmi-atppmp-avec-PMBOK-et-AGILE.pdf)
- [Coursera — certifications PMI 2026](https://coursera.org/fr-FR/articles/a-guide-to-pmi-certifications)
- [LearnThings — certifications gestion de projet](https://www.learnthings.fr/formations/gestion-dentreprise/gestion-de-projet/certifications-gestion-de-projet/)
- Guide Google sur l'optimisation pour l'IA : developers.google.com/search/docs/fundamentals/ai-optimization-guide

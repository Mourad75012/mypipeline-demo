#!/usr/bin/env python3
"""Extrait des entreprises françaises ciblées pour la prospection B2B.

Source : API Recherche d'entreprises (https://recherche-entreprises.api.gouv.fr),
gratuite, sans clé, données publiques SIRENE / RNE / Qualiopi.

Segments disponibles (codes NAF) :
  formation  organismes de formation continue d'adultes (85.59A, 85.59B)
  esn        ESN / SSII (62.01Z, 62.02A, 62.03Z, 62.09Z)
  conseil    cabinets de conseil (70.22Z)

Exemples :
  python3 extract_entreprises.py --segment formation --region 11 --qualiopi
  python3 extract_entreprises.py --segment esn conseil --departement 69 --min-effectif 10
  python3 extract_entreprises.py --segment formation --max 200 -o idf.csv

Le CSV produit (séparateur « ; », UTF-8 avec BOM) s'ouvre directement dans Excel.
Usage conforme RGPD : prospection B2B en lien avec la fonction de la personne,
lien de désinscription obligatoire, source à indiquer (« Annuaire des entreprises »).
"""

import argparse
import csv
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

API_URL = "https://recherche-entreprises.api.gouv.fr/search"
PER_PAGE = 25          # maximum accepté par l'API
MAX_RESULTS_API = 10000  # l'API ne pagine pas au-delà
PAUSE_S = 0.2          # l'API limite à 7 requêtes/seconde
MAX_RETRIES = 4

SEGMENTS = {
    "formation": ["85.59A", "85.59B"],
    "esn": ["62.01Z", "62.02A", "62.03Z", "62.09Z"],
    "conseil": ["70.22Z"],
}

# Codes INSEE de tranche d'effectif salarié, dans l'ordre croissant.
TRANCHES = [
    ("00", "0 salarié"), ("01", "1 à 2"), ("02", "3 à 5"), ("03", "6 à 9"),
    ("11", "10 à 19"), ("12", "20 à 49"), ("21", "50 à 99"),
    ("22", "100 à 199"), ("31", "200 à 249"), ("32", "250 à 499"),
    ("41", "500 à 999"), ("42", "1 000 à 1 999"), ("51", "2 000 à 4 999"),
    ("52", "5 000 à 9 999"), ("53", "10 000 et plus"),
]
TRANCHE_LABELS = dict(TRANCHES)
# Seuils proposés pour --min-effectif -> premier code de tranche inclus.
SEUILS_EFFECTIF = {1: "01", 3: "02", 6: "03", 10: "11", 20: "12", 50: "21",
                   100: "22", 250: "32", 500: "41", 1000: "42"}

COLUMNS = [
    "segment", "siren", "siret_siege", "nom", "sigle", "naf",
    "categorie_entreprise", "effectif", "date_creation", "adresse",
    "code_postal", "commune", "departement", "region",
    "nb_etablissements_ouverts", "organisme_formation", "qualiopi",
    "dirigeants", "fiche_annuaire",
]


def tranches_from(min_effectif):
    """Codes de tranche couvrant un effectif >= min_effectif."""
    first = SEUILS_EFFECTIF[min_effectif]
    codes = [code for code, _ in TRANCHES]
    return codes[codes.index(first):]


def build_params(naf_codes, args, page):
    params = {
        "activite_principale": ",".join(naf_codes),
        "etat_administratif": "A",  # entreprises actives uniquement
        "per_page": PER_PAGE,
        "page": page,
    }
    if args.region:
        params["region"] = args.region
    if args.departement:
        params["departement"] = args.departement
    if args.min_effectif:
        params["tranche_effectif_salarie"] = ",".join(
            tranches_from(args.min_effectif))
    if args.qualiopi:
        params["est_qualiopi"] = "true"
    if args.mot_cle:
        params["q"] = args.mot_cle
    return params


def fetch_page(params):
    """Appelle l'API ; réessaie avec attente croissante sur 429 / 5xx."""
    url = API_URL + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(
        url, headers={"Accept": "application/json",
                      "User-Agent": "prospection-b2b-script/1.0"})
    delay = 2
    for attempt in range(MAX_RETRIES + 1):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as err:
            retriable = err.code == 429 or err.code >= 500
            if not retriable or attempt == MAX_RETRIES:
                raise
        except urllib.error.URLError:
            if attempt == MAX_RETRIES:
                raise
        time.sleep(delay)
        delay *= 2
    return None  # inatteignable


def format_dirigeants(dirigeants):
    """Dirigeants personnes physiques : « Prénom NOM (qualité) »."""
    out = []
    for d in dirigeants or []:
        if d.get("type_dirigeant") != "personne physique":
            continue
        nom = " ".join(p for p in (d.get("prenoms"), d.get("nom")) if p)
        if not nom:
            continue
        qualite = d.get("qualite")
        out.append(f"{nom} ({qualite})" if qualite else nom)
    return " | ".join(out)


def oui_non(value):
    if value is None:
        return ""
    return "oui" if value else "non"


def to_row(result, segment):
    siege = result.get("siege") or {}
    comp = result.get("complements") or {}
    tranche = result.get("tranche_effectif_salarie") or ""
    siren = result.get("siren", "")
    return {
        "segment": segment,
        "siren": siren,
        "siret_siege": siege.get("siret", ""),
        "nom": result.get("nom_complet") or result.get("nom_raison_sociale", ""),
        "sigle": result.get("sigle") or "",
        "naf": result.get("activite_principale", ""),
        "categorie_entreprise": result.get("categorie_entreprise") or "",
        "effectif": TRANCHE_LABELS.get(tranche, "non renseigné"),
        "date_creation": result.get("date_creation") or "",
        "adresse": siege.get("adresse", ""),
        "code_postal": siege.get("code_postal", ""),
        "commune": siege.get("libelle_commune", ""),
        "departement": siege.get("departement", ""),
        "region": siege.get("region", ""),
        "nb_etablissements_ouverts": result.get("nombre_etablissements_ouverts", ""),
        "organisme_formation": oui_non(comp.get("est_organisme_formation")),
        "qualiopi": oui_non(comp.get("est_qualiopi")),
        "dirigeants": format_dirigeants(result.get("dirigeants")),
        "fiche_annuaire":
            f"https://annuaire-entreprises.data.gouv.fr/entreprise/{siren}"
            if siren else "",
    }


def extract(segments, args, fetch=fetch_page, pause=PAUSE_S, log=sys.stderr):
    """Parcourt les pages de chaque segment ; dédoublonne par SIREN."""
    rows, seen = [], set()
    limit = min(args.max or MAX_RESULTS_API, MAX_RESULTS_API)
    for segment in segments:
        page, count = 1, 0
        while count < limit:
            data = fetch(build_params(SEGMENTS[segment], args, page))
            results = data.get("results") or []
            if page == 1:
                print(f"[{segment}] {data.get('total_results', 0)} entreprises "
                      "trouvées", file=log)
            for result in results:
                siren = result.get("siren")
                if not siren or siren in seen:
                    continue
                seen.add(siren)
                rows.append(to_row(result, segment))
                count += 1
                if count >= limit:
                    break
            if page >= (data.get("total_pages") or 0) or not results:
                break
            page += 1
            time.sleep(pause)
        print(f"[{segment}] {count} lignes extraites", file=log)
    return rows


def write_csv(rows, path):
    with open(path, "w", newline="", encoding="utf-8-sig") as fh:
        writer = csv.DictWriter(fh, fieldnames=COLUMNS, delimiter=";")
        writer.writeheader()
        writer.writerows(rows)


def parse_args(argv=None):
    p = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--segment", nargs="+", choices=sorted(SEGMENTS),
                   default=["formation"], help="segments à extraire")
    p.add_argument("--region", help="code région INSEE (ex. 11 = Île-de-France, "
                   "84 = Auvergne-Rhône-Alpes, 93 = PACA)")
    p.add_argument("--departement", help="code département (ex. 75, 69, 2A)")
    p.add_argument("--min-effectif", type=int, choices=sorted(SEUILS_EFFECTIF),
                   help="effectif salarié minimum")
    p.add_argument("--qualiopi", action="store_true",
                   help="uniquement les organismes certifiés Qualiopi")
    p.add_argument("--mot-cle", help="mot-clé libre (ex. « agile », « projet »)")
    p.add_argument("--max", type=int, help="nombre maximum de lignes par segment")
    p.add_argument("-o", "--output", default="prospects.csv",
                   help="fichier CSV de sortie (défaut : prospects.csv)")
    args = p.parse_args(argv)
    if args.max is not None and args.max <= 0:
        p.error("--max doit être un entier positif")
    if args.departement and not args.departement.isalnum():
        p.error("--departement invalide")
    if args.region and not args.region.isdigit():
        p.error("--region doit être un code numérique")
    return args


def main(argv=None):
    args = parse_args(argv)
    try:
        rows = extract(args.segment, args)
    except urllib.error.URLError as err:
        print(f"Erreur d'accès à l'API : {err}", file=sys.stderr)
        return 1
    write_csv(rows, args.output)
    print(f"{len(rows)} entreprises écrites dans {args.output}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())

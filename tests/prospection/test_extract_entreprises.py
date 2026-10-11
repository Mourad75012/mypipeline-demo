import csv
import io
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..",
                                "scripts", "prospection"))
import extract_entreprises as ee  # noqa: E402


def make_result(siren, **extra):
    base = {
        "siren": siren,
        "nom_complet": f"ENTREPRISE {siren}",
        "activite_principale": "85.59A",
        "categorie_entreprise": "PME",
        "tranche_effectif_salarie": "11",
        "date_creation": "2015-03-01",
        "nombre_etablissements_ouverts": 2,
        "siege": {"siret": siren + "00011", "adresse": "1 RUE X 75001 PARIS",
                  "code_postal": "75001", "libelle_commune": "PARIS",
                  "departement": "75", "region": "11"},
        "complements": {"est_organisme_formation": True, "est_qualiopi": False},
        "dirigeants": [
            {"type_dirigeant": "personne physique", "nom": "DUPONT",
             "prenoms": "Marie", "qualite": "Président"},
            {"type_dirigeant": "personne morale", "denomination": "HOLDING"},
        ],
    }
    base.update(extra)
    return base


class FakeApi:
    def __init__(self, pages):
        self.pages, self.calls = pages, []

    def __call__(self, params):
        self.calls.append(params)
        return self.pages[params["page"] - 1]


def args(*argv):
    return ee.parse_args(list(argv))


class TestBuildParams(unittest.TestCase):
    def test_filters(self):
        a = args("--region", "11", "--min-effectif", "50", "--qualiopi",
                 "--mot-cle", "agile")
        p = ee.build_params(ee.SEGMENTS["esn"], a, 3)
        self.assertEqual(p["activite_principale"], "62.01Z,62.02A,62.03Z,62.09Z")
        self.assertEqual(p["region"], "11")
        self.assertEqual(p["etat_administratif"], "A")
        self.assertTrue(p["tranche_effectif_salarie"].startswith("21,22,31"))
        self.assertNotIn("11", p["tranche_effectif_salarie"].split(","))
        self.assertEqual(p["est_qualiopi"], "true")
        self.assertEqual(p["q"], "agile")
        self.assertEqual(p["page"], 3)

    def test_minimal(self):
        p = ee.build_params(["70.22Z"], args(), 1)
        for key in ("region", "departement", "tranche_effectif_salarie",
                    "est_qualiopi", "q"):
            self.assertNotIn(key, p)


class TestToRow(unittest.TestCase):
    def test_mapping(self):
        row = ee.to_row(make_result("123456789"), "formation")
        self.assertEqual(row["effectif"], "10 à 19")
        self.assertEqual(row["organisme_formation"], "oui")
        self.assertEqual(row["qualiopi"], "non")
        self.assertEqual(row["dirigeants"], "Marie DUPONT (Président)")
        self.assertTrue(row["fiche_annuaire"].endswith("/123456789"))
        self.assertEqual(set(row), set(ee.COLUMNS))

    def test_missing_fields(self):
        row = ee.to_row({"siren": "1"}, "esn")
        self.assertEqual(row["effectif"], "non renseigné")
        self.assertEqual(row["qualiopi"], "")
        self.assertEqual(row["dirigeants"], "")


class TestExtract(unittest.TestCase):
    def test_pagination_dedup_and_limit(self):
        pages = [
            {"results": [make_result("1"), make_result("2")],
             "total_results": 4, "total_pages": 2},
            {"results": [make_result("2"), make_result("3")],
             "total_results": 4, "total_pages": 2},
        ]
        api = FakeApi(pages)
        rows = ee.extract(["formation"], args(), fetch=api, pause=0,
                          log=io.StringIO())
        self.assertEqual([r["siren"] for r in rows], ["1", "2", "3"])
        self.assertEqual(len(api.calls), 2)

        api = FakeApi(pages)
        rows = ee.extract(["formation"], args("--max", "1"), fetch=api,
                          pause=0, log=io.StringIO())
        self.assertEqual(len(rows), 1)
        self.assertEqual(len(api.calls), 1)

    def test_dedup_across_segments(self):
        page = [{"results": [make_result("9")], "total_pages": 1}]
        rows = ee.extract(["formation", "conseil"], args(),
                          fetch=FakeApi(page), pause=0, log=io.StringIO())
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["segment"], "formation")


class TestCsvAndArgs(unittest.TestCase):
    def test_write_csv_excel_friendly(self):
        rows = [ee.to_row(make_result("123"), "formation")]
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, "out.csv")
            ee.write_csv(rows, path)
            with open(path, "rb") as fh:
                self.assertTrue(fh.read().startswith(b"\xef\xbb\xbf"))
            with open(path, encoding="utf-8-sig") as fh:
                read = list(csv.DictReader(fh, delimiter=";"))
        self.assertEqual(read[0]["siren"], "123")

    def test_invalid_args(self):
        for bad in (["--max", "0"], ["--region", "IDF"],
                    ["--departement", "7&5"], ["--segment", "banque"]):
            with self.assertRaises(SystemExit):
                ee.parse_args(bad)


if __name__ == "__main__":
    unittest.main()

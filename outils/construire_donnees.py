"""Regenere les donnees du site a partir de data.js.

    python outils/construire_donnees.py

- telecharge les drapeaux manquants (flag-icons) dans flags/
- ecrit info.js : superficie, population, langues, monnaies, voisins, indicatif,
  domaine internet, sous-region (world-countries + Banque mondiale)
- signale les territoires dont le drapeau est identique a celui d'un autre pays :
  ils sont exclus du quiz des drapeaux (ex. Saint-Martin utilise le drapeau francais)
- ecrit decoupes.js : les formes que le fond de carte ne separe pas (nations du
  Royaume-Uni, departements d'outre-mer, Svalbard), tirees des « map units »
  de Natural Earth 50m
"""
import hashlib
import json
import re
import urllib.request
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DRAPEAUX = "https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/flags/4x3/{}.svg"
PAYS = "https://cdn.jsdelivr.net/npm/world-countries@5.1.0/countries.json"
POPULATION = ("https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL"
              "?format=json&per_page=20000&date=2019:2025")
UNITES = ("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/"
          "geojson/ne_50m_admin_0_map_units.geojson")
# Drapeaux absents de flag-icons (pas de code ISO)
AUTRES_DRAPEAUX = {"sml": "https://upload.wikimedia.org/wikipedia/commons/4/4d/Flag_of_Somaliland.svg"}

# Formes a remplacer ou a ajouter sur le fond de carte : cle -> noms des map units.
# 250 et 578 remplacent la France et la Norvege entieres par leur seule partie
# metropolitaine / continentale.
DECOUPES = {
    "250": ["France"], "578": ["Norway"],
    "gf": ["French Guiana"], "gp": ["Guadeloupe"], "mq": ["Martinique"],
    "re": ["Réunion"], "yt": ["Mayotte"], "sj": ["Svalbard Is.", "Jan Mayen I."],
    "gb-eng": ["England"], "gb-sct": ["Scotland"], "gb-wls": ["Wales"], "gb-nir": ["N. Ireland"],
}

# Absents de world-countries
INFOS_MANUELLES = {
    "gb-eng": {"sup": 130279, "pop": 56490048, "an": 2021, "langues": {"eng": "English"}, "monnaies": ["GBP"],
               "voisins": ["gb-sct", "gb-wls"], "tel": "+44", "tld": ".uk", "sr": "Northern Europe"},
    "gb-sct": {"sup": 77910, "pop": 5439842, "an": 2022, "langues": {"eng": "English", "gla": "Scottish Gaelic"},
               "monnaies": ["GBP"], "voisins": ["gb-eng"], "tel": "+44", "tld": ".uk", "sr": "Northern Europe"},
    "gb-wls": {"sup": 20779, "pop": 3107494, "an": 2021, "langues": {"cym": "Welsh", "eng": "English"},
               "monnaies": ["GBP"], "voisins": ["gb-eng"], "tel": "+44", "tld": ".uk", "sr": "Northern Europe"},
    "gb-nir": {"sup": 14130, "pop": 1903175, "an": 2021, "langues": {"eng": "English"}, "monnaies": ["GBP"],
               "voisins": ["ie"], "tel": "+44", "tld": ".uk", "sr": "Northern Europe"},
    "sml": {"sup": 177000, "pop": None, "an": None, "langues": {"som": "Somali", "ara": "Arabic"},
            "monnaies": [], "voisins": ["so", "et", "dj"], "tel": "+252", "tld": "", "sr": "Eastern Africa"},
}

# Absents de la Banque mondiale ou sous un autre code
CODES_BM = {"xk": "XKX"}
POPULATIONS_MANUELLES = {"tw": (23_400_000, 2024)}  # estimation officielle de Taiwan
# Fichiers differents mais drapeau visuellement identique a celui du pays de rattachement
IDENTIQUES_VISUELLEMENT = {"mf", "bl", "wf", "pm", "hm", "bq", "sh",
                           "gp", "gf", "re", "yt", "sj", "bv", "um"}


def telecharger(url):
    req = urllib.request.Request(url, headers={"User-Agent": "geo-quiz-build"})
    return urllib.request.urlopen(req, timeout=90).read()


def main():
    source = (RACINE / "data.js").read_text(encoding="utf-8")
    codes = re.findall(r'^\s*\["([a-z]{2,3}(?:-[a-z]{3})?)", "', source, re.M)
    print(f"{len(codes)} entrees dans data.js")

    dossier = RACINE / "flags"
    dossier.mkdir(exist_ok=True)
    for code in codes:
        f = dossier / f"{code}.svg"
        if not f.exists():
            f.write_bytes(telecharger(AUTRES_DRAPEAUX.get(code) or DRAPEAUX.format(code)))
            print("  drapeau telecharge :", code)

    unites = {f["properties"]["NAME"]: f["geometry"] for f in json.loads(telecharger(UNITES))["features"]}

    def arrondir(c):
        return [arrondir(x) for x in c] if isinstance(c[0], list) else [round(c[0], 3), round(c[1], 3)]

    decoupes = {}
    for cle, noms in DECOUPES.items():
        polygones = []
        for nom in noms:
            g = unites[nom]
            polygones += [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
        decoupes[cle] = {"type": "MultiPolygon", "coordinates": arrondir(polygones)}
    (RACINE / "decoupes.js").write_text(
        "// Genere par outils/construire_donnees.py (Natural Earth 50m, map units).\n"
        f"const DECOUPES = {json.dumps(decoupes, separators=(',', ':'))};\n", encoding="utf-8")
    print("decoupes.js ecrit :", ", ".join(decoupes))

    pays = json.loads(telecharger(PAYS))
    par_cca3 = {p["cca3"]: p["cca2"].lower() for p in pays}
    par_cca2 = {p["cca2"].lower(): p for p in pays}

    pop = {}
    for r in json.loads(telecharger(POPULATION))[1]:
        iso3, val, an = r["countryiso3code"], r["value"], int(r["date"])
        if iso3 and val is not None and (iso3 not in pop or an > pop[iso3][1]):
            pop[iso3] = (int(val), an)

    infos = {}
    for code in codes:
        if code in INFOS_MANUELLES:
            infos[code] = INFOS_MANUELLES[code]
            continue
        p = par_cca2.get(code)
        if not p:
            print("  ! absent de world-countries :", code)
            continue
        iso3 = CODES_BM.get(code, p["cca3"])
        population = POPULATIONS_MANUELLES.get(code) or pop.get(iso3)
        idd = p.get("idd") or {}
        suffixes = idd.get("suffixes") or []
        tel = (idd.get("root") or "") + (suffixes[0] if len(suffixes) == 1 else "")
        infos[code] = {
            "sup": p.get("area"),
            "pop": population[0] if population else None,
            "an": population[1] if population else None,
            "langues": p.get("languages") or {},
            "monnaies": list((p.get("currencies") or {}).keys()),
            "voisins": [par_cca3[b] for b in p.get("borders") or [] if par_cca3.get(b) in codes],
            "tel": tel,
            "tld": (p.get("tld") or [""])[0],
            "sr": p.get("subregion") or "",
        }
    sans_pop = [c for c in codes if c in infos and infos[c]["pop"] is None]
    print("population inconnue :", sans_pop)

    # Drapeaux identiques : on garde le pays souverain, on exclut le territoire
    territoires = set(re.findall(r'^\s*\["([a-z]{2,3}(?:-[a-z]{3})?)".*\b(?:de|statut): ', source, re.M))
    empreintes = {}
    for code in codes:
        h = hashlib.sha256((dossier / f"{code}.svg").read_bytes()).hexdigest()
        empreintes.setdefault(h, []).append(code)
    doubles = sorted({c for groupe in empreintes.values() if len(groupe) > 1
                      for c in groupe if c in territoires} | IDENTIQUES_VISUELLEMENT)
    print("drapeaux identiques (exclus du quiz drapeaux) :",
          [g for g in empreintes.values() if len(g) > 1])

    js = ("// Genere par outils/construire_donnees.py - ne pas modifier a la main.\n"
          "// Sources : world-countries (mledoze), Banque mondiale (SP.POP.TOTL).\n"
          f"const INFOS = {json.dumps(infos, ensure_ascii=False, separators=(',', ':'))};\n"
          f"const DRAPEAUX_DOUBLES = {json.dumps(doubles)};\n")
    (RACINE / "info.js").write_text(js, encoding="utf-8")
    print("info.js ecrit :", len(infos), "pays")


if __name__ == "__main__":
    main()

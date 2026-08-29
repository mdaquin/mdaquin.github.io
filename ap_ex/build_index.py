#!/usr/bin/env python3
"""Construit un index JSON de la banque d'exercices.

Parcourt un répertoire de fichiers d'exercices (ceux téléchargés depuis
l'atelier) et produit un index destiné à parcourir et filtrer la banque sans
avoir à ouvrir chaque fichier.

    python3 build_index.py                      # exercices_bank/ -> exercices_bank/index.json
    python3 build_index.py -d banque -o idx.json
    python3 build_index.py --check              # vérifie sans écrire

L'index contient, pour chaque exercice, ses métadonnées (type, domaine,
notions, niveau…), le nom de son fichier et de quoi l'afficher dans une liste ;
plus, en tête, les valeurs de facettes rencontrées, pour peupler des filtres.
"""

import argparse
import json
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

INDEX_VERSION = 1

# Libellés des types, alignés sur js/catalog.js
TYPE_LABELS = {
    "ecrire": "Écrire l'algorithme",
    "derouler": "Dérouler l'algorithme",
    "traduire": "Traduire en Python",
    "lire": "Lire un programme Python",
}


def first(mapping, *keys, default=None):
    """Première clé présente et non vide — les modèles varient sur l'orthographe
    (« contexte » / « context »)."""
    for key in keys:
        value = mapping.get(key)
        if value not in (None, "", [], {}):
            return value
    return default


def as_list(value):
    if value in (None, "", {}):
        return []
    if isinstance(value, list):
        return [v for v in value if v not in (None, "")]
    return [value]


def excerpt(text, limit=180):
    """Résumé d'une ligne, pour l'affichage dans une liste."""
    if not text:
        return ""
    flat = " ".join(str(text).split())
    return flat if len(flat) <= limit else flat[: limit - 1].rstrip() + "…"


def entry_for(path, bank):
    """Métadonnées d'un fichier d'exercice, ou None si le fichier est inutilisable."""
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as err:
        return None, f"JSON invalide ({err.msg}, ligne {err.lineno})"
    except OSError as err:
        return None, f"lecture impossible ({err.strerror})"

    if not isinstance(raw, dict):
        return None, "le fichier ne contient pas un objet JSON"

    data = raw.get("data")
    if not isinstance(data, dict):
        return None, "champ « data » absent ou invalide"

    params = raw.get("params") if isinstance(raw.get("params"), dict) else {}
    ex_type = raw.get("type") or data.get("type") or "inconnu"

    entry = {
        "id": path.stem,
        "fichier": str(path.relative_to(bank)),
        "type": ex_type,
        "type_libelle": TYPE_LABELS.get(ex_type, ex_type),
        "titre": first(raw, "titre", default=None) or first(data, "titre", default="Sans titre"),
        "domaine": params.get("domain") or None,
        "notions": as_list(params.get("notions")),
        "exclusions": as_list(params.get("exclusions")),
        "niveau": params.get("level") or None,
        "genere_le": raw.get("generatedAt"),
        # de quoi afficher une liste sans ouvrir les fichiers
        "resume": excerpt(first(data, "contexte", "context", "enonce", default="")),
        # facettes utiles pour filtrer : que contient réellement l'exercice ?
        "contenu": {
            "algorithme": bool(first(data, "algorithme")),
            "code_python": bool(first(data, "code_python")),
            "cas": len(as_list(first(data, "cas"))),
            "questions": len(as_list(first(data, "questions"))),
            "aide": bool(first(data, "aide")),
        },
        "octets": path.stat().st_size,
    }
    return entry, None


def sort_key(entry):
    """Les plus récents en tête ; les dates absentes ou illisibles à la fin."""
    stamp = entry.get("genere_le") or ""
    try:
        parsed = datetime.fromisoformat(stamp.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return (0, -parsed.timestamp())
    except ValueError:
        return (1, 0)


def facets(entries):
    """Valeurs rencontrées et leur nombre d'occurrences, pour construire des filtres."""
    def tally(counter):
        return [
            {"valeur": value, "nombre": count}
            for value, count in sorted(counter.items(), key=lambda kv: (-kv[1], str(kv[0])))
        ]

    types, domaines, niveaux = Counter(), Counter(), Counter()
    notions, exclusions = Counter(), Counter()
    for e in entries:
        types[e["type"]] += 1
        if e["domaine"]:
            domaines[e["domaine"]] += 1
        if e["niveau"]:
            niveaux[e["niveau"]] += 1
        notions.update(e["notions"])
        exclusions.update(e["exclusions"])

    return {
        "types": tally(types),
        "domaines": tally(domaines),
        "niveaux": tally(niveaux),
        "notions": tally(notions),
        "exclusions": tally(exclusions),
    }


def build(bank, output):
    """Retourne (index, erreurs). `output` est ignoré lors du parcours."""
    entries, errors = [], []
    for path in sorted(bank.glob("*.json")):
        if output is not None and path.resolve() == output.resolve():
            continue
        entry, error = entry_for(path, bank)
        if error:
            errors.append((path.name, error))
        else:
            entries.append(entry)

    entries.sort(key=sort_key)
    index = {
        "version": INDEX_VERSION,
        "construit_le": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "repertoire": bank.name,
        "nombre": len(entries),
        "facettes": facets(entries),
        "exercices": entries,
    }
    return index, errors


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("-d", "--dir", default="exercices_bank", type=Path,
                        help="répertoire des exercices (défaut : exercices_bank)")
    parser.add_argument("-o", "--output", type=Path,
                        help="fichier d'index (défaut : <dir>/index.json)")
    parser.add_argument("--check", action="store_true",
                        help="analyse et signale les problèmes, sans rien écrire")
    args = parser.parse_args(argv)

    bank = args.dir
    if not bank.is_dir():
        print(f"Répertoire introuvable : {bank}", file=sys.stderr)
        return 2

    output = args.output or bank / "index.json"
    index, errors = build(bank, output)

    for name, error in errors:
        print(f"  ignoré : {name} — {error}", file=sys.stderr)

    if args.check:
        print(f"{index['nombre']} exercice(s) lisible(s), {len(errors)} en erreur (rien écrit).")
        return 1 if errors else 0

    output.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    par_type = ", ".join(f"{f['valeur']} ×{f['nombre']}" for f in index["facettes"]["types"]) or "aucun"
    print(f"{output} — {index['nombre']} exercice(s) : {par_type}")
    if errors:
        print(f"{len(errors)} fichier(s) ignoré(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())

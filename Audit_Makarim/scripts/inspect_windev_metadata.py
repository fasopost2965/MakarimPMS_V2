#!/usr/bin/env python3
"""
Audit & Reverse Engineering — Flex PMS 9 (Hôtel Makarim)
Script Python en LECTURE SEULE absolue sur ./sources/Flex PMS 9/

Inspecte :
  - FlexPMS.wdd, backup/FlexPMS.wdd, FlexPMS.wda (analyse WINDEV 20 / PCS\0)
  - Flex PMS.wdl (bibliothèque compilée WINDEV 20 : blocs PCS\0, ETAT_*, REQ_*, IMP_*, etc.)
  - Flex PMS.REP (registre HFSQL complet des tables et GUIDs)
  - sys_registre.FIC/.mmo/.ndx, sys_explorer.ndx, sys_groupe.FIC/.ndx, sys_requetes.fic/.mmo
  - Fichiers de communication POS <-> PMS : COM_TICKET_TO_PMS.fic/.ndx et COM_CHAMBRE_DISPO.fic/.ndx
  - Fichiers temporaires/système : tempo/tmp_Planning.fic, MODEL_IMPRESSION.fic

Usage :
  python scripts/inspect_windev_metadata.py
"""

from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parent.parent
SOURCES_PMS = ROOT_DIR / "sources" / "Flex PMS 9"
OUT_DIR = ROOT_DIR / "scripts" / "out_python_inspect"

RE_ASCII_STR = re.compile(rb"[\x20-\x7E\xC0-\xFF]{4,}")
RE_CLEAN_IDENT = re.compile(r"\b[A-Za-z][A-Za-z0-9_]{2,55}\b")
RE_WINDEV_OBJ = re.compile(
    r"\b((?:FEN|ETAT|REQ|IMP|SUP|MENU|PROC|COL|COM|GPU|sys)_[A-Za-z0-9_À-ÿ]{2,65})\b",
    re.IGNORECASE,
)
RE_WLANG_OPEN = re.compile(
    r"(Ouvre(?:Fille)?\([^\)]+\)|HSupprimeTout\([^\)]+\))", re.IGNORECASE
)
RE_SQL = re.compile(
    r"(SELECT\s+.+?\s+FROM\s+[A-Za-z0-9_À-ÿ,\s\.]+(?:WHERE\s+.+?)?(?:GROUP\s+BY\s+[A-Za-z0-9_À-ÿ,\s\.]+)?)",
    re.IGNORECASE | re.DOTALL,
)


def read_bytes_ro(path: Path) -> bytes:
    """Lecture binaire strictement en lecture seule."""
    with path.open("rb") as fh:
        return fh.read()


def extract_ascii_and_utf16le(data: bytes, min_len: int = 4) -> dict[str, list[str]]:
    """Extrait les chaînes lisibles ASCII/CP1252 et UTF-16LE."""
    ascii_hits: list[str] = []
    for m in RE_ASCII_STR.finditer(data):
        s = m.group(0).decode("cp1252", errors="ignore").strip()
        if len(s) >= min_len and re.search(r"[A-Za-zÀ-ÿ]{3,}", s):
            if not re.search(r"[Þßðþýÿ]{2,}", s):
                ascii_hits.append(s)

    utf16_text = data.decode("utf-16le", errors="ignore")
    utf16_hits = [
        m.group(0).strip()
        for m in re.finditer(
            r"[A-Za-z0-9_À-ÿ][A-Za-z0-9_À-ÿ \-\.\:/\(\)'°,@\+]{3,140}", utf16_text
        )
        if re.search(r"[A-Za-zÀ-ÿ]{3,}", m.group(0))
        and not re.search(r"[Þßðþýÿ]", m.group(0))
    ]
    return {
        "ascii": sorted(set(ascii_hits)),
        "utf16le": sorted(set(utf16_hits)),
    }


def parse_rep_file(rep_path: Path) -> dict[str, Any]:
    """Parse Flex PMS.REP pour dresser la liste complète des tables HFSQL C/S et Classic."""
    cs_tables: dict[str, dict[str, Any]] = {}
    classic_tables: dict[str, dict[str, Any]] = {}

    text = read_bytes_ro(rep_path).decode("utf-8", errors="replace")
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith(";"):
            continue
        if line.startswith("LOCALIZATION_CS_UTF8="):
            parts = line.split("=", 1)[1].split("\t")
            if len(parts) >= 6:
                guid, table_name, fic_name, host, host_port, db_name = parts[:6]
                entry = cs_tables.setdefault(
                    table_name,
                    {"guid": guid, "fic": fic_name, "databases": set(), "servers": set()},
                )
                entry["databases"].add(db_name)
                entry["servers"].add(host_port)
        elif line.startswith("LOCALIZATION_UTF8="):
            parts = line.split("=", 1)[1].split("\t")
            if len(parts) >= 3:
                guid, table_name, phys_path = parts[:3]
                entry = classic_tables.setdefault(
                    table_name, {"guid": guid, "paths": set()}
                )
                entry["paths"].add(phys_path)

    return {
        "hfsql_cs_tables": {
            k: {
                "guid": v["guid"],
                "fic": v["fic"],
                "databases": sorted(v["databases"]),
                "servers": sorted(v["servers"]),
            }
            for k, v in sorted(cs_tables.items())
        },
        "hfsql_classic_tables": {
            k: {"guid": v["guid"], "paths": sorted(v["paths"])}
            for k, v in sorted(classic_tables.items())
        },
    }


def scan_wdl_pcs_blocks(wdl_path: Path) -> dict[str, Any]:
    """Scanne les en-têtes PCS\\0 de Flex PMS.wdl pour lister états, requêtes et menus compilés."""
    data = read_bytes_ro(wdl_path)
    magic = b"PCS\x00"
    offset = 0
    blocks: list[dict[str, Any]] = []
    reports: set[str] = set()
    queries: set[str] = set()
    menus: set[str] = set()
    other_objects: set[str] = set()

    while True:
        pos = data.find(magic, offset)
        if pos == -1:
            break
        offset = pos + 4
        if pos + 16 > len(data):
            break
        block_type = data[pos + 8]
        block_subtype = data[pos + 10]
        header_slice = data[pos : min(pos + 380, len(data))]
        asc = header_slice.decode("cp1252", errors="ignore")
        tokens = [
            m.group(0).strip()
            for m in re.finditer(r"[A-Za-z0-9_À-ÿ][A-Za-z0-9_À-ÿ \-\.]{2,65}", asc)
            if re.search(r"[A-Za-z]{2,}", m.group(0))
            and not re.search(r"[Þßðþýÿ]", m.group(0))
        ]
        obj_name = next(
            (t for t in tokens if t not in {"PCS", "PEF"} and not t.startswith("01F")),
            "",
        )
        blocks.append(
            {
                "offset": f"0x{pos:07X}",
                "type": f"{block_type:02X}/{block_subtype:02X}",
                "name": obj_name,
                "tokens": tokens[:6],
            }
        )
        if block_type == 0x03 and obj_name:
            reports.add(obj_name)
        elif block_type == 0x05 and obj_name:
            if obj_name.upper().startswith("MENU_"):
                menus.add(obj_name)
            elif obj_name.upper().startswith(("REQ_", "IMP_", "SUP_")) or obj_name in {
                "ServicesActive",
                "Reservation",
                "Reglement_note",
                "sys_UserLicences",
                "sys_CompteLicence",
            }:
                queries.add(obj_name)
            else:
                other_objects.add(obj_name)

    return {
        "file_size_bytes": len(data),
        "pcs_blocks_count": len(blocks),
        "reports_embedded": sorted(reports),
        "queries_embedded": sorted(queries),
        "menus_embedded": sorted(menus),
        "other_objects": sorted(other_objects),
        "blocks": blocks,
    }


def inspect_wdd_wda_headers(pms_dir: Path) -> list[dict[str, Any]]:
    """Inspecte les en-têtes PCS\\0 et signatures des fichiers d'analyse WDD/WDA."""
    results = []
    for rel in ["FlexPMS.wdd", "FlexPMS.wda", "backup/FlexPMS.wdd"]:
        p = pms_dir / rel
        if not p.exists():
            continue
        data = read_bytes_ro(p)
        hdr = data[:128]
        sig_match = re.search(rb"[0-9]{2}F[0-9]{5}[a-z]", hdr)
        results.append(
            {
                "file": rel,
                "size_bytes": len(data),
                "magic": hdr[:4].decode("ascii", errors="replace"),
                "windev_version_byte": hdr[14] if len(hdr) > 14 else None,
                "build_signature": sig_match.group(0).decode("ascii")
                if sig_match
                else None,
                "note": "Conteneur PCS\\0 compressé/encodé PC SOFT (analyse binaire compilée).",
            }
        )
    return results


def extract_ndx_wdd_fragments(pms_dir: Path) -> dict[str, Any]:
    """
    Extrait les fragments non compressés de l'analyse FlexPMS.wdd (noms de tables,
    rubriques, clés composées OptimCleComp_* et contraintes d'intégrité Contrainte_*)
    présents dans les fichiers d'index HFSQL (.ndx).
    """
    constraints: set[str] = set()
    optim_keys: set[str] = set()
    columns_by_file: dict[str, list[str]] = {}

    for ndx_path in sorted(pms_dir.rglob("*.ndx")):
        data = read_bytes_ro(ndx_path)
        asc = data.decode("cp1252", errors="ignore")
        tokens = sorted(
            set(
                m.group(0)
                for m in RE_CLEAN_IDENT.finditer(asc)
                if "_" in m.group(0)
                or m.group(0).startswith(
                    ("ID", "CODE", "NUM", "DATE", "LIB", "PRIX", "TOTAL", "ETAT", "CPT", "ED_")
                )
            )
        )
        rel = str(ndx_path.relative_to(pms_dir))
        if tokens:
            columns_by_file[rel] = tokens
        for t in tokens:
            if t.startswith("Contrainte_"):
                constraints.add(t)
            elif t.lower().startswith("optimclecomp_"):
                optim_keys.add(t)

    return {
        "foreign_key_constraints": sorted(constraints),
        "optimizer_composite_keys": sorted(optim_keys),
        "tokens_by_ndx": columns_by_file,
    }


def inspect_registre_and_queries(pms_dir: Path) -> dict[str, Any]:
    """Extrait les fenêtres FEN_*, menus et requêtes SQL personnalisées depuis la config sa."""
    sa_dir = pms_dir / "commun" / "configuration" / "sa"
    reg_mmo = sa_dir / "sys_registre.mmo"
    reg_fic = sa_dir / "sys_registre.FIC"
    req_mmo = sa_dir / "sys_requetes.mmo"

    windows: set[str] = set()
    commands: list[str] = []
    if reg_mmo.exists():
        asc = read_bytes_ro(reg_mmo).decode("cp1252", errors="ignore")
        commands = sorted(set(m.group(1).strip() for m in RE_WLANG_OPEN.finditer(asc)))
        windows = set(re.findall(r"\b(FEN_[A-Za-z0-9_À-ÿ]+)\b", asc))

    menu_entries: list[dict[str, str]] = []
    if reg_fic.exists():
        asc_fic = read_bytes_ro(reg_fic).decode("cp1252", errors="ignore")
        cat_rx = re.compile(
            r"(?:Administration|Réservation|Front Office|Main courante|Caisse|Gouvernante|Etats|Back Office|Add-on),[^\x00]{0,60}"
        )
        for m in cat_rx.finditer(asc_fic):
            window_slice = asc_fic[max(0, m.start() - 180) : min(len(asc_fic), m.end() + 180)]
            toks = [
                t.group(0).strip()
                for t in re.finditer(r"[A-Za-zÀ-ÿ][A-Za-z0-9_À-ÿ \-\.\:/'&,\+]{2,65}", window_slice)
                if re.search(r"[A-Za-zÀ-ÿ]{3,}", t.group(0))
                and not re.search(r"[Þßðþýÿ]", t.group(0))
            ]
            menu_entries.append({"category": m.group(0).strip(), "labels": toks[:4]})

    custom_sql: list[str] = []
    if req_mmo.exists():
        asc_req = read_bytes_ro(req_mmo).decode("cp1252", errors="ignore")
        for m in RE_SQL.finditer(asc_req):
            cleaned = re.sub(r"\s+", " ", re.sub(r"[^\x20-\x7E\xC0-\xFF]", " ", m.group(1))).strip()
            if len(cleaned) >= 15:
                custom_sql.append(cleaned)

    return {
        "windows_fen_count": len(windows),
        "windows_fen": sorted(windows),
        "wlanguage_commands": commands,
        "menu_entries_count": len(menu_entries),
        "menu_entries": menu_entries,
        "custom_sql_queries": custom_sql,
    }


def inspect_pos_communication_files(pms_dir: Path) -> dict[str, Any]:
    """Inspecte COM_CHAMBRE_DISPO.fic et COM_TICKET_TO_PMS.fic/.ndx (interface POS <-> PMS)."""
    dispo_path = pms_dir / "COM_CHAMBRE_DISPO.fic"
    ticket_path = pms_dir / "COM_TICKET_TO_PMS.fic"
    ticket_ndx = pms_dir / "COM_TICKET_TO_PMS.ndx"

    dispo_records: list[dict[str, str]] = []
    if dispo_path.exists():
        raw = read_bytes_ro(dispo_path)
        # Les enregistrements actifs commencent après le marqueur FF et portent le N° chambre suivi du nom occupant
        for m in re.finditer(rb"\xff(\d{3})\x00{4,16}([A-Z][A-Z0-9 /,\.\-]{3,80})", raw):
            dispo_records.append(
                {
                    "num_chambre": m.group(1).decode("ascii", errors="ignore"),
                    "occupant": m.group(2).decode("cp1252", errors="ignore").strip(),
                }
            )

    ticket_fields: list[str] = []
    if ticket_ndx.exists():
        asc = read_bytes_ro(ticket_ndx).decode("cp1252", errors="ignore")
        ticket_fields = sorted(
            set(re.findall(r"\b(?:ED|F)_[A-Z0-9_]+\b", asc))
        )

    return {
        "COM_CHAMBRE_DISPO": {
            "size_bytes": dispo_path.stat().st_size if dispo_path.exists() else 0,
            "role": "Flux PMS -> POS (Flex Caisse) : chambres occupées et occupants autorisés à imputer sur chambre.",
            "sample_records_count": len(dispo_records),
            "sample_records": dispo_records,
        },
        "COM_TICKET_TO_PMS": {
            "size_bytes": ticket_path.stat().st_size if ticket_path.exists() else 0,
            "role": "Flux POS (Flex Caisse) -> PMS : file des tickets restaurant/bar transférés vers le folio chambre.",
            "ndx_schema_tokens": ticket_fields,
        },
    }


def main() -> None:
    if not SOURCES_PMS.exists():
        raise SystemExit(f"Dossier source introuvable : {SOURCES_PMS}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    report = {
        "wdd_wda_analysis": inspect_wdd_wda_headers(SOURCES_PMS),
        "rep_tables": parse_rep_file(SOURCES_PMS / "Flex PMS.REP"),
        "wdl_inventory": scan_wdl_pcs_blocks(SOURCES_PMS / "Flex PMS.wdl"),
        "ndx_schema_fragments": extract_ndx_wdd_fragments(SOURCES_PMS),
        "ui_registre_and_queries": inspect_registre_and_queries(SOURCES_PMS),
        "pos_communication": inspect_pos_communication_files(SOURCES_PMS),
    }

    out_json = OUT_DIR / "windev_metadata_report.json"
    out_json.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"[OK] Rapport généré : {out_json}")
    print(f"  - Tables HFSQL C/S (HOTEL_DATA) : {len(report['rep_tables']['hfsql_cs_tables'])}")
    print(f"  - Tables HFSQL Classic          : {len(report['rep_tables']['hfsql_classic_tables'])}")
    print(f"  - Blocs PCS\\0 dans Flex PMS.wdl : {report['wdl_inventory']['pcs_blocks_count']}")
    print(f"  - États intégrés (WDL)          : {len(report['wdl_inventory']['reports_embedded'])}")
    print(f"  - Requêtes intégrées (WDL)      : {len(report['wdl_inventory']['queries_embedded'])}")
    print(f"  - Fenêtres FEN_* (sys_registre) : {report['ui_registre_and_queries']['windows_fen_count']}")
    print(f"  - Contraintes FK extraites      : {len(report['ndx_schema_fragments']['foreign_key_constraints'])}")
    print(f"  - Chambres COM_CHAMBRE_DISPO    : {report['pos_communication']['COM_CHAMBRE_DISPO']['sample_records_count']}")


if __name__ == "__main__":
    main()

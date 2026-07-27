#!/usr/bin/env python3
"""Update `name` fields in a problems JSON using each entry's URL.

Usage:
    python py/update_names_from_url.py --file content/problemBank/parsed_AoPS.problems.json

This script makes a .bak copy before writing.
"""
from __future__ import annotations
import json
import re
from pathlib import Path
import argparse


def derive_name_from_url(url: str) -> str | None:
    if not url:
        return None
    # Look for the wiki path part
    if "/wiki/index.php/" in url:
        path = url.split("/wiki/index.php/", 1)[1]
    else:
        # fallback to last path segment
        path = url.rstrip("/\n\r").split("/")[-1]

    parts = path.split("/")
    if len(parts) >= 2:
        second_last = parts[-2]
        last = parts[-1]
    else:
        # if only one part, try splitting underscores
        second_last = parts[0]
        last = ""

    # split second_last by underscores and drop trailing 'Problems' or 'Problem'
    tokens = second_last.split("_")
    if tokens and tokens[-1].lower().startswith("problem"):
        base_tokens = tokens[:-1]
    else:
        base_tokens = tokens

    base = " ".join(base_tokens).strip()

    # parse last part for Problem number
    m = re.search(r"Problem[_ ]?(\d+)$", last, re.IGNORECASE)
    if m:
        num = m.group(1)
        if base:
            return f"{base} Problem {num}"
        else:
            return f"Problem {num}"

    # if last contains 'Problem' followed by something, try replacing underscores
    if last.lower().startswith("problem"):
        last_f = last.replace("_", " ")
        return f"{base} {last_f}".strip()

    # fallback: use joined parts with underscores replaced
    friendly = path.replace("_", " ").replace("/", " ")
    return friendly


def update_file(filepath: Path) -> int:
    data = json.loads(filepath.read_text(encoding="utf-8"))
    practice = data.get("practice")
    if not isinstance(practice, list):
        raise SystemExit("No 'practice' list found in JSON")

    changed = 0
    for entry in practice:
        if not isinstance(entry, dict):
            continue
        url = entry.get("url") or entry.get("meta", {}).get("link")
        if not url:
            continue
        name = derive_name_from_url(url)
        if not name:
            continue
        # Only change if different
        if entry.get("name") != name:
            entry["name"] = name
            changed += 1

    # backup
    bak = filepath.with_suffix(filepath.suffix + ".bak")
    bak.write_bytes(filepath.read_bytes())
    filepath.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return changed


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=Path, required=True)
    args = parser.parse_args()
    n = update_file(args.file)
    print(f"Updated {n} names in {args.file}")


if __name__ == "__main__":
    main()

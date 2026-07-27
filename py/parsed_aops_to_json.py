#!/usr/bin/env python3
"""Convert a generic parsed ArtOfProblemSolving CSV into a `.problems.json` file.

Expected CSV columns (case-sensitive):
- problem_id
- link
- problem
- solution
- letter
- answer

Usage:
    python py/parsed_aops_to_json.py \
        --input py/parsed_ArtOfProblemSolving.csv \
        --output content/problemBank/parsed_AoPS.problems.json
"""
from __future__ import annotations
import csv
import json
from pathlib import Path
import argparse
from typing import Dict, Any


def row_to_problem(row: Dict[str, str]) -> Dict[str, Any]:
    pid = (row.get("problem_id") or "").strip()
    link = (row.get("link") or "").strip()
    statement = (row.get("problem") or "").strip()
    solution = (row.get("solution") or "").strip()
    letter = (row.get("letter") or "").strip()
    answer = (row.get("answer") or "").strip()

    unique_id = pid if pid else None
    name = None
    if unique_id:
        name = f"AoPS-{unique_id}"
    else:
        # make a short name from the statement
        name = statement[:60] + ("..." if len(statement) > 60 else "")

    obj: Dict[str, Any] = {
        "uniqueId": unique_id or name,
        "name": name,
        "url": link,
        "source": "ArtOfProblemSolving",
        "difficulty": "",
        "isStarred": False,
        "tags": [],
        "statement": statement,
        "solutionMetadata": {"kind": "none"},
    }

    if solution:
        obj["solutions"] = [solution]

    if answer:
        obj["exactAnswer"] = answer

    if letter:
        obj["choiceLetter"] = letter

    # keep original row for debugging
    obj["meta"] = {k: v for k, v in row.items() if v}
    return obj


def convert(input_path: Path, output_path: Path) -> int:
    problems = []
    with input_path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            # skip empty rows
            if not any((v or "").strip() for v in row.values()):
                continue
            problems.append(row_to_problem(row))

    out = {"MODULE_ID": "parsed-aops", "practice": problems}
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=2)
    return len(problems)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=Path("py/parsed_ArtOfProblemSolving.csv"))
    parser.add_argument("--output", type=Path, default=Path("content/problemBank/parsed_AoPS.problems.json"))
    args = parser.parse_args()
    n = convert(args.input, args.output)
    print(f"Wrote {n} problems to {args.output}")


if __name__ == "__main__":
    main()

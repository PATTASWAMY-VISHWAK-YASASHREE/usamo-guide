#!/usr/bin/env python3
"""Convert the AIME CSV to a problems JSON matching existing `.problems.json` files.

Usage:
    python py/csv_to_problems_json.py \
        --input py/AIME_Problems_1983_to_2024.csv \
        --output content/problemBank/AIME.problems.json

The script is permissive: it detects rows starting with a 4-digit year
and maps columns as Year, Set, Problem Number, URL, Problem Statement,
Exact Answer, followed by any Solution columns.
"""
from __future__ import annotations
import csv
import json
from pathlib import Path
import argparse
from typing import List, Dict, Any


def normalize_row(row: List[str]) -> Dict[str, Any] | None:
    # Expect at least: Year, Set, Problem Number, URL, Statement, Exact Answer
    if not row:
        return None
    # Trim whitespace from all fields
    row = [c.strip() for c in row]
    # Some CSVs have a broken header; detect data rows by a 4-digit year in column 0
    year = row[0]
    if not (year.isdigit() and len(year) == 4):
        return None

    # Safely extract columns with fallbacks
    set_col = row[1] if len(row) > 1 else ""
    prob_num = row[2] if len(row) > 2 else ""
    url = row[3] if len(row) > 3 else ""
    statement = row[4] if len(row) > 4 else ""
    exact_answer = row[5] if len(row) > 5 else ""
    solutions: List[str] = []
    if len(row) > 6:
        for s in row[6:]:
            if s and s != "":
                solutions.append(s)

    unique_id = f"aime-{year}-{prob_num}" if prob_num else f"aime-{year}"
    name = f"Problem {prob_num} ({year} AIME)" if prob_num else f"AIME {year} Problem"

    obj: Dict[str, Any] = {
        "uniqueId": unique_id,
        "name": name,
        "url": url,
        "source": f"AIME {year}",
        "difficulty": "",
        "isStarred": False,
        "tags": [],
        "statement": statement,
        "exactAnswer": exact_answer,
        # keep existing schema compatibility
        "solutionMetadata": {"kind": "none"},
    }
    if solutions:
        obj["solutions"] = solutions

    # preserve original csv columns for later debugging
    obj["meta"] = {"set": set_col, "problem_number": prob_num}
    return obj


def convert(input_path: Path, output_path: Path) -> None:
    problems: List[Dict[str, Any]] = []

    with input_path.open(newline="", encoding="utf-8") as fh:
        reader = csv.reader(fh)
        for row in reader:
            rec = normalize_row(row)
            if rec is not None:
                problems.append(rec)

    out = {
        "MODULE_ID": "aime-problems",
        "practice": problems,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=2)

    print(f"Wrote {len(problems)} problems to {output_path}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=Path("py/AIME_Problems_1983_to_2024.csv"))
    parser.add_argument("--output", type=Path, default=Path("content/problemBank/AIME.problems.json"))
    args = parser.parse_args()
    convert(args.input, args.output)


if __name__ == "__main__":
    main()

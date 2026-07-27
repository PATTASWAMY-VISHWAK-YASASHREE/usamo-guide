from pathlib import Path
import json
import re
import sys


ASY_PATTERN = re.compile(r"\[asy\].*?\[/asy\]", re.DOTALL | re.IGNORECASE)


def collect_strings(obj):
    if isinstance(obj, dict):
        for value in obj.values():
            yield from collect_strings(value)
    elif isinstance(obj, list):
        for item in obj:
            yield from collect_strings(item)
    elif isinstance(obj, str):
        yield obj


def main() -> None:
    input_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("content/fixed.json")
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("content/asy_problem_links.txt")

    data = json.loads(input_path.read_text(encoding="utf-8"))
    problems = data.get("practice", []) if isinstance(data, dict) else data

    links = []
    for problem in problems:
        if not isinstance(problem, dict):
            continue

        text_blob = "\n".join(s for s in collect_strings(problem) if isinstance(s, str))
        if ASY_PATTERN.search(text_blob):
            url = problem.get("url")
            if isinstance(url, str) and url:
                links.append(url)

    output_path.write_text("\n".join(links), encoding="utf-8")
    print(f"Found {len(links)} problem links. Saved to {output_path}")


if __name__ == "__main__":
    main()

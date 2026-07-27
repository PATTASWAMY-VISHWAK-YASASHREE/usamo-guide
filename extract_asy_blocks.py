from pathlib import Path
import re
import sys


def main() -> None:
    input_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("content/fixed.json")
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("content/asy_blocks.txt")

    text = input_path.read_text(encoding="utf-8")
    pattern = re.compile(r"\$ \[asy\].*?\[/asy\] \$", re.DOTALL)
    matches = pattern.findall(text)

    output_path.write_text("\n\n".join(matches), encoding="utf-8")
    print(f"Found {len(matches)} matches. Saved to {output_path}")


if __name__ == "__main__":
    main()

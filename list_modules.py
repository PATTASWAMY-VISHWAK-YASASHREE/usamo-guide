from pathlib import Path

roots = [
    Path("content/1_Foundations"),
    Path("content/2_Intermediate"),
    Path("content/3_Advanced"),
    Path("content/4_USAMO"),
]

for root in roots:
    modules = sorted(
        p.stem for p in root.iterdir()
        if p.is_file() and p.suffix == ".mdx"
    )
    print(f"{root} ({len(modules)} modules)")
    for name in modules:
        print(name)
    print()

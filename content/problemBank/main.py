import json
from langdetect import detect, DetectorFactory

DetectorFactory.seed = 0  # Makes results deterministic

INPUT_FILE = r"C:\Coding\pop\usamo-guide-ui-overhaul\usamo-guide-ui-overhaul\content\problemBank\Test.json"
OUTPUT_FILE = "filtered_problems.json"



def is_english(problem):
    """
    Returns True if the problem statement is detected as English.
    """
    statement = problem.get("statement", "")

    # Remove markdown image links
    while "![](" in statement:
        start = statement.find("![](")
        end = statement.find(")", start)
        if end == -1:
            break
        statement = statement[:start] + statement[end + 1:]

    # Very short statements aren't reliable
    if len(statement.strip()) < 50:
        return True

    try:
        return detect(statement) == "en"
    except Exception:
        return True  # Keep if detection fails


with open(INPUT_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

practice = data["practice"]

original = len(practice)

data["practice"] = [p for p in practice if is_english(p)]

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Original : {original}")
print(f"Remaining: {len(data['practice'])}")
print(f"Removed  : {original - len(data['practice'])}")
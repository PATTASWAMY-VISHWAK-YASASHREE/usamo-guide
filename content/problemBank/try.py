import json

INPUT_FILE = r"C:\Coding\pop\usamo-guide-ui-overhaul\usamo-guide-ui-overhaul\content\problemBank\filtered_problems.json"
OUTPUT_FILE = "first_10000_problems.json"

# Load the JSON
with open(INPUT_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

# Keep only the first 10,000 problems
data["practice"] = data["practice"][:500]

# Save the new file
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Saved {len(data['practice'])} problems to '{OUTPUT_FILE}'")
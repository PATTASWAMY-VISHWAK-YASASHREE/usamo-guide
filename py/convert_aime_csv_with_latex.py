#!/usr/bin/env python3
"""
Convert AIME CSV to problems.json with full LaTeX and Asymptote support.

This script processes the AIME_Problems_1983_to_2024.csv and converts it to a 
properly formatted problems.json file that integrates with the Gatsby site.

Features:
- Preserves LaTeX math expressions ($...$ and $$...$$)
- Preserves Asymptote diagrams in [asy]...[/asy] blocks
- Combines multiple solutions into formatted markdown
- Generates proper problem metadata (ID, name, difficulty, tags)

Usage:
    python py/convert_aime_csv_with_latex.py \\
        --input py/AIME_Problems_1983_to_2024.csv \\
        --output content/problemBank/AIME.problems.json

The CSV format is expected to be:
  Year, Set, Problem#, URL, Problem Statement, Answer, Solution1, Solution2, ...
"""
from __future__ import annotations
import csv
import json
import re
from pathlib import Path
import argparse
from typing import List, Dict, Any, Optional


class LatexProcessor:
    """Process and normalize LaTeX content for proper rendering."""
    
    @staticmethod
    def has_latex(text: str) -> bool:
        """Check if text contains LaTeX expressions."""
        return bool(re.search(r'\$.*?\$|\\\[.*?\\\]', text, re.DOTALL))
    
    @staticmethod
    def preserve_latex(text: str) -> str:
        """
        Ensure LaTeX expressions are preserved as-is.
        Converts common LaTeX notation to markdown-compatible format.
        """
        if not text:
            return text
        
        # Replace \[ \] with $$ $$ for display math
        text = re.sub(r'\\\[\s*', '$$', text)
        text = re.sub(r'\s*\\\]', '$$', text)
        
        return text
    
    @staticmethod
    def process_asymptote(text: str) -> str:
        """
        Ensure Asymptote blocks are properly formatted.
        Returns text with [asy]...[/asy] blocks preserved.
        """
        if '[asy]' not in text:
            return text
        
        # Pattern to match Asymptote blocks
        pattern = r'\[asy\](.*?)\[/asy\]'
        
        def format_asy_block(match):
            code = match.group(1).strip()
            # Preserve the block structure
            return f'\n\n[asy]\n{code}\n[/asy]\n\n'
        
        text = re.sub(pattern, format_asy_block, text, flags=re.DOTALL)
        return text
    
    @staticmethod
    def process_content(text: str) -> str:
        """Process full content with LaTeX and Asymptote support."""
        if not text:
            return text
        
        # First preserve LaTeX
        text = LatexProcessor.preserve_latex(text)
        # Then process Asymptote
        text = LatexProcessor.process_asymptote(text)
        # Clean up excessive whitespace
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        return text.strip()


class AIIMEProblemConverter:
    """Convert AIME CSV rows to properly formatted problem JSON objects."""
    
    AIME_DIFFICULTY_MAP = {
        1: 'Easy',
        2: 'Easy',
        3: 'Easy',
        4: 'Medium',
        5: 'Medium',
        6: 'Medium',
        7: 'Hard',
        8: 'Hard',
        9: 'Hard',
        10: 'Hard',
        11: 'Very Hard',
        12: 'Very Hard',
        13: 'Very Hard',
        14: 'Very Hard',
        15: 'Olympiad',
    }
    
    @staticmethod
    def get_difficulty(problem_num: str) -> str:
        """Map AIME problem number to difficulty."""
        try:
            num = int(problem_num)
            return AIIMEProblemConverter.AIME_DIFFICULTY_MAP.get(num, 'Medium')
        except ValueError:
            return 'Medium'
    
    @staticmethod
    def estimate_tags(problem_num: str, statement: str) -> List[str]:
        """Generate relevant tags based on problem number and content."""
        tags = ['AIME', 'Algebra', 'Geometry', 'Number Theory', 'Combinatorics']
        
        # Add basic topic detection from keywords
        statement_lower = statement.lower()
        keyword_tags = {
            'geometry': ['Geometry', 'Coordinate Geometry'],
            'triangle': ['Geometry'],
            'circle': ['Geometry', 'Circles'],
            'polynomial': ['Algebra', 'Polynomials'],
            'number': ['Number Theory'],
            'prime': ['Number Theory'],
            'combinat': ['Combinatorics'],
            'permutation': ['Combinatorics'],
            'function': ['Algebra', 'Functions'],
            'matrix': ['Algebra', 'Linear Algebra'],
            'sequence': ['Sequences'],
            'series': ['Series'],
            'inequality': ['Algebra', 'Inequalities'],
            'trigonometry': ['Trigonometry'],
            'complex': ['Complex Numbers'],
        }
        
        detected_tags = set()
        for keyword, tag_list in keyword_tags.items():
            if keyword in statement_lower:
                detected_tags.update(tag_list)
        
        return list(detected_tags) if detected_tags else tags
    
    @staticmethod
    def format_solutions(solutions: List[str]) -> str:
        """Format multiple solutions into a single markdown document."""
        if not solutions:
            return ""
        
        formatted = []
        for i, solution in enumerate(solutions, 1):
            if solution and solution.strip():
                # Process each solution for LaTeX and Asymptote
                processed = LatexProcessor.process_content(solution.strip())
                if i == 1:
                    formatted.append(f"## Solution\n\n{processed}")
                else:
                    formatted.append(f"## Solution {i}\n\n{processed}")
        
        return "\n\n".join(formatted)
    
    @staticmethod
    def normalize_row(row: List[str]) -> Dict[str, Any] | None:
        """Convert a CSV row to a problem object."""
        if not row:
            return None
        
        # Trim whitespace from all fields
        row = [c.strip() for c in row]
        
        # Detect data rows by a 4-digit year in column 0
        year = row[0]
        if not (year.isdigit() and len(year) == 4):
            return None
        
        # Extract columns with fallbacks
        set_col = row[1] if len(row) > 1 else ""
        prob_num = row[2] if len(row) > 2 else ""
        url = row[3] if len(row) > 3 else ""
        statement = row[4] if len(row) > 4 else ""
        exact_answer = row[5] if len(row) > 5 else ""
        
        # Extract all solution columns (may be multiple)
        solutions: List[str] = []
        if len(row) > 6:
            for s in row[6:]:
                if s and s.strip():
                    solutions.append(s.strip())
        
        # Process statement and solutions for LaTeX/Asymptote
        statement = LatexProcessor.process_content(statement)
        solutions = [LatexProcessor.process_content(sol) for sol in solutions]
        
        # Generate unique ID and name
        unique_id = f"aime-{year}-{prob_num}" if prob_num else f"aime-{year}"
        name = f"Problem {prob_num} ({year} AIME)" if prob_num else f"AIME {year} Problem"
        
        # Generate difficulty and tags
        difficulty = AIIMEProblemConverter.get_difficulty(prob_num)
        tags = AIIMEProblemConverter.estimate_tags(prob_num, statement)
        
        # Format complete solution markdown
        solutions_md = AIIMEProblemConverter.format_solutions(solutions)
        
        # Create problem object
        problem: Dict[str, Any] = {
            "uniqueId": unique_id,
            "name": name,
            "url": url,
            "source": "AIME",
            "sourceDescription": f"American Invitational Mathematics Examination {year}",
            "difficulty": difficulty,
            "isStarred": False,
            "tags": tags,
            "statement": statement,
            "exactAnswer": exact_answer,
            "solutionReveal": {
                "mode": "inline",
                "markdown": solutions_md if solutions_md else "Solution not yet provided."
            },
            "interaction": {
                "type": "integer",
                "correct": exact_answer
            }
        }
        
        return problem


def convert(input_path: Path, output_path: Path) -> None:
    """Convert CSV file to problems.json."""
    problems: List[Dict[str, Any]] = []
    skipped = 0
    
    with input_path.open(newline="", encoding="utf-8") as fh:
        reader = csv.reader(fh)
        for row_num, row in enumerate(reader, 1):
            try:
                rec = AIIMEProblemConverter.normalize_row(row)
                if rec is not None:
                    problems.append(rec)
                else:
                    if row_num > 1:  # Skip header row silently
                        skipped += 1
            except Exception as e:
                print(f"⚠️  Warning: Failed to process row {row_num}: {e}")
                skipped += 1
    
    # Create output structure matching the site's format
    output_data = {
        "MODULE_ID": "aime",
        "practice": problems,
    }
    
    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Write JSON with proper formatting
    with output_path.open("w", encoding="utf-8") as fh:
        json.dump(output_data, fh, ensure_ascii=False, indent=2)
    
    # Print summary
    print(f"✅ Conversion complete!")
    print(f"   • Converted: {len(problems)} problems")
    if skipped > 0:
        print(f"   • Skipped: {skipped} rows")
    print(f"   • Output: {output_path}")
    print(f"\n📝 LaTeX Expressions: Preserved as $...$ (inline) and $$...$$ (display)")
    print(f"📐 Asymptote Diagrams: Preserved in [asy]...[/asy] blocks")


def main() -> None:
    """Parse command-line arguments and run conversion."""
    parser = argparse.ArgumentParser(
        description="Convert AIME CSV to problems.json with LaTeX and Asymptote support"
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("py/AIME_Problems_1983_to_2024.csv"),
        help="Input CSV file path"
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("content/problemBank/AIME.problems.json"),
        help="Output problems.json file path"
    )
    
    args = parser.parse_args()
    
    if not args.input.exists():
        print(f"❌ Error: Input file not found: {args.input}")
        return
    
    convert(args.input, args.output)


if __name__ == "__main__":
    main()

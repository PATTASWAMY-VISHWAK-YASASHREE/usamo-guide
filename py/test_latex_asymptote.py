#!/usr/bin/env python3
"""
Quick test script to validate LaTeX and Asymptote processing.
Run this to verify the conversion script handles edge cases correctly.
"""
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from convert_aime_csv_with_latex import LatexProcessor, AIIMEProblemConverter

def test_latex_processing():
    """Test LaTeX expression preservation."""
    test_cases = [
        # Basic inline math
        ("The value $x = 5$ is correct.", "The value $x = 5$ is correct."),
        
        # Display math
        ("Consider $$x^2 + y^2 = z^2$$", "Consider $$x^2 + y^2 = z^2$$"),
        
        # Multiple expressions
        ("Find $x$ where $x^2 = 4$", "Find $x$ where $x^2 = 4$"),
        
        # Complex LaTeX
        ("$$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$", "$$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$"),
    ]
    
    print("Testing LaTeX processing...")
    for input_text, expected in test_cases:
        result = LatexProcessor.preserve_latex(input_text)
        status = "✅" if result == expected else "❌"
        print(f"{status} Input: {input_text[:40]}...")
        if result != expected:
            print(f"   Expected: {expected}")
            print(f"   Got:      {result}")
    print()


def test_asymptote_processing():
    """Test Asymptote block preservation."""
    test_cases = [
        # Basic Asymptote block
        ("[asy]\npair A=(0,0);\n[/asy]", True),
        
        # Asymptote with code
        ("[asy]\nsize(200);\npair A=(0,0), B=(1,0);\ndraw(A--B);\n[/asy]", True),
        
        # Multiple blocks
        ("[asy]\npair A=(0,0);\n[/asy]\nSome text\n[asy]\npair B=(1,1);\n[/asy]", True),
    ]
    
    print("Testing Asymptote processing...")
    for input_text, has_asy in test_cases:
        result = LatexProcessor.process_asymptote(input_text)
        has_result_asy = '[asy]' in result and '[/asy]' in result
        status = "✅" if has_result_asy == has_asy else "❌"
        print(f"{status} Input: {input_text[:40]}...")
        if has_result_asy != has_asy:
            print(f"   Expected [asy] blocks: {has_asy}")
            print(f"   Got: {has_result_asy}")
    print()


def test_problem_conversion():
    """Test problem row conversion."""
    test_row = [
        "2019",           # Year
        "I",              # Set
        "12",             # Problem number
        "https://example.com",  # URL
        "Find $x$ where $x^2 + 1 = 0$.",  # Statement
        "123",            # Answer
        "Solution: $x = i$ or $x = -i$.",  # Solution
    ]
    
    print("Testing problem conversion...")
    result = AIIMEProblemConverter.normalize_row(test_row)
    
    if result:
        print("✅ Problem converted successfully")
        print(f"   ID: {result['uniqueId']}")
        print(f"   Name: {result['name']}")
        print(f"   Difficulty: {result['difficulty']}")
        print(f"   Tags: {result['tags']}")
        print(f"   Statement preserved LaTeX: {'$' in result['statement']}")
        print(f"   Solution included: {'solutionReveal' in result}")
    else:
        print("❌ Problem conversion failed")
    print()


def test_mixed_content():
    """Test content with both LaTeX and Asymptote."""
    content = """
The triangle $\\triangle ABC$ with vertices at $A=(0,0)$, $B=(4,0)$, $C=(2,3)$ is shown:

[asy]
pair A=(0,0), B=(4,0), C=(2,3);
draw(A--B--C--cycle);
dot(A); dot(B); dot(C);
label("$A$", A, SW);
label("$B$", B, SE);
label("$C$", C, N);
[/asy]

The area is given by: $$\\text{Area} = \\frac{1}{2} |base \\times height| = \\frac{1}{2} \\cdot 4 \\cdot 3 = 6$$
"""
    
    print("Testing mixed LaTeX and Asymptote content...")
    result = LatexProcessor.process_content(content)
    
    has_latex = '$' in result
    has_asy = '[asy]' in result and '[/asy]' in result
    
    status_latex = "✅" if has_latex else "❌"
    status_asy = "✅" if has_asy else "❌"
    
    print(f"{status_latex} LaTeX expressions preserved")
    print(f"{status_asy} Asymptote blocks preserved")
    print()


if __name__ == "__main__":
    print("=" * 60)
    print("LaTeX and Asymptote Processing Test Suite")
    print("=" * 60)
    print()
    
    test_latex_processing()
    test_asymptote_processing()
    test_problem_conversion()
    test_mixed_content()
    
    print("=" * 60)
    print("Tests complete! Ready to convert AIME problems.")
    print("=" * 60)
    print()
    print("Run conversion with:")
    print("  python py/convert_aime_csv_with_latex.py")
    print()

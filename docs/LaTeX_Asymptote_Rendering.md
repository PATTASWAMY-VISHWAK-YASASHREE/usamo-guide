# LaTeX and Asymptote Rendering System for Problems

This document explains how full LaTeX and Asymptote support is integrated into the problems.json loading system on the USAMO Guide.

## Overview

The problems.json system provides comprehensive support for:
- **Inline LaTeX** using single dollar signs: `$x^2 + y^2 = z^2$`
- **Display LaTeX** using double dollar signs: `$$\int_0^1 x^2 dx$$`
- **Asymptote diagrams** using code blocks: `[asy]...[/asy]`
- **Standard markdown** for formatting and text

## Architecture

### 1. CSV to JSON Conversion Pipeline

**File**: `py/convert_aime_csv_with_latex.py`

This Python script converts AIME problems from CSV format to the site's `problems.json` format with full LaTeX and Asymptote support.

#### LaTeX Processing

The `LatexProcessor` class ensures:
- LaTeX expressions in `$...$` and `$$...$$` format are preserved
- Asymptote blocks in `[asy]...[/asy]` format are normalized
- Proper spacing and formatting for markdown rendering

```python
# Example: LaTeX is preserved as-is
"statement": "Find $x$ such that $x^2 + 1 = 0$ where $x$ is complex.",

# Example: Display math
"statement": "Prove that $$\\sum_{i=1}^n i = \\frac{n(n+1)}{2}$$"
```

#### Asymptote Processing

Asymptote diagrams are automatically extracted and formatted:

```python
# Input in CSV
"statement": "... as shown. $[asy] pair A=(0,0), B=(1,0); draw(A--B); [/asy]$"

# Output in JSON (preserved exactly as [asy]...[/asy])
"statement": "... as shown.\n\n[asy]\npair A=(0,0), B=(1,0);\ndraw(A--B);\n[/asy]\n\n"
```

### 2. Frontend Rendering Pipeline

#### Step 1: Asymptote Preprocessing
**File**: `src/mdx-plugins/preprocess-asy.js`

Converts `[asy]...[/asy]` blocks to JSX components:
```javascript
[asy]
pair A=(0,0), B=(1,0);
draw(A--B);
[/asy]
```
↓
```jsx
<AsyDiagram code={"pair A=(0,0), B=(1,0);\ndraw(A--B);"} />
```

#### Step 2: SafeMarkdownRenderer
**File**: `src/components/markdown/SafeMarkdownRenderer.tsx`

Renders the preprocessed markdown with:
- Sanitized HTML
- Standard markdown formatting
- LaTeX support via KaTeX

#### Step 3: KaTeX LaTeX Rendering
**File**: `gatsby-browser.tsx`

KaTeX renders all LaTeX expressions:
- Inline math: `$...$` → rendered equation
- Display math: `$$...$$` → rendered equation on its own line

### 3. AsyDiagram Component
**File**: `src/components/markdown/MDXComponents.tsx`

Displays Asymptote source code in a formatted code block:
- Syntax-highlighted with `language-asy`
- Copy-button for easy sharing
- Dark mode support

## Usage Guide

### Converting AIME CSV to Problems JSON

```bash
cd /path/to/usamo-guide

# Run the conversion script
python py/convert_aime_csv_with_latex.py \
    --input py/AIME_Problems_1983_to_2024.csv \
    --output content/problemBank/AIME.problems.json
```

The script will:
1. ✅ Parse all AIME problems from the CSV
2. ✅ Preserve all LaTeX expressions
3. ✅ Extract and format Asymptote diagrams  
4. ✅ Generate difficulty ratings and tags
5. ✅ Format multiple solutions into markdown
6. ✅ Create a properly structured problems.json file

### Writing Problems with LaTeX and Asymptote

In `problems.json`, the `statement` and solution fields support:

**Inline Math**:
```markdown
The equation $x^2 + y^2 = z^2$ is known as the Pythagorean theorem.
```

**Display Math**:
```markdown
Consider the integral:

$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$

This is a fundamental result in calculus.
```

**Asymptote Diagrams**:
```markdown
The diagram shows a triangle:

[asy]
pair A=(0,0), B=(4,0), C=(2,3);
draw(A--B--C--cycle);
dot(A); dot(B); dot(C);
label("$A$", A, SW);
label("$B$", B, SE);
label("$C$", C, N);
[/asy]

Notice that the triangle has...
```

**Mixed Content**:
```markdown
## Problem

Find the value of $\sin^2(\theta) + \cos^2(\theta)$ where $\theta$ satisfies:

$$2\theta = \frac{\pi}{3}$$

[asy]
import graph;
// Asymptote code for a unit circle
...
[/asy]

The answer is **1**.
```

### Using ProblemMarkdownRenderer Component

In React components, use the `ProblemMarkdownRenderer` to render problem content:

```tsx
import ProblemMarkdownRenderer from './components/markdown/ProblemMarkdownRenderer';

export function MyProblemComponent({ problemStatement }: { problemStatement: string }) {
  return (
    <ProblemMarkdownRenderer 
      content={problemStatement}
      className="prose prose-sm"
    />
  );
}
```

## LaTeX Support

### Supported LaTeX Commands

All standard KaTeX commands are supported, including:

**Math Environments**:
- `$...$` - Inline math
- `$$...$$` - Display math
- `\begin{align*}...\end{align*}` - Aligned equations
- `\begin{matrix}...\end{matrix}` - Matrices

**Common Commands**:
- `\frac{a}{b}` - Fractions
- `x^n` - Superscripts
- `x_i` - Subscripts
- `\sqrt{x}` - Square roots
- `\int` - Integrals
- `\sum` - Summations
- `\boxed{x}` - Boxed expressions
- `\text{words}` - Text in math mode
- `\mathbb{R}, \mathbb{Q}, \mathbb{Z}, \mathbb{N}` - Number sets
- `\left(`, `\right)` - Scalable parentheses

**Trigonometric**:
- `\sin`, `\cos`, `\tan`, `\cot`, `\sec`, `\csc`
- `\arcsin`, `\arccos`, `\arctan`

**Logic & Sets**:
- `\forall`, `\exists`, `\in`, `\notin`, `\subset`, `\cap`, `\cup`
- `\neg`, `\wedge`, `\vee`, `\Rightarrow`, `\Leftrightarrow`

**Combinatorics**:
- `\binom{n}{k}` - Binomial coefficients
- `n!` - Factorials
- `^nP_r`, `^nC_r` - Permutations and combinations

### LaTeX Best Practices

1. **Use single dollar signs for inline math**:
   ✅ `The solution is $x = 5$.`
   ❌ `The solution is $$x = 5$$.`

2. **Use double dollar signs for display math**:
   ```markdown
   $$\sum_{i=1}^n i = \frac{n(n+1)}{2}$$
   ```

3. **Escape special characters in text**:
   ✅ `The set \{1, 2, 3\} contains three elements.`
   ❌ `The set {1, 2, 3} contains three elements.`

4. **Use proper math mode for mathematical content**:
   ✅ `The variable $x$ equals 5.`
   ❌ `The variable x equals 5.`

## Asymptote Support

### Asymptote Block Format

Asymptote diagrams are included using `[asy]` blocks:

```markdown
[asy]
// Your Asymptote code here
pair A = (0, 0);
pair B = (1, 0);
draw(A -- B);
[/asy]
```

### Common Asymptote Imports

These standard imports are available:
- `import geometry;` - Geometry functions
- `import graph;` - Graph drawing
- `import markers;` - Special markers
- `import fontsize;` - Font control
- `import olympiad;` - Olympiad-specific functions
- `import math;` - Mathematical functions

### Asymptote Best Practices

1. **Keep diagrams reasonably sized**:
   ```asy
   size(250);  // Set diagram size in points
   ```

2. **Use labels with math mode**:
   ```asy
   label("$A$", A, N);  // Label point A with the letter $A$ above
   ```

3. **Make diagrams readable**:
   ```asy
   defaultpen(linewidth(0.7) + fontsize(10));
   ```

4. **Include proper spacing**:
   ```asy
   // Comment your code for clarity
   pair A = (0, 0);  // Origin
   pair B = (1, 0);  // Point on x-axis
   ```

## File Structure

```
content/
├── problemBank/
│   └── AIME.problems.json      ← Generated by conversion script
├── 1_Foundations/
│   └── *.problems.json         ← Manual problem files
├── 2_Intermediate/
│   └── *.problems.json
└── 3_Advanced/
    └── *.problems.json

py/
├── AIME_Problems_1983_to_2024.csv              ← Source data
├── convert_aime_csv_with_latex.py              ← Conversion script
└── csv_to_problems_json.py                     ← Original converter

src/
├── mdx-plugins/
│   └── preprocess-asy.js                       ← Asymptote preprocessing
├── components/
│   └── markdown/
│       ├── ProblemMarkdownRenderer.tsx          ← New! Problem renderer
│       ├── MDXComponents.tsx                    ← AsyDiagram component
│       ├── SafeMarkdownRenderer.tsx             ← Markdown rendering
│       └── MDXComponents.tsx
└── gatsby-browser.tsx                          ← KaTeX initialization
```

## Troubleshooting

### LaTeX Not Rendering

1. **Check syntax**: Verify that `$` signs are properly paired
   - Inline math: `$...$`
   - Display math: `$$...$$`

2. **Escaped characters**: Some characters need escaping in JSON
   - Use `\\` for backslashes in strings
   - Use `\"` for quote characters

3. **Special characters**: Common issues:
   - Braces in LaTeX: `$\\{x : x > 0\\}$` (escaped)
   - Dollar sign literal: Use `\\$` or `\$`

### Asymptote Diagrams Not Showing

1. **Block format**: Ensure `[asy]` and `[/asy]` are on separate lines
2. **Indentation**: Remove extra indentation inside the block
3. **Valid Asymptote**: Test code in Asymptote IDE before including

### Mixed Content Issues

1. **Overlapping delimiters**: Don't nest `[asy]` blocks in LaTeX
   ```markdown
   ❌ $$[asy]...[/asy]$$
   ✅ Some text in LaTeX: $x=5$
      [asy]...[/asy]
   ```

2. **Spacing**: Add blank lines between different content types
   ```markdown
   ✅ Text with math: $x = 5$
      
      [asy]
      diagram code
      [/asy]
   ```

## Configuration

### KaTeX Options

KaTeX rendering is configured in `gatsby-browser.tsx`. To modify rendering options:

```tsx
// In gatsby-browser.tsx
import 'katex/dist/katex.min.css';

// KaTeX is automatically applied to [data-latex] attributes
```

### Asymptote Processing

Asymptote preprocessing is configured in `gatsby-node.ts`:

```typescript
// Plugins automatically include preprocess-asy.js
```

## Examples

### Example 1: Polynomial Problem with Asymptote Diagram

```json
{
  "uniqueId": "example-poly-1",
  "name": "Polynomial with Graph",
  "statement": "Let $p(x) = x^3 - 2x^2 + x$. Find $p(2)$.\n\nThe graph of $p$ is shown below:\n\n[asy]\nimport graph;\nsize(250);\nreal f(real x) { return x^3 - 2*x^2 + x; }\ndraw(graph(f,-0.5,2.5),linewidth(1.5));\nxaxis(\"$x$\",BottomTop,LeftTicks);\nyaxis(\"$y$\",LeftRight,RightTicks);\n[/asy]",
  "statement": "Verify: $p(2) = 2^3 - 2(2^2) + 2 = 8 - 8 + 2 = 2$.",
  "solutionReveal": {
    "mode": "inline",
    "markdown": "## Solution\n\nSubstitute $x = 2$:\n\n$$p(2) = (2)^3 - 2(2)^2 + 2 = 8 - 8 + 2 = 2$$\n\nTherefore, $p(2) = 2$."
  }
}
```

### Example 2: Geometry with LaTeX

```json
{
  "uniqueId": "example-geom-1",
  "name": "Triangle Angle Sum",
  "statement": "In triangle $\\triangle ABC$, we have $\\angle A = 45°$, $\\angle B = 60°$. Find $\\angle C$.",
  "solutionReveal": {
    "mode": "inline",
    "markdown": "## Solution\n\nBy the angle sum property of triangles:\n\n$$\\angle A + \\angle B + \\angle C = 180°$$\n\nSubstituting the known values:\n\n$$45° + 60° + \\angle C = 180°$$\n\n$$\\angle C = 180° - 105° = 75°$$"
  }
}
```

### Example 3: Complex Problem with Everything

```json
{
  "uniqueId": "example-complex-1",
  "name": "Circle and Ellipse Intersection",
  "statement": "The circle $x^2 + y^2 = 25$ and the ellipse $\\frac{x^2}{16} + \\frac{y^2}{9} = 1$ intersect at points $P$ and $Q$. Find the distance $|PQ|$.\n\n[asy]\nimport graph;\nsize(300);\ndraw(circle((0,0),5),blue);\ndraw(ellipse((0,0),4,3),red);\nxaxis(\"$x$\",BottomTop,LeftTicks);\nyaxis(\"$y$\",LeftRight,RightTicks);\nlabel(\"Circle: $x^2+y^2=25$\",(-5,-6),blue);\nlabel(\"Ellipse: $\\\\frac{x^2}{16}+\\\\frac{y^2}{9}=1$\",(5,3),red);\n[/asy]",
  "solutionReveal": {
    "mode": "inline",
    "markdown": "## Solution\n\nThe intersection points satisfy both equations:\n\n$$x^2 + y^2 = 25$$\n$$\\frac{x^2}{16} + \\frac{y^2}{9} = 1$$\n\n[Full solution continues...]\n\nThe distance is $|PQ| = 6$."
  }
}
```

## Performance Considerations

1. **Large Asymptote blocks**: Keep diagrams reasonably complex
   - Very complex Asymptote code may slow down rendering
   - Consider splitting large diagrams

2. **Many LaTeX expressions**: Normal document performance is fine
   - KaTeX is efficient at rendering math
   - No special optimization needed

3. **Build time**: Conversion script performance
   - Processing 1000+ problems takes a few seconds
   - Consider parallel processing for very large datasets

## See Also

- [MDX Guide](./MDX_Guide.md) - General markdown and LaTeX syntax
- [Math Topic Template](./Math_Topic_Template.md) - Problem writing guidelines
- [Front End Documentation](./Front%20End%20Documentation.md) - Component architecture
- [Asymptote Documentation](https://www.asymptote.umd.edu/) - Asymptote language reference
- [KaTeX Documentation](https://katex.org/) - LaTeX rendering in the browser

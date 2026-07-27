import React, { useMemo } from 'react';
import preprocessAsyBlocks from '../../../mdx-plugins/preprocess-asy';
import SafeMarkdownRenderer from './SafeMarkdownRenderer';

interface ProblemMarkdownRendererProps {
  content: string;
  /** CSS class to apply to the wrapper */
  className?: string;
}

/**
 * ProblemMarkdownRenderer
 * 
 * Enhanced markdown renderer for problem content with full support for:
 * - LaTeX math expressions ($...$ for inline, $$...$$ for display)
 * - Asymptote diagrams [asy]...[/asy]
 * - Standard markdown formatting
 * 
 * This component preprocesses Asymptote blocks to convert them to React components,
 * while preserving all LaTeX expressions for KaTeX rendering.
 * 
 * @example
 * ```tsx
 * <ProblemMarkdownRenderer content={problemStatement} />
 * ```
 */
export const ProblemMarkdownRenderer: React.FC<ProblemMarkdownRendererProps> = ({
  content,
  className,
}) => {
  // Preprocess Asymptote blocks to convert [asy]...[/asy] to JSX components
  const processedContent = useMemo(() => {
    if (!content) return '';
    
    try {
      return preprocessAsyBlocks(content);
    } catch (error) {
      console.error('Error preprocessing Asymptote blocks:', error);
      return content;
    }
  }, [content]);

  return (
    <div className={className}>
      <SafeMarkdownRenderer>{processedContent}</SafeMarkdownRenderer>
    </div>
  );
};

export default ProblemMarkdownRenderer;

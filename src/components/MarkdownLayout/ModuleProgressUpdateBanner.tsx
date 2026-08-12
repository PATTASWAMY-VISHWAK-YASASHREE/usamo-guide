import * as React from 'react';
import { useMarkdownLayout } from '../../context/MarkdownLayoutContext';
import { ModuleInfo } from '../../models/module';
import { ClientOnly } from '../ClientOnly';
import TextTooltip from '../Tooltip/TextTooltip';
import MarkCompleteButton from './MarkCompleteButton';

export default function ModuleProgressUpdateBanner() {
  const {
    markdownLayoutInfo: markdownData,
    handleCompletionChange,
    moduleProgress,
  } = useMarkdownLayout();

  if (markdownData instanceof ModuleInfo) {
    return (
      <h3 className="mb-8 flex items-center justify-center border-t border-b py-8 text-center text-lg leading-6 font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
        <span>
          <TextTooltip content="You can use this as a way to track your progress throughout this guide.">
            Module Progress
          </TextTooltip>
          :
        </span>
        <span className="ml-4">
          <ClientOnly>
            <MarkCompleteButton
              onChange={handleCompletionChange}
              state={moduleProgress}
              dropdownAbove
            />
          </ClientOnly>
        </span>
      </h3>
    );
  }
  return null;
}

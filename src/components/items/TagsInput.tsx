'use client';

import { useState, KeyboardEvent } from 'react';
import { Badge, Input } from '@/components/ui';

interface TagsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function TagsInput({ value, onChange }: TagsInputProps) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      // Remove last tag on backspace if input is empty
      onChange(value.slice(0, -1));
    }
  };

  const addTag = () => {
    const tag = input.trim().toLowerCase();
    if (tag && !value.includes(tag) && value.length < 20) {
      onChange([...value, tag]);
      setInput('');
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {value.map((tag) => (
          <Badge key={tag} variant="default" className="gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </Badge>
        ))}
      </div>

      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder="Type a tag and press Enter..."
        disabled={value.length >= 20}
      />

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Press Enter or comma to add a tag. {value.length}/20 tags used.
      </p>
    </div>
  );
}

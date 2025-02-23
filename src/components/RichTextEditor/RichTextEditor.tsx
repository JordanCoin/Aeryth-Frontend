import React, { useCallback, useMemo } from 'react';
import { createEditor, Descendant, Editor } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { logger } from '../../utils/logger';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onMention?: (mention: string) => void;
  onTag?: (tag: string) => void;
  placeholder?: string;
  suggestions?: {
    mentions: string[];
    tags: string[];
  };
}

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  onMention,
  onTag,
  placeholder = 'Start typing...',
  suggestions,
}) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      const content = newValue
        .map(n => Editor.string(editor, [editor.children.indexOf(n)]))
        .join('\n');

      onChange(content);

      // Handle mentions and tags
      const text = content.toLowerCase();
      const words = text.split(/\s+/);

      words.forEach(word => {
        if (word.startsWith('@') && onMention) {
          onMention(word.slice(1));
          logger.info('Mention detected', { mention: word });
        }
        if (word.startsWith('#') && onTag) {
          onTag(word.slice(1));
          logger.info('Tag detected', { tag: word });
        }
      });
    },
    [editor, onChange, onMention, onTag]
  );

  return (
    <div className="w-full border rounded-lg shadow-sm">
      <Slate editor={editor} value={initialValue} onChange={handleChange}>
        <Editable
          className="min-h-[200px] p-4 focus:outline-none"
          placeholder={placeholder}
          onKeyDown={event => {
            if (event.key === 'Tab') {
              event.preventDefault();
              editor.insertText('    ');
            }
          }}
        />
      </Slate>
    </div>
  );
};

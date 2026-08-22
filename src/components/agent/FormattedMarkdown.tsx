import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

export function FormattedMarkdown({ content, className = '' }: FormattedMarkdownProps) {
  if (!content) return null;

  // Split text by code blocks first
  const blocks = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`space-y-2 text-sm leading-relaxed ${className}`}>
      {blocks.map((block, index) => {
        if (block.startsWith('```') && block.endsWith('```')) {
          const lines = block.slice(3, -3).trim().split('\n');
          let language = '';
          if (lines.length > 0 && !lines[0].includes(' ') && lines[0].length < 15) {
            language = lines.shift() || '';
          }
          const codeContent = lines.join('\n');

          return (
            <CodeBlock key={index} language={language} codeContent={codeContent} />
          );
        }

        // Process standard text lines
        const lines = block.split('\n');
        return lines.map((line, lIdx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={`${index}-${lIdx}`} className="h-2" />;
          }

          // Horizontal divider lines (e.g. ---, ***, ___)
          if (/^---+$|^===$|^\*\*\*+$|^___+$/.test(trimmed)) {
            return <hr key={`${index}-${lIdx}`} className="my-4 border-t border-muted-foreground/30" />;
          }

          // Headings (####, ###, ##, #)
          if (trimmed.startsWith('###### ')) {
            return (
              <h6 key={`${index}-${lIdx}`} className="text-xs font-bold text-muted-foreground mt-2 mb-1 uppercase tracking-wider">
                {parseInlineFormatting(trimmed.replace(/^######\s+/, ''))}
              </h6>
            );
          }
          if (trimmed.startsWith('##### ')) {
            return (
              <h6 key={`${index}-${lIdx}`} className="text-xs font-bold text-primary mt-2 mb-1 uppercase tracking-wider">
                {parseInlineFormatting(trimmed.replace(/^#####\s+/, ''))}
              </h6>
            );
          }
          if (trimmed.startsWith('#### ')) {
            return (
              <h5 key={`${index}-${lIdx}`} className="text-sm font-bold text-primary mt-3 mb-1 uppercase tracking-wide">
                {parseInlineFormatting(trimmed.replace(/^####\s+/, ''))}
              </h5>
            );
          }
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={`${index}-${lIdx}`} className="text-base font-bold text-foreground mt-3 mb-1">
                {parseInlineFormatting(trimmed.replace(/^###\s+/, ''))}
              </h4>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={`${index}-${lIdx}`} className="text-lg font-bold text-foreground mt-4 mb-2 border-b border-muted/30 pb-1">
                {parseInlineFormatting(trimmed.replace(/^##\s+/, ''))}
              </h3>
            );
          }
          if (trimmed.startsWith('# ')) {
            return (
              <h2 key={`${index}-${lIdx}`} className="text-xl font-bold text-foreground mt-4 mb-2 border-b border-primary/30 pb-1">
                {parseInlineFormatting(trimmed.replace(/^#\s+/, ''))}
              </h2>
            );
          }

          // Lists (bullets or numbers)
          if (/^(\*|-|\d+\.)\s+/.test(trimmed)) {
            const listContent = trimmed.replace(/^(\*|-|\d+\.)\s+/, '');
            const isNumbered = /^\d+\./.test(trimmed);
            const numberMatch = trimmed.match(/^(\d+)\./);

            return (
              <div key={`${index}-${lIdx}`} className="flex items-start gap-2.5 my-1 ml-2">
                {isNumbered ? (
                  <span className="text-xs font-bold text-primary shrink-0 mt-0.5">{numberMatch ? numberMatch[1] : '•'}.</span>
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" />
                )}
                <div className="flex-1 text-foreground/90">{parseInlineFormatting(listContent)}</div>
              </div>
            );
          }

          // Standard paragraph line
          return (
            <p key={`${index}-${lIdx}`} className="my-1 text-foreground/90">
              {parseInlineFormatting(line)}
            </p>
          );
        });
      })}
    </div>
  );
}

function CodeBlock({ language, codeContent }: { language: string; codeContent: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl bg-slate-950/90 border border-primary/20 p-4 font-mono text-xs overflow-x-auto text-blue-300 relative group shadow-md">
      <div className="flex items-center justify-between mb-2 border-b border-white/10 pb-2">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/15 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          title="Copy code"
          type="button"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-400" />
              <span className="text-green-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="whitespace-pre overflow-x-auto pt-1">
        <code>{codeContent}</code>
      </pre>
    </div>
  );
}

function parseInlineFormatting(text: string): React.ReactNode {
  // Regex to split by bold (**text**), inline code (`code`), and italics (*text*)
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={i} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary border border-muted-foreground/20">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return <em key={i} className="italic text-muted-foreground">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

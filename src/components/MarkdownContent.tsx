import { useMemo } from 'react';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeLink(url: string) {
  const normalized = url.trim();
  if (/^(https?:\/\/|mailto:)/i.test(normalized)) {
    return normalized;
  }
  return null;
}

function renderInlineMarkdown(value: string) {
  let output = escapeHtml(value);
  const placeholders: string[] = [];

  const store = (html: string) => {
    const token = `__MD_TOKEN_${placeholders.length}__`;
    placeholders.push(html);
    return token;
  };

  output = output.replace(/`([^`]+)`/g, (_match, code: string) => {
    return store(
      `<code class="rounded bg-[var(--color-surface-alt)] px-1.5 py-0.5 text-[0.92em] text-[var(--color-text)]">${code}</code>`
    );
  });

  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, link: string) => {
    const href = sanitizeLink(link);
    if (!href) return label;

    return store(
      `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="text-[var(--color-accent)] underline-offset-2 hover:underline">${label}</a>`
    );
  });

  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  for (let index = 0; index < placeholders.length; index += 1) {
    output = output.replace(`__MD_TOKEN_${index}__`, placeholders[index]);
  }

  return output;
}

function markdownToHtml(markdown: string) {
  const normalized = markdown.replace(/\r\n?/g, '\n').trim();
  if (!normalized) return '';

  const lines = normalized.split('\n');
  const blocks: string[] = [];
  let index = 0;

  const isListItem = (line: string) => /^[-*]\s+/.test(line.trim());
  const isOrderedListItem = (line: string) => /^\d+\.\s+/.test(line.trim());
  const isHeading = (line: string) => /^#{1,6}\s+/.test(line.trim());
  const isCodeFence = (line: string) => line.trim().startsWith('```');
  const isBlockStarter = (line: string) =>
    isListItem(line) || isOrderedListItem(line) || isHeading(line) || isCodeFence(line);

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (isCodeFence(line)) {
      index += 1;
      const codeLines: string[] = [];

      while (index < lines.length && !isCodeFence(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length && isCodeFence(lines[index])) {
        index += 1;
      }

      blocks.push(
        `<pre class="mb-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-100"><code>${escapeHtml(
          codeLines.join('\n')
        )}</code></pre>`
      );
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const headingClasses: Record<number, string> = {
        1: 'text-3xl text-[var(--color-primary)] mt-6 mb-3',
        2: 'text-2xl text-[var(--color-primary)] mt-6 mb-3',
        3: 'text-xl text-[var(--color-primary)] mt-5 mb-2',
        4: 'text-lg text-[var(--color-primary)] mt-4 mb-2',
        5: 'text-base text-[var(--color-primary)] mt-4 mb-2',
        6: 'text-sm text-[var(--color-primary)] mt-4 mb-2',
      };
      blocks.push(
        `<h${level} class="${headingClasses[level] ?? headingClasses[6]}">${renderInlineMarkdown(
          heading[2]
        )}</h${level}>`
      );
      index += 1;
      continue;
    }

    if (isListItem(line)) {
      const items: string[] = [];
      while (index < lines.length && isListItem(lines[index])) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''));
        index += 1;
      }

      blocks.push(
        `<ul class="mb-4 list-disc pl-5 space-y-1 text-[var(--color-text-muted)]">${items
          .map((item) => `<li>${renderInlineMarkdown(item)}</li>`)
          .join('')}</ul>`
      );
      continue;
    }

    if (isOrderedListItem(line)) {
      const items: string[] = [];
      while (index < lines.length && isOrderedListItem(lines[index])) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ''));
        index += 1;
      }

      blocks.push(
        `<ol class="mb-4 list-decimal pl-5 space-y-1 text-[var(--color-text-muted)]">${items
          .map((item) => `<li>${renderInlineMarkdown(item)}</li>`)
          .join('')}</ol>`
      );
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const next = lines[index];
      const nextTrimmed = next.trim();
      if (!nextTrimmed || isBlockStarter(next)) break;
      paragraphLines.push(nextTrimmed);
      index += 1;
    }

    if (paragraphLines.length > 0) {
      blocks.push(
        `<p class="mb-4 leading-relaxed text-[var(--color-text-muted)]">${paragraphLines
          .map((paragraphLine) => renderInlineMarkdown(paragraphLine))
          .join('<br />')}</p>`
      );
      continue;
    }

    index += 1;
  }

  return blocks.join('');
}

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const html = useMemo(() => markdownToHtml(content), [content]);

  if (!html) {
    return null;
  }

  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

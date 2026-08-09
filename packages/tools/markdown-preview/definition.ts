import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'markdown-preview',
  name: 'Markdown Preview',
  description:
    'Render a Markdown subset: h1-h3 headings (#, ##, ###), bold (**text**), italic (*text*), inline code (`code`), fenced code blocks (```), links ([text](url)), unordered lists (- / *), ordered lists (1. / 2.), blockquotes (>), horizontal rules (---), and paragraphs. Other syntax (tables, images, nested lists, raw HTML) renders as literal text.',
  category: 'text',
  keywords: ['markdown', 'preview', 'render', 'html', 'md'],
} satisfies ToolDefinition

import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'word-frequency',
  name: 'Word Frequency',
  description:
    'Count word frequencies in text. Words are runs of Unicode letters and numbers (\\p{L}\\p{N}) split by whitespace, punctuation, and symbols — a naive tokenizer, not morphological analysis. Text without spaces (e.g. Japanese) is counted as a single token.',
  category: 'text',
  keywords: ['word', 'frequency', 'count', 'text', 'analyze', 'histogram'],
} satisfies ToolDefinition

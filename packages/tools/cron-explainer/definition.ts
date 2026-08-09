import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'cron-explainer',
  name: 'Cron Explainer',
  description: 'Explain a cron expression and compute upcoming run times',
  category: 'date-time',
  keywords: ['cron', 'crontab', 'schedule', 'explain', 'next run'],
} satisfies ToolDefinition

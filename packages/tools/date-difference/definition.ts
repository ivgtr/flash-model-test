import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'date-difference',
  name: 'Date Difference',
  description: 'Calculate the calendar and total time difference between two dates',
  category: 'date-time',
  keywords: ['date', 'time', 'difference', 'duration', 'interval', 'elapsed', 'days'],
} satisfies ToolDefinition

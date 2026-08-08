import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'byte-size-converter',
  name: 'Byte Size Converter',
  description:
    'Convert byte sizes between decimal (KB/MB/GB/TB) and binary (KiB/MiB/GiB/TiB) units',
  category: 'data',
  keywords: [
    'bytes',
    'size',
    'kilobyte',
    'megabyte',
    'gigabyte',
    'terabyte',
    'kibibyte',
    'mebibyte',
    'gibibyte',
    'tebibyte',
    'convert',
    'binary',
    'decimal',
  ],
} satisfies ToolDefinition

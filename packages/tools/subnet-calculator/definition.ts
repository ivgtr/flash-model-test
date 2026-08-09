import type { ToolDefinition } from '@tool-forge/core'

export const definition = {
  id: 'subnet-calculator',
  name: 'Subnet Calculator',
  description: 'Calculate IPv4 subnet details from an IP address and a CIDR prefix or subnet mask',
  category: 'misc',
  keywords: ['ip', 'ipv4', 'subnet', 'cidr', 'mask', 'network', 'broadcast', 'wildcard'],
} satisfies ToolDefinition

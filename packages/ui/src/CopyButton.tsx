import { useState } from 'react'
import { Button } from './Button'

export interface CopyButtonProps {
  value: string
  label?: string
}

export function CopyButton({ value, label = 'Copy' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  return (
    <Button variant="secondary" onClick={handleClick} disabled={value === ''}>
      {copied ? 'Copied' : label}
    </Button>
  )
}

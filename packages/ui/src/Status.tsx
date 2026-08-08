import type { ReactNode } from 'react'
import styles from './Status.module.css'

export type StatusKind = 'error' | 'success' | 'info'

export interface StatusProps {
  kind: StatusKind
  children: ReactNode
}

export function Status({ kind, children }: StatusProps) {
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={styles[kind]}>
      {children}
    </div>
  )
}

import type { ReactNode } from 'react'
import styles from './ToolShell.module.css'

export function ToolShell({ children }: { children: ReactNode }) {
  return <main className={styles.shell}>{children}</main>
}

import type { ReactNode } from 'react'
import styles from './ActionArea.module.css'

export function ActionArea({ children }: { children: ReactNode }) {
  return <div className={styles.area}>{children}</div>
}

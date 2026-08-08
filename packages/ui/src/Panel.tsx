import type { ReactNode } from 'react'
import styles from './Panel.module.css'

export interface PanelProps {
  title: string
  actions?: ReactNode
  children: ReactNode
}

export function Panel({ title, actions, children }: PanelProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.heading}>
        <h2 className={styles.title}>{title}</h2>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}

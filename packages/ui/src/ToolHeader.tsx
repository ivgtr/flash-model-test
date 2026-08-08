import { CATEGORY_LABELS, type ToolCategory } from '@tool-forge/core'
import styles from './ToolHeader.module.css'

export interface ToolHeaderProps {
  name: string
  description: string
  category: ToolCategory
}

export function ToolHeader({ name, description, category }: ToolHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.titleRow}>
        <h1 className={styles.name}>{name}</h1>
        <span className={styles.category}>{CATEGORY_LABELS[category]}</span>
      </div>
      <p className={styles.description}>{description}</p>
    </header>
  )
}

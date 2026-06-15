import type { ReactNode } from 'react'

interface GrandTestFormSectionProps {
  title: string
  description?: string
  children: ReactNode
}

export function GrandTestFormSection({
  title,
  description,
  children,
}: GrandTestFormSectionProps) {
  return (
    <section className="rounded-xl border border-border-subtle bg-surface-container-low p-4">
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="text-card-title text-on-surface">{title}</h3>
        {description ? (
          <p className="text-body-md text-on-surface-variant">{description}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-gutter">{children}</div>
    </section>
  )
}

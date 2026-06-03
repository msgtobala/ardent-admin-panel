interface PagePlaceholderProps {
  title: string
  description?: string
}

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-white p-gutter shadow-tier-1">
      <h1 className="mb-2 text-section-title text-on-surface">{title}</h1>
      <p className="text-body-md text-on-surface-variant">
        {description ?? 'Content coming soon.'}
      </p>
    </div>
  )
}

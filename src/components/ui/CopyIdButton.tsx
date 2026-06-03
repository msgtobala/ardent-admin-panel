import { useState } from 'react'
import { copyToClipboard } from '@/lib/copy-to-clipboard'
import { MaterialIcon } from './MaterialIcon'

interface CopyIdButtonProps {
  value: string
  ariaLabel: string
}

const buttonClassName =
  'cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

export function CopyIdButton({ value, ariaLabel }: CopyIdButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const didCopy = await copyToClipboard(value)
    if (!didCopy) return

    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      aria-label={copied ? `${ariaLabel} copied` : ariaLabel}
      onClick={handleCopy}
      className={buttonClassName}
    >
      <MaterialIcon
        name={copied ? 'check' : 'content_copy'}
        size={16}
        className={copied ? 'text-success-green' : 'text-on-surface-variant'}
      />
    </button>
  )
}

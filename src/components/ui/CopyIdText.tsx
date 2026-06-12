import { copyToClipboard } from '@/lib/copy-to-clipboard'
import { useSnackbar } from '@/contexts/SnackbarContext'

const copyTextButtonClassName =
  'block w-full cursor-pointer truncate rounded-sm text-left text-body-md text-on-surface transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

interface CopyIdTextProps {
  label: string
  copyValue: string
  successMessage: string
}

export function CopyIdText({ label, copyValue, successMessage }: CopyIdTextProps) {
  const { showSnackbar } = useSnackbar()

  if (!copyValue) {
    return <span className="text-body-md text-on-surface">—</span>
  }

  async function handleCopy() {
    const didCopy = await copyToClipboard(copyValue)
    if (!didCopy) {
      showSnackbar('Unable to copy to clipboard')
      return
    }

    showSnackbar(successMessage)
  }

  return (
    <button
      type="button"
      aria-label={`Copy id ${copyValue}`}
      title="Click to copy id"
      onClick={handleCopy}
      className={copyTextButtonClassName}
    >
      {label || '—'}
    </button>
  )
}

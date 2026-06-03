import { copyToClipboard } from '@/lib/copy-to-clipboard'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { MaterialIcon } from './MaterialIcon'

interface CopyIdButtonProps {
  value: string
  ariaLabel: string
  successMessage?: string
}

const buttonClassName =
  'cursor-pointer rounded-lg p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

export function CopyIdButton({
  value,
  ariaLabel,
  successMessage = 'Copied to clipboard',
}: CopyIdButtonProps) {
  const { showSnackbar } = useSnackbar()

  async function handleCopy() {
    const didCopy = await copyToClipboard(value)
    if (!didCopy) {
      showSnackbar('Unable to copy to clipboard')
      return
    }

    showSnackbar(successMessage)
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={handleCopy}
      className={buttonClassName}
    >
      <MaterialIcon name="content_copy" size={16} className="text-on-surface-variant" />
    </button>
  )
}

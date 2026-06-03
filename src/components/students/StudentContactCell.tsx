import { copyToClipboard } from '@/lib/copy-to-clipboard'
import {
  getStudentContactCopyValue,
  getStudentContactValue,
  isPhoneAuthenticationMethod,
} from '@/lib/student-utils'
import type { Student } from '@/types/student'
import { useSnackbar } from '@/contexts/SnackbarContext'

interface StudentContactCellProps {
  student: Student
}

const copyButtonClassName =
  'block w-full cursor-pointer truncate rounded-sm text-left text-body-md text-text-black transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring'

export function StudentContactCell({ student }: StudentContactCellProps) {
  const { showSnackbar } = useSnackbar()
  const contactValue = getStudentContactValue(student)
  const copyValue = getStudentContactCopyValue(student)

  if (!copyValue) {
    return <span className="text-body-md text-text-black">—</span>
  }

  const isPhoneContact = isPhoneAuthenticationMethod(student.authenticationMethod)
  const contactLabel = isPhoneContact ? 'phone number' : 'email address'

  async function handleCopy() {
    if (!copyValue) return

    const didCopy = await copyToClipboard(copyValue)
    if (!didCopy) {
      showSnackbar('Unable to copy to clipboard')
      return
    }

    showSnackbar(
      isPhoneContact ? 'Phone number copied to clipboard' : 'Email copied to clipboard',
    )
  }

  return (
    <button
      type="button"
      aria-label={`Copy ${contactLabel} ${copyValue}`}
      onClick={handleCopy}
      className={copyButtonClassName}
    >
      {contactValue}
    </button>
  )
}

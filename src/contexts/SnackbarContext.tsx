import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

interface SnackbarContextValue {
  showSnackbar: (message: string) => void
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null)

const SNACKBAR_DURATION_MS = 3000

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timeoutRef = useRef<number | null>(null)

  const showSnackbar = useCallback((nextMessage: string) => {
    const trimmedMessage = nextMessage.trim()
    if (!trimmedMessage) return

    setMessage(trimmedMessage)

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = window.setTimeout(() => {
      setMessage(null)
      timeoutRef.current = null
    }, SNACKBAR_DURATION_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {message ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-100 flex max-w-[min(90vw,420px)] -translate-x-1/2 items-center gap-2 rounded-xl border border-border-subtle bg-inverse-surface px-4 py-3 shadow-tier-2"
        >
          <MaterialIcon
            name="check_circle"
            size={20}
            className="shrink-0 text-success-green"
          />
          <p className="text-body-md text-inverse-on-surface">{message}</p>
        </div>
      ) : null}
    </SnackbarContext.Provider>
  )
}

export function useSnackbar(): SnackbarContextValue {
  const context = useContext(SnackbarContext)
  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider')
  }

  return context
}

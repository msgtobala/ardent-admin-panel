import { onAuthStateChanged, type User } from 'firebase/auth'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { checkIsAdmin } from '../lib/auth-claims'
import { auth } from '../lib/firebase'

interface AuthContextValue {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!nextUser) {
        setUser(null)
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      const hasAdminClaim = await checkIsAdmin(nextUser)
      setUser(nextUser)
      setIsAdmin(hasAdminClaim)
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  const value = useMemo(
    () => ({ user, isAdmin, isLoading }),
    [user, isAdmin, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

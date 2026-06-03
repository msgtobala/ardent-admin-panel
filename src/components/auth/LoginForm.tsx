import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkIsAdmin, mapAuthError } from '../../lib/auth-claims'
import { auth } from '../../lib/firebase'
import { Button } from '../ui/Button'
import { PasswordField } from '../ui/PasswordField'
import { TextField } from '../ui/TextField'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>()
  const [passwordError, setPasswordError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate(): boolean {
    let valid = true
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setEmailError('Email address is required')
      valid = false
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setEmailError('Enter a valid email address')
      valid = false
    } else {
      setEmailError(undefined)
    }

    if (!password) {
      setPasswordError('Password is required')
      valid = false
    } else {
      setPasswordError(undefined)
    }

    return valid
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate()) return

    setFormError(undefined)
    setIsSubmitting(true)

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      )
      const hasAdminClaim = await checkIsAdmin(credential.user)

      if (!hasAdminClaim) {
        await signOut(auth)
        setFormError('You do not have admin access.')
        return
      }

      navigate('/dashboard')
    } catch (error) {
      const code =
        error instanceof Error && 'code' in error
          ? String((error as { code: string }).code)
          : 'unknown'
      setFormError(mapAuthError(code))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="flex w-full flex-col gap-6" onSubmit={handleSubmit} noValidate>
      <TextField
        id="email"
        label="Email Address"
        type="email"
        name="email"
        placeholder="email@ardent.com"
        autoComplete="email"
        value={email}
        disabled={isSubmitting}
        onChange={(e) => {
          setEmail(e.target.value)
          if (emailError) setEmailError(undefined)
          if (formError) setFormError(undefined)
        }}
        error={emailError}
      />
      <PasswordField
        id="password"
        label="Password"
        name="password"
        autoComplete="current-password"
        value={password}
        disabled={isSubmitting}
        onChange={(e) => {
          setPassword(e.target.value)
          if (passwordError) setPasswordError(undefined)
          if (formError) setFormError(undefined)
        }}
        error={passwordError}
      />
      {formError ? (
        <p className="text-label-sm text-error-red" role="alert">
          {formError}
        </p>
      ) : null}
      <Button type="submit" fullWidth disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  )
}

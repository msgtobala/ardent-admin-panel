import ardentLogo from '@/assets/ardent-logo.png'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-login-page-bg p-gutter">
      <div className="flex w-full max-w-[448px] flex-col gap-8 rounded-md border border-border-subtle bg-surface-white px-[33px] pb-[49px] pt-[33px] shadow-tier-1">
        <header className="flex flex-col items-center gap-2">
          <img
            src={ardentLogo}
            alt="Ardent"
            className="h-16 w-auto"
            width={81}
            height={64}
          />
          <h1 className="pt-4 text-center text-section-title text-on-surface">
            Admin Login
          </h1>
          <p className="text-center text-body-md text-on-surface-variant">
            Enter your credentials to access the Ardent management
            <br />
            console.
          </p>
        </header>
        <LoginForm />
      </div>
    </div>
  )
}

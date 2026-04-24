import { LoginBackground } from "./login-background"
import { LoginCard } from "./login-card"

export function LoginScene() {
  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center px-4 py-8">
      <LoginBackground />
      <div className="relative z-10">
        <LoginCard />
      </div>
    </div>
  )
}

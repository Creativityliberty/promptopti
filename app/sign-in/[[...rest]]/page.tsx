import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f5f2] p-4">
      <SignIn
        appearance={{
          elements: { card: "shadow-sm rounded-[20px]" },
        }}
      />
    </main>
  )
}

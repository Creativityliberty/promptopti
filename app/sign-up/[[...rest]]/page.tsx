import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f5f2] p-4">
      <SignUp
        appearance={{
          elements: { card: "shadow-sm rounded-[20px]" },
        }}
      />
    </main>
  )
}

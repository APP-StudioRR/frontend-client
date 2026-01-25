"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function WelcomePage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F3] px-6">
      <div className="mb-auto mt-32 w-full max-w-md text-center">
        <div className="mb-3 flex justify-center">
          <Image
            src="/images/logo.png"
            alt="Studio Regiane Rodrigues"
            width={200}
            height={200}
            className="h-auto w-48"
            priority
          />
        </div>
        <h1 className="mb-6 text-balance text-4xl font-bold leading-tight text-[#3A3A3A]">Boas - Vindas</h1>
      </div>

      <div className="mb-32 flex w-full max-w-md flex-col gap-4">
        <Button
          onClick={() => router.push("/cadastro")}
          className="h-14 rounded-full bg-[#6FB57F] text-lg font-medium text-white hover:bg-[#6FB57F]/90"
        >
          Criar Conta
        </Button>

        <button onClick={() => router.push("/login")} className="text-lg font-medium text-[#6FB57F] hover:underline">
          Entrar
        </button>
      </div>
    </div>
  )
}

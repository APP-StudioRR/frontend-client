"use client"

import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ConfirmationPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F3] px-6 pb-24">
      <div className="flex items-center justify-end py-6">
        <button onClick={() => router.push("/dashboard")} className="text-[#3A3A3A]">
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="mt-8 flex flex-1 flex-col items-center">
        <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-[#E8F4EA]">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#D4ECDB]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#6FB57F]">
              <Check className="h-10 w-10 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>

        <h1 className="mb-4 text-4xl font-bold text-[#3A3A3A]">Obrigado!</h1>
        <p className="mb-12 text-balance text-center text-base text-[#666666]">
          Recebemos seu comprovante. Logo iremos confirmar seu agendamento e você receberá uma notificação.
        </p>

        <div className="w-full rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-[#3A3A3A]">Resumo do Agendamento</h2>

          <div className="space-y-4">
            <div className="flex justify-between border-b border-[#F5F5F3] pb-4">
              <span className="text-[#666666]">Serviço</span>
              <span className="font-semibold text-[#3A3A3A]">Massagem Relaxante</span>
            </div>
            <div className="flex justify-between border-b border-[#F5F5F3] pb-4">
              <span className="text-[#666666]">Data e Hora</span>
              <span className="font-semibold text-[#3A3A3A]">25 de Outubro, 15:00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666666]">Profissional</span>
              <span className="font-semibold text-[#3A3A3A]">Roberta Rodrigues</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <Button
          onClick={() => router.push("/dashboard")}
          className="h-14 w-full rounded-full bg-[#6FB57F] text-lg font-medium text-white hover:bg-[#5fa46e]"
        >
          Voltar para o Início
        </Button>
      </div>
    </div>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Check, X, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { api } from "@/lib/api"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

function ConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get('appointment')
  const type = searchParams.get('type') // 'package' ou null
  const [appointment, setAppointment] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (appointmentId) {
      loadAppointment()
    } else {
      setLoading(false)
    }
  }, [appointmentId])

  const loadAppointment = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/client/appointments/${appointmentId}`)
      if (response.success && response.data) {
        setAppointment(response.data)
      }
    } catch (error: any) {
      console.error('Erro ao carregar agendamento:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "dd 'de' MMMM", { locale: ptBR })
  }

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F3] px-6">
        <Loader2 className="h-8 w-8 animate-spin text-[#6FB57F]" />
      </div>
    )
  }

  const isPackage = type === 'package' || appointment?.package

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
          {isPackage 
            ? "Suas sessões foram agendadas com sucesso! Você receberá notificações sobre cada agendamento."
            : "Recebemos seu comprovante. Logo iremos confirmar seu agendamento e você receberá uma notificação."
          }
        </p>

        {appointment && (
          <div className="w-full rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-[#3A3A3A]">Resumo do Agendamento</h2>

            <div className="space-y-4">
              <div className="flex justify-between border-b border-[#F5F5F3] pb-4">
                <span className="text-[#666666]">
                  {isPackage ? 'Pacote' : 'Serviço'}
                </span>
                <span className="font-semibold text-[#3A3A3A] text-right">
                  {appointment.service?.name || appointment.package?.name || 'Sessão'}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#F5F5F3] pb-4">
                <span className="text-[#666666]">Data e Hora</span>
                <span className="font-semibold text-[#3A3A3A]">
                  {formatDate(appointment.date)} às {formatTime(appointment.time)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">Profissional</span>
                <span className="font-semibold text-[#3A3A3A]">
                  {appointment.professional?.name || 'Não informado'}
                </span>
              </div>
              {isPackage && appointment.package && (
                <div className="flex justify-between border-t border-[#F5F5F3] pt-4">
                  <span className="text-[#666666]">Status do Pagamento</span>
                  <span className={`font-semibold ${
                    appointment.payment_status === 'pago' 
                      ? 'text-[#6FB57F]' 
                      : 'text-[#8B9E8B]'
                  }`}>
                    {appointment.payment_status === 'pago' ? 'Pago' : 'Pendente'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mb-8">
        <Button
          onClick={() => router.push("/sessoes")}
          className="h-14 w-full rounded-full bg-[#6FB57F] text-lg font-medium text-white hover:bg-[#5fa46e]"
        >
          Ver Minhas Sessões
        </Button>
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F3]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6FB57F]" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  )
}

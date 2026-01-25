"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, ChevronRight, MapPin, Clock, User, Loader2 } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import Image from "next/image"
import { api } from "@/lib/api"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Appointment {
  id: number
  date: string
  time: string
  status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado'
  payment_status: 'pendente' | 'pago'
  payment_method: string
  price: number
  notes?: string
  service: {
    id: number
    name: string
    duration: number
    image_url?: string
  }
  professional: {
    id: number
    name: string
    image_url?: string
  }
  package?: {
    id: number
    name: string
  }
}

function AppointmentDetailsContent() {
  const router = useRouter()
  const params = useParams()
  const appointmentId = params.id as string

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (appointmentId) {
      loadAppointment()
    }
  }, [appointmentId])

  const loadAppointment = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/client/appointments/${appointmentId}`)
      
      if (response.success && response.data) {
        setAppointment(response.data)
      } else {
        router.push('/sessoes')
      }
    } catch (error: any) {
      console.error('Erro ao carregar agendamento:', error)
      if (error.status === 401) {
        localStorage.removeItem('token')
        router.push('/login')
      } else {
        router.push('/sessoes')
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: {
        label: 'Pendente',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      },
      confirmado: {
        label: 'Confirmado',
        className: 'bg-green-100 text-green-700 border-green-200',
      },
      concluido: {
        label: 'Concluído',
        className: 'bg-blue-100 text-blue-700 border-blue-200',
      },
      cancelado: {
        label: 'Cancelado',
        className: 'bg-red-100 text-red-700 border-red-200',
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente

    return (
      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  const formatTime = (timeString: string) => {
    try {
      return timeString.substring(0, 5) // HH:mm
    } catch {
      return timeString
    }
  }

  const canReschedule = (dateString: string, timeString: string) => {
    try {
      const appointmentDateTime = new Date(`${dateString}T${timeString}`)
      const now = new Date()
      const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      return hoursUntilAppointment > 48 // Mais de 48 horas (2 dias)
    } catch {
      return false
    }
  }

  const getHoursUntilAppointment = (dateString: string, timeString: string) => {
    try {
      const appointmentDateTime = new Date(`${dateString}T${timeString}`)
      const now = new Date()
      const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      return Math.floor(hoursUntilAppointment)
    } catch {
      return 0
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F3]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6FB57F]" />
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F3] px-6">
        <h1 className="mb-4 text-2xl font-bold text-[#3A3A3A]">Agendamento não encontrado</h1>
        <Button
          onClick={() => router.push('/sessoes')}
          className="bg-[#6FB57F] text-white hover:bg-[#5fa46e]"
        >
          Voltar para Sessões
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F3] pb-24">
      <div className="flex items-center gap-4 px-6 py-6">
        <button onClick={() => router.back()} className="text-[#3A3A3A]">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-[#3A3A3A]">Detalhes do Agendamento</h1>
      </div>

      <div className="flex flex-col gap-4 px-6">
        {/* Card do Serviço */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="relative h-48 w-full">
            {appointment.service.image_url ? (
              <Image
                src={appointment.service.image_url}
                alt={appointment.service.name}
                fill
                className="object-cover"
                sizes="100vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#E8F4EA]">
                <Calendar className="h-16 w-16 text-[#6FB57F]" />
              </div>
            )}
          </div>
          <div className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#3A3A3A]">
                {appointment.service.name}
              </h2>
              {getStatusBadge(appointment.status)}
            </div>
            <div className="flex items-center gap-2 text-sm text-[#8B9E8B]">
              <Clock className="h-4 w-4" />
              <span>{appointment.service.duration} minutos</span>
            </div>
          </div>
        </div>

        {/* Data e Hora */}
        <div className="flex items-center gap-4 rounded-3xl bg-white p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#E8F4EA]">
            <Calendar className="h-7 w-7 text-[#6FB57F]" />
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-[#3A3A3A]">
              {formatDate(appointment.date)}
            </h3>
            <p className="text-sm text-[#8B9E8B]">{formatTime(appointment.time)}</p>
          </div>
        </div>

        {/* Profissional */}
        <div className="flex items-center gap-4 rounded-3xl bg-white p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#E8F4EA]">
            {appointment.professional.image_url ? (
              <div className="relative h-full w-full overflow-hidden rounded-xl">
                <Image
                  src={appointment.professional.image_url}
                  alt={appointment.professional.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            ) : (
              <User className="h-7 w-7 text-[#6FB57F]" />
            )}
          </div>
          <div>
            <p className="text-sm text-[#8B9E8B]">Profissional</p>
            <span className="font-semibold text-[#3A3A3A]">{appointment.professional.name}</span>
          </div>
        </div>

        {/* Pacote (se houver) */}
        {appointment.package && (
          <div className="flex items-center gap-4 rounded-3xl bg-white p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#E8F4EA]">
              <Calendar className="h-7 w-7 text-[#6FB57F]" />
            </div>
            <div>
              <p className="text-sm text-[#8B9E8B]">Pacote</p>
              <span className="font-semibold text-[#3A3A3A]">{appointment.package.name}</span>
            </div>
          </div>
        )}

        {/* Pagamento */}
        <div className="rounded-3xl bg-white p-5">
          <h3 className="mb-3 font-semibold text-[#3A3A3A]">Informações de Pagamento</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[#8B9E8B]">Valor</span>
              <span className="font-semibold text-[#3A3A3A]">€{parseFloat(appointment.price.toString()).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8B9E8B]">Método</span>
              <span className="font-semibold text-[#3A3A3A]">{appointment.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8B9E8B]">Status</span>
              <span className={`font-semibold ${
                appointment.payment_status === 'pago' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {appointment.payment_status === 'pago' ? 'Pago' : 'Pendente'}
              </span>
            </div>
          </div>
        </div>

        {/* Observações */}
        {appointment.notes && (
          <div className="rounded-3xl bg-white p-5">
            <h3 className="mb-2 font-semibold text-[#3A3A3A]">Observações</h3>
            <p className="text-sm text-[#8B9E8B]">{appointment.notes}</p>
          </div>
        )}

        {/* Localização */}
        <div className="flex items-center gap-4 rounded-3xl bg-white p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#E8F4EA]">
            <MapPin className="h-7 w-7 text-[#6FB57F]" />
          </div>
          <div>
            <span className="font-semibold text-[#3A3A3A]">Studio R.R.</span>
            <p className="text-sm text-[#8B9E8B]">Rua das Flores, 123</p>
          </div>
        </div>
      </div>

      {/* Ações */}
      {appointment.status !== 'cancelado' && appointment.status !== 'concluido' && (
        <div className="mt-8 flex flex-col gap-3 px-6">
          {canReschedule(appointment.date, appointment.time) ? (
            <Button
              onClick={() => router.push("/agendar")}
              className="h-14 w-full rounded-full bg-[#6FB57F] text-lg font-medium text-white hover:bg-[#5fa46e]"
            >
              Reagendar Sessão
            </Button>
          ) : (
            <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-4">
              <p className="text-sm text-yellow-800 text-center">
                {getHoursUntilAppointment(appointment.date, appointment.time) > 0
                  ? `Não é possível reagendar. Faltam menos de 48 horas para o agendamento (${getHoursUntilAppointment(appointment.date, appointment.time)} horas restantes).`
                  : 'Não é possível reagendar. O agendamento já passou ou está muito próximo.'}
              </p>
            </div>
          )}

          {canReschedule(appointment.date, appointment.time) ? (
            <button 
              onClick={async () => {
                if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
                  try {
                    const reason = prompt('Por favor, informe o motivo do cancelamento (opcional):')
                    await api.post(`/client/appointments/${appointment.id}/cancel`, { reason: reason || null })
                    alert('Agendamento cancelado com sucesso!')
                    router.push('/sessoes')
                  } catch (error: any) {
                    console.error('Erro ao cancelar agendamento:', error)
                    alert(error.message || 'Erro ao cancelar agendamento')
                  }
                }
              }}
              className="h-14 w-full rounded-full text-lg font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              Cancelar Agendamento
            </button>
          ) : (
            <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-4">
              <p className="text-sm text-yellow-800 text-center">
                {getHoursUntilAppointment(appointment.date, appointment.time) > 0
                  ? `Não é possível cancelar. Faltam menos de 48 horas para o agendamento (${getHoursUntilAppointment(appointment.date, appointment.time)} horas restantes).`
                  : 'Não é possível cancelar. O agendamento já passou ou está muito próximo.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AppointmentDetailsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F3]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6FB57F]" />
      </div>
    }>
      <AppointmentDetailsContent />
    </Suspense>
  )
}

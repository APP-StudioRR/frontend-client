"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Clock, Filter, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Image from "next/image"

interface Appointment {
  id: number
  date: string
  time: string
  status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado'
  payment_status: 'pendente' | 'pago'
  service: {
    id: number
    name: string
    duration: number
    image_url?: string
  } | null
  professional: {
    id: number
    name: string
    image_url?: string
  }
  package?: {
    id: number
    name: string
    image_url?: string
  }
}

type StatusFilter = 'todos' | 'pendente' | 'confirmado' | 'concluido' | 'cancelado'

export default function SessoesPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')

  useEffect(() => {
    loadAppointments()
  }, [statusFilter])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const params = statusFilter !== 'todos' ? `?status=${statusFilter}` : ''
      const response = await api.get(`/client/appointments${params}`)
      
      if (response.success && response.data) {
        setAppointments(response.data || [])
      } else {
        setAppointments([])
      }
    } catch (error: any) {
      console.error('Erro ao carregar agendamentos:', error)
      if (error.status === 401) {
        localStorage.removeItem('token')
        router.push('/login')
      }
      setAppointments([])
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
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
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

  const isPast = (dateString: string, timeString: string) => {
    try {
      const appointmentDateTime = new Date(`${dateString}T${timeString}`)
      return appointmentDateTime < new Date()
    } catch {
      return false
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F3] pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-6">
        <button onClick={() => router.back()} className="text-[#3A3A3A]">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-[#3A3A3A]">Minhas Sessões</h1>
      </div>

      {/* Filtros */}
      <div className="px-6 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === 'todos'
                ? 'bg-[#6FB57F] text-white'
                : 'bg-white text-[#8B9E8B] hover:bg-[#F5F5F3]'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter('pendente')}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === 'pendente'
                ? 'bg-[#6FB57F] text-white'
                : 'bg-white text-[#8B9E8B] hover:bg-[#F5F5F3]'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setStatusFilter('confirmado')}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === 'confirmado'
                ? 'bg-[#6FB57F] text-white'
                : 'bg-white text-[#8B9E8B] hover:bg-[#F5F5F3]'
            }`}
          >
            Confirmados
          </button>
          <button
            onClick={() => setStatusFilter('concluido')}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === 'concluido'
                ? 'bg-[#6FB57F] text-white'
                : 'bg-white text-[#8B9E8B] hover:bg-[#F5F5F3]'
            }`}
          >
            Concluídos
          </button>
          <button
            onClick={() => setStatusFilter('cancelado')}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === 'cancelado'
                ? 'bg-[#6FB57F] text-white'
                : 'bg-white text-[#8B9E8B] hover:bg-[#F5F5F3]'
            }`}
          >
            Cancelados
          </button>
        </div>
      </div>

      {/* Lista de Agendamentos */}
      <div className="flex-1 px-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#6FB57F]" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Calendar className="mb-4 h-12 w-12 text-[#8B9E8B]" />
            <p className="text-center text-[#8B9E8B]">
              {statusFilter === 'todos'
                ? 'Nenhum agendamento encontrado'
                : `Nenhum agendamento ${statusFilter} encontrado`}
            </p>
            <Button
              onClick={() => router.push('/agendar')}
              className="mt-4 rounded-full bg-[#6FB57F] text-white hover:bg-[#5fa46e]"
            >
              Agendar Sessão
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {appointments.map((appointment) => (
              <button
                key={appointment.id}
                onClick={() => router.push(`/agendamento/${appointment.id}`)}
                className="flex items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm transition-colors hover:bg-[#F5F5F3]"
              >
                {/* Imagem do Serviço ou Pacote */}
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl">
                  {appointment.service?.image_url ? (
                    <Image
                      src={appointment.service.image_url}
                      alt={appointment.service.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : appointment.package?.image_url ? (
                    <Image
                      src={appointment.package.image_url}
                      alt={appointment.package.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#E8F4EA]">
                      <Calendar className="h-8 w-8 text-[#6FB57F]" />
                    </div>
                  )}
                </div>

                {/* Informações */}
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h3 className="truncate font-semibold text-[#3A3A3A]">
                      {appointment.service?.name || appointment.package?.name || 'Sessão'}
                    </h3>
                    {getStatusBadge(appointment.status)}
                  </div>
                  
                  <div className="mb-2 flex items-center gap-2 text-sm text-[#8B9E8B]">
                    {appointment.service?.duration && (
                      <>
                        <Clock className="h-4 w-4" />
                        <span>{appointment.service.duration} min</span>
                        <span>•</span>
                      </>
                    )}
                    <span>{appointment.professional.name}</span>
                    {appointment.package && (
                      <>
                        <span>•</span>
                        <span className="text-xs bg-[#E8F4EA] px-2 py-0.5 rounded-full text-[#6FB57F]">
                          Pacote
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-[#3A3A3A]">
                    <Calendar className="h-4 w-4 text-[#8B9E8B]" />
                    <span className="truncate">
                      {formatDate(appointment.date)} às {formatTime(appointment.time)}
                    </span>
                  </div>

                  {appointment.package && (
                    <div className="mt-2 text-xs text-[#8B9E8B]">
                      Pacote: {appointment.package.name}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}





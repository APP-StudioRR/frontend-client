"use client"

import { Button } from "@/components/ui/button"
import { Bell, ChevronRight, Plus, Package, Calendar, Sparkles, Droplet, Flame, X, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"

interface Service {
  id: number
  name: string
  description?: string
  duration: number
  price: string
  image_url?: string
  active: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const [userName, setUserName] = useState("")
  const [userAvatar, setUserAvatar] = useState("")
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<Service[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [appointments, setAppointments] = useState<any[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [showNotificationCard, setShowNotificationCard] = useState(false)

  useEffect(() => {
    loadUserProfile()
    loadServices()
    loadAppointments()
    loadMyPackages()
    checkNotifications()
  }, [])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const data = await api.get('/client/profile')
      
      if (data.success && data.data) {
        const user = data.data
        const fullName = user.name || "Usuário"
        const firstName = fullName.split(' ')[0]
        setUserName(firstName)
        setUserAvatar(user.avatar_url || "")
      }
    } catch (err: any) {
      if (err.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadServices = async () => {
    try {
      setLoadingServices(true)
      const token = localStorage.getItem('token')
      if (!token) {
        console.warn('Token não encontrado, não é possível carregar serviços')
        setServices([])
        return
      }

      const data = await api.get('/client/services')
      console.log('Resposta da API de serviços:', data)
      
      if (data && data.success && data.data) {
        setServices(Array.isArray(data.data) ? data.data : [])
      } else if (Array.isArray(data)) {
        setServices(data)
      } else {
        console.warn('Formato de resposta inesperado:', data)
        setServices([])
      }
    } catch (err: any) {
      console.error('Erro ao carregar serviços:', err)
      if (err.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      }
      setServices([])
    } finally {
      setLoadingServices(false)
    }
  }

  const checkNotifications = () => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        setNotificationsEnabled(true)
        const manuallyDisabled = localStorage.getItem("notificationsManuallyDisabled")
        if (manuallyDisabled) {
          setShowNotificationCard(true)
        } else {
          setShowNotificationCard(false)
        }
      } else if (Notification.permission === "default") {
        const cardDismissed = localStorage.getItem("notificationCardDismissed")
        const manuallyDisabled = localStorage.getItem("notificationsManuallyDisabled")
        if (!cardDismissed || manuallyDisabled) {
          setShowNotificationCard(true)
        }
      } else {
        setShowNotificationCard(false)
      }
    }
  }

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      try {
        const permission = await Notification.requestPermission()
        if (permission === "granted") {
          setNotificationsEnabled(true)
          setShowNotificationCard(false)
          localStorage.removeItem("notificationsManuallyDisabled")
          localStorage.removeItem("notificationCardDismissed")
          new Notification("Notificações Ativadas!", {
            body: "Você receberá notificações sobre seus agendamentos e pacotes.",
            icon: "/icon-192.png",
          })
        }
      } catch (error) {
        console.error("Erro ao solicitar permissão de notificações:", error)
      }
    }
  }

  const dismissCard = () => {
    setShowNotificationCard(false)
    localStorage.setItem("notificationCardDismissed", "true")
  }

  const [packages, setPackages] = useState<Array<{
    id: number
    name: string
    valid_until: string
    used: number
    sessions: number
    remaining: number
    image_url?: string
  }>>([])
  const [loadingPackages, setLoadingPackages] = useState(true)

  const loadAppointments = async () => {
    try {
      setLoadingAppointments(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setAppointments([])
        return
      }

      const data = await api.get('/client/appointments?upcoming=true')
      if (data.success && data.data) {
        setAppointments(data.data || [])
      } else {
        setAppointments([])
      }
    } catch (err: any) {
      console.error('Erro ao carregar agendamentos:', err)
      setAppointments([])
    } finally {
      setLoadingAppointments(false)
    }
  }

  const loadMyPackages = async () => {
    try {
      setLoadingPackages(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setPackages([])
        return
      }

      const data = await api.get('/client/packages/my')
      if (data.success && data.data) {
        setPackages(data.data || [])
      } else {
        setPackages([])
      }
    } catch (err: any) {
      console.error('Erro ao carregar meus pacotes:', err)
      setPackages([])
    } finally {
      setLoadingPackages(false)
    }
  }

  const mockAppointments: Array<{
    id: number
    name: string
    time: string
    duration: string
    icon: string
  }> = []

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F3] pb-24">
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-full bg-[#6FB57F] flex items-center justify-center">
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt="Profile"
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-white">
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#3A3A3A]">
            {loading ? "Carregando..." : `Olá, ${userName || "Usuário"}`}
          </h1>
        </div>
        <button onClick={() => router.push("/notificacoes")} className="text-[#3A3A3A]">
          <Bell className="h-6 w-6" />
        </button>
      </div>

      {/* Card de Ativação de Notificações */}
      {showNotificationCard && (
        <div className="mt-4 px-6">
          <div className="relative rounded-3xl bg-gradient-to-br from-[#6FB57F] to-[#5fa46e] p-5 shadow-lg">
            <button
              onClick={dismissCard}
              className="absolute right-4 top-4 text-white/80 hover:text-white"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-start gap-4 pr-8">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-lg font-bold text-white">Ative as Notificações</h3>
                <p className="mb-4 text-sm text-white/90">
                  Receba lembretes de agendamentos, atualizações de pacotes e promoções especiais
                </p>
                <Button
                  onClick={requestNotificationPermission}
                  className="h-10 rounded-full bg-white text-sm font-medium text-[#6FB57F] hover:bg-white/90"
                >
                  Ativar Notificações
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 px-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#3A3A3A]">Meus Pacotes</h2>
          {packages.length > 0 && (
            <button onClick={() => router.push("/pacotes")} className="text-sm font-medium text-[#6FB57F]">
              Ver todos
            </button>
          )}
        </div>

        {loadingPackages ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#6FB57F]" />
          </div>
        ) : packages.length > 0 ? (
          packages.map((pkg) => {
            const validUntilDate = pkg.valid_until ? new Date(pkg.valid_until).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }) : null
            
            return (
              <button
                key={pkg.id}
                onClick={() => router.push(`/pacote/${pkg.id}`)}
                className="mb-4 w-full rounded-3xl bg-white p-6 text-left shadow-sm transition-colors hover:bg-[#F5F5F3]"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-1 text-xl font-bold text-[#3A3A3A]">{pkg.name}</h3>
                    {validUntilDate && (
                      <p className="text-sm text-[#8B9E8B]">Válido até {validUntilDate}</p>
                    )}
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F4EA]">
                    <span className="text-lg font-bold text-[#6FB57F]">
                      {pkg.used}/{pkg.sessions}
                    </span>
                  </div>
                </div>

                <div className="mb-2 h-2 overflow-hidden rounded-full bg-[#E8F4EA]">
                  <div className="h-full rounded-full bg-[#6FB57F]" style={{ width: `${(pkg.used / pkg.sessions) * 100}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#8B9E8B]">{pkg.remaining} sessões restantes</p>
                  <ChevronRight className="h-5 w-5 text-[#CCCCCC]" />
                </div>
              </button>
            )
          })
        ) : (
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F4EA]">
                <Package className="h-8 w-8 text-[#6FB57F]" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-[#3A3A3A]">Você ainda não tem pacotes</h3>
              <p className="mb-6 text-sm text-[#8B9E8B]">
                Adquira um pacote de sessões e aproveite nossos serviços com desconto
              </p>
              <Button
                onClick={() => router.push("/pacotes")}
                className="h-12 rounded-full bg-[#6FB57F] px-6 text-sm font-medium text-white hover:bg-[#5fa46e]"
              >
                Ver Pacotes Disponíveis
              </Button>
            </div>
          </div>
        )}
      </div>

      {packages.length === 0 && (
        <div className="mt-6 px-6">
          <h2 className="mb-4 text-2xl font-bold text-[#3A3A3A]">Serviços Disponíveis</h2>
          {loadingServices ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#6FB57F]" />
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 shadow-sm text-center">
              <p className="text-[#8B9E8B]">Nenhum serviço disponível no momento.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => router.push(`/servico/${service.id}`)}
                  className="flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-sm transition-colors hover:bg-[#F5F5F3]"
                >
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl">
                    {service.image_url ? (
                      <Image
                        src={service.image_url}
                        alt={service.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#E8F4EA]">
                        <Sparkles className="h-8 w-8 text-[#6FB57F]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 font-semibold text-[#3A3A3A]">{service.name}</h3>
                    <p className="text-sm text-[#8B9E8B]">
                      {service.duration} min - €{parseFloat(service.price).toFixed(2)}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#CCCCCC]" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 px-6">
        <h2 className="mb-4 text-2xl font-bold text-[#3A3A3A]">Próximos Agendamentos</h2>

        {loadingAppointments ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#6FB57F]" />
          </div>
        ) : appointments.length > 0 ? (
          <div className="flex flex-col gap-3">
            {appointments.map((appointment: any) => {
              const appointmentDate = new Date(appointment.date)
              const formattedDate = appointmentDate.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'short' 
              })
              const isPackageSession = appointment.package && appointment.package.id
              const isPending = appointment.status === 'pendente'
              
              const getStatusBadge = (status: string) => {
                switch (status) {
                  case 'pendente':
                    return (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                        Pendente
                      </span>
                    )
                  case 'confirmado':
                    return (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Confirmado
                      </span>
                    )
                  case 'concluido':
                    return (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Concluído
                      </span>
                    )
                  case 'cancelado':
                    return (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Cancelado
                      </span>
                    )
                  default:
                    return null
                }
              }
              
              return (
                <button
                  key={appointment.id}
                  onClick={() => router.push(`/agendamento/${appointment.id}`)}
                  className="flex items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-sm transition-colors hover:bg-[#F5F5F3]"
                >
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isPending ? 'bg-yellow-100' : 'bg-[#E8F4EA]'}`}>
                    <Calendar className={`h-6 w-6 ${isPending ? 'text-yellow-600' : 'text-[#6FB57F]'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[#3A3A3A]">
                        {appointment.service?.name || 'Serviço'}
                      </h3>
                      {getStatusBadge(appointment.status)}
                      {isPackageSession && (
                        <span className="rounded-full bg-[#6FB57F]/10 px-2 py-0.5 text-xs font-medium text-[#6FB57F]">
                          Sessão de Pacote
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#8B9E8B]">
                      {formattedDate} às {appointment.time} ({appointment.service?.duration || 0} min)
                    </p>
                    {isPackageSession && appointment.package?.name && (
                      <p className="mt-1 text-xs text-[#8B9E8B]">
                        Pacote: {appointment.package.name}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#CCCCCC]" />
                </button>
              )
            })}
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F4EA]">
                <Calendar className="h-8 w-8 text-[#6FB57F]" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-[#3A3A3A]">Nenhum agendamento ainda</h3>
              <p className="mb-6 text-sm text-[#8B9E8B]">
                Agende sua primeira sessão e comece sua jornada de bem-estar
              </p>
              <Button
                onClick={() => router.push("/agendar")}
                className="h-12 rounded-full bg-[#6FB57F] px-6 text-sm font-medium text-white hover:bg-[#5fa46e]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agendar Agora
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 px-6">
        <Button
          onClick={() => router.push("/agendar")}
          className="h-14 w-full rounded-full bg-[#6FB57F] text-lg font-medium text-white hover:bg-[#5fa46e]"
        >
          <Plus className="mr-2 h-5 w-5" />
          Agendar Nova Sessão
        </Button>
      </div>
    </div>
  )
}

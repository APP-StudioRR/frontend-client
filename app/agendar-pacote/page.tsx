"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Calendar, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { api } from "@/lib/api"
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, isSameDay, isPast, addWeeks } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Package {
  id: number
  name: string
  description?: string
  sessions: number
  price: string
  discount: number
  image_url?: string
  scheduled_sessions?: number
  remaining_sessions?: number
  services?: Array<{
    id: number
    name: string
    duration?: number
  }>
  professionals?: Array<{
    id: number
    name: string
    specialty?: string
    image_url?: string
  }>
}

interface Professional {
  id: number
  name: string
  specialty?: string
  image_url?: string
}

type SessionSchedule = {
  date: string
  time: string
}

function AgendarPacoteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const packageId = searchParams.get("package")
  
  const [packageData, setPackageData] = useState<Package | null>(null)
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selectedProfessional, setSelectedProfessional] = useState<number | null>(null)
  const [scheduleMode, setScheduleMode] = useState<"all" | "first">("first")
  const [sessions, setSessions] = useState<SessionSchedule[]>([])
  const [currentMonths, setCurrentMonths] = useState<Record<number, Date>>({})
  const [openSessionIndex, setOpenSessionIndex] = useState<number | null>(null)
  const [availableTimes, setAvailableTimes] = useState<Record<number, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [loadingTimes, setLoadingTimes] = useState<Record<number, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (packageId) {
      loadData()
    } else {
      router.push('/pacotes')
    }
  }, [packageId])

  useEffect(() => {
    if (packageData && scheduleMode === "first") {
      setSessions([{ date: "", time: "" }])
      setCurrentMonths({ 0: new Date() })
      setOpenSessionIndex(0)
    } else if (packageData && scheduleMode === "all") {
      // Usar remaining_sessions se disponível, senão usar sessions total
      const sessionsToSchedule = packageData.remaining_sessions !== undefined 
        ? packageData.remaining_sessions 
        : packageData.sessions
      
      const initialSessions: SessionSchedule[] = []
      const initialMonths: Record<number, Date> = {}
      for (let i = 0; i < sessionsToSchedule; i++) {
        initialSessions.push({ date: "", time: "" })
        initialMonths[i] = new Date()
      }
      setSessions(initialSessions)
      setCurrentMonths(initialMonths)
      setOpenSessionIndex(null)
    }
  }, [packageData, scheduleMode])

  // Selecionar o primeiro profissional automaticamente quando os profissionais forem carregados
  useEffect(() => {
    if (professionals.length > 0) {
      // Se houver apenas 1 profissional, sempre selecionar
      if (professionals.length === 1) {
        if (selectedProfessional !== professionals[0].id) {
          console.log('🔄 useEffect: Selecionando profissional único:', professionals[0].id)
          setSelectedProfessional(professionals[0].id)
        }
      } else if (professionals.length > 1) {
        // Se houver mais de 1, selecionar o primeiro se nenhum estiver selecionado
        if (!selectedProfessional || !professionals.find(p => p.id === selectedProfessional)) {
          console.log('🔄 useEffect: Selecionando primeiro profissional:', professionals[0].id)
          setSelectedProfessional(professionals[0].id)
        }
      }
    }
  }, [professionals])

  // Buscar horários quando uma sessão for aberta e já tiver data selecionada
  useEffect(() => {
    if (openSessionIndex !== null && selectedProfessional && packageData) {
      const session = sessions[openSessionIndex]
      if (session && session.date) {
        loadAvailableTimesForSession(openSessionIndex, session.date)
      }
    }
  }, [openSessionIndex, selectedProfessional])

  const loadData = async () => {
    try {
      setLoading(true)
      const packageRes = await api.get(`/client/packages/${packageId}`)

      if (packageRes.success && packageRes.data) {
        setPackageData(packageRes.data)
        
        console.log('📦 Dados do pacote carregados:', packageRes.data)
        
        // Buscar profissionais vinculados ao serviço do pacote
        console.log('📦 Dados completos do pacote:', JSON.stringify(packageRes.data, null, 2))
        console.log('👥 Profissionais recebidos:', packageRes.data.professionals)
        
        if (packageRes.data.professionals && Array.isArray(packageRes.data.professionals) && packageRes.data.professionals.length > 0) {
          // Filtrar apenas profissionais ativos (já vem filtrado do backend, mas garantimos aqui também)
          const activeProfessionals = packageRes.data.professionals.filter((p: any) => p && p.active !== false)
          console.log('👥 Profissionais ativos após filtro:', activeProfessionals)
          console.log('👥 Quantidade de profissionais ativos:', activeProfessionals.length)
          
          setProfessionals(activeProfessionals || [])
          
          // Selecionar o primeiro profissional automaticamente
          if (activeProfessionals.length === 1) {
            // Se houver apenas 1, selecionar automaticamente
            const firstProfessional = activeProfessionals[0]
            console.log('✅ Selecionando profissional único:', firstProfessional.id, firstProfessional.name)
            setSelectedProfessional(firstProfessional.id)
          } else if (activeProfessionals.length > 1) {
            // Se houver mais de 1, selecionar o primeiro mas mostrar seleção
            const firstProfessional = activeProfessionals[0]
            console.log('✅ Selecionando primeiro profissional (múltiplos):', firstProfessional.id, firstProfessional.name)
            setSelectedProfessional(firstProfessional.id)
          } else {
            console.warn('⚠️ Nenhum profissional ativo encontrado')
            setSelectedProfessional(null)
          }
        } else {
          console.warn('⚠️ Nenhum profissional encontrado para este pacote. Dados:', packageRes.data.professionals)
          setProfessionals([])
          setSelectedProfessional(null)
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      alert(error.message || 'Erro ao carregar dados.')
      router.push('/pacotes')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableTimesForSession = async (sessionIndex: number, date: string) => {
    if (!selectedProfessional) {
      console.error('Profissional não selecionado')
      return
    }

    if (!packageData || !packageData.services || packageData.services.length === 0) {
      console.error('Pacote sem serviços')
      return
    }

    const firstService = packageData.services[0]
    if (!firstService || !firstService.id) {
      console.error('Serviço não encontrado')
      return
    }

    console.log('Buscando horários:', {
      professional_id: selectedProfessional,
      date,
      service_id: firstService.id
    })

    try {
      setLoadingTimes(prev => ({ ...prev, [sessionIndex]: true }))
      const response = await api.get(
        `/client/appointments/available-times?professional_id=${selectedProfessional}&date=${date}&service_id=${firstService.id}`
      )
      
      console.log('Resposta completa da API:', JSON.stringify(response, null, 2))
      
      // A API retorna { success: true, data: { times: [...] } }
      let times: string[] = []
      if (response.success && response.data) {
        times = response.data.times || []
      } else if (Array.isArray(response)) {
        times = response
      } else if (response.times) {
        times = response.times
      }
      
      console.log('Horários extraídos:', times)
      
      if (Array.isArray(times) && times.length > 0) {
        console.log('✅ Horários disponíveis encontrados:', times.length, 'horários')
        setAvailableTimes(prev => ({ ...prev, [sessionIndex]: times }))
      } else {
        console.warn('⚠️ Nenhum horário retornado. Resposta:', response)
        setAvailableTimes(prev => ({ ...prev, [sessionIndex]: [] }))
      }
    } catch (error: any) {
      console.error('Erro ao carregar horários disponíveis:', error)
      console.error('Detalhes do erro:', {
        message: error.message,
        status: error.status,
        response: error.rawResponse
      })
      setAvailableTimes(prev => ({ ...prev, [sessionIndex]: [] }))
    } finally {
      setLoadingTimes(prev => ({ ...prev, [sessionIndex]: false }))
    }
  }

  const handleScheduleModeChange = (mode: "all" | "first") => {
    setScheduleMode(mode)
    setOpenSessionIndex(mode === "first" ? 0 : null)
  }

  const handleSessionToggle = (sessionIndex: number) => {
    if (openSessionIndex === sessionIndex) {
      setOpenSessionIndex(null)
    } else {
      setOpenSessionIndex(sessionIndex)
    }
  }

  const handleSessionDateClick = (day: number, sessionIndex: number) => {
    // Validar se temos os dados necessários
    if (!selectedProfessional) {
      alert('Por favor, selecione um profissional primeiro')
      return
    }

    if (!packageData || !packageData.services || packageData.services.length === 0) {
      alert('Erro: Pacote sem serviços. Por favor, recarregue a página.')
      return
    }

    const currentMonth = currentMonths[sessionIndex] || new Date()
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dateString = format(date, 'yyyy-MM-dd')
    
    console.log('📅 Data clicada:', dateString, 'Sessão:', sessionIndex)
    console.log('👤 Profissional selecionado:', selectedProfessional)
    console.log('📦 Pacote:', packageData?.name)
    console.log('📦 Serviços do pacote:', packageData?.services)
    
    const updatedSessions = [...sessions]
    updatedSessions[sessionIndex] = { ...updatedSessions[sessionIndex], date: dateString, time: "" }
    setSessions(updatedSessions)
    
    // Carregar horários disponíveis para esta sessão
    console.log('🔄 Iniciando busca de horários...')
    loadAvailableTimesForSession(sessionIndex, dateString)
  }

  const handleTimeClick = (time: string, sessionIndex: number) => {
    const updatedSessions = [...sessions]
    updatedSessions[sessionIndex] = { ...updatedSessions[sessionIndex], time }
    setSessions(updatedSessions)
  }

  const handleMonthChange = (sessionIndex: number, direction: 'prev' | 'next') => {
    const currentMonth = currentMonths[sessionIndex] || new Date()
    const newMonth = direction === 'prev' 
      ? subMonths(currentMonth, 1)
      : addMonths(currentMonth, 1)
    
    setCurrentMonths(prev => ({ ...prev, [sessionIndex]: newMonth }))
  }

  const autoScheduleRemainingSessions = (firstDate: Date, firstTime: string) => {
    const updatedSessions = [...sessions]
    updatedSessions[0] = { date: format(firstDate, 'yyyy-MM-dd'), time: firstTime }
    
    for (let i = 1; i < updatedSessions.length; i++) {
      const nextDate = addWeeks(firstDate, i)
      updatedSessions[i] = { date: format(nextDate, 'yyyy-MM-dd'), time: firstTime }
    }
    
    setSessions(updatedSessions)
  }

  const handleConfirmBooking = () => {
    if (!selectedProfessional || !packageId) {
      alert('Por favor, selecione um profissional')
      return
    }

    const validSessions = sessions.filter(s => s.date && s.time)
    if (validSessions.length === 0) {
      alert('Por favor, agende pelo menos uma sessão')
      return
    }

    if (scheduleMode === "all" && validSessions.length < packageData!.sessions) {
      alert(`Por favor, agende todas as ${packageData!.sessions} sessões`)
      return
    }

    const bookingData = {
      package_id: parseInt(packageId),
      professional_id: selectedProfessional,
      sessions: validSessions,
    }

    const queryParams = new URLSearchParams({
      package_id: packageId,
      professional_id: selectedProfessional.toString(),
      sessions: JSON.stringify(validSessions),
    }).toString()
    
    router.push(`/pagamento?${queryParams}`)
  }


  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F3]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6FB57F]" />
      </div>
    )
  }

  if (!packageData) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F3] pb-24">
      <div className="flex items-center gap-4 px-6 py-6">
        <button onClick={() => router.back()} className="text-[#3A3A3A]">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-[#3A3A3A]">Agendar Pacote</h1>
      </div>

      <div className="flex flex-col gap-6 px-6">
        {/* Informações do Pacote */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-4">
            {packageData.image_url && (
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl">
                <Image
                  src={packageData.image_url}
                  alt={packageData.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-[#3A3A3A]">{packageData.name}</h2>
              <p className="text-sm text-[#8B9E8B]">{packageData.sessions} sessões</p>
              <p className="text-base font-bold text-[#3A3A3A]">€{parseFloat(packageData.price).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Seleção de Profissional - Só mostra se houver mais de 1 */}
        {professionals.length > 1 && (
          <div>
            <h2 className="mb-4 text-lg font-bold text-[#3A3A3A]">Selecione o Profissional</h2>
            <div className="grid grid-cols-2 gap-3">
              {professionals.map((professional) => (
                <button
                  key={professional.id}
                  onClick={() => setSelectedProfessional(professional.id)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-colors ${
                    selectedProfessional === professional.id
                      ? "border-[#6FB57F] bg-white shadow-sm"
                      : "border-[#E5E5E5] bg-white"
                  }`}
                >
                  <div className="relative mb-2 h-20 w-20 overflow-hidden rounded-full">
                    {professional.image_url ? (
                      <Image
                        src={professional.image_url}
                        alt={professional.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#E8F4EA]">
                        <span className="text-2xl">👤</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-center text-sm font-semibold text-[#3A3A3A]">{professional.name}</h3>
                  {professional.specialty && (
                    <p className="text-xs text-[#8B9E8B]">{professional.specialty}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modo de Agendamento */}
        <div>
          <h2 className="mb-4 text-lg font-bold text-[#3A3A3A]">Como deseja agendar?</h2>
          <div className="flex gap-3 rounded-2xl bg-white p-1 shadow-sm">
            <button
              onClick={() => handleScheduleModeChange("first")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                scheduleMode === "first"
                  ? "bg-[#6FB57F] text-white"
                  : "text-[#8B9E8B] hover:bg-[#F5F5F3]"
              }`}
            >
              Agendar apenas a primeira
            </button>
            <button
              onClick={() => handleScheduleModeChange("all")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                scheduleMode === "all"
                  ? "bg-[#6FB57F] text-white"
                  : "text-[#8B9E8B] hover:bg-[#F5F5F3]"
              }`}
            >
              Agendar todas ({packageData.remaining_sessions !== undefined ? packageData.remaining_sessions : packageData.sessions})
            </button>
          </div>
        </div>

        {/* Agendamento de Sessões */}
        {selectedProfessional ? (
          scheduleMode === "first" ? (
          <div>
            <h2 className="mb-4 text-lg font-bold text-[#3A3A3A]">Agendar Primeira Sessão</h2>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              {(() => {
                const currentMonth = currentMonths[0] || new Date()
                const daysInMonth = getDaysInMonth(currentMonth)
                const startDayOfMonth = startOfMonth(currentMonth).getDay()
                const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
                const emptyDays = Array.from({ length: startDayOfMonth }, (_, i) => null)
                const sessionTimes = availableTimes[0] || []
                const isLoading = loadingTimes[0] || false

                return (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <button 
                        onClick={() => handleMonthChange(0, 'prev')} 
                        className="text-[#3A3A3A]"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <span className="font-semibold text-[#3A3A3A]">
                        {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                      </span>
                      <button 
                        onClick={() => handleMonthChange(0, 'next')} 
                        className="text-[#3A3A3A]"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mb-4 grid grid-cols-7 gap-2 text-center text-sm">
                      {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
                        <div key={index} className="text-[#999999]">{day}</div>
                      ))}
                      {emptyDays.map((_, index) => (
                        <div key={`empty-${index}`} className="h-10 w-10" />
                      ))}
                      {days.map((day) => {
                        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                        const isSelected = sessions[0]?.date === format(date, 'yyyy-MM-dd')
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const dateToCheck = new Date(date)
                        dateToCheck.setHours(0, 0, 0, 0)
                        const isPastDate = dateToCheck < today
                        const isDisabled = isPastDate || !selectedProfessional || !packageData

                        return (
                          <button
                            key={day}
                            onClick={() => handleSessionDateClick(day, 0)}
                            disabled={isDisabled}
                            className={`flex h-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                              isSelected
                                ? "bg-[#6FB57F] text-white"
                                : isDisabled
                                  ? "text-[#CCCCCC] cursor-not-allowed"
                                  : "text-[#3A3A3A] hover:bg-[#F5F5F3]"
                            }`}
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>

                    {sessions[0]?.date && (
                      <div>
                        <p className="mb-3 text-sm font-medium text-[#3A3A3A]">Selecione o horário:</p>
                        {isLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-[#6FB57F]" />
                          </div>
                        ) : sessionTimes.length === 0 ? (
                          <div className="rounded-lg bg-[#F5F5F3] p-4 text-center text-sm text-[#8B9E8B]">
                            Nenhum horário disponível para esta data
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {sessionTimes.map((time) => (
                              <button
                                key={time}
                                onClick={() => handleTimeClick(time, 0)}
                                className={`rounded-full py-3 text-sm font-medium transition-colors ${
                                  sessions[0]?.time === time
                                    ? "bg-[#6FB57F] text-white"
                                    : "bg-[#F5F5F3] text-[#3A3A3A] hover:bg-[#E8F4EA]"
                                }`}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
          ) : (
            <div>
              <h2 className="mb-4 text-lg font-bold text-[#3A3A3A]">Agendar Todas as Sessões</h2>
            <p className="mb-4 text-sm text-[#8B9E8B]">
              Agende todas as {packageData.remaining_sessions !== undefined ? packageData.remaining_sessions : packageData.sessions} sessões restantes. Cada sessão deve ter no mínimo 7 dias de intervalo.
            </p>
            {sessions.map((session, index) => {
              const isOpen = openSessionIndex === index
              const currentMonth = currentMonths[index] || new Date()
              const daysInMonth = getDaysInMonth(currentMonth)
              const startDayOfMonth = startOfMonth(currentMonth).getDay()
              const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
              const emptyDays = Array.from({ length: startDayOfMonth }, (_, i) => null)
              const sessionTimes = availableTimes[index] || []
              const isLoading = loadingTimes[index] || false
              const hasDate = !!session.date
              const hasTime = !!session.time

              return (
                <div key={index} className="mb-3 rounded-2xl bg-white shadow-sm overflow-hidden">
                  {/* Dropdown Header */}
                  <button
                    onClick={() => handleSessionToggle(index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[#F5F5F3] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                        hasDate && hasTime 
                          ? "bg-[#6FB57F] text-white" 
                          : hasDate 
                            ? "bg-[#E8F4EA] text-[#6FB57F]"
                            : "bg-[#F5F5F3] text-[#8B9E8B]"
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-[#3A3A3A]">Sessão {index + 1}</h3>
                        {hasDate && hasTime ? (
                          <p className="text-sm text-[#6FB57F]">
                            {format(new Date(session.date), "dd/MM/yyyy", { locale: ptBR })} às {session.time}
                          </p>
                        ) : hasDate ? (
                          <p className="text-sm text-[#8B9E8B]">
                            {format(new Date(session.date), "dd/MM/yyyy", { locale: ptBR })} - Selecione o horário
                          </p>
                        ) : (
                          <p className="text-sm text-[#8B9E8B]">Clique para agendar</p>
                        )}
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 text-[#8B9E8B]" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-[#8B9E8B]" />
                    )}
                  </button>

                  {/* Dropdown Content */}
                  {isOpen && (
                    <div className="border-t border-[#E5E5E5] p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <button 
                          onClick={() => handleMonthChange(index, 'prev')} 
                          className="text-[#3A3A3A]"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="font-semibold text-[#3A3A3A]">
                          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                        </span>
                        <button 
                          onClick={() => handleMonthChange(index, 'next')} 
                          className="text-[#3A3A3A]"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="mb-4 grid grid-cols-7 gap-2 text-center text-sm">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
                          <div key={idx} className="text-[#999999]">{day}</div>
                        ))}
                        {emptyDays.map((_, idx) => (
                          <div key={`empty-${idx}`} className="h-10 w-10" />
                        ))}
                        {days.map((day) => {
                          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                          const dateString = format(date, 'yyyy-MM-dd')
                          const isSelected = session.date === dateString
                          const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const dateToCheck = new Date(date)
                        dateToCheck.setHours(0, 0, 0, 0)
                        const isPastDate = dateToCheck < today
                          const isDisabled = isPastDate || !selectedProfessional || !packageData

                          return (
                            <button
                              key={day}
                              onClick={() => handleSessionDateClick(day, index)}
                              disabled={isDisabled}
                              className={`flex h-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                isSelected
                                  ? "bg-[#6FB57F] text-white"
                                  : isDisabled
                                    ? "text-[#CCCCCC] cursor-not-allowed"
                                    : "text-[#3A3A3A] hover:bg-[#F5F5F3]"
                              }`}
                            >
                              {day}
                            </button>
                          )
                        })}
                      </div>

                      {hasDate && (
                        <div>
                          <p className="mb-3 text-sm font-medium text-[#3A3A3A]">Selecione o horário:</p>
                          {isLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-6 w-6 animate-spin text-[#6FB57F]" />
                            </div>
                          ) : sessionTimes.length === 0 ? (
                            <div className="rounded-lg bg-[#F5F5F3] p-4 text-center text-sm text-[#8B9E8B]">
                              Nenhum horário disponível para esta data
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-2">
                              {sessionTimes.map((time) => (
                                <button
                                  key={time}
                                  onClick={() => handleTimeClick(time, index)}
                                  className={`rounded-full py-3 text-sm font-medium transition-colors ${
                                    session.time === time
                                      ? "bg-[#6FB57F] text-white"
                                      : "bg-[#F5F5F3] text-[#3A3A3A] hover:bg-[#E8F4EA]"
                                  }`}
                                >
                                  {time}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            </div>
          )
        ) : professionals.length > 1 && !selectedProfessional ? (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-center">
            <p className="text-sm text-yellow-800">
              ⚠️ Por favor, selecione um profissional antes de agendar as sessões.
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-8 px-6">
        <Button
          onClick={handleConfirmBooking}
          disabled={!selectedProfessional || submitting}
          className="h-14 w-full rounded-full bg-[#6FB57F] text-lg font-medium text-white hover:bg-[#5fa46e] disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processando...
            </>
          ) : (
            'Confirmar Agendamento'
          )}
        </Button>
      </div>
    </div>
  )
}

export default function AgendarPacotePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F3]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6FB57F]" />
      </div>
    }>
      <AgendarPacoteContent />
    </Suspense>
  )
}


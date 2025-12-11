"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, Loader2 } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { api } from "@/lib/api"

interface Service {
  id: number
  name: string
  duration: number
  price: string
  image_url?: string
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

function BookingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const serviceParam = searchParams.get("service")
  const [selectedService, setSelectedService] = useState<number | null>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [showAllServices, setShowAllServices] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTimes, setLoadingTimes] = useState(false)

  useEffect(() => {
    loadData()
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    setSelectedDate(tomorrow.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (selectedService && selectedProfessional && selectedDate) {
      loadAvailableTimes()
    } else {
      setAvailableTimes([])
      setSelectedTime("")
    }
  }, [selectedService, selectedProfessional, selectedDate])

  useEffect(() => {
    if (serviceParam) {
      const serviceId = parseInt(serviceParam)
      if (!isNaN(serviceId)) {
        setSelectedService(serviceId)
      }
    }
  }, [serviceParam])

  const loadData = async () => {
    try {
      setLoading(true)
      const servicesRes = await api.get('/client/services')
      
      if (servicesRes.success && servicesRes.data) {
        setServices(servicesRes.data || [])
        if (servicesRes.data.length > 0 && !selectedService) {
          setSelectedService(servicesRes.data[0].id)
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedService) {
      const service = services.find(s => s.id === selectedService)
      if (service && service.professionals) {
        const serviceProfessionals = service.professionals.filter(p => p.active !== false)
        setProfessionals(serviceProfessionals)
        
        // Se houver apenas 1 profissional, setar automaticamente
        if (serviceProfessionals.length === 1) {
          setSelectedProfessional(serviceProfessionals[0].id)
        } else if (serviceProfessionals.length > 0 && !selectedProfessional) {
          setSelectedProfessional(serviceProfessionals[0].id)
        } else {
          setSelectedProfessional(null)
        }
      } else {
        setProfessionals([])
        setSelectedProfessional(null)
      }
    }
  }, [selectedService, services])

  const loadAvailableTimes = async () => {
    if (!selectedService || !selectedProfessional || !selectedDate) {
      return
    }

    try {
      setLoadingTimes(true)
      const response = await api.get(
        `/client/appointments/available-times?professional_id=${selectedProfessional}&date=${selectedDate}&service_id=${selectedService}`
      )
      
      if (response.success && response.data?.times) {
        setAvailableTimes(response.data.times)
        // Se o horário selecionado não estiver mais disponível, limpar seleção
        if (selectedTime && !response.data.times.includes(selectedTime)) {
          setSelectedTime("")
        }
      } else {
        setAvailableTimes([])
      }
    } catch (error: any) {
      console.error('Erro ao carregar horários disponíveis:', error)
      setAvailableTimes([])
    } finally {
      setLoadingTimes(false)
    }
  }

  const initialServicesCount = 3
  const displayedServices = showAllServices ? services : services.slice(0, initialServicesCount)
  const hasMoreServices = services.length > initialServicesCount

  const handleConfirmBooking = () => {
    if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime) {
      alert('Por favor, preencha todos os campos')
      return
    }

    const bookingData = {
      service_id: selectedService,
      professional_id: selectedProfessional,
      date: selectedDate,
      time: selectedTime,
    }

    const queryParams = new URLSearchParams(bookingData).toString()
    router.push(`/pagamento?${queryParams}`)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F3]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6FB57F]" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F3] pb-24">
      <div className="flex items-center gap-4 px-6 py-6">
        <button onClick={() => router.back()} className="text-[#3A3A3A]">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-[#3A3A3A]">Agendar Sessão</h1>
      </div>

      <div className="flex flex-col gap-8 px-6">
        <div>
          <h2 className="mb-4 text-lg font-bold text-[#3A3A3A]">Escolha o serviço</h2>
          {services.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center text-[#8B9E8B]">
              Nenhum serviço disponível no momento.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {displayedServices.map((service) => (
                  <div key={service.id} className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedService(service.id)}
                      className={`flex flex-1 items-center gap-3 rounded-2xl border-2 p-4 text-left transition-colors ${
                        selectedService === service.id ? "border-[#6FB57F] bg-[#F0F9F3]" : "border-[#E5E5E5] bg-white"
                      }`}
                    >
                      <div
                        className={`h-6 w-6 flex-shrink-0 rounded-full border-2 ${
                          selectedService === service.id ? "border-[#6FB57F] bg-[#6FB57F]" : "border-[#CCCCCC]"
                        } flex items-center justify-center`}
                      >
                        {selectedService === service.id && <div className="h-3 w-3 rounded-full bg-white" />}
                      </div>
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl">
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
                            <span className="text-2xl">🌿</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#3A3A3A]">{service.name}</h3>
                        <p className="text-sm text-[#8B9E8B]">
                          {service.duration} min - €{parseFloat(service.price).toFixed(2)}
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => router.push(`/servico/${service.id}`)}
                      className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#E5E5E5] bg-white text-[#6FB57F] transition-colors hover:bg-[#F0F9F3] hover:border-[#6FB57F]"
                      aria-label="Ver detalhes"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                {hasMoreServices && !showAllServices && (
                  <button
                    onClick={() => setShowAllServices(true)}
                    className="flex items-center justify-center gap-2 rounded-2xl border-2 border-[#E5E5E5] bg-white p-4 text-[#6FB57F] transition-colors hover:bg-[#F0F9F3] hover:border-[#6FB57F]"
                  >
                    <span className="font-medium">Ver mais serviços</span>
                    <ChevronDown className="h-5 w-5" />
                  </button>
                )}
                {showAllServices && hasMoreServices && (
                  <button
                    onClick={() => setShowAllServices(false)}
                    className="flex items-center justify-center gap-2 rounded-2xl border-2 border-[#E5E5E5] bg-white p-4 text-[#8B9E8B] transition-colors hover:bg-[#F5F5F3]"
                  >
                    <span className="font-medium">Ver menos</span>
                    <ChevronDown className="h-5 w-5 rotate-180" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {professionals.length > 1 && (
          <div>
            <h2 className="mb-4 text-lg font-bold text-[#3A3A3A]">Escolha o(a) profissional</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {professionals.map((professional) => (
                <button
                  key={professional.id}
                  onClick={() => setSelectedProfessional(professional.id)}
                  className={`flex min-w-[120px] flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-colors ${
                    selectedProfessional === professional.id ? "border-[#6FB57F] bg-[#F0F9F3]" : "border-[#E5E5E5] bg-white"
                  }`}
                >
                  <div className="relative h-20 w-20 overflow-hidden rounded-full bg-[#E6C9B5]">
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

        <div>
          <h2 className="mb-4 text-lg font-bold text-[#3A3A3A]">Selecione a data e horário</h2>
          <div className="rounded-2xl bg-white p-4">
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-[#3A3A3A]">Data</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border border-[#E8F4EA] bg-[#F5F5F3] px-4 py-3 text-[#3A3A3A] focus:border-[#6FB57F] focus:outline-none"
              />
            </div>

            {loadingTimes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#6FB57F]" />
              </div>
            ) : availableTimes.length === 0 ? (
              <div className="rounded-lg bg-[#F5F5F3] p-4 text-center text-sm text-[#8B9E8B]">
                {selectedService && selectedProfessional && selectedDate
                  ? "Nenhum horário disponível para esta data"
                  : "Selecione o serviço, profissional e data para ver os horários disponíveis"}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableTimes.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`rounded-full py-3 text-sm font-medium transition-colors ${
                      time === selectedTime
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
        </div>
      </div>

      <div className="mt-8 px-6">
        <Button
          onClick={handleConfirmBooking}
          disabled={!selectedService || !selectedProfessional || !selectedDate || !selectedTime}
          className="h-14 w-full rounded-full bg-[#6FB57F] text-lg font-medium text-white hover:bg-[#5fa46e] disabled:opacity-50"
        >
          Confirmar Agendamento
        </Button>
      </div>
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F3]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6FB57F]" />
      </div>
    }>
      <BookingContent />
    </Suspense>
  )
}

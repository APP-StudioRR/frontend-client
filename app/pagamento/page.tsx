"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Copy, Upload, Loader2, Banknote } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { api } from "@/lib/api"

interface PaymentMethod {
  id: number
  type: 'MBWay' | 'IBAN' | 'Dinheiro' | 'Agendamento sem Pagar'
  enabled: boolean
  beneficiary_name?: string
  phone?: string
  iban?: string
}

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const serviceId = searchParams.get('service_id')
  const professionalId = searchParams.get('professional_id')
  const date = searchParams.get('date')
  const time = searchParams.get('time')
  const appointmentId = searchParams.get('appointment')
  const packageId = searchParams.get('package_id')
  const sessionsParam = searchParams.get('sessions')
  
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [appointment, setAppointment] = useState<any>(null)
  const [service, setService] = useState<any>(null)
  const [packageData, setPackageData] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadPaymentMethods()
    
    if (appointmentId) {
      loadAppointment()
    } else if (packageId && professionalId && sessionsParam) {
      loadPackageData()
      try {
        setSessions(JSON.parse(sessionsParam))
      } catch (e) {
        console.error('Erro ao parsear sessões:', e)
      }
    } else if (serviceId && professionalId && date && time) {
      loadServiceData()
    } else {
      router.push('/agendar')
    }
  }, [appointmentId, serviceId, professionalId, date, time, packageId, sessionsParam])

  const loadPaymentMethods = async () => {
    try {
      const response = await api.get('/payment-methods')
      
      if (response.success && response.data) {
        // Garantir que é um array
        const methods = Array.isArray(response.data) 
          ? response.data as PaymentMethod[]
          : []
        
        // O backend já retorna apenas métodos habilitados, mas vamos garantir
        const enabledMethods = methods.filter(m => m.enabled === true)
        
        // Verificar se "Agendamento sem Pagar" está ativo
        const semPagamentoMethod = enabledMethods.find(m => m.type === 'Agendamento sem Pagar')
        
        if (semPagamentoMethod) {
          // Se "Agendamento sem Pagar" estiver ativo, não mostrar outras opções
          setAvailablePaymentMethods([])
          setSelectedPaymentMethod(semPagamentoMethod)
        } else {
          // Filtrar métodos que não são "Agendamento sem Pagar" para exibição
          const methodsToShow = enabledMethods.filter(m => m.type !== 'Agendamento sem Pagar')
          setAvailablePaymentMethods(methodsToShow)
          // Selecionar o primeiro método disponível por padrão
          if (methodsToShow.length > 0) {
            setSelectedPaymentMethod(methodsToShow[0])
          } else {
            setSelectedPaymentMethod(null)
          }
        }
      } else {
        setAvailablePaymentMethods([])
        setSelectedPaymentMethod(null)
      }
    } catch (error: any) {
      console.error('Erro ao carregar métodos de pagamento:', error)
      // Em caso de erro, não mostrar métodos padrão - deixar vazio
      setAvailablePaymentMethods([])
      setSelectedPaymentMethod(null)
    }
  }

  const loadAppointment = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/client/appointments/${appointmentId}`)
      if (response.success && response.data) {
        setAppointment(response.data)
        setService(response.data.service)
      }
    } catch (error: any) {
      console.error('Erro ao carregar agendamento:', error)
      alert('Erro ao carregar informações do agendamento')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadServiceData = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/client/services/${serviceId}`)
      if (response.success && response.data) {
        setService(response.data)
      }
    } catch (error: any) {
      console.error('Erro ao carregar serviço:', error)
      alert('Erro ao carregar informações do serviço')
      router.push('/agendar')
    } finally {
      setLoading(false)
    }
  }

  const loadPackageData = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/client/packages/${packageId}`)
      if (response.success && response.data) {
        setPackageData(response.data)
      }
    } catch (error: any) {
      console.error('Erro ao carregar pacote:', error)
      alert('Erro ao carregar informações do pacote')
      router.push('/pacotes')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!selectedPaymentMethod) {
      alert('Por favor, selecione um método de pagamento')
      return
    }

    try {
      setSubmitting(true)

      if (appointmentId) {
        await api.put(`/client/appointments/${appointmentId}`, {
          payment_method: selectedPaymentMethod.type,
        })
        router.push(`/confirmacao?appointment=${appointmentId}`)
      } else if (packageId && professionalId && sessions.length > 0) {
        const response = await api.post('/client/appointments/package', {
          package_id: parseInt(packageId),
          professional_id: parseInt(professionalId),
          sessions: sessions,
          payment_method: selectedPaymentMethod.type,
        })

        if (response.success && response.data && response.data.length > 0) {
          router.push(`/confirmacao?appointment=${response.data[0].id}`)
        }
      } else {
        if (!serviceId || !professionalId || !date || !time) {
          alert('Dados do agendamento incompletos')
          router.push('/agendar')
          return
        }

        const response = await api.post('/client/appointments', {
          service_id: parseInt(serviceId),
          professional_id: parseInt(professionalId),
          date: date,
          time: time,
          payment_method: selectedPaymentMethod.type,
        })

        if (response.success && response.data) {
          router.push(`/confirmacao?appointment=${response.data.id}`)
        }
      }
    } catch (error: any) {
      console.error('Erro ao criar/atualizar agendamento:', error)
      alert(error.message || 'Erro ao processar agendamento. Verifique se o horário está disponível.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Data não disponível'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Data inválida'
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    } catch (e) {
      return 'Data inválida'
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F3]">
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
        <h1 className="text-xl font-semibold text-[#3A3A3A]">Pagamento do Agendamento</h1>
      </div>

      <div className="flex flex-col gap-6 px-6">
        <div className="flex items-center gap-4 rounded-2xl bg-white p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F4EA]">
            <Calendar className="h-6 w-6 text-[#6FB57F]" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[#3A3A3A]">
              {appointment?.service?.name || service?.name || packageData?.name || 'Serviço'}
            </h3>
            <p className="text-sm text-[#8B9E8B]">
              {appointment ? formatDate(appointment.date) : (date ? formatDate(date) : (packageData ? `${packageData.sessions} sessões` : 'Data não disponível'))}
            </p>
          </div>
          <span className="text-lg font-semibold text-[#3A3A3A]">
            {appointment?.time || time || (packageData ? `${sessions.length} agendadas` : '--:--')}
          </span>
        </div>

        {selectedPaymentMethod?.type === 'Agendamento sem Pagar' ? (
          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-5">
            <h2 className="mb-3 text-lg font-bold text-[#3A3A3A]">Informação de Pagamento</h2>
            <p className="text-sm text-blue-800">
              O pagamento será realizado no local no momento do atendimento. Não é necessário efetuar pagamento antecipado.
            </p>
          </div>
        ) : availablePaymentMethods.length > 0 ? (
          <div>
            <h2 className="mb-4 text-lg font-bold text-[#3A3A3A]">Selecione o método de pagamento</h2>
            <div className="flex gap-3 flex-wrap">
              {availablePaymentMethods.map((method) => {
                const isSelected = selectedPaymentMethod?.id === method.id
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-full border-2 py-3 text-sm font-medium transition-colors min-w-[120px] ${
                      isSelected
                        ? "border-[#6FB57F] bg-white text-[#6FB57F] shadow-sm"
                        : "border-[#E5E5E5] bg-white text-[#999999]"
                    }`}
                  >
                    {method.type === 'IBAN' && (
                      <Image
                        src="/iban-logo.svg"
                        alt="IBAN"
                        width={24}
                        height={24}
                        className="h-6 w-6 object-contain"
                      />
                    )}
                    {method.type === 'MBWay' && (
                      <Image
                        src="/mbway.png"
                        alt="MBWay"
                        width={24}
                        height={24}
                        className="h-6 w-6 object-contain"
                      />
                    )}
                    {method.type === 'Dinheiro' && (
                      <Banknote className="h-6 w-6" />
                    )}
                    {method.type === 'Dinheiro' ? 'Numerário' : method.type}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-4">
            <p className="text-sm text-yellow-800">
              Nenhum método de pagamento disponível no momento. Por favor, entre em contato com o estúdio.
            </p>
          </div>
        )}

        {selectedPaymentMethod && (
          <div className="rounded-2xl bg-[#F9F9F9] p-5">
            <div className="mb-3 flex justify-between">
              <span className="text-[#666666]">Valor a Pagar</span>
              <span className="text-xl font-bold text-[#3A3A3A]">
                €{appointment ? parseFloat(appointment.price).toFixed(2) : (packageData ? parseFloat(packageData.price).toFixed(2) : (service ? parseFloat(service.price).toFixed(2) : '0,00'))}
              </span>
            </div>
            {selectedPaymentMethod.beneficiary_name && (
              <div className="mb-3 flex justify-between">
                <span className="text-[#666666]">Beneficiário</span>
                <span className="font-semibold text-[#3A3A3A]">{selectedPaymentMethod.beneficiary_name}</span>
              </div>
            )}
            {selectedPaymentMethod.type === 'Dinheiro' ? (
              <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-sm text-blue-800">
                  O pagamento em numerário será realizado no local no momento do atendimento.
                </p>
              </div>
            ) : (selectedPaymentMethod.iban || selectedPaymentMethod.phone) && (
              <div className="flex items-center justify-between">
                <span className="text-[#666666]">
                  {selectedPaymentMethod.type === "IBAN" ? "IBAN" : "Número de Telefone"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-[#3A3A3A]">
                    {selectedPaymentMethod.type === "IBAN" 
                      ? (selectedPaymentMethod.iban || '') 
                      : (selectedPaymentMethod.phone || '')}
                  </span>
                  <button 
                    className="text-[#6FB57F]"
                    onClick={() => {
                      const textToCopy = selectedPaymentMethod.type === "IBAN" 
                        ? (selectedPaymentMethod.iban || '') 
                        : (selectedPaymentMethod.phone || '')
                      navigator.clipboard.writeText(textToCopy)
                      alert('Copiado!')
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedPaymentMethod?.type !== 'Agendamento sem Pagar' && (
          <div>
            <h2 className="mb-3 text-lg font-bold text-[#3A3A3A]">Comprovativo de Pagamento</h2>
            <p className="mb-4 text-sm text-[#666666]">
              Por favor, anexe o comprovativo de pagamento para confirmar o seu agendamento.
            </p>

            <button className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#6FB57F] bg-white py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F4EA]">
                <Upload className="h-6 w-6 text-[#6FB57F]" />
              </div>
              <div className="text-center">
                <span className="font-medium text-[#6FB57F]">Clique para carregar</span>
                <span className="text-[#999999]"> ou arraste e solte</span>
              </div>
              <p className="text-xs text-[#999999]">PNG, JPG ou PDF (MAX. 5MB)</p>
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 px-6">
        <Button
          onClick={handleComplete}
          disabled={submitting}
          className="h-14 w-full rounded-full bg-[#6FB57F] text-lg font-medium text-white hover:bg-[#5fa46e] disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processando...
            </>
          ) : (
            'Concluir Agendamento'
          )}
        </Button>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F3]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6FB57F]" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}

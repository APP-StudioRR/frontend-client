"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, Check, Loader2 } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { api } from "@/lib/api"

interface Service {
  id: number
  name: string
  description?: string
  duration: number
  price: string
  image_url?: string
  professionals?: Array<{
    id: number
    name: string
    specialty?: string
  }>
}

export default function ServiceDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const serviceId = params.id as string
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadService()
  }, [serviceId])

  const loadService = async () => {
    try {
      setLoading(true)
      const data = await api.get(`/client/services/${serviceId}`)
      if (data.success && data.data) {
        setService(data.data)
      }
    } catch (error: any) {
      console.error('Erro ao carregar serviço:', error)
      if (error.status === 404) {
        setService(null)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F3] px-6">
        <Loader2 className="h-8 w-8 animate-spin text-[#6FB57F]" />
      </div>
    )
  }

  if (!service) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F3] px-6">
        <h1 className="mb-4 text-2xl font-bold text-[#3A3A3A]">Serviço não encontrado</h1>
        <Button onClick={() => router.back()} className="rounded-full bg-[#6FB57F] text-white hover:bg-[#5fa46e]">
          Voltar
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
        <h1 className="text-xl font-semibold text-[#3A3A3A]">Detalhes do Serviço</h1>
      </div>

      <div className="flex flex-col gap-6 px-6">
        {/* Imagem do serviço */}
        <div className="relative h-64 w-full overflow-hidden rounded-3xl">
          {service.image_url ? (
            <Image src={service.image_url} alt={service.name} fill className="object-cover" sizes="100vw" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#E8F4EA]">
              <span className="text-4xl">🌿</span>
            </div>
          )}
        </div>

        {/* Informações principais */}
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <h2 className="mb-2 text-2xl font-bold text-[#3A3A3A]">{service.name}</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[#8B9E8B]">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm">{service.duration} min</span>
                </div>
                <div className="text-xl font-bold text-[#6FB57F]">€{parseFloat(service.price).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Descrição */}
        {service.description && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-lg font-bold text-[#3A3A3A]">Sobre o Serviço</h3>
            <p className="text-[#666666] leading-relaxed">{service.description}</p>
          </div>
        )}

        {/* Profissionais Disponíveis */}
        {service.professionals && service.professionals.length > 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-[#3A3A3A]">Profissionais Disponíveis</h3>
            <div className="flex flex-col gap-3">
              {service.professionals.map((professional) => (
                <div key={professional.id} className="flex items-center gap-3 rounded-lg bg-[#F5F5F3] p-3">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#E8F4EA]">
                    <Check className="h-3 w-3 text-[#6FB57F]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#3A3A3A]">{professional.name}</p>
                    {professional.specialty && (
                      <p className="text-sm text-[#8B9E8B]">{professional.specialty}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Botão de agendar */}
      <div className="mt-6 px-6">
        <Button
          onClick={() => router.push(`/agendar?service=${service.id}`)}
          className="h-14 w-full rounded-full bg-[#6FB57F] text-lg font-medium text-white hover:bg-[#5fa46e]"
        >
          Agendar Este Serviço
        </Button>
      </div>
    </div>
  )
}

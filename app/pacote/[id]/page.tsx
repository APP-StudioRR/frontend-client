"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Package, Check, Loader2, Calendar, Clock } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { api } from "@/lib/api"

interface PackageDetail {
  id: number
  name: string
  description?: string
  sessions: number
  price: string
  discount: number
  image_url?: string
  services?: Array<{
    id: number
    name: string
    pivot?: {
      quantity: number
    }
  }>
  professionals?: Array<{
    id: number
    name: string
    specialty?: string
    image_url?: string
  }>
}

interface MyPackage {
  id: number
  name: string
  used: number
  sessions: number
  remaining: number
  valid_until?: string
}

export default function PackageDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const packageId = params.id as string
  const [packageData, setPackageData] = useState<PackageDetail | null>(null)
  const [myPackage, setMyPackage] = useState<MyPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMyPackage, setLoadingMyPackage] = useState(true)

  useEffect(() => {
    loadPackage()
    loadMyPackage()
  }, [packageId])

  const loadPackage = async () => {
    try {
      setLoading(true)
      const data = await api.get(`/client/packages/${packageId}`)
      if (data.success && data.data) {
        setPackageData(data.data)
      }
    } catch (error: any) {
      console.error('Erro ao carregar pacote:', error)
      if (error.status === 404) {
        setPackageData(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadMyPackage = async () => {
    try {
      setLoadingMyPackage(true)
      const data = await api.get('/client/packages/my')
      if (data.success && data.data) {
        const found = data.data.find((pkg: MyPackage) => pkg.id === parseInt(packageId))
        if (found) {
          setMyPackage(found)
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar meu pacote:', error)
    } finally {
      setLoadingMyPackage(false)
    }
  }

  const calculateOriginalPrice = (price: string, discount: number) => {
    if (discount > 0) {
      const priceNum = parseFloat(price)
      const originalPrice = priceNum / (1 - discount / 100)
      return originalPrice.toFixed(2)
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F3] px-6">
        <Loader2 className="h-8 w-8 animate-spin text-[#6FB57F]" />
      </div>
    )
  }

  if (!packageData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F3] px-6">
        <h1 className="mb-4 text-2xl font-bold text-[#3A3A3A]">Pacote não encontrado</h1>
        <Button onClick={() => router.back()} className="rounded-full bg-[#6FB57F] text-white hover:bg-[#5fa46e]">
          Voltar
        </Button>
      </div>
    )
  }

  const originalPrice = calculateOriginalPrice(packageData.price, packageData.discount)
  const isMyPackage = !!myPackage

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F3] pb-24">
      <div className="flex items-center gap-4 px-6 py-6">
        <button onClick={() => router.back()} className="text-[#3A3A3A]">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-[#3A3A3A]">Detalhes do Pacote</h1>
      </div>

      <div className="flex flex-col gap-6 px-6">
        {/* Imagem do pacote */}
        <div className="relative h-64 w-full overflow-hidden rounded-3xl">
          {packageData.image_url ? (
            <Image src={packageData.image_url} alt={packageData.name} fill className="object-cover" sizes="100vw" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#E8F4EA]">
              <Package className="h-20 w-20 text-[#6FB57F]" />
            </div>
          )}
        </div>

        {/* Informações principais */}
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <h2 className="mb-2 text-2xl font-bold text-[#3A3A3A]">{packageData.name}</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[#8B9E8B]">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm">{packageData.sessions} sessões</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-[#6FB57F]">€{parseFloat(packageData.price).toFixed(2)}</span>
                  {originalPrice && (
                    <span className="text-sm text-[#8B9E8B] line-through">€{originalPrice}</span>
                  )}
                </div>
              </div>
              {packageData.discount > 0 && (
                <div className="mt-2">
                  <span className="rounded-full bg-[#6FB57F] px-3 py-1 text-xs font-semibold text-white">
                    -{packageData.discount}% de desconto
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Estatísticas do meu pacote */}
          {isMyPackage && myPackage && (
            <div className="mt-4 rounded-xl bg-[#E8F4EA] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-[#3A3A3A]">Progresso</span>
                <span className="text-sm font-bold text-[#6FB57F]">
                  {myPackage.used}/{myPackage.sessions} sessões
                </span>
              </div>
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[#6FB57F]"
                  style={{ width: `${(myPackage.used / myPackage.sessions) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-[#8B9E8B]">
                <span>{myPackage.remaining} sessões restantes</span>
                {myPackage.valid_until && (
                  <span>
                    Válido até {new Date(myPackage.valid_until).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Descrição */}
        {packageData.description && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-lg font-bold text-[#3A3A3A]">Sobre o Pacote</h3>
            <p className="text-[#666666] leading-relaxed">{packageData.description}</p>
          </div>
        )}

        {/* Serviços Incluídos */}
        {packageData.services && packageData.services.length > 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-[#3A3A3A]">Serviços Incluídos</h3>
            <div className="flex flex-col gap-3">
              {packageData.services.map((service) => (
                <div key={service.id} className="flex items-center justify-between rounded-lg bg-[#F5F5F3] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#E8F4EA]">
                      <Check className="h-3 w-3 text-[#6FB57F]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#3A3A3A]">{service.name}</p>
                      {service.pivot && service.pivot.quantity > 1 && (
                        <p className="text-sm text-[#8B9E8B]">Quantidade: {service.pivot.quantity}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profissionais Disponíveis */}
        {packageData.professionals && packageData.professionals.length > 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-[#3A3A3A]">Profissionais Disponíveis</h3>
            <div className="flex flex-col gap-3">
              {packageData.professionals.map((professional) => (
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

      {/* Botões de ação */}
      <div className="mt-6 flex flex-col gap-3 px-6 pb-6">
        {isMyPackage && myPackage ? (
          <>
            {myPackage.remaining > 0 ? (
              <>
                <Button
                  onClick={() => router.push(`/agendar-pacote?package=${packageId}&mode=next`)}
                  className="h-14 w-full rounded-full bg-[#6FB57F] text-lg font-medium text-white hover:bg-[#5fa46e]"
                >
                  Agendar Próxima Sessão
                </Button>
                {myPackage.remaining > 1 && (
                  <Button
                    onClick={() => router.push(`/agendar-pacote?package=${packageId}&mode=all`)}
                    className="h-14 w-full rounded-full border-2 border-[#6FB57F] bg-white text-lg font-medium text-[#6FB57F] hover:bg-[#E8F4EA]"
                  >
                    Agendar Todas ({myPackage.remaining} sessões)
                  </Button>
                )}
                <Button
                  onClick={() => router.push('/sessoes')}
                  variant="outline"
                  className="h-12 w-full rounded-full border-[#dbe6db] bg-white text-[#3A3A3A] hover:bg-[#F5F5F3]"
                >
                  Ver Minhas Sessões
                </Button>
              </>
            ) : (
              <Button
                onClick={() => router.push('/sessoes')}
                className="h-14 w-full rounded-full bg-[#6FB57F] text-lg font-medium text-white hover:bg-[#5fa46e]"
              >
                Ver Minhas Sessões
              </Button>
            )}
          </>
        ) : (
          <Button
            onClick={() => router.push(`/agendar-pacote?package=${packageId}`)}
            className="h-14 w-full rounded-full bg-[#6FB57F] text-lg font-medium text-white hover:bg-[#5fa46e]"
          >
            Agendar Este Pacote
          </Button>
        )}
      </div>
    </div>
  )
}





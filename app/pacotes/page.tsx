"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronRight, Package, Sparkles, Droplet, Activity, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"

interface Package {
  id: number
  name: string
  description?: string
  sessions: number
  price: string
  discount: number
  active: boolean
  image?: string | null
  image_url?: string
  services?: Array<{
    id: number
    name: string
    pivot?: {
      quantity: number
    }
  }>
}

const iconMap = [Sparkles, Droplet, Activity]

export default function PackagesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [packages, setPackages] = useState<Package[]>([])
  const [myPackages, setMyPackages] = useState<Array<{
    id: number
    name: string
    used: number
    sessions: number
    remaining: number
    valid_until?: string
    image_url?: string
  }>>([])
  const [loadingMyPackages, setLoadingMyPackages] = useState(true)

  useEffect(() => {
    loadPackages()
    loadMyPackages()
  }, [])

  const loadPackages = async () => {
    try {
      setLoading(true)
      const data = await api.get('/client/packages')
      if (data.success && data.data) {
        setPackages(data.data || [])
      }
    } catch (err: any) {
      console.error('Erro ao carregar pacotes:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMyPackages = async () => {
    try {
      setLoadingMyPackages(true)
      const data = await api.get('/client/packages/my')
      if (data.success && data.data) {
        setMyPackages(data.data || [])
      } else {
        setMyPackages([])
      }
    } catch (err: any) {
      console.error('Erro ao carregar meus pacotes:', err)
      setMyPackages([])
    } finally {
      setLoadingMyPackages(false)
    }
  }

  const getIcon = (index: number) => {
    return iconMap[index % iconMap.length]
  }

  const calculateOriginalPrice = (price: string, discount: number) => {
    if (discount > 0) {
      const priceNum = parseFloat(price)
      const originalPrice = priceNum / (1 - discount / 100)
      return `€${originalPrice.toFixed(2)}`
    }
    return null
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
        <h1 className="text-xl font-semibold text-[#3A3A3A]">
          {myPackages.length > 0 ? "Meus Pacotes" : "Pacotes Disponíveis"}
        </h1>
      </div>

      {loadingMyPackages ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#6FB57F]" />
        </div>
      ) : myPackages.length > 0 ? (
        <div className="flex flex-col gap-4 px-6">
          <h2 className="mb-2 text-xl font-bold text-[#3A3A3A]">Meus Pacotes</h2>
          {myPackages.map((pkg) => {
            const validUntilDate = pkg.valid_until ? new Date(pkg.valid_until).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }) : null
            
            return (
              <button
                key={pkg.id}
                onClick={() => router.push(`/pacote/${pkg.id}`)}
                className="flex items-center gap-4 rounded-3xl bg-white p-5 text-left shadow-sm"
              >
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl">
                  {pkg.image_url ? (
                    <Image
                      src={pkg.image_url}
                      alt={pkg.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#E8F4EA]">
                      <Package className="h-8 w-8 text-[#6FB57F]" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-bold text-[#3A3A3A]">{pkg.name}</h3>
                  <p className="text-sm text-[#8B9E8B]">
                    {pkg.used} de {pkg.sessions} sessões usadas • {pkg.remaining} restantes
                  </p>
                  {validUntilDate && (
                    <p className="mt-1 text-xs text-[#8B9E8B]">Válido até {validUntilDate}</p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-[#CCCCCC]" />
              </button>
            )
          })}
        </div>
      ) : null}

      <div className={myPackages.length > 0 ? "px-6" : "flex flex-col gap-6 px-6"}>
        {myPackages.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F4EA]">
                <Package className="h-8 w-8 text-[#6FB57F]" />
              </div>
              <h2 className="mb-2 text-lg font-bold text-[#3A3A3A]">Você ainda não tem pacotes</h2>
              <p className="text-sm text-[#8B9E8B]">
                Adquira um pacote e aproveite descontos exclusivos nas sessões
              </p>
            </div>
          </div>
        )}

        <div className={myPackages.length > 0 ? "mt-6" : ""}>
          <h2 className="mb-4 text-xl font-bold text-[#3A3A3A]">Pacotes Disponíveis</h2>
            {packages.length === 0 ? (
              <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
                <p className="text-[#8B9E8B]">Nenhum pacote disponível no momento.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {packages.map((pkg, index) => {
                  const IconComponent = getIcon(index)
                  const originalPrice = calculateOriginalPrice(pkg.price, pkg.discount)
                  
                  return (
                    <div key={pkg.id} className="overflow-hidden rounded-3xl bg-white shadow-sm">
                      <div className="relative h-40 w-full bg-gradient-to-br from-[#E8F4EA] to-[#6FB57F]/20">
                        {pkg.image_url ? (
                          <Image
                            src={pkg.image_url}
                            alt={pkg.name}
                            fill
                            className="object-cover"
                            sizes="100vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <IconComponent className="h-20 w-20 text-[#6FB57F]/30" />
                          </div>
                        )}
                        {pkg.discount > 0 && (
                          <div className="absolute right-4 top-4 rounded-full bg-[#6FB57F] px-3 py-1 text-xs font-semibold text-white">
                            -{pkg.discount}%
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-2">
                              <IconComponent className="h-5 w-5 text-[#6FB57F]" />
                              <h3 className="text-lg font-bold text-[#3A3A3A]">{pkg.name}</h3>
                            </div>
                            {pkg.description && (
                              <p className="mb-3 text-sm text-[#8B9E8B]">{pkg.description}</p>
                            )}
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-[#3A3A3A]">
                                €{parseFloat(pkg.price).toFixed(2)}
                              </span>
                              {originalPrice && (
                                <span className="text-sm text-[#8B9E8B] line-through">
                                  {originalPrice}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-[#8B9E8B]">{pkg.sessions} sessões</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => router.push(`/agendar-pacote?package=${pkg.id}`)}
                          className="h-12 w-full rounded-full bg-[#6FB57F] text-sm font-medium text-white hover:bg-[#5fa46e]"
                        >
                          Agendar Pacote
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
    </div>
  )
}

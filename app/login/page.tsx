"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { api } from "@/lib/api"
import { CountrySelector, type Country, europeanCountries } from "@/components/country-selector"

const formatPhoneNumber = (value: string, maxLength: number = 9): string => {
  const numbers = value.replace(/\D/g, '')
  
  if (numbers.length <= 3) {
    return numbers
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)} ${numbers.slice(3)}`
  } else {
    return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, maxLength)}`
  }
}

export default function LoginPage() {
  const router = useRouter()
  const [selectedCountry, setSelectedCountry] = useState<Country>(europeanCountries[0])
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [successLoading, setSuccessLoading] = useState(false)
  const [error, setError] = useState("")

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maxLength = selectedCountry.code === 'PT' ? 9 : 15
    const formatted = formatPhoneNumber(e.target.value, maxLength)
    setPhone(formatted)
    setError("")
  }

  const handleContinue = async () => {
    if (!phone) {
      setError("Por favor, insira seu número de telefone")
      return
    }

    const phoneNumbers = phone.replace(/\s/g, '')
    const minLength = selectedCountry.code === 'PT' ? 9 : 6
    if (phoneNumbers.length < minLength) {
      setError("Por favor, insira um número de telefone válido")
      return
    }

    setLoading(true)
    setError("")

    try {
      const fullPhone = `${selectedCountry.dialCode}${phoneNumbers}`
      
      const data = await api.post('/auth/client/login', { phone: fullPhone })

      if (data.success) {
        setSuccessLoading(true)
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        
        setTimeout(() => {
          router.push("/dashboard")
        }, 1000)
      } else if (data.code === 'CLIENT_NOT_FOUND' || data.requires_registration) {
        setLoading(false)
        setTimeout(() => {
          router.push(`/cadastro?phone=${encodeURIComponent(fullPhone)}&country=${selectedCountry.code}`)
        }, 500)
      } else {
        setError(data.message || 'Erro ao fazer login')
        setLoading(false)
      }
    } catch (err: any) {
      if (err.code === 'CLIENT_NOT_FOUND' || err.requires_registration) {
        const phoneNumbers = phone.replace(/\s/g, '')
        const fullPhone = `${selectedCountry.dialCode}${phoneNumbers}`
        setLoading(false)
        setTimeout(() => {
          router.push(`/cadastro?phone=${encodeURIComponent(fullPhone)}&country=${selectedCountry.code}`)
        }, 500)
      } else {
        setError(err.message || 'Erro ao conectar com o servidor. Verifique se a API está rodando.')
        setLoading(false)
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F3] px-6">
      <div className="mb-6 mt-16 flex justify-center">
        <Image
          src="/images/logo.png"
          alt="Studio Regiane Rodrigues"
          width={220}
          height={220}
          className="h-44 w-auto"
          priority
        />
      </div>

      <div className="mt-8">
        <h1 className="mb-4 text-center text-balance text-4xl font-bold text-[#3A3A3A]">Bem-vinda(o)!</h1>
        <p className="mb-8 text-center text-base text-[#666666]">Insira seu número de celular para continuar</p>

        <div className="mb-6 flex items-center gap-2 rounded-full border border-[#D9D9D9] bg-white px-4 py-3">
          <CountrySelector
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
            disabled={loading || successLoading}
          />
          <div className="h-6 w-px bg-[#D9D9D9]" />
          <input
            type="tel"
            placeholder={selectedCountry.code === 'PT' ? "912 345 678" : "Número de telefone"}
            value={phone}
            onChange={handlePhoneChange}
            maxLength={selectedCountry.code === 'PT' ? 11 : 20}
            className="flex-1 bg-transparent text-base text-[#3A3A3A] placeholder:text-[#CCCCCC] focus:outline-none"
            disabled={loading || successLoading}
          />
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {successLoading && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 text-center">
            Login realizado com sucesso! Redirecionando...
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4">
        <Button
          onClick={handleContinue}
          disabled={loading || successLoading}
          className="h-14 rounded-full bg-[#6FB57F] text-lg font-medium text-white hover:bg-[#5fa46e] disabled:opacity-50"
        >
          {successLoading ? 'Redirecionando...' : loading ? 'Verificando...' : 'Continuar'}
        </Button>

        <button
          onClick={() => router.push('/cadastro')}
          className="text-base text-[#6FB57F] underline"
        >
          Criar conta
        </button>
        </div>
      </div>
    </div>
  )
}

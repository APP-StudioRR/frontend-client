"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedCountry, setSelectedCountry] = useState<Country>(europeanCountries[0])
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [successLoading, setSuccessLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const phoneParam = searchParams.get('phone')
    const countryParam = searchParams.get('country')
    
    let country = europeanCountries[0]
    if (countryParam) {
      const foundCountry = europeanCountries.find(c => c.code === countryParam)
      if (foundCountry) {
        country = foundCountry
        setSelectedCountry(foundCountry)
      }
    }
    
    if (phoneParam) {
      const dialCode = country.dialCode
      const phoneWithoutPrefix = phoneParam.replace(dialCode, '').replace(/\s/g, '')
      const maxLength = country.code === 'PT' ? 9 : 15
      setPhone(formatPhoneNumber(phoneWithoutPrefix, maxLength))
    }
  }, [searchParams])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maxLength = selectedCountry.code === 'PT' ? 9 : 15
    const formatted = formatPhoneNumber(e.target.value, maxLength)
    setPhone(formatted)
    setError("")
  }

  const handleCreateAccount = async () => {
    if (!name || !phone) {
      setError("Por favor, preencha todos os campos")
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
      
      const data = await api.post('/auth/client/register', { name, phone: fullPhone })

      if (data.success) {
        setSuccessLoading(true)
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        
        setTimeout(() => {
          router.push("/dashboard")
        }, 1000)
      } else {
        setError(data.message || 'Erro ao criar conta')
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com o servidor')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F3] px-6">
      <div className="mb-6 mt-8 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-[#3A3A3A]">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-semibold text-[#3A3A3A]">Crie a sua conta</h2>
      </div>

      <div className="mb-8 mt-8">
        <h1 className="mb-4 text-balance text-4xl font-bold text-[#3A3A3A]">Bem-vinda(o)!</h1>
        <p className="text-base text-[#666666]">Insira os seus dados para começar a agendar.</p>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <label className="mb-2 block text-base font-medium text-[#3A3A3A]">Nome Completo</label>
            <Input
            placeholder="Ana Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-14 rounded-full border-[#D9D9D9] bg-white px-6 text-base placeholder:text-[#CCCCCC]"
            required
            disabled={loading || successLoading}
          />
        </div>

        <div>
          <label className="mb-2 block text-base font-medium text-[#3A3A3A]">Telemóvel</label>
          <div className="flex h-14 items-center gap-3 rounded-full border border-[#D9D9D9] bg-white px-6">
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
              required
              disabled={loading || successLoading}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {successLoading && (
        <div className="mb-4 mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-600 text-center">
          Conta criada com sucesso! Redirecionando...
        </div>
      )}

      <div className="mb-8 mt-auto">
        <Button
          onClick={handleCreateAccount}
          disabled={loading || successLoading}
          className="mb-4 h-14 w-full rounded-full bg-[#6FB57F] text-lg font-medium text-white hover:bg-[#5fa46e] disabled:opacity-50"
        >
          {successLoading ? 'Redirecionando...' : loading ? 'Criando conta...' : 'Criar Conta'}
        </Button>

        <p className="text-center text-sm text-[#999999]">
          Ao criar a sua conta, concorda com os nossos{" "}
          <a href="#" className="text-[#6FB57F] underline">
            Termos de Serviço
          </a>{" "}
          e{" "}
          <a href="#" className="text-[#6FB57F] underline">
            Política de Privacidade
          </a>
          .
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F3]">
        <div className="text-center">
          <p className="text-[#3A3A3A]">Carregando...</p>
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}

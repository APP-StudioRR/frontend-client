"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Calendar } from "lucide-react"
import { useState, useEffect, Suspense, useRef } from "react"
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

const formatDateToDisplay = (dateString: string): string => {
  if (!dateString) return ""
  // Converte de YYYY-MM-DD para DD/MM/YYYY
  const [year, month, day] = dateString.split('-')
  if (year && month && day) {
    return `${day}/${month}/${year}`
  }
  return dateString
}

const formatDateToInput = (dateString: string): string => {
  if (!dateString) return ""
  // Se já está no formato YYYY-MM-DD, retorna como está
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString
  }
  // Converte de DD/MM/YYYY para YYYY-MM-DD
  const parts = dateString.replace(/\D/g, '')
  if (parts.length === 8) {
    const day = parts.slice(0, 2)
    const month = parts.slice(2, 4)
    const year = parts.slice(4, 8)
    return `${year}-${month}-${day}`
  }
  return dateString
}

const formatDateInput = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '')
  
  if (numbers.length === 0) return ""
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
}

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedCountry, setSelectedCountry] = useState<Country>(europeanCountries[0])
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [dateOfBirthDisplay, setDateOfBirthDisplay] = useState("")
  const [loading, setLoading] = useState(false)
  const [successLoading, setSuccessLoading] = useState(false)
  const [error, setError] = useState("")
  const dateInputRef = useRef<HTMLInputElement>(null)

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
    if (!name || !phone || (!dateOfBirth && !dateOfBirthDisplay)) {
      setError("Por favor, preencha todos os campos")
      return
    }

    const phoneNumbers = phone.replace(/\s/g, '')
    const minLength = selectedCountry.code === 'PT' ? 9 : 6
    if (phoneNumbers.length < minLength) {
      setError("Por favor, insira um número de telefone válido")
      return
    }

    // Garantir que a data está no formato correto
    let finalDateOfBirth = dateOfBirth
    if (!finalDateOfBirth && dateOfBirthDisplay) {
      finalDateOfBirth = formatDateToInput(dateOfBirthDisplay)
      if (!finalDateOfBirth.match(/^\d{4}-\d{2}-\d{2}$/)) {
        setError("Por favor, insira uma data de nascimento válida (DD/MM/AAAA)")
        return
      }
    }

    if (!finalDateOfBirth) {
      setError("Por favor, insira uma data de nascimento válida")
      return
    }

    setLoading(true)
    setError("")

    try {
      const fullPhone = `${selectedCountry.dialCode}${phoneNumbers}`
      
      const data = await api.post('/auth/client/register', { 
        name, 
        phone: fullPhone,
        date_of_birth: finalDateOfBirth
      })

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

        <div>
          <label className="mb-2 block text-base font-medium text-[#3A3A3A]">Data de Nascimento</label>
          <div className="relative">
            <Input
              type="text"
              value={dateOfBirthDisplay}
              onChange={(e) => {
                const formatted = formatDateInput(e.target.value)
                setDateOfBirthDisplay(formatted)
                if (formatted.replace(/\D/g, '').length === 8) {
                  const converted = formatDateToInput(formatted)
                  setDateOfBirth(converted)
                } else {
                  setDateOfBirth("")
                }
              }}
              placeholder="DD/MM/AAAA"
              maxLength={10}
              className="h-14 rounded-full border-[#D9D9D9] bg-white px-6 pr-12 text-base placeholder:text-[#CCCCCC]"
              required
              disabled={loading || successLoading}
            />
            <input
              ref={dateInputRef}
              type="date"
              value={dateOfBirth}
              onChange={(e) => {
                setDateOfBirth(e.target.value)
                setDateOfBirthDisplay(formatDateToDisplay(e.target.value))
              }}
              max={new Date().toISOString().split('T')[0]}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => dateInputRef.current?.showPicker()}
              disabled={loading || successLoading}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6FB57F] hover:text-[#5fa46e] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar className="h-5 w-5" />
            </button>
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

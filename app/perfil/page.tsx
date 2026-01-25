"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Pencil, Bell, Calendar } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { CountrySelector, type Country, europeanCountries } from "@/components/country-selector"

const formatPhoneNumber = (value: string, maxLength: number = 9): string => {
  if (!value) return ""
  
  const numbers = value.replace(/\D/g, '')
  
  if (numbers.length === 0) {
    return ""
  } else if (numbers.length <= 3) {
    return numbers
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)} ${numbers.slice(3)}`
  } else {
    return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, maxLength)}`
  }
}

const formatDateToDisplay = (dateString: string): string => {
  if (!dateString) return ""
  
  // Se for formato ISO completo (com timestamp), extrai apenas a data
  let dateOnly = dateString
  if (dateString.includes('T')) {
    dateOnly = dateString.split('T')[0]
  }
  
  // Converte de YYYY-MM-DD para DD/MM/YYYY
  const [year, month, day] = dateOnly.split('-')
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

export default function ProfilePage() {
  const router = useRouter()
  const [selectedCountry, setSelectedCountry] = useState<Country>(europeanCountries[0])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [originalPhone, setOriginalPhone] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [dateOfBirthDisplay, setDateOfBirthDisplay] = useState("")
  const [avatar, setAvatar] = useState("")
  const [avatarPreview, setAvatarPreview] = useState("")
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false)
  const [showPhoneConfirmDialog, setShowPhoneConfirmDialog] = useState(false)
  const [pendingPhone, setPendingPhone] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadProfile()
    
    if ("Notification" in window) {
      setPushNotificationsEnabled(Notification.permission === "granted")
    }
  }, [])

  const loadProfile = async () => {
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
        setName(user.name || "")
        setEmail(user.email || "")
        
        // Processar data de nascimento
        if (user.date_of_birth) {
          let dateValue = user.date_of_birth
          // Se for formato ISO completo, extrai apenas a data (YYYY-MM-DD)
          if (dateValue.includes('T')) {
            dateValue = dateValue.split('T')[0]
          }
          setDateOfBirth(dateValue)
          setDateOfBirthDisplay(formatDateToDisplay(dateValue))
        } else {
          setDateOfBirth("")
          setDateOfBirthDisplay("")
        }
        
        if (user.avatar_url) {
          setAvatar(user.avatar_url)
          setAvatarPreview(user.avatar_url)
        } else {
          setAvatar("")
          setAvatarPreview("")
        }
        
        if (user.phone) {
          const phoneString = String(user.phone).trim()
          let phoneWithoutCode = phoneString
          let country = europeanCountries[0]
          
          const sortedCountries = [...europeanCountries].sort((a, b) => b.dialCode.length - a.dialCode.length)
          
          for (const c of sortedCountries) {
            if (phoneString.startsWith(c.dialCode)) {
              country = c
              phoneWithoutCode = phoneString.replace(c.dialCode, '').trim()
              break
            }
          }
          
          setSelectedCountry(country)
          
          const maxLength = country.code === 'PT' ? 9 : 15
          const cleanedPhone = phoneWithoutCode.replace(/\D/g, '')
          const formattedPhone = formatPhoneNumber(cleanedPhone, maxLength)
          
          setPhone(formattedPhone)
          setOriginalPhone(formattedPhone)
        } else {
          setPhone("")
          setOriginalPhone("")
        }
      }
    } catch (err: any) {
      if (err.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      } else {
        setError('Erro ao carregar perfil')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePushNotificationsToggle = async (enabled: boolean) => {
    if (enabled) {
      if ("Notification" in window) {
        try {
          const permission = await Notification.requestPermission()
          if (permission === "granted") {
            setPushNotificationsEnabled(true)
            // Limpar flag de desativado manualmente
            localStorage.removeItem("notificationsManuallyDisabled")
            // Criar notificação de teste
            new Notification("Notificações Ativadas!", {
              body: "Você receberá notificações sobre seus agendamentos e pacotes.",
              icon: "/icon-192.png",
            })
          } else {
            setPushNotificationsEnabled(false)
          }
        } catch (error) {
          console.error("Erro ao solicitar permissão de notificações:", error)
          setPushNotificationsEnabled(false)
        }
      }
    } else {
      setPushNotificationsEnabled(false)
      // Marcar como desativado manualmente no perfil
      localStorage.setItem("notificationsManuallyDisabled", "true")
      // Limpar flag de card fechado para que apareça novamente no dashboard
      localStorage.removeItem("notificationCardDismissed")
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maxLength = selectedCountry.code === 'PT' ? 9 : 15
    const formatted = formatPhoneNumber(e.target.value, maxLength)
    setPhone(formatted)
    setError("")
  }

  const handlePhoneBlur = () => {
    if (phone !== originalPhone && phone.trim() !== "") {
      setPendingPhone(phone)
      setShowPhoneConfirmDialog(true)
    }
  }

  const handleConfirmPhoneChange = () => {
    setOriginalPhone(pendingPhone)
    setShowPhoneConfirmDialog(false)
  }

  const handleCancelPhoneChange = () => {
    setPhone(originalPhone)
    setShowPhoneConfirmDialog(false)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 10MB')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const phoneNumbers = phone.replace(/\s/g, '')
      const fullPhone = `${selectedCountry.dialCode}${phoneNumbers}`

      const formData = new FormData()
      formData.append('name', name)
      formData.append('phone', fullPhone)
      
      if (email) {
        formData.append('email', email)
      }
      
      // Data de nascimento não pode ser atualizada, apenas visualizada

      const fileInput = fileInputRef.current
      if (fileInput?.files?.[0]) {
        formData.append('avatar', fileInput.files[0])
      }

      const data = await api.request('/client/profile', {
        method: 'PUT',
        body: formData,
      })

      if (data.success) {
        setSuccess('Perfil atualizado com sucesso!')
        setOriginalPhone(phone)
        
        if (data.data.avatar_url) {
          setAvatar(data.data.avatar_url)
          setAvatarPreview(data.data.avatar_url)
        }
        
        const userData = {
          ...JSON.parse(localStorage.getItem('user') || '{}'),
          ...data.data
        }
        localStorage.setItem('user', JSON.stringify(userData))
        
        setTimeout(() => {
          setSuccess("")
        }, 3000)
      }
    } catch (err: any) {
      if (err.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      } else {
        setError(err.message || 'Erro ao salvar perfil')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F3]">
        <div className="text-center">
          <p className="text-[#3A3A3A]">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F3] pb-24">
      <div className="flex items-center gap-4 px-6 py-6">
        <button onClick={() => router.back()} className="text-[#3A3A3A]">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-[#3A3A3A]">Perfil</h1>
      </div>

      <div className="mb-8 flex flex-col items-center px-6">
        <div className="relative mb-4">
          <div className="h-32 w-32 overflow-hidden rounded-full bg-[#6FB57F] flex items-center justify-center">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span className="text-5xl font-bold text-white">
                {name ? name.charAt(0).toUpperCase() : "U"}
              </span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
            className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#6FB57F] shadow-lg disabled:opacity-50"
          >
            <Pencil className="h-5 w-5 text-white" />
          </button>
        </div>
        <h2 className="mb-1 text-2xl font-bold text-[#3A3A3A]">{name || "Usuário"}</h2>
        <p className="text-[#8B9E8B]">{email || "Sem email"}</p>
      </div>

      {error && (
        <div className="mx-6 mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mx-6 mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">
          {success}
        </div>
      )}

      <div className="flex flex-col gap-6 px-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#3A3A3A]">Nome</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-14 rounded-2xl border-[#E5E5E5] bg-white px-5"
            disabled={saving}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#3A3A3A]">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 rounded-2xl border-[#E5E5E5] bg-white px-5"
            disabled={saving}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#3A3A3A]">Número de Telefone</label>
          <div className="flex h-14 items-center gap-3 rounded-2xl border border-[#E5E5E5] bg-white px-5">
            <CountrySelector
              selectedCountry={selectedCountry}
              onCountryChange={setSelectedCountry}
              disabled={saving}
            />
            <div className="h-6 w-px bg-[#E5E5E5]" />
            <input
              ref={phoneInputRef}
              type="tel"
              placeholder={selectedCountry.code === 'PT' ? "912 345 678" : "Número de telefone"}
              value={phone}
              onChange={handlePhoneChange}
              onBlur={handlePhoneBlur}
              maxLength={selectedCountry.code === 'PT' ? 11 : 20}
              className="flex-1 bg-transparent text-base text-[#3A3A3A] placeholder:text-[#CCCCCC] focus:outline-none"
              disabled={saving}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#3A3A3A]">Data de Nascimento</label>
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
                }
              }}
              placeholder="DD/MM/AAAA"
              maxLength={10}
              className="h-14 rounded-2xl border-[#E5E5E5] bg-gray-50 px-5 pr-12"
              disabled={true}
              readOnly
            />
            <input
              ref={dateInputRef}
              type="date"
              value={dateOfBirth}
              onChange={(e) => {
                setDateOfBirth(e.target.value)
                setDateOfBirthDisplay(formatDateToDisplay(e.target.value))
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => dateInputRef.current?.showPicker()}
              disabled={true}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#618961] hover:text-[#83c983] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-bold text-[#3A3A3A]">Notificações</h3>
          <div className="rounded-2xl bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F4EA]">
                  <Bell className="h-5 w-5 text-[#6FB57F]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#3A3A3A]">Notificações Push</h4>
                  <p className="text-sm text-[#8B9E8B]">
                    {pushNotificationsEnabled ? "Ativadas" : "Desativadas"}
                  </p>
                </div>
              </div>
              <Switch
                checked={pushNotificationsEnabled}
                onCheckedChange={handlePushNotificationsToggle}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 px-6">
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="h-14 w-full rounded-full bg-[#6FB57F] text-lg font-medium text-white hover:bg-[#5fa46e] disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>

        <button 
          onClick={handleLogout}
          className="text-base font-medium text-red-500 hover:underline"
        >
          Sair (Logout)
        </button>
      </div>

      {/* Diálogo de confirmação de alteração de telefone */}
      <AlertDialog open={showPhoneConfirmDialog} onOpenChange={setShowPhoneConfirmDialog}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-[#3A3A3A]">
              Alterar número de telefone?
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-base text-[#666666]">
              Ao alterar seu telefone, seu acesso será com o número novo. Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={handleConfirmPhoneChange}
              className="h-12 w-full rounded-full bg-[#6FB57F] text-base font-medium text-white hover:bg-[#5fa46e]"
            >
              Sim, alterar
            </AlertDialogAction>
            <AlertDialogCancel
              onClick={handleCancelPhoneChange}
              className="h-12 w-full rounded-full border-[#E5E5E5] bg-white text-base font-medium text-[#666666] hover:bg-[#F5F5F3]"
            >
              Cancelar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

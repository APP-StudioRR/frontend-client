"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"

export interface Country {
  code: string
  name: string
  dialCode: string
  flag: string
}

const europeanCountries: Country[] = [
  { code: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹" },
  { code: "ES", name: "Espanha", dialCode: "+34", flag: "🇪🇸" },
  { code: "FR", name: "França", dialCode: "+33", flag: "🇫🇷" },
  { code: "IT", name: "Itália", dialCode: "+39", flag: "🇮🇹" },
  { code: "DE", name: "Alemanha", dialCode: "+49", flag: "🇩🇪" },
  { code: "GB", name: "Reino Unido", dialCode: "+44", flag: "🇬🇧" },
  { code: "IE", name: "Irlanda", dialCode: "+353", flag: "🇮🇪" },
  { code: "BE", name: "Bélgica", dialCode: "+32", flag: "🇧🇪" },
  { code: "NL", name: "Países Baixos", dialCode: "+31", flag: "🇳🇱" },
  { code: "LU", name: "Luxemburgo", dialCode: "+352", flag: "🇱🇺" },
  { code: "AT", name: "Áustria", dialCode: "+43", flag: "🇦🇹" },
  { code: "CH", name: "Suíça", dialCode: "+41", flag: "🇨🇭" },
  { code: "PL", name: "Polônia", dialCode: "+48", flag: "🇵🇱" },
  { code: "CZ", name: "República Tcheca", dialCode: "+420", flag: "🇨🇿" },
  { code: "SK", name: "Eslováquia", dialCode: "+421", flag: "🇸🇰" },
  { code: "HU", name: "Hungria", dialCode: "+36", flag: "🇭🇺" },
  { code: "RO", name: "Romênia", dialCode: "+40", flag: "🇷🇴" },
  { code: "BG", name: "Bulgária", dialCode: "+359", flag: "🇧🇬" },
  { code: "GR", name: "Grécia", dialCode: "+30", flag: "🇬🇷" },
  { code: "HR", name: "Croácia", dialCode: "+385", flag: "🇭🇷" },
  { code: "SI", name: "Eslovênia", dialCode: "+386", flag: "🇸🇮" },
  { code: "EE", name: "Estônia", dialCode: "+372", flag: "🇪🇪" },
  { code: "LV", name: "Letônia", dialCode: "+371", flag: "🇱🇻" },
  { code: "LT", name: "Lituânia", dialCode: "+370", flag: "🇱🇹" },
  { code: "FI", name: "Finlândia", dialCode: "+358", flag: "🇫🇮" },
  { code: "SE", name: "Suécia", dialCode: "+46", flag: "🇸🇪" },
  { code: "DK", name: "Dinamarca", dialCode: "+45", flag: "🇩🇰" },
  { code: "NO", name: "Noruega", dialCode: "+47", flag: "🇳🇴" },
  { code: "IS", name: "Islândia", dialCode: "+354", flag: "🇮🇸" },
  { code: "MT", name: "Malta", dialCode: "+356", flag: "🇲🇹" },
  { code: "CY", name: "Chipre", dialCode: "+357", flag: "🇨🇾" },
  { code: "AL", name: "Albânia", dialCode: "+355", flag: "🇦🇱" },
  { code: "BA", name: "Bósnia e Herzegovina", dialCode: "+387", flag: "🇧🇦" },
  { code: "ME", name: "Montenegro", dialCode: "+382", flag: "🇲🇪" },
  { code: "RS", name: "Sérvia", dialCode: "+381", flag: "🇷🇸" },
  { code: "MK", name: "Macedônia do Norte", dialCode: "+389", flag: "🇲🇰" },
  { code: "XK", name: "Kosovo", dialCode: "+383", flag: "🇽🇰" },
  { code: "MD", name: "Moldávia", dialCode: "+373", flag: "🇲🇩" },
  { code: "UA", name: "Ucrânia", dialCode: "+380", flag: "🇺🇦" },
  { code: "BY", name: "Bielorrússia", dialCode: "+375", flag: "🇧🇾" },
  { code: "RU", name: "Rússia", dialCode: "+7", flag: "🇷🇺" },
]

interface CountrySelectorProps {
  selectedCountry: Country
  onCountryChange: (country: Country) => void
  disabled?: boolean
}

export function CountrySelector({ selectedCountry, onCountryChange, disabled }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-xl">{selectedCountry.flag}</span>
        <span className="text-sm font-medium text-[#3A3A3A]">{selectedCountry.dialCode}</span>
        <ChevronDown className={`h-4 w-4 text-[#666666] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-64 overflow-y-auto rounded-lg border border-[#D9D9D9] bg-white shadow-lg">
          {europeanCountries.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => {
                onCountryChange(country)
                setIsOpen(false)
              }}
              className={`flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 ${
                selectedCountry.code === country.code ? 'bg-[#6FB57F]/10' : ''
              }`}
            >
              <span className="text-xl">{country.flag}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-[#3A3A3A]">{country.name}</div>
                <div className="text-xs text-[#666666]">{country.dialCode}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { europeanCountries }




"use client"

import { Calendar, Home, Package, Plus, User } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

const navigationItems = [
  {
    label: "Início",
    icon: Home,
    path: "/dashboard",
  },
  {
    label: "Sessões",
    icon: Calendar,
    path: "/sessoes", 
  },
  {
    label: "Agendar",
    icon: Plus,
    path: "/agendar",
    isPrimary: true,
  },
  {
    label: "Pacotes",
    icon: Package,
    path: "/pacotes",
  },
  {
    label: "Perfil",
    icon: User,
    path: "/perfil",
  },
]

export function BottomNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useIsMobile()

  // Não mostrar em páginas de autenticação ou landing
  const hiddenPaths = ["/", "/login", "/cadastro"]
  if (!isMobile || hiddenPaths.includes(pathname)) {
    return null
  }

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E5E5E5] bg-white shadow-lg md:hidden safe-area-bottom"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path || (item.path === "/dashboard" && pathname === "/")
          const isPrimary = item.isPrimary

          if (isPrimary) {
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full transition-all",
                  "bg-[#6FB57F] text-white shadow-md hover:bg-[#5fa46e] active:scale-95",
                )}
                aria-label={item.label}
              >
                <Icon className="h-6 w-6" />
              </button>
            )
          }

          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 transition-colors",
                isActive ? "text-[#6FB57F]" : "text-[#8B9E8B]",
              )}
              aria-label={item.label}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-[#6FB57F]")} />
              <span className={cn("text-[10px] font-medium", isActive && "text-[#6FB57F]")}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}


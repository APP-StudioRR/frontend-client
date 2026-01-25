"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Bell, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

type NotificationType = {
  id: number
  title: string
  message: string
  time: string
  read: boolean
  type: "success" | "info" | "warning"
}

export default function NotificationsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<"unread" | "read">("unread")
  const [notifications, setNotifications] = useState<NotificationType[]>([
    {
      id: 1,
      title: "Agendamento Confirmado",
      message: "Seu agendamento de Massagem Relaxante para hoje às 14:30 foi confirmado.",
      time: "Há 2 horas",
      read: false,
      type: "success",
    },
    {
      id: 2,
      title: "Lembrete de Agendamento",
      message: "Você tem uma sessão de Drenagem Linfática agendada para 22 de agosto às 11:00.",
      time: "Ontem",
      read: false,
      type: "info",
    },
    {
      id: 3,
      title: "Novo Pacote Disponível",
      message: "Confira nossos novos pacotes com descontos especiais!",
      time: "Há 3 horas",
      read: false,
      type: "info",
    },
    {
      id: 4,
      title: "Pacote Atualizado",
      message: "Você utilizou 1 sessão do seu Pacote 5 Sessões. Restam 2 sessões.",
      time: "2 dias atrás",
      read: true,
      type: "info",
    },
    {
      id: 5,
      title: "Agendamento Cancelado",
      message: "Seu agendamento de Ventosaterapia para 15 de agosto foi cancelado.",
      time: "3 dias atrás",
      read: true,
      type: "warning",
    },
    {
      id: 6,
      title: "Bem-vinda!",
      message: "Obrigada por se cadastrar no Studio Regiane Rodrigues. Agende sua primeira sessão!",
      time: "1 semana atrás",
      read: true,
      type: "success",
    },
    {
      id: 7,
      title: "Promoção Especial",
      message: "Desconto de 20% em todos os serviços esta semana!",
      time: "1 semana atrás",
      read: true,
      type: "info",
    },
    {
      id: 8,
      title: "Avaliação do Serviço",
      message: "Como foi sua última sessão? Deixe sua avaliação!",
      time: "2 semanas atrás",
      read: true,
      type: "info",
    },
  ])

  const [displayLimit, setDisplayLimit] = useState(5)

  const unreadCount = notifications.filter((n) => !n.read).length
  const readCount = notifications.filter((n) => n.read).length

  const filteredNotifications = notifications.filter((n) => (filter === "unread" ? !n.read : n.read))
  const displayedNotifications = filteredNotifications.slice(0, displayLimit)
  const hasMore = filteredNotifications.length > displayLimit

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((n) => {
        if (n.id === id) {
          return { ...n, read: true }
        }
        return n
      }),
    )
  }

  const loadMore = () => {
    setDisplayLimit(displayLimit + 5)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F3] pb-24">
      <div className="flex items-center gap-4 px-6 py-6">
        <button onClick={() => router.back()} className="text-[#3A3A3A]">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-[#3A3A3A]">Notificações</h1>
        {unreadCount > 0 && (
          <div className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#6FB57F] text-xs font-semibold text-white">
            {unreadCount}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="px-6 pb-4">
        <div className="flex gap-3">
          <button
            onClick={() => {
              setFilter("unread")
              setDisplayLimit(5)
            }}
            className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-colors ${
              filter === "unread"
                ? "bg-[#6FB57F] text-white"
                : "bg-white text-[#8B9E8B] border border-[#E5E5E5]"
            }`}
          >
            Não Lidas {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            onClick={() => {
              setFilter("read")
              setDisplayLimit(5)
            }}
            className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-colors ${
              filter === "read"
                ? "bg-[#6FB57F] text-white"
                : "bg-white text-[#8B9E8B] border border-[#E5E5E5]"
            }`}
          >
            Lidas {readCount > 0 && `(${readCount})`}
          </button>
        </div>
      </div>

      {/* Lista de notificações */}
      <div className="flex flex-col gap-3 px-6">
        {displayedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#E8F4EA]">
              <Bell className="h-10 w-10 text-[#6FB57F]" />
            </div>
            <p className="text-center text-[#8B9E8B]">
              {filter === "unread" ? "Você não tem notificações não lidas" : "Você não tem notificações lidas"}
            </p>
          </div>
        ) : (
          <>
            {displayedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-2xl bg-white p-4 shadow-sm ${
                  !notification.read ? "border-l-4 border-[#6FB57F]" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                      notification.type === "success"
                        ? "bg-[#E8F4EA]"
                        : notification.type === "warning"
                          ? "bg-[#FFF4E6]"
                          : "bg-[#E8F4EA]"
                    }`}
                  >
                    <Bell
                      className={`h-5 w-5 ${
                        notification.type === "success"
                          ? "text-[#6FB57F]"
                          : notification.type === "warning"
                            ? "text-[#FFA500]"
                            : "text-[#6FB57F]"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="font-semibold text-[#3A3A3A]">{notification.title}</h3>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-[#6FB57F]" />
                      )}
                    </div>
                    <p className="mb-2 text-sm text-[#666666]">{notification.message}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#8B9E8B]">{notification.time}</p>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="flex items-center gap-1 rounded-full bg-[#E8F4EA] px-3 py-1 text-xs font-medium text-[#6FB57F] transition-colors hover:bg-[#D4ECDB]"
                        >
                          <Check className="h-3 w-3" />
                          Marcar como lida
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Botão Ver Mais */}
            {hasMore && (
              <Button
                onClick={loadMore}
                variant="outline"
                className="mt-2 h-12 w-full rounded-full border-[#E5E5E5] text-[#6FB57F] hover:bg-[#F0F9F3] hover:border-[#6FB57F]"
              >
                Ver Mais
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}


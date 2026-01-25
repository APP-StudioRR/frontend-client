const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export const api = {
  baseURL: API_URL,
  
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`
    
    const headers: HeadersInit = {
      ...options.headers,
    }

    // Header para pular a página de warning do ngrok
    if (typeof window !== 'undefined' && API_URL.includes('ngrok')) {
      headers['ngrok-skip-browser-warning'] = 'true'
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Verificar se a resposta é HTML (página de warning do ngrok)
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('text/html')) {
      const html = await response.text()
      console.error('Ngrok retornou HTML ao invés de JSON. Possível página de warning:', html.substring(0, 200))
      throw new Error('Erro de conexão com o servidor. Verifique se o ngrok está configurado corretamente.')
    }

    const data = await response.json().catch(() => ({ message: 'Erro ao processar resposta' }))

    if (!response.ok) {
      const error: any = new Error(data.message || 'Erro na requisição')
      error.status = response.status
      error.code = data.code
      error.requires_registration = data.requires_registration
      error.errors = data.errors
      throw error
    }

    return data
  },

  get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' })
  },

  post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  put(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' })
  },
}


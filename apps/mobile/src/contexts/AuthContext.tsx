import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '../services/api'

interface Proprietario {
  id: string
  nome: string
  apelido: string | null
  email: string
  telefone?: string
  fotoPerfil?: string
}

interface AuthContextData {
  proprietario: Proprietario | null
  token: string | null
  estaLogado: boolean
  carregando: boolean
  login: (email: string, senha: string) => Promise<void>
  cadastrar: (dados: { nome: string; email: string; senha: string; apelido?: string; telefone?: string }) => Promise<void>
  logout: () => Promise<void>
  atualizarPerfil: (dados: Partial<Pick<Proprietario, 'nome' | 'apelido' | 'telefone'>>) => Promise<void>
  atualizarFotoPerfil: (uri: string | null) => Promise<void>
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

const TOKEN_KEY = '@anotai:token'
const USER_KEY  = '@anotai:usuario'
const FOTO_KEY  = '@anotai:foto_perfil'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [proprietario, setProprietario] = useState<Proprietario | null>(null)
  const [token, setToken]               = useState<string | null>(null)
  const [carregando, setCarregando]     = useState(true)

  useEffect(() => {
    async function restaurarSessao() {
      try {
        const [tokenSalvo, usuarioSalvo] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY])
        const t = tokenSalvo[1]
        const u = usuarioSalvo[1]
        if (t && u) {
          api.defaults.headers.common['Authorization'] = `Bearer ${t}`
          setToken(t)
          setProprietario(JSON.parse(u))
        }
      } catch {
        // Sessão corrompida — ignora e permite acesso como visitante
      } finally {
        setCarregando(false)
      }
    }
    restaurarSessao()
  }, [])

  async function login(email: string, senha: string) {
    const { data } = await api.post('/auth/login', { email, senha })
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setToken(data.token)
    setProprietario(data.proprietario)
    await AsyncStorage.multiSet([
      [TOKEN_KEY, data.token],
      [USER_KEY,  JSON.stringify(data.proprietario)],
    ])
    try {
      const fotoSalva = await AsyncStorage.getItem(FOTO_KEY)
      if (fotoSalva) {
        const comFoto = { ...data.proprietario, fotoPerfil: fotoSalva }
        setProprietario(comFoto)
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(comFoto))
      }
    } catch { /* ignora */ }
  }

  async function cadastrar(dados: { nome: string; email: string; senha: string; apelido?: string; telefone?: string }) {
    await api.post('/auth/cadastro', dados)
    await login(dados.email, dados.senha)
  }

  async function logout() {
    api.defaults.headers.common['Authorization'] = ''
    setToken(null)
    setProprietario(null)
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY])
  }

  async function atualizarPerfil(dados: Partial<Pick<Proprietario, 'nome' | 'apelido' | 'telefone'>>) {
    if (!proprietario) return
    const atualizado = { ...proprietario, ...dados }
    setProprietario(atualizado)
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(atualizado))
  }

  async function atualizarFotoPerfil(uri: string | null) {
    if (!proprietario) return
    const atualizado: Proprietario = { ...proprietario, fotoPerfil: uri ?? undefined }
    setProprietario(atualizado)
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(atualizado))
    if (uri) {
      await AsyncStorage.setItem(FOTO_KEY, uri)
    } else {
      await AsyncStorage.removeItem(FOTO_KEY)
    }
  }

  return (
    <AuthContext.Provider value={{
      proprietario,
      token,
      estaLogado: !!token,
      carregando,
      login,
      cadastrar,
      logout,
      atualizarPerfil,
      atualizarFotoPerfil,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}

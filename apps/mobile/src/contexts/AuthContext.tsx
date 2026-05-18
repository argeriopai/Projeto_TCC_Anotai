import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '../services/firebase'
import { api } from '../services/api'

// ─── Interfaces (idênticas — nenhuma tela quebra) ──────────────────────────────

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

// ─── Chaves AsyncStorage por usuário ──────────────────────────────────────────

const fotoKey   = (id: string) => `@anotai:foto_perfil:${id}`
const perfilKey = (id: string) => `@anotai:perfil:${id}`

// ─── Helper: monta Proprietario a partir do uid + AsyncStorage ────────────────

async function montarProprietario(uid: string, email: string): Promise<Proprietario> {
  let dados: Proprietario = {
    id: uid,
    nome: email.split('@')[0],
    apelido: null,
    email,
  }
  try {
    const perfilSalvo = await AsyncStorage.getItem(perfilKey(uid))
    if (perfilSalvo) {
      const d = JSON.parse(perfilSalvo)
      dados = { ...dados, ...d }
    }
  } catch { /* ignora */ }
  try {
    const fotoSalva = await AsyncStorage.getItem(fotoKey(uid))
    if (fotoSalva) dados.fotoPerfil = fotoSalva
  } catch { /* ignora */ }
  return dados
}

// ─── Bridge mock: formata token compatível com getPid() do api.ts ─────────────

function setMockHeader(uid: string) {
  api.defaults.headers.common['Authorization'] = `Bearer mock-token-${uid}-${Date.now()}`
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [proprietario, setProprietario] = useState<Proprietario | null>(null)
  const [token, setToken]               = useState<string | null>(null)
  const [carregando, setCarregando]     = useState(true)

  // Restaura sessão automaticamente via Firebase onAuthStateChanged
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const t = await user.getIdToken()
        setToken(t)
        setMockHeader(user.uid)
        const prop = await montarProprietario(user.uid, user.email ?? '')
        setProprietario(prop)
      } else {
        api.defaults.headers.common['Authorization'] = ''
        setToken(null)
        setProprietario(null)
      }
      setCarregando(false)
    })
    return unsubscribe
  }, [])

  async function login(email: string, senha: string) {
    const cred = await signInWithEmailAndPassword(auth, email, senha)
    const user = cred.user
    const t = await user.getIdToken()
    setToken(t)
    setMockHeader(user.uid)
    const prop = await montarProprietario(user.uid, user.email ?? email)
    setProprietario(prop)
  }

  async function cadastrar(dados: { nome: string; email: string; senha: string; apelido?: string; telefone?: string }) {
    const cred = await createUserWithEmailAndPassword(auth, dados.email, dados.senha)
    const user = cred.user
    const perfilInicial = {
      nome: dados.nome,
      apelido: dados.apelido ?? dados.nome.split(' ')[0],
      telefone: dados.telefone,
    }
    await AsyncStorage.setItem(perfilKey(user.uid), JSON.stringify(perfilInicial))
    const t = await user.getIdToken()
    setToken(t)
    setMockHeader(user.uid)
    setProprietario({
      id: user.uid,
      nome: dados.nome,
      apelido: dados.apelido ?? dados.nome.split(' ')[0],
      email: user.email ?? dados.email,
      telefone: dados.telefone,
    })
  }

  async function logout() {
    setToken(null)
    setProprietario(null)
    api.defaults.headers.common['Authorization'] = ''
    await signOut(auth)
  }

  async function atualizarPerfil(dados: Partial<Pick<Proprietario, 'nome' | 'apelido' | 'telefone'>>) {
    if (!proprietario) return
    const atualizado = { ...proprietario, ...dados }
    setProprietario(atualizado)
    await AsyncStorage.setItem(
      perfilKey(proprietario.id),
      JSON.stringify({ nome: dados.nome, apelido: dados.apelido, telefone: dados.telefone })
    )
  }

  async function atualizarFotoPerfil(uri: string | null) {
    if (!proprietario) return
    const atualizado: Proprietario = { ...proprietario, fotoPerfil: uri ?? undefined }
    setProprietario(atualizado)
    if (uri) {
      await AsyncStorage.setItem(fotoKey(proprietario.id), uri)
    } else {
      await AsyncStorage.removeItem(fotoKey(proprietario.id))
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

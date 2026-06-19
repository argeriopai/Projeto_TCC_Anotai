import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth'
import { collection, query, where, getDocs, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../services/firebase'
import { uploadFotoCloudinary } from '../services/cloudinary'
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
  excluirConta: (senha: string) => Promise<void>
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
    const snap = await getDoc(doc(db, 'usuarios', uid))
    if (snap.exists() && snap.data()?.fotoPerfil) {
      dados.fotoPerfil = snap.data()!.fotoPerfil
      await AsyncStorage.setItem(fotoKey(uid), dados.fotoPerfil!)
    } else {
      const fotoSalva = await AsyncStorage.getItem(fotoKey(uid))
      if (fotoSalva) dados.fotoPerfil = fotoSalva
    }
  } catch {
    try {
      const fotoSalva = await AsyncStorage.getItem(fotoKey(uid))
      if (fotoSalva) dados.fotoPerfil = fotoSalva
    } catch { /* ignora */ }
  }
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

  async function excluirConta(senha: string) {
    const user = auth.currentUser
    if (!user) return
    try {
      const credential = EmailAuthProvider.credential(user.email!, senha)
      await reauthenticateWithCredential(user, credential)
    } catch {
      throw new Error('Senha incorreta')
    }
    const uid = user.uid
    const colecoes = ['carros', 'motos', 'servicos', 'pecas', 'notificacoes']
    for (const col of colecoes) {
      const q = query(collection(db, col), where('proprietarioId', '==', uid))
      const snap = await getDocs(q)
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
    }
    await deleteUser(user)
    try {
      await deleteDoc(doc(db, 'usuarios', uid))
    } catch { /* ignora */ }
    await AsyncStorage.multiRemove([fotoKey(uid), perfilKey(uid)])
    await logout()
  }

  async function atualizarFotoPerfil(uri: string | null) {
    if (!proprietario) return
    let urlFinal: string | undefined
    if (uri) {
      try {
        urlFinal = await uploadFotoCloudinary(uri)
      } catch (error) {
        console.error('Erro ao fazer upload da foto:', error)
        throw error
      }
    }
    const atualizado: Proprietario = { ...proprietario, fotoPerfil: urlFinal }
    setProprietario(atualizado)
    try {
      await setDoc(doc(db, 'usuarios', proprietario.id), { fotoPerfil: urlFinal ?? null }, { merge: true })
    } catch (error) {
      console.error('Erro ao salvar foto no Firestore:', error)
    }
    if (urlFinal) {
      await AsyncStorage.setItem(fotoKey(proprietario.id), urlFinal)
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
      excluirConta,
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

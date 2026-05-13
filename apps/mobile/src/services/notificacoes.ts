import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

const NOTIF_MAP_KEY = '@anotai:notif_map'

export async function salvarMapeamento(notificacaoId: string, osNotifId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(NOTIF_MAP_KEY)
  const mapa: Record<string, string> = raw ? JSON.parse(raw) : {}
  mapa[notificacaoId] = osNotifId
  await AsyncStorage.setItem(NOTIF_MAP_KEY, JSON.stringify(mapa))
}

export async function buscarOsNotifId(notificacaoId: string): Promise<string | null> {
  const raw = await AsyncStorage.getItem(NOTIF_MAP_KEY)
  if (!raw) return null
  const mapa: Record<string, string> = JSON.parse(raw)
  return mapa[notificacaoId] ?? null
}

export async function removerMapeamento(notificacaoId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(NOTIF_MAP_KEY)
  if (!raw) return
  const mapa: Record<string, string> = JSON.parse(raw)
  delete mapa[notificacaoId]
  await AsyncStorage.setItem(NOTIF_MAP_KEY, JSON.stringify(mapa))
}

export async function solicitarPermissao(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('anotai', {
      name: 'Anotaí — Lembretes',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    })
  }

  const { status: atual } = await Notifications.getPermissionsAsync()
  if (atual === 'granted') return true

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

export async function agendarNotificacao(
  titulo: string,
  corpo: string,
  data: Date,
  extras?: Record<string, unknown>,
): Promise<string | null> {
  const agendada = new Date(data)
  agendada.setHours(8, 0, 0, 0)

  if (agendada <= new Date()) return null

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔔 ${titulo}`,
        body: corpo,
        sound: true,
        data: { dataAgendada: agendada.toISOString(), ...extras },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: agendada,
      },
    })
    return id
  } catch {
    return null
  }
}

export async function cancelarNotificacao(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id)
}

export async function listarNotificacoesAgendadas(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync()
}

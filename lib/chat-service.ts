import {
  ref,
  push,
  set,
  get,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  onValue,
  off,
  update,
  remove,
  serverTimestamp,
} from 'firebase/database'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { database, storage } from './firebase'
import { ChatMessage, ChatSession, SupportTeamStatus, ChatNotification } from '@/types/chat'
import { getCurrentUser } from './auth'

export class ChatService {
  private static instance: ChatService
  private listeners: Map<string, () => void> = new Map()

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService()
    }
    return ChatService.instance
  }

  // Chat Sessions
  async createChatSession(customerId: string, customerName: string): Promise<string> {
    const sessionRef = ref(database, 'chat_sessions')
    const newSessionRef = push(sessionRef)
    
    const session: ChatSession = {
      id: newSessionRef.key!,
      customerId,
      customerName,
      status: 'waiting',
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
      messageCount: 0,
    }

    await set(newSessionRef, session)
    return newSessionRef.key!
  }

  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    const sessionRef = ref(database, `chat_sessions/${sessionId}`)
    const snapshot = await get(sessionRef)
    return snapshot.exists() ? snapshot.val() : null
  }

  async getCustomerChatSession(customerId: string): Promise<ChatSession | null> {
    const sessionsRef = ref(database, 'chat_sessions')
    const q = query(
      sessionsRef,
      orderByChild('customerId'),
      equalTo(customerId),
      limitToLast(1)
    )
    const snapshot = await get(q)
    
    if (snapshot.exists()) {
      const sessions = snapshot.val()
      const sessionIds = Object.keys(sessions)
      const latestSessionId = sessionIds[sessionIds.length - 1]
      return sessions[latestSessionId]
    }
    return null
  }

  async getSupportTeamChatSessions(supportTeamId: string): Promise<ChatSession[]> {
    const sessionsRef = ref(database, 'chat_sessions')
    const q = query(
      sessionsRef,
      orderByChild('supportTeamId'),
      equalTo(supportTeamId)
    )
    const snapshot = await get(q)
    
    if (snapshot.exists()) {
      return Object.values(snapshot.val())
    }
    return []
  }

  async getWaitingChatSessions(): Promise<ChatSession[]> {
    const sessionsRef = ref(database, 'chat_sessions')
    const q = query(
      sessionsRef,
      orderByChild('status'),
      equalTo('waiting')
    )
    const snapshot = await get(q)
    
    if (snapshot.exists()) {
      return Object.values(snapshot.val())
    }
    return []
  }

  async assignSupportTeam(sessionId: string, supportTeamId: string, supportTeamName: string): Promise<void> {
    const sessionRef = ref(database, `chat_sessions/${sessionId}`)
    await update(sessionRef, {
      supportTeamId,
      supportTeamName,
      status: 'active',
    })
  }

  async closeChatSession(sessionId: string): Promise<void> {
    const sessionRef = ref(database, `chat_sessions/${sessionId}`)
    await update(sessionRef, {
      status: 'closed',
    })
  }

  // Messages
  async sendMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<string> {
    const messagesRef = ref(database, `chat_messages/${sessionId}`)
    const newMessageRef = push(messagesRef)
    
    const fullMessage: ChatMessage = {
      ...message,
      id: newMessageRef.key!,
      timestamp: Date.now(),
    }

    await set(newMessageRef, fullMessage)
    
    // Update session
    const sessionRef = ref(database, `chat_sessions/${sessionId}`)
    await update(sessionRef, {
      lastMessageAt: Date.now(),
      messageCount: (await this.getMessageCount(sessionId)) + 1,
    })

    return newMessageRef.key!
  }

  async getMessages(sessionId: string, limit: number = 50): Promise<ChatMessage[]> {
    const messagesRef = ref(database, `chat_messages/${sessionId}`)
    const q = query(messagesRef, orderByChild('timestamp'), limitToLast(limit))
    const snapshot = await get(q)
    
    if (snapshot.exists()) {
      return Object.values(snapshot.val()).sort((a: any, b: any) => a.timestamp - b.timestamp)
    }
    return []
  }

  private async getMessageCount(sessionId: string): Promise<number> {
    const messagesRef = ref(database, `chat_messages/${sessionId}`)
    const snapshot = await get(messagesRef)
    return snapshot.exists() ? Object.keys(snapshot.val()).length : 0
  }

  // Support Team Status
  async updateSupportTeamStatus(supportTeamId: string, status: Partial<SupportTeamStatus>): Promise<void> {
    const statusRef = ref(database, `support_team_status/${supportTeamId}`)
    await update(statusRef, {
      ...status,
      lastSeen: Date.now(),
    })
  }

  async getOnlineSupportTeams(): Promise<SupportTeamStatus[]> {
    const statusRef = ref(database, 'support_team_status')
    const q = query(statusRef, orderByChild('online'), equalTo(true))
    const snapshot = await get(q)
    
    if (snapshot.exists()) {
      return Object.values(snapshot.val())
    }
    return []
  }

  async getSupportTeamStatus(supportTeamId: string): Promise<SupportTeamStatus | null> {
    const statusRef = ref(database, `support_team_status/${supportTeamId}`)
    const snapshot = await get(statusRef)
    return snapshot.exists() ? snapshot.val() : null
  }

  // File Upload
  async uploadImage(file: File, sessionId: string): Promise<string> {
    const fileName = `${sessionId}/${Date.now()}_${file.name}`
    const imageRef = storageRef(storage, `chat_images/${fileName}`)
    
    await uploadBytes(imageRef, file)
    const downloadURL = await getDownloadURL(imageRef)
    
    return downloadURL
  }

  // Real-time Listeners
  onChatMessages(sessionId: string, callback: (messages: ChatMessage[]) => void): () => void {
    const messagesRef = ref(database, `chat_messages/${sessionId}`)
    const q = query(messagesRef, orderByChild('timestamp'))
    
    const listener = onValue(q, (snapshot) => {
      if (snapshot.exists()) {
        const messages = Object.values(snapshot.val()).sort((a: any, b: any) => a.timestamp - b.timestamp)
        callback(messages)
      } else {
        callback([])
      }
    })

    this.listeners.set(`messages_${sessionId}`, () => off(messagesRef, 'value', listener))
    return () => {
      off(messagesRef, 'value', listener)
      this.listeners.delete(`messages_${sessionId}`)
    }
  }

  onChatSession(sessionId: string, callback: (session: ChatSession | null) => void): () => void {
    const sessionRef = ref(database, `chat_sessions/${sessionId}`)
    
    const listener = onValue(sessionRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null)
    })

    this.listeners.set(`session_${sessionId}`, () => off(sessionRef, 'value', listener))
    return () => {
      off(sessionRef, 'value', listener)
      this.listeners.delete(`session_${sessionId}`)
    }
  }

  onWaitingChatSessions(callback: (sessions: ChatSession[]) => void): () => void {
    const sessionsRef = ref(database, 'chat_sessions')
    const q = query(sessionsRef, orderByChild('status'), equalTo('waiting'))
    
    const listener = onValue(q, (snapshot) => {
      if (snapshot.exists()) {
        const sessions = Object.values(snapshot.val())
        callback(sessions)
      } else {
        callback([])
      }
    })

    this.listeners.set('waiting_sessions', () => off(sessionsRef, 'value', listener))
    return () => {
      off(sessionsRef, 'value', listener)
      this.listeners.delete('waiting_sessions')
    }
  }

  onSupportTeamStatus(supportTeamId: string, callback: (status: SupportTeamStatus | null) => void): () => void {
    const statusRef = ref(database, `support_team_status/${supportTeamId}`)
    
    const listener = onValue(statusRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null)
    })

    this.listeners.set(`status_${supportTeamId}`, () => off(statusRef, 'value', listener))
    return () => {
      off(statusRef, 'value', listener)
      this.listeners.delete(`status_${supportTeamId}`)
    }
  }

  // Cleanup
  cleanup(): void {
    this.listeners.forEach((cleanup) => cleanup())
    this.listeners.clear()
  }
}

export const chatService = ChatService.getInstance() 
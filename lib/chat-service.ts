import { 
  ref, 
  get, 
  set, 
  push, 
  update, 
  onValue, 
  off 
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

  // Remove keys whose values are undefined (Firebase RTDB does not allow undefined)
  private removeUndefinedDeep<T>(value: T): T {
    if (Array.isArray(value)) {
      // @ts-expect-error keep generic
      return value.map((item) => this.removeUndefinedDeep(item)) as T
    }
    if (value !== null && typeof value === 'object') {
      const result: Record<string, unknown> = {}
      Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
        if (val === undefined) {
          return
        }
        if (val !== null && typeof val === 'object') {
          const sanitized = this.removeUndefinedDeep(val)
          // Only assign objects that still have keys (avoid empty objects for optional fields)
          if (sanitized && (Array.isArray(sanitized) ? true : Object.keys(sanitized as object).length > 0)) {
            result[key] = sanitized
          } else if (!Array.isArray(sanitized)) {
            // skip empty object
          } else {
            result[key] = sanitized
          }
        } else {
          result[key] = val
        }
      })
      return result as unknown as T
    }
    return value
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
    const snapshot = await get(sessionsRef)
    
    if (snapshot.exists()) {
      const sessions = Object.values(snapshot.val()) as ChatSession[]
      // Filter by customerId and get the most recent active session
      const customerSessions = sessions
        .filter(session => session.customerId === customerId && session.status !== 'closed')
        .sort((a, b) => b.createdAt - a.createdAt) // Sort by creation time, newest first
      
      return customerSessions.length > 0 ? customerSessions[0] : null
    }
    return null
  }

  async getSupportTeamChatSessions(supportTeamId: string): Promise<ChatSession[]> {
    const sessionsRef = ref(database, 'chat_sessions')
    const snapshot = await get(sessionsRef)
    
    if (snapshot.exists()) {
      const sessions = Object.values(snapshot.val()) as ChatSession[]
      // Filter by supportTeamId in JavaScript instead of using Firebase query
      return sessions.filter(session => session.supportTeamId === supportTeamId)
    }
    return []
  }

  async getActiveChatSessions(supportTeamId: string): Promise<ChatSession[]> {
    const sessionsRef = ref(database, 'chat_sessions')
    const snapshot = await get(sessionsRef)
    
    if (snapshot.exists()) {
      const sessions = Object.values(snapshot.val()) as ChatSession[]
      // Filter by supportTeamId and active status in JavaScript
      return sessions.filter(session => 
        session.status === 'active' && session.supportTeamId === supportTeamId
      )
    }
    return []
  }

  async getWaitingChatSessions(): Promise<ChatSession[]> {
    const sessionsRef = ref(database, 'chat_sessions')
    const snapshot = await get(sessionsRef)
    
    if (snapshot.exists()) {
      const sessions = Object.values(snapshot.val()) as ChatSession[]
      // Filter by status in JavaScript instead of using Firebase query
      return sessions.filter(session => session.status === 'waiting')
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
    
    const fullMessage: ChatMessage = this.removeUndefinedDeep({
      ...message,
      id: newMessageRef.key!,
      timestamp: Date.now(),
    })

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
    const snapshot = await get(messagesRef)
    
    if (snapshot.exists()) {
      const messages = Object.values(snapshot.val()) as ChatMessage[]
      // Sort by timestamp in JavaScript and limit results
      const sortedMessages = messages.sort((a, b) => a.timestamp - b.timestamp)
      return sortedMessages.slice(-limit)
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
    try {
      const statusRef = ref(database, 'support_team_status')
      const snapshot = await get(statusRef)
      
      if (snapshot.exists()) {
        const teams = Object.values(snapshot.val()) as SupportTeamStatus[]
        // Filter online teams in JavaScript instead of using Firebase query
        const onlineTeams = teams.filter(team => team.online === true)
        console.log('getOnlineSupportTeams - Found teams:', teams.length, 'Online teams:', onlineTeams.length)
        return onlineTeams
      }
      console.log('getOnlineSupportTeams - No teams found in database')
      return []
    } catch (error) {
      console.error('Error in getOnlineSupportTeams:', error)
      return []
    }
  }

  async getSupportTeamStatus(supportTeamId: string): Promise<SupportTeamStatus | null> {
    const statusRef = ref(database, `support_team_status/${supportTeamId}`)
    const snapshot = await get(statusRef)
    return snapshot.exists() ? snapshot.val() : null
  }

  // File Upload
  async uploadImage(file: File, sessionId: string): Promise<string> {
    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`uploadImage: Attempt ${attempt}/${maxRetries}`, {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          sessionId
        })

        // Validate inputs
        if (!file) {
          throw new Error('No file provided')
        }
        if (!sessionId) {
          throw new Error('No session ID provided')
        }
        if (!file.type.startsWith('image/')) {
          throw new Error('File is not an image')
        }

        // Create file name with timestamp to avoid conflicts
        const timestamp = Date.now()
        const fileName = `${sessionId}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        console.log('uploadImage: Generated file name:', fileName)

        // Create storage reference
        const imageRef = storageRef(storage, `chat_images/${fileName}`)
        console.log('uploadImage: Created storage reference')

        // Upload file to Firebase Storage with timeout
        console.log('uploadImage: Starting upload to Firebase Storage...')
        const uploadPromise = uploadBytes(imageRef, file)
        
        // Add timeout to the upload operation
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Upload timeout')), 15000) // 15 second timeout
        })

        const uploadResult = await Promise.race([uploadPromise, timeoutPromise]) as any
        console.log('uploadImage: Upload completed:', uploadResult)

        // Get download URL with timeout
        console.log('uploadImage: Getting download URL...')
        const downloadPromise = getDownloadURL(imageRef)
        const downloadTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Download URL timeout')), 10000) // 10 second timeout
        })

        const downloadURL = await Promise.race([downloadPromise, downloadTimeoutPromise]) as string
        console.log('uploadImage: Download URL obtained:', downloadURL)

        return downloadURL

      } catch (error) {
        console.error(`uploadImage: Attempt ${attempt} failed:`, error)
        lastError = error as Error

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          break
        }

        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s
        console.log(`uploadImage: Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }

    // All retries failed, try fallback to data URL
    console.log('uploadImage: Firebase Storage failed, trying fallback to data URL...')
    try {
      const dataUrl = await this.convertFileToDataURL(file)
      console.log('uploadImage: Successfully converted to data URL')
      return dataUrl
    } catch (fallbackError) {
      console.error('uploadImage: Fallback also failed:', fallbackError)
    }

    // All methods failed, provide detailed error information
    console.error('uploadImage: All upload methods failed')
    
    if (lastError instanceof Error) {
      if (lastError.message.includes('storage/unauthorized')) {
        throw new Error('Storage access denied. Please check Firebase configuration.')
      } else if (lastError.message.includes('storage/quota-exceeded')) {
        throw new Error('Storage quota exceeded. Please try a smaller image.')
      } else if (lastError.message.includes('storage/retry-limit-exceeded')) {
        throw new Error('Network connectivity issue. Please check your internet connection and try again.')
      } else if (lastError.message.includes('storage/invalid-format')) {
        throw new Error('Invalid file format. Please select a valid image file.')
      } else if (lastError.message.includes('Upload timeout') || lastError.message.includes('Download URL timeout')) {
        throw new Error('Upload timed out. Please check your internet connection and try again.')
      } else {
        throw new Error(`Upload failed after ${maxRetries} attempts: ${lastError.message}`)
      }
    } else {
      throw new Error('Unknown upload error occurred')
    }
  }

  // Fallback method: Convert file to data URL
  private async convertFileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to convert file to data URL'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      reader.readAsDataURL(file)
    })
  }

  // Real-time Listeners
  onChatMessages(sessionId: string, callback: (messages: ChatMessage[]) => void): () => void {
    const messagesRef = ref(database, `chat_messages/${sessionId}`)
    
    const listener = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const messages = Object.values(snapshot.val()) as ChatMessage[]
        // Sort by timestamp in JavaScript instead of using Firebase query
        const sortedMessages = messages.sort((a, b) => a.timestamp - b.timestamp)
        callback(sortedMessages)
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
    
    const listener = onValue(sessionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const sessions = Object.values(snapshot.val()) as ChatSession[]
        // Filter by status in JavaScript instead of using Firebase query
        const waitingSessions = sessions.filter(session => session.status === 'waiting')
        callback(waitingSessions)
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

  onActiveChatSessions(supportTeamId: string, callback: (sessions: ChatSession[]) => void): () => void {
    const sessionsRef = ref(database, 'chat_sessions')
    
    const listener = onValue(sessionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const sessions = Object.values(snapshot.val()) as ChatSession[]
        // Filter by supportTeamId and active status in JavaScript
        const activeSessions = sessions.filter(session => 
          session.status === 'active' && session.supportTeamId === supportTeamId
        )
        callback(activeSessions)
      } else {
        callback([])
      }
    })

    this.listeners.set(`active_sessions_${supportTeamId}`, () => off(sessionsRef, 'value', listener))
    return () => {
      off(sessionsRef, 'value', listener)
      this.listeners.delete(`active_sessions_${supportTeamId}`)
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
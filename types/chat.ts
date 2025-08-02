export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: string
  content: string
  type: 'text' | 'image' | 'link'
  timestamp: number
  read: boolean
  linkPreview?: LinkPreview
  imageUrl?: string
}

export interface LinkPreview {
  url: string
  title: string
  description: string
  image: string
  siteName: string
}

export interface ChatSession {
  id: string
  customerId: string
  customerName: string
  supportTeamId?: string
  supportTeamName?: string
  status: 'waiting' | 'active' | 'closed'
  createdAt: number
  lastMessageAt: number
  messageCount: number
}

export interface SupportTeamStatus {
  id: string
  name: string
  online: boolean
  activeChats: number
  maxChats: number
  lastSeen: number
}

export interface ChatNotification {
  id: string
  type: 'new_message' | 'chat_request' | 'chat_closed'
  title: string
  message: string
  timestamp: number
  read: boolean
  chatSessionId?: string
}

export interface ChatSettings {
  maxSupportCustomers: number
  messageLimit: number
  fileSizeLimit: number
  autoCloseTimeout: number
} 
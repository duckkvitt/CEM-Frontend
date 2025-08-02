'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageCircle, 
  Send, 
  Image as ImageIcon, 
  X, 
  Loader2, 
  Users, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Minimize2,
  Maximize2
} from 'lucide-react'
import { Button } from '@/components/ui/button'

import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { chatService } from '@/lib/chat-service'
import { getCurrentUser, getCurrentUserRole } from '@/lib/auth'
import { ChatMessage, ChatSession, SupportTeamStatus } from '@/types/chat'
import { getLinkPreview, extractUrls, isUrl } from '@/lib/link-preview'
import { cn } from '@/lib/utils'

export default function SupportPage() {
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([])
  const [waitingSessions, setWaitingSessions] = useState<ChatSession[]>([])
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [supportTeamStatus, setSupportTeamStatus] = useState<SupportTeamStatus | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentUser = getCurrentUser()
  const userRole = getCurrentUserRole()

  // Handle client-side hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated || !currentUser) return

    const initializeStatus = async () => {
      const status: SupportTeamStatus = {
        online: isOnline,
        activeChats: 0,
        maxChats: 5,
        lastSeen: Date.now(),
      }
      
      await chatService.updateSupportTeamStatus(currentUser.id.toString(), status)
      // Only update state if it's different to prevent infinite loops
      setSupportTeamStatus(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(status)) {
          return status
        }
        return prev
      })

      // Load existing active sessions for this support team member
      try {
        const existingActiveSessions = await chatService.getActiveChatSessions(currentUser.id.toString())
        setActiveSessions(existingActiveSessions)
        console.log('Loaded existing active sessions:', existingActiveSessions.length)
      } catch (error) {
        console.error('Error loading existing active sessions:', error)
      }
    }

    initializeStatus()

    // Listen for waiting sessions
    const unsubscribeWaiting = chatService.onWaitingChatSessions((sessions) => {
      setWaitingSessions(sessions)
    })

    // Listen for active sessions that this support team member is handling
    const unsubscribeActive = chatService.onActiveChatSessions(currentUser.id.toString(), (sessions) => {
      setActiveSessions(sessions)
    })

    // Listen for support team status
    const unsubscribeStatus = chatService.onSupportTeamStatus(currentUser.id.toString(), (status) => {
      setSupportTeamStatus(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(status)) {
          return status
        }
        return prev
      })
    })

    return () => {
      unsubscribeWaiting()
      unsubscribeActive()
      unsubscribeStatus()
    }
  }, [currentUser?.id, isOnline, isHydrated]) // Remove currentUser from dependencies, use currentUser?.id instead

  useEffect(() => {
    if (selectedSession) {
      const unsubscribe = chatService.onChatMessages(selectedSession.id, (newMessages) => {
        setMessages(newMessages)
      })

      return unsubscribe
    } else {
      // Clear messages when no session is selected
      setMessages([])
    }
  }, [selectedSession?.id])

  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0 && selectedSession) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }, [messages.length, selectedSession?.id])

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Only allow SUPPORT_TEAM access
  if (userRole !== 'SUPPORT_TEAM') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don&apos;t have permission to access this page.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Only SUPPORT_TEAM members can access this feature.
          </p>
        </div>
      </div>
    )
  }

  const handleAcceptChat = async (session: ChatSession) => {
    if (!currentUser || !supportTeamStatus) return

    if (supportTeamStatus.activeChats >= supportTeamStatus.maxChats) {
      toast.error('You have reached the maximum number of active chats')
      return
    }

    try {
      await chatService.assignSupportTeam(
        session.id,
        currentUser.id.toString(),
        currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`
      )

      // Update local state
      setActiveSessions(prev => {
        // Check if session is already in active sessions
        if (prev.find(s => s.id === session.id)) {
          return prev
        }
        return [...prev, { ...session, status: 'active' }]
      })
      setWaitingSessions(prev => prev.filter(s => s.id !== session.id))
      setSelectedSession({ ...session, status: 'active' })

      // Update support team status
      await chatService.updateSupportTeamStatus(currentUser.id.toString(), {
        activeChats: supportTeamStatus.activeChats + 1,
      })

      toast.success('Chat session accepted')
    } catch (error) {
      toast.error('Failed to accept chat session')
      console.error('Error accepting chat:', error)
    }
  }

  const handleCloseChat = async (sessionId: string) => {
    if (!currentUser || !supportTeamStatus) return

    try {
      // Send a system message to notify the customer that the chat has ended
      await chatService.sendMessage(sessionId, {
        senderId: 'system',
        senderName: 'System',
        senderRole: 'SYSTEM',
        content: 'Chat session has ended. You can start a new support request if needed.',
        type: 'text',
        read: false,
      })

      // Close the chat session
      await chatService.closeChatSession(sessionId)

      // Update local state
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId))
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null)
        setMessages([])
      }

      // Update support team status
      await chatService.updateSupportTeamStatus(currentUser.id.toString(), {
        activeChats: Math.max(0, supportTeamStatus.activeChats - 1),
      })

      toast.success('Chat session closed')
    } catch (error) {
      toast.error('Failed to close chat session')
      console.error('Error closing chat:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedSession || !currentUser) return

    const content = inputValue.trim()
    setInputValue('')
    setIsTyping(true)

    try {
      let messageType: 'text' | 'link' = 'text'
      let linkPreview = null

      // Check if message contains URLs
      if (isUrl(content)) {
        messageType = 'link'
        linkPreview = await getLinkPreview(content)
      } else {
        const urls = extractUrls(content)
        if (urls.length > 0) {
          messageType = 'link'
          linkPreview = await getLinkPreview(urls[0])
        }
      }

      await chatService.sendMessage(selectedSession.id, {
        senderId: currentUser.id.toString(),
        senderName: currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`,
        senderRole: currentUser.role?.name || 'SUPPORT_TEAM',
        content,
        type: messageType,
        read: false,
        linkPreview,
      })
    } catch (error) {
      toast.error('Failed to send message')
      console.error('Error sending message:', error)
    } finally {
      setIsTyping(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedSession || !currentUser) return

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size too large. Maximum 10MB allowed.')
      return
    }

    setIsUploading(true)
    try {
      const imageUrl = await chatService.uploadImage(file, selectedSession.id)
      
      await chatService.sendMessage(selectedSession.id, {
        senderId: currentUser.id.toString(),
        senderName: currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`,
        senderRole: currentUser.role?.name || 'SUPPORT_TEAM',
        content: 'Image',
        type: 'image',
        read: false,
        imageUrl,
      })
    } catch (error) {
      toast.error('Failed to upload image')
      console.error('Error uploading image:', error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderMessage = (message: ChatMessage) => {
    const isOwnMessage = message.senderId === currentUser?.id.toString()
    const isSystemMessage = message.senderRole === 'SYSTEM'

    // Handle system messages differently
    if (isSystemMessage) {
      return (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center mb-4"
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 max-w-[80%]">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center">
                <MessageCircle className="h-2 w-2 text-blue-600" />
              </div>
              <p className="text-xs text-blue-700 font-medium">{message.content}</p>
            </div>
            <p className="text-xs text-blue-500 text-center mt-1">
              {formatTime(message.timestamp)}
            </p>
          </div>
        </motion.div>
      )
    }

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'flex gap-3 mb-4',
          isOwnMessage ? 'justify-end' : 'justify-start'
        )}
      >
        {!isOwnMessage && (
          <Avatar className="h-8 w-8">
            <AvatarImage src="/api/placeholder/32/32" />
            <AvatarFallback className="text-xs">
              {message.senderName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={cn(
          'max-w-[70%] space-y-1',
          isOwnMessage ? 'order-first' : 'order-last'
        )}>
          {!isOwnMessage && (
            <p className="text-xs text-muted-foreground ml-1">
              {message.senderName}
            </p>
          )}
          
          <motion.div
            className={cn(
              'rounded-2xl px-4 py-2 text-sm',
              isOwnMessage
                ? 'bg-primary text-primary-foreground ml-auto'
                : 'bg-muted'
            )}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            {message.type === 'image' && message.imageUrl && (
              <img
                src={message.imageUrl}
                alt="Chat image"
                className="rounded-lg max-w-full max-h-64 object-cover"
              />
            )}
            
            {message.type === 'link' && message.linkPreview && (
              <div className="space-y-2">
                <p>{message.content}</p>
                <a
                  href={message.linkPreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border rounded-lg p-3 hover:bg-accent transition-colors"
                >
                  {message.linkPreview.image && (
                    <img
                      src={message.linkPreview.image}
                      alt={message.linkPreview.title}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  )}
                  <h4 className="font-semibold text-sm">{message.linkPreview.title}</h4>
                  <p className="text-xs text-muted-foreground">{message.linkPreview.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{message.linkPreview.siteName}</p>
                </a>
              </div>
            )}
            
            {message.type === 'text' && (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}
          </motion.div>
          
          <p className={cn(
            'text-xs text-muted-foreground',
            isOwnMessage ? 'text-right mr-1' : 'ml-1'
          )}>
            {formatTime(message.timestamp)}
          </p>
        </div>
      </motion.div>
    )
  }

  const renderSessionCard = (session: ChatSession, isActive: boolean = false) => (
    <motion.div
      key={session.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={cn(
          'cursor-pointer transition-all duration-200 hover:shadow-md',
          selectedSession?.id === session.id && 'ring-2 ring-primary'
        )}
        onClick={() => setSelectedSession(session)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/api/placeholder/40/40" />
                <AvatarFallback className="text-sm">
                  {session.customerName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold text-sm">{session.customerName}</h4>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={session.status === 'waiting' ? 'destructive' : 'default'}
                    className="text-xs"
                  >
                    {session.status === 'waiting' ? 'Waiting' : 'Active'}
                  </Badge>
                  {session.messageCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {session.messageCount} messages
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatDate(session.lastMessageAt)}
              </span>
              
              {isActive && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleCloseChat(session.id)}>
                      <X className="h-4 w-4 mr-2" />
                      Close Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          {session.status === 'waiting' && (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleAcceptChat(session)
              }}
              size="sm"
              className="w-full mt-2"
            >
              Accept Chat
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className={cn(
      'h-full flex flex-col',
      isFullscreen && 'fixed inset-0 z-50 bg-background'
    )}>
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Customer Support</CardTitle>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'h-2 w-2 rounded-full',
                      isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    )} />
                    <span className="text-sm text-muted-foreground">
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {supportTeamStatus?.activeChats || 0}/{supportTeamStatus?.maxChats || 5} Active Chats
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOnline(!isOnline)}
                className={cn(
                  isOnline ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                )}
              >
                {isOnline ? 'Go Offline' : 'Go Online'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Sessions List */}
        <div className="w-80 flex flex-col">
          <Tabs defaultValue="active" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">
                Active ({activeSessions.length})
              </TabsTrigger>
              <TabsTrigger value="waiting">
                Waiting ({waitingSessions.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="flex-1 mt-4">
              <div className="h-full overflow-y-auto">
                <div className="space-y-3 p-4">
                  {activeSessions.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No active chat sessions</p>
                    </div>
                  ) : (
                    activeSessions.map(session => renderSessionCard(session, true))
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="waiting" className="flex-1 mt-4">
              <div className="h-full overflow-y-auto">
                <div className="space-y-3 p-4">
                  {waitingSessions.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No waiting chat sessions</p>
                    </div>
                  ) : (
                    waitingSessions.map(session => renderSessionCard(session))
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedSession ? (
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/api/placeholder/40/40" />
                      <AvatarFallback>
                        {selectedSession.customerName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedSession.customerName}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={selectedSession.status === 'waiting' ? 'destructive' : 'default'}>
                          {selectedSession.status === 'waiting' ? 'Waiting' : 'Active'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Started {formatDate(selectedSession.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCloseChat(selectedSession.id)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Close Chat
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-4 py-3">
                  <div className="space-y-2">
                    {messages.map(renderMessage)}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <Separator />

                {/* Input Area */}
                <div className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <Textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="min-h-[60px] resize-none"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="h-8 w-8 p-0"
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ImageIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isTyping}
                      size="sm"
                    >
                      {isTyping ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a chat session</h3>
                <p className="text-muted-foreground">
                  Choose a chat session from the list to start supporting customers
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  )
} 
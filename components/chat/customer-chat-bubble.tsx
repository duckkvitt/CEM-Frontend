'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Image as ImageIcon, Paperclip, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { chatService } from '@/lib/chat-service'
import { supportAssignmentService } from '@/lib/support-assignment'
import { getCurrentUser, getCurrentUserRole } from '@/lib/auth'
import { ChatMessage, ChatSession } from '@/types/chat'
import { getLinkPreview, extractUrls, isUrl } from '@/lib/link-preview'
import { cn } from '@/lib/utils'
import { askGemini, type AIMessage } from '@/lib/ai/client'
import MarkdownView from '@/lib/ai/markdown'

interface CustomerChatBubbleProps {
  className?: string
}

export default function CustomerChatBubble({ className }: CustomerChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [chatSession, setChatSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isBotMode, setIsBotMode] = useState<boolean>(false)
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([])
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isModePinned, setIsModePinned] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [supportAvailability, setSupportAvailability] = useState<{
    totalOnline: number
    totalAvailable: number
    totalAtCapacity: number
  } | null>(null)
  const [estimatedWaitTime, setEstimatedWaitTime] = useState<number>(-1)
  const [isHydrated, setIsHydrated] = useState(false)
  const [hasDismissed, setHasDismissed] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentUser = getCurrentUser()
  const userRole = getCurrentUserRole()

  // Handle client-side hydration
  useEffect(() => {
    setIsHydrated(true)
    try {
      const dismissed = sessionStorage.getItem('customer_chat_dismissed') === '1'
      if (dismissed) setHasDismissed(true)
    } catch {}
  }, [])

  // Check for existing active chat session when component mounts
  useEffect(() => {
    if (isHydrated && currentUser && userRole === 'CUSTOMER') {
      const checkExistingChat = async () => {
        try {
          const existingSession = await chatService.getCustomerChatSession(currentUser.id.toString())
          const dismissed = (() => { try { return sessionStorage.getItem('customer_chat_dismissed') === '1' } catch { return false } })()
          if (existingSession && existingSession.status !== 'closed' && !dismissed && !hasDismissed) {
            console.log('Found existing chat session:', existingSession)
            setChatSession(existingSession)
            setIsOpen(true)
            if (!isModePinned) setIsBotMode(false)
            
            // Load existing messages
            const existingMessages = await chatService.getMessages(existingSession.id)
            setMessages(existingMessages)
            
            // Get support availability
            const availability = await supportAssignmentService.getSupportTeamAvailability()
            setSupportAvailability(availability)
            
            // Get estimated wait time
            const waitTime = await supportAssignmentService.getEstimatedWaitTime()
            setEstimatedWaitTime(waitTime)
          } else {
            if (!isModePinned) setIsBotMode(true)
          }
        } catch (error) {
          console.error('Error checking existing chat session:', error)
        }
      }
      
      checkExistingChat()
    }
  }, [isHydrated, currentUser, userRole, hasDismissed, isModePinned])

  useEffect(() => {
    if (isOpen && chatSession) {
      const unsubscribe = chatService.onChatMessages(chatSession.id, (newMessages) => {
        setMessages(newMessages)
        // Count unread messages (messages not sent by current user)
        const unread = newMessages.filter(msg => 
          msg.senderId !== currentUser?.id.toString() && !msg.read
        ).length
        setUnreadCount(unread)
      })

      return unsubscribe
    }
  }, [isOpen, chatSession?.id, currentUser?.id])

  useEffect(() => {
    if (isOpen && chatSession) {
      const unsubscribe = chatService.onChatSession(chatSession.id, (session) => {
        if (!session) return
        setChatSession((prev) => {
          // While ending, do not let remote updates flip status back
          if (isEnding) return prev || session
          // If we've already marked closed locally, keep it closed
          if (prev && prev.status === 'closed' && session.status !== 'closed') {
            return prev
          }
          return session
        })
      })

      return unsubscribe
    }
  }, [isOpen, chatSession?.id, isEnding])

  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0 && chatSession) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }, [messages.length, chatSession?.id])

  // Only show for CUSTOMER role after hydration
  if (!isHydrated || userRole !== 'CUSTOMER') {
    return null
  }

  const handleStartChat = async () => {
    if (!currentUser) {
      toast.error('Please log in to start a chat')
      return
    }

    // User explicitly starts chat again; clear dismissed flag
    try {
      sessionStorage.removeItem('customer_chat_dismissed')
    } catch {}
    setHasDismissed(false)

    setIsConnecting(true)

    try {
      // First check if there's an existing active chat session
      const existingSession = await chatService.getCustomerChatSession(currentUser.id.toString())
      if (existingSession && existingSession.status !== 'closed') {
        console.log('Found existing active chat session:', existingSession)
        setChatSession(existingSession)
        setIsOpen(true)
        if (!isModePinned) setIsBotMode(false)
        
        // Load existing messages
        const existingMessages = await chatService.getMessages(existingSession.id)
        setMessages(existingMessages)
        
        // Get support availability
        const availability = await supportAssignmentService.getSupportTeamAvailability()
        setSupportAvailability(availability)
        
        // Get estimated wait time
        const waitTime = await supportAssignmentService.getEstimatedWaitTime()
        setEstimatedWaitTime(waitTime)
        
        toast.success('Reconnected to existing chat session')
        setIsConnecting(false)
        return
      } else {
        // Open in bot mode without creating a support session yet
        setIsOpen(true)
        setIsBotMode(true)
        if (aiMessages.length === 0) {
          setIsAiThinking(true)
          try {
            const reply = await askGemini([
              { role: 'user', content: 'The user opened the chat. Greet them briefly and ask what they need help with.' },
            ])
            setAiMessages([{ role: 'assistant', content: reply }])
          } catch (e) {
            setAiMessages([{ role: 'assistant', content: 'Hello! How can I help you with CEM today?' }])
          } finally {
            setIsAiThinking(false)
          }
        }
        return
      }
    } catch (error) {
      console.error('Error starting chat:', error)
      toast.error('Failed to start chat session')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleCloseChat = () => {
    setIsOpen(false)
    setIsMinimized(false)
    setHasDismissed(true)
    try {
      sessionStorage.setItem('customer_chat_dismissed', '1')
    } catch {}
  }

  const handleStartNewChat = async () => {
    // Reset chat state completely
    setChatSession(null)
    setMessages([])
    setInputValue('')
    setUnreadCount(0)
    setEstimatedWaitTime(-1)
    setSupportAvailability(null)
    
    // Close the current chat window
    setIsOpen(false)
    
    // Wait a moment before starting new chat to ensure state is reset
    setTimeout(async () => {
      await handleStartChat()
    }, 100)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentUser) return
    if (!isBotMode && (isEnding || chatSession?.status === 'closed')) {
      toast.info('Chat has ended')
      return
    }

    const content = inputValue.trim()
    setInputValue('')

    if (isBotMode) {
      const history = [...aiMessages, { role: 'user', content } as AIMessage]
      setAiMessages(history)
      setIsAiThinking(true)
      try {
        const reply = await askGemini(history)
        setAiMessages([...history, { role: 'assistant', content: reply }])
      } catch (e) {
        toast.error('AI failed to respond')
      } finally {
        setIsAiThinking(false)
      }
      return
    }

    if (!chatSession) return
    setIsTyping(true)
    try {
      let messageType: 'text' | 'link' = 'text'
      let linkPreview: ChatMessage['linkPreview'] = undefined
      if (isUrl(content)) {
        messageType = 'link'
        const preview = await getLinkPreview(content)
        linkPreview = preview ?? undefined
      } else {
        const urls = extractUrls(content)
        if (urls.length > 0) {
          messageType = 'link'
          const preview = await getLinkPreview(urls[0])
          linkPreview = preview ?? undefined
        }
      }
      await chatService.sendMessage(chatSession.id, {
        senderId: currentUser.id.toString(),
        senderName: currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`,
        senderRole: currentUser.role?.name || 'CUSTOMER',
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
    if (!file || !chatSession || !currentUser) {
      console.log('Image upload: Missing file, chatSession, or currentUser')
      return
    }
    if (chatSession.status === 'closed' || isEnding) {
      toast.info('Chat has ended')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size too large. Maximum 10MB allowed.')
      return
    }

    console.log('Starting image upload:', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type,
      sessionId: chatSession.id,
      userId: currentUser.id 
    })

    setIsUploading(true)
    
    // Add timeout protection (increased to account for retries)
    const uploadTimeout = setTimeout(() => {
      console.error('Image upload timeout after 60 seconds')
      toast.error('Upload timeout. Please check your internet connection and try again.')
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }, 60000) // Increased to 60 seconds to account for retries

    try {
      // Step 1: Upload image to Firebase Storage (now includes retry mechanism)
      console.log('Step 1: Uploading image to Firebase Storage...')
      const imageUrl = await chatService.uploadImage(file, chatSession.id)
      console.log('Step 1: Image uploaded successfully:', imageUrl)
      
      // Check if it's a data URL (fallback method)
      const isDataUrl = imageUrl.startsWith('data:')
      if (isDataUrl) {
        console.log('Step 1: Using fallback data URL method')
        toast.success('Image uploaded using fallback method (may be slower to load)')
      }
      
      // Step 2: Send message with image
      console.log('Step 2: Sending image message...')
      const messageResult = await chatService.sendMessage(chatSession.id, {
        senderId: currentUser.id.toString(),
        senderName: currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`,
        senderRole: currentUser.role?.name || 'CUSTOMER',
        content: 'Image',
        type: 'image',
        read: false,
        imageUrl,
      })
      
      console.log('Step 2: Image message sent successfully:', messageResult)
      if (!isDataUrl) {
        toast.success('Image uploaded successfully')
      }
      
      // Clear timeout since upload succeeded
      clearTimeout(uploadTimeout)
      
    } catch (error) {
      console.error('Error uploading image:', error)
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('storage/unauthorized')) {
          toast.error('Upload failed: Unauthorized access to storage. Please contact support.')
        } else if (error.message.includes('storage/quota-exceeded')) {
          toast.error('Upload failed: Storage quota exceeded. Please try a smaller image.')
        } else if (error.message.includes('storage/retry-limit-exceeded') || error.message.includes('Network connectivity issue')) {
          toast.error('Upload failed: Network connectivity issue. Please check your internet connection and try again.')
        } else if (error.message.includes('storage/invalid-format')) {
          toast.error('Upload failed: Invalid file format. Please select a valid image file.')
        } else if (error.message.includes('Upload timed out') || error.message.includes('Upload timeout')) {
          toast.error('Upload timed out. Please check your internet connection and try again.')
        } else if (error.message.includes('attempts')) {
          toast.error('Upload failed after multiple attempts. Please try again later.')
        } else {
          toast.error(`Upload failed: ${error.message}`)
        }
      } else {
        toast.error('Failed to upload image. Please try again.')
      }
      
      // Clear timeout since error occurred
      clearTimeout(uploadTimeout)
    } finally {
      setIsUploading(false)
      // Clear the file input
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

  const handleSwitchToSupport = async () => {
    if (!currentUser) return
    setIsConnecting(true)
    try {
      // Check if we already have an active support session
      if (chatSession && chatSession.status !== 'closed') {
        // Reuse existing session
        setIsModePinned(true)
        setIsBotMode(false)
        toast.success('Switched to existing support session')
        setIsConnecting(false)
        return
      }

      setIsModePinned(true)
      const sessionId = await chatService.createChatSession(
        currentUser.id.toString(),
        currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`
      )
      const session = await chatService.getChatSession(sessionId)
      if (session) {
        setChatSession(session)
        setIsBotMode(false)
        setMessages([])
        setUnreadCount(0)
      }
      const waitTime = await supportAssignmentService.getEstimatedWaitTime()
      setEstimatedWaitTime(waitTime)
      toast.success('Connecting you to a support specialist...')
      if (session) {
        await chatService.sendMessage(session.id, {
          senderId: 'system',
          senderName: 'System',
          senderRole: 'SYSTEM',
          content: 'Customer switched from chatbot to human support.',
          type: 'text',
          read: true,
        })
      }
    } catch (e) {
      toast.error('Failed to start support chat')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSwitchToBot = async () => {
    setIsModePinned(true)
    setIsBotMode(true)
    setIsOpen(true)
    // Don't close the support session, just switch UI mode
    // The session remains active in the background
    if (aiMessages.length === 0) {
      setIsAiThinking(true)
      try {
        const reply = await askGemini([
          { role: 'user', content: 'The user switched back to the chatbot. Greet them briefly and ask how to help.' },
        ])
        setAiMessages([{ role: 'assistant', content: reply }])
      } catch {}
      setIsAiThinking(false)
    }
  }

  const handleEndChat = async () => {
    if (!chatSession || isEnding) return
    const confirmed = typeof window !== 'undefined' ? window.confirm('End this support chat?') : true
    if (!confirmed) return
    setIsEnding(true)
    // Optimistically mark as closed locally
    setChatSession(prev => prev ? { ...prev, status: 'closed' } as ChatSession : prev)
    setInputValue('')
    try {
      // Close session first to ensure remote state becomes closed asap
      await chatService.closeChatSession(chatSession.id)
      // Then post a system note (allowed even after close)
      await chatService.sendMessage(chatSession.id, {
        senderId: 'system',
        senderName: 'System',
        senderRole: 'SYSTEM',
        content: 'Customer ended the chat.',
        type: 'text',
        read: true,
      })
      toast.success('Chat ended')
    } catch (e) {
      // Revert if failed
      setChatSession(prev => prev ? { ...prev, status: 'active' } as ChatSession : prev)
      toast.error('Failed to end chat')
    } finally {
      setIsEnding(false)
    }
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

  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      {/* Chat Bubble Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <Button
              onClick={handleStartChat}
              disabled={isConnecting}
              size="lg"
              className="h-16 w-16 rounded-full shadow-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isConnecting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <MessageCircle className="h-6 w-6" />
              )}
            </Button>
            
            {/* Unread Badge */}
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2"
              >
                <Badge variant="destructive" className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-20 right-0 w-[22rem] sm:w-96"
          >
            <Card className="shadow-2xl border border-white/20 bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <CardTitle className="text-sm font-semibold tracking-tight">
                        {isBotMode ? 'CEM Assistant' : 'Customer Support'}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-[11px]">
                        <div className={cn(
                          'h-2 w-2 rounded-full',
                          isBotMode ? 'bg-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]' : (
                            chatSession?.status === 'closed' ? 'bg-rose-400' :
                            chatSession?.status === 'waiting' ? 'bg-amber-400 animate-pulse' :
                            'bg-emerald-400'
                          )
                        )} />
                        <span className="opacity-95">
                          {isBotMode ? 'Chatbot online' : (
                            chatSession?.status === 'waiting' ? 
                              (supportAvailability?.totalOnline === 0 ? 
                                'No support available' : 
                                supportAvailability?.totalAvailable === 0 ?
                                  'Support busy, please wait...' :
                                  `Connecting... (${supportAvailability?.totalAvailable || 0} available)`
                              ) : 
                              chatSession?.status === 'closed' ?
                                'Chat ended' :
                                'Online'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isBotMode ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSwitchToSupport}
                        className="mr-1 bg-white/15 hover:bg-white/25 text-white border-white/20"
                        disabled={isConnecting}
                      >
                        Chat with Support Team
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSwitchToBot}
                        className="mr-1 bg-white/15 hover:bg-white/25 text-white border-white/20"
                        disabled={isConnecting}
                      >
                        Back to AI Assistant
                      </Button>
                    )}
                    {!isBotMode && chatSession && chatSession.status !== 'closed' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleEndChat}
                        className="mr-1 shadow-sm"
                        disabled={isConnecting || isEnding}
                      >
                        End Chat
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCloseChat}
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CardContent className="p-0">
                      {/* Messages Area */}
                      <div className="h-80 overflow-y-auto px-4 py-3 bg-gradient-to-b from-white/40 to-transparent">
                        <div className="space-y-2">
                          {!isBotMode && chatSession?.status === 'waiting' && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-center py-8"
                            >
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                {supportAvailability?.totalOnline === 0 ? 
                                  'Tất cả nhân viên hỗ trợ hiện tại đang bận, xin vui lòng thử lại sau' :
                                  supportAvailability?.totalAvailable === 0 ?
                                    'Support team is busy, please wait...' :
                                    `Connecting to support team... (${supportAvailability?.totalAvailable || 0} available)`
                                }
                              </p>
                              {estimatedWaitTime > 0 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Estimated wait time: {Math.ceil(estimatedWaitTime / 60000)} minutes
                                </p>
                              )}
                            </motion.div>
                          )}

                          {!isBotMode && chatSession?.status === 'closed' && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-center py-8"
                            >
                              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 mb-4 shadow-sm">
                                <div className="flex items-center justify-center mb-2">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shadow-inner">
                                    <MessageCircle className="h-4 w-4 text-blue-600" />
                                  </div>
                                </div>
                                <h3 className="text-sm font-medium text-blue-900 mb-1">
                                  Chat Session Ended
                                </h3>
                                <p className="text-xs text-blue-700 mb-4">
                                  This support chat has ended. You can start a new chat by clicking the button below.
                                </p>
                                <Button
                                  onClick={handleStartNewChat}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white shadow"
                                >
                                  Start New Support Request
                                </Button>
                              </div>
                            </motion.div>
                          )}
                          {isBotMode ? (
                            <>
                              {aiMessages.map((m, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className={cn('flex gap-3 mb-4', m.role === 'user' ? 'justify-end' : 'justify-start')}
                                >
                                  {m.role !== 'user' && (
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src="/api/placeholder/32/32" />
                                      <AvatarFallback className="text-xs">AI</AvatarFallback>
                                    </Avatar>
                                  )}
                                  <div className={cn('max-w-[70%] space-y-1', m.role === 'user' ? 'order-first' : 'order-last')}>
                                    <motion.div className={cn('rounded-2xl px-4 py-2 text-sm', m.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted')}>
                                      {m.role === 'user' ? (
                                        <p className="whitespace-pre-wrap">{m.content}</p>
                                      ) : (
                                        <MarkdownView content={m.content} />
                                      )}
                                    </motion.div>
                                  </div>
                                </motion.div>
                              ))}
                              {isAiThinking && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  CEM Assistant is typing…
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              {messages.map(renderMessage)}
                            </>
                          )}
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
                            placeholder={!isBotMode && (chatSession?.status === 'closed' || isEnding) ? 'Chat has ended' : "Type your message..."}
                            className="min-h-[60px] resize-none border border-transparent bg-white/70 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-blue-500/30 rounded-xl shadow-inner"
                            disabled={!isBotMode && (chatSession?.status === 'waiting' || chatSession?.status === 'closed' || isEnding)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isBotMode || isUploading || chatSession?.status === 'waiting' || chatSession?.status === 'closed' || isEnding}
                              className="h-8 w-8 p-0 rounded-full hover:bg-blue-50"
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
                            disabled={!inputValue.trim() || (isBotMode ? isAiThinking : (isTyping || chatSession?.status === 'waiting' || chatSession?.status === 'closed' || isEnding))}
                            size="sm"
                            className="h-9 w-9 p-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
                          >
                            {isBotMode ? (isAiThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />) : (isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />)}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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
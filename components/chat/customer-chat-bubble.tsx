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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { chatService } from '@/lib/chat-service'
import { supportAssignmentService } from '@/lib/support-assignment'
import { getCurrentUser, getCurrentUserRole } from '@/lib/auth'
import { ChatMessage, ChatSession } from '@/types/chat'
import { getLinkPreview, extractUrls, isUrl } from '@/lib/link-preview'
import { cn } from '@/lib/utils'

interface CustomerChatBubbleProps {
  className?: string
}

export default function CustomerChatBubble({ className }: CustomerChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [chatSession, setChatSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [supportAvailability, setSupportAvailability] = useState<{
    totalOnline: number
    totalAvailable: number
    totalAtCapacity: number
  } | null>(null)
  const [estimatedWaitTime, setEstimatedWaitTime] = useState<number>(-1)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentUser = getCurrentUser()
  const userRole = getCurrentUserRole()

  // Only show for CUSTOMER role
  if (userRole !== 'CUSTOMER') {
    return null
  }

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
  }, [isOpen, chatSession, currentUser?.id])

  useEffect(() => {
    if (isOpen && chatSession) {
      const unsubscribe = chatService.onChatSession(chatSession.id, (session) => {
        setChatSession(session)
      })

      return unsubscribe
    }
  }, [isOpen, chatSession])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleStartChat = async () => {
    if (!currentUser) return

    setIsConnecting(true)
    try {
      // Check support team availability first
      const availability = await supportAssignmentService.getSupportTeamAvailability()
      setSupportAvailability(availability)

      if (availability.totalOnline === 0) {
        toast.error('Tất cả nhân viên hỗ trợ hiện tại đang bận, xin vui lòng thử lại sau')
        setIsConnecting(false)
        return
      }

      // Check for existing active session
      let session = await chatService.getCustomerChatSession(currentUser.id.toString())
      
      if (!session || session.status === 'closed') {
        // Create new session
        const sessionId = await chatService.createChatSession(
          currentUser.id.toString(),
          currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`
        )
        session = await chatService.getChatSession(sessionId)
      }

      if (session) {
        setChatSession(session)
        setIsOpen(true)
        setIsMinimized(false)

        // Start auto-assignment for this session
        supportAssignmentService.startAutoAssignment()

        // Get estimated wait time
        const waitTime = await supportAssignmentService.getEstimatedWaitTime()
        setEstimatedWaitTime(waitTime)
      }
    } catch (error) {
      toast.error('Failed to start chat session')
      console.error('Error starting chat:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !chatSession || !currentUser) return

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
    if (!file || !chatSession || !currentUser) return

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size too large. Maximum 10MB allowed.')
      return
    }

    setIsUploading(true)
    try {
      const imageUrl = await chatService.uploadImage(file, chatSession.id)
      
      await chatService.sendMessage(chatSession.id, {
        senderId: currentUser.id.toString(),
        senderName: currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`,
        senderRole: currentUser.role?.name || 'CUSTOMER',
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

  const renderMessage = (message: ChatMessage) => {
    const isOwnMessage = message.senderId === currentUser?.id.toString()

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
            className="absolute bottom-20 right-0 w-96"
          >
            <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        Customer Support
                      </CardTitle>
                                              <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-xs opacity-90">
                            {chatSession?.status === 'waiting' ? 
                              (supportAvailability?.totalOnline === 0 ? 
                                'No support available' : 
                                `Connecting... (${supportAvailability?.totalAvailable || 0} available)`
                              ) : 
                              'Online'
                            }
                          </span>
                        </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMinimized(!isMinimized)}
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
                      <ScrollArea className="h-80 px-4 py-3">
                        <div className="space-y-2">
                          {chatSession?.status === 'waiting' && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-center py-8"
                            >
                              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                {supportAvailability?.totalOnline === 0 ? 
                                  'Tất cả nhân viên hỗ trợ hiện tại đang bận, xin vui lòng thử lại sau' :
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
                          
                          {messages.map(renderMessage)}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>

                      <Separator />

                      {/* Input Area */}
                      <div className="p-4 space-y-3">
                        <div className="flex gap-2">
                          <Textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            className="min-h-[60px] resize-none border-0 bg-muted/50 focus:bg-white"
                            disabled={chatSession?.status === 'waiting'}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading || chatSession?.status === 'waiting'}
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
                            disabled={!inputValue.trim() || isTyping || chatSession?.status === 'waiting'}
                            size="sm"
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                          >
                            {isTyping ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
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
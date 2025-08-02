'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Users, Settings } from 'lucide-react'
import Link from 'next/link'

export default function ChatDemoPage() {
  const [currentRole, setCurrentRole] = useState<'CUSTOMER' | 'SUPPORT_TEAM' | null>(null)

  const handleRoleSelect = (role: 'CUSTOMER' | 'SUPPORT_TEAM') => {
    // Simulate role change by storing in localStorage
    localStorage.setItem('demoRole', role)
    setCurrentRole(role)
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Customer Support Chat System Demo</h1>
          <p className="text-muted-foreground text-lg">
            Test the beautiful chat interface with different user roles
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Customer Demo */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Customer Experience</CardTitle>
                  <Badge variant="secondary">CUSTOMER Role</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Experience the beautiful animated chat bubble that appears in the bottom-right corner.
                Send messages, upload images, and get real-time support.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li>• Beautiful animated chat bubble</li>
                <li>• Real-time messaging</li>
                <li>• Image upload capability</li>
                <li>• Link preview functionality</li>
                <li>• Automatic support team connection</li>
                <li>• Status indicators and wait times</li>
              </ul>
              <Button 
                onClick={() => handleRoleSelect('CUSTOMER')}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Test as Customer
              </Button>
            </CardContent>
          </Card>

          {/* Support Team Demo */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Support Team Dashboard</CardTitle>
                  <Badge variant="secondary">SUPPORT_TEAM Role</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Access the comprehensive support dashboard to handle multiple customer chats
                with beautiful animations and real-time updates.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li>• Multi-customer chat interface</li>
                <li>• Real-time session management</li>
                <li>• Online/offline status control</li>
                <li>• Capacity management (max 5 customers)</li>
                <li>• Beautiful animations and UI</li>
                <li>• Automatic customer assignment</li>
              </ul>
              <Button 
                onClick={() => handleRoleSelect('SUPPORT_TEAM')}
                className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
              >
                Test as Support Team
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              How to Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">For Customer Testing:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Click "Test as Customer" above</li>
                  <li>Navigate to any page in the application</li>
                  <li>Look for the animated chat bubble in the bottom-right corner</li>
                  <li>Click the bubble to start a chat session</li>
                  <li>Try sending text messages, images, and links</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">For Support Team Testing:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Click "Test as Support Team" above</li>
                  <li>Navigate to the "Customer Support" section in the sidebar</li>
                  <li>Go online to receive chat requests</li>
                  <li>Accept waiting chat sessions</li>
                  <li>Respond to customer messages</li>
                  <li>Manage multiple concurrent chats</li>
                </ol>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Important Notes:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• This is a demo - Firebase configuration is required for full functionality</li>
                  <li>• Real-time features work with proper Firebase setup</li>
                  <li>• Image upload requires Firebase Storage configuration</li>
                  <li>• The chat system uses role-based access control</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Role Status */}
        {currentRole && (
          <div className="mt-6 text-center">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Current Demo Role: {currentRole}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              {currentRole === 'CUSTOMER' 
                ? 'Look for the chat bubble in the bottom-right corner of any page'
                : 'Navigate to "Customer Support" in the sidebar to access the dashboard'
              }
            </p>
          </div>
        )}

        {/* Navigation Links */}
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline">Go to Dashboard</Button>
          </Link>
          <Link href="/support">
            <Button variant="outline">Go to Support Page</Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 
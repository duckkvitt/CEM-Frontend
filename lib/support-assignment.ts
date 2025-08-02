import { chatService } from './chat-service'
import { SupportTeamStatus, ChatSession } from '@/types/chat'
import { getUsersByRole } from './api'
import { getCurrentUser } from './auth'

export class SupportAssignmentService {
  private static instance: SupportAssignmentService
  private assignmentInterval: NodeJS.Timeout | null = null

  static getInstance(): SupportAssignmentService {
    if (!SupportAssignmentService.instance) {
      SupportAssignmentService.instance = new SupportAssignmentService()
    }
    return SupportAssignmentService.instance
  }

  async startAutoAssignment(): Promise<void> {
    // Stop any existing interval
    if (this.assignmentInterval) {
      clearInterval(this.assignmentInterval)
    }

    // Start auto-assignment every 10 seconds
    this.assignmentInterval = setInterval(async () => {
      await this.processWaitingSessions()
    }, 10000)

    // Process immediately
    await this.processWaitingSessions()
  }

  async stopAutoAssignment(): Promise<void> {
    if (this.assignmentInterval) {
      clearInterval(this.assignmentInterval)
      this.assignmentInterval = null
    }
  }

  private async processWaitingSessions(): Promise<void> {
    try {
      // Get all waiting sessions
      const waitingSessions = await chatService.getWaitingChatSessions()
      
      if (waitingSessions.length === 0) {
        return
      }

      // Get all online support team members
      const onlineSupportTeams = await chatService.getOnlineSupportTeams()
      
      if (onlineSupportTeams.length === 0) {
        // No support team members online
        return
      }

      // Sort support teams by available capacity (least busy first)
      const availableSupportTeams = onlineSupportTeams
        .filter(team => team.activeChats < team.maxChats)
        .sort((a, b) => {
          const aCapacity = a.maxChats - a.activeChats
          const bCapacity = b.maxChats - b.activeChats
          return bCapacity - aCapacity // Most available capacity first
        })

      if (availableSupportTeams.length === 0) {
        // All support team members are at capacity
        return
      }

      // Assign waiting sessions to available support teams
      for (const session of waitingSessions) {
        const availableTeam = availableSupportTeams.find(team => 
          team.activeChats < team.maxChats
        )

        if (availableTeam) {
          try {
            await chatService.assignSupportTeam(
              session.id,
              availableTeam.id,
              availableTeam.name
            )

            // Update the team's active chat count
            availableTeam.activeChats += 1
            await chatService.updateSupportTeamStatus(availableTeam.id, {
              activeChats: availableTeam.activeChats,
            })

          } catch (error) {
            console.error(`Failed to assign session ${session.id}:`, error)
          }
        }
      }
    } catch (error) {
      console.error('Error in auto-assignment process:', error)
    }
  }

  async getSupportTeamAvailability(): Promise<{
    totalOnline: number
    totalAvailable: number
    totalAtCapacity: number
  }> {
    try {
      console.log('getSupportTeamAvailability - Starting availability check')
      const onlineTeams = await chatService.getOnlineSupportTeams()
      console.log('getSupportTeamAvailability - Initial online teams:', onlineTeams.length)
      
      // If no support teams are online, try to initialize them from real users
      if (onlineTeams.length === 0) {
        console.log('getSupportTeamAvailability - No online teams found, initializing from backend')
        
        // Only try to initialize if we have a valid token
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') : null
        if (token) {
          await this.initializeSupportTeamsFromBackend()
          
          // Check again after initialization
          const updatedTeams = await chatService.getOnlineSupportTeams()
          console.log('getSupportTeamAvailability - After initialization, online teams:', updatedTeams.length)
          
          if (updatedTeams.length === 0) {
            console.log('getSupportTeamAvailability - Still no online teams after initialization')
            return {
              totalOnline: 0,
              totalAvailable: 0,
              totalAtCapacity: 0,
            }
          }
          
          const totalOnline = updatedTeams.length
          const totalAvailable = updatedTeams.filter(team => team.activeChats < team.maxChats).length
          const totalAtCapacity = updatedTeams.filter(team => team.activeChats >= team.maxChats).length

          console.log('getSupportTeamAvailability - Final results:', { totalOnline, totalAvailable, totalAtCapacity })
          return {
            totalOnline,
            totalAvailable,
            totalAtCapacity,
          }
        } else {
          console.log('getSupportTeamAvailability - No valid token, returning no availability')
          return {
            totalOnline: 0,
            totalAvailable: 0,
            totalAtCapacity: 0,
          }
        }
      }
      
      const totalOnline = onlineTeams.length
      const totalAvailable = onlineTeams.filter(team => team.activeChats < team.maxChats).length
      const totalAtCapacity = onlineTeams.filter(team => team.activeChats >= team.maxChats).length

      console.log('getSupportTeamAvailability - Results:', { totalOnline, totalAvailable, totalAtCapacity })
      return {
        totalOnline,
        totalAvailable,
        totalAtCapacity,
      }
    } catch (error) {
      console.error('Error getting support team availability:', error)
      return {
        totalOnline: 0,
        totalAvailable: 0,
        totalAtCapacity: 0,
      }
    }
  }

  private async initializeSupportTeamsFromBackend(): Promise<void> {
    try {
      console.log('initializeSupportTeamsFromBackend - Starting initialization')
      
      // Check if we have a valid token before making the API call
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') : null
      if (!token) {
        console.log('initializeSupportTeamsFromBackend - No access token found, skipping backend initialization')
        return
      }

      // Get real SUPPORT_TEAM users from the backend
      const supportTeamUsers = await getUsersByRole('SUPPORT_TEAM')
      console.log('initializeSupportTeamsFromBackend - Backend response:', supportTeamUsers)
      
      if (supportTeamUsers && supportTeamUsers.content && supportTeamUsers.content.length > 0) {
        console.log('initializeSupportTeamsFromBackend - Found support team users:', supportTeamUsers.content.length)
        // Initialize each support team user
        for (const user of supportTeamUsers.content) {
          if (user.status === 'ACTIVE' && user.emailVerified) {
            console.log('initializeSupportTeamsFromBackend - Initializing user:', user.id, user.fullName)
            const supportTeamStatus: SupportTeamStatus = {
              id: user.id.toString(),
              name: user.fullName || `${user.firstName} ${user.lastName}`,
              online: true, // Set as online by default for active users
              activeChats: 0,
              maxChats: 5, // Default capacity
              lastSeen: Date.now(),
            }
            
            await chatService.updateSupportTeamStatus(user.id.toString(), supportTeamStatus)
            console.log('initializeSupportTeamsFromBackend - Successfully initialized user:', user.id)
          } else {
            console.log('initializeSupportTeamsFromBackend - Skipping user (not active or not verified):', user.id, user.status, user.emailVerified)
          }
        }
      } else {
        console.log('initializeSupportTeamsFromBackend - No support team users found in backend')
      }
    } catch (error) {
      console.error('Error initializing support teams from backend:', error)
      // Don't throw the error, just log it and continue
      // This prevents the 403 error from breaking the chat functionality
    }
  }

  async getEstimatedWaitTime(): Promise<number> {
    try {
      const waitingSessions = await chatService.getWaitingChatSessions()
      const availability = await this.getSupportTeamAvailability()

      if (availability.totalAvailable === 0) {
        return -1 // No available support
      }

      // Simple estimation: average 5 minutes per chat session
      const averageSessionTime = 5 * 60 * 1000 // 5 minutes in milliseconds
      const estimatedWaitTime = (waitingSessions.length / availability.totalAvailable) * averageSessionTime

      return Math.max(0, estimatedWaitTime)
    } catch (error) {
      console.error('Error calculating estimated wait time:', error)
      return -1
    }
  }
}

export const supportAssignmentService = SupportAssignmentService.getInstance() 
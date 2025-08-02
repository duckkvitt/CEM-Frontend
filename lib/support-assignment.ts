import { chatService } from './chat-service'
import { SupportTeamStatus, ChatSession } from '@/types/chat'

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

            console.log(`Assigned session ${session.id} to support team ${availableTeam.name}`)
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
      const onlineTeams = await chatService.getOnlineSupportTeams()
      
      const totalOnline = onlineTeams.length
      const totalAvailable = onlineTeams.filter(team => team.activeChats < team.maxChats).length
      const totalAtCapacity = onlineTeams.filter(team => team.activeChats >= team.maxChats).length

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
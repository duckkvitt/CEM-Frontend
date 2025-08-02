import { LinkPreview } from '@/types/chat'

export async function getLinkPreview(url: string): Promise<LinkPreview | null> {
  try {
    // Simple link preview without external API
    const urlObj = new URL(url)
    
    return {
      url: url,
      title: urlObj.hostname,
      description: `Visit ${urlObj.hostname}`,
      image: '',
      siteName: urlObj.hostname,
    }
  } catch (error) {
    console.error('Error creating link preview:', error)
    return null
  }
}

export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.match(urlRegex) || []
}

export function isUrl(text: string): boolean {
  try {
    new URL(text)
    return true
  } catch {
    return false
  }
} 
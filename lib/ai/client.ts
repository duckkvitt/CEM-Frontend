export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function askGemini(messages: AIMessage[]): Promise<string> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`AI request failed: ${text}`)
  }
  const data = await res.json()
  return data.reply as string
}



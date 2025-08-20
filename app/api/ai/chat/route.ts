import { NextResponse } from 'next/server'
import { buildSiteContext } from '@/lib/ai/context'

interface ChatMessageInput {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const messages: ChatMessageInput[] = Array.isArray(body?.messages) ? body.messages : []

    if (messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 })
    }

    // Use request origin to build dev links; fall back to empty
    const origin = (req.headers as any).get?.('origin') || ''
    const siteContext = await buildSiteContext({ origin })

    // Compose system instruction to constrain scope strictly to the application domain
    const systemInstruction = [
      'You are CEM Assistant, a domain-limited expert for the CEM application.',
      '',
      'Goals:',
      '- Answer only about CEM features, data, workflows, and navigation.',
      '- Use the sitemap and links to guide users precisely (dev and prod).',
      '- Be concise, practical, and accurate. Do not invent features.',
      '',
      'Sitemap and Feature Index (auto-generated):',
      siteContext,
    ].join('\n')

    const contents = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    const payload = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents,
      generation_config: {
        temperature: 0.2,
        top_p: 0.8,
        top_k: 40,
        max_output_tokens: 512,
        stop_sequences: [] as string[],
      },
      safety_settings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
        { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_LOW_AND_ABOVE' },
      ],
    }

    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      let details: any = undefined
      try { details = await res.json() } catch { details = await res.text() }
      return NextResponse.json({ error: 'Gemini API error', details }, { status: res.status })
    }

    const data = await res.json()
    // Extract first candidate text safely
    const candidateText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!candidateText) {
      return NextResponse.json({ reply: 'Sorry, I could not generate a response.' })
    }

    return NextResponse.json({ reply: candidateText })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 })
  }
}



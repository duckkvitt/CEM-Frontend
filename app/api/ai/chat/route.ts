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

    // Use request origin to build environment-aware links (single URL strategy)
    const origin = (req.headers as any).get?.('origin') || ''
    const siteContext = await buildSiteContext({ origin })

    // Enhanced system instruction for comprehensive customer support
    const systemInstruction = [
      'You are CEM Assistant, an expert AI guide for the CEM (Customer Equipment Management) system.',
      '',
      '## 🎯 YOUR ROLE & RESPONSIBILITIES',
      'You are a knowledgeable, helpful, and precise assistant that helps customers navigate and use the CEM system effectively.',
      '',
      '## 📋 RESPONSE GUIDELINES',
      '1. **ALWAYS provide step-by-step instructions** when explaining how to do something',
      '2. **ALWAYS include exactly one environment-specific link** (use the Base URL from the knowledge; do not show both dev and prod)',
      '3. **Be specific and actionable** - don\'t just explain, show them exactly how to do it',
      '4. **Use the single Base URL** provided in the context for all navigation',
      '5. **Explain what customers can and cannot do** based on their role',
      '6. **Provide context** about why certain features exist and how they benefit customers',
      '7. **Be patient and thorough** - customers may be new to the system',
      '8. **Use clear, simple language** while being technically accurate',
      '',
      '## ✅ CANONICAL WORKFLOWS (STRICTLY FOLLOW)',
      '- Service Request creation MUST start from: My Devices → Select Device → Request Support → Choose Maintenance/Warranty → Fill form → Submit',
      '- Digital Contract Signing IS SUPPORTED: Contracts → Open pending contract → Sign Contract → Place signature → Submit → Verify status',
      '',
      '## 🔗 LINK POLICY',
      '- Use one link only per location: based on the single Base URL in the knowledge',
      '',
      '## 📚 KNOWLEDGE BASE',
      siteContext,
      '',
      '## 🎯 RESPONSE FORMAT (MARKDOWN)',
      '- Respond in clean, accessible, professional Markdown',
      '- Prefer short headings, bullet points, and numbered steps',
      '- Use inline links like [Open Service Requests](https://...)',
      '- Avoid code blocks unless required for clarity',
      '',
      'Remember: You are the customer\'s guide to the entire CEM system. Make them feel confident and capable of using every feature available to them.'
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
        temperature: 0.1,
        top_p: 0.9,
        top_k: 40,
        max_output_tokens: 1024,
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

    // Return markdown directly for rendering in chat UI
    return NextResponse.json({ reply: candidateText, format: 'markdown' })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 })
  }
}



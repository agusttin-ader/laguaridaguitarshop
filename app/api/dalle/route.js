import { NextResponse } from 'next/server'

/**
 * Simple proxy route to call OpenAI image generation. Requires
 * `OPENAI_API_KEY` to be set in environment. This keeps the key server-side.
 *
 * POST body: { prompt: string }
 */
export async function POST(req) {
  try {
    const body = await req.json()
    const prompt = body.prompt || ''
    if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })

    const key = process.env.OPENAI_API_KEY
    if (!key) return NextResponse.json({ error: 'Server missing OPENAI_API_KEY' }, { status: 500 })

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({ prompt, n: 1, size: '1024x1024' })
    })

    if (!res.ok) {
      const txt = await res.text()
      return NextResponse.json({ error: 'OpenAI error', details: txt }, { status: res.status })
    }

    const data = await res.json()
    // data.data[0].b64_json or url depending on API response shape
    return NextResponse.json({ data })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

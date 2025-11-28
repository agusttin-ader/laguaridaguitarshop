import { NextResponse } from 'next/server'

export async function POST(req){
  try {
    await req.json()
    // For now we keep a minimal server-side handling. Integration with email/CRM can be added later.
    return NextResponse.json({ ok: true })
  } catch {
    console.error('Contact API error')
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
  }
}

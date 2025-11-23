import { NextResponse } from 'next/server'

export async function POST(req){
  try {
    const body = await req.json()
    // For now we just log the message server-side. Integration with email/CRM can be added later.
    // Keep this minimal and safe.
    console.log('Contact form submission:', JSON.stringify({ name: body.name, email: body.email, subject: body.subject }))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact API error', err)
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
  }
}

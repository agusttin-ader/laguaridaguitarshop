#!/usr/bin/env node
/*
Simple test script to sign in a user and call the admin products API.

Usage:
  node scripts/test-admin.js <email> <password> [apiUrl]

It reads Supabase URL and ANON key from environment variables (or from .env.local when you run with your shell).
Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY set.
*/

import('dotenv/config')
  .then(async () => {
    const [,, email, password, apiUrlArg] = process.argv
    if (!email || !password) {
      console.error('Usage: node scripts/test-admin.js <email> <password> [apiUrl]')
      process.exit(1)
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!SUPABASE_URL || !SUPABASE_ANON) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment')
      process.exit(1)
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

    console.log('Signing in...')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      console.error('Sign in error:', error.message || error)
      process.exit(1)
    }

    const accessToken = data.session?.access_token
    if (!accessToken) {
      console.error('No access token received. Check credentials and email confirmation.')
      process.exit(1)
    }

    console.log('Got access token. Calling admin API...')
    const apiUrl = apiUrlArg || 'http://localhost:3000/api/admin/products'

    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })

    const text = await res.text()
    console.log('API response status:', res.status)
    console.log(text)
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

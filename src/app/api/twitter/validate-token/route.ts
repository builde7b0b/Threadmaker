import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { rateLimit, RATE_LIMITS, withSecurity } from '@/lib/security'

async function POSTHandler(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimit('twitter-validate', RATE_LIMITS.API)(request)
    if (rateLimitResponse) return rateLimitResponse

    // Get user from Supabase
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 400 }
      )
    }

    console.log('🔍 Validating Twitter access token...')

    const response = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    const isValid = response.ok

    if (isValid) {
      console.log('✅ Twitter token is valid')
    } else {
      console.log('❌ Twitter token is invalid or expired')
    }

    return NextResponse.json({ valid: isValid })
  } catch (error) {
    console.error('❌ Twitter token validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate Twitter token' },
      { status: 500 }
    )
  }
}

// Apply security middleware
export const POST = withSecurity(POST)

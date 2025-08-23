import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { rateLimit, RATE_LIMITS, withSecurity } from '@/lib/security'

// Twitter API configuration
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!

async function POSTHandler(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimit('twitter-refresh', RATE_LIMITS.API)(request)
    if (rateLimitResponse) return rateLimitResponse

    // Get user from Supabase
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token required' },
        { status: 400 }
      )
    }

    console.log('🔄 Refreshing Twitter access token...')

    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`)
    }

    const tokens = await response.json()
    console.log('✅ Twitter token refreshed successfully')

    return NextResponse.json(tokens)
  } catch (error) {
    console.error('❌ Twitter token refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh Twitter token' },
      { status: 500 }
    )
  }
}

// Apply security middleware
export const POST = withSecurity(POSTHandler)

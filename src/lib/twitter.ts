import { GeneratedThread } from '@/types'

// Twitter API configuration (client-side only)
const getTwitterConfig = () => {
  // Only access window on client-side
  const isClient = typeof window !== 'undefined'
  const origin = isClient ? window.location.origin : 'http://localhost:3000'

  return {
    clientId: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_TWITTER_REDIRECT_URI || `${process.env.NEXT_PUBLIC_NEXTAUTH_URL || origin}/api/twitter/callback`
  }
}

// Post a thread to Twitter (client-side - calls server API)
export const postThreadToTwitter = async (
  thread: GeneratedThread,
  accessToken: string,
  refreshToken?: string
): Promise<{ success: boolean; tweetIds: string[]; error?: string }> => {
  try {
    console.log('🐦 Starting Twitter thread posting via API...')

    const response = await fetch('/api/twitter/post-thread', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        thread,
        accessToken,
        refreshToken
      })
    })

    const result = await response.json()

    if (response.ok && result.success) {
      console.log('✅ Thread posted to Twitter successfully!')
      return { success: true, tweetIds: result.tweetIds }
    } else {
      console.error('❌ Twitter posting failed:', result.error)
      return { success: false, tweetIds: [], error: result.error || 'Failed to post to Twitter' }
    }

  } catch (error) {
    console.error('❌ Twitter posting error:', error)

    let errorMessage = 'Failed to post to Twitter'
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        errorMessage = 'Twitter rate limit exceeded. Please try again later.'
      } else if (error.message.includes('unauthorized')) {
        errorMessage = 'Twitter authentication expired. Please reconnect your account.'
      } else if (error.message.includes('duplicate')) {
        errorMessage = 'This content was already posted recently.'
      } else {
        errorMessage = error.message
      }
    }

    return { success: false, tweetIds: [], error: errorMessage }
  }
}

// Get Twitter OAuth URL
export const getTwitterAuthUrl = (state?: string) => {
  const config = getTwitterConfig()

  if (!config.clientId) {
    throw new Error('Twitter Client ID not configured')
  }

  const baseUrl = 'https://twitter.com/i/oauth2/authorize'
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: 'tweet.read tweet.write users.read offline.access',
    state: state || 'twitter-oauth',
    code_challenge: 'challenge',
    code_challenge_method: 'plain'
  })

  return `${baseUrl}?${params.toString()}`
}

// Refresh Twitter access token (client-side - calls server API)
export const refreshTwitterToken = async (refreshToken: string) => {
  try {
    const response = await fetch('/api/twitter/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken })
    })

    if (!response.ok) {
      throw new Error('Failed to refresh Twitter token')
    }

    return await response.json()
  } catch (error) {
    console.error('Token refresh error:', error)
    throw error
  }
}

// Validate Twitter token (client-side - calls server API)
export const validateTwitterToken = async (accessToken: string) => {
  try {
    const response = await fetch('/api/twitter/validate-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken })
    })

    const result = await response.json()
    return result.valid
  } catch (error) {
    console.error('Token validation error:', error)
    return false
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RATE_LIMITS, withSecurity } from '@/lib/security'

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimit('twitter-auth', RATE_LIMITS.AUTH)(request)
  if (rateLimitResponse) return rateLimitResponse
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    console.error('Twitter OAuth error:', error)
    const redirectUrl = sessionStorage.getItem('twitter_auth_redirect') || '/'
    return NextResponse.redirect(new URL(`${redirectUrl}?error=${error}`))
  }

  if (!code) {
    console.error('No authorization code received')
    const redirectUrl = sessionStorage.getItem('twitter_auth_redirect') || '/'
    return NextResponse.redirect(new URL(`${redirectUrl}?error=no_code`))
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
        ).toString('base64')}`
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TWITTER_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/callback/twitter`,
        code_verifier: 'challenge'
      })
    })

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`)
    }

    const tokens = await tokenResponse.json()

    // Get user information
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    })

    if (!userResponse.ok) {
      throw new Error(`Failed to get user info: ${userResponse.status}`)
    }

    const userData = await userResponse.json()

    // Store tokens and user data in localStorage (client-side)
    const script = `
      try {
        localStorage.setItem('twitter_access_token', '${tokens.access_token}');
        localStorage.setItem('twitter_refresh_token', '${tokens.refresh_token || ''}');
        localStorage.setItem('twitter_username', '${userData.data.username}');
        localStorage.setItem('twitter_user_id', '${userData.data.id}');
        console.log('✅ Twitter OAuth successful:', {
          username: '${userData.data.username}',
          userId: '${userData.data.id}'
        });
      } catch (error) {
        console.error('Failed to store Twitter tokens:', error);
      }

      // Redirect back to the original page
      const redirectUrl = sessionStorage.getItem('twitter_auth_redirect') || '/';
      sessionStorage.removeItem('twitter_auth_redirect');
      window.location.href = redirectUrl;
    `

    // Return HTML that executes the script
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Twitter Authentication</title>
        </head>
        <body>
          <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
            <div style="text-align: center;">
              <h2>✅ Twitter Connected!</h2>
              <p>Redirecting you back...</p>
            </div>
          </div>
          <script>${script}</script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error) {
    console.error('Twitter OAuth callback error:', error)
    const redirectUrl = sessionStorage.getItem('twitter_auth_redirect') || '/'
    return NextResponse.redirect(new URL(`${redirectUrl}?error=oauth_failed`))
  }
}

// Apply security middleware
export const GET = withSecurity(GET)

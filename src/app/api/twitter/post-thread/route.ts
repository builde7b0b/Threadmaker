import { NextRequest, NextResponse } from 'next/server'
import { TwitterApi } from 'twitter-api-v2'
import { supabase } from '@/lib/supabase'
import { rateLimit, RATE_LIMITS, withSecurity } from '@/lib/security'

// Twitter API configuration
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!

// Create Twitter client for posting
const createTwitterClient = (accessToken: string, refreshToken?: string) => {
  return new TwitterApi({
    appKey: TWITTER_CLIENT_ID,
    appSecret: TWITTER_CLIENT_SECRET,
    accessToken,
    accessSecret: refreshToken,
  })
}

async function POSTHandler(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimit('twitter-post', RATE_LIMITS.TWITTER)(request)
    if (rateLimitResponse) return rateLimitResponse

    // Get user from Supabase
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { thread, accessToken, refreshToken } = await request.json()

    if (!thread || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('🐦 Starting Twitter thread posting...')

    const client = createTwitterClient(accessToken, refreshToken)
    const tweetIds: string[] = []

    // Post the first tweet
    const firstTweet = await client.v2.tweet(thread.tweets[0].content)
    tweetIds.push(firstTweet.data.id)

    console.log(`✅ Posted first tweet: ${firstTweet.data.id}`)

    // Post remaining tweets as replies
    for (let i = 1; i < thread.tweets.length; i++) {
      const replyTweet = await client.v2.reply(
        thread.tweets[i].content,
        firstTweet.data.id
      )
      tweetIds.push(replyTweet.data.id)
      console.log(`✅ Posted reply tweet ${i + 1}/${thread.tweets.length}: ${replyTweet.data.id}`)

      // Add small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('🎉 Successfully posted Twitter thread!')
    return NextResponse.json({
      success: true,
      tweetIds,
      message: 'Thread posted successfully!'
    })

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

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// Apply security middleware
export const POST = withSecurity(POSTHandler)

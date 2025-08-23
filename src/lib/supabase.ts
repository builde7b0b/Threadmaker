import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types
export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  subscription_status: 'free' | 'active' | 'canceled' | 'past_due'
  subscription_id?: string
  stripe_customer_id?: string
  created_at: string
  updated_at: string
}

export interface SubscriptionUsage {
  id: string
  user_id: string
  threads_generated: number
  twitter_posts: number
  month_year: string // Format: YYYY-MM
  created_at: string
  updated_at: string
}

// Auth helpers
export const signUp = async (email: string, password: string, metadata?: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  })
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

export const ensureUserProfile = async (userId: string, email?: string): Promise<UserProfile | null> => {
  // First try to get existing profile
  let profile = await getUserProfile(userId)
  
  if (profile) {
    return profile
  }

  // Profile doesn't exist, create it
  console.log(`Creating new profile for user ${userId}`)
  
  // Get current authenticated user for email
  const { data: { user } } = await supabase.auth.getUser()
  const userEmail = email || user?.email || ''
  
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: userEmail,
      subscription_status: 'free',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating user profile:', error)
    return null
  }

  return data
}

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  return await getUserProfile(user.id)
}

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

export const checkSubscriptionStatus = async (userId: string): Promise<'free' | 'active' | 'canceled' | 'past_due'> => {
  // Ensure profile exists first
  const profile = await ensureUserProfile(userId)
  
  if (!profile) {
    console.error('Could not ensure user profile exists')
    return 'free'
  }

  return profile.subscription_status || 'free'
}

export const canUserGenerateThread = async (userId: string): Promise<boolean> => {
  // Ensure profile exists first
  const profile = await ensureUserProfile(userId)
  
  if (!profile) {
    console.error('Could not ensure user profile exists')
    return false
  }

  const status = profile.subscription_status

  if (status === 'active') {
    return true // Premium users can generate unlimited threads
  }

  // Free users get limited usage - check monthly usage
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
  const { data: usage } = await supabase
    .from('subscription_usage')
    .select('threads_generated')
    .eq('user_id', userId)
    .eq('month_year', currentMonth)
    .single()

  const threadsGenerated = usage?.threads_generated || 0
  const FREE_TIER_LIMIT = 5 // Free users can generate 5 threads per month

  return threadsGenerated < FREE_TIER_LIMIT
}

export const incrementThreadUsage = async (userId: string) => {
  const currentMonth = new Date().toISOString().slice(0, 7)

  const { data: existingUsage } = await supabase
    .from('subscription_usage')
    .select('threads_generated')
    .eq('user_id', userId)
    .eq('month_year', currentMonth)
    .single()

  if (existingUsage) {
    // Update existing record
    await supabase
      .from('subscription_usage')
      .update({
        threads_generated: existingUsage.threads_generated + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('month_year', currentMonth)
  } else {
    // Create new record
    await supabase
      .from('subscription_usage')
      .insert({
        user_id: userId,
        threads_generated: 1,
        month_year: currentMonth
      })
  }
}

export const getMonthlyUsage = async (userId: string): Promise<SubscriptionUsage | null> => {
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format

  const { data, error } = await supabase
    .from('subscription_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('month_year', currentMonth)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('Error fetching usage:', error)
    return null
  }

  return data || {
    id: '',
    user_id: userId,
    threads_generated: 0,
    twitter_posts: 0,
    month_year: currentMonth,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

export const cancelSubscription = async (userId: string, subscriptionId: string) => {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'canceled',
      subscription_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  return { error }
}

export const getRemainingUsage = async (userId: string, tier: 'free' | 'premium'): Promise<number> => {
  if (tier === 'premium') {
    return Infinity
  }

  // For free users, get their monthly usage
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format

  const { data: usage } = await supabase
    .from('subscription_usage')
    .select('threads_generated')
    .eq('user_id', userId)
    .eq('month_year', currentMonth)
    .single()

  const used = usage?.threads_generated || 0
  return Math.max(0, 5 - used) // 5 threads per month for free users
}

export const createCheckoutSession = async (userId: string, priceId?: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('User must be authenticated')
    }

    // If no price ID provided, get the first available price
    let stripePriceId = priceId
    if (!stripePriceId) {
      const pricesResponse = await fetch('/api/stripe/get-prices')
      if (pricesResponse.ok) {
        const { prices } = await pricesResponse.json()
        if (prices && prices.length > 0) {
          stripePriceId = prices[0].id
          console.log('📋 Using first available price:', stripePriceId)
        }
      }
    }

    if (!stripePriceId) {
      throw new Error('No price ID available. Please configure Stripe prices.')
    }

    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: stripePriceId,
        userId,
        successUrl: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/subscription/success`,
        cancelUrl: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/subscription/canceled`
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Checkout session creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      throw new Error(`Failed to create checkout session: ${errorData.error || response.statusText}`)
    }

    const { sessionId, url } = await response.json()
    return { sessionId, url }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

export const createCustomerPortalSession = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('User must be authenticated')
    }

    // For local testing without webhooks, we'll simulate the portal
    console.log('🎯 Customer Portal: In production, this would redirect to Stripe Customer Portal')
    console.log('💡 For local testing, you can manage subscriptions directly in Stripe Dashboard')

    // For now, just return a placeholder URL that explains the situation
    throw new Error('Customer Portal requires webhook setup. For local testing, manage subscriptions directly in Stripe Dashboard at https://dashboard.stripe.com/test/customers')

  } catch (error) {
    console.error('Error creating portal session:', error)
    throw error
  }
}

export const updateSubscriptionStatus = async (userId: string, status: string, subscriptionId?: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('User must be authenticated')
    }

    const response = await fetch('/api/stripe/update-subscription-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        status,
        subscriptionId
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to update subscription: ${errorData.error || response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error updating subscription status:', error)
    throw error
  }
}

export const getAvailablePrices = async () => {
  try {
    const response = await fetch('/api/stripe/get-prices')
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to fetch prices: ${errorData.error || response.statusText}`)
    }

    const result = await response.json()
    return result.prices || []
  } catch (error) {
    console.error('Error fetching prices:', error)
    throw error
  }
}

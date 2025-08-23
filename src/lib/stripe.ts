import { loadStripe, Stripe } from '@stripe/stripe-js'
import { supabase } from './supabase'

// Initialize Stripe
let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// Stripe configuration
export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_monthly_subscription'

// Subscription management
export const createCheckoutSession = async (userId: string, priceId: string = STRIPE_PRICE_ID) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('User must be authenticated')
    }

    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        priceId,
        userId,
        successUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: `${window.location.origin}/subscription/canceled`
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create checkout session')
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
    // In production, this would call your API endpoint
    console.log('🎯 Customer Portal: In production, this would redirect to Stripe Customer Portal')
    console.log('💡 For local testing, you can manage subscriptions directly in Stripe Dashboard')

    // For now, just return a placeholder URL that explains the situation
    throw new Error('Customer Portal requires webhook setup. For local testing, manage subscriptions directly in Stripe Dashboard at https://dashboard.stripe.com/test/customers')

    // Production code (uncomment when webhooks are set up):
    /*
    const response = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to create portal session')
    }

    const { url } = await response.json()
    return url
    */
  } catch (error) {
    console.error('Error creating portal session:', error)
    throw error
  }
}

export const getSubscriptionStatus = async (userId: string) => {
  try {
    const response = await fetch(`/api/stripe/subscription-status?userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to get subscription status')
    }
    return await response.json()
  } catch (error) {
    console.error('Error getting subscription status:', error)
    throw error
  }
}

export const cancelSubscription = async (subscriptionId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('User must be authenticated')
    }

    const response = await fetch('/api/stripe/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ subscriptionId })
    })

    if (!response.ok) {
      throw new Error('Failed to cancel subscription')
    }

    return await response.json()
  } catch (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }
}

// Utility functions
export const formatPrice = (amount: number, currency: string = 'usd'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

export const getSubscriptionTier = (status: string): 'free' | 'premium' => {
  return status === 'active' ? 'premium' : 'free'
}

export const getUsageLimit = (tier: 'free' | 'premium'): number => {
  return tier === 'premium' ? Infinity : 5 // 5 threads per month for free users
}

export const getRemainingUsage = async (userId: string, tier: 'free' | 'premium'): Promise<number> => {
  if (tier === 'premium') {
    return Infinity
  }

  // For free users, get their monthly usage
  const { data: usage } = await supabase
    .from('subscription_usage')
    .select('threads_generated')
    .eq('user_id', userId)
    .eq('month_year', new Date().toISOString().slice(0, 7))
    .single()

  const used = usage?.threads_generated || 0
  return Math.max(0, getUsageLimit(tier) - used)
}

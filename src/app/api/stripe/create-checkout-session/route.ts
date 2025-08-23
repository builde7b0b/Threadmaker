import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'
import { rateLimit, RATE_LIMITS, withSecurity } from '@/lib/security'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

async function POSTHandler(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimit('stripe-checkout', RATE_LIMITS.API)(request)
  if (rateLimitResponse) return rateLimitResponse
  
  try {
    console.log('🔄 Creating checkout session...')
    
    // Validate environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY is not configured')
      return NextResponse.json(
        { error: 'Stripe configuration is missing' },
        { status: 500 }
      )
    }

    const { priceId, userId, successUrl, cancelUrl } = await request.json()
    
    console.log('📋 Checkout session request:', {
      priceId,
      userId,
      successUrl,
      cancelUrl
    })

    // Validate price ID
    if (!priceId) {
      console.error('❌ Price ID is required')
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // Try to validate the price exists in Stripe
    try {
      await stripe.prices.retrieve(priceId)
      console.log('✅ Price ID validated:', priceId)
    } catch (priceError) {
      console.error('❌ Invalid price ID:', priceId, priceError)
      
      // Try to find available prices for the user
      try {
        const { data: prices } = await stripe.prices.list({
          active: true,
          limit: 10
        })
        
        console.log('📋 Available prices:', prices.map(p => ({ id: p.id, nickname: p.nickname, unit_amount: p.unit_amount })))
        
        return NextResponse.json(
          { 
            error: 'Invalid price ID. Please check your Stripe configuration.',
            availablePrices: prices.map(p => ({ id: p.id, nickname: p.nickname, unit_amount: p.unit_amount }))
          },
          { status: 400 }
        )
      } catch (listError) {
        return NextResponse.json(
          { error: 'Invalid price ID and could not retrieve available prices' },
          { status: 400 }
        )
      }
    }

    // Trust the userId parameter from the client
    // Authentication is handled on the client side
    console.log('✅ Processing request for user:', userId)

    // Check if user already has an active subscription
    let { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, stripe_customer_id')
      .eq('id', userId)
      .single()

    // If profile doesn't exist, create it
    if (!profile) {
      console.log(`Creating new profile for user ${userId}`)
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: '', // Will be updated when user logs in
          subscription_status: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('subscription_status, stripe_customer_id')
        .single()

      if (createError) {
        console.error('Error creating profile:', createError)
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        )
      }

      profile = newProfile
    }

    if (profile?.subscription_status === 'active') {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      )
    }

    // Create or retrieve Stripe customer
    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      console.log('👤 Creating new Stripe customer for user:', userId)
      const customer = await stripe.customers.create({
        email: '', // Will be updated when user logs in
        metadata: {
          supabase_user_id: userId
        }
      })
      customerId = customer.id
      console.log('✅ Stripe customer created:', customerId)

      // Update profile with customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    } else {
      console.log('👤 Using existing Stripe customer:', customerId)
    }

    // Create checkout session
    console.log('💳 Creating Stripe checkout session with price:', priceId)
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        supabase_user_id: userId
      }
    })

    console.log('✅ Checkout session created:', session.id)
    
    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

// Apply security middleware
export const POST = withSecurity(POSTHandler)

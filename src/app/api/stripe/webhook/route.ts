import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const sig = headersList.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('Received Stripe webhook:', event.type)

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id
  if (!userId) return

  console.log('Processing checkout completion for user:', userId)

  // Check if profile exists, create if it doesn't
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!profile) {
    console.log(`Creating new profile for user ${userId}`)
    
    // For webhooks, we'll create a basic profile without email
    // The email can be updated later when the user logs in
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: '', // Will be updated when user logs in
        subscription_status: 'active',
        subscription_id: session.subscription as string,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating profile:', createError)
      return
    }

    profile = newProfile
  } else {
    // Update existing profile
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_id: session.subscription as string,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating profile after checkout:', error)
    } else {
      console.log('✅ Profile updated successfully')
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  // Find user by customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) return

  const status = subscription.status === 'active' ? 'active' :
                subscription.status === 'canceled' ? 'canceled' :
                subscription.status === 'past_due' ? 'past_due' : 'free'

  console.log(`Updating subscription status to ${status} for user:`, profile.id)

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.id)

  if (error) {
    console.error('Error updating subscription status:', error)
  } else {
    console.log('✅ Subscription status updated successfully')
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  // Find user by customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) return

  console.log('Processing subscription deletion for user:', profile.id)

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'canceled',
      subscription_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.id)

  if (error) {
    console.error('Error updating profile after subscription deletion:', error)
  } else {
    console.log('✅ Profile updated after subscription deletion')
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  // Find user by customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) return

  console.log('Processing successful payment for user:', profile.id)

  // Update subscription status to active
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.id)

  if (error) {
    console.error('Error updating profile after payment success:', error)
  } else {
    console.log('✅ Profile updated after successful payment')
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  // Find user by customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) return

  console.log('Processing failed payment for user:', profile.id)

  // Update subscription status to past due
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.id)

  if (error) {
    console.error('Error updating profile after payment failure:', error)
  } else {
    console.log('✅ Profile updated after payment failure')
  }
}

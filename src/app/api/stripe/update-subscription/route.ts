import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Manual subscription status update for local testing
// This allows you to test subscription features without webhooks

export async function POST(request: NextRequest) {
  try {
    const { userId, status, subscriptionId } = await request.json()

    if (!userId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and status' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['free', 'active', 'canceled', 'past_due']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    console.log(`🔄 Manually updating subscription for user ${userId} to ${status}`)

    // First, check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    let data, error

    if (!existingProfile) {
      // Profile doesn't exist, create it
      console.log(`Creating new profile for user ${userId}`)
      
      // Create new profile with basic info
      // Email will be updated when user logs in
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: '', // Will be updated when user logs in
          subscription_status: status,
          subscription_id: subscriptionId || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      data = newProfile
      error = createError
    } else {
      // Profile exists, update it
      console.log(`Updating existing profile for user ${userId}`)
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_status: status,
          subscription_id: subscriptionId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      data = updatedProfile
      error = updateError
    }

    if (error) {
      console.error('Error updating subscription:', error)
      return NextResponse.json(
        { error: 'Failed to update subscription status' },
        { status: 500 }
      )
    }

    console.log('✅ Subscription status updated successfully')
    return NextResponse.json({
      success: true,
      profile: data,
      message: `Subscription status updated to ${status}`
    })

  } catch (error) {
    console.error('Manual subscription update error:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

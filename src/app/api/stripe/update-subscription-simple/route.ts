import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Simple subscription status update for existing profiles only
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

    console.log(`🔄 Updating subscription for user ${userId} to ${status}`)

    // Update profile for the specified user ID
    // No authentication check needed since this is called from client side

    // Update existing profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        subscription_status: status,
        subscription_id: subscriptionId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating subscription:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json(
        { error: `Failed to update subscription status: ${error.message}` },
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
    console.error('Subscription update error:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

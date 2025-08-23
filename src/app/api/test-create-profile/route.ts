import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    console.log('🔄 Testing profile creation for user:', userId)
    
    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing profile:', checkError)
      return NextResponse.json({
        success: false,
        error: 'Error checking existing profile',
        details: checkError
      }, { status: 500 })
    }
    
    if (existingProfile) {
      console.log('✅ Profile already exists:', existingProfile)
      return NextResponse.json({
        success: true,
        message: 'Profile already exists',
        profile: existingProfile
      })
    }
    
    console.log('📝 Creating new profile...')
    
    // Create new profile
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: 'test@example.com',
        subscription_status: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Error creating profile:', createError)
      console.error('Error details:', {
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint
      })
      return NextResponse.json({
        success: false,
        error: 'Failed to create profile',
        details: createError
      }, { status: 500 })
    }
    
    console.log('✅ Profile created successfully:', newProfile)
    
    return NextResponse.json({
      success: true,
      message: 'Profile created successfully',
      profile: newProfile
    })
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

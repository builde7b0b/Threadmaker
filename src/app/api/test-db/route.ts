import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Testing database connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }
    
    console.log('✅ Database connection successful')
    
    // Check if profiles table exists and has data
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)
    
    if (profilesError) {
      console.error('❌ Error querying profiles table:', profilesError)
      return NextResponse.json({
        success: false,
        error: profilesError.message,
        details: profilesError
      }, { status: 500 })
    }
    
    console.log('✅ Profiles table accessible')
    console.log('📊 Number of profiles:', profiles.length)
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      profilesCount: profiles.length,
      sampleProfile: profiles.length > 0 ? profiles[0] : null
    })
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

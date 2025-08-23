// Test script to check database connection
// Run this with: node test-db-connection.js

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDatabaseConnection() {
  try {
    console.log('🔄 Testing database connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection error:', error)
      return
    }
    
    console.log('✅ Database connection successful')
    
    // Check if profiles table exists and has data
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)
    
    if (profilesError) {
      console.error('❌ Error querying profiles table:', profilesError)
      return
    }
    
    console.log('✅ Profiles table accessible')
    console.log('📊 Number of profiles:', profiles.length)
    
    if (profiles.length > 0) {
      console.log('📋 Sample profile:', profiles[0])
    }
    
    // Check if subscription_usage table exists
    const { data: usage, error: usageError } = await supabase
      .from('subscription_usage')
      .select('*')
      .limit(5)
    
    if (usageError) {
      console.error('❌ Error querying subscription_usage table:', usageError)
      return
    }
    
    console.log('✅ Subscription_usage table accessible')
    console.log('📊 Number of usage records:', usage.length)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testDatabaseConnection()

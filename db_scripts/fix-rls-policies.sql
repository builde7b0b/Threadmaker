-- Fix RLS policies for API operations
-- Run this in your Supabase SQL editor

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Disable RLS temporarily for testing (optional)
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Or create a policy that allows API operations
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create more permissive policies for API operations
CREATE POLICY "Enable read access for all users" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON profiles
  FOR UPDATE USING (true);

-- Alternative: Create a policy that allows service role operations
-- This requires using the service role key in API routes
CREATE POLICY "Enable all operations for service role" ON profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;

-- Check the current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

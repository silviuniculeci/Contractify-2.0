import { createClient } from '@supabase/supabase-js'

console.log('Initializing Supabase client')

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Log (without exposing full keys) to verify values are available
console.log('Supabase URL available:', !!supabaseUrl)
console.log('Supabase Anon Key available:', !!supabaseAnonKey)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in environment variables')
}

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test the connection
supabase.auth.getSession()
  .then(() => console.log('Supabase client initialized successfully'))
  .catch(error => console.error('Error initializing Supabase client:', error)) 
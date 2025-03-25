import { createClient } from '@supabase/supabase-js'

// Use hardcoded values for now to ensure it works in testing
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Debug supabase configuration
console.log('Supabase URL:', supabaseUrl.substring(0, 10) + '...');
console.log('Supabase Key exists:', !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    // We'll just try to fetch something simple
    const { data, error } = await supabase.from('projects').select('count');
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log('Supabase connection successful!', data);
    return true;
  } catch (err) {
    console.error('Supabase connection test exception:', err);
    return false;
  }
}; 
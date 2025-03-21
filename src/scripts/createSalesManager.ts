import { supabase } from '../lib/supabase'

const createSalesManager = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string
) => {
  try {
    // 1. Create the user in Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    })

    if (authError) throw authError

    if (!authData.user) throw new Error('No user returned from sign up')

    // 2. Add the user details to our users table
    const { error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          role: 'sales_manager'
        }
      ])

    if (userError) throw userError

    console.log('Sales manager created successfully!')
    return authData.user
  } catch (error) {
    console.error('Error creating sales manager:', error)
    throw error
  }
}

// Example usage:
// createSalesManager(
//   'manager@example.com',
//   'securepassword123',
//   'John',
//   'Doe'
// ) 
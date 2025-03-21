import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, AuthError, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  signIn: (email: string, password: string) => Promise<{ 
    user: User | null, 
    error: AuthError | null 
  }>
  signOut: () => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  console.log('AuthProvider initializing')
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('AuthProvider useEffect running')
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session retrieved:', session ? 'Found session' : 'No session')
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch(error => {
      console.error('Error retrieving session:', error)
      setLoading(false)
    })

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('Auth state changed:', _event)
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    // Cleanup subscription
    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log('SignIn function called')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('Sign in result:', error ? 'Error' : 'Success', data.user ? 'User found' : 'No user')
      
      return { 
        user: data?.user ?? null, 
        error 
      }
    } catch (error) {
      console.error('Unexpected error in signIn:', error)
      return { 
        user: null, 
        error: error as AuthError 
      }
    }
  }

  const signOut = async () => {
    console.log('SignOut function called')
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      console.error('Unexpected error in signOut:', error)
      return { error: error as AuthError }
    }
  }

  const value = {
    user,
    session,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider
      value={value}
    >
      {!loading ? children : <div>Loading authentication...</div>}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    console.error('useAuth must be used within an AuthProvider')
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 
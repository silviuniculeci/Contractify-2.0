import { createContext, useContext, useState, ReactNode } from 'react'

// Simplified user type
interface User {
  id: string
  email: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{
    user: User | null,
    error: Error | null
  }>
  signOut: () => Promise<{ error: Error | null }>
}

// Create context with default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signIn: async () => ({ user: null, error: null }),
  signOut: async () => ({ error: null })
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  console.log('AuthProvider rendered');
  const [user, setUser] = useState<User | null>({
    id: 'debug-user-id',
    email: 'debug@example.com'
  });
  const [loading, setLoading] = useState(false);

  // Simplified mock auth functions
  const signIn = async (email: string, password: string) => {
    console.log('Mock sign in with:', email, password);
    setLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockUser = {
      id: 'debug-user-id',
      email: email
    };
    
    setUser(mockUser);
    setLoading(false);
    return { user: mockUser, error: null };
  };

  const signOut = async () => {
    setLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setUser(null);
    setLoading(false);
    return { error: null };
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
}; 
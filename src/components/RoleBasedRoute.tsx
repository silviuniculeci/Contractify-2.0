import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

interface RoleResponse {
  roles: {
    code: string;
  }
}

export default function RoleBasedRoute({ children, allowedRoles = [] }: RoleBasedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('roles (code)')
          .eq('user_id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching user role:', error);
          return;
        }
        
        // Access the role code safely
        const roleData = data as unknown as RoleResponse;
        const roleCode = roleData?.roles?.code || null;
        console.log("User Role from Supabase:", roleCode, data);
        setUserRole(roleCode);
      } catch (err) {
        console.error('Error fetching role:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchUserRole();
    } else {
      setLoading(false);
    }
  }, [user]);

  // If auth is still loading or role is loading, show loading state
  if (authLoading || (user && loading)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user role is allowed
  if (allowedRoles.length > 0 && (!userRole || !allowedRoles.includes(userRole))) {
    // For operational managers, redirect to projects
    if (userRole === 'OPERATIONAL_MANAGER') {
      return <Navigate to="/projects" replace />;
    }
    // For other roles, redirect to offers
    return <Navigate to="/offers" replace />;
  }

  // If allowed or no specific roles required, render children
  return <>{children}</>;
} 
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, FileText, LogOut, ClipboardList } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select(`
            role:roles!inner (
              code
            )
          `)
          .eq('user_id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching user role:', error);
          return;
        }
        
        const roleCode = data?.role?.[0]?.code || null;
        setUserRole(roleCode);
      } catch (err) {
        console.error('Error fetching role:', err);
      }
    };
    
    if (user) {
      fetchUserRole();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to={userRole === 'OPERATIONAL_MANAGER' ? '/projects' : '/offers'} className="text-xl font-bold text-blue-600">
                Contractify
              </Link>
            </div>
            <nav className="ml-6 flex space-x-8">
              {userRole === 'OPERATIONAL_MANAGER' ? (
                <Link
                  to="/projects"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === '/projects'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Projects
                </Link>
              ) : (
                <Link
                  to="/offers"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    location.pathname === '/offers'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Offers
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center">
            <Link
              to="/profile"
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md ${
                location.pathname === '/profile'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  User, 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  Plus,
  Briefcase,
  Home,
  UserCircle,
  Clipboard
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UserRoleResponse {
  role_id: string;
  role: {
    code: string;
  };
}

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data: userRoleData, error } = await supabase
          .from('user_roles')
          .select(`
            role_id,
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

        const roleData = (userRoleData as unknown) as UserRoleResponse;
        setUserRole(roleData?.role?.code);
      } catch (err) {
        console.error('Error fetching user role:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) return null;

  // Navigation items based on role
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: location.pathname === '/dashboard',
      visible: true
    },
    {
      name: 'Offers',
      href: '/offers',
      icon: FileText,
      current: location.pathname.startsWith('/offers'),
      visible: userRole !== 'OPERATIONAL_MANAGER'
    },
    {
      name: 'Projects',
      href: '/projects',
      icon: Clipboard,
      current: location.pathname.startsWith('/projects'),
      visible: userRole === 'OPERATIONAL_MANAGER'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: UserCircle,
      current: location.pathname === '/profile',
      visible: true
    }
  ];
  
  // Filter visible items
  const visibleItems = navigationItems.filter(item => item.visible);

  return (
    <div 
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <Link 
          to={userRole === 'OPERATIONAL_MANAGER' ? '/projects' : '/offers'} 
          className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}
        >
          <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
          {!isCollapsed && (
            <span className="ml-2 text-xl font-bold text-gray-900">
              Contractify
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 pt-4">
        <div className="space-y-1">
          {/* Offers section - only for non-operational managers */}
          {userRole !== 'OPERATIONAL_MANAGER' && (
            <>
              {/* Offers List */}
              <Link
                to="/offers"
                className={`flex items-center px-3 py-2 mx-2 text-sm font-medium rounded-md ${
                  location.pathname === '/offers'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FileText className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="ml-3">Offers</span>}
              </Link>

              {/* New Offer */}
              <Link
                to="/offers/new"
                className={`flex items-center px-3 py-2 mx-2 text-sm font-medium rounded-md ${
                  location.pathname === '/offers/new'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Plus className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="ml-3">New Offer</span>}
              </Link>
            </>
          )}

          {/* Projects section for operational managers */}
          {userRole === 'OPERATIONAL_MANAGER' && (
            <>
              <Link
                to="/projects"
                className={`flex items-center px-3 py-2 mx-2 text-sm font-medium rounded-md ${
                  location.pathname === '/projects' || location.pathname === '/'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Briefcase className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="ml-3">Project Requests</span>}
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-200 p-4">
        {/* Profile Link */}
        <Link
          to="/profile"
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md mb-2 ${
            location.pathname === '/profile'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <User className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="ml-3">Profile</span>}
        </Link>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 w-full"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="ml-3">Sign out</span>}
        </button>
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-2 -right-3 bg-white border border-gray-200 rounded-full p-1 text-gray-500 hover:text-gray-900"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </div>
  );
} 
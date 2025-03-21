import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  User, 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div 
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <Link 
            to="/offers" 
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

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-6">
          {/* This is where the page content will be rendered */}
        </div>
      </div>
    </div>
  );
} 
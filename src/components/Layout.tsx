import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // If the component renders with an error, we'll see it in the console
    console.log("Layout rendered with children:", children ? "yes" : "no");
  }, [children]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6">
        <h1 className="text-red-600 text-xl font-semibold mb-4">Something went wrong</h1>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button 
          onClick={() => navigate('/')} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Home Page
        </button>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="p-6">
          {children || (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-gray-500 mb-4">No content to display</p>
              <button 
                onClick={() => navigate('/')} 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Home Page
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    email: user?.email || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('users')
          .select('first_name, last_name, email')
          .eq('id', user.id);
          
        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }
        
        if (data && data.length > 0) {
          setFormData({
            first_name: data[0].first_name || '',
            last_name: data[0].last_name || '',
            email: data[0].email || user.email || ''
          });
        } else {
          // Create profile if it doesn't exist
          await createUserProfile();
        }
      } catch (err) {
        console.error('Error in fetchUserProfile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const createUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .insert([
          { 
            id: user.id, 
            email: user.email,
            first_name: '',
            last_name: ''
          }
        ]);
        
      if (error) {
        console.error('Error creating profile:', error);
      }
    } catch (err) {
      console.error('Error in createUserProfile:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      setMessage({ text: 'You must be logged in to update your profile', type: 'error' });
      return;
    }
    
    try {
      setLoading(true);
      setMessage(null);
      
      const { error } = await supabase
        .from('users')
        .upsert([
          {
            id: user.id,
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email || user.email
          }
        ], { onConflict: 'id' });
        
      if (error) {
        console.error('Error updating profile:', error);
        setMessage({ text: `Error updating profile: ${error.message}`, type: 'error' });
        return;
      }
      
      setMessage({ text: 'Profile updated successfully', type: 'success' });
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setMessage({ text: 'An unexpected error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow">
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b">
          <User className="h-5 w-5 text-blue-600" />
          <h1 className="text-xl font-semibold">Profile Settings</h1>
        </div>

        {message && (
          <div className={`p-4 ${message.type === 'success' ? 'bg-green-50 text-green-700 border-l-4 border-green-400' : 'bg-red-50 text-red-700 border-l-4 border-red-400'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <div className="space-y-4">
            {/* Email (read-only) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                disabled
                value={formData.email}
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <p className="mt-1 text-sm text-gray-500">Your email cannot be changed</p>
            </div>

            {/* First Name */}
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 flex-1"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
} 
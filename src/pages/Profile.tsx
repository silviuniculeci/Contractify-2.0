import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ email: string; full_name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('email, user_metadata')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        }

        setProfile({
          email: data?.email || '',
          full_name: data?.user_metadata?.full_name || '',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!profile) {
    return <p>No profile data found.</p>;
  }

  return (
    <div>
      <h1>Profile</h1>
      <p>Email: {profile.email}</p>
      <p>Name: {profile.full_name}</p>
    </div>
  );
};

export default Profile;
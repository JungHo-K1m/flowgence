"use client";

import { useState, useEffect } from "react";
import { UserRole, UserProfile, PERMISSIONS } from "@/types/auth";
import { supabase } from "@/lib/supabase";
import { useAuthContext } from "@/components/providers/AuthProvider";

export function useRole() {
  const { user } = useAuthContext();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
        } else {
          setUserProfile(data);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const isAdmin = userProfile?.role === 'admin';
  const isUser = userProfile?.role === 'user';
  const isClient = userProfile?.role === 'client';

  const hasRole = (role: UserRole) => userProfile?.role === role;
  const hasAnyRole = (roles: UserRole[]) => 
    userProfile?.role ? roles.includes(userProfile.role) : false;

  const hasPermission = (permission: keyof typeof PERMISSIONS.admin) => {
    if (!userProfile?.role) return false;
    return PERMISSIONS[userProfile.role][permission];
  };

  return {
    userProfile,
    loading,
    isAdmin,
    isUser,
    isClient,
    hasRole,
    hasAnyRole,
    hasPermission,
    role: userProfile?.role || null,
  };
}

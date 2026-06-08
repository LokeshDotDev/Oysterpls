'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: string;
  phoneNumber: string;
  role: string;
  email?: string;
  merchantStatus?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  loginUser: (user: AuthUser) => void;
  logout: () => Promise<void>;
  switchRole: (role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            localStorage.setItem('auth_user', JSON.stringify(data.user));
          }
        } else {
          setUser(null);
          localStorage.removeItem('auth_user');
        }
      } catch (e) {
        console.error('Failed to fetch user session:', e);
      } finally {
        setLoading(false);
      }
    };

    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('auth_user');
      }
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = (newUser: AuthUser) => {
    setUser(newUser);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      localStorage.removeItem('auth_user');
      router.push('/');
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const switchRole = async (role: string) => {
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update user state role
        if (user) {
          const updated = { ...user, role };
          setUser(updated);
          localStorage.setItem('auth_user', JSON.stringify(updated));
        } else if (data.user) {
          // If logged out but switched role, sign in as that mock user
          loginUser({
            id: data.user.id,
            phoneNumber: data.user.phoneNumber,
            role: data.role,
            email: data.user.email || undefined,
          });
        }
        window.location.reload(); // Refresh to reload specific dashboard view & headers
      }
    } catch (e) {
      console.error('Failed to switch roles', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

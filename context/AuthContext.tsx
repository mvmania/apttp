
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { UserAccount, UserScenario, VerificationStatus } from '../types';

interface AuthContextType {
  user: UserAccount | null;
  login: (email: string, password: string, captchaToken?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<UserAccount>) => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);

  const toUserAccount = (u: any): UserAccount => {
    const role = (u.role as 'user' | 'co_admin' | 'admin' | 'master_admin' | undefined) || (u.is_admin ? 'admin' : 'user');
    const isAdmin = role === 'admin' || role === 'master_admin' || Boolean(u.isAdmin ?? u.is_admin);
    return {
      id: u.id,
      name: u.name || '',
      email: u.email || '',
      scenario: (u.scenario as UserScenario) || UserScenario.INDIVIDUAL,
      stakeholder_id: u.stakeholder_id || undefined,
      is_verified: Boolean(u.is_verified),
      is_email_verified: Boolean(u.is_email_verified),
      is_id_verified: Boolean(u.is_id_verified),
      verification_status: (u.verification_status as VerificationStatus) || VerificationStatus.NONE,
      joinedDate: Number(u.joinedDate ?? u.joined_date ?? Date.now()),
      isAdmin,
      isCoAdmin: role === 'co_admin',
      isMasterAdmin: role === 'master_admin',
      role,
      country: u.country ?? null
    };
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('apctt_user_account');
    if (!savedUser) return;
    try {
      const parsed = JSON.parse(savedUser);
      setUser(toUserAccount(parsed));
    } catch {
      localStorage.removeItem('apctt_user_account');
    }
  }, []);

  const persistUser = (nextUser: UserAccount | null) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem('apctt_user_account', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('apctt_user_account');
    }
  };

  const login = async (email: string, password: string, captchaToken?: string) => {
    try {
      const response = await apiService.loginUser(email, password, captchaToken);
      const mappedUser = toUserAccount(response.user);
      persistUser(mappedUser);
      if (response.accessToken) {
        localStorage.setItem('apctt_access_token', response.accessToken);
      }
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error?.message || 'Login failed' };
    }
  };

  const updateUser = (updates: Partial<UserAccount>) => {
    setUser((current) => {
      if (!current) return current;
      const nextUser = { ...current, ...updates };
      localStorage.setItem('apctt_user_account', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const logout = () => {
    persistUser(null);
    localStorage.removeItem('apctt_access_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

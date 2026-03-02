
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { UserAccount, UserScenario, VerificationStatus } from '../types';

interface AuthContextType {
  user: UserAccount | null;
  login: (email: string, password: string, captchaToken?: string) => Promise<boolean>;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('apctt_user_account');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const toUserAccount = (u: any): UserAccount => {
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
      isAdmin: Boolean(u.isAdmin ?? u.is_admin ?? u.role === 'admin')
    };
  };

  const login = async (email: string, password: string, captchaToken?: string) => {
    try {
      const response = await apiService.loginUser(email, password, captchaToken);
      const mappedUser = toUserAccount(response.user);
      setUser(mappedUser);
      localStorage.setItem('apctt_user_account', JSON.stringify(mappedUser));
      if (response.accessToken) {
        localStorage.setItem('apctt_access_token', response.accessToken);
      }
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('apctt_user_account');
    localStorage.removeItem('apctt_access_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
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

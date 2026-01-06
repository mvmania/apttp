
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { UserAccount } from '../types';

interface AuthContextType {
  user: UserAccount | null;
  login: (email: string) => Promise<boolean>;
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

  const login = async (email: string) => {
    try {
      const users = await apiService.getUsers();
      const foundUser = users.find((u: any) => u.email === email);
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('apctt_user_account', JSON.stringify(foundUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('apctt_user_account');
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

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  mobile: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (mobile: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  async function signIn(mobile: string, password: string) {
    try {
      const { data, error } = await supabase
        .from('custom_users')
        .select('id, mobile, password')
        .eq('mobile', mobile)
        .single();
  
      if (error || !data) throw new Error('User not found!');
  
      const { data: passwordMatch, error: rpcError } = await supabase.rpc(
        'check_password',
        { user_password: password, hash: data.password }
      );
  
      if (rpcError || !passwordMatch) throw new Error('Invalid password!');
  
      const userData = { id: data.id, mobile: data.mobile };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign in.');
    }
  }

  function signOut() {
    setUser(null);
    localStorage.removeItem('user');
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

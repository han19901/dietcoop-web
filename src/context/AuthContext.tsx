import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { authService, UserData } from '@/services/firebase/auth';

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<UserData | null>;
  signUpWithEmail: (
    email: string,
    password: string,
    adSoyad: string,
    onaylar: {
      gizlilikPolitikasiTR: boolean;
      privacyPolicyEN: boolean;
      kvkk: boolean;
      uyelikSozlesmesi: boolean;
    }
  ) => Promise<UserData | null>;
  signUpWithGoogle: (
    onaylar: {
      gizlilikPolitikasiTR: boolean;
      privacyPolicyEN: boolean;
      kvkk: boolean;
      uyelikSozlesmesi: boolean;
    }
  ) => Promise<UserData | null>;
  checkYasalOnaylar: (userId: string) => Promise<{ hasOnaylar: boolean; onaylar?: any }>;
  updateYasalOnaylar: (
    userId: string,
    onaylar: {
      gizlilikPolitikasiTR: boolean;
      privacyPolicyEN: boolean;
      kvkk: boolean;
      uyelikSozlesmesi: boolean;
    }
  ) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser: User | null) => {
      if (!isMounted) return;
      
      if (firebaseUser) {
        try {
          const userData = await authService.getCurrentUser();
          
          if (!isMounted) return;
          
          if (userData) {
            setUser(userData);
            
            // Rolüne göre yönlendir
            if (window.location.pathname === '/login' || window.location.pathname === '/admin/login') {
              if (userData.rol === 'superAdmin' || userData.rol === 'admin') {
                setTimeout(() => {
                  window.location.href = '/admin';
                }, 200);
              } else if (userData.rol === 'diyetisyen') {
                setTimeout(() => {
                  window.location.href = '/diyetisyen/dashboard';
                }, 200);
              }
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Kullanıcı kontrolü hatası:', error);
          if (isMounted) {
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const userData = await authService.signInWithGoogle();
      setUser(userData);
      
      // Rolüne göre yönlendir
      if (userData) {
        if (userData.rol === 'superAdmin' || userData.rol === 'admin') {
          setTimeout(() => {
            window.location.href = '/admin';
          }, 100);
        } else if (userData.rol === 'diyetisyen') {
          setTimeout(() => {
            window.location.href = '/diyetisyen/dashboard';
          }, 100);
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const userData = await authService.signInWithEmail(email, password);
      setUser(userData);
      
      // Rolüne göre yönlendir
      if (userData) {
        if (userData.rol === 'superAdmin' || userData.rol === 'admin') {
          setTimeout(() => {
            window.location.href = '/admin';
          }, 100);
        } else if (userData.rol === 'diyetisyen') {
          setTimeout(() => {
            window.location.href = '/diyetisyen/dashboard';
          }, 100);
        }
      }
      
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    adSoyad: string,
    onaylar: {
      gizlilikPolitikasiTR: boolean;
      privacyPolicyEN: boolean;
      kvkk: boolean;
      uyelikSozlesmesi: boolean;
    }
  ) => {
    try {
      const userData = await authService.signUpWithEmail(email, password, adSoyad, onaylar);
      setUser(userData);
      
      // Diyetisyenler için dashboard'a yönlendir
      if (userData) {
        setTimeout(() => {
          window.location.href = '/diyetisyen/dashboard';
        }, 100);
      }
      
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const signUpWithGoogle = async (
    onaylar: {
      gizlilikPolitikasiTR: boolean;
      privacyPolicyEN: boolean;
      kvkk: boolean;
      uyelikSozlesmesi: boolean;
    }
  ) => {
    try {
      const userData = await authService.signUpWithGoogle(onaylar);
      setUser(userData);
      
      // Diyetisyenler için dashboard'a yönlendir
      if (userData) {
        setTimeout(() => {
          window.location.href = '/diyetisyen/dashboard';
        }, 100);
      }
      
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const checkYasalOnaylar = async (userId: string) => {
    return await authService.checkYasalOnaylar(userId);
  };

  const updateYasalOnaylar = async (
    userId: string,
    onaylar: {
      gizlilikPolitikasiTR: boolean;
      privacyPolicyEN: boolean;
      kvkk: boolean;
      uyelikSozlesmesi: boolean;
    }
  ) => {
    await authService.updateYasalOnaylar(userId, onaylar);
  };

  const sendPasswordResetEmail = async (email: string) => {
    await authService.resetPassword(email);
  };

  const logout = async () => {
    try {
      await authService.signOutUser();
      setUser(null);
      setLoading(false);
    } catch (error) {
      console.error('Logout hatası:', error);
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signInWithGoogle, 
      signInWithEmail, 
      signUpWithEmail, 
      signUpWithGoogle,
      checkYasalOnaylar,
      updateYasalOnaylar,
      sendPasswordResetEmail,
      logout 
    }}>
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

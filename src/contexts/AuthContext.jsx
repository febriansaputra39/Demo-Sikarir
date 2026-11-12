import { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from localStorage on initial render
  useEffect(() => {
    try {
      const activeUser = authService.getCurrentUser();
      if (activeUser) {
        setUser(activeUser);
      } else {
        // Default to demo jobseeker for instant out-of-the-box presentation
        const defaultUser = {
          id: 'usr_pk_1',
          name: 'Rizky Pratama, S.Kom',
          email: 'rizky.pratama@gmail.com',
          role: 'PencariKerja',
          avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
          phone: '082198765432',
          headline: 'Frontend Developer & UI/UX Specialist',
          statusKarir: 'Bekerja',
          location: 'Jakarta Selatan, DKI Jakarta'
        };
        setUser(defaultUser);
        localStorage.setItem('sikarir_current_user', JSON.stringify(defaultUser));
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email, password, role) => {
    setIsLoading(true);
    try {
      const session = await authService.login(email, password, role);
      setUser(session);
      return session;
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemo = async (role) => {
    setIsLoading(true);
    try {
      const session = await authService.loginDemo(role);
      setUser(session);
      return session;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData) => {
    setIsLoading(true);
    try {
      const session = await authService.register(formData);
      setUser(session);
      return session;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateProfile = async (updates) => {
    const updated = await authService.updateProfile(updates);
    setUser(updated);
    return updated;
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginDemo,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;

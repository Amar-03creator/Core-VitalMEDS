import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import axios from 'axios';

// ✨ GUARANTEED URL (Matches your api.js)
const API_BASE_URL = 'http://192.168.1.6:5000';

const poolData = {
  UserPoolId: 'ap-south-1_t7cmqYdPT',
  ClientId: '2gomoic0dpgtimj3dg8tfjqceu',
};

const userPool = new CognitoUserPool(poolData);
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [cognitoUser, setCognitoUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const restoreSession = () => {
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) {
      setLoading(false);
      return;
    }

    currentUser.getSession((err, session) => {
      if (err || !session.isValid()) {
        setLoading(false);
        return;
      }
      const idToken = session.getIdToken().getJwtToken();
      setToken(idToken);
      setCognitoUser(currentUser);
      fetchUserProfile(idToken).finally(() => setLoading(false));
    });
  };

  useEffect(() => {
    restoreSession();
  }, []);

  const fetchUserProfile = async (idToken) => {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/auth/verify-token`,
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      setUser(data.profile);
      setRole(data.role);
      return data.role;
    } catch (err) {
      console.error('Profile fetch failed:', err);
      logout();
      throw err;
    }
  };

  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      const authDetails = new AuthenticationDetails({ Username: email, Password: password });
      const cogUser = new CognitoUser({ Username: email, Pool: userPool });

      cogUser.authenticateUser(authDetails, {
        onSuccess: async (session) => {
          const idToken = session.getIdToken().getJwtToken();
          setToken(idToken);
          setCognitoUser(cogUser);
          try {
            const userRole = await fetchUserProfile(idToken);
            resolve({ success: true, role: userRole });
          } catch (err) { reject(err); }
        },
        onFailure: (err) => reject(err),
        newPasswordRequired: () => {
          resolve({ success: false, challenge: 'NEW_PASSWORD_REQUIRED', cogUser });
        },
        totpRequired: () => resolve({ success: false, challenge: 'TOTP', cogUser }),
      });
    });
  };

  const completeNewPassword = (cogUser, newPassword) => {
    return new Promise((resolve, reject) => {
      cogUser.completeNewPasswordChallenge(newPassword, {}, {
        onSuccess: async (session) => {
          const idToken = session.getIdToken().getJwtToken();
          setToken(idToken);
          setCognitoUser(cogUser);
          try {
            const userRole = await fetchUserProfile(idToken);
            resolve({ success: true, role: userRole });
          } catch (err) { reject(err); }
        },
        onFailure: (err) => reject(err)
      });
    });
  };

  const logout = useCallback(() => {
    try {
      const currentUser = userPool.getCurrentUser();
      if (currentUser) {
        currentUser.signOut();
      }
    } catch (err) {
      console.error("AWS SignOut Error:", err);
    } finally {
      // 1. Wipe React State
      setUser(null);
      setCognitoUser(null);
      setToken(null);
      setRole(null);

      // 2. Wipe Browser Memory (Bulletproof)
      localStorage.clear();
      sessionStorage.clear();

      // 3. Hard Redirect to the login page (Clears all local cache)
      window.location.replace('/login');
    }
  }, []);

  const authAxios = axios.create({ baseURL: API_BASE_URL });
  authAxios.interceptors.request.use((config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  return (
    <AuthContext.Provider value={{
      user, role, token, loading,
      login, logout, completeNewPassword, authAxios,
      isAuthenticated: !!token && !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
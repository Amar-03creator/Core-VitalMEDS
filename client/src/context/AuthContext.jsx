import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.6:5000';

const poolData = {
  UserPoolId: 'ap-south-1_t7cmqYdPT',
  ClientId: '2gomoic0dpgtimj3dg8tfjqceu',
};

const userPool = new CognitoUserPool(poolData);
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null); // ✨ RESTORED: This was missing!
  const [loading, setLoading] = useState(true);

  const authAxios = axios.create({ baseURL: API_BASE_URL });

  authAxios.interceptors.request.use(
    (config) => {
      return new Promise((resolve, reject) => {
        const cognitoUser = userPool.getCurrentUser();

        if (!cognitoUser) {
          if (token) config.headers.Authorization = `Bearer ${token}`;
          return resolve(config);
        }

        cognitoUser.getSession((err, session) => {
          if (err || !session.isValid()) {
            return reject(err);
          }
          const currentToken = session.getIdToken().getJwtToken();
          config.headers.Authorization = `Bearer ${currentToken}`;
          resolve(config);
        });
      });
    },
    (error) => Promise.reject(error)
  );

  const fetchUserProfile = async (idToken) => {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/auth/verify-token`,
        {},
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      
      setUser(data.profile);
      setRole(data.role); // ✨ RESTORED: Update the role in state
      
      if (data.role === 'client' && data.profile && data.profile._id) {
        localStorage.setItem('clientId', data.profile._id);
      } else if (data.role === 'admin') {
        localStorage.removeItem('clientId');
      }

      return data.role;
    } catch (err) {
      console.error('Profile fetch failed:', err);
      logout();
      throw err;
    }
  };

  const restoreSession = useCallback(() => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      setLoading(false);
      return;
    }

    cognitoUser.getSession((err, session) => {
      if (err || !session.isValid()) {
        setLoading(false);
        return;
      }
      const idToken = session.getIdToken().getJwtToken();
      setToken(idToken);
      fetchUserProfile(idToken).finally(() => setLoading(false));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      const authDetails = new AuthenticationDetails({ Username: email, Password: password });
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: async (session) => {
          const idToken = session.getIdToken().getJwtToken();
          setToken(idToken);
          try {
            const userRole = await fetchUserProfile(idToken);
            resolve({ success: true, role: userRole });
          } catch (err) { reject(err); }
        },
        onFailure: (err) => reject(err),
        newPasswordRequired: () => {
          resolve({ success: false, challenge: 'NEW_PASSWORD_REQUIRED', cognitoUser });
        }
      });
    });
  };

  const completeNewPassword = (cognitoUser, newPassword) => {
    return new Promise((resolve, reject) => {
      cognitoUser.completeNewPasswordChallenge(newPassword, {}, {
        onSuccess: async (session) => {
          const idToken = session.getIdToken().getJwtToken();
          setToken(idToken);
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
      const cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.signOut();
      }
    } catch (err) {
      console.error("AWS SignOut Error:", err);
    } finally {
      setUser(null);
      setToken(null);
      setRole(null); // ✨ Clear the role on logout
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/login');
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, role, token, loading,
      login, logout, completeNewPassword, authAxios,
      isAuthenticated: !!token && !!user && !!role, // ✨ Strict check
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
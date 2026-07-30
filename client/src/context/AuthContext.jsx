// client/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
};

const userPool = new CognitoUserPool(poolData);
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
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
      setRole(data.role); 
      
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

  // ✨ NEW: Change Password Handler
  const changePassword = (oldPassword, newPassword) => {
    return new Promise((resolve, reject) => {
      const cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) return reject(new Error("No active session. Please log in again."));
      
      cognitoUser.getSession((err) => {
        if (err) return reject(err);
        cognitoUser.changePassword(oldPassword, newPassword, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    });
  };

  // ✨ NEW: Update Email/Phone in Cognito
  const updateCognitoContact = (email, phone) => {
    return new Promise((resolve, reject) => {
      const cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) return reject(new Error("No active session. Please log in again."));
      
      cognitoUser.getSession((err) => {
        if (err) return reject(err);
        
        const attributeList = [];
        if (email) attributeList.push(new CognitoUserAttribute({ Name: 'email', Value: email }));
        if (phone) {
          const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`;
          attributeList.push(new CognitoUserAttribute({ Name: 'phone_number', Value: formattedPhone }));
        }

        cognitoUser.updateAttributes(attributeList, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    });
  };

  // ✨ NEW: Verify the 6-digit OTP for email/phone changes
  const verifyContactOtp = (attributeName, code) => {
    return new Promise((resolve, reject) => {
      const cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) return reject(new Error("No active session. Please log in again."));
      
      cognitoUser.getSession((err) => {
        if (err) return reject(err);
        
        cognitoUser.verifyAttribute(attributeName, code, {
          onSuccess: (result) => resolve(result),
          onFailure: (err) => reject(err),
        });
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
      setRole(null); 
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/login');
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, role, token, loading,
      login, logout, completeNewPassword, authAxios,
      
      // ✨ EXPOSED THE NEW FUNCTIONS HERE
      changePassword, 
      updateCognitoContact, 
      verifyContactOtp,
      
      isAuthenticated: !!token && !!user && !!role, 
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
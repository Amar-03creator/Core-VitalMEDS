/**
 * ============================================================================
 * FILE: apiCore.js
 * PURPOSE: The central network engine.
 * DESCRIPTION: Handles AWS Cognito session management, token retrieval, and 
 * exports the `secureFetch` wrapper. Every other API module uses 
 * this file to ensure requests are automatically authenticated.
 * ============================================================================
 */

// client/src/services/api/apiCore.js
import { CognitoUserPool } from 'amazon-cognito-identity-js';

// Dynamically pull the API Gateway URL from your Vite environment variables
export const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

const poolData = {
  // Dynamically pull Cognito keys from your Vite environment variables
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
};
const userPool = new CognitoUserPool(poolData);

const getToken = () => new Promise((resolve) => {
  const user = userPool.getCurrentUser();
  if (!user) return resolve(null);
  user.getSession((err, session) => {
    if (err || !session.isValid()) return resolve(null);
    resolve(session.getIdToken().getJwtToken());
  });
});

export const secureFetch = async (endpoint, options = {}) => {
  const token = await getToken();
  const headers = { ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Automatically attaches BASE_URL here so your module files stay clean
  return fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
};
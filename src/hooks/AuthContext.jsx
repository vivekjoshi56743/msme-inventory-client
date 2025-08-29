import React, { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../services/firebase.js';
import apiClient from '../services/api.js';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // New function to fetch user details (including role) from our backend
  const fetchUserDetails = async () => {
    try {
      const { data } = await apiClient.get('/users/me');
      return data; // Returns { uid, email, role }
    } catch (error) {
      console.error("Could not fetch user details", error);
      return null;
    }
  };

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // After login, fetch details from our backend
    const userDetails = await fetchUserDetails();
    setCurrentUser(userDetails); 
    
    return userCredential;
  };

  const logout = () => {
    delete apiClient.defaults.headers.common['Authorization'];
    setCurrentUser(null); // Clear the user state
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, get token and fetch details from our backend
        const token = await user.getIdToken();
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const userDetails = await fetchUserDetails();
        setCurrentUser(userDetails);
      } else {
        // User is signed out
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = { currentUser, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
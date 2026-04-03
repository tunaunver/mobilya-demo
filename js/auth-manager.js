/**
 * js/auth-manager.js
 * Handles login, logout, registration and session management via local PHP API.
 */

const AuthManager = (() => {
  const API_URL = 'api/auth.php';

  // Sign Up
  const signUp = async (email, password, metadata = {}) => {
    try {
      const res = await fetch(`${API_URL}?action=register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...metadata })
      });
      const data = await res.json();
      return { data, error: data.error ? data : null };
    } catch (e) {
      return { data: null, error: e };
    }
  };

  // Sign In
  const signIn = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      return { data, error: data.error ? data : null };
    } catch (e) {
      return { data: null, error: e };
    }
  };

  // Google Sign In (Not supported locally without complex setup, placeholder)
  const signInWithGoogle = async () => {
    alert("Yerel kurulumda Google ile giriş desteklenmemektedir.");
    return { data: null, error: "Not supported" };
  };

  // Sign Out
  const signOut = async () => {
    try {
      await fetch(`${API_URL}?action=logout`, { method: 'POST' });
      return { error: null };
    } catch (e) {
      return { error: e };
    }
  };

  // Get Current User
  const getUser = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) return null;
      const user = await res.json();
      return user.id ? user : null;
    } catch (e) {
      return null;
    }
  };

  // Listen for changes (Simplified for local)
  const onAuthStateChange = (callback) => {
    // In a real local app, we might check session cookies
    // For this demo, we'll just poll once
    getUser().then(user => {
      callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', user);
    });
  };

  // Admin: Get All Profiles
  const getProfiles = async () => {
    try {
      const res = await fetch(`${API_URL}?all=1`);
      return await res.json();
    } catch (e) {
      return [];
    }
  };

  // Admin: Delete Profile
  const deleteProfile = async (id) => {
    try {
      const res = await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      return { data, error: data.error ? data : null };
    } catch (e) {
      return { data: null, error: e };
    }
  };

  return {
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    getUser,
    onAuthStateChange,
    getProfiles,
    deleteProfile
  };
})();

window.AuthManager = AuthManager;

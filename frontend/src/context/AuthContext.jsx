/* eslint-disable react-refresh/only-export-components -- context + hook module */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { apiFetch, getToken, setToken } from '../api/client';
import { getFirebaseAuth, isFirebaseAuthEnabled } from '../firebase/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('fightforge_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const persistUser = useCallback((next) => {
    setUser(next);
    if (next) localStorage.setItem('fightforge_user', JSON.stringify(next));
    else localStorage.removeItem('fightforge_user');
  }, []);

  const login = useCallback(
    async (email, password) => {
      if (isFirebaseAuthEnabled()) {
        const auth = getFirebaseAuth();
        if (!auth) throw new Error('Firebase Auth is not configured');
        try {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          const idToken = await cred.user.getIdToken();
          const data = await apiFetch('/api/auth/firebase-session', {
            method: 'POST',
            body: { idToken, fullName: null },
            token: null,
          });
          setToken(data.token);
          persistUser(data.user);
          return data.user;
        } catch (e) {
          if (e?.code === 'auth/user-not-found') {
            const data = await apiFetch('/api/auth/login', {
              method: 'POST',
              body: { email, password },
              token: null,
            });
            setToken(data.token);
            persistUser(data.user);
            return data.user;
          }
          throw e;
        }
      }
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { email, password },
        token: null,
      });
      setToken(data.token);
      persistUser(data.user);
      return data.user;
    },
    [persistUser]
  );

  const signup = useCallback(
    async ({ fullName, email, password }) => {
      if (isFirebaseAuthEnabled()) {
        const auth = getFirebaseAuth();
        if (!auth) throw new Error('Firebase Auth is not configured');
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const idToken = await cred.user.getIdToken();
        const data = await apiFetch('/api/auth/firebase-session', {
          method: 'POST',
          body: { idToken, fullName },
          token: null,
        });
        setToken(data.token);
        persistUser(data.user);
        return data.user;
      }
      const data = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: { fullName, email, password },
        token: null,
      });
      setToken(data.token);
      persistUser(data.user);
      return data.user;
    },
    [persistUser]
  );

  const logout = useCallback(async () => {
    if (isFirebaseAuthEnabled()) {
      const auth = getFirebaseAuth();
      if (auth) {
        try {
          await firebaseSignOut(auth);
        } catch {
          /* ignore */
        }
      }
    }
    setToken(null);
    persistUser(null);
  }, [persistUser]);

  const refreshProfile = useCallback(async () => {
    if (!user?.id || !getToken()) return null;
    const profile = await apiFetch(`/api/auth/profile/${user.id}`);
    persistUser(profile);
    return profile;
  }, [persistUser, user]);

  const value = useMemo(
    () => ({
      user,
      token: getToken(),
      isAuthenticated: Boolean(getToken() && user),
      login,
      signup,
      logout,
      refreshProfile,
      firebaseAuthEnabled: isFirebaseAuthEnabled(),
    }),
    [user, login, signup, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

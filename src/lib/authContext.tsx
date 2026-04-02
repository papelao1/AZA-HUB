import React, { createContext, useContext, useEffect, useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';
import {
  getUsers, saveUsers, loginUser, logoutUser, getSession,
  UserRecord, UserSession,
} from './authUsers';

type AuthContextType = {
  session: UserSession | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  users: UserRecord[];
  addUser: (user: Omit<UserRecord, 'id'>) => void;
  updateUser: (id: string, updates: Partial<Omit<UserRecord, 'id'>>) => void;
  deleteUser: (id: string) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(getSession);
  const [users, setUsersState] = useState<UserRecord[]>(getUsers);

  // If session exists but Firebase isn't authed (e.g. after page refresh with cleared Firebase),
  // sign in anonymously so Firestore operations work.
  useEffect(() => {
    if (!session) return;
    const unsub = auth.onAuthStateChanged(user => {
      if (!user) {
        signInAnonymously(auth).catch(e =>
          console.warn('Firebase anonymous auth failed (Firestore may not load):', e)
        );
      }
    });
    return () => unsub();
  }, [session?.id]);

  const refreshUsers = () => setUsersState(getUsers());

  const login = async (username: string, password: string): Promise<boolean> => {
    const s = loginUser(username, password);
    if (!s) return false;
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.warn('Firebase anonymous auth failed (Firestore may not load):', e);
    }
    setSession(s);
    return true;
  };

  const logout = () => {
    logoutUser();
    auth.signOut().catch(() => {});
    setSession(null);
  };

  const addUser = (user: Omit<UserRecord, 'id'>) => {
    const current = getUsers();
    saveUsers([...current, { ...user, id: `user_${Date.now()}` }]);
    refreshUsers();
  };

  const updateUser = (id: string, updates: Partial<Omit<UserRecord, 'id'>>) => {
    const current = getUsers();
    saveUsers(current.map(u => (u.id === id ? { ...u, ...updates } : u)));
    refreshUsers();
    if (session?.id === id) {
      const updated = getUsers().find(u => u.id === id);
      if (updated) {
        const newSession: UserSession = {
          id: updated.id,
          nome: updated.nome,
          username: updated.username,
          tag: updated.tag,
        };
        setSession(newSession);
        sessionStorage.setItem('azahub_session', JSON.stringify(newSession));
      }
    }
  };

  const deleteUser = (id: string) => {
    saveUsers(getUsers().filter(u => u.id !== id));
    refreshUsers();
  };

  return (
    <AuthContext.Provider value={{ session, login, logout, users, addUser, updateUser, deleteUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

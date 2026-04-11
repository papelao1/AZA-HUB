import React, { createContext, useContext, useEffect, useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import {
  collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, getDocs, where,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  UserRecord, UserSession, UserTag,
  DEFAULT_USERS, getSession, saveSession, clearSession,
} from './authUsers';

type AuthContextType = {
  session: UserSession | null;
  users: UserRecord[];
  usersLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (user: Omit<UserRecord, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<Omit<UserRecord, 'id'>>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(getSession);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);

  // Step 1: sign in anonymously as soon as the app loads (needed to access Firestore)
  useEffect(() => {
    const init = async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error('Firebase anonymous auth failed:', e);
      }
      setFirebaseReady(true);
    };
    init();
  }, []);

  // Step 2: subscribe to the 'usuarios' Firestore collection
  useEffect(() => {
    if (!firebaseReady) return;

    const unsub = onSnapshot(
      query(collection(db, 'usuarios')),
      (snapshot) => {
        if (snapshot.empty) {
          // Seed default users on first run
          Promise.all(DEFAULT_USERS.map(u => addDoc(collection(db, 'usuarios'), u)))
            .catch(console.error);
          return; // next snapshot will have the seeded users
        }
        setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserRecord)));
        setUsersLoading(false);
      },
      (err) => {
        console.error('Failed to load usuarios:', err);
        setUsersLoading(false);
      }
    );

    return () => unsub();
  }, [firebaseReady]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Ensure Firebase anonymous auth is active before querying
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      // Query Firestore directly — avoids stale state and race conditions
      const q = query(
        collection(db, 'usuarios'),
        where('username', '==', username.trim()),
        where('status', '==', 'Ativo'),
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return false;

      const userDoc = snapshot.docs.find(d => (d.data().password as string) === password.trim());
      if (!userDoc) return false;

      const userData = { id: userDoc.id, ...userDoc.data() } as UserRecord;
      const s: UserSession = { id: userData.id, nome: userData.nome, username: userData.username, tag: userData.tag };
      saveSession(s);
      setSession(s);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const logout = () => {
    clearSession();
    setSession(null);
    // Do NOT sign out from Firebase — the anonymous session is shared infrastructure
  };

  const addUser = async (user: Omit<UserRecord, 'id'>) => {
    await addDoc(collection(db, 'usuarios'), user);
  };

  const updateUser = async (id: string, updates: Partial<Omit<UserRecord, 'id'>>) => {
    await updateDoc(doc(db, 'usuarios', id), updates as Record<string, unknown>);
    // Update session if the logged-in user changed their own data
    if (session?.id === id) {
      const current = users.find(u => u.id === id);
      if (current) {
        const merged = { ...current, ...updates };
        const newSession: UserSession = {
          id: merged.id, nome: merged.nome, username: merged.username, tag: merged.tag as UserTag,
        };
        saveSession(newSession);
        setSession(newSession);
      }
    }
  };

  const deleteUser = async (id: string) => {
    await deleteDoc(doc(db, 'usuarios', id));
  };

  return (
    <AuthContext.Provider value={{
      session, users, usersLoading,
      login, logout, addUser, updateUser, deleteUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

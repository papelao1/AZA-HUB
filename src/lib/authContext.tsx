import React, { createContext, useContext, useEffect, useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import {
  collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, getDocs, setDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  UserRecord, UserSession, UserTag,
  getSession, saveSession, clearSession,
} from './authUsers';

type AuthContextType = {
  session: UserSession | null;
  users: UserRecord[];
  usersLoading: boolean;
  login: (username: string, password: string) => Promise<boolean | 'error'>;
  logout: () => void;
  addUser: (user: Omit<UserRecord, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<Omit<UserRecord, 'id'>>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Seed jean and gustavo with fixed IDs so it's idempotent (no duplicates)
async function seedDefaultUsers() {
  try {
    await setDoc(doc(db, 'usuarios', 'jean'), {
      nome: 'Jean', username: 'jean', password: 'jean2024', tag: 'ADMIN', status: 'Ativo',
    });
    await setDoc(doc(db, 'usuarios', 'gustavo'), {
      nome: 'Gustavo', username: 'gustavo', password: 'gustavo2024', tag: 'ADMIN', status: 'Ativo',
    });
    console.log('Default users seeded.');
  } catch (err) {
    console.error('Failed to seed default users:', err);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(getSession);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    let unsubFirestore: (() => void) | null = null;

    const init = async () => {
      // Step 1: Ensure Firebase anonymous auth
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error('Firebase anonymous auth failed:', e);
        // Still allow UI to show even if auth fails
        setUsersLoading(false);
        return;
      }

      // Step 2: Subscribe to usuarios collection for real-time updates
      unsubFirestore = onSnapshot(
        query(collection(db, 'usuarios')),
        async (snapshot) => {
          if (snapshot.empty) {
            // First run: seed default admins with fixed IDs
            await seedDefaultUsers();
            return; // next snapshot will include the seeded users
          }
          setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserRecord)));
          setUsersLoading(false);
        },
        (err) => {
          console.error('Failed to load usuarios:', err);
          // Unblock the UI even on error so user can attempt login
          setUsersLoading(false);
        },
      );
    };

    init();
    return () => { if (unsubFirestore) unsubFirestore(); };
  }, []);

  // Login: query Firestore directly (no compound where — avoids composite index requirements)
  const login = async (username: string, password: string): Promise<boolean | 'error'> => {
    try {
      // Ensure anonymous auth before any Firestore read
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      const snapshot = await getDocs(collection(db, 'usuarios'));

      // If collection is empty, seed defaults and retry once
      if (snapshot.empty) {
        await seedDefaultUsers();
        const retry = await getDocs(collection(db, 'usuarios'));
        const seeded = retry.docs.find(d => {
          const data = d.data();
          return data.username === username.trim() &&
                 data.password === password.trim() &&
                 data.status === 'Ativo';
        });
        if (!seeded) return false;
        const u = { id: seeded.id, ...seeded.data() } as UserRecord;
        const s: UserSession = { id: u.id, nome: u.nome, username: u.username, tag: u.tag };
        saveSession(s);
        setSession(s);
        return true;
      }

      // Filter in memory — simple, no index required
      const userDoc = snapshot.docs.find(d => {
        const data = d.data();
        return data.username === username.trim() &&
               data.password === password.trim() &&
               data.status === 'Ativo';
      });

      if (!userDoc) return false;

      const userData = { id: userDoc.id, ...userDoc.data() } as UserRecord;
      const s: UserSession = {
        id: userData.id, nome: userData.nome, username: userData.username, tag: userData.tag,
      };
      saveSession(s);
      setSession(s);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return 'error'; // distinct from "wrong credentials"
    }
  };

  const logout = () => {
    clearSession();
    setSession(null);
  };

  const addUser = async (user: Omit<UserRecord, 'id'>) => {
    await addDoc(collection(db, 'usuarios'), user);
  };

  const updateUser = async (id: string, updates: Partial<Omit<UserRecord, 'id'>>) => {
    await updateDoc(doc(db, 'usuarios', id), updates as Record<string, unknown>);
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

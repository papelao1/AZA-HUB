import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { handleFirestoreError, OperationType } from './firestore-errors';

export type Cliente = {
  id: string;
  userId: string;
  nome: string;
  servico: string;
  valorMensal: number;
  status: 'Ativo' | 'Inativo';
  dataEntrada: string;
};

export type Faturamento = {
  id: string;
  userId: string;
  data: string;
  descricao: string;
  clienteId: string;
  valor: number;
  status: 'Recebido' | 'Pendente';
};

export type Custo = {
  id: string;
  userId: string;
  data: string;
  categoria: 'Operacional' | 'Produto' | 'Marketing' | 'Pessoal' | 'Outro';
  descricao: string;
  valor: number;
};

export type Despesa = {
  id: string;
  userId: string;
  data: string;
  categoria: 'Aluguel' | 'Internet' | 'Software' | 'Contador' | 'Outros';
  descricao: string;
  valor: number;
};

type AppContextType = {
  clientes: Cliente[];
  faturamentos: Faturamento[];
  custos: Custo[];
  despesas: Despesa[];
  addCliente: (cliente: Omit<Cliente, 'id' | 'userId'>) => Promise<string | void>;
  removeCliente: (id: string) => Promise<void>;
  addFaturamento: (faturamento: Omit<Faturamento, 'id' | 'userId'>) => Promise<void>;
  removeFaturamento: (id: string) => Promise<void>;
  addCusto: (custo: Omit<Custo, 'id' | 'userId'>) => Promise<void>;
  removeCusto: (id: string) => Promise<void>;
  addDespesa: (despesa: Omit<Despesa, 'id' | 'userId'>) => Promise<void>;
  removeDespesa: (id: string) => Promise<void>;
  userId: string | null;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [faturamentos, setFaturamentos] = useState<Faturamento[]>([]);
  const [custos, setCustos] = useState<Custo[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setClientes([]);
      setFaturamentos([]);
      setCustos([]);
      setDespesas([]);
      return;
    }

    const qClientes = query(collection(db, 'clientes'), where('userId', '==', userId));
    const unsubClientes = onSnapshot(qClientes, (snapshot) => {
      setClientes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cliente)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'clientes'));

    const qFaturamentos = query(collection(db, 'faturamentos'), where('userId', '==', userId));
    const unsubFaturamentos = onSnapshot(qFaturamentos, (snapshot) => {
      setFaturamentos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Faturamento)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'faturamentos'));

    const qCustos = query(collection(db, 'custos'), where('userId', '==', userId));
    const unsubCustos = onSnapshot(qCustos, (snapshot) => {
      setCustos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Custo)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'custos'));

    const qDespesas = query(collection(db, 'despesas'), where('userId', '==', userId));
    const unsubDespesas = onSnapshot(qDespesas, (snapshot) => {
      setDespesas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Despesa)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'despesas'));

    return () => {
      unsubClientes();
      unsubFaturamentos();
      unsubCustos();
      unsubDespesas();
    };
  }, [userId]);

  const addCliente = async (cliente: Omit<Cliente, 'id' | 'userId'>) => {
    if (!userId) return;
    try {
      const docRef = await addDoc(collection(db, 'clientes'), { ...cliente, userId });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'clientes');
    }
  };

  const removeCliente = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'clientes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `clientes/${id}`);
    }
  };

  const addFaturamento = async (faturamento: Omit<Faturamento, 'id' | 'userId'>) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, 'faturamentos'), { ...faturamento, userId });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'faturamentos');
    }
  };

  const removeFaturamento = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'faturamentos', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `faturamentos/${id}`);
    }
  };

  const addCusto = async (custo: Omit<Custo, 'id' | 'userId'>) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, 'custos'), { ...custo, userId });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'custos');
    }
  };

  const removeCusto = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'custos', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `custos/${id}`);
    }
  };

  const addDespesa = async (despesa: Omit<Despesa, 'id' | 'userId'>) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, 'despesas'), { ...despesa, userId });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'despesas');
    }
  };

  const removeDespesa = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'despesas', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `despesas/${id}`);
    }
  };

  return (
    <AppContext.Provider value={{
      clientes, faturamentos, custos, despesas,
      addCliente, removeCliente,
      addFaturamento, removeFaturamento,
      addCusto, removeCusto,
      addDespesa, removeDespesa,
      userId
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { handleFirestoreError, OperationType } from './firestore-errors';

export type Cliente = {
  id: string;
  nome: string;
  servico: string;
  valorMensal: number;
  status: 'Ativo' | 'Inativo';
  dataEntrada: string;
};

export type Faturamento = {
  id: string;
  tipo?: 'Setup' | 'Plano Performance';
  mesReferencia?: string; // YYYY-MM, only for Plano Performance
  data: string;
  descricao: string;
  clienteId: string;
  valor: number;
  status: 'Recebido' | 'Pendente';
};

export type Custo = {
  id: string;
  data: string;
  categoria: 'Operacional' | 'Produto' | 'Marketing' | 'Pessoal' | 'Outro';
  descricao: string;
  valor: number;
};

export type Despesa = {
  id: string;
  data: string;
  categoria: 'Aluguel' | 'Internet' | 'Software' | 'Contador' | 'Outros';
  descricao: string;
  valor: number;
};

export type Tarefa = {
  id: string;
  titulo: string;
  descricao: string;
  concluida?: boolean; // Legacy field
  criadaEm: string;
  // Kanban fields
  responsavelId?: string;
  prioridade?: 'Alta' | 'Média' | 'Baixa';
  dataLimite?: string;
  tipo?: 'Pontual' | 'Recorrente';
  frequencia?: 'Diária' | 'Semanal' | 'Mensal';
  meta?: string;
  status?: 'Aberta' | 'Em andamento' | 'Finalizada';
};

export type Reuniao = {
  id: string;
  data: string;
  horario: string;
  sdrId: string;
  prospectNome: string;
  prospectEmpresa: string;
  tipo: 'Discovery' | 'Apresentação' | 'Fechamento' | 'Outro';
  status: 'Agendada' | 'Realizada' | 'No-show' | 'Cancelada';
  observacoes: string;
};

type AppContextType = {
  clientes: Cliente[];
  faturamentos: Faturamento[];
  custos: Custo[];
  despesas: Despesa[];
  tarefas: Tarefa[];
  reunioes: Reuniao[];
  addCliente: (cliente: Omit<Cliente, 'id'>) => Promise<string | void>;
  removeCliente: (id: string) => Promise<void>;
  addFaturamento: (faturamento: Omit<Faturamento, 'id'>) => Promise<void>;
  removeFaturamento: (id: string) => Promise<void>;
  addCusto: (custo: Omit<Custo, 'id'>) => Promise<void>;
  removeCusto: (id: string) => Promise<void>;
  addDespesa: (despesa: Omit<Despesa, 'id'>) => Promise<void>;
  removeDespesa: (id: string) => Promise<void>;
  addTarefa: (tarefa: Omit<Tarefa, 'id'>) => Promise<string | void>;
  toggleTarefa: (id: string, concluida: boolean) => Promise<void>;
  updateTarefaStatus: (id: string, status: 'Aberta' | 'Em andamento' | 'Finalizada') => Promise<void>;
  updateTarefa: (id: string, updates: Partial<Omit<Tarefa, 'id'>>) => Promise<void>;
  removeTarefa: (id: string) => Promise<void>;
  addReuniao: (reuniao: Omit<Reuniao, 'id'>) => Promise<void>;
  updateReuniao: (id: string, updates: Partial<Omit<Reuniao, 'id'>>) => Promise<void>;
  removeReuniao: (id: string) => Promise<void>;
  userId: string | null;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [faturamentos, setFaturamentos] = useState<Faturamento[]>([]);
  const [custos, setCustos] = useState<Custo[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [userId, setUserId] = useState<string | null>(undefined as any);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userId === undefined) return;
    if (!userId) {
      setClientes([]);
      setFaturamentos([]);
      setCustos([]);
      setDespesas([]);
      setTarefas([]);
      setReunioes([]);
      return;
    }

    const unsubClientes = onSnapshot(query(collection(db, 'clientes')), (snapshot) => {
      setClientes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cliente)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'clientes'));

    const unsubFaturamentos = onSnapshot(query(collection(db, 'faturamentos')), (snapshot) => {
      setFaturamentos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Faturamento)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'faturamentos'));

    const unsubCustos = onSnapshot(query(collection(db, 'custos')), (snapshot) => {
      setCustos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Custo)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'custos'));

    const unsubDespesas = onSnapshot(query(collection(db, 'despesas')), (snapshot) => {
      setDespesas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Despesa)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'despesas'));

    const unsubTarefas = onSnapshot(query(collection(db, 'tarefas')), (snapshot) => {
      setTarefas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tarefa)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tarefas'));

    const unsubReunioes = onSnapshot(query(collection(db, 'reunioes')), (snapshot) => {
      setReunioes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reuniao)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'reunioes'));

    return () => {
      unsubClientes();
      unsubFaturamentos();
      unsubCustos();
      unsubDespesas();
      unsubTarefas();
      unsubReunioes();
    };
  }, [userId]);

  const addCliente = async (cliente: Omit<Cliente, 'id'>) => {
    if (!userId) return;
    try {
      const docRef = await addDoc(collection(db, 'clientes'), cliente);
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

  const addFaturamento = async (faturamento: Omit<Faturamento, 'id'>) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, 'faturamentos'), faturamento);
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

  const addCusto = async (custo: Omit<Custo, 'id'>) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, 'custos'), custo);
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

  const addDespesa = async (despesa: Omit<Despesa, 'id'>) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, 'despesas'), despesa);
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

  const addTarefa = async (tarefa: Omit<Tarefa, 'id'>) => {
    if (!userId) return;
    try {
      const docRef = await addDoc(collection(db, 'tarefas'), tarefa);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tarefas');
    }
  };

  const toggleTarefa = async (id: string, concluida: boolean) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'tarefas', id), { concluida });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tarefas/${id}`);
    }
  };

  const updateTarefaStatus = async (id: string, status: 'Aberta' | 'Em andamento' | 'Finalizada') => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'tarefas', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tarefas/${id}`);
    }
  };

  const updateTarefa = async (id: string, updates: Partial<Omit<Tarefa, 'id'>>) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'tarefas', id), updates as Record<string, unknown>);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tarefas/${id}`);
    }
  };

  const removeTarefa = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'tarefas', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tarefas/${id}`);
    }
  };

  const addReuniao = async (reuniao: Omit<Reuniao, 'id'>) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, 'reunioes'), reuniao);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reunioes');
    }
  };

  const updateReuniao = async (id: string, updates: Partial<Omit<Reuniao, 'id'>>) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'reunioes', id), updates as Record<string, unknown>);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reunioes/${id}`);
    }
  };

  const removeReuniao = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'reunioes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `reunioes/${id}`);
    }
  };

  return (
    <AppContext.Provider value={{
      clientes, faturamentos, custos, despesas, tarefas, reunioes,
      addCliente, removeCliente,
      addFaturamento, removeFaturamento,
      addCusto, removeCusto,
      addDespesa, removeDespesa,
      addTarefa, toggleTarefa, updateTarefaStatus, updateTarefa, removeTarefa,
      addReuniao, updateReuniao, removeReuniao,
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

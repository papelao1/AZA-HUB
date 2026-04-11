// Type definitions and session helpers only.
// User records are stored in Firestore (collection: 'usuarios').

export type UserTag = 'ADMIN' | 'GESTOR' | 'SDR' | 'FINANCEIRO' | 'COMERCIAL';

export type UserRecord = {
  id: string;
  nome: string;
  username: string;
  password: string;
  tag: UserTag;
  status: 'Ativo' | 'Inativo';
};

export type UserSession = {
  id: string;
  nome: string;
  username: string;
  tag: UserTag;
};

const SESSION_KEY = 'azahub_session';

export const TAG_PERMISSIONS: Record<UserTag, string[]> = {
  ADMIN: ['dashboard', 'faturamento', 'custos', 'despesas', 'lucro', 'clientes', 'tarefas', 'reunioes', 'admin', 'aza-ia'],
  GESTOR:     ['dashboard', 'faturamento', 'tarefas', 'reunioes', 'aza-ia'],
  SDR:        ['dashboard', 'faturamento', 'tarefas', 'reunioes', 'aza-ia'],
  FINANCEIRO: ['dashboard', 'faturamento', 'tarefas', 'reunioes', 'aza-ia'],
  COMERCIAL:  ['dashboard', 'faturamento', 'tarefas', 'reunioes', 'aza-ia'],
};

export const TAG_COLORS: Record<UserTag, string> = {
  ADMIN: 'bg-red-100 text-[#CC0000]',
  GESTOR: 'bg-blue-100 text-blue-700',
  SDR: 'bg-green-100 text-green-700',
  FINANCEIRO: 'bg-purple-100 text-purple-700',
  COMERCIAL: 'bg-orange-100 text-orange-700',
};

// Default users seeded into Firestore on first run
export const DEFAULT_USERS: Omit<UserRecord, 'id'>[] = [
  { nome: 'Jean', username: 'jean', password: 'jean2024', tag: 'ADMIN', status: 'Ativo' },
  { nome: 'Gustavo', username: 'gustavo', password: 'gustavo2024', tag: 'ADMIN', status: 'Ativo' },
];

export function getSession(): UserSession | null {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as UserSession;
  } catch {
    return null;
  }
}

export function saveSession(session: UserSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

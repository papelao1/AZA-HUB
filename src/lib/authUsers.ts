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

const USERS_KEY = 'azahub_users';
const SESSION_KEY = 'azahub_session';

export const TAG_PERMISSIONS: Record<UserTag, string[]> = {
  ADMIN: ['dashboard', 'faturamento', 'custos', 'despesas', 'lucro', 'clientes', 'tarefas', 'reunioes', 'admin', 'aza-ia'],
  GESTOR: ['dashboard', 'faturamento', 'custos', 'despesas', 'lucro', 'clientes', 'tarefas', 'reunioes', 'aza-ia'],
  SDR: ['tarefas', 'reunioes'],
  FINANCEIRO: ['dashboard', 'faturamento', 'custos', 'despesas', 'lucro'],
  COMERCIAL: ['clientes', 'tarefas', 'reunioes'],
};

export const TAG_COLORS: Record<UserTag, string> = {
  ADMIN: 'bg-red-100 text-[#CC0000]',
  GESTOR: 'bg-blue-100 text-blue-700',
  SDR: 'bg-green-100 text-green-700',
  FINANCEIRO: 'bg-purple-100 text-purple-700',
  COMERCIAL: 'bg-orange-100 text-orange-700',
};

const DEFAULT_USERS: UserRecord[] = [
  { id: 'user_jean', nome: 'Jean', username: 'jean', password: 'jean2024', tag: 'ADMIN', status: 'Ativo' },
  { id: 'user_gustavo', nome: 'Gustavo', username: 'gustavo', password: 'gustavo2024', tag: 'ADMIN', status: 'Ativo' },
];

export function getUsers(): UserRecord[] {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (!stored) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const users = JSON.parse(stored) as UserRecord[];
    // Ensure default users exist
    let changed = false;
    for (const def of DEFAULT_USERS) {
      if (!users.find(u => u.username === def.username)) {
        users.push(def);
        changed = true;
      }
    }
    if (changed) localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return users;
  } catch {
    return [...DEFAULT_USERS];
  }
}

export function saveUsers(users: UserRecord[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function loginUser(username: string, password: string): UserSession | null {
  const users = getUsers();
  const user = users.find(
    u => u.username === username && u.password === password && u.status === 'Ativo'
  );
  if (!user) return null;
  const session: UserSession = { id: user.id, nome: user.nome, username: user.username, tag: user.tag };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logoutUser(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getSession(): UserSession | null {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as UserSession;
  } catch {
    return null;
  }
}

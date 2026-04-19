import React, { useState } from 'react';
import {
  LayoutDashboard, Receipt, TrendingDown, TrendingUp, Users,
  Menu, LogOut, CheckSquare, CalendarDays, ShieldCheck, KeyRound, X,
} from 'lucide-react';
import { cn } from './lib/utils';
import { useAppStore } from './lib/store';
import { useAuth } from './lib/authContext';
import { TAG_PERMISSIONS, TAG_COLORS } from './lib/authUsers';
import { Modal, Button, Input, Label } from './components/ui';
import Dashboard from './pages/Dashboard';
import Faturamento from './pages/Faturamento';
import Custos from './pages/Custos';
import Despesas from './pages/Despesas';
import Lucro from './pages/Lucro';
import Clientes from './pages/Clientes';
import Login from './pages/Login';
import AzaIA from './pages/AzaIA';
import Tarefas from './pages/Tarefas';
import Reunioes from './pages/Reunioes';
import Admin from './pages/Admin';
import { InstallPWA } from './components/InstallPWA';

const AzaIcon = ({ size, className }: { size: number, className?: string }) => (
  <img
    src="https://squarecrop.onrender.com/image/nENlioz9FTOhyWzwMORe.webp"
    alt="AZA IA"
    width={size}
    height={size}
    className={cn("rounded-full object-cover", className)}
    referrerPolicy="no-referrer"
  />
);

type Page = 'dashboard' | 'faturamento' | 'custos' | 'despesas' | 'lucro' | 'clientes' | 'tarefas' | 'reunioes' | 'admin' | 'aza-ia';

const ALL_MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'faturamento', label: 'Faturamento', icon: TrendingUp },
  { id: 'custos', label: 'Custos', icon: TrendingDown },
  { id: 'despesas', label: 'Despesas', icon: Receipt },
  { id: 'lucro', label: 'Lucro', icon: TrendingUp },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'tarefas', label: 'Tarefas', icon: CheckSquare },
  { id: 'reunioes', label: 'Reuniões', icon: CalendarDays },
  { id: 'admin', label: 'Admin', icon: ShieldCheck },
  { id: 'aza-ia', label: 'AZA IA', icon: AzaIcon },
] as const;

export default function App() {
  const { userId } = useAppStore();
  const { session, logout, updateUser, users: authUsers } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isPasswordModal, setIsPasswordModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const openPasswordModal = () => {
    setPwForm({ current: '', next: '', confirm: '' });
    setPwError(null);
    setPwSuccess(false);
    setIsPasswordModal(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);
    const me = authUsers.find(u => u.id === session?.id);
    if (!me || me.password !== pwForm.current) { setPwError('Senha atual incorreta.'); return; }
    if (pwForm.next.length < 4) { setPwError('A nova senha deve ter ao menos 4 caracteres.'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('As senhas não coincidem.'); return; }
    await updateUser(session!.id, { password: pwForm.next });
    setPwSuccess(true);
    setPwForm({ current: '', next: '', confirm: '' });
  };

  if (!session) return <Login />;

  const allowed = TAG_PERMISSIONS[session.tag] ?? [];
  const menuItems = ALL_MENU_ITEMS.filter(item => allowed.includes(item.id));
  const safePage: Page = allowed.includes(currentPage) ? currentPage : (allowed[0] as Page) ?? 'dashboard';

  const renderPage = () => {
    switch (safePage) {
      case 'dashboard': return <Dashboard />;
      case 'faturamento': return <Faturamento />;
      case 'custos': return <Custos />;
      case 'despesas': return <Despesas />;
      case 'lucro': return <Lucro />;
      case 'clientes': return <Clientes />;
      case 'tarefas': return <Tarefas />;
      case 'reunioes': return <Reunioes />;
      case 'admin': return <Admin />;
      case 'aza-ia': return <AzaIA />;
      default: return <Dashboard />;
    }
  };

  const navigate = (page: Page) => { setCurrentPage(page); setIsSidebarOpen(false); };
  const isLoading = userId === undefined;

  return (
    <div className="h-[100dvh] w-full flex overflow-hidden" style={{ background: '#f4f5f7' }}>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(15,17,22,0.45)', backdropFilter: 'blur(2px)' }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[240px] bg-white flex flex-col",
        "transform transition-transform duration-200 ease-in-out",
        "lg:translate-x-0 lg:static lg:flex-shrink-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )} style={{ borderRight: '1px solid #eceef2' }}>

        {/* Logo */}
        <div className="h-[60px] flex items-center px-5 shrink-0" style={{ borderBottom: '1px solid #eceef2' }}>
          <img
            src="https://squarecrop.onrender.com/image/nENlioz9FTOhyWzwMORe.webp"
            alt="AZA Logo"
            className="w-8 h-8 rounded-xl object-cover shrink-0"
            referrerPolicy="no-referrer"
          />
          <h1 className="ml-2.5 text-[18px] font-bold tracking-tight">
            <span style={{ color: '#CC0000' }}>AZA</span>
            <span className="text-gray-800">Hub</span>
          </h1>
          {/* Mobile close */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="ml-auto lg:hidden text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-3.5 mx-3 mt-3 rounded-xl shrink-0" style={{ background: '#f8f9fb' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #CC0000, #ff4444)' }}>
              {session.nome.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-gray-800 truncate leading-tight">{session.nome}</p>
              <p className="text-[11px] text-gray-400 truncate leading-tight">@{session.username}</p>
            </div>
          </div>
          <span className={cn("inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase", TAG_COLORS[session.tag])}>
            {session.tag}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = safePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id as Page)}
                className={cn(
                  "relative w-full flex items-center gap-3 px-3.5 py-2.5 text-[13.5px] font-medium rounded-xl transition-all duration-150",
                  isActive
                    ? "text-[#CC0000] nav-item-active"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                )}
                style={isActive ? { background: 'rgba(204,0,0,0.07)' } : {}}
              >
                <Icon
                  size={17}
                  className={cn("shrink-0 transition-colors", isActive ? "text-[#CC0000]" : "text-gray-400")}
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 shrink-0" style={{ borderTop: '1px solid #eceef2' }}>
          <InstallPWA />
          <button
            onClick={openPasswordModal}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all duration-150"
          >
            <KeyRound size={16} className="text-gray-400 shrink-0" />
            Alterar Senha
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-150"
          >
            <LogOut size={16} className="shrink-0" />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile header */}
        <header className="h-[60px] bg-white flex items-center px-4 lg:hidden shrink-0"
          style={{ borderBottom: '1px solid #eceef2' }}>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-1.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="ml-3 flex items-center gap-2">
            <img
              src="https://squarecrop.onrender.com/image/nENlioz9FTOhyWzwMORe.webp"
              alt="AZA Logo"
              className="w-7 h-7 rounded-lg object-cover"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-[17px] font-bold tracking-tight">
              <span style={{ color: '#CC0000' }}>AZA</span>
              <span className="text-gray-800">Hub</span>
            </h1>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center flex-1 gap-3">
              <div className="spinner" />
              <span className="text-sm text-gray-400 font-medium">Conectando...</span>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
              {renderPage()}
            </div>
          )}
        </div>
      </main>

      {/* Change Password Modal */}
      <Modal isOpen={isPasswordModal} onClose={() => setIsPasswordModal(false)} title="Alterar Senha">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <Label>Senha atual</Label>
            <Input type="password" required placeholder="Digite sua senha atual"
              value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} />
          </div>
          <div>
            <Label>Nova senha</Label>
            <Input type="password" required placeholder="Mínimo 4 caracteres"
              value={pwForm.next} onChange={e => setPwForm({ ...pwForm, next: e.target.value })} />
          </div>
          <div>
            <Label>Confirmar nova senha</Label>
            <Input type="password" required placeholder="Repita a nova senha"
              value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} />
          </div>
          {pwError && (
            <div className="bg-red-50 text-red-600 text-sm px-3.5 py-2.5 rounded-xl border border-red-100">
              {pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="bg-green-50 text-green-700 text-sm px-3.5 py-2.5 rounded-xl border border-green-100">
              Senha alterada com sucesso!
            </div>
          )}
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsPasswordModal(false)}>Fechar</Button>
            {!pwSuccess && <Button type="submit">Salvar</Button>}
          </div>
        </form>
      </Modal>
    </div>
  );
}

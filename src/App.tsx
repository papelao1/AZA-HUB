import React, { useState } from 'react';
import {
  LayoutDashboard, Receipt, TrendingDown, TrendingUp, Users,
  Menu, LogOut, CheckSquare, CalendarDays, ShieldCheck,
} from 'lucide-react';
import { cn } from './lib/utils';
import { useAppStore } from './lib/store';
import { useAuth } from './lib/authContext';
import { TAG_PERMISSIONS, TAG_COLORS } from './lib/authUsers';
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
  const { session, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Gate: show login if no custom session
  if (!session) {
    return <Login />;
  }

  const allowed = TAG_PERMISSIONS[session.tag] ?? [];
  const menuItems = ALL_MENU_ITEMS.filter(item => allowed.includes(item.id));

  // If current page isn't allowed, redirect to first allowed page
  const safePage: Page = allowed.includes(currentPage)
    ? currentPage
    : (allowed[0] as Page) ?? 'dashboard';

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

  const navigate = (page: Page) => {
    setCurrentPage(page);
    setIsSidebarOpen(false);
  };

  // Show loading state while Firebase auth initialises (data not ready yet)
  const isLoading = userId === undefined;

  return (
    <div className="h-[100dvh] w-full bg-gray-50 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 gap-3">
          <img
            src="https://squarecrop.onrender.com/image/nENlioz9FTOhyWzwMORe.webp"
            alt="AZA Logo"
            className="w-8 h-8 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-xl font-bold">
            <span className="text-[#CC0000]">AZA</span>
            <span className="text-gray-700">Hub</span>
          </h1>
        </div>

        {/* User Info */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-semibold text-gray-800 truncate">{session.nome}</p>
          <p className="text-xs text-gray-500 truncate mb-1">@{session.username}</p>
          <span className={cn(
            "inline-block px-2 py-0.5 rounded-full text-xs font-semibold",
            TAG_COLORS[session.tag]
          )}>
            {session.tag}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = safePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id as Page)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                  isActive
                    ? "bg-[#CC0000]/10 text-[#CC0000]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon size={20} className={cn(isActive ? "text-[#CC0000]" : "text-gray-400")} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <InstallPWA />
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors mt-2"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <div className="ml-4 flex items-center gap-2">
            <img
              src="https://squarecrop.onrender.com/image/nENlioz9FTOhyWzwMORe.webp"
              alt="AZA Logo"
              className="w-8 h-8 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-lg font-bold">
              <span className="text-[#CC0000]">AZA</span>
              <span className="text-gray-700">Hub</span>
            </h1>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-gray-400 text-sm">Conectando ao banco de dados...</div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
              {renderPage()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

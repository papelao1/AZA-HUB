import React, { useState } from 'react';
import { LayoutDashboard, Receipt, TrendingDown, TrendingUp, Users, Menu, X, LogOut, Sparkles } from 'lucide-react';
import { cn } from './lib/utils';
import { useAppStore } from './lib/store';
import { auth } from './lib/firebase';
import Dashboard from './pages/Dashboard';
import Faturamento from './pages/Faturamento';
import Custos from './pages/Custos';
import Despesas from './pages/Despesas';
import Lucro from './pages/Lucro';
import Clientes from './pages/Clientes';
import Login from './pages/Login';
import AzaIA from './pages/AzaIA';
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

type Page = 'dashboard' | 'faturamento' | 'custos' | 'despesas' | 'lucro' | 'clientes' | 'aza-ia';

export default function App() {
  const { userId } = useAppStore();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (userId === null) {
    return <Login />;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'faturamento', label: 'Faturamento', icon: TrendingUp },
    { id: 'custos', label: 'Custos', icon: TrendingDown },
    { id: 'despesas', label: 'Despesas', icon: Receipt },
    { id: 'lucro', label: 'Lucro', icon: TrendingUp },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'aza-ia', label: 'AZA IA', icon: AzaIcon },
  ] as const;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'faturamento': return <Faturamento />;
      case 'custos': return <Custos />;
      case 'despesas': return <Despesas />;
      case 'lucro': return <Lucro />;
      case 'clientes': return <Clientes />;
      case 'aza-ia': return <AzaIA />;
      default: return <Dashboard />;
    }
  };

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
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setIsSidebarOpen(false);
                }}
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

        <div className="p-4 border-t border-gray-100">
          <InstallPWA />
          <button
            onClick={() => auth.signOut()}
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
          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
            {renderPage()}
          </div>
        </div>
      </main>
    </div>
  );
}

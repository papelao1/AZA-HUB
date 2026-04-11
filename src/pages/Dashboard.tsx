import React from 'react';
import { useAppStore } from '../lib/store';
import { useAuth } from '../lib/authContext';
import { Card } from '../components/ui';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingDown, TrendingUp, Users, Wallet, Circle, Clock } from 'lucide-react';

export default function Dashboard() {
  const { faturamentos, custos, despesas, clientes, tarefas, toggleTarefa } = useAppStore();
  const { session } = useAuth();

  const isAdmin = session?.tag === 'ADMIN';
  const currentMonth = new Date().toISOString().slice(0, 7);

  // ── Métricas do mês ──────────────────────────────────────────────────────
  const faturamentoMes = faturamentos
    .filter(f => f.data.startsWith(currentMonth))
    .reduce((acc, curr) => acc + curr.valor, 0);

  const custosMes = custos
    .filter(c => c.data.startsWith(currentMonth))
    .reduce((acc, curr) => acc + curr.valor, 0);

  const despesasMes = despesas
    .filter(d => d.data.startsWith(currentMonth))
    .reduce((acc, curr) => acc + curr.valor, 0);

  const lucroLiquido = faturamentoMes - custosMes - despesasMes;
  const clientesAtivos = clientes.filter(c => c.status === 'Ativo').length;
  const previsaoEntrada = faturamentos
    .filter(f => f.status === 'Pendente')
    .reduce((acc, curr) => acc + curr.valor, 0);

  // ── Dados do gráfico ─────────────────────────────────────────────────────
  const monthsMap = new Map<string, { faturamento: number; custosDespesas: number; lucro: number }>();

  [...faturamentos, ...custos, ...despesas].forEach(item => {
    const month = item.data.slice(0, 7);
    if (!monthsMap.has(month)) {
      monthsMap.set(month, { faturamento: 0, custosDespesas: 0, lucro: 0 });
    }
  });

  faturamentos.forEach(f => {
    const month = f.data.slice(0, 7);
    const d = monthsMap.get(month)!;
    d.faturamento += f.valor;
    d.lucro += f.valor;
  });
  custos.forEach(c => {
    const month = c.data.slice(0, 7);
    const d = monthsMap.get(month)!;
    d.custosDespesas += c.valor;
    d.lucro -= c.valor;
  });
  despesas.forEach(de => {
    const month = de.data.slice(0, 7);
    const d = monthsMap.get(month)!;
    d.custosDespesas += de.valor;
    d.lucro -= de.valor;
  });

  const chartData = Array.from(monthsMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ name: month.split('-').reverse().join('/'), ...data }));

  // ── Tarefas pendentes ────────────────────────────────────────────────────
  const tarefasPendentes = tarefas
    .filter(t => t.status ? t.status !== 'Finalizada' : !t.concluida)
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))
    .slice(0, 5);

  // ── Últimos lançamentos (só ADMIN) ───────────────────────────────────────
  const ultimosLancamentos = [...faturamentos, ...custos, ...despesas]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 5)
    .map(item => ({
      ...item,
      tipo: 'clienteId' in item
        ? 'Faturamento'
        : custos.some(c => c.id === item.id) ? 'Custo' : 'Despesa',
    }));

  // ════════════════════════════════════════════════════════════════════════
  // VISÃO NÃO-ADMIN
  // ════════════════════════════════════════════════════════════════════════
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

        {/* Cards: Faturamento do mês + Previsão + Clientes Ativos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Faturamento (Mês)</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(faturamentoMes)}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Previsão de Entrada</p>
              <p className="text-xl font-bold text-yellow-600">{formatCurrency(previsaoEntrada)}</p>
              <p className="text-xs text-gray-400">Pendentes a receber</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center space-x-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Clientes Ativos</p>
              <p className="text-xl font-bold text-green-600">{clientesAtivos}</p>
            </div>
          </Card>
        </div>

        {/* Gráfico de evolução de faturamento */}
        <Card className="h-[360px] flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Evolução de Faturamento</h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} width={70}
                  tickFormatter={v => `R$ ${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line type="monotone" dataKey="faturamento" name="Faturamento" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Tarefas pendentes */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tarefas Pendentes</h2>
          <div className="space-y-2">
            {tarefasPendentes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma tarefa pendente!</p>
            ) : (
              tarefasPendentes.map(tarefa => (
                <div key={tarefa.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <button
                    onClick={() => toggleTarefa(tarefa.id, true)}
                    className="text-gray-300 hover:text-[#CC0000] transition-colors shrink-0"
                  >
                    <Circle size={20} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{tarefa.titulo}</p>
                    {tarefa.descricao && (
                      <p className="text-xs text-gray-400 truncate">{tarefa.descricao}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // VISÃO ADMIN (completa)
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="p-4 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Faturamento (Mês)</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(faturamentoMes)}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center space-x-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg"><Clock size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Previsão de Entrada</p>
            <p className="text-xl font-bold text-yellow-600">{formatCurrency(previsaoEntrada)}</p>
            <p className="text-xs text-gray-400">Pendentes a receber</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg"><TrendingDown size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Custos (Mês)</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(custosMes)}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg"><Wallet size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Despesas (Mês)</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(despesasMes)}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg"><DollarSign size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Lucro Líquido (Mês)</p>
            <p className={cn('text-xl font-bold', lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600')}>
              {formatCurrency(lucroLiquido)}
            </p>
          </div>
        </Card>
        <Card className="p-4 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg"><Users size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Clientes Ativos</p>
            <p className="text-xl font-bold text-green-600">{clientesAtivos}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-[400px] flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Evolução do Lucro</h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} width={70}
                  tickFormatter={v => `R$ ${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="h-[400px] flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Faturamento vs Custos + Despesas</h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} width={70}
                  tickFormatter={v => `R$ ${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="faturamento" name="Faturamento" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="custosDespesas" name="Custos + Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tarefas Pendentes</h2>
          <div className="space-y-2">
            {tarefasPendentes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma tarefa pendente!</p>
            ) : (
              tarefasPendentes.map(tarefa => (
                <div key={tarefa.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <button
                    onClick={() => toggleTarefa(tarefa.id, true)}
                    className="text-gray-300 hover:text-[#CC0000] transition-colors shrink-0"
                  >
                    <Circle size={20} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{tarefa.titulo}</p>
                    {tarefa.descricao && (
                      <p className="text-xs text-gray-400 truncate">{tarefa.descricao}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Últimos Lançamentos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-sm text-gray-500">
                  <th className="pb-3 font-medium">Data</th>
                  <th className="pb-3 font-medium">Tipo</th>
                  <th className="pb-3 font-medium">Descrição</th>
                  <th className="pb-3 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {ultimosLancamentos.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 text-gray-900">{formatDate(item.data)}</td>
                    <td className="py-3">
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        item.tipo === 'Faturamento' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
                      )}>
                        {item.tipo}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">{item.descricao}</td>
                    <td className={cn('py-3 text-right font-medium', item.tipo === 'Faturamento' ? 'text-green-600' : 'text-red-600')}>
                      {item.tipo === 'Faturamento' ? '+' : '-'}{formatCurrency(item.valor)}
                    </td>
                  </tr>
                ))}
                {ultimosLancamentos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">Nenhum lançamento encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

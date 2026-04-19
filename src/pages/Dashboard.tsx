import React from 'react';
import { useAppStore } from '../lib/store';
import { useAuth } from '../lib/authContext';
import { Card } from '../components/ui';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingDown, TrendingUp, Users, Wallet, Circle, Clock, ArrowUpRight } from 'lucide-react';

/* ── Metric Card ─────────────────────────────────────────────────────────── */
function MetricCard({
  label, value, icon: Icon, iconBg, valueColor, sub,
}: {
  label: string; value: string; icon: React.ElementType; iconBg: string; valueColor: string; sub?: string;
}) {
  return (
    <Card className="p-5 flex flex-col gap-3 hover:translate-y-[-1px] transition-transform duration-200">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-gray-400 tracking-wide uppercase">{label}</span>
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
          <Icon size={15} />
        </div>
      </div>
      <div>
        <p className={cn("text-2xl font-bold tracking-tight", valueColor)}>{value}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{sub}</p>}
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { faturamentos, custos, despesas, clientes, tarefas, toggleTarefa } = useAppStore();
  const { session } = useAuth();

  const isAdmin = session?.tag === 'ADMIN';
  const currentMonth = new Date().toISOString().slice(0, 7);

  // ── Métricas do mês ──────────────────────────────────────────────────────
  const faturamentoMes = faturamentos
    .filter(f => f.data.startsWith(currentMonth) && f.status === 'Recebido' && (isAdmin || f.tipo === 'Produto Front'))
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
    .filter(f => f.status === 'Pendente' && (isAdmin || f.tipo === 'Produto Front'))
    .reduce((acc, curr) => acc + curr.valor, 0);

  // ── Dados do gráfico ─────────────────────────────────────────────────────
  const faturamentosRecebidos = faturamentos.filter(f => f.status === 'Recebido' && (isAdmin || f.tipo === 'Produto Front'));
  const monthsMap = new Map<string, { faturamento: number; custosDespesas: number; lucro: number }>();

  [...faturamentosRecebidos, ...custos, ...despesas].forEach(item => {
    const month = item.data.slice(0, 7);
    if (!monthsMap.has(month)) monthsMap.set(month, { faturamento: 0, custosDespesas: 0, lucro: 0 });
  });
  faturamentosRecebidos.forEach(f => {
    const d = monthsMap.get(f.data.slice(0, 7))!;
    d.faturamento += f.valor; d.lucro += f.valor;
  });
  custos.forEach(c => {
    const d = monthsMap.get(c.data.slice(0, 7))!;
    d.custosDespesas += c.valor; d.lucro -= c.valor;
  });
  despesas.forEach(de => {
    const d = monthsMap.get(de.data.slice(0, 7))!;
    d.custosDespesas += de.valor; d.lucro -= de.valor;
  });

  const chartData = Array.from(monthsMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ name: month.split('-').reverse().join('/'), ...data }));

  // ── Tarefas pendentes ────────────────────────────────────────────────────
  const tarefasPendentes = tarefas
    .filter(t => t.status ? t.status !== 'Finalizada' : !t.concluida)
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))
    .slice(0, 5);

  // ── Últimos lançamentos ──────────────────────────────────────────────────
  const ultimosLancamentos = [...faturamentos, ...custos, ...despesas]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 5)
    .map(item => ({
      ...item,
      tipo: 'clienteId' in item ? 'Faturamento' : custos.some(c => c.id === item.id) ? 'Custo' : 'Despesa',
    }));

  const tickFormatter = (v: number) => `R$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`;
  const axisProps = {
    axisLine: false as const, tickLine: false as const,
    tick: { fill: '#9ca3af', fontSize: 11, fontFamily: 'Plus Jakarta Sans' },
  };

  /* ── Tarefas list (shared) ─────────────────────────────────────────────── */
  const TarefasList = () => (
    <div className="space-y-0.5">
      {tarefasPendentes.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Nenhuma tarefa pendente!</p>
      ) : (
        tarefasPendentes.map(tarefa => (
          <div key={tarefa.id}
            className="flex items-center gap-3 px-1 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
            <button
              onClick={() => toggleTarefa(tarefa.id, true)}
              className="w-5 h-5 rounded-full border-2 border-gray-200 group-hover:border-[#CC0000] transition-colors shrink-0 flex items-center justify-center"
            >
              <Circle size={10} className="text-transparent group-hover:text-[#CC0000] transition-colors" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-gray-800 truncate">{tarefa.titulo}</p>
              {tarefa.descricao && (
                <p className="text-[11px] text-gray-400 truncate">{tarefa.descricao}</p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════
     VISÃO NÃO-ADMIN
  ══════════════════════════════════════════════════════════════════════ */
  if (!isAdmin) {
    return (
      <div className="space-y-5 page-enter">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Visão geral do seu desempenho</p>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            label="Faturamento (Mês)" value={formatCurrency(faturamentoMes)}
            icon={TrendingUp} iconBg="bg-emerald-50 text-emerald-600" valueColor="text-emerald-600"
          />
          <MetricCard
            label="Previsão de Entrada" value={formatCurrency(previsaoEntrada)}
            icon={Clock} iconBg="bg-amber-50 text-amber-500" valueColor="text-amber-500"
            sub="Pendentes a receber"
          />
          <MetricCard
            label="Clientes Ativos" value={String(clientesAtivos)}
            icon={Users} iconBg="bg-blue-50 text-blue-500" valueColor="text-gray-900"
          />
        </div>

        {/* Chart */}
        <Card className="h-[360px] flex flex-col p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Evolução de Faturamento</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">Produto Front recebido por mês</p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
              <ArrowUpRight size={12} /> Recebido
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} width={60} tickFormatter={tickFormatter} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}
                />
                <Line type="monotone" dataKey="faturamento" name="Faturamento" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3.5, fill: '#10B981' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Tasks */}
        <Card className="p-6">
          <h2 className="text-[15px] font-bold text-gray-900 mb-4">Tarefas Pendentes</h2>
          <TarefasList />
        </Card>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     VISÃO ADMIN (completa)
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5 page-enter">
      <div>
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Resumo financeiro do mês atual</p>
      </div>

      {/* Metric cards — 6 colunas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard label="Faturamento" value={formatCurrency(faturamentoMes)}
          icon={TrendingUp} iconBg="bg-emerald-50 text-emerald-600" valueColor="text-emerald-600" />
        <MetricCard label="Previsão de Entrada" value={formatCurrency(previsaoEntrada)}
          icon={Clock} iconBg="bg-amber-50 text-amber-500" valueColor="text-amber-500" sub="Pendentes" />
        <MetricCard label="Custos (Mês)" value={formatCurrency(custosMes)}
          icon={TrendingDown} iconBg="bg-red-50 text-red-500" valueColor="text-red-500" />
        <MetricCard label="Despesas (Mês)" value={formatCurrency(despesasMes)}
          icon={Wallet} iconBg="bg-red-50 text-red-500" valueColor="text-red-500" />
        <MetricCard label="Lucro Líquido" value={formatCurrency(lucroLiquido)}
          icon={DollarSign}
          iconBg={lucroLiquido >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}
          valueColor={lucroLiquido >= 0 ? "text-emerald-600" : "text-red-500"} />
        <MetricCard label="Clientes Ativos" value={String(clientesAtivos)}
          icon={Users} iconBg="bg-blue-50 text-blue-500" valueColor="text-gray-900" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="h-[380px] flex flex-col p-6">
          <div className="mb-4">
            <h2 className="text-[15px] font-bold text-gray-900">Evolução do Lucro</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">Lucro líquido mensal</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} width={60} tickFormatter={tickFormatter} />
                <Tooltip formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }} />
                <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3.5, fill: '#10B981' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="h-[380px] flex flex-col p-6">
          <div className="mb-4">
            <h2 className="text-[15px] font-bold text-gray-900">Faturamento vs Custos</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">Comparativo mensal</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} width={60} tickFormatter={tickFormatter} />
                <Tooltip formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans' }} />
                <Bar dataKey="faturamento" name="Faturamento" fill="#10B981" radius={[5, 5, 0, 0]} />
                <Bar dataKey="custosDespesas" name="Custos + Despesas" fill="#EF4444" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Tasks + Recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-6">
          <h2 className="text-[15px] font-bold text-gray-900 mb-4">Tarefas Pendentes</h2>
          <TarefasList />
        </Card>

        <Card className="p-6">
          <h2 className="text-[15px] font-bold text-gray-900 mb-4">Últimos Lançamentos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  {['Data', 'Tipo', 'Descrição', 'Valor'].map(h => (
                    <th key={h} className={cn("pb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide", h === 'Valor' && 'text-right')}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {ultimosLancamentos.map((item, i) => (
                  <tr key={i} style={{ borderBottom: i < ultimosLancamentos.length - 1 ? '1px solid #f8f8f8' : 'none' }}>
                    <td className="py-3 text-gray-500 font-medium">{formatDate(item.data)}</td>
                    <td className="py-3">
                      <span className={cn(
                        'px-2.5 py-0.5 rounded-full text-[11px] font-semibold',
                        item.tipo === 'Faturamento' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600',
                      )}>
                        {item.tipo}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600 max-w-[120px] truncate">{item.descricao}</td>
                    <td className={cn('py-3 text-right font-semibold', item.tipo === 'Faturamento' ? 'text-emerald-600' : 'text-red-500')}>
                      {item.tipo === 'Faturamento' ? '+' : '-'}{formatCurrency(item.valor)}
                    </td>
                  </tr>
                ))}
                {ultimosLancamentos.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-gray-400 text-sm">Nenhum lançamento encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

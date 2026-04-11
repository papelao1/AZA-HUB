import React from 'react';
import { useAppStore } from '../lib/store';
import { Card } from '../components/ui';
import { formatCurrency, cn } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function Lucro() {
  const { faturamentos, custos, despesas } = useAppStore();

  const faturamentosRecebidos = faturamentos.filter(f => f.status === 'Recebido');

  const monthsMap = new Map<string, { faturamento: number, custos: number, despesas: number, lucro: number, margem: number }>();

  [...faturamentosRecebidos, ...custos, ...despesas].forEach(item => {
    const month = item.data.slice(0, 7);
    if (!monthsMap.has(month)) {
      monthsMap.set(month, { faturamento: 0, custos: 0, despesas: 0, lucro: 0, margem: 0 });
    }
  });

  faturamentosRecebidos.forEach(f => {
    const data = monthsMap.get(f.data.slice(0, 7))!;
    data.faturamento += f.valor;
    data.lucro += f.valor;
  });

  custos.forEach(c => {
    const data = monthsMap.get(c.data.slice(0, 7))!;
    data.custos += c.valor;
    data.lucro -= c.valor;
  });

  despesas.forEach(d => {
    const data = monthsMap.get(d.data.slice(0, 7))!;
    data.despesas += d.valor;
    data.lucro -= d.valor;
  });

  const chartData = Array.from(monthsMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      const margem = data.faturamento > 0 ? (data.lucro / data.faturamento) * 100 : 0;
      return {
        name: month.split('-').reverse().join('/'),
        monthRaw: month,
        ...data,
        margem
      };
    });

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthData = chartData.find(d => d.monthRaw === currentMonth) || { faturamento: 0, custos: 0, despesas: 0, lucro: 0, margem: 0 };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Lucro e Rentabilidade</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={cn("p-6 text-white", currentMonthData.lucro >= 0 ? "bg-green-600" : "bg-red-600")}>
          <h2 className="text-lg font-medium opacity-90 mb-2">Lucro Líquido (Mês Atual)</h2>
          <p className="text-4xl font-bold mb-4">{formatCurrency(currentMonthData.lucro)}</p>
          <div className="space-y-2 text-sm opacity-90">
            <div className="flex justify-between">
              <span>Faturamento:</span>
              <span>{formatCurrency(currentMonthData.faturamento)}</span>
            </div>
            <div className="flex justify-between">
              <span>Custos:</span>
              <span>- {formatCurrency(currentMonthData.custos)}</span>
            </div>
            <div className="flex justify-between">
              <span>Despesas:</span>
              <span>- {formatCurrency(currentMonthData.despesas)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-center items-center text-center">
          <h2 className="text-lg font-medium text-gray-500 mb-2">Margem de Lucro (Mês Atual)</h2>
          <div className="flex items-center justify-center gap-4">
            <p className={cn("text-5xl font-bold", currentMonthData.margem >= 0 ? "text-green-600" : "text-red-600")}>
              {currentMonthData.margem.toFixed(1)}%
            </p>
            {currentMonthData.margem >= 0 ? (
              <TrendingUp size={40} className="text-green-600" />
            ) : (
              <TrendingDown size={40} className="text-red-600" />
            )}
          </div>
          <p className="text-sm text-gray-400 mt-4">
            (Lucro Líquido / Faturamento) * 100
          </p>
        </Card>
      </div>

      <Card className="h-[400px] flex flex-col">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Evolução do Lucro</h2>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} tickFormatter={(value) => `R$ ${value}`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#10B981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Comparativo Mensal</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-sm text-gray-500">
                <th className="pb-3 font-medium">Mês</th>
                <th className="pb-3 font-medium text-right">Faturamento</th>
                <th className="pb-3 font-medium text-right">Custos</th>
                <th className="pb-3 font-medium text-right">Despesas</th>
                <th className="pb-3 font-medium text-right">Lucro</th>
                <th className="pb-3 font-medium text-right">Margem %</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[...chartData].reverse().map((item, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="py-3 text-gray-900 font-medium">{item.name}</td>
                  <td className="py-3 text-right text-green-600">{formatCurrency(item.faturamento)}</td>
                  <td className="py-3 text-right text-red-600">{formatCurrency(item.custos)}</td>
                  <td className="py-3 text-right text-red-600">{formatCurrency(item.despesas)}</td>
                  <td className={cn("py-3 text-right font-bold", item.lucro >= 0 ? "text-green-600" : "text-red-600")}>
                    {formatCurrency(item.lucro)}
                  </td>
                  <td className={cn("py-3 text-right font-medium", item.margem >= 0 ? "text-green-600" : "text-red-600")}>
                    {item.margem.toFixed(1)}%
                  </td>
                </tr>
              ))}
              {chartData.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Nenhum dado financeiro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

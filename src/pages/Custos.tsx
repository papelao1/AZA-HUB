import React, { useState } from 'react';
import { useAppStore, Custo as CustoType } from '../lib/store';
import { Card, Button, Modal, Input, Select, Label } from '../components/ui';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CATEGORIAS = ['Operacional', 'Produto', 'Marketing', 'Pessoal', 'Outro'] as const;
const COLORS = ['#CC0000', '#FF4444', '#FF8888', '#FFCCCC', '#880000'];

export default function Custos() {
  const { custos, addCusto, removeCusto } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const [formData, setFormData] = useState<Omit<CustoType, 'id'>>({
    data: new Date().toISOString().slice(0, 10),
    categoria: 'Operacional',
    descricao: '',
    valor: 0,
  });

  const filteredCustos = custos
    .filter(c => c.data.startsWith(filterMonth))
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const totalCustos = filteredCustos.reduce((acc, curr) => acc + curr.valor, 0);

  const chartData = CATEGORIAS.map(cat => ({
    name: cat,
    value: filteredCustos.filter(c => c.categoria === cat).reduce((acc, curr) => acc + curr.valor, 0)
  })).filter(d => d.value > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCusto(formData);
    setIsModalOpen(false);
    setFormData({
      data: new Date().toISOString().slice(0, 10),
      categoria: 'Operacional',
      descricao: '',
      valor: 0,
    });
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      removeCusto(itemToDelete);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Custos</h1>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={20} /> Novo Custo
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <p className="text-sm text-gray-500 font-medium">Total de Custos no Período</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalCustos)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="mb-0 whitespace-nowrap">Filtrar por Mês:</Label>
          <Input 
            type="month" 
            value={filterMonth} 
            onChange={(e) => setFilterMonth(e.target.value)} 
            className="w-auto"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lançamentos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-sm text-gray-500">
                  <th className="pb-3 font-medium">Data</th>
                  <th className="pb-3 font-medium">Categoria</th>
                  <th className="pb-3 font-medium">Descrição</th>
                  <th className="pb-3 font-medium text-right">Valor</th>
                  <th className="pb-3 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredCustos.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="py-3 text-gray-900">{formatDate(item.data)}</td>
                    <td className="py-3 text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                        {item.categoria}
                      </span>
                    </td>
                    <td className="py-3 text-gray-900 font-medium">{item.descricao}</td>
                    <td className="py-3 text-right font-medium text-red-600">
                      {formatCurrency(item.valor)}
                    </td>
                    <td className="py-3 text-center">
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCustos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      Nenhum custo encontrado neste período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="h-[400px] flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Por Categoria</h2>
          <div className="flex-1 min-h-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Sem dados para exibir
              </div>
            )}
          </div>
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Custo">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Data</Label>
            <Input 
              type="date" 
              required 
              value={formData.data} 
              onChange={e => setFormData({...formData, data: e.target.value})} 
            />
          </div>
          <div>
            <Label>Categoria</Label>
            <Select 
              required 
              value={formData.categoria} 
              onChange={e => setFormData({...formData, categoria: e.target.value as any})}
            >
              {CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Descrição</Label>
            <Input 
              type="text" 
              required 
              placeholder="Ex: Servidor AWS"
              value={formData.descricao} 
              onChange={e => setFormData({...formData, descricao: e.target.value})} 
            />
          </div>
          <div>
            <Label>Valor (R$)</Label>
            <Input 
              type="number" 
              required 
              min="0" 
              step="0.01"
              value={formData.valor || ''} 
              onChange={e => setFormData({...formData, valor: parseFloat(e.target.value)})} 
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Confirmar Exclusão">
        <div className="space-y-4">
          <p className="text-gray-600">Tem certeza que deseja excluir este custo?</p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setItemToDelete(null)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete}>Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

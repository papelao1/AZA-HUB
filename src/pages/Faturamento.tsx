import React, { useState } from 'react';
import { useAppStore, Faturamento as FaturamentoType } from '../lib/store';
import { Card, Button, Modal, Input, Select, Label } from '../components/ui';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, Trash2 } from 'lucide-react';

export default function Faturamento() {
  const { faturamentos, addFaturamento, removeFaturamento, clientes } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const [formData, setFormData] = useState<Omit<FaturamentoType, 'id'>>({
    data: new Date().toISOString().slice(0, 10),
    descricao: '',
    clienteId: '',
    valor: 0,
    status: 'Recebido'
  });

  const filteredFaturamentos = faturamentos
    .filter(f => f.data.startsWith(filterMonth))
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const totalFaturado = filteredFaturamentos.reduce((acc, curr) => acc + curr.valor, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addFaturamento(formData);
    setIsModalOpen(false);
    setFormData({
      data: new Date().toISOString().slice(0, 10),
      descricao: '',
      clienteId: '',
      valor: 0,
      status: 'Recebido'
    });
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      removeFaturamento(itemToDelete);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Faturamento</h1>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={20} /> Novo Lançamento
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <p className="text-sm text-gray-500 font-medium">Total Faturado no Período</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalFaturado)}</p>
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

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-sm text-gray-500">
                <th className="pb-3 font-medium">Data</th>
                <th className="pb-3 font-medium">Descrição</th>
                <th className="pb-3 font-medium">Cliente</th>
                <th className="pb-3 font-medium text-right">Valor</th>
                <th className="pb-3 font-medium text-center">Status</th>
                <th className="pb-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredFaturamentos.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="py-3 text-gray-900">{formatDate(item.data)}</td>
                  <td className="py-3 text-gray-600">{item.descricao}</td>
                  <td className="py-3 text-gray-900 font-medium">
                    {clientes.find(c => c.id === item.clienteId)?.nome || 'Cliente Excluído'}
                  </td>
                  <td className="py-3 text-right font-medium text-green-600">
                    {formatCurrency(item.valor)}
                  </td>
                  <td className="py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'Recebido' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.status}
                    </span>
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
              {filteredFaturamentos.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Nenhum faturamento encontrado neste período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Lançamento">
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
            <Label>Descrição</Label>
            <Input 
              type="text" 
              required 
              placeholder="Ex: Mensalidade Consultoria"
              value={formData.descricao} 
              onChange={e => setFormData({...formData, descricao: e.target.value})} 
            />
          </div>
          <div>
            <Label>Cliente</Label>
            <Select 
              required 
              value={formData.clienteId} 
              onChange={e => setFormData({...formData, clienteId: e.target.value})}
            >
              <option value="" disabled>Selecione um cliente</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Select>
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
          <div>
            <Label>Status</Label>
            <Select 
              required 
              value={formData.status} 
              onChange={e => setFormData({...formData, status: e.target.value as any})}
            >
              <option value="Recebido">Recebido</option>
              <option value="Pendente">Pendente</option>
            </Select>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Confirmar Exclusão">
        <div className="space-y-4">
          <p className="text-gray-600">Tem certeza que deseja excluir este faturamento?</p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setItemToDelete(null)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete}>Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

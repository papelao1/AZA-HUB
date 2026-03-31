import React, { useState } from 'react';
import { useAppStore, Cliente as ClienteType } from '../lib/store';
import { Card, Button, Modal, Input, Select, Label } from '../components/ui';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, Trash2, Users, TrendingUp, DollarSign } from 'lucide-react';

export default function Clientes() {
  const { clientes, addCliente, removeCliente, faturamentos } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<ClienteType, 'id'>>({
    nome: '',
    servico: '',
    valorMensal: 0,
    status: 'Ativo',
    dataEntrada: new Date().toISOString().slice(0, 10),
  });

  const clientesAtivos = clientes.filter(c => c.status === 'Ativo');
  const mrr = clientesAtivos.reduce((acc, curr) => acc + curr.valorMensal, 0);
  const ticketMedio = clientesAtivos.length > 0 ? mrr / clientesAtivos.length : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCliente(formData);
    setIsModalOpen(false);
    setFormData({
      nome: '',
      servico: '',
      valorMensal: 0,
      status: 'Ativo',
      dataEntrada: new Date().toISOString().slice(0, 10),
    });
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      removeCliente(itemToDelete);
      setItemToDelete(null);
    }
  };

  const getValorTotalInvestido = (clienteId: string) => {
    return faturamentos
      .filter(f => f.clienteId === clienteId && f.status === 'Recebido')
      .reduce((acc, curr) => acc + curr.valor, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={20} /> Novo Cliente
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex items-center space-x-4">
          <div className="p-4 bg-green-100 text-green-600 rounded-xl">
            <Users size={32} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Clientes Ativos</p>
            <p className="text-3xl font-bold text-green-600">{clientesAtivos.length}</p>
          </div>
        </Card>
        <Card className="p-6 flex items-center space-x-4">
          <div className="p-4 bg-green-100 text-green-600 rounded-xl">
            <TrendingUp size={32} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">MRR (Receita Recorrente)</p>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(mrr)}</p>
          </div>
        </Card>
        <Card className="p-6 flex items-center space-x-4">
          <div className="p-4 bg-green-100 text-green-600 rounded-xl">
            <DollarSign size={32} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Ticket Médio</p>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(ticketMedio)}</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-sm text-gray-500">
                <th className="pb-3 font-medium">Nome</th>
                <th className="pb-3 font-medium">Serviço Contratado</th>
                <th className="pb-3 font-medium text-right">Valor Mensal</th>
                <th className="pb-3 font-medium text-right">Total Investido</th>
                <th className="pb-3 font-medium text-center">Status</th>
                <th className="pb-3 font-medium text-center">Entrada</th>
                <th className="pb-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {clientes.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="py-3 text-gray-900 font-medium">{item.nome}</td>
                  <td className="py-3 text-gray-600">{item.servico}</td>
                  <td className="py-3 text-right font-medium text-gray-900">
                    {formatCurrency(item.valorMensal)}
                  </td>
                  <td className="py-3 text-right font-medium text-green-600">
                    {formatCurrency(getValorTotalInvestido(item.id))}
                  </td>
                  <td className="py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 text-center text-gray-500">{formatDate(item.dataEntrada)}</td>
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
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Cliente">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input 
              type="text" 
              required 
              placeholder="Ex: João Silva"
              value={formData.nome} 
              onChange={e => setFormData({...formData, nome: e.target.value})} 
            />
          </div>
          <div>
            <Label>Serviço Contratado</Label>
            <Input 
              type="text" 
              required 
              placeholder="Ex: Consultoria Financeira"
              value={formData.servico} 
              onChange={e => setFormData({...formData, servico: e.target.value})} 
            />
          </div>
          <div>
            <Label>Valor Mensal (R$)</Label>
            <Input 
              type="number" 
              required 
              min="0" 
              step="0.01"
              value={formData.valorMensal || ''} 
              onChange={e => setFormData({...formData, valorMensal: parseFloat(e.target.value)})} 
            />
          </div>
          <div>
            <Label>Data de Entrada</Label>
            <Input 
              type="date" 
              required 
              value={formData.dataEntrada} 
              onChange={e => setFormData({...formData, dataEntrada: e.target.value})} 
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select 
              required 
              value={formData.status} 
              onChange={e => setFormData({...formData, status: e.target.value as any})}
            >
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
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
          <p className="text-gray-600">Tem certeza que deseja excluir este cliente?</p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setItemToDelete(null)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete}>Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

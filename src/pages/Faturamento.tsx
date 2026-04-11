import React, { useState } from 'react';
import { useAppStore, Faturamento as FaturamentoType } from '../lib/store';
import { useAuth } from '../lib/authContext';
import { Card, Button, Modal, Input, Select, Label } from '../components/ui';
import { formatCurrency, formatDate } from '../lib/utils';
import { Plus, Trash2, Clock } from 'lucide-react';

export default function Faturamento() {
  const { faturamentos, addFaturamento, updateFaturamentoStatus, removeFaturamento, clientes } = useAppStore();
  const { session } = useAuth();
  const isAdmin = session?.tag === 'ADMIN';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterTipo, setFilterTipo] = useState<'Todos' | 'Setup' | 'Plano Performance' | 'Produto Front'>('Todos');

  const emptyForm = (): Omit<FaturamentoType, 'id'> => ({
    tipo: isAdmin ? 'Plano Performance' : 'Produto Front',
    mesReferencia: new Date().toISOString().slice(0, 7),
    data: new Date().toISOString().slice(0, 10),
    descricao: '',
    clienteId: '',
    valor: 0,
    status: 'Recebido',
  });

  const [formData, setFormData] = useState<Omit<FaturamentoType, 'id'>>(emptyForm());

  // Não-ADMIN veem só "Produto Front"
  const visibleFaturamentos = isAdmin
    ? faturamentos
    : faturamentos.filter(f => f.tipo === 'Produto Front');

  const filteredFaturamentos = visibleFaturamentos
    .filter(f => f.data.startsWith(filterMonth))
    .filter(f => !isAdmin || filterTipo === 'Todos' || (f.tipo ?? 'Plano Performance') === filterTipo)
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const recebidos = filteredFaturamentos.filter(f => f.status === 'Recebido');
  const pendentes = filteredFaturamentos.filter(f => f.status === 'Pendente');

  const totalFaturado = recebidos.reduce((acc, curr) => acc + curr.valor, 0);
  const totalPendente = pendentes.reduce((acc, curr) => acc + curr.valor, 0);
  const totalSetup = isAdmin
    ? recebidos.filter(f => f.tipo === 'Setup').reduce((acc, curr) => acc + curr.valor, 0)
    : 0;
  const totalPerformance = isAdmin
    ? recebidos.filter(f => (f.tipo ?? 'Plano Performance') === 'Plano Performance').reduce((acc, curr) => acc + curr.valor, 0)
    : 0;
  const totalProdutoFront = isAdmin
    ? recebidos.filter(f => f.tipo === 'Produto Front').reduce((acc, curr) => acc + curr.valor, 0)
    : totalFaturado;

  const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  const formatMesReferencia = (mes?: string) => {
    if (!mes) return '—';
    const [year, month] = mes.split('-');
    return `${MONTH_NAMES[parseInt(month) - 1]}/${year}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (payload.tipo === 'Setup') delete payload.mesReferencia;
    addFaturamento(payload);
    setIsModalOpen(false);
    setFormData(emptyForm());
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      removeFaturamento(itemToDelete);
      setItemToDelete(null);
    }
  };

  const tipoLabel = (tipo?: string) => tipo ?? 'Plano Performance';

  const tipoBadge = (tipo?: string) => {
    if (tipo === 'Setup') return 'bg-blue-100 text-blue-700';
    if (tipo === 'Produto Front') return 'bg-orange-100 text-orange-700';
    return 'bg-purple-100 text-purple-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Faturamento</h1>
        <Button onClick={() => { setFormData(emptyForm()); setIsModalOpen(true); }} className="flex items-center gap-2">
          <Plus size={20} /> Novo Lançamento
        </Button>
      </div>

      {/* Summary Cards */}
      {isAdmin ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-500 font-medium">Total Recebido</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalFaturado)}</p>
          </Card>
          <Card className="p-4 border-l-4 border-yellow-400">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-yellow-500" />
              <p className="text-sm text-gray-500 font-medium">Previsão de Entrada</p>
            </div>
            <p className="text-xl font-bold text-yellow-600">{formatCurrency(totalPendente)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500 font-medium">Setup Recebido</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(totalSetup)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500 font-medium">Performance Recebido</p>
            <p className="text-xl font-bold text-purple-600">{formatCurrency(totalPerformance)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500 font-medium">Produto Front Recebido</p>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(totalProdutoFront)}</p>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-500 font-medium">Total Recebido (Mês)</p>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(totalFaturado)}</p>
          </Card>
          <Card className="p-4 border-l-4 border-yellow-400">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-yellow-500" />
              <p className="text-sm text-gray-500 font-medium">Previsão de Entrada</p>
            </div>
            <p className="text-xl font-bold text-yellow-600">{formatCurrency(totalPendente)}</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100 items-end">
        <div>
          <Label className="mb-1">Mês</Label>
          <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-auto" />
        </div>
        {isAdmin && (
          <div>
            <Label className="mb-1">Tipo</Label>
            <Select value={filterTipo} onChange={e => setFilterTipo(e.target.value as typeof filterTipo)} className="w-auto">
              <option value="Todos">Todos</option>
              <option value="Setup">Setup</option>
              <option value="Plano Performance">Plano Performance</option>
              <option value="Produto Front">Produto Front</option>
            </Select>
          </div>
        )}
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-sm text-gray-500">
                <th className="pb-3 font-medium">Tipo</th>
                {isAdmin && <th className="pb-3 font-medium">Mês Ref.</th>}
                <th className="pb-3 font-medium">Data Receb.</th>
                <th className="pb-3 font-medium">Descrição</th>
                <th className="pb-3 font-medium">Cliente</th>
                <th className="pb-3 font-medium text-right">Valor</th>
                <th className="pb-3 font-medium text-center">Status</th>
                <th className="pb-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredFaturamentos.map(item => (
                <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${tipoBadge(item.tipo)}`}>
                      {tipoLabel(item.tipo)}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-3 text-gray-500 text-xs">
                      {(item.tipo ?? 'Plano Performance') === 'Plano Performance'
                        ? formatMesReferencia(item.mesReferencia)
                        : '—'}
                    </td>
                  )}
                  <td className="py-3 text-gray-900">{formatDate(item.data)}</td>
                  <td className="py-3 text-gray-600">{item.descricao}</td>
                  <td className="py-3 text-gray-900 font-medium">
                    {clientes.find(c => c.id === item.clienteId)?.nome || 'Cliente Excluído'}
                  </td>
                  <td className="py-3 text-right font-medium text-green-600">{formatCurrency(item.valor)}</td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() => updateFaturamentoStatus(item.id, item.status === 'Recebido' ? 'Pendente' : 'Recebido')}
                      title="Clique para alternar status"
                      className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-opacity hover:opacity-70 ${
                        item.status === 'Recebido' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {item.status}
                    </button>
                  </td>
                  <td className="py-3 text-center">
                    <button onClick={() => setItemToDelete(item.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredFaturamentos.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-8 text-center text-gray-500">
                    Nenhum faturamento encontrado neste período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Novo Lançamento */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Lançamento">
        <form onSubmit={handleSubmit} className="space-y-4">
          {isAdmin ? (
            <div>
              <Label>Tipo</Label>
              <Select
                required
                value={formData.tipo}
                onChange={e => setFormData({ ...formData, tipo: e.target.value as FaturamentoType['tipo'] })}
              >
                <option value="Plano Performance">Plano Performance</option>
                <option value="Setup">Setup</option>
                <option value="Produto Front">Produto Front (site)</option>
              </Select>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
              <p className="text-sm font-medium text-orange-700">Tipo: Produto Front (site)</p>
            </div>
          )}

          {isAdmin && formData.tipo === 'Plano Performance' && (
            <div>
              <Label>Mês de Referência</Label>
              <Input
                type="month"
                required
                value={formData.mesReferencia ?? ''}
                onChange={e => setFormData({ ...formData, mesReferencia: e.target.value })}
              />
            </div>
          )}

          <div>
            <Label>Data de Recebimento</Label>
            <Input
              type="date"
              required
              value={formData.data}
              onChange={e => setFormData({ ...formData, data: e.target.value })}
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Input
              type="text"
              required
              placeholder="Ex: Site institucional"
              value={formData.descricao}
              onChange={e => setFormData({ ...formData, descricao: e.target.value })}
            />
          </div>
          <div>
            <Label>Cliente</Label>
            <Select
              required
              value={formData.clienteId}
              onChange={e => setFormData({ ...formData, clienteId: e.target.value })}
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
              onChange={e => setFormData({ ...formData, valor: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select
              required
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as 'Recebido' | 'Pendente' })}
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

      {/* Modal Confirmar Exclusão */}
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

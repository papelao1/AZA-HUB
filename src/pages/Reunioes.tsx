import React, { useState } from 'react';
import { useAppStore, Reuniao } from '../lib/store';
import { useAuth } from '../lib/authContext';
import { Card, Button, Modal, Input, Select, Label } from '../components/ui';
import { Plus, Trash2, Pencil, CalendarDays, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatDate } from '../lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  Agendada: 'bg-blue-100 text-blue-700',
  Realizada: 'bg-green-100 text-green-700',
  'No-show': 'bg-red-100 text-red-600',
  Cancelada: 'bg-gray-100 text-gray-500',
};

const TIPO_COLORS: Record<string, string> = {
  Discovery: 'bg-purple-100 text-purple-700',
  Apresentação: 'bg-indigo-100 text-indigo-700',
  Fechamento: 'bg-green-100 text-green-700',
  Outro: 'bg-gray-100 text-gray-500',
};

const BAR_COLORS = ['#CC0000', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

const EMPTY_FORM: Omit<Reuniao, 'id'> = {
  data: new Date().toISOString().slice(0, 10),
  horario: '09:00',
  sdrId: '',
  prospectNome: '',
  prospectEmpresa: '',
  tipo: 'Discovery',
  status: 'Agendada',
  observacoes: '',
};

export default function Reunioes() {
  const { reunioes, addReuniao, updateReuniao, removeReuniao } = useAppStore();
  const { session, users } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Reuniao, 'id'>>({ ...EMPTY_FORM });

  const [filterSdr, setFilterSdr] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  const canSeeAll = session?.tag === 'ADMIN' || session?.tag === 'GESTOR';
  const sdrUsers = users.filter(u => u.tag === 'SDR' && u.status === 'Ativo');

  // Filter table
  const filteredReunioes = reunioes
    .filter(r => {
      if (!canSeeAll) return r.sdrId === session?.id;
      if (filterSdr) return r.sdrId === filterSdr;
      return true;
    })
    .filter(r => !filterStatus || r.status === filterStatus)
    .filter(r => r.data.startsWith(filterMonth))
    .sort((a, b) => `${b.data} ${b.horario}`.localeCompare(`${a.data} ${a.horario}`));

  // Perf stats (same month filter)
  const perfReunioes = reunioes.filter(r => r.data.startsWith(filterMonth));

  const getSdrName = (id: string) => users.find(u => u.id === id)?.nome ?? id;

  // SDR performance cards — only show relevant SDRs
  const perfSdrs = canSeeAll
    ? users.filter(u => u.tag === 'SDR')
    : users.filter(u => u.id === session?.id);

  const sdrStats = perfSdrs.map(sdr => {
    const mine = perfReunioes.filter(r => r.sdrId === sdr.id);
    const agendadas = mine.length;
    const realizadas = mine.filter(r => r.status === 'Realizada').length;
    const noShows = mine.filter(r => r.status === 'No-show').length;
    const taxa = agendadas > 0 ? Math.round((realizadas / agendadas) * 100) : 0;
    return { id: sdr.id, nome: sdr.nome, agendadas, realizadas, noShows, taxa };
  });

  const rankingSdrs = [...sdrStats].sort((a, b) => b.realizadas - a.realizadas);

  const chartData = rankingSdrs
    .filter(s => s.agendadas > 0)
    .map(s => ({ nome: s.nome.split(' ')[0], realizadas: s.realizadas }));

  // Modal helpers
  const openNew = () => {
    setFormData({ ...EMPTY_FORM, sdrId: session?.tag === 'SDR' ? session.id : '' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (r: Reuniao) => {
    setFormData({
      data: r.data,
      horario: r.horario,
      sdrId: r.sdrId,
      prospectNome: r.prospectNome,
      prospectEmpresa: r.prospectEmpresa,
      tipo: r.tipo,
      status: r.status,
      observacoes: r.observacoes,
    });
    setEditingId(r.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateReuniao(editingId, formData);
    } else {
      await addReuniao(formData);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (deleteId) {
      removeReuniao(deleteId);
      setDeleteId(null);
    }
  };

  const MONTH_NAMES = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];
  const formatMonthLabel = (ym: string) => {
    const [y, m] = ym.split('-');
    return `${MONTH_NAMES[parseInt(m) - 1]}/${y}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Reuniões</h1>
        <Button onClick={openNew} className="flex items-center gap-2">
          <Plus size={20} /> Nova Reunião
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100 items-end">
        <div>
          <Label className="mb-1">Mês</Label>
          <Input
            type="month"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="w-auto"
          />
        </div>
        {canSeeAll && (
          <div>
            <Label className="mb-1">SDR</Label>
            <Select
              value={filterSdr}
              onChange={e => setFilterSdr(e.target.value)}
              className="w-auto"
            >
              <option value="">Todos os SDRs</option>
              {sdrUsers.map(u => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </Select>
          </div>
        )}
        <div>
          <Label className="mb-1">Status</Label>
          <Select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-auto"
          >
            <option value="">Todos</option>
            <option value="Agendada">Agendada</option>
            <option value="Realizada">Realizada</option>
            <option value="No-show">No-show</option>
            <option value="Cancelada">Cancelada</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-sm text-gray-500">
                <th className="pb-3 font-medium">Data</th>
                <th className="pb-3 font-medium">Horário</th>
                {canSeeAll && <th className="pb-3 font-medium">SDR</th>}
                <th className="pb-3 font-medium">Prospect</th>
                <th className="pb-3 font-medium">Empresa</th>
                <th className="pb-3 font-medium">Tipo</th>
                <th className="pb-3 font-medium text-center">Status</th>
                <th className="pb-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredReunioes.map(r => (
                <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="py-3 text-gray-900">{formatDate(r.data)}</td>
                  <td className="py-3 text-gray-600">{r.horario}</td>
                  {canSeeAll && (
                    <td className="py-3 text-gray-900 font-medium">{getSdrName(r.sdrId)}</td>
                  )}
                  <td className="py-3 text-gray-900">{r.prospectNome}</td>
                  <td className="py-3 text-gray-500">{r.prospectEmpresa}</td>
                  <td className="py-3">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      TIPO_COLORS[r.tipo]
                    )}>
                      {r.tipo}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      STATUS_COLORS[r.status]
                    )}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(r)}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteId(r.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        title="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReunioes.length === 0 && (
                <tr>
                  <td colSpan={canSeeAll ? 8 : 7} className="py-8 text-center text-gray-400">
                    Nenhuma reunião encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Performance Panel */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <CalendarDays size={20} className="text-[#CC0000]" />
          Desempenho dos SDRs — {formatMonthLabel(filterMonth)}
        </h2>

        {/* SDR Cards */}
        {sdrStats.length === 0 ? (
          <Card className="p-6 text-center text-gray-400 text-sm">
            Nenhum SDR cadastrado ainda. Adicione usuários com tag SDR no painel Admin.
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sdrStats.map(s => (
              <Card key={s.id} className="p-4 space-y-3">
                <p className="font-semibold text-gray-800">{s.nome}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Agendadas</p>
                    <p className="font-bold text-gray-700">{s.agendadas}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Realizadas</p>
                    <p className="font-bold text-green-600">{s.realizadas}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">No-shows</p>
                    <p className="font-bold text-red-500">{s.noShows}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Taxa</p>
                    <p className={cn(
                      "font-bold",
                      s.taxa >= 70 ? "text-green-600" : s.taxa >= 40 ? "text-yellow-600" : "text-red-500"
                    )}>
                      {s.taxa}%
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Ranking + Chart (only visible when canSeeAll) */}
        {canSeeAll && rankingSdrs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ranking */}
            <Card>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Trophy size={18} className="text-yellow-500" />
                Ranking — Reuniões Realizadas
              </h3>
              <div className="space-y-2">
                {rankingSdrs.map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                    <span className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      idx === 0 ? "bg-yellow-100 text-yellow-700" :
                      idx === 1 ? "bg-gray-100 text-gray-600" :
                      idx === 2 ? "bg-orange-100 text-orange-600" :
                      "bg-gray-50 text-gray-400"
                    )}>
                      {idx + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-gray-800">{s.nome}</span>
                    <span className="text-sm font-bold text-green-600">{s.realizadas}</span>
                    <span className="text-xs text-gray-400">realizadas</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Bar Chart */}
            <Card className="h-[300px] flex flex-col">
              <h3 className="font-semibold text-gray-800 mb-4">
                Reuniões Realizadas por SDR
              </h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} allowDecimals={false} />
                    <Tooltip formatter={(v: number) => [`${v} reuniões`, 'Realizadas']} />
                    <Bar dataKey="realizadas" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* New / Edit Reunião Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Reunião' : 'Nova Reunião'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                required
                value={formData.data}
                onChange={e => setFormData({ ...formData, data: e.target.value })}
              />
            </div>
            <div>
              <Label>Horário</Label>
              <Input
                type="time"
                required
                value={formData.horario}
                onChange={e => setFormData({ ...formData, horario: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>SDR Responsável</Label>
            <Select
              required
              value={formData.sdrId}
              onChange={e => setFormData({ ...formData, sdrId: e.target.value })}
            >
              <option value="" disabled>Selecione o SDR</option>
              {sdrUsers.length === 0 ? (
                <option disabled>Nenhum SDR cadastrado</option>
              ) : (
                sdrUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))
              )}
              {/* Also allow self-selection for non-SDR who creates meeting */}
              {!sdrUsers.find(u => u.id === session?.id) && session && (
                <option value={session.id}>{session.nome} (você)</option>
              )}
            </Select>
          </div>
          <div>
            <Label>Nome do Prospect</Label>
            <Input
              type="text"
              required
              placeholder="Ex: João Silva"
              value={formData.prospectNome}
              onChange={e => setFormData({ ...formData, prospectNome: e.target.value })}
            />
          </div>
          <div>
            <Label>Empresa do Prospect</Label>
            <Input
              type="text"
              required
              placeholder="Ex: Empresa XYZ"
              value={formData.prospectEmpresa}
              onChange={e => setFormData({ ...formData, prospectEmpresa: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select
                required
                value={formData.tipo}
                onChange={e => setFormData({ ...formData, tipo: e.target.value as Reuniao['tipo'] })}
              >
                <option value="Discovery">Discovery</option>
                <option value="Apresentação">Apresentação</option>
                <option value="Fechamento">Fechamento</option>
                <option value="Outro">Outro</option>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                required
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as Reuniao['status'] })}
              >
                <option value="Agendada">Agendada</option>
                <option value="Realizada">Realizada</option>
                <option value="No-show">No-show</option>
                <option value="Cancelada">Cancelada</option>
              </Select>
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Input
              type="text"
              placeholder="Observações opcionais"
              value={formData.observacoes}
              onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">{editingId ? 'Salvar' : 'Criar Reunião'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar Exclusão">
        <div className="space-y-4">
          <p className="text-gray-600">Tem certeza que deseja excluir esta reunião?</p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete}>Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

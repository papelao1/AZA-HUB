import React, { useState } from 'react';
import { useAppStore, Tarefa } from '../lib/store';
import { useAuth } from '../lib/authContext';
import { Card, Button, Modal, Input, Select, Label } from '../components/ui';
import { Plus, Trash2, AlertCircle, Clock, CheckCircle2, RefreshCw, Target } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatDate } from '../lib/utils';

type KanbanStatus = 'Aberta' | 'Em andamento' | 'Finalizada';

const PRIORITY_BADGE: Record<string, string> = {
  Alta: 'bg-red-100 text-red-700',
  Média: 'bg-yellow-100 text-yellow-700',
  Baixa: 'bg-gray-100 text-gray-500',
};

const AVATAR_COLORS = [
  'bg-red-400', 'bg-blue-400', 'bg-green-400',
  'bg-purple-400', 'bg-orange-400', 'bg-pink-400',
];

function getAvatarColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(nome: string) {
  return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const EMPTY_FORM = {
  titulo: '',
  descricao: '',
  responsavelId: '',
  prioridade: 'Média' as 'Alta' | 'Média' | 'Baixa',
  dataLimite: '',
  tipo: 'Pontual' as 'Pontual' | 'Recorrente',
  frequencia: 'Diária' as 'Diária' | 'Semanal' | 'Mensal',
  meta: '',
  status: 'Aberta' as KanbanStatus,
};

export default function Tarefas() {
  const { tarefas, addTarefa, updateTarefaStatus, removeTarefa } = useAppStore();
  const { session, users } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<KanbanStatus | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  const canManage = session?.tag === 'ADMIN' || session?.tag === 'GESTOR';

  // Filter tasks by role
  const visibleTarefas = tarefas.filter(t => {
    if (canManage) return true;
    return t.responsavelId === session?.id;
  });

  const columns: { status: KanbanStatus; label: string; bg: string; border: string; icon: React.ReactNode }[] = [
    {
      status: 'Aberta',
      label: 'Abertas',
      bg: 'bg-red-50',
      border: 'border-red-100',
      icon: <AlertCircle size={16} className="text-red-400" />,
    },
    {
      status: 'Em andamento',
      label: 'Em Andamento',
      bg: 'bg-yellow-50',
      border: 'border-yellow-100',
      icon: <Clock size={16} className="text-yellow-400" />,
    },
    {
      status: 'Finalizada',
      label: 'Finalizadas',
      bg: 'bg-green-50',
      border: 'border-green-100',
      icon: <CheckCircle2 size={16} className="text-green-400" />,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Omit<Tarefa, 'id'> = {
      titulo: formData.titulo,
      descricao: formData.descricao,
      responsavelId: formData.responsavelId || session?.id || '',
      prioridade: formData.prioridade,
      dataLimite: formData.dataLimite,
      tipo: formData.tipo,
      status: formData.status,
      criadaEm: new Date().toISOString(),
      concluida: false,
      ...(formData.tipo === 'Recorrente' && {
        frequencia: formData.frequencia,
        meta: formData.meta,
      }),
    };
    await addTarefa(payload);
    setIsModalOpen(false);
    setFormData({ ...EMPTY_FORM });
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: KanbanStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) updateTarefaStatus(taskId, newStatus);
    setDragOverCol(null);
  };

  const handleDragOver = (e: React.DragEvent, col: KanbanStatus) => {
    e.preventDefault();
    setDragOverCol(col);
  };

  const getUserName = (id?: string) => {
    if (!id) return null;
    return users.find(u => u.id === id)?.nome ?? null;
  };

  return (
    <div className="space-y-6 flex flex-col flex-1">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Tarefas</h1>
        {canManage && (
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus size={20} /> Nova Tarefa
          </Button>
        )}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {columns.map(col => {
          const cards = visibleTarefas.filter(t => (t.status ?? 'Aberta') === col.status);
          const isDragOver = dragOverCol === col.status;

          return (
            <div
              key={col.status}
              className={cn(
                'rounded-xl border-2 transition-colors flex flex-col min-h-[300px]',
                col.bg, col.border,
                isDragOver && 'ring-2 ring-[#CC0000]/30 ring-offset-1'
              )}
              onDragOver={e => handleDragOver(e, col.status)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={e => handleDrop(e, col.status)}
            >
              {/* Column Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-current/10">
                {col.icon}
                <span className="font-semibold text-gray-700 text-sm">{col.label}</span>
                <span className="ml-auto bg-white/70 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                {cards.length === 0 && (
                  <div className="text-center text-gray-400 text-xs py-8">
                    Nenhuma tarefa aqui
                  </div>
                )}
                {cards.map(tarefa => {
                  const responsavelNome = getUserName(tarefa.responsavelId);
                  const isOverdue = tarefa.dataLimite && new Date(tarefa.dataLimite) < new Date() && col.status !== 'Finalizada';

                  return (
                    <div
                      key={tarefa.id}
                      draggable
                      onDragStart={e => handleDragStart(e, tarefa.id)}
                      className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                    >
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-medium text-gray-900 text-sm leading-snug flex-1">
                          {tarefa.titulo}
                        </p>
                        {canManage && (
                          <button
                            onClick={() => setDeleteId(tarefa.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors shrink-0 mt-0.5"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* Description */}
                      {tarefa.descricao && (
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{tarefa.descricao}</p>
                      )}

                      {/* Recorrente badge + meta */}
                      {tarefa.tipo === 'Recorrente' && (
                        <div className="flex items-center gap-1 mb-2">
                          <span className="flex items-center gap-1 bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                            <RefreshCw size={10} />
                            {tarefa.frequencia ?? 'Recorrente'}
                          </span>
                          {tarefa.meta && (
                            <span className="flex items-center gap-1 bg-gray-50 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                              <Target size={10} />
                              {tarefa.meta}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer row */}
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        {/* Avatar */}
                        {responsavelNome && (
                          <div
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0',
                              getAvatarColor(tarefa.responsavelId ?? '')
                            )}
                            title={responsavelNome}
                          >
                            {getInitials(responsavelNome)}
                          </div>
                        )}

                        {/* Priority */}
                        {tarefa.prioridade && (
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            PRIORITY_BADGE[tarefa.prioridade]
                          )}>
                            {tarefa.prioridade}
                          </span>
                        )}

                        {/* Due date */}
                        {tarefa.dataLimite && (
                          <span className={cn(
                            'text-xs ml-auto',
                            isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'
                          )}>
                            {formatDate(tarefa.dataLimite)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Tarefa">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input
              type="text"
              required
              placeholder="Título da tarefa"
              value={formData.titulo}
              onChange={e => setFormData({ ...formData, titulo: e.target.value })}
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Input
              type="text"
              placeholder="Descrição breve (opcional)"
              value={formData.descricao}
              onChange={e => setFormData({ ...formData, descricao: e.target.value })}
            />
          </div>
          <div>
            <Label>Atribuir para</Label>
            <Select
              value={formData.responsavelId}
              onChange={e => setFormData({ ...formData, responsavelId: e.target.value })}
            >
              <option value="">— Sem responsável —</option>
              {users.filter(u => u.status === 'Ativo').map(u => (
                <option key={u.id} value={u.id}>{u.nome} ({u.tag})</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prioridade</Label>
              <Select
                value={formData.prioridade}
                onChange={e => setFormData({ ...formData, prioridade: e.target.value as 'Alta' | 'Média' | 'Baixa' })}
              >
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </Select>
            </div>
            <div>
              <Label>Status inicial</Label>
              <Select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as KanbanStatus })}
              >
                <option value="Aberta">Aberta</option>
                <option value="Em andamento">Em andamento</option>
              </Select>
            </div>
          </div>
          <div>
            <Label>Data limite</Label>
            <Input
              type="date"
              value={formData.dataLimite}
              onChange={e => setFormData({ ...formData, dataLimite: e.target.value })}
            />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select
              value={formData.tipo}
              onChange={e => setFormData({ ...formData, tipo: e.target.value as 'Pontual' | 'Recorrente' })}
            >
              <option value="Pontual">Pontual</option>
              <option value="Recorrente">Recorrente</option>
            </Select>
          </div>
          {formData.tipo === 'Recorrente' && (
            <>
              <div>
                <Label>Frequência</Label>
                <Select
                  value={formData.frequencia}
                  onChange={e => setFormData({ ...formData, frequencia: e.target.value as 'Diária' | 'Semanal' | 'Mensal' })}
                >
                  <option value="Diária">Diária</option>
                  <option value="Semanal">Semanal</option>
                  <option value="Mensal">Mensal</option>
                </Select>
              </div>
              <div>
                <Label>Meta (ex: 5 leads/dia)</Label>
                <Input
                  type="text"
                  placeholder="Ex: 5 leads/dia"
                  value={formData.meta}
                  onChange={e => setFormData({ ...formData, meta: e.target.value })}
                />
              </div>
            </>
          )}
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Criar Tarefa</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar Exclusão">
        <div className="space-y-4">
          <p className="text-gray-600">Tem certeza que deseja excluir esta tarefa?</p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="danger" onClick={() => { if (deleteId) removeTarefa(deleteId); setDeleteId(null); }}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

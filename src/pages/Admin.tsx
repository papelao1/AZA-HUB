import React, { useState } from 'react';
import { useAuth } from '../lib/authContext';
import { UserRecord, UserTag, TAG_COLORS } from '../lib/authUsers';
import { Card, Button, Modal, Input, Select, Label } from '../components/ui';
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

const EMPTY_FORM: Omit<UserRecord, 'id'> = {
  nome: '',
  username: '',
  password: '',
  tag: 'GESTOR',
  status: 'Ativo',
};

export default function Admin() {
  const { users, addUser, updateUser, deleteUser, session } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<UserRecord, 'id'>>(EMPTY_FORM);

  const openNew = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (user: UserRecord) => {
    setFormData({
      nome: user.nome,
      username: user.username,
      password: user.password,
      tag: user.tag,
      status: user.status,
    });
    setEditingId(user.id);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateUser(editingId, formData);
    } else {
      addUser(formData);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteUser(deleteId);
      setDeleteId(null);
    }
  };

  const TAG_LABELS: Record<UserTag, string> = {
    ADMIN: 'Admin',
    GESTOR: 'Gestor',
    SDR: 'SDR',
    FINANCEIRO: 'Financeiro',
    COMERCIAL: 'Comercial',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck size={28} className="text-[#CC0000]" />
          <h1 className="text-2xl font-bold text-gray-900">Painel Admin</h1>
        </div>
        <Button onClick={openNew} className="flex items-center gap-2">
          <Plus size={20} /> Novo Usuário
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-sm text-gray-500">
                <th className="pb-3 font-medium">Nome</th>
                <th className="pb-3 font-medium">Usuário</th>
                <th className="pb-3 font-medium">Tag</th>
                <th className="pb-3 font-medium text-center">Status</th>
                <th className="pb-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {users.map(user => (
                <tr key={user.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">
                    {user.nome}
                    {user.id === session?.id && (
                      <span className="ml-2 text-xs text-gray-400">(você)</span>
                    )}
                  </td>
                  <td className="py-3 text-gray-600">@{user.username}</td>
                  <td className="py-3">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-semibold',
                      TAG_COLORS[user.tag]
                    )}>
                      {TAG_LABELS[user.tag]}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      user.status === 'Ativo'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    )}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(user)}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(user.id)}
                        disabled={user.id === session?.id}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={user.id === session?.id ? 'Não é possível excluir a si mesmo' : 'Excluir'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Usuário' : 'Novo Usuário'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome completo</Label>
            <Input
              type="text"
              required
              placeholder="Ex: João Silva"
              value={formData.nome}
              onChange={e => setFormData({ ...formData, nome: e.target.value })}
            />
          </div>
          <div>
            <Label>Nome de usuário</Label>
            <Input
              type="text"
              required
              placeholder="Ex: joao.silva"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
            />
          </div>
          <div>
            <Label>Senha</Label>
            <Input
              type="text"
              required={!editingId}
              placeholder={editingId ? 'Deixe em branco para não alterar' : 'Defina uma senha'}
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div>
            <Label>Tag / Perfil</Label>
            <Select
              required
              value={formData.tag}
              onChange={e => setFormData({ ...formData, tag: e.target.value as UserTag })}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="GESTOR">GESTOR</option>
              <option value="SDR">SDR</option>
              <option value="FINANCEIRO">FINANCEIRO</option>
              <option value="COMERCIAL">COMERCIAL</option>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select
              required
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as 'Ativo' | 'Inativo' })}
            >
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </Select>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingId ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmar Exclusão">
        <div className="space-y-4">
          <p className="text-gray-600">
            Tem certeza que deseja excluir o usuário{' '}
            <strong>{users.find(u => u.id === deleteId)?.nome}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete}>Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

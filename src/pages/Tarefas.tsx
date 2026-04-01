import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Card, Button, Input } from '../components/ui';
import { CheckCircle2, Circle, Trash2, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Tarefas() {
  const { tarefas, addTarefa, toggleTarefa, removeTarefa } = useAppStore();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [showForm, setShowForm] = useState(false);

  const pendentes = tarefas
    .filter(t => !t.concluida)
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));

  const concluidas = tarefas
    .filter(t => t.concluida)
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    await addTarefa({
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      concluida: false,
      criadaEm: new Date().toISOString(),
    });
    setTitulo('');
    setDescricao('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tarefas</h1>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
          <Plus size={18} />
          Nova Tarefa
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleAdd} className="space-y-3">
            <Input
              placeholder="Título da tarefa"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              autoFocus
            />
            <Input
              placeholder="Descrição (opcional)"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!titulo.trim()}>
                Adicionar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Pendentes ({pendentes.length})
        </h2>
        {pendentes.length === 0 ? (
          <Card className="p-6 text-center text-gray-400 text-sm">
            Nenhuma tarefa pendente. Bom trabalho!
          </Card>
        ) : (
          pendentes.map(tarefa => (
            <Card key={tarefa.id} className="p-4 flex items-start gap-3">
              <button
                onClick={() => toggleTarefa(tarefa.id, true)}
                className="mt-0.5 text-gray-300 hover:text-[#CC0000] transition-colors shrink-0"
              >
                <Circle size={22} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{tarefa.titulo}</p>
                {tarefa.descricao && (
                  <p className="text-sm text-gray-500 mt-0.5">{tarefa.descricao}</p>
                )}
              </div>
              <button
                onClick={() => removeTarefa(tarefa.id)}
                className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
              >
                <Trash2 size={18} />
              </button>
            </Card>
          ))
        )}
      </div>

      {concluidas.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Concluídas ({concluidas.length})
          </h2>
          {concluidas.map(tarefa => (
            <Card key={tarefa.id} className="p-4 flex items-start gap-3 opacity-60">
              <button
                onClick={() => toggleTarefa(tarefa.id, false)}
                className="mt-0.5 text-[#CC0000] hover:text-gray-400 transition-colors shrink-0"
              >
                <CheckCircle2 size={22} />
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn("font-medium text-gray-900 line-through")}>{tarefa.titulo}</p>
                {tarefa.descricao && (
                  <p className="text-sm text-gray-400 mt-0.5 line-through">{tarefa.descricao}</p>
                )}
              </div>
              <button
                onClick={() => removeTarefa(tarefa.id)}
                className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
              >
                <Trash2 size={18} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

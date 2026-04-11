import React, { useState } from 'react';
import { useAuth } from '../lib/authContext';
import { Card, Button, Input, Label, Modal } from '../components/ui';

export default function Login() {
  const { login, users, usersLoading, updateUser, session } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot password modal
  const [showForgot, setShowForgot] = useState(false);
  const [fpStep, setFpStep] = useState<'username' | 'reset'>('username');
  const [fpUsername, setFpUsername] = useState('');
  const [fpNew, setFpNew] = useState('');
  const [fpConfirm, setFpConfirm] = useState('');
  const [fpError, setFpError] = useState<string | null>(null);
  const [fpSuccess, setFpSuccess] = useState(false);
  const [fpSaving, setFpSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);
    if (result === 'error') {
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } else if (!result) {
      setError('Usuário ou senha incorretos, ou conta inativa.');
    }
  };

  const openForgot = () => {
    setFpStep('username');
    setFpUsername('');
    setFpNew('');
    setFpConfirm('');
    setFpError(null);
    setFpSuccess(false);
    setShowForgot(true);
  };

  const handleFpNext = (e: React.FormEvent) => {
    e.preventDefault();
    setFpError(null);
    const found = users.find(u => u.username === fpUsername.trim() && u.status === 'Ativo');
    if (!found) {
      setFpError('Usuário não encontrado ou inativo.');
      return;
    }
    setFpStep('reset');
  };

  const handleFpReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpError(null);
    if (fpNew.length < 4) {
      setFpError('A senha deve ter ao menos 4 caracteres.');
      return;
    }
    if (fpNew !== fpConfirm) {
      setFpError('As senhas não coincidem.');
      return;
    }
    setFpSaving(true);
    const target = users.find(u => u.username === fpUsername.trim());
    if (target) {
      await updateUser(target.id, { password: fpNew });
    }
    setFpSaving(false);
    setFpSuccess(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 space-y-6">
        <div className="flex flex-col items-center text-center">
          <img
            src="https://squarecrop.onrender.com/image/nENlioz9FTOhyWzwMORe.webp"
            alt="AZA Logo"
            className="w-20 h-20 rounded-full object-cover mb-4 shadow-sm"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-[#CC0000]">AZA</span>
            <span className="text-gray-700">PerformanceHub</span>
          </h1>
          <p className="text-gray-500 text-sm">Entre com suas credenciais para acessar o sistema.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {usersLoading ? (
          <div className="text-center py-4 text-gray-400 text-sm">
            Carregando sistema...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Usuário</Label>
              <Input
                type="text"
                required
                placeholder="Seu usuário"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <Label>Senha</Label>
              <Input
                type="password"
                required
                placeholder="Sua senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full py-3">
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        )}

        {!usersLoading && (
          <div className="text-center">
            <button
              type="button"
              onClick={openForgot}
              className="text-sm text-[#CC0000] hover:underline"
            >
              Esqueci minha senha
            </button>
          </div>
        )}
      </Card>

      {/* Forgot Password Modal */}
      <Modal isOpen={showForgot} onClose={() => setShowForgot(false)} title="Esqueci minha senha">
        {fpSuccess ? (
          <div className="space-y-4">
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm text-center">
              Senha alterada com sucesso! Faça login com a nova senha.
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowForgot(false)}>Fechar</Button>
            </div>
          </div>
        ) : fpStep === 'username' ? (
          <form onSubmit={handleFpNext} className="space-y-4">
            <p className="text-sm text-gray-500">Digite seu nome de usuário para redefinir a senha.</p>
            <div>
              <Label>Usuário</Label>
              <Input
                type="text"
                required
                placeholder="Seu usuário"
                value={fpUsername}
                onChange={e => setFpUsername(e.target.value)}
                autoFocus
              />
            </div>
            {fpError && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{fpError}</div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowForgot(false)}>Cancelar</Button>
              <Button type="submit">Continuar</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleFpReset} className="space-y-4">
            <p className="text-sm text-gray-500">
              Definindo nova senha para <strong>@{fpUsername}</strong>.
            </p>
            <div>
              <Label>Nova senha</Label>
              <Input
                type="password"
                required
                placeholder="Mínimo 4 caracteres"
                value={fpNew}
                onChange={e => setFpNew(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <Label>Confirmar nova senha</Label>
              <Input
                type="password"
                required
                placeholder="Repita a nova senha"
                value={fpConfirm}
                onChange={e => setFpConfirm(e.target.value)}
              />
            </div>
            {fpError && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{fpError}</div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setFpStep('username')}>Voltar</Button>
              <Button type="submit" disabled={fpSaving}>
                {fpSaving ? 'Salvando...' : 'Salvar Senha'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

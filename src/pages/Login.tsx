import React, { useState } from 'react';
import { useAuth } from '../lib/authContext';
import { Card, Button, Input, Label } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const ok = await login(username.trim(), password);
    setLoading(false);
    if (!ok) setError('Usuário ou senha incorretos, ou conta inativa.');
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
      </Card>
    </div>
  );
}

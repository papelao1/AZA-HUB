import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Card, Button, Input } from '../components/ui';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import Groq from 'groq-sdk';

export default function AzaIA() {
  const { addFaturamento, addCusto, addDespesa, addCliente, clientes } = useAppStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Olá! Sou a AZA IA. Como posso ajudar você a registrar suas finanças hoje? Exemplo: "Hoje eu recebi 2000 da cliente bruna"' }
  ]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, dangerouslyAllowBrowser: true });
      // Create a prompt that includes the current clients so the AI can match names to IDs
      const clientesList = clientes.map(c => `ID: ${c.id}, Nome: ${c.nome}`).join('\n');
      
      const systemInstruction = `
        Você é um assistente financeiro inteligente. Sua tarefa é extrair informações de transações financeiras do texto do usuário e chamar a função apropriada para registrar a transação.
        
        Lista de clientes cadastrados atualmente:
        ${clientesList || 'Nenhum cliente cadastrado ainda.'}
        
        Regras:
        - Se for um recebimento/faturamento, use a função registrarFaturamento. Tente encontrar o ID do cliente na lista acima pelo nome. Se não encontrar, use um ID vazio ou peça para o usuário cadastrar o cliente primeiro.
        - Se for um custo (relacionado à operação/produto), use a função registrarCusto.
        - Se for uma despesa (fixa/administrativa), use a função registrarDespesa.
        - Se o usuário pedir para cadastrar um novo cliente, use a função registrarCliente.
        - A data deve ser no formato YYYY-MM-DD. Se o usuário disser "hoje", use a data atual: ${new Date().toISOString().slice(0, 10)}.
      `;

      const tools: any[] = [
        {
          type: "function",
          function: {
            name: 'registrarCliente',
            description: 'Cadastra um novo cliente na base de dados.',
            parameters: {
              type: 'object',
              properties: {
                nome: { type: 'string', description: 'Nome do cliente' },
                servico: { type: 'string', description: 'Nicho ou serviço prestado (ex: advogada, consultoria)' },
                valorMensal: { type: 'number', description: 'Valor da recorrência mensal' },
                dataEntrada: { type: 'string', description: 'Data de entrada no formato YYYY-MM-DD' },
                valorEntrada: { type: 'number', description: 'Valor pago de entrada (se houver). Se não houver, envie 0.' }
              },
              required: ['nome', 'servico', 'valorMensal', 'dataEntrada']
            }
          }
        },
        {
          type: "function",
          function: {
            name: 'registrarFaturamento',
            description: 'Registra um novo faturamento ou recebimento de um cliente.',
            parameters: {
              type: 'object',
              properties: {
                data: { type: 'string', description: 'Data no formato YYYY-MM-DD' },
                descricao: { type: 'string', description: 'Descrição do faturamento' },
                clienteId: { type: 'string', description: 'ID do cliente (busque na lista fornecida)' },
                valor: { type: 'number', description: 'Valor numérico' },
                status: { type: 'string', description: 'Recebido ou Pendente' }
              },
              required: ['data', 'descricao', 'clienteId', 'valor', 'status']
            }
          }
        },
        {
          type: "function",
          function: {
            name: 'registrarCusto',
            description: 'Registra um novo custo variável (Operacional, Produto, Marketing, Pessoal, Outro).',
            parameters: {
              type: 'object',
              properties: {
                data: { type: 'string', description: 'Data no formato YYYY-MM-DD' },
                categoria: { type: 'string', description: 'Uma das categorias: Operacional, Produto, Marketing, Pessoal, Outro' },
                descricao: { type: 'string', description: 'Descrição do custo' },
                valor: { type: 'number', description: 'Valor numérico' }
              },
              required: ['data', 'categoria', 'descricao', 'valor']
            }
          }
        },
        {
          type: "function",
          function: {
            name: 'registrarDespesa',
            description: 'Registra uma nova despesa fixa (Aluguel, Internet, Software, Contador, Outros).',
            parameters: {
              type: 'object',
              properties: {
                data: { type: 'string', description: 'Data no formato YYYY-MM-DD' },
                categoria: { type: 'string', description: 'Uma das categorias: Aluguel, Internet, Software, Contador, Outros' },
                descricao: { type: 'string', description: 'Descrição da despesa' },
                valor: { type: 'number', description: 'Valor numérico' }
              },
              required: ['data', 'categoria', 'descricao', 'valor']
            }
          }
        }
      ];

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userText }
        ],
        tools: tools,
        tool_choice: 'auto'
      });

      const responseMessage = response.choices[0].message;
      const toolCalls = responseMessage.tool_calls;
      
      if (toolCalls && toolCalls.length > 0) {
        const call = toolCalls[0];
        const args = JSON.parse(call.function.arguments);
        
        if (call.function.name === 'registrarFaturamento') {
          if (!args.clienteId) {
            setMessages(prev => [...prev, { role: 'ai', text: 'Não consegui identificar o cliente. Por favor, certifique-se de que ele está cadastrado na aba Clientes.' }]);
          } else {
            await addFaturamento({
              data: args.data,
              descricao: args.descricao,
              clienteId: args.clienteId,
              valor: args.valor,
              status: args.status as 'Recebido' | 'Pendente'
            });
            setMessages(prev => [...prev, { role: 'ai', text: `✅ Faturamento de R$ ${args.valor} registrado com sucesso para o cliente!` }]);
          }
        } else if (call.function.name === 'registrarCusto') {
          await addCusto({
            data: args.data,
            categoria: args.categoria as any,
            descricao: args.descricao,
            valor: args.valor
          });
          setMessages(prev => [...prev, { role: 'ai', text: `✅ Custo de R$ ${args.valor} (${args.categoria}) registrado com sucesso!` }]);
        } else if (call.function.name === 'registrarDespesa') {
          await addDespesa({
            data: args.data,
            categoria: args.categoria as any,
            descricao: args.descricao,
            valor: args.valor
          });
          setMessages(prev => [...prev, { role: 'ai', text: `✅ Despesa de R$ ${args.valor} (${args.categoria}) registrada com sucesso!` }]);
        } else if (call.function.name === 'registrarCliente') {
          const clienteId = await addCliente({
            nome: args.nome,
            servico: args.servico,
            valorMensal: args.valorMensal,
            status: 'Ativo',
            dataEntrada: args.dataEntrada
          });
          
          if (clienteId && args.valorEntrada && args.valorEntrada > 0) {
            await addFaturamento({
              data: args.dataEntrada,
              descricao: `Entrada - ${args.nome}`,
              clienteId: clienteId,
              valor: args.valorEntrada,
              status: 'Recebido'
            });
            setMessages(prev => [...prev, { role: 'ai', text: `✅ Cliente ${args.nome} cadastrado(a) com sucesso! Recorrência de R$ ${args.valorMensal} e entrada de R$ ${args.valorEntrada} registrada.` }]);
          } else {
            setMessages(prev => [...prev, { role: 'ai', text: `✅ Cliente ${args.nome} cadastrado(a) com sucesso! Recorrência de R$ ${args.valorMensal}.` }]);
          }
        }
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: responseMessage.content || 'Não entendi muito bem. Pode reformular informando o valor, o que foi e, se for recebimento, de qual cliente?' }]);
      }

    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'ai', text: 'Desculpe, ocorreu um erro ao processar sua solicitação.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 flex-1 flex flex-col">
      <div className="flex items-center gap-3 shrink-0">
        <img 
          src="https://squarecrop.onrender.com/image/nENlioz9FTOhyWzwMORe.webp" 
          alt="AZA IA" 
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shadow-sm" 
          referrerPolicy="no-referrer"
        />
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">AZA IA</h1>
      </div>

      <Card className="flex-1 flex flex-col min-h-0 p-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user' 
                  ? 'bg-[#CC0000] text-white rounded-tr-none' 
                  : 'bg-gray-100 text-gray-800 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Pensando...
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex: Hoje eu recebi 2000 da cliente bruna..."
              className="flex-1 bg-white"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()} className="px-4">
              <Send size={20} />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

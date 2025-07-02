import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Search, Info } from 'lucide-react'; // Ícone 'Info' adicionado
import { Entregador, Cliente } from '../types';
import { useModal } from '../hooks/useModal';

type FormaPagamento = 'Dinheiro' | 'Pix' | 'Cartão de Débito' | 'Cartão de Crédito';

interface NovaEntregaProps {
  entregadores: Entregador[];
  clientes: Cliente[];
  onSalvar: (entrega: {
    numeroPedido: string;
    clienteId: number;
    clienteNovo?: {
      nome: string;
      ruaNumero: string;
      bairro: string;
      telefone?: string;
    };
    entregadorId: number;
    formaPagamento: FormaPagamento;
    valorTotalPedido: number;
    valorCorrida: number;
  }) => void;
  onFechar: () => void;
}

export const NovaEntrega: React.FC<NovaEntregaProps> = ({
  entregadores,
  clientes,
  onSalvar,
  onFechar
}) => {
  const [numeroPedido, setNumeroPedido] = useState('');
  const [buscaCliente, setBuscaCliente] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [ruaNumero, setRuaNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [telefone, setTelefone] = useState('');
  const [entregadorId, setEntregadorId] = useState<number | ''>('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('Dinheiro');
  const [valorTotalPedido, setValorTotalPedido] = useState<number | ''>('');
  const [valorCorrida, setValorCorrida] = useState<number | ''>('');
  
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
  const inputClienteRef = useRef<HTMLInputElement>(null);

  const { showAlert } = useModal();

  useEffect(() => {
    if (buscaCliente && !clienteSelecionado) {
      const filtrados = clientes.filter(cliente =>
        cliente.nome.toLowerCase().includes(buscaCliente.toLowerCase())
      );
      setClientesFiltrados(filtrados);
      setMostrarSugestoes(true);
    } else {
      setMostrarSugestoes(false);
    }
  }, [buscaCliente, clientes, clienteSelecionado]);

  const handleSelecionarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setBuscaCliente(cliente.nome);
    setRuaNumero(cliente.ruaNumero);
    setBairro(cliente.bairro);
    setTelefone(cliente.telefone || '');
    setMostrarSugestoes(false);
    inputClienteRef.current?.focus();
  };

  const handleBuscaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBuscaCliente(e.target.value);
    if (clienteSelecionado) {
      setClienteSelecionado(null);
      setRuaNumero('');
      setBairro('');
      setTelefone('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!numeroPedido || !buscaCliente || !ruaNumero || !bairro || !entregadorId || !valorTotalPedido || !valorCorrida) {
      showAlert('Campos Obrigatórios', 'Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }

    let entregaPayload: Parameters<typeof onSalvar>[0];

    if (clienteSelecionado && clienteSelecionado.nome === buscaCliente) {
      entregaPayload = {
        numeroPedido,
        clienteId: clienteSelecionado.id,
        entregadorId: Number(entregadorId),
        formaPagamento,
        valorTotalPedido: Number(valorTotalPedido),
        valorCorrida: Number(valorCorrida)
      };
    } else {
      entregaPayload = {
        numeroPedido,
        clienteId: -1,
        clienteNovo: {
          nome: buscaCliente,
          ruaNumero,
          bairro,
          telefone: telefone || undefined
        },
        entregadorId: Number(entregadorId),
        formaPagamento,
        valorTotalPedido: Number(valorTotalPedido),
        valorCorrida: Number(valorCorrida)
      };
    }

    onSalvar(entregaPayload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white">
            Registrar Nova Entrega
          </h2>
          <button onClick={onFechar} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Número do Pedido *</label>
            <input type="text" value={numeroPedido} onChange={(e) => setNumeroPedido(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white" required />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-2">Cliente *</label>
            <div className="relative">
              <input
                ref={inputClienteRef}
                type="text"
                value={buscaCliente}
                onChange={handleBuscaChange}
                className={`w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white ${clienteSelecionado ? 'bg-green-800 border-green-600' : ''}`}
                placeholder="Digite para buscar ou cadastrar um novo cliente..."
                required
              />
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {/* ===== AVISO DE NOVO CADASTRO ===== */}
            {buscaCliente && !clienteSelecionado && (
              <div className="mt-2 p-2 bg-blue-900 bg-opacity-50 border border-blue-700 rounded-md flex items-center gap-2">
                <Info size={16} className="text-blue-400 flex-shrink-0" />
                <p className="text-sm text-blue-300">
                  Um novo cliente será criado com o nome: <strong>{buscaCliente}</strong>
                </p>
              </div>
            )}
            
            {mostrarSugestoes && clientesFiltrados.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {clientesFiltrados.map((cliente) => (
                  <div key={cliente.id} onClick={() => handleSelecionarCliente(cliente)} className="p-3 cursor-pointer hover:bg-gray-600">
                    <p className="text-white">{cliente.nome}</p>
                    <p className="text-sm text-gray-400">{cliente.ruaNumero}, {cliente.bairro}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Rua e Número *</label>
              <input type="text" value={ruaNumero} onChange={(e) => setRuaNumero(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Bairro *</label>
              <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Telefone (Opcional)</label>
            <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Entregador *</label>
            <select value={entregadorId} onChange={(e) => setEntregadorId(Number(e.target.value))} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white" required>
              <option value="">Selecione um entregador</option>
              {entregadores.map((entregador) => (<option key={entregador.id} value={entregador.id}>{entregador.nome}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Forma de Pagamento</label>
            <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
              <option>Dinheiro</option>
              <option>Pix</option>
              <option>Cartão de Débito</option>
              <option>Cartão de Crédito</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Valor Total do Pedido (R$) *</label>
              <input type="number" step="0.01" value={valorTotalPedido} onChange={(e) => setValorTotalPedido(Number(e.target.value))} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Valor da Corrida (R$) *</label>
              <input type="number" step="0.01" value={valorCorrida} onChange={(e) => setValorCorrida(Number(e.target.value))} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white" required />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <button type="button" onClick={onFechar} className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium"><Save size={16} className="inline mr-2" />Registrar Entrega</button>
          </div>
        </form>
      </div>
    </div>
  );
};
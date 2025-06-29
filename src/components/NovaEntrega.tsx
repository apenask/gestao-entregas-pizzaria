import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Search, User, MapPin, DollarSign } from 'lucide-react';
import { Entregador, Cliente } from '../types';
import { Modal, useModal } from './Modal';

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
    formaPagamento: 'Dinheiro' | 'Pix' | 'Cartão de Débito' | 'Cartão de Crédito';
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
  const [formaPagamento, setFormaPagamento] = useState<'Dinheiro' | 'Pix' | 'Cartão de Débito' | 'Cartão de Crédito'>('Dinheiro');
  const [valorTotalPedido, setValorTotalPedido] = useState<number | ''>('');
  const [valorCorrida, setValorCorrida] = useState<number | ''>('');
  const [valorCorridaFormatado, setValorCorridaFormatado] = useState('');
  
  // Estados para autocomplete
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
  const [indiceSelecionado, setIndiceSelecionado] = useState(-1);
  
  const inputClienteRef = useRef<HTMLInputElement>(null);
  const sugestoesRef = useRef<HTMLDivElement>(null);

  const { modalState, showAlert, closeModal } = useModal();

  // Filtrar clientes baseado na busca - APENAS INÍCIO DO NOME
  useEffect(() => {
    if (buscaCliente.length >= 1) {
      const filtrados = clientes.filter(cliente =>
        cliente.nome.toLowerCase().startsWith(buscaCliente.toLowerCase())
      );
      setClientesFiltrados(filtrados);
      setMostrarSugestoes(filtrados.length > 0);
      setIndiceSelecionado(-1);
    } else {
      setMostrarSugestoes(false);
      setClientesFiltrados([]);
    }
  }, [buscaCliente, clientes]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sugestoesRef.current && 
        !sugestoesRef.current.contains(event.target as Node) &&
        !inputClienteRef.current?.contains(event.target as Node)
      ) {
        setMostrarSugestoes(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelecionarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setBuscaCliente(cliente.nome);
    setRuaNumero(cliente.ruaNumero);
    setBairro(cliente.bairro);
    setTelefone(cliente.telefone || '');
    setMostrarSugestoes(false);
  };

  const handleBuscaClienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setBuscaCliente(valor);
    
    // Se o usuário está editando, limpar cliente selecionado
    if (clienteSelecionado && valor !== clienteSelecionado.nome) {
      setClienteSelecionado(null);
      setRuaNumero('');
      setBairro('');
      setTelefone('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!mostrarSugestoes || clientesFiltrados.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIndiceSelecionado(prev => 
          prev < clientesFiltrados.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setIndiceSelecionado(prev => 
          prev > 0 ? prev - 1 : clientesFiltrados.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (indiceSelecionado >= 0) {
          handleSelecionarCliente(clientesFiltrados[indiceSelecionado]);
        }
        break;
      case 'Escape':
        setMostrarSugestoes(false);
        setIndiceSelecionado(-1);
        break;
    }
  };

  // Função para formatar valor como moeda
  const formatarMoeda = (valor: string): string => {
    // Remove tudo que não é número
    const apenasNumeros = valor.replace(/\D/g, '');
    
    if (!apenasNumeros) return '';
    
    // Converte para número e divide por 100 para ter centavos
    const numero = parseInt(apenasNumeros) / 100;
    
    // Formata como moeda brasileira
    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Função para extrair valor numérico da string formatada
  const extrairValorNumerico = (valorFormatado: string): number => {
    if (!valorFormatado) return 0;
    
    // Remove R$, espaços e substitui vírgula por ponto
    const numeroLimpo = valorFormatado
      .replace(/R\$\s?/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    
    return parseFloat(numeroLimpo) || 0;
  };

  const handleValorCorridaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    const valorFormatado = formatarMoeda(valor);
    const valorNumerico = extrairValorNumerico(valorFormatado);
    
    setValorCorridaFormatado(valorFormatado);
    setValorCorrida(valorNumerico);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!numeroPedido || !buscaCliente || !ruaNumero || !bairro || !entregadorId || !valorTotalPedido || !valorCorrida) {
      showAlert('Campos Obrigatórios', 'Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }

    if (valorCorrida <= 0) {
      showAlert('Valor Inválido', 'O valor da corrida deve ser maior que zero.', 'error');
      return;
    }

    if (clienteSelecionado) {
      // Cliente existente
      onSalvar({
        numeroPedido,
        clienteId: clienteSelecionado.id,
        entregadorId: Number(entregadorId),
        formaPagamento,
        valorTotalPedido: Number(valorTotalPedido),
        valorCorrida: Number(valorCorrida)
      });
    } else {
      // Cliente novo
      onSalvar({
        numeroPedido,
        clienteId: -1, // Indica que é um cliente novo
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
      });
    }

    // Reset form
    setNumeroPedido('');
    setBuscaCliente('');
    setClienteSelecionado(null);
    setRuaNumero('');
    setBairro('');
    setTelefone('');
    setEntregadorId('');
    setFormaPagamento('Dinheiro');
    setValorTotalPedido('');
    setValorCorrida('');
    setValorCorridaFormatado('');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white">
              Registrar Nova Entrega
            </h2>
            <button
              onClick={onFechar}
              className="text-gray-400 hover:text-white transition-colors duration-200 p-1"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Número do Pedido *
              </label>
              <input
                type="text"
                value={numeroPedido}
                onChange={(e) => setNumeroPedido(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Ex: 001, A123, etc."
                required
              />
            </div>

            {/* Campo de busca de cliente com autocomplete */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome do Cliente *
              </label>
              <div className="relative">
                <input
                  ref={inputClienteRef}
                  type="text"
                  value={buscaCliente}
                  onChange={handleBuscaClienteChange}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Digite o nome do cliente"
                  required
                />
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                
                {clienteSelecionado && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <User size={18} className="text-green-400" />
                  </div>
                )}
              </div>

              {/* Lista de sugestões */}
              {mostrarSugestoes && (
                <div 
                  ref={sugestoesRef}
                  className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  {clientesFiltrados.map((cliente, index) => (
                    <div
                      key={cliente.id}
                      onClick={() => handleSelecionarCliente(cliente)}
                      className={`px-4 py-3 cursor-pointer transition-colors duration-200 border-b border-gray-600 last:border-b-0 ${
                        index === indiceSelecionado
                          ? 'bg-red-600 text-white'
                          : 'hover:bg-gray-650 text-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <User size={16} className="text-gray-400 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{cliente.nome}</p>
                          <p className="text-sm text-gray-400 truncate">
                            {cliente.ruaNumero}, {cliente.bairro}
                          </p>
                          {cliente.telefone && (
                            <p className="text-xs text-gray-500">{cliente.telefone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Indicador de cliente novo */}
              {buscaCliente.length >= 1 && !clienteSelecionado && !mostrarSugestoes && (
                <div className="mt-2 p-2 bg-blue-900 bg-opacity-30 border border-blue-600 rounded-md">
                  <p className="text-sm text-blue-300 flex items-center gap-2">
                    <User size={16} />
                    Cliente novo será cadastrado: <strong>{buscaCliente}</strong>
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rua e Número *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={ruaNumero}
                    onChange={(e) => setRuaNumero(e.target.value)}
                    className={`w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      clienteSelecionado ? 'bg-gray-650' : ''
                    }`}
                    placeholder="Ex: Rua das Flores, 123"
                    required
                  />
                  <MapPin size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bairro *
                </label>
                <input
                  type="text"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    clienteSelecionado ? 'bg-gray-650' : ''
                  }`}
                  placeholder="Ex: Centro"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Telefone (Opcional)
              </label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Ex: (11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Entregador *
              </label>
              <select
                value={entregadorId}
                onChange={(e) => setEntregadorId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              >
                <option value="">Selecione um entregador</option>
                {entregadores.map((entregador) => (
                  <option key={entregador.id} value={entregador.id}>
                    {entregador.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Forma de Pagamento
              </label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="Dinheiro">Dinheiro</option>
                <option value="Pix">Pix</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Valor Total do Pedido (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorTotalPedido}
                  onChange={(e) => setValorTotalPedido(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Ex: 35.50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Valor da Corrida (R$) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={valorCorridaFormatado}
                    onChange={handleValorCorridaChange}
                    className="w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Ex: R$ 6,00"
                    required
                  />
                  <DollarSign size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Digite qualquer valor (ex: 5, 6.50, 8, 10)
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={onFechar}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium flex items-center justify-center gap-2 transition-colors duration-200"
              >
                <Save size={16} />
                Salvar Entrega
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Global */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        isDestructive={modalState.isDestructive}
      />
    </>
  );
};
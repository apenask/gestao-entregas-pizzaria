import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Search, User, MapPin, DollarSign } from 'lucide-react';
import { Entrega, Entregador, Cliente } from '../types';
import { Modal } from './Modal';
import { useModal } from '../hooks/useModal';

// Tipo para forma de pagamento
type FormaPagamento = 'Dinheiro' | 'Pix' | 'Cartão de Débito' | 'Cartão de Crédito';

interface EditarEntregaProps {
  entrega: Entrega;
  entregadores: Entregador[];
  clientes: Cliente[];
  onSalvar: (entregaEditada: Entrega) => void;
  onFechar: () => void;
}

export const EditarEntrega: React.FC<EditarEntregaProps> = ({
  entrega,
  entregadores,
  clientes,
  onSalvar,
  onFechar
}) => {
  const [numeroPedido, setNumeroPedido] = useState(entrega.numeroPedido);
  const [buscaCliente, setBuscaCliente] = useState(entrega.cliente?.nome || '');
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(entrega.cliente || null);
  const [ruaNumero, setRuaNumero] = useState(entrega.cliente?.ruaNumero || '');
  const [bairro, setBairro] = useState(entrega.cliente?.bairro || '');
  const [telefone, setTelefone] = useState(entrega.cliente?.telefone || '');
  const [entregadorId, setEntregadorId] = useState<number>(entrega.entregadorId);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>(entrega.formaPagamento);
  const [valorTotalPedido, setValorTotalPedido] = useState<number>(entrega.valorTotalPedido);
  const [valorCorrida, setValorCorrida] = useState<number>(entrega.valorCorrida);
  const [valorCorridaFormatado, setValorCorridaFormatado] = useState('');
  const [status, setStatus] = useState<'Aguardando' | 'Em Rota' | 'Entregue' | 'Cancelado'>(entrega.status);

  // Estados para autocomplete
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
  const [indiceSelecionado, setIndiceSelecionado] = useState(-1);
  
  const inputClienteRef = useRef<HTMLInputElement>(null);
  const sugestoesRef = useRef<HTMLDivElement>(null);

  const { modalState, showAlert, closeModal } = useModal();

  // Inicializar valor formatado da corrida
  useEffect(() => {
    if (entrega.valorCorrida) {
      const valorFormatado = entrega.valorCorrida.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
      setValorCorridaFormatado(valorFormatado);
    }
  }, [entrega.valorCorrida]);

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
    
    // Se o usuário está editando, limpar cliente selecionado se não for o mesmo
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

    // Criar objeto entrega editada
    const entregaEditada: Entrega = {
      ...entrega,
      numeroPedido,
      clienteId: clienteSelecionado?.id || entrega.clienteId,
      cliente: {
        id: clienteSelecionado?.id || entrega.clienteId,
        nome: buscaCliente,
        ruaNumero,
        bairro,
        telefone: telefone || undefined
      },
      entregadorId,
      formaPagamento,
      valorTotalPedido,
      valorCorrida,
      status
    };

    onSalvar(entregaEditada);
    showAlert('Entrega Atualizada', 'Entrega foi atualizada com sucesso!', 'success');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white">
              Editar Entrega #{entrega.numeroPedido}
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

            {/* Campo Cliente com Autocomplete */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cliente *
              </label>
              <div className="relative">
                <input
                  ref={inputClienteRef}
                  type="text"
                  value={buscaCliente}
                  onChange={handleBuscaClienteChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => buscaCliente.length >= 1 && setMostrarSugestoes(clientesFiltrados.length > 0)}
                  className={`w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    clienteSelecionado ? 'bg-green-800 border-green-600' : ''
                  }`}
                  placeholder="Digite o nome do cliente..."
                  required
                />
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              {/* Sugestões de Clientes */}
              {mostrarSugestoes && (
                <div 
                  ref={sugestoesRef}
                  className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  {clientesFiltrados.map((cliente, index) => (
                    <div
                      key={cliente.id}
                      onClick={() => handleSelecionarCliente(cliente)}
                      className={`p-3 cursor-pointer hover:bg-gray-600 border-b border-gray-600 last:border-b-0 ${
                        index === indiceSelecionado ? 'bg-gray-600' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <User size={14} className="text-gray-400" />
                        <span className="text-white font-medium">{cliente.nome}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <MapPin size={12} className="text-gray-400" />
                        <span>{cliente.ruaNumero}, {cliente.bairro}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Endereço */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rua e Número *
                </label>
                <input
                  type="text"
                  value={ruaNumero}
                  onChange={(e) => setRuaNumero(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Ex: Rua A, 123"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bairro *
                </label>
                <input
                  type="text"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                onChange={(e) => setEntregadorId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              >
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
                onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
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
                  onChange={(e) => setValorTotalPedido(Number(e.target.value))}
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
                    placeholder="R$ 0,00"
                    required
                  />
                  <DollarSign size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Aguardando' | 'Em Rota' | 'Entregue' | 'Cancelado')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="Aguardando">Aguardando</option>
                <option value="Em Rota">Em Rota</option>
                <option value="Entregue">Entregue</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <button
                type="button"
                onClick={onFechar}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors duration-200 text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium flex items-center justify-center gap-2 transition-colors duration-200 text-sm sm:text-base"
              >
                <Save size={16} />
                Salvar Alterações
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
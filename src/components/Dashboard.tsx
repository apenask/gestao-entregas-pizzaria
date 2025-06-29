import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Clock, User, MapPin, Hash, DollarSign, Users, List, CheckCircle, Edit2, Trash2, Phone, Timer, Watch as Stopwatch } from 'lucide-react';
import { Entrega, Entregador, Cliente } from '../types';
import { formatarHora, formatarValor, formatarDataHora, formatarDuracaoSegundos } from '../utils/calculations';
import { Modal, useModal } from './Modal';

interface DashboardProps {
  entregas: Entrega[];
  entregadores: Entregador[];
  clientes: Cliente[];
  onNovaEntrega: () => void;
  onAtualizarStatus: (id: number, status: 'Em Rota' | 'Entregue' | 'Cancelado', dataHora?: Date) => void;
  onEditarEntrega: (entrega: Entrega) => void;
  onExcluirEntrega: (id: number) => void;
}

type ModoVisualizacao = 'geral' | 'por-entregador' | 'finalizadas';

export const Dashboard: React.FC<DashboardProps> = ({ 
  entregas, 
  entregadores,
  clientes,
  onNovaEntrega, 
  onAtualizarStatus,
  onEditarEntrega,
  onExcluirEntrega
}) => {
  const [modoVisualizacao, setModoVisualizacao] = useState<ModoVisualizacao>('geral');
  const [entregadorAtivoId, setEntregadorAtivoId] = useState<number | null>(null);
  const [entregadorFiltroFinalizadas, setEntregadorFiltroFinalizadas] = useState<number | ''>('');
  const [horaAtual, setHoraAtual] = useState(new Date());
  
  const { modalState, showConfirm, closeModal } = useModal();

  // Atualizar hora a cada segundo para cronômetros
  useEffect(() => {
    const interval = setInterval(() => {
      setHoraAtual(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const entregasACaminho = entregas.filter(e => e.status === 'Aguardando' || e.status === 'Em Rota');
  const entregasFinalizadas = entregas.filter(e => e.status === 'Entregue' || e.status === 'Cancelado');

  // Agrupar entregas por entregador
  const entregasPorEntregador = useMemo(() => {
    const grupos: { [key: number]: Entrega[] } = {};
    
    entregasACaminho.forEach(entrega => {
      if (!grupos[entrega.entregadorId]) {
        grupos[entrega.entregadorId] = [];
      }
      grupos[entrega.entregadorId].push(entrega);
    });
    
    return grupos;
  }, [entregasACaminho]);

  // Filtrar entregas finalizadas por entregador
  const entregasFinalizadasFiltradas = useMemo(() => {
    let entregas = entregasFinalizadas;
    
    if (entregadorFiltroFinalizadas) {
      entregas = entregas.filter(e => e.entregadorId === entregadorFiltroFinalizadas);
    }
    
    // Ordenar da mais recente para a mais antiga
    return entregas.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
  }, [entregasFinalizadas, entregadorFiltroFinalizadas]);

  // Entregadores que têm entregas ativas
  const entregadoresAtivos = entregadores.filter(entregador => 
    entregasPorEntregador[entregador.id]?.length > 0
  );

  // Definir entregador ativo inicial quando mudar para visualização por entregador
  React.useEffect(() => {
    if (modoVisualizacao === 'por-entregador' && entregadoresAtivos.length > 0 && !entregadorAtivoId) {
      setEntregadorAtivoId(entregadoresAtivos[0].id);
    }
  }, [modoVisualizacao, entregadoresAtivos, entregadorAtivoId]);

  const calcularTempoEmRota = (dataSaida: Date): string => {
    const diffMs = horaAtual.getTime() - dataSaida.getTime();
    const diffMinutos = Math.floor(diffMs / 60000);
    const horas = Math.floor(diffMinutos / 60);
    const minutos = diffMinutos % 60;
    
    if (horas > 0) {
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
    }
    return `${minutos.toString().padStart(2, '0')}:${Math.floor((diffMs % 60000) / 1000).toString().padStart(2, '0')}`;
  };

  const handleExcluirComConfirmacao = (entrega: Entrega) => {
    const message = `Tem certeza que deseja excluir esta entrega?\n\nPedido: #${entrega.numeroPedido}\nCliente: ${entrega.cliente?.nome}\nEntregador: ${entrega.entregador}\n\nEsta ação não pode ser desfeita.`;
    
    showConfirm(
      'Confirmar Exclusão',
      message,
      () => onExcluirEntrega(entrega.id),
      {
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        isDestructive: true
      }
    );
  };

  const renderEntregaCard = (entrega: Entrega) => {
    const totalACobrar = entrega.valorTotalPedido + entrega.valorCorrida;
    
    return (
      <div
        key={entrega.id}
        className="bg-gray-750 border border-gray-650 rounded-lg p-4 hover:bg-gray-720 transition-colors duration-200"
      >
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            {/* Cabeçalhos das informações */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                  Pedido
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Hash size={16} className="text-blue-500 flex-shrink-0" />
                  <span className="font-bold text-red-400 truncate">
                    {entrega.numeroPedido}
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                  Cliente
                </p>
                <div className="flex items-center justify-center gap-2">
                  <User size={16} className="text-green-500 flex-shrink-0" />
                  <span className="font-medium text-white truncate">
                    {entrega.cliente?.nome}
                  </span>
                </div>
              </div>
              
              {modoVisualizacao === 'geral' && (
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                    Entregador
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <MapPin size={16} className="text-purple-500 flex-shrink-0" />
                    <span className="text-gray-300 truncate">
                      {entrega.entregador}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                  {entrega.status === 'Em Rota' && entrega.dataHoraSaida ? 'Tempo em Rota' : 'Horário'}
                </p>
                <div className="flex items-center justify-center gap-2">
                  {entrega.status === 'Em Rota' && entrega.dataHoraSaida ? (
                    <>
                      <Timer size={16} className="text-red-500 flex-shrink-0" />
                      <span className="text-red-400 font-mono font-bold">
                        {calcularTempoEmRota(entrega.dataHoraSaida)}
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock size={16} className="text-blue-400 flex-shrink-0" />
                      <span className="text-gray-300">
                        {formatarHora(entrega.dataHora)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Status da entrega */}
            {entrega.status !== 'Entregue' && (
              <div className="flex justify-center">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  entrega.status === 'Aguardando' 
                    ? 'bg-yellow-900 bg-opacity-30 border border-yellow-600 text-yellow-400'
                    : 'bg-blue-900 bg-opacity-30 border border-blue-600 text-blue-400'
                }`}>
                  {entrega.status}
                </div>
              </div>
            )}
            
            {/* Endereço e Telefone */}
            <div className="bg-gray-800 rounded-md p-3">
              <p className="text-sm text-gray-300">
                <span className="font-medium text-white">Endereço:</span> {entrega.cliente?.ruaNumero}, {entrega.cliente?.bairro}
              </p>
              {entrega.cliente?.telefone && (
                <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                  <Phone size={14} />
                  <span className="font-medium text-gray-300">Telefone:</span> {entrega.cliente.telefone}
                </p>
              )}
              <p className="text-sm text-gray-400 mt-1">
                <span className="font-medium text-gray-300">Pagamento:</span> {entrega.formaPagamento}
              </p>
            </div>

            {/* Seção Financeira Destacada */}
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center justify-between sm:flex-col sm:items-start">
                  <span className="text-sm font-medium text-gray-300">Pedido:</span>
                  <span className="text-sm font-semibold text-white">
                    {formatarValor(entrega.valorTotalPedido)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between sm:flex-col sm:items-start">
                  <span className="text-sm font-medium text-gray-300">Corrida:</span>
                  <span className="text-sm font-semibold text-red-400">
                    {formatarValor(entrega.valorCorrida)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between sm:flex-col sm:items-start border-t sm:border-t-0 sm:border-l border-gray-600 pt-3 sm:pt-0 sm:pl-3">
                  <span className="text-base font-bold text-white flex items-center gap-1">
                    <DollarSign size={16} className="text-green-400" />
                    Total a Cobrar:
                  </span>
                  <span className="text-lg font-bold text-green-400">
                    {formatarValor(totalACobrar)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Botões de ação */}
          <div className="flex lg:flex-col gap-2 lg:min-w-[120px]">
            <button
              onClick={() => onAtualizarStatus(entrega.id, 'Entregue', new Date())}
              className="flex-1 lg:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors duration-200 whitespace-nowrap"
            >
              Entregue
            </button>
            <button
              onClick={() => onAtualizarStatus(entrega.id, 'Cancelado')}
              className="flex-1 lg:flex-none bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors duration-200 whitespace-nowrap"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEntregaFinalizadaCard = (entrega: Entrega) => {
    const totalACobrar = entrega.valorTotalPedido + entrega.valorCorrida;
    const isEntregue = entrega.status === 'Entregue';
    
    // CORREÇÃO: Usar duração salva em segundos em vez de calcular
    const tempoEntrega = formatarDuracaoSegundos(entrega.duracaoEntrega);
    
    return (
      <div
        key={entrega.id}
        className="bg-gray-750 border border-gray-650 rounded-lg p-4 hover:bg-gray-720 transition-colors duration-200"
      >
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            {/* Cabeçalhos das informações */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                  Pedido
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Hash size={16} className="text-blue-500 flex-shrink-0" />
                  <span className="font-bold text-red-400 truncate">
                    {entrega.numeroPedido}
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                  Cliente
                </p>
                <div className="flex items-center justify-center gap-2">
                  <User size={16} className="text-green-500 flex-shrink-0" />
                  <span className="font-medium text-white truncate">
                    {entrega.cliente?.nome}
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                  Entregador
                </p>
                <div className="flex items-center justify-center gap-2">
                  <MapPin size={16} className="text-purple-500 flex-shrink-0" />
                  <span className="text-gray-300 truncate">
                    {entrega.entregador}
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                  Data e Hora
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Clock size={16} className="text-blue-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">
                    {formatarDataHora(entrega.dataHora)}
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                  Status
                </p>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle size={16} className={isEntregue ? "text-green-500" : "text-red-500"} />
                  <span className={`font-medium ${isEntregue ? "text-green-400" : "text-red-400"}`}>
                    {entrega.status}
                  </span>
                </div>
              </div>

              {/* CORREÇÃO: Nova coluna com duração salva em segundos */}
              <div className="text-center">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                  Tempo de Entrega
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Stopwatch size={16} className={isEntregue ? "text-orange-500" : "text-gray-500"} />
                  <span className={`font-medium ${isEntregue ? "text-orange-400" : "text-gray-500"}`}>
                    {isEntregue ? tempoEntrega : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Endereço e Telefone */}
            <div className="bg-gray-800 rounded-md p-3">
              <p className="text-sm text-gray-300">
                <span className="font-medium text-white">Endereço:</span> {entrega.cliente?.ruaNumero}, {entrega.cliente?.bairro}
              </p>
              {entrega.cliente?.telefone && (
                <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                  <Phone size={14} />
                  <span className="font-medium text-gray-300">Telefone:</span> {entrega.cliente.telefone}
                </p>
              )}
              <p className="text-sm text-gray-400 mt-1">
                <span className="font-medium text-gray-300">Pagamento:</span> {entrega.formaPagamento}
              </p>
            </div>

            {/* Seção Financeira Destacada */}
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center justify-between sm:flex-col sm:items-start">
                  <span className="text-sm font-medium text-gray-300">Pedido:</span>
                  <span className="text-sm font-semibold text-white">
                    {formatarValor(entrega.valorTotalPedido)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between sm:flex-col sm:items-start">
                  <span className="text-sm font-medium text-gray-300">Corrida:</span>
                  <span className="text-sm font-semibold text-red-400">
                    {formatarValor(entrega.valorCorrida)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between sm:flex-col sm:items-start border-t sm:border-t-0 sm:border-l border-gray-600 pt-3 sm:pt-0 sm:pl-3">
                  <span className="text-base font-bold text-white flex items-center gap-1">
                    <DollarSign size={16} className="text-green-400" />
                    Total Cobrado:
                  </span>
                  <span className="text-lg font-bold text-green-400">
                    {formatarValor(totalACobrar)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Botões de ação */}
          <div className="flex lg:flex-col gap-2 lg:min-w-[120px]">
            <button
              onClick={() => onEditarEntrega(entrega)}
              className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors duration-200 whitespace-nowrap flex items-center justify-center gap-2"
            >
              <Edit2 size={16} />
              Editar
            </button>
            <button
              onClick={() => handleExcluirComConfirmacao(entrega)}
              className="flex-1 lg:flex-none bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded text-sm font-medium transition-colors duration-200 whitespace-nowrap flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Excluir
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderVisaoGeral = () => (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
      <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Clock size={20} className="text-red-500" />
        Entregas A Caminho ({entregasACaminho.length})
      </h2>
      
      {entregasACaminho.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          Nenhuma entrega em andamento no momento
        </p>
      ) : (
        <div className="space-y-4">
          {entregasACaminho.map(renderEntregaCard)}
        </div>
      )}
    </div>
  );

  const renderVisaoPorEntregador = () => {
    if (entregadoresAtivos.length === 0) {
      return (
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
          <p className="text-gray-400 text-center py-8">
            Nenhuma entrega em andamento no momento
          </p>
        </div>
      );
    }

    const entregadorAtivo = entregadores.find(e => e.id === entregadorAtivoId);
    const entregasDoEntregador = entregasPorEntregador[entregadorAtivoId || 0] || [];

    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        {/* Abas dos Entregadores */}
        <div className="border-b border-gray-700">
          <div className="flex flex-wrap gap-1 p-2">
            {entregadoresAtivos.map((entregador) => {
              const qtdEntregas = entregasPorEntregador[entregador.id]?.length || 0;
              const isAtivo = entregadorAtivoId === entregador.id;
              
              return (
                <button
                  key={entregador.id}
                  onClick={() => setEntregadorAtivoId(entregador.id)}
                  className={`px-3 py-2 rounded-md font-medium transition-colors duration-200 flex items-center gap-2 text-sm ${
                    isAtivo
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <User size={16} />
                  <span className="hidden sm:inline">{entregador.nome}</span>
                  <span className="sm:hidden">{entregador.nome.split(' ')[0]}</span>
                  <span className="bg-gray-900 text-white text-xs px-2 py-1 rounded-full">
                    {qtdEntregas}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo da Aba Ativa */}
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <User size={20} className="text-red-500" />
            Entregas de {entregadorAtivo?.nome} ({entregasDoEntregador.length})
          </h2>
          
          {entregasDoEntregador.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Nenhuma entrega em andamento para este entregador
            </p>
          ) : (
            <div className="space-y-4">
              {entregasDoEntregador.map(renderEntregaCard)}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEntregasFinalizadas = () => (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Cabeçalho com filtro */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
            <CheckCircle size={20} className="text-red-500" />
            Entregas Finalizadas ({entregasFinalizadasFiltradas.length})
          </h2>
          
          {/* Filtro por entregador */}
          <div className="w-full sm:w-auto">
            <select
              value={entregadorFiltroFinalizadas}
              onChange={(e) => setEntregadorFiltroFinalizadas(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full sm:w-auto px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Todos os Entregadores</option>
              {entregadores.map((entregador) => (
                <option key={entregador.id} value={entregador.id}>
                  {entregador.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de entregas finalizadas */}
      <div className="p-4 sm:p-6">
        {entregasFinalizadasFiltradas.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            Nenhuma entrega finalizada encontrada
          </p>
        ) : (
          <div className="space-y-4">
            {entregasFinalizadasFiltradas.map(renderEntregaFinalizadaCard)}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Painel de Controle de Entregas
        </h1>
        <button
          onClick={onNovaEntrega}
          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors duration-200 shadow-lg"
        >
          <Plus size={20} />
          <span className="sm:inline">Registrar Nova Entrega</span>
        </button>
      </div>

      {/* Botões de Controle de Visualização */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setModoVisualizacao('geral')}
          className={`flex-1 sm:flex-none px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
            modoVisualizacao === 'geral'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
          }`}
        >
          <List size={18} />
          Visão Geral
        </button>
        <button
          onClick={() => setModoVisualizacao('por-entregador')}
          className={`flex-1 sm:flex-none px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
            modoVisualizacao === 'por-entregador'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
          }`}
        >
          <Users size={18} />
          Por Entregador
        </button>
        <button
          onClick={() => setModoVisualizacao('finalizadas')}
          className={`flex-1 sm:flex-none px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
            modoVisualizacao === 'finalizadas'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
          }`}
        >
          <CheckCircle size={18} />
          Entregas Finalizadas
        </button>
      </div>

      {/* Conteúdo Principal */}
      <div className="w-full">
        {modoVisualizacao === 'geral' && renderVisaoGeral()}
        {modoVisualizacao === 'por-entregador' && renderVisaoPorEntregador()}
        {modoVisualizacao === 'finalizadas' && renderEntregasFinalizadas()}
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
    </div>
  );
};
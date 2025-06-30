import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Clock, User, MapPin, Hash, DollarSign, Users, List, CheckCircle, Edit2, Trash2, Phone, Timer, Watch as Stopwatch } from 'lucide-react';
import { Entrega, Entregador, Cliente } from '../types';
import { formatarHora, formatarValor, formatarDataHora, formatarDuracaoLegivel } from '../utils/calculations';
import { Modal } from './Modal';
import { useModal } from '../hooks/useModal';

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

  // TIMER CORRIGIDO - Problema 3
  useEffect(() => {
    console.log('🚀 Iniciando timer do Dashboard');
    const interval = setInterval(() => {
      const agora = new Date();
      console.log('⏰ Timer tick Dashboard:', agora.toLocaleTimeString('pt-BR'));
      setHoraAtual(agora);
    }, 1000);

    return () => {
      console.log('🛑 Parando timer do Dashboard');
      clearInterval(interval);
    };
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

  // TIMER CORRIGIDO usando horaAtual atualizada - Problema 3
  const calcularTempoEmRota = (dataSaida: Date): string => {
    const agora = horaAtual; // Usar horaAtual que é atualizada a cada segundo
    const saida = new Date(dataSaida);
    
    // Debug logs
    console.log('🕐 Calculando tempo Dashboard:', {
      agora: agora.toLocaleString('pt-BR'),
      saida: saida.toLocaleString('pt-BR'),
      saidaTimestamp: saida.getTime(),
      agoraTimestamp: agora.getTime()
    });
    
    // Verificar se as datas são válidas
    if (isNaN(saida.getTime()) || isNaN(agora.getTime())) {
      console.log('❌ Datas inválidas no Dashboard');
      return '00:00:00';
    }
    
    const diffMs = agora.getTime() - saida.getTime();
    
    // Se a diferença for negativa, retornar 00:00:00
    if (diffMs < 0) {
      console.log('❌ Diferença negativa no Dashboard:', diffMs);
      return '00:00:00';
    }
    
    const totalSegundos = Math.floor(diffMs / 1000);
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;
    
    // Sempre mostrar hh:mm:ss
    const resultado = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    
    console.log('✅ Tempo calculado Dashboard:', resultado);
    return resultado;
  };

  const handleExcluirComConfirmacao = (entrega: Entrega) => {
    showConfirm(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir a entrega #${entrega.numeroPedido}?`,
      () => onExcluirEntrega(entrega.id)
    );
  };

  const renderEntregaCard = (entrega: Entrega) => {
    const cliente = clientes.find(c => c.id === entrega.clienteId);
    const entregador = entregadores.find(e => e.id === entrega.entregadorId);

    return (
      <div key={entrega.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Informações principais */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Hash size={16} className="text-blue-400" />
                <span className="font-medium text-white">#{entrega.numeroPedido}</span>
              </div>
              
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                entrega.status === 'Aguardando' ? 'bg-yellow-600 text-yellow-100' :
                entrega.status === 'Em Rota' ? 'bg-blue-600 text-blue-100' :
                entrega.status === 'Entregue' ? 'bg-green-600 text-green-100' :
                'bg-red-600 text-red-100'
              }`}>
                {entrega.status}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <span className="text-gray-300 text-sm">{cliente?.nome || 'Cliente não encontrado'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                <span className="text-gray-300 text-sm">{cliente?.ruaNumero}, {cliente?.bairro}</span>
              </div>

              {cliente?.telefone && (
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-gray-400" />
                  <span className="text-gray-300 text-sm">{cliente.telefone}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <span className="text-gray-300 text-sm">Entregador: {entregador?.nome}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-green-400" />
                <span className="text-green-300 text-sm">
                  Pedido: {formatarValor(entrega.valorTotalPedido)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-blue-400" />
                <span className="text-blue-300 text-sm">
                  Corrida: {formatarValor(entrega.valorCorrida)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <span className="text-gray-300 text-sm">
                  {formatarHora(entrega.dataHora)}
                </span>
              </div>
            </div>

            {/* Timer para entregas em rota - CORRIGIDO */}
            {entrega.status === 'Em Rota' && entrega.dataHoraSaida && (
              <div className="flex items-center gap-2 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-2">
                <Timer size={16} className="text-yellow-400" />
                <span className="text-yellow-300 text-sm font-mono">
                  Tempo em rota: {calcularTempoEmRota(entrega.dataHoraSaida)}
                </span>
              </div>
            )}

            {/* Botões de ação de status */}
            {entrega.status === 'Aguardando' && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onAtualizarStatus(entrega.id, 'Em Rota')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
                >
                  🚚 Sair para Entrega
                </button>
              </div>
            )}

            {entrega.status === 'Em Rota' && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onAtualizarStatus(entrega.id, 'Entregue')}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
                >
                  ✅ Marcar como Entregue
                </button>
              </div>
            )}
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
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <User size={16} />
                  {entregador.nome}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                    isAtivo ? 'bg-red-700' : 'bg-gray-600'
                  }`}>
                    {qtdEntregas}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo do Entregador Ativo */}
        <div className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User size={20} className="text-blue-400" />
            {entregadorAtivo?.nome} ({entregasDoEntregador.length} entregas)
          </h3>
          
          {entregasDoEntregador.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Nenhuma entrega para este entregador
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
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
          <CheckCircle size={20} className="text-green-500" />
          Entregas Finalizadas ({entregasFinalizadasFiltradas.length})
        </h2>
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-300">Filtrar por:</label>
          <select
            value={entregadorFiltroFinalizadas}
            onChange={(e) => setEntregadorFiltroFinalizadas(e.target.value ? Number(e.target.value) : '')}
            className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Todos os entregadores</option>
            {entregadores.map(entregador => (
              <option key={entregador.id} value={entregador.id}>
                {entregador.nome}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {entregasFinalizadasFiltradas.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          Nenhuma entrega finalizada encontrada
        </p>
      ) : (
        <div className="space-y-4">
          {entregasFinalizadasFiltradas.map(entrega => {
            const cliente = clientes.find(c => c.id === entrega.clienteId);
            const entregador = entregadores.find(e => e.id === entrega.entregadorId);

            return (
              <div key={entrega.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Hash size={16} className="text-blue-400" />
                        <span className="font-medium text-white">#{entrega.numeroPedido}</span>
                      </div>
                      
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        entrega.status === 'Entregue' ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                      }`}>
                        {entrega.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="text-gray-300 text-sm">{cliente?.nome}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="text-gray-300 text-sm">Entregador: {entregador?.nome}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-gray-300 text-sm">
                          Finalizada: {formatarDataHora(entrega.dataHoraEntrega || entrega.dataHora)}
                        </span>
                      </div>

                      {entrega.duracaoEntrega && (
                        <div className="flex items-center gap-2">
                          <Stopwatch size={16} className="text-gray-400" />
                          <span className="text-gray-300 text-sm">
                            Duração: {formatarDuracaoLegivel(entrega.duracaoEntrega)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-green-400" />
                        <span className="text-green-300 text-sm">
                          Pedido: {formatarValor(entrega.valorTotalPedido)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-blue-400" />
                        <span className="text-blue-300 text-sm">
                          Corrida: {formatarValor(entrega.valorCorrida)}
                        </span>
                      </div>
                    </div>
                  </div>

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
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Gerencie suas entregas em tempo real</p>
        </div>
        
        <button
          onClick={onNovaEntrega}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200 whitespace-nowrap"
        >
          <Plus size={20} />
          Nova Entrega
        </button>
      </div>

      {/* Navegação */}
      <div className="border-b border-gray-700">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setModoVisualizacao('geral')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors duration-200 ${
              modoVisualizacao === 'geral'
                ? 'bg-red-600 text-white border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <List size={16} className="inline mr-2" />
            Visão Geral
          </button>
          
          <button
            onClick={() => setModoVisualizacao('por-entregador')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors duration-200 ${
              modoVisualizacao === 'por-entregador'
                ? 'bg-red-600 text-white border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Users size={16} className="inline mr-2" />
            Por Entregador
          </button>
          
          <button
            onClick={() => setModoVisualizacao('finalizadas')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors duration-200 ${
              modoVisualizacao === 'finalizadas'
                ? 'bg-red-600 text-white border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <CheckCircle size={16} className="inline mr-2" />
            Finalizadas
          </button>
        </div>
      </div>

      {/* Conteúdo baseado na visualização */}
      {modoVisualizacao === 'geral' && renderVisaoGeral()}
      {modoVisualizacao === 'por-entregador' && renderVisaoPorEntregador()}
      {modoVisualizacao === 'finalizadas' && renderEntregasFinalizadas()}

      {/* Modal */}
      <Modal
        isOpen={modalState.isOpen}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
        onClose={closeModal}
      />
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Truck, Clock, MapPin, DollarSign, User, Phone, LogOut, Timer, CheckSquare, Square, Package } from 'lucide-react';
import { Entrega, Cliente } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatarValor, formatarHora } from '../utils/calculations';

interface EntregadorDashboardProps {
  entregas: Entrega[];
  clientes: Cliente[];
  onAtualizarStatus: (id: number, status: 'Em Rota' | 'Entregue', dataHora?: Date) => void;
}

export const EntregadorDashboard: React.FC<EntregadorDashboardProps> = ({
  entregas,
  clientes,
  onAtualizarStatus
}) => {
  const { usuario, logout } = useAuth();
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [entregasSelecionadas, setEntregasSelecionadas] = useState<Set<number>>(new Set());

  // CORRIGIDO: useEffect com logs para debug
  useEffect(() => {
    console.log('🚀 Iniciando timer do EntregadorDashboard');
    const interval = setInterval(() => {
      const agora = new Date();
      console.log('⏰ Timer tick:', agora.toLocaleTimeString('pt-BR'));
      setHoraAtual(agora);
    }, 1000);

    return () => {
      console.log('🛑 Parando timer do EntregadorDashboard');
      clearInterval(interval);
    };
  }, []);

  // Filtrar entregas do entregador logado
  const entregasDoEntregador = entregas.filter(e => e.entregadorId === usuario?.entregadorId);
  
  // Enriquecer entregas com dados do cliente
  const entregasComClientes = entregasDoEntregador.map(entrega => ({
    ...entrega,
    cliente: clientes.find(c => c.id === entrega.clienteId)
  }));

  const entregasAguardando = entregasComClientes.filter(e => e.status === 'Aguardando');
  const entregasEmRota = entregasComClientes.filter(e => e.status === 'Em Rota');

  // Funções para gerenciar seleção
  const toggleSelecionarEntrega = (entregaId: number) => {
    const novaSelecao = new Set(entregasSelecionadas);
    if (novaSelecao.has(entregaId)) {
      novaSelecao.delete(entregaId);
    } else {
      novaSelecao.add(entregaId);
    }
    setEntregasSelecionadas(novaSelecao);
  };

  const selecionarTodas = () => {
    const idsAguardando = entregasAguardando.map(e => e.id);
    setEntregasSelecionadas(new Set(idsAguardando));
  };

  const desselecionarTodas = () => {
    setEntregasSelecionadas(new Set());
  };

  // Ações com entregas
  const handleSairComSelecionadas = () => {
    const agora = new Date();
    entregasSelecionadas.forEach(entregaId => {
      console.log(`🚚 Saindo para entrega ${entregaId} às:`, agora.toLocaleTimeString());
      onAtualizarStatus(entregaId, 'Em Rota', agora);
    });
    setEntregasSelecionadas(new Set());
  };

  const handleSairComTodas = () => {
    const agora = new Date();
    entregasAguardando.forEach(entrega => {
      console.log(`🚚 Saindo para entrega ${entrega.id} às:`, agora.toLocaleTimeString());
      onAtualizarStatus(entrega.id, 'Em Rota', agora);
    });
    setEntregasSelecionadas(new Set());
  };

  const handleMarcarComoEntregue = (entregaId: number) => {
    const agora = new Date();
    console.log(`✅ Finalizando entrega ${entregaId} às:`, agora.toLocaleTimeString());
    onAtualizarStatus(entregaId, 'Entregue', agora);
  };

  // CORRIGIDO: Timer usando horaAtual atualizada
  const calcularTempoEmRota = (dataSaida: Date): string => {
    const agora = horaAtual; // Usar horaAtual que é atualizada a cada segundo
    const saida = new Date(dataSaida);
    
    console.log('🕐 Calculando tempo:', {
      agora: agora.toLocaleString('pt-BR'),
      saida: saida.toLocaleString('pt-BR'),
      diffMs: agora.getTime() - saida.getTime()
    });
    
    // Verificar se as datas são válidas
    if (isNaN(saida.getTime()) || isNaN(agora.getTime())) {
      console.log('❌ Datas inválidas');
      return '00:00';
    }
    
    const diffMs = agora.getTime() - saida.getTime();
    
    // Se a diferença for negativa, retornar 00:00
    if (diffMs < 0) {
      console.log('❌ Diferença negativa:', diffMs);
      return '00:00';
    }
    
    const totalSegundos = Math.floor(diffMs / 1000);
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;
    
    const resultado = horas > 0 
      ? `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`
      : `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    
    console.log('⏱️ Timer resultado:', resultado, 'Total segundos:', totalSegundos);
    return resultado;
  };

  const calcularValorTotal = () => {
    return entregasDoEntregador
      .filter(e => e.status === 'Entregue')
      .reduce((total, entrega) => total + entrega.valorCorrida, 0);
  };

  const renderEntregaCard = (entrega: Entrega & { cliente?: Cliente }, showSelection = false) => {
    const totalACobrar = entrega.valorTotalPedido + entrega.valorCorrida;
    
    return (
      <div key={entrega.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
        {/* Header com seleção (se aplicável) */}
        {showSelection && (
          <div className="flex items-center gap-3 pb-2 border-b border-gray-700">
            <button
              onClick={() => toggleSelecionarEntrega(entrega.id)}
              className="flex items-center gap-2 text-sm font-medium hover:text-blue-400 transition-colors"
            >
              {entregasSelecionadas.has(entrega.id) ? (
                <CheckSquare size={20} className="text-blue-500" />
              ) : (
                <Square size={20} className="text-gray-400" />
              )}
              <span className={entregasSelecionadas.has(entrega.id) ? "text-blue-400" : "text-gray-300"}>
                Selecionar
              </span>
            </button>
          </div>
        )}
        
        {/* Informações da entrega */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Pedido</p>
            <div className="flex items-center gap-2 mt-1">
              <Package size={16} className="text-orange-500" />
              <span className="font-bold text-white">{entrega.numeroPedido}</span>
            </div>
          </div>
          
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Valor Corrida</p>
            <div className="flex items-center gap-2 mt-1">
              <DollarSign size={16} className="text-green-500" />
              <span className="font-bold text-green-400">{formatarValor(entrega.valorCorrida)}</span>
            </div>
          </div>
        </div>

        {/* NOVO: Seção de valores */}
        <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-400">Pedido</p>
              <p className="font-semibold text-white">{formatarValor(entrega.valorTotalPedido)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Corrida</p>
              <p className="font-semibold text-red-400">{formatarValor(entrega.valorCorrida)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total</p>
              <p className="font-bold text-green-400">{formatarValor(totalACobrar)}</p>
            </div>
          </div>
        </div>

        {/* Cliente */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Cliente</p>
          <div className="flex items-center gap-2 mt-1">
            <User size={16} className="text-blue-500" />
            <span className="font-medium text-white">{entrega.cliente?.nome}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <MapPin size={16} className="text-red-500" />
            <span className="text-gray-300 text-sm">
              {entrega.cliente?.ruaNumero}, {entrega.cliente?.bairro}
            </span>
          </div>
          {entrega.cliente?.telefone && (
            <div className="flex items-center gap-2 mt-1">
              <Phone size={16} className="text-purple-500" />
              <span className="text-gray-300 text-sm">{entrega.cliente.telefone}</span>
            </div>
          )}
        </div>

        {/* Timer para entregas em rota */}
        {entrega.status === 'Em Rota' && entrega.dataHoraSaida && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer size={18} className="text-red-500" />
                <span className="text-red-400 font-medium">Tempo em Rota</span>
              </div>
              <span className="text-red-400 font-mono text-lg font-bold">
                {calcularTempoEmRota(entrega.dataHoraSaida)}
              </span>
            </div>
            <button
              onClick={() => handleMarcarComoEntregue(entrega.id)}
              className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              ✅ Marcar como Entregue
            </button>
          </div>
        )}

        {/* Horário para entregas aguardando */}
        {entrega.status === 'Aguardando' && (
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <span className="text-gray-300 text-sm">
              Criado às {formatarHora(entrega.dataHora)}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Truck size={32} className="text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">Painel do Entregador</h1>
            <p className="text-gray-400">Olá, {usuario?.nomeCompleto}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-400">Ganhos de Hoje</p>
            <p className="text-xl font-bold text-green-400">{formatarValor(calcularValorTotal())}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coluna 1: Entregas Aguardando */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              Entregas Aguardando ({entregasAguardando.length})
            </h2>
          </div>

          {entregasAguardando.length > 0 && (
            <div className="mb-4 space-y-2">
              {/* Botões de seleção */}
              <div className="flex gap-2">
                <button
                  onClick={selecionarTodas}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                >
                  Selecionar Todas
                </button>
                <button
                  onClick={desselecionarTodas}
                  className="text-sm bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded transition-colors"
                >
                  Limpar Seleção
                </button>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2">
                <button
                  onClick={handleSairComTodas}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  🚚 Sair com Todas ({entregasAguardando.length})
                </button>
                {entregasSelecionadas.size > 0 && (
                  <button
                    onClick={handleSairComSelecionadas}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    🎯 Sair com Selecionadas ({entregasSelecionadas.size})
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {entregasAguardando.length === 0 ? (
              <div className="text-center py-8">
                <Package size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">Nenhuma entrega aguardando</p>
              </div>
            ) : (
              entregasAguardando.map(entrega => renderEntregaCard(entrega, true))
            )}
          </div>
        </div>

        {/* Coluna 2: Entregas Em Rota */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Entregas em Rota ({entregasEmRota.length})
          </h2>
          
          <div className="space-y-4">
            {entregasEmRota.length === 0 ? (
              <div className="text-center py-8">
                <Timer size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">Nenhuma entrega em rota</p>
              </div>
            ) : (
              entregasEmRota.map(entrega => renderEntregaCard(entrega, false))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
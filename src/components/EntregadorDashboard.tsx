import React, { useState, useEffect } from 'react';
import { Truck, Clock, MapPin, DollarSign, User, Phone, LogOut, Timer, CheckSquare, Square, Package } from 'lucide-react';
import { Entrega, Cliente } from '../types';
// CORREÇÃO: Importar useAuth do hook, não do contexto
import { useAuth } from '../hooks/useAuth';
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

  // TIMER CORRIGIDO - Problema 3
  useEffect(() => {
    console.log('🚀 Iniciando timer do EntregadorDashboard');
    const interval = setInterval(() => {
      const agora = new Date();
      console.log('⏰ Timer tick EntregadorDashboard:', agora.toLocaleTimeString('pt-BR'));
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

  // TIMER CORRIGIDO usando horaAtual atualizada - Problema 3
  const calcularTempoEmRota = (dataSaida: Date): string => {
    const agora = horaAtual; // Usar horaAtual que é atualizada a cada segundo
    const saida = new Date(dataSaida);
    
    // Debug logs
    console.log('🕐 Calculando tempo EntregadorDashboard:', {
      agora: agora.toLocaleString('pt-BR'),
      saida: saida.toLocaleString('pt-BR'),
      diffMs: agora.getTime() - saida.getTime()
    });
    
    // Verificar se as datas são válidas
    if (isNaN(saida.getTime()) || isNaN(agora.getTime())) {
      console.log('❌ Datas inválidas EntregadorDashboard');
      return '00:00:00';
    }
    
    const diffMs = agora.getTime() - saida.getTime();
    
    // Se a diferença for negativa, retornar 00:00:00
    if (diffMs < 0) {
      console.log('❌ Diferença negativa EntregadorDashboard:', diffMs);
      return '00:00:00';
    }
    
    const totalSegundos = Math.floor(diffMs / 1000);
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;
    
    // Sempre mostrar hh:mm:ss
    const resultado = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    
    console.log('✅ Tempo calculado EntregadorDashboard:', resultado);
    return resultado;
  };

  // Calcular valor total das entregas de hoje
  const calcularValorTotal = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    return entregasComClientes
      .filter(e => {
        const dataEntrega = new Date(e.dataHora);
        dataEntrega.setHours(0, 0, 0, 0);
        return dataEntrega.getTime() === hoje.getTime() && e.status === 'Entregue';
      })
      .reduce((total, e) => total + e.valorCorrida, 0);
  };

  const renderEntregaCard = (entrega: Entrega & { cliente?: Cliente }) => {
    const { cliente } = entrega;

    return (
      <div key={entrega.id} className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors">
        {/* Header do card */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-blue-400" />
              <span className="font-semibold text-white">#{entrega.numeroPedido}</span>
            </div>
            
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              entrega.status === 'Aguardando' ? 'bg-yellow-600 text-yellow-100' :
              entrega.status === 'Em Rota' ? 'bg-blue-600 text-blue-100' :
              'bg-green-600 text-green-100'
            }`}>
              {entrega.status}
            </div>
          </div>

          {/* Checkbox para seleção (apenas para aguardando) */}
          {entrega.status === 'Aguardando' && (
            <button
              onClick={() => toggleSelecionarEntrega(entrega.id)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {entregasSelecionadas.has(entrega.id) ? 
                <CheckSquare size={20} className="text-blue-400" /> : 
                <Square size={20} />
              }
            </button>
          )}
        </div>

        {/* Informações do cliente */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-400" />
            <span className="text-white font-medium">{cliente?.nome || 'Cliente não encontrado'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-gray-400" />
            <span className="text-gray-300 text-sm">
              {cliente?.ruaNumero}, {cliente?.bairro}
            </span>
          </div>

          {cliente?.telefone && (
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-gray-400" />
              <span className="text-gray-300 text-sm">{cliente.telefone}</span>
            </div>
          )}
        </div>

        {/* Valores */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} className="text-green-400" />
              <span className="text-gray-400 text-xs">Pedido</span>
            </div>
            <span className="text-green-300 font-semibold">{formatarValor(entrega.valorTotalPedido)}</span>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} className="text-blue-400" />
              <span className="text-gray-400 text-xs">Corrida</span>
            </div>
            <span className="text-blue-300 font-semibold">{formatarValor(entrega.valorCorrida)}</span>
          </div>
        </div>

        {/* Timer para entregas em rota - CORRIGIDO */}
        {entrega.status === 'Em Rota' && entrega.dataHoraSaida && (
          <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Timer size={16} className="text-yellow-400" />
              <span className="text-yellow-300 text-sm font-medium">Tempo em Rota</span>
            </div>
            <p className="text-yellow-100 text-lg font-mono font-bold">
              {calcularTempoEmRota(entrega.dataHoraSaida)}
            </p>
          </div>
        )}

        {/* Botões de ação */}
        {entrega.status === 'Aguardando' && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                const agora = new Date();
                onAtualizarStatus(entrega.id, 'Em Rota', agora);
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              🚚 Sair para Entrega
            </button>
          </div>
        )}

        {entrega.status === 'Em Rota' && (
          <div className="flex gap-2">
            <button
              onClick={() => handleMarcarComoEntregue(entrega.id)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ✅ Marcar como Entregue
            </button>
          </div>
        )}

        {/* Horário para entregas aguardando */}
        {entrega.status === 'Aguardando' && (
          <div className="flex items-center gap-2 mt-2">
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
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Clock size={20} className="text-yellow-500" />
              Aguardando ({entregasAguardando.length})
            </h2>
            
            {entregasAguardando.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={entregasSelecionadas.size === entregasAguardando.length ? desselecionarTodas : selecionarTodas}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {entregasSelecionadas.size === entregasAguardando.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                </button>
              </div>
            )}
          </div>

          {/* Botões de ação em lote */}
          {entregasAguardando.length > 0 && (
            <div className="mb-4 space-y-2">
              {entregasSelecionadas.size > 0 && (
                <button
                  onClick={handleSairComSelecionadas}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  🚚 Sair com Selecionadas ({entregasSelecionadas.size})
                </button>
              )}
              
              <button
                onClick={handleSairComTodas}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🚛 Sair com Todas ({entregasAguardando.length})
              </button>
            </div>
          )}

          {entregasAguardando.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-600 text-center">
              <Clock size={48} className="text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Nenhuma entrega aguardando</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entregasAguardando.map(renderEntregaCard)}
            </div>
          )}
        </div>

        {/* Coluna 2: Entregas Em Rota */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Truck size={20} className="text-blue-500" />
            Em Rota ({entregasEmRota.length})
          </h2>

          {entregasEmRota.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-600 text-center">
              <Truck size={48} className="text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Nenhuma entrega em rota</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entregasEmRota.map(renderEntregaCard)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
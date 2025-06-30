import React, { useState, useEffect } from 'react';
import { Truck, LogOut } from 'lucide-react';
import { Entrega, Cliente } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatarValor } from '../utils/calculations';

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
  const [contador, setContador] = useState(0);

  // TESTE BÁSICO: Contador simples para ver se re-render funciona
  useEffect(() => {
    console.log('🚀 Iniciando timer de teste');
    const interval = setInterval(() => {
      setContador(prev => {
        console.log('⏰ Contador:', prev + 1);
        return prev + 1;
      });
    }, 1000);

    return () => {
      console.log('🛑 Parando timer de teste');
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

  // TIMER SUPER SIMPLES PARA TESTE
  const calcularTempoEmRota = (dataSaida: Date): string => {
    const agora = new Date();
    const saida = new Date(dataSaida);
    
    console.log('⏱️ Calculando timer:', {
      agora: agora.getTime(),
      saida: saida.getTime(),
      diff: agora.getTime() - saida.getTime()
    });
    
    const diffMs = agora.getTime() - saida.getTime();
    
    if (diffMs < 0) {
      console.log('❌ Diferença negativa');
      return '00:00';
    }
    
    const totalSegundos = Math.floor(diffMs / 1000);
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    
    const resultado = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    console.log('⏱️ Timer resultado:', resultado);
    return resultado;
  };

  // Ações simples
  const handleSairComTodas = () => {
    const agora = new Date();
    console.log('🚚 Saindo com todas às:', agora.toLocaleTimeString());
    entregasAguardando.forEach(entrega => {
      onAtualizarStatus(entrega.id, 'Em Rota', agora);
    });
  };

  const handleMarcarComoEntregue = (entregaId: number) => {
    const agora = new Date();
    console.log('✅ Finalizando entrega:', entregaId, 'às:', agora.toLocaleTimeString());
    onAtualizarStatus(entregaId, 'Entregue', agora);
  };

  const calcularValorTotal = () => {
    return entregasDoEntregador
      .filter(e => e.status === 'Entregue')
      .reduce((total, entrega) => total + entrega.valorCorrida, 0);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header com contador de teste */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Truck size={32} className="text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">Painel do Entregador</h1>
            <p className="text-gray-400">Olá, {usuario?.nomeCompleto}</p>
            <p className="text-red-400">🧪 TESTE - Contador: {contador}</p>
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
        {/* Entregas Aguardando */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Entregas Aguardando ({entregasAguardando.length})
          </h2>

          {entregasAguardando.length > 0 && (
            <button
              onClick={handleSairComTodas}
              className="w-full mb-4 bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              🚚 Sair com Todas ({entregasAguardando.length})
            </button>
          )}

          <div className="space-y-4">
            {entregasAguardando.map(entrega => (
              <div key={entrega.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white">#{entrega.numeroPedido}</span>
                  <span className="text-green-400 font-bold">{formatarValor(entrega.valorCorrida)}</span>
                </div>
                <p className="text-gray-300">{entrega.cliente?.nome}</p>
                <p className="text-gray-400 text-sm">{entrega.cliente?.ruaNumero}</p>
                <p className="text-blue-400">Total: {formatarValor(entrega.valorTotalPedido + entrega.valorCorrida)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Entregas Em Rota */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Entregas em Rota ({entregasEmRota.length})
          </h2>
          
          <div className="space-y-4">
            {entregasEmRota.map(entrega => (
              <div key={entrega.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white">#{entrega.numeroPedido}</span>
                  <span className="text-green-400 font-bold">{formatarValor(entrega.valorCorrida)}</span>
                </div>
                <p className="text-gray-300">{entrega.cliente?.nome}</p>
                <p className="text-gray-400 text-sm">{entrega.cliente?.ruaNumero}</p>
                <p className="text-blue-400">Total: {formatarValor(entrega.valorTotalPedido + entrega.valorCorrida)}</p>
                
                {/* TIMER DE TESTE */}
                {entrega.dataHoraSaida && (
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-red-400">Tempo em Rota:</span>
                      <span className="text-red-400 font-mono text-xl font-bold">
                        {calcularTempoEmRota(entrega.dataHoraSaida)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleMarcarComoEntregue(entrega.id)}
                      className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium"
                    >
                      ✅ Marcar como Entregue
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
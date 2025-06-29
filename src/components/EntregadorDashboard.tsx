import React, { useState, useEffect } from 'react';
import { Truck, Clock, MapPin, DollarSign, User, Phone, LogOut } from 'lucide-react';
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
  const [horaAtual, setHoraAtual] = useState(new Date());

  // Atualizar hora a cada segundo para cronômetros
  useEffect(() => {
    const interval = setInterval(() => {
      setHoraAtual(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Filtrar entregas do entregador logado
  const entregasDoEntregador = entregas.filter(e => e.entregadorId === usuario?.entregadorId);
  
  // Enriquecer entregas com dados do cliente
  const entregasComClientes = entregasDoEntregador.map(entrega => ({
    ...entrega,
    cliente: clientes.find(c => c.id === entrega.clienteId)
  }));

  const entregasAguardandoComClientes = entregasComClientes.filter(e => e.status === 'Aguardando');
  const entregasEmRotaComClientes = entregasComClientes.filter(e => e.status === 'Em Rota');

  const handleSairParaEntrega = (entregaId: number) => {
    const agora = new Date();
    onAtualizarStatus(entregaId, 'Em Rota', agora);
  };

  const handleMarcarComoEntregue = (entregaId: number) => {
    const agora = new Date();
    onAtualizarStatus(entregaId, 'Entregue', agora);
  };

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

  const renderEntregaCard = (entrega: Entrega & { cliente?: Cliente }, tipo: 'aguardando' | 'emrota') => {
    const totalACobrar = entrega.valorTotalPedido + entrega.valorCorrida;
    
    return (
      <div
        key={entrega.id}
        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors duration-200"
      >
        <div className="space-y-4">
          {/* Informações principais */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-400">Pedido:</span>
                <span className="font-bold text-red-400">#{entrega.numeroPedido}</span>
              </div>
              
              <div className="flex items-center gap-2 mb-1">
                <User size={16} className="text-green-500 flex-shrink-0" />
                <span className="font-semibold text-white truncate">{entrega.cliente?.nome}</span>
              </div>
              
              <div className="flex items-start gap-2 mb-2">
                <MapPin size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300 min-w-0">
                  <p className="truncate">{entrega.cliente?.ruaNumero}</p>
                  <p className="truncate">{entrega.cliente?.bairro}</p>
                </div>
              </div>

              {entrega.cliente?.telefone && (
                <div className="flex items-center gap-2 mb-2">
                  <Phone size={16} className="text-purple-500 flex-shrink-0" />
                  <a 
                    href={`tel:${entrega.cliente.telefone}`}
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors duration-200 underline"
                  >
                    {entrega.cliente.telefone}
                  </a>
                </div>
              )}
            </div>

            {/* Cronômetro para entregas em rota */}
            {tipo === 'emrota' && entrega.dataHoraSaida && (
              <div className="text-center bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-3 ml-4 flex-shrink-0">
                <Clock size={20} className="text-red-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-red-400 font-mono whitespace-nowrap">
                  {calcularTempoEmRota(entrega.dataHoraSaida)}
                </div>
                <div className="text-xs text-red-300">em rota</div>
              </div>
            )}
          </div>

          {/* Informações de pagamento */}
          <div className="bg-gray-750 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400">Pedido:</span>
                <span className="text-white font-semibold ml-2">
                  {formatarValor(entrega.valorTotalPedido)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Corrida:</span>
                <span className="text-red-400 font-semibold ml-2">
                  {formatarValor(entrega.valorCorrida)}
                </span>
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1">
                  <DollarSign size={16} className="text-green-400" />
                  Total a Cobrar:
                </span>
                <span className="text-lg font-bold text-green-400">
                  {formatarValor(totalACobrar)}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Pagamento: {entrega.formaPagamento}
              </div>
            </div>
          </div>

          {/* Botão de ação */}
          <div className="pt-2">
            {tipo === 'aguardando' ? (
              <button
                onClick={() => handleSairParaEntrega(entrega.id)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors duration-200 text-base sm:text-lg"
              >
                <Truck size={20} />
                Sair para Entrega
              </button>
            ) : (
              <button
                onClick={() => handleMarcarComoEntregue(entrega.id)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors duration-200 text-base sm:text-lg"
              >
                <Clock size={20} />
                Marcar como Entregue
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/borda de fogo - logo - nome preto e vermelho.png" 
                alt="Pizzaria Borda de Fogo" 
                className="h-8 sm:h-10 w-auto"
              />
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white">
                  Minhas Entregas
                </h1>
                <p className="text-xs sm:text-sm text-gray-400">
                  Olá, {usuario?.nomeUsuario}
                </p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200 text-sm sm:text-base"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Seção Para Sair */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <Clock size={18} sm:size={20} className="text-blue-500" />
              Para Sair ({entregasAguardandoComClientes.length})
            </h2>
          </div>
          
          <div className="p-4">
            {entregasAguardandoComClientes.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Clock size={40} sm:size={48} className="mx-auto text-gray-500 mb-4" />
                <p className="text-gray-400 text-sm sm:text-base">
                  Nenhuma entrega aguardando saída
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {entregasAguardandoComClientes.map(entrega => 
                  renderEntregaCard(entrega, 'aguardando')
                )}
              </div>
            )}
          </div>
        </div>

        {/* Seção Em Rota */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <Truck size={18} sm:size={20} className="text-red-500" />
              Em Rota ({entregasEmRotaComClientes.length})
            </h2>
          </div>
          
          <div className="p-4">
            {entregasEmRotaComClientes.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Truck size={40} sm:size={48} className="mx-auto text-gray-500 mb-4" />
                <p className="text-gray-400 text-sm sm:text-base">
                  Nenhuma entrega em rota
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {entregasEmRotaComClientes.map(entrega => 
                  renderEntregaCard(entrega, 'emrota')
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
import React, { useState } from 'react';
// Ícone 'DollarSign' foi removido desta linha
import { Truck, Clock, MapPin, User, Phone, LogOut, Timer, CheckSquare, Square, Package, Wallet } from 'lucide-react';
import { Entrega, Cliente } from '../types';
import { useAuth } from '../hooks/useAuth';
import { formatarValor, formatarHora } from '../utils/calculations';
import { useTimer } from '../hooks/useTimer';

interface EntregadorDashboardProps {
  entregas: Entrega[];
  clientes: Cliente[];
  onAtualizarStatus: (id: number, status: 'Em Rota' | 'Entregue', dataHora?: Date) => void;
}

export const EntregadorDashboard: React.FC<EntregadorDashboardProps> = ({
  entregas,
  clientes,
  onAtualizarStatus,
}) => {
  const { usuario, logout } = useAuth();
  const horaAtual = useTimer();
  const [entregasSelecionadas, setEntregasSelecionadas] = useState<Set<number>>(new Set());

  const entregasComClientes = entregas.map((entrega) => ({
    ...entrega,
    cliente: clientes.find((c) => c.id === entrega.clienteId),
  }));

  const entregasAguardando = entregasComClientes.filter((e) => e.status === 'Aguardando');
  const entregasEmRota = entregasComClientes.filter((e) => e.status === 'Em Rota');

  const toggleSelecionarEntrega = (entregaId: number) => {
    const novaSelecao = new Set(entregasSelecionadas);
    if (novaSelecao.has(entregaId)) {
      novaSelecao.delete(entregaId);
    } else {
      novaSelecao.add(entregaId);
    }
    setEntregasSelecionadas(novaSelecao);
  };

  const handleSairComSelecionadas = () => {
    const agora = new Date();
    entregasSelecionadas.forEach((id) => onAtualizarStatus(id, 'Em Rota', agora));
    setEntregasSelecionadas(new Set());
  };

  const calcularTempoEmRota = (dataSaida: Date): string => {
    const saida = new Date(dataSaida);
    if (isNaN(saida.getTime())) return '00:00:00';
    const diffMs = horaAtual.getTime() - saida.getTime();
    if (diffMs < 0) return '00:00:00';

    const totalSegundos = Math.floor(diffMs / 1000);
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;

    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  };

  const calcularValorTotalHoje = () => {
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

  const renderEntregaCard = (entrega: Entrega & { cliente?: Cliente }) => (
    <div key={entrega.id} className="bg-gray-800 rounded-lg p-4 border border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Package size={18} className="text-blue-400" />
          <span className="font-semibold text-white">#{entrega.numeroPedido}</span>
        </div>
        {entrega.status === 'Aguardando' && (
          <button onClick={() => toggleSelecionarEntrega(entrega.id)}>
            {entregasSelecionadas.has(entrega.id) ? <CheckSquare size={20} className="text-blue-400" /> : <Square size={20} />}
          </button>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2"><User size={16} /><span>{entrega.cliente?.nome}</span></div>
        <div className="flex items-center gap-2"><MapPin size={16} /><span>{entrega.cliente?.ruaNumero}, {entrega.cliente?.bairro}</span></div>
        {entrega.cliente?.telefone && <div className="flex items-center gap-2"><Phone size={16} /><span>{entrega.cliente.telefone}</span></div>}
      </div>

      <div className="bg-gray-700 rounded-lg p-3 mb-4 border border-orange-500/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-orange-400" />
              <span className="text-gray-300 text-sm font-semibold">Valor a Cobrar</span>
            </div>
            <span className="text-orange-300 font-bold text-lg">
              {formatarValor(entrega.valorTotalPedido + entrega.valorCorrida)}
            </span>
          </div>
      </div>

      {entrega.status === 'Em Rota' && entrega.dataHoraSaida && (
        <div className="bg-yellow-900/30 p-3 mb-4 rounded-lg border border-yellow-600">
          <div className="flex items-center gap-2">
            <Timer size={16} className="text-yellow-400" />
            <span className="text-yellow-300 font-mono text-lg">{calcularTempoEmRota(entrega.dataHoraSaida)}</span>
          </div>
        </div>
      )}

      {entrega.status === 'Aguardando' && (
        <button onClick={() => onAtualizarStatus(entrega.id, 'Em Rota')} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">Sair para Entrega</button>
      )}
      {entrega.status === 'Em Rota' && (
        <button onClick={() => onAtualizarStatus(entrega.id, 'Entregue')} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">Marcar como Entregue</button>
      )}
        <div className="flex items-center gap-2 mt-2">
            <Clock size={16} className="text-gray-400" />
            <span className="text-gray-300 text-sm">
              Criado às {formatarHora(new Date(entrega.dataHora))}
            </span>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <header className="flex items-center justify-between mb-8">
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
                <p className="text-xl font-bold text-green-400">{formatarValor(calcularValorTotalHoje())}</p>
            </div>
            <button onClick={logout} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
                <LogOut size={18} />Sair
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Aguardando ({entregasAguardando.length})</h2>
          {entregasSelecionadas.size > 0 && (
            <button onClick={handleSairComSelecionadas} className="w-full bg-blue-600 mb-4 py-2 rounded-lg">Sair com Selecionadas ({entregasSelecionadas.size})</button>
          )}
          <div className="space-y-4">
            {entregasAguardando.length > 0 ? entregasAguardando.map(renderEntregaCard) : <p className="text-center text-gray-500 py-8">Nenhuma entrega aguardando.</p>}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Em Rota ({entregasEmRota.length})</h2>
          <div className="space-y-4">
            {entregasEmRota.length > 0 ? entregasEmRota.map(renderEntregaCard) : <p className="text-center text-gray-500 py-8">Nenhuma entrega em rota.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
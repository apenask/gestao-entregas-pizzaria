import React, { useState, useMemo } from 'react';
import { Plus, Clock, User, MapPin, Hash, DollarSign, Users, List, CheckCircle, Edit2, Trash2, Phone, Timer, Wallet, Watch as Stopwatch } from 'lucide-react';
import { Entrega, Entregador, Cliente } from '../types';
import { formatarHora, formatarValor, formatarDataHora, formatarDuracaoLegivel } from '../utils/calculations';
import { Modal } from './Modal';
import { useModal } from '../hooks/useModal';
import { useTimer } from '../hooks/useTimer';

interface DashboardProps {
  entregas: Entrega[];
  entregadores: Entregador[];
  clientes: Cliente[];
  onNovaEntrega: () => void;
  onAtualizarStatus: (id: number, status: 'Em Rota' | 'Entregue' | 'Cancelado') => void;
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
  
  const horaAtual = useTimer();
  const { modalState, showConfirm, closeModal } = useModal();

  const entregasACaminho = useMemo(() => entregas.filter(e => e.status === 'Aguardando' || e.status === 'Em Rota'), [entregas]);
  const entregasFinalizadas = useMemo(() => entregas.filter(e => e.status === 'Entregue' || e.status === 'Cancelado'), [entregas]);

  const entregasPorEntregador = useMemo(() => {
    return entregasACaminho.reduce((acc, entrega) => {
      (acc[entrega.entregadorId] = acc[entrega.entregadorId] || []).push(entrega);
      return acc;
    }, {} as Record<number, Entrega[]>);
  }, [entregasACaminho]);

  const entregasFinalizadasFiltradas = useMemo(() => {
    let filtradas = entregasFinalizadas;
    if (entregadorFiltroFinalizadas) {
      filtradas = filtradas.filter(e => e.entregadorId === entregadorFiltroFinalizadas);
    }
    return filtradas.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
  }, [entregasFinalizadas, entregadorFiltroFinalizadas]);
  
  const entregadoresAtivos = useMemo(() => entregadores.filter(entregador => entregasPorEntregador[entregador.id]?.length > 0), [entregadores, entregasPorEntregador]);

  React.useEffect(() => {
    if (modoVisualizacao === 'por-entregador' && entregadoresAtivos.length > 0 && !entregadorAtivoId) {
      setEntregadorAtivoId(entregadoresAtivos[0].id);
    }
  }, [modoVisualizacao, entregadoresAtivos, entregadorAtivoId]);

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

  const handleExcluirComConfirmacao = (entrega: Entrega) => {
    showConfirm('Confirmar Exclusão', `Tem certeza que deseja excluir a entrega #${entrega.numeroPedido}?`, () => onExcluirEntrega(entrega.id));
  };

  const renderEntregaCard = (entrega: Entrega) => {
    const cliente = clientes.find(c => c.id === entrega.clienteId);
    const entregador = entregadores.find(e => e.id === entrega.entregadorId);

    return (
      <div key={entrega.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2"><Hash size={16} className="text-blue-400" /> <span className="font-medium text-white">#{entrega.numeroPedido}</span></div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${entrega.status === 'Aguardando' ? 'bg-yellow-600 text-yellow-100' : entrega.status === 'Em Rota' ? 'bg-blue-600 text-blue-100' : entrega.status === 'Entregue' ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'}`}>{entrega.status}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2"><User size={16} className="text-gray-400" /> <span className="text-gray-300 text-sm">{cliente?.nome || 'Cliente não encontrado'}</span></div>
              <div className="flex items-center gap-2"><MapPin size={16} className="text-gray-400" /> <span className="text-gray-300 text-sm">{cliente?.ruaNumero}, {cliente?.bairro}</span></div>
              {cliente?.telefone && <div className="flex items-center gap-2"><Phone size={16} className="text-gray-400" /> <span className="text-gray-300 text-sm">{cliente.telefone}</span></div>}
              <div className="flex items-center gap-2"><User size={16} className="text-gray-400" /> <span className="text-gray-300 text-sm">Entregador: {entregador?.nome}</span></div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2"><DollarSign size={16} className="text-green-400" /> <span className="text-green-300 text-sm">Pedido: {formatarValor(entrega.valorTotalPedido)}</span></div>
              <div className="flex items-center gap-2"><DollarSign size={16} className="text-blue-400" /> <span className="text-blue-300 text-sm">Corrida: {formatarValor(entrega.valorCorrida)}</span></div>
              <div className="flex items-center gap-2"><Wallet size={16} className="text-orange-400" /> <span className="text-orange-300 text-sm font-bold">Total: {formatarValor(entrega.valorTotalPedido + entrega.valorCorrida)}</span></div>
              <div className="flex items-center gap-2"><Clock size={16} className="text-gray-400" /> <span className="text-gray-300 text-sm">{formatarHora(new Date(entrega.dataHora))}</span></div>
            </div>
            {entrega.status === 'Em Rota' && entrega.dataHoraSaida && <div className="flex items-center gap-2 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-2"><Timer size={16} className="text-yellow-400" /> <span className="text-yellow-300 text-sm font-mono">Tempo em rota: {calcularTempoEmRota(new Date(entrega.dataHoraSaida))}</span></div>}
            {entrega.status === 'Aguardando' && <div className="flex flex-wrap gap-2"><button onClick={() => onAtualizarStatus(entrega.id, 'Em Rota')} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium">🚚 Sair para Entrega</button></div>}
            {entrega.status === 'Em Rota' && <div className="flex flex-wrap gap-2"><button onClick={() => onAtualizarStatus(entrega.id, 'Entregue')} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium">✅ Marcar como Entregue</button></div>}
          </div>
          <div className="flex lg:flex-col gap-2 lg:min-w-[120px]">
            <button onClick={() => onEditarEntrega(entrega)} className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center justify-center gap-2"><Edit2 size={16} /> Editar</button>
            <button onClick={() => handleExcluirComConfirmacao(entrega)} className="flex-1 lg:flex-none bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded text-sm font-medium flex items-center justify-center gap-2"><Trash2 size={16} /> Excluir</button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Gerencie suas entregas em tempo real</p>
        </div>
        <button onClick={onNovaEntrega} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 whitespace-nowrap"><Plus size={20} /> Nova Entrega</button>
      </div>

      <div className="border-b border-gray-700">
        <div className="flex flex-wrap gap-1">
          <button onClick={() => setModoVisualizacao('geral')} className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${modoVisualizacao === 'geral' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><List size={16} className="inline mr-2" />Visão Geral</button>
          <button onClick={() => setModoVisualizacao('por-entregador')} className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${modoVisualizacao === 'por-entregador' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><Users size={16} className="inline mr-2" />Por Entregador</button>
          <button onClick={() => setModoVisualizacao('finalizadas')} className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${modoVisualizacao === 'finalizadas' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><CheckCircle size={16} className="inline mr-2" />Finalizadas</button>
        </div>
      </div>

      {modoVisualizacao === 'geral' && <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700"><h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2"><Clock size={20} className="text-red-500" />Entregas A Caminho ({entregasACaminho.length})</h2>{entregasACaminho.length === 0 ? <p className="text-gray-400 text-center py-8">Nenhuma entrega em andamento</p> : <div className="space-y-4">{entregasACaminho.map(renderEntregaCard)}</div>}</div>}
      {/* ... (resto do JSX) ... */}
      {modoVisualizacao === 'finalizadas' && <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"><h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2"><CheckCircle size={20} className="text-green-500" />Entregas Finalizadas ({entregasFinalizadasFiltradas.length})</h2><div className="flex items-center gap-2"><label className="text-sm text-gray-300">Filtrar por:</label><select value={entregadorFiltroFinalizadas} onChange={(e) => setEntregadorFiltroFinalizadas(e.target.value ? Number(e.target.value) : '')} className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-white text-sm"><option value="">Todos</option>{entregadores.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></div></div>{entregasFinalizadasFiltradas.length === 0 ? <p className="text-gray-400 text-center py-8">Nenhuma entrega finalizada</p> : <div className="space-y-4">{entregasFinalizadasFiltradas.map(entrega => { const cliente = clientes.find(c => c.id === entrega.clienteId); const entregador = entregadores.find(e => e.id === entrega.entregadorId); return (<div key={entrega.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600"><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div className="flex items-center gap-2"><Hash size={16}/><span>#{entrega.numeroPedido}</span></div><div className="flex items-center gap-2"><User size={16}/><span>{cliente?.nome}</span></div><div className="flex items-center gap-2"><User size={16}/><span>Entregador: {entregador?.nome}</span></div><div className="flex items-center gap-2"><Clock size={16}/><span>Finalizada: {formatarDataHora(new Date(entrega.dataHoraEntrega!))}</span></div>{entrega.duracaoEntrega && <div className="flex items-center gap-2"><Stopwatch size={16}/><span>Duração: {formatarDuracaoLegivel(entrega.duracaoEntrega)}</span></div>}</div></div>);})}</div>}</div>}

      {/* AQUI ESTÁ A CORREÇÃO */}
      <Modal onClose={closeModal} {...modalState} />
    </div>
  );
};
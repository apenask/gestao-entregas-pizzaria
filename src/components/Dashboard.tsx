import React, { useState, useMemo } from 'react';
import { Plus, Clock, User, MapPin, Users, List, CheckCircle, Truck, Hash, Phone } from 'lucide-react';
import { Entrega, Entregador, Cliente } from '../types';
import { formatarHora, formatarValor, formatarDuracaoLegivel } from '../utils/calculations';
import { Modal } from './Modal';
import { useModal } from '../hooks/useModal';
import { useTimer } from '../hooks/useTimer';
import { MapaRastreio } from './MapaRastreio';

interface DashboardProps {
  entregas: Entrega[];
  entregadores: Entregador[];
  clientes: Cliente[];
  onNovaEntrega: () => void;
  onAtualizarStatus: (id: number, status: 'Em Rota' | 'Entregue' | 'Cancelado') => void;
  onEditarEntrega: (entrega: Entrega) => void;
  onExcluirEntrega: (id: number) => void;
}

// O modo 'mapa' foi removido, pois agora está integrado
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

  const entregasCompletas = useMemo(() => {
    return entregas.map(entrega => ({
      ...entrega,
      cliente: clientes.find(c => c.id === entrega.clienteId),
      entregador: entregadores.find(e => e.id === entrega.entregadorId)
    }));
  }, [entregas, clientes, entregadores]);
  
  const entregasACaminho = useMemo(() => entregasCompletas.filter(e => e.status === 'Aguardando' || e.status === 'Em Rota'), [entregasCompletas]);
  const entregasFinalizadas = useMemo(() => entregasCompletas.filter(e => e.status === 'Entregue' || e.status === 'Cancelado'), [entregasCompletas]);

  const entregasPorEntregador = useMemo(() => {
    return entregasACaminho.reduce((acc, entrega) => {
      (acc[entrega.entregadorId] = acc[entrega.entregadorId] || []).push(entrega);
      return acc;
    }, {} as Record<number, (Entrega & {cliente?: Cliente, entregador?: Entregador})[]>);
  }, [entregasACaminho]);

  const entregasFinalizadasFiltradas = useMemo(() => {
    let filtradas = entregasFinalizadas;
    if (entregadorFiltroFinalizadas) {
      filtradas = filtradas.filter(e => e.entregadorId === Number(entregadorFiltroFinalizadas));
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

  const renderEntregaCard = (entrega: Entrega & {cliente?: Cliente, entregador?: Entregador}) => {
    const statusInfo = {
        Aguardando: { cor: 'border-yellow-500', texto: 'text-yellow-400' },
        'Em Rota': { cor: 'border-blue-500', texto: 'text-blue-400' },
        Entregue: { cor: 'border-green-500', texto: 'text-green-400' },
        Cancelado: { cor: 'border-red-500', texto: 'text-red-400' },
    };

    return (
        <div key={entrega.id} className={`bg-gray-800 rounded-lg p-4 border-l-4 ${statusInfo[entrega.status]?.cor || 'border-gray-500'} shadow-lg space-y-4`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className={`text-sm font-bold ${statusInfo[entrega.status]?.texto || 'text-gray-400'}`}>{entrega.status}</p>
                    <h3 className="font-bold text-white text-lg"><Hash size={18} className="inline -mt-1"/>{entrega.numeroPedido}</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400"><Clock size={16} /><span>{formatarHora(new Date(entrega.dataHora))}</span></div>
            </div>
            <div className="border-t border-b border-gray-700 py-3 space-y-2">
                <div className="flex items-center gap-3"><User size={16} className="text-gray-500"/> <span className="text-gray-200">{entrega.cliente?.nome || 'Cliente não encontrado'}</span></div>
                <div className="flex items-center gap-3"><MapPin size={16} className="text-gray-500"/> <span className="text-gray-300">{entrega.cliente?.ruaNumero}, {entrega.cliente?.bairro}</span></div>
                {entrega.cliente?.telefone && <div className="flex items-center gap-3"><Phone size={16} className="text-gray-500"/> <span className="text-gray-300">{entrega.cliente.telefone}</span></div>}
                <div className="flex items-center gap-3"><Truck size={16} className="text-gray-500"/> <span className="text-gray-300">Entregador: {entrega.entregador?.nome || 'N/A'}</span></div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
                <div><p className="text-xs text-gray-400">Pedido</p><p className="font-semibold text-white">{formatarValor(entrega.valorTotalPedido)}</p></div>
                <div><p className="text-xs text-gray-400">Corrida</p><p className="font-semibold text-white">{formatarValor(entrega.valorCorrida)}</p></div>
                <div className="text-orange-400"><p className="text-xs">Total</p><p className="font-bold">{formatarValor(entrega.valorTotalPedido + entrega.valorCorrida)}</p></div>
            </div>
            {entrega.status === 'Em Rota' && entrega.dataHoraSaida && <div className="bg-yellow-500/10 p-2 rounded-lg text-center"><p className="text-xs text-yellow-400">TEMPO EM ROTA</p><p className="text-yellow-300 font-mono text-xl">{calcularTempoEmRota(new Date(entrega.dataHoraSaida))}</p></div>}
            {entrega.status === 'Entregue' && entrega.duracaoEntrega && <div className="bg-green-500/10 p-2 rounded-lg text-center"><p className="text-xs text-green-400">DURAÇÃO DA ENTREGA</p><p className="font-bold text-white text-lg">{formatarDuracaoLegivel(entrega.duracaoEntrega)}</p></div>}
            <div className="flex gap-2 pt-3 border-t border-gray-700">
                {entrega.status === 'Aguardando' && <button onClick={() => onAtualizarStatus(entrega.id, 'Em Rota')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg">INICIAR ENTREGA</button>}
                {entrega.status === 'Em Rota' && <button onClick={() => onAtualizarStatus(entrega.id, 'Entregue')} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg">FINALIZAR ENTREGA</button>}
                <button onClick={() => onEditarEntrega(entrega)} className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg">Editar</button>
                <button onClick={() => handleExcluirComConfirmacao(entrega)} className="w-full bg-red-800/80 hover:bg-red-800 text-white py-2 rounded-lg">Excluir</button>
            </div>
        </div>
    );
  };

    const renderVisaoGeral = () => (
      <div className="space-y-4">{entregasACaminho.length > 0 ? entregasACaminho.map(renderEntregaCard) : <p className="text-center text-gray-500 py-10">Nenhuma entrega em andamento.</p>}</div>
    );
    
    // *** ALTERAÇÃO PRINCIPAL AQUI ***
    const renderPorEntregador = () => {
        if (entregadoresAtivos.length === 0) return <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">Nenhuma entrega em andamento.</div>;
        
        const entregadorSelecionado = entregadores.find(e => e.id === entregadorAtivoId);
        const entregasDoEntregadorAtivo = entregasPorEntregador[entregadorAtivoId || 0] || [];

        return (
            <div>
                <div className="mb-4 p-1 bg-gray-900/50 rounded-lg flex flex-wrap gap-1">
                    {entregadoresAtivos.map(e => <button key={e.id} onClick={() => setEntregadorAtivoId(e.id)} className={`flex-1 px-3 py-2 rounded-md font-medium text-sm transition-colors ${entregadorAtivoId === e.id ? 'bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}> {e.nome} ({entregasPorEntregador[e.id].length})</button>)}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Coluna do Mapa */}
                    <div className="lg:sticky lg:top-24 h-[450px] lg:h-auto">
                      <h3 className="text-lg font-semibold mb-3 text-white">Localização em Tempo Real</h3>
                      <MapaRastreio entregador={entregadorSelecionado || null} />
                    </div>

                    {/* Coluna das Entregas */}
                    <div className="space-y-4">
                       <h3 className="text-lg font-semibold text-white">Entregas de {entregadorSelecionado?.nome}</h3>
                       {entregasDoEntregadorAtivo.length > 0 
                         ? entregasDoEntregadorAtivo.map(renderEntregaCard) 
                         : <p className="text-center text-gray-500 py-10">Este entregador não possui entregas ativas.</p>
                       }
                    </div>
                </div>
            </div>
        );
    };

    const renderEntregasFinalizadas = () => (
        <div>
            <div className="mb-4 flex justify-end">
                <select value={entregadorFiltroFinalizadas} onChange={(e) => setEntregadorFiltroFinalizadas(e.target.value ? Number(e.target.value) : '')} className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-white text-sm">
                    <option value="">Filtrar por entregador</option>
                    {entregadores.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
            </div>
            <div className="space-y-4">{entregasFinalizadasFiltradas.length > 0 ? entregasFinalizadasFiltradas.map(renderEntregaCard) : <p className="text-center text-gray-500 py-10">Nenhuma entrega finalizada encontrada.</p>}</div>
        </div>
    );
    
    return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div><h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1><p className="text-gray-400 mt-1">Gerencie suas entregas em tempo real</p></div>
            <button onClick={onNovaEntrega} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 whitespace-nowrap"><Plus size={20} /> Nova Entrega</button>
          </div>
    
          <div className="border-b border-gray-700">
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setModoVisualizacao('geral')} className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${modoVisualizacao === 'geral' ? 'bg-gray-700' : 'bg-transparent text-gray-400 hover:bg-gray-800'}`}><List size={16} className="inline mr-2" />Visão Geral</button>
              <button onClick={() => setModoVisualizacao('por-entregador')} className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${modoVisualizacao === 'por-entregador' ? 'bg-gray-700' : 'bg-transparent text-gray-400 hover:bg-gray-800'}`}><Users size={16} className="inline mr-2" />Por Entregador</button>
              <button onClick={() => setModoVisualizacao('finalizadas')} className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${modoVisualizacao === 'finalizadas' ? 'bg-gray-700' : 'bg-transparent text-gray-400 hover:bg-gray-800'}`}><CheckCircle size={16} className="inline mr-2" />Finalizadas</button>
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-4 rounded-b-lg rounded-r-lg">
            {modoVisualizacao === 'geral' && renderVisaoGeral()}
            {modoVisualizacao === 'por-entregador' && renderPorEntregador()}
            {modoVisualizacao === 'finalizadas' && renderEntregasFinalizadas()}
          </div>
          
          <Modal onClose={closeModal} {...modalState} />
        </div>
    );
};
